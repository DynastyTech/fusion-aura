import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '@fusionaura/db';
import { requireRole } from '../middleware/auth';
import { searchProducts, indexProduct, deleteProductFromIndex } from '../utils/meilisearch';

const createProductSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  shortDescription: z.string(anal).optional(),
  price: z.number().positive(),
  compareAtPrice: z.number().positive().optional(),
  images: z.array(z.string().url()).default([]),
  categoryId: z.string().uuid(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  initialQuantity: z.number().int().nonnegative().default(0),
});

const updateProductSchema = createProductSchema.partial();

export async function productRoutes(fastify: FastifyInstance) {
  // Get all products (public)
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const query = request.query as {
      page?: string;
      limit?: string;
      categoryId?: string;
      isFeatured?: string;
      search?: string;
    };

    const page = parseInt(query.page || '1', 10);
    const limit = Math.min(parseInt(query.limit || '20', 10), 100);
    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null,
      isActive: true,
    };

    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }

    if (query.isFeatured === 'true') {
      where.isFeatured = true;
    }

    // Use Meilisearch if search query is provided
    if (query.search) {
      const searchResult = await searchProducts(
        query.search,
        {
          categoryId: query.categoryId,
          isFeatured: query.isFeatured === 'true' ? true : undefined,
        },
        {
          limit,
          offset: skip,
        }
      );

      if (searchResult) {
        // Get full product details from database
        const productIds = searchResult.hits.map((hit: any) => hit.id);
        const products = await prisma.product.findMany({
          where: {
            id: { in: productIds },
            deletedAt: null,
            isActive: true,
          },
          include: {
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
            inventory: {
              select: {
                quantity: true,
              },
            },
          },
        });

        // Maintain search result order
        const orderedProducts = productIds
          .map((id: string) => products.find((p: any) => p.id === id))
          .filter((p: any) => p !== undefined);

        return reply.send({
          success: true,
          data: orderedProducts,
          pagination: {
            page,
            limit,
            total: searchResult.estimatedTotalHits || 0,
            totalPages: Math.ceil((searchResult.estimatedTotalHits || 0) / limit),
          },
        });
      }
      // Fallback to Prisma search if Meilisearch fails
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          inventory: {
            select: {
              quantity: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.product.count({ where }),
    ]);

    return reply.send({
      success: true,
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  });

  // Get single product (public)
  fastify.get('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const params = request.params as { id: string };

    const product = await prisma.product.findFirst({
      where: {
        OR: [{ id: params.id }, { slug: params.id }],
        deletedAt: null,
      },
      include: {
        category: true,
        inventory: true,
      },
    });

    if (!product) {
      return reply.status(404).send({
        success: false,
        error: 'Product not found',
      });
    }

    return reply.send({
      success: true,
      data: product,
    });
  });

  // Create product (admin only)
  fastify.post(
    '/',
    { preHandler: requireRole('ADMIN') },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const body = createProductSchema.parse(request.body);

      // Check if slug exists
      const existing = await prisma.product.findUnique({
        where: { slug: body.slug },
      });

      if (existing) {
        return reply.status(400).send({
          success: false,
          error: 'Product slug already exists',
        });
      }

      // Create product with inventory in transaction
      const result = await prisma.$transaction(async (tx: any) => {
        const product = await tx.product.create({
          data: {
            name: body.name,
            slug: body.slug,
            description: body.description,
            shortDescription: body.shortDescription,
            price: body.price,
            compareAtPrice: body.compareAtPrice,
            images: body.images,
            categoryId: body.categoryId,
            metaTitle: body.metaTitle,
            metaDescription: body.metaDescription,
            isActive: body.isActive,
            isFeatured: body.isFeatured,
          },
          include: {
            category: true,
          },
        });

        await tx.inventory.create({
          data: {
            productId: product.id,
            quantity: body.initialQuantity,
          },
        });

        // Index in Meilisearch
        await indexProduct(product);

        return product;
      });

      return reply.status(201).send({
        success: true,
        data: result,
      });
    }
  );

  // Update product (admin only)
  fastify.patch(
    '/:id',
    { preHandler: requireRole('ADMIN') },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const params = request.params as { id: string };
      const body = updateProductSchema.parse(request.body);

      const product = await prisma.product.update({
        where: { id: params.id },
        data: body,
        include: {
          category: true,
        },
      });

      // Update in Meilisearch
      await indexProduct(product);

      return reply.send({
        success: true,
        data: product,
      });
    }
  );

  // Delete product (admin only - soft delete)
  fastify.delete(
    '/:id',
    { preHandler: requireRole('ADMIN') },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const params = request.params as { id: string };

      // Get the product first to access its slug
      const product = await prisma.product.findUnique({
        where: { id: params.id },
      });

      if (!product) {
        return reply.status(404).send({
          success: false,
          error: 'Product not found',
        });
      }

      // Append timestamp to slug to free it up for reuse
      // Format: original-slug-deleted-{timestamp}
      const deletedSlug = `${product.slug}-deleted-${Date.now()}`;

      await prisma.product.update({
        where: { id: params.id },
        data: {
          deletedAt: new Date(),
          slug: deletedSlug, // Update slug so it can be reused
        },
      });

      // Remove from Meilisearch
      await deleteProductFromIndex(params.id);

      return reply.send({
        success: true,
        message: 'Product deleted',
      });
    }
  );
}

