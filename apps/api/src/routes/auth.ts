import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '@fusionaura/db';
import { authenticate } from '../middleware/auth';

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

