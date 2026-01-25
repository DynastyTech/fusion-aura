import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '@fusionaura/db';
import { authenticate } from '../middleware/auth';
import { sendPasswordResetEmail } from '../utils/email';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().optional(),
  // Delivery address (required for registration)
  addressLine1: z.string().min(1),
  addressLine2: z.string().optional(),
  city: z.string().min(1),
  province: z.string().optional(),
  postalCode: z.string().min(1),
  phone: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function authRoutes(fastify: FastifyInstance) {
  // Register
  fastify.post('/register', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = registerSchema.parse(request.body);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: body.email },
    });

    if (existingUser) {
      return reply.status(400).send({
        success: false,
        error: 'User already exists',
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(body.password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: body.email,
        password: hashedPassword,
        firstName: body.firstName,
        lastName: body.lastName,
        phone: body.phone,
        addressLine1: body.addressLine1,
        addressLine2: body.addressLine2,
        city: body.city,
        province: body.province,
        postalCode: body.postalCode,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      },
    });

    // Generate JWT
    const token = fastify.jwt.sign({ id: user.id, email: user.email });

    return reply.status(201).send({
      success: true,
      data: {
        user,
        token,
      },
    });
  });

  // Login
  fastify.post('/login', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = loginSchema.parse(request.body);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: body.email },
    });

    if (!user || user.deletedAt) {
      return reply.status(401).send({
        success: false,
        error: 'Invalid credentials',
      });
    }

    // Verify password
    const isValid = await bcrypt.compare(body.password, user.password);
    if (!isValid) {
      return reply.status(401).send({
        success: false,
        error: 'Invalid credentials',
      });
    }

    // Generate JWT
    const token = fastify.jwt.sign({ id: user.id, email: user.email });

    return reply.send({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
        token,
      },
    });
  });

  // Forgot Password - Request reset link
  fastify.post('/forgot-password', async (request: FastifyRequest, reply: FastifyReply) => {
    const schema = z.object({
      email: z.string().email(),
    });

    try {
      const { email } = schema.parse(request.body);

      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
      });

      // Always return success to prevent email enumeration
      if (!user || user.deletedAt) {
        return reply.send({
          success: true,
          message: 'If an account exists with this email, you will receive a password reset link.',
        });
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

      // Save token to user
      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetToken,
          resetTokenExpiry,
        },
      });

      // Send reset email
      const frontendUrl = process.env.FRONTEND_URL || 'https://www.fusionaura.co.za';
      const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

      await sendPasswordResetEmail({
        email: user.email,
        name: user.firstName || 'Customer',
        resetUrl,
      });

      return reply.send({
        success: true,
        message: 'If an account exists with this email, you will receive a password reset link.',
      });
    } catch (error: any) {
      console.error('Forgot password error:', error);
      
      // Check if it's an email configuration issue
      if (error.message && error.message.includes('Email service not configured')) {
        return reply.status(503).send({
          success: false,
          error: 'Email service is temporarily unavailable. Please contact support or try again later.',
        });
      }
      
      return reply.status(500).send({
        success: false,
        error: 'An error occurred. Please try again.',
      });
    }
  });

  // Reset Password - Use token to set new password
  fastify.post('/reset-password', async (request: FastifyRequest, reply: FastifyReply) => {
    const schema = z.object({
      token: z.string().min(1),
      password: z.string().min(8, 'Password must be at least 8 characters'),
    });

    try {
      const { token, password } = schema.parse(request.body);

      // Find user with valid token
      const user = await prisma.user.findFirst({
        where: {
          resetToken: token,
          resetTokenExpiry: {
            gt: new Date(), // Token not expired
          },
          deletedAt: null,
        },
      });

      if (!user) {
        return reply.status(400).send({
          success: false,
          error: 'Invalid or expired reset token. Please request a new password reset.',
        });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Update password and clear reset token
      await prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          resetToken: null,
          resetTokenExpiry: null,
        },
      });

      return reply.send({
        success: true,
        message: 'Password has been reset successfully. You can now log in with your new password.',
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return reply.status(400).send({
          success: false,
          error: error.errors[0]?.message || 'Invalid input',
        });
      }
      console.error('Reset password error:', error);
      return reply.status(500).send({
        success: false,
        error: 'An error occurred. Please try again.',
      });
    }
  });

  // Get current user
  fastify.get('/me', { preHandler: authenticate }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = (request.user as { id: string }).id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        addressLine1: true,
        addressLine2: true,
        city: true,
        province: true,
        postalCode: true,
        country: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return reply.status(404).send({
        success: false,
        error: 'User not found',
      });
    }

    return reply.send({
      success: true,
      data: user,
    });
  });
}

