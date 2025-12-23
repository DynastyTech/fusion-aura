import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '@fusionaura/db';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';

const addToCartSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
});

const updateCartItemSchema = z.object({
  quantity: z.number().int().positive(),
});

export async function cartRoutes(fastify: FastifyInstance) {
  // Get cart (authenticated)
  fastify.get('/', { preHandler: authenticate }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = (request as AuthenticatedRequest).user.id;

    const cartItems = await prisma.cartItem.findMany({
      where: {
        userId,
      },
      include: {
        product: {
          include: {
            inventory: {
              select: {
                quantity: true,
              },
            },
          },
        },
      },
    });

    const items = cartItems.map((item) => ({
      id: item.id,
      product: {
        id: item.product.id,
        name: item.product.name,
        slug: item.product.slug,
        price: item.product.price,
        images: item.product.images,
        availableQuantity: item.product.inventory?.quantity || 0,
      },
      quantity: item.quantity,
      subtotal: Number(item.product.price) * item.quantity,
    }));

    const total = items.reduce((sum, item) => sum + item.subtotal, 0);

    return reply.send({
      success: true,
      data: {
        items,
        total,
        itemCount: items.length,
      },
    });
  });

  // Add to cart (authenticated)
  fastify.post('/', { preHandler: authenticate }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = (request as AuthenticatedRequest).user.id;
    const body = addToCartSchema.parse(request.body);

    // Verify product exists and is available
    const product = await prisma.product.findFirst({
      where: {
        id: body.productId,
        deletedAt: null,
        isActive: true,
      },
      include: {
        inventory: true,
      },
    });

    if (!product) {
      return reply.status(404).send({
        success: false,
        error: 'Product not found',
      });
    }

    const availableQuantity = product.inventory?.quantity || 0;
    if (availableQuantity < body.quantity) {
      return reply.status(400).send({
        success: false,
        error: 'Insufficient inventory',
        message: `Only ${availableQuantity} items available`,
      });
    }

    // Upsert cart item
    const cartItem = await prisma.cartItem.upsert({
      where: {
        userId_productId: {
          userId,
          productId: body.productId,
        },
      },
      update: {
        quantity: {
          increment: body.quantity,
        },
      },
      create: {
        userId,
        productId: body.productId,
        quantity: body.quantity,
      },
      include: {
        product: true,
      },
    });

    return reply.status(201).send({
      success: true,
      data: cartItem,
    });
  });

  // Update cart item (authenticated)
  fastify.patch(
    '/:id',
    { preHandler: authenticate },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = (request as AuthenticatedRequest).user.id;
      const params = request.params as { id: string };
      const body = updateCartItemSchema.parse(request.body);

      const cartItem = await prisma.cartItem.findFirst({
        where: {
          id: params.id,
          userId,
        },
        include: {
          product: {
            include: {
              inventory: true,
            },
          },
        },
      });

      if (!cartItem) {
        return reply.status(404).send({
          success: false,
          error: 'Cart item not found',
        });
      }

      const availableQuantity = cartItem.product.inventory?.quantity || 0;
      if (availableQuantity < body.quantity) {
        return reply.status(400).send({
          success: false,
          error: 'Insufficient inventory',
        });
      }

      const updated = await prisma.cartItem.update({
        where: { id: params.id },
        data: { quantity: body.quantity },
      });

      return reply.send({
        success: true,
        data: updated,
      });
    }
  );

  // Remove from cart (authenticated)
  fastify.delete(
    '/:id',
    { preHandler: authenticate },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = (request as AuthenticatedRequest).user.id;
      const params = request.params as { id: string };

      await prisma.cartItem.deleteMany({
        where: {
          id: params.id,
          userId,
        },
      });

      return reply.send({
        success: true,
        message: 'Item removed from cart',
      });
    }
  );

  // Clear cart (authenticated)
  fastify.delete('/', { preHandler: authenticate }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = (request as AuthenticatedRequest).user.id;

    await prisma.cartItem.deleteMany({
      where: { userId },
    });

    return reply.send({
      success: true,
      message: 'Cart cleared',
    });
  });
}

