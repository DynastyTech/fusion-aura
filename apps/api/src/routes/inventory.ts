import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '@fusionaura/db';
import { requireRole } from '../middleware/auth';

const updateInventorySchema = z.object({
  quantity: z.number().int().nonnegative(),
  lowStockThreshold: z.number().int().nonnegative().optional(),
});

export async function inventoryRoutes(fastify: FastifyInstance) {
  // Get inventory for a product (admin only)
  fastify.get(
    '/product/:productId',
    { preHandler: requireRole('ADMIN') },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const params = request.params as { productId: string };

      const inventory = await prisma.inventory.findUnique({
        where: { productId: params.productId },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      });

      if (!inventory) {
        return reply.status(404).send({
          success: false,
          error: 'Inventory not found',
        });
      }

      return reply.send({
        success: true,
        data: inventory,
      });
    }
  );

  // Update inventory (admin only)
  fastify.patch(
    '/product/:productId',
    { preHandler: requireRole('ADMIN') },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const params = request.params as { productId: string };
      const body = updateInventorySchema.parse(request.body);

      const inventory = await prisma.inventory.update({
        where: { productId: params.productId },
        data: body,
      });

      return reply.send({
        success: true,
        data: inventory,
      });
    }
  );

  // Get low stock items (admin only)
  fastify.get('/low-stock', { preHandler: requireRole('ADMIN') }, async (request: FastifyRequest, reply: FastifyReply) => {
    const inventories = await prisma.inventory.findMany({
      where: {
        quantity: {
          lte: prisma.inventory.fields.lowStockThreshold,
        },
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            isActive: true,
          },
        },
      },
    });

    return reply.send({
      success: true,
      data: inventories,
    });
  });
}

