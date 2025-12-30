import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { prisma } from '@fusionaura/db';
import { authenticate } from '../middleware/auth';

export const wishlistRoutes: FastifyPluginAsync = async (fastify) => {
  // ============================================
  // GET WISHLIST - Get all wishlist items for user
  // ============================================
  fastify.get('/', { preHandler: authenticate }, async (request) => {
    const user = request.user as { id: string };

    const wishlistItems = await prisma.wishlistItem.findMany({
      where: { userId: user.id },
      include: {
        product: {
          include: {
            category: {
              select: { id: true, name: true, slug: true },
            },
            inventory: {
              select: { quantity: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      items: wishlistItems.map((item) => ({
        id: item.id,
        productId: item.productId,
        product: {
          id: item.product.id,
          name: item.product.name,
          slug: item.product.slug,
          price: item.product.price,
          compareAtPrice: item.product.compareAtPrice,
          images: item.product.images,
          category: item.product.category,
          inventory: item.product.inventory,
          isActive: item.product.isActive,
        },
        addedAt: item.createdAt,
      })),
      count: wishlistItems.length,
    };
  });

  // ============================================
  // ADD TO WISHLIST
  // ============================================
  fastify.post('/add', { preHandler: authenticate }, async (request, reply) => {
    const schema = z.object({
      productId: z.string().uuid(),
    });

    const { productId } = schema.parse(request.body);
    const user = request.user as { id: string };

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return reply.status(404).send({
        success: false,
        error: 'Product not found',
      });
    }

    // Check if already in wishlist
    const existing = await prisma.wishlistItem.findUnique({
      where: {
        userId_productId: {
          userId: user.id,
          productId,
        },
      },
    });

    if (existing) {
      return {
        success: true,
        message: 'Product already in wishlist',
        item: existing,
      };
    }

    // Add to wishlist
    const wishlistItem = await prisma.wishlistItem.create({
      data: {
        userId: user.id,
        productId,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            images: true,
          },
        },
      },
    });

    return {
      success: true,
      message: 'Added to wishlist',
      item: wishlistItem,
    };
  });

  // ============================================
  // REMOVE FROM WISHLIST
  // ============================================
  fastify.delete('/remove/:productId', { preHandler: authenticate }, async (request, reply) => {
    const { productId } = request.params as { productId: string };
    const user = request.user as { id: string };

    // Find and delete
    const existing = await prisma.wishlistItem.findUnique({
      where: {
        userId_productId: {
          userId: user.id,
          productId,
        },
      },
    });

    if (!existing) {
      return reply.status(404).send({
        success: false,
        error: 'Item not in wishlist',
      });
    }

    await prisma.wishlistItem.delete({
      where: { id: existing.id },
    });

    return {
      success: true,
      message: 'Removed from wishlist',
    };
  });

  // ============================================
  // TOGGLE WISHLIST - Add if not exists, remove if exists
  // ============================================
  fastify.post('/toggle', { preHandler: authenticate }, async (request, reply) => {
    const schema = z.object({
      productId: z.string().uuid(),
    });

    const { productId } = schema.parse(request.body);
    const user = request.user as { id: string };

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return reply.status(404).send({
        success: false,
        error: 'Product not found',
      });
    }

    // Check if in wishlist
    const existing = await prisma.wishlistItem.findUnique({
      where: {
        userId_productId: {
          userId: user.id,
          productId,
        },
      },
    });

    if (existing) {
      // Remove from wishlist
      await prisma.wishlistItem.delete({
        where: { id: existing.id },
      });

      return {
        success: true,
        action: 'removed',
        message: 'Removed from wishlist',
        inWishlist: false,
      };
    } else {
      // Add to wishlist
      await prisma.wishlistItem.create({
        data: {
          userId: user.id,
          productId,
        },
      });

      return {
        success: true,
        action: 'added',
        message: 'Added to wishlist',
        inWishlist: true,
      };
    }
  });

  // ============================================
  // CHECK IF IN WISHLIST
  // ============================================
  fastify.get('/check/:productId', { preHandler: authenticate }, async (request) => {
    const { productId } = request.params as { productId: string };
    const user = request.user as { id: string };

    const existing = await prisma.wishlistItem.findUnique({
      where: {
        userId_productId: {
          userId: user.id,
          productId,
        },
      },
    });

    return {
      success: true,
      inWishlist: !!existing,
    };
  });

  // ============================================
  // CLEAR WISHLIST
  // ============================================
  fastify.delete('/clear', { preHandler: authenticate }, async (request) => {
    const user = request.user as { id: string };

    const result = await prisma.wishlistItem.deleteMany({
      where: { userId: user.id },
    });

    return {
      success: true,
      message: 'Wishlist cleared',
      deletedCount: result.count,
    };
  });

  // ============================================
  // MOVE TO CART - Move item from wishlist to cart
  // ============================================
  fastify.post('/move-to-cart', { preHandler: authenticate }, async (request, reply) => {
    const schema = z.object({
      productId: z.string().uuid(),
      quantity: z.number().int().positive().default(1),
    });

    const { productId, quantity } = schema.parse(request.body);
    const user = request.user as { id: string };

    // Check if in wishlist
    const wishlistItem = await prisma.wishlistItem.findUnique({
      where: {
        userId_productId: {
          userId: user.id,
          productId,
        },
      },
      include: {
        product: {
          include: {
            inventory: true,
          },
        },
      },
    });

    if (!wishlistItem) {
      return reply.status(404).send({
        success: false,
        error: 'Item not in wishlist',
      });
    }

    // Check stock
    if (!wishlistItem.product.inventory || wishlistItem.product.inventory.quantity < quantity) {
      return reply.status(400).send({
        success: false,
        error: 'Insufficient stock',
      });
    }

    // Add to cart (upsert)
    await prisma.cartItem.upsert({
      where: {
        userId_productId: {
          userId: user.id,
          productId,
        },
      },
      update: {
        quantity: { increment: quantity },
      },
      create: {
        userId: user.id,
        productId,
        quantity,
      },
    });

    // Remove from wishlist
    await prisma.wishlistItem.delete({
      where: { id: wishlistItem.id },
    });

    return {
      success: true,
      message: 'Moved to cart',
    };
  });
};

