import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import Stripe from 'stripe';
import { prisma } from '@fusionaura/db';
import { config } from '../config';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';

const stripe = new Stripe(config.stripe.secretKey, {
  apiVersion: '2023-10-16',
});

const createCheckoutSessionSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string().uuid(),
      quantity: z.number().int().positive(),
    })
  ),
  shippingAddress: z
    .object({
      name: z.string().min(1),
      addressLine1: z.string().min(1),
      addressLine2: z.string().optional(),
      city: z.string().min(1),
      province: z.string().optional(),
      postalCode: z.string().min(1),
      country: z.string().default('ZA'),
      phone: z.string().optional(),
    })
    .optional(),
});

export async function paymentRoutes(fastify: FastifyInstance) {
  // Create Stripe Checkout session (authenticated)
  fastify.post(
    '/checkout/create-session',
    { preHandler: authenticate },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = (request as AuthenticatedRequest).user.id;
      const body = createCheckoutSessionSchema.parse(request.body);

      // Get user
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return reply.status(404).send({
          success: false,
          error: 'User not found',
        });
      }

      // Fetch products and validate inventory
      const productIds = body.items.map((item) => item.productId);
      const products = await prisma.product.findMany({
        where: {
          id: { in: productIds },
          deletedAt: null,
          isActive: true,
        },
        include: {
          inventory: true,
        },
      });

      if (products.length !== productIds.length) {
        return reply.status(400).send({
          success: false,
          error: 'One or more products not found',
        });
      }

      // Validate inventory and calculate totals
      let subtotal = 0;
      const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

      for (const item of body.items) {
        const product = products.find((p) => p.id === item.productId);
        if (!product) {
          return reply.status(400).send({
            success: false,
            error: `Product ${item.productId} not found`,
          });
        }

        const availableQuantity = product.inventory?.quantity || 0;
        if (availableQuantity < item.quantity) {
          return reply.status(400).send({
            success: false,
            error: `Insufficient inventory for ${product.name}`,
          });
        }

        const price = Number(product.price);
        subtotal += price * item.quantity;

        lineItems.push({
          price_data: {
            currency: config.stripe.currency,
            product_data: {
              name: product.name,
              description: product.shortDescription || undefined,
              images: product.images.length > 0 ? [product.images[0]] : undefined,
            },
            unit_amount: Math.round(price * 100), // Convert to cents
          },
          quantity: item.quantity,
        });
      }

      // Calculate totals (VAT at 15% for South Africa)
      const tax = subtotal * 0.15;
      const shipping = 0; // Can be calculated based on shipping address
      const total = subtotal + tax + shipping;

      // Create or get Stripe customer
      let stripeCustomerId = user.stripeCustomerId;
      if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : undefined,
          phone: user.phone || undefined,
        });
        stripeCustomerId = customer.id;

        await prisma.user.update({
          where: { id: userId },
          data: { stripeCustomerId },
        });
      }

      // Create order in database (PENDING status)
      const order = await prisma.order.create({
        data: {
          orderNumber: `FUS-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
          userId,
          status: 'PENDING',
          subtotal,
          tax,
          shipping,
          discount: 0,
          total,
          shippingName: body.shippingAddress?.name || user.firstName || user.email,
          shippingAddressLine1: body.shippingAddress?.addressLine1 || user.addressLine1 || '',
          shippingAddressLine2: body.shippingAddress?.addressLine2 || user.addressLine2 || null,
          shippingCity: body.shippingAddress?.city || user.city || '',
          shippingProvince: body.shippingAddress?.province || user.province || null,
          shippingPostalCode: body.shippingAddress?.postalCode || user.postalCode || '',
          shippingCountry: body.shippingAddress?.country || user.country || 'ZA',
          shippingPhone: body.shippingAddress?.phone || user.phone || null,
          items: {
            create: body.items.map((item) => {
              const product = products.find((p) => p.id === item.productId)!;
              const price = Number(product.price);
              return {
                productId: item.productId,
                quantity: item.quantity,
                price,
                total: price * item.quantity,
              };
            }),
          },
        },
      });

      // Create Stripe Checkout session
      const session = await stripe.checkout.sessions.create({
        customer: stripeCustomerId,
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/checkout/cancel`,
        metadata: {
          orderId: order.id,
          userId,
        },
        currency: config.stripe.currency,
        // Add tax and shipping as separate line items if needed
        // For now, we'll include them in the product prices or add as separate line items
      });

      // Update order with Stripe session ID
      await prisma.order.update({
        where: { id: order.id },
        data: { stripeSessionId: session.id },
      });

      return reply.send({
        success: true,
        data: {
          sessionId: session.id,
          url: session.url,
        },
      });
    }
  );
}

