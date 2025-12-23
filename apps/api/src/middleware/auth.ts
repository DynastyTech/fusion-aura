import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '@fusionaura/db';

export interface AuthenticatedRequest extends FastifyRequest {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    await request.jwtVerify();
    const userId = (request.user as { id: string }).id;

    // Verify user still exists and is not deleted
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        deletedAt: null,
      },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    if (!user) {
      return reply.status(401).send({
        success: false,
        error: 'User not found',
      });
    }

    (request as AuthenticatedRequest).user = user;
  } catch (err) {
    return reply.status(401).send({
      success: false,
      error: 'Unauthorized',
    });
  }
}

export function requireRole(...roles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    await authenticate(request, reply);

    const user = (request as AuthenticatedRequest).user;
    
    // Log for debugging
    console.log(`🔐 Role check - User: ${user.email}, Role: ${user.role}, Required: ${roles.join(', ')}`);
    
    if (!roles.includes(user.role)) {
      console.log(`❌ Access denied - User ${user.email} (${user.role}) tried to access ${request.method} ${request.url}`);
      return reply.status(403).send({
        success: false,
        error: 'Forbidden',
        message: `Insufficient permissions. Required role: ${roles.join(' or ')}, but user has: ${user.role}`,
      });
    }
    
    console.log(`✅ Access granted - User ${user.email} (${user.role}) accessing ${request.method} ${request.url}`);
  };
}

