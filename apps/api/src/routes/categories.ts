import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '@fusionaura/db';
import { requireRole } from '../middleware/auth';

const createCategorySchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  image: z.string().url().optional(),
  parentId: z.string().uuid().optional(),
});

export async function categoryRoutes(fastify: FastifyInstance) {
  // Get all categories (public)
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const categories = await prisma.category.findMany({
      where: {
        deletedAt: null,
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        children: {
          where: {
            deletedAt: null,
          },
        },
        _count: {
          select: {
            products: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return reply.send({
      success: true,
      data: categories,
    });
  });

  // Get single category (public)
  fastify.get('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const params = request.params as { id: string };

    const category = await prisma.category.findFirst({
      where: {
        OR: [{ id: params.id }, { slug: params.id }],
        deletedAt: null,
      },
      include: {
        parent: true,
        children: {
          where: {
            deletedAt: null,
          },
        },
      },
    });

    if (!category) {
      return reply.status(404).send({
        success: false,
        error: 'Category not found',
      });
    }

    return reply.send({
      success: true,
      data: category,
    });
  });

  // Create category (admin only)
  fastify.post(
    '/',
    { preHandler: requireRole('ADMIN') },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const body = createCategorySchema.parse(request.body);

      // Check if slug exists
      const existing = await prisma.category.findUnique({
        where: { slug: body.slug },
      });

      if (existing) {
        return reply.status(400).send({
          success: false,
          error: 'Category slug already exists',
        });
      }

      const category = await prisma.category.create({
        data: body,
      });

      return reply.status(201).send({
        success: true,
        data: category,
      });
    }
  );

  // Update category (admin only)
  fastify.patch(
    '/:id',
    { preHandler: requireRole('ADMIN') },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const params = request.params as { id: string };
      const body = createCategorySchema.partial().parse(request.body);

      const category = await prisma.category.update({
        where: { id: params.id },
        data: body,
      });

      return reply.send({
        success: true,
        data: category,
      });
    }
  );

  // Delete category (admin only - soft delete)
  fastify.delete(
    '/:id',
    { preHandler: requireRole('ADMIN') },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const params = request.params as { id: string };

      await prisma.category.update({
        where: { id: params.id },
        data: { deletedAt: new Date() },
      });

      return reply.send({
        success: true,
        message: 'Category deleted',
      });
    }
  );
}

