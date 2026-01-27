import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma, OrderStatus } from '@fusionaura/db';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { requireRole } from '../middleware/auth';
import { sendOrderEmail, sendOrderConfirmationToCustomer, sendOrderStatusUpdateEmail } from '../utils/email';

const createOrderSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string().uuid(),
      quantity: z.number().int().positive(),
    })
  ),
  paymentMethod: z.enum(['cod', 'ikhokha']).default('cod'), // Payment method determines when admin is notified
  shippingAddress: z.object({
    name: z.string().min(1),
    email: z.string().email().optional(), // Optional for guest orders
    addressLine1: z.string().min(1),
    addressLine2: z.string().optional(),
    city: z.string().min(1),
    province: z.string().optional(),
    postalCode: z.string().min(1),
    country: z.string().default('ZA'),
    phone: z.string().min(1), // Required for guest orders
  }),
});

const updateOrderStatusSchema = z.object({
  status: z.enum(['ACCEPTED', 'DECLINED', 'PENDING_DELIVERY', 'OUT_FOR_DELIVERY', 'COMPLETED', 'CANCELLED']),
});

const updateOrderItemsSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string().uuid(),
      quantity: z.number().int().positive(),
    })
  ),
});

export async function orderRoutes(fastify: FastifyInstance) {
  // Create order (cash on delivery) - can be anonymous or authenticated
  fastify.post(
    '/',
    async (request: FastifyRequest, reply: FastifyReply) => {
      // Validate request body
      let body;
      try {
        body = createOrderSchema.parse(request.body);
      } catch (validationError: any) {
        console.error('❌ Order validation error:', validationError.errors || validationError.message);
        return reply.status(400).send({
          success: false,
          error: 'Invalid order data',
          details: validationError.errors || validationError.message,
        });
      }
      
      // Try to get user from token (optional for guest checkout)
      let userId: string | null = null;
      let user: any = null;
      
      try {
        const authHeader = request.headers.authorization;
        console.log('🔐 Order creation - Authorization header:', authHeader ? 'Present' : 'Missing');
        
        if (authHeader && authHeader.startsWith('Bearer ')) {
          const token = authHeader.substring(7);
          try {
            const decoded = fastify.jwt.verify(token) as { id: string; email: string };
            userId = decoded.id;
            console.log('✅ Order creation - User authenticated:', userId);
            
            user = await prisma.user.findUnique({
              where: { id: userId },
            });
            
            if (!user) {
              console.log('⚠️  Order creation - User not found in database:', userId);
              userId = null;
            }
          } catch (jwtError) {
            console.log('❌ Order creation - JWT verification failed:', jwtError);
            userId = null;
          }
        } else {
          console.log('⚠️  Order creation - No Bearer token, proceeding as guest');
        }
      } catch (error) {
        // Not authenticated - proceed as guest
        console.log('❌ Order creation - Auth error, proceeding as guest:', error);
        userId = null;
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
      const orderItems: Array<{ productId: string; quantity: number; price: number; total: number }> = [];

      for (const item of body.items) {
        const product = products.find((p: any) => p.id === item.productId);
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
        
        // Validate price is a valid number
        if (isNaN(price) || !isFinite(price) || price < 0) {
          console.error(`❌ Invalid price for product ${product.name}: ${product.price}`);
          return reply.status(400).send({
            success: false,
            error: `Invalid price for product ${product.name}`,
          });
        }
        
        subtotal += price * item.quantity;

        orderItems.push({
          productId: item.productId,
          quantity: item.quantity,
          price,
          total: price * item.quantity,
        });
      }

      // Calculate totals (VAT at 15% for South Africa)
      const tax = subtotal * 0.15;
      const shipping = 0;
      const total = subtotal + tax + shipping;
      
      // Validate all totals are valid numbers
      if (isNaN(subtotal) || isNaN(tax) || isNaN(total)) {
        console.error(`❌ Invalid totals calculated: subtotal=${subtotal}, tax=${tax}, total=${total}`);
        return reply.status(400).send({
          success: false,
          error: 'Error calculating order totals',
        });
      }

      // Create order in database (userId is optional for guest orders)
      const orderData: any = {
        orderNumber: `FUS-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
        status: 'PENDING', // Awaiting admin approval
        subtotal,
        tax,
        shipping,
        discount: 0,
        total,
        shippingName: body.shippingAddress.name,
        shippingAddressLine1: body.shippingAddress.addressLine1,
        shippingAddressLine2: body.shippingAddress.addressLine2 || null,
        shippingCity: body.shippingAddress.city,
        shippingProvince: body.shippingAddress.province || null,
        shippingPostalCode: body.shippingAddress.postalCode,
        shippingCountry: body.shippingAddress.country || 'ZA',
        shippingPhone: body.shippingAddress.phone || null,
        items: {
          create: orderItems,
        },
      };

      // Only set userId if user is authenticated
      if (userId) {
        orderData.userId = userId;
        console.log('✅ Order creation - Setting userId:', userId);
      } else {
        console.log('⚠️  Order creation - No userId, creating guest order');
      }

      // Create order in database
      let order;
      console.log('📝 Creating order with data:');
      console.log('   Items:', JSON.stringify(orderItems, null, 2));
      console.log('   User ID:', userId || 'Guest');
      console.log('   Shipping:', body.shippingAddress.name, body.shippingAddress.city);
      console.log('   Total:', total);
      
      try {
        order = await prisma.order.create({
          data: orderData,
          include: {
            items: {
              include: {
                product: true,
              },
            },
          },
        });

        // Log order creation for debugging
        console.log(`✅ Order created successfully: ${order.orderNumber} (ID: ${order.id})`);
        console.log(`   Status: ${order.status}, Total: R${total.toFixed(2)}, Items: ${order.items.length}`);
        console.log(`   UserId: ${order.userId || 'NULL (Guest order)'}`);
      } catch (dbError: any) {
        console.error('❌ Database error creating order:', dbError.message);
        console.error('   Error code:', dbError.code);
        console.error('   Error meta:', JSON.stringify(dbError.meta, null, 2));
        console.error('   Stack trace:', dbError.stack);
        console.error('   Order data being saved:', JSON.stringify(orderData, null, 2));
        return reply.status(500).send({
          success: false,
          error: 'Failed to create order in database',
          details: dbError.message,
          code: dbError.code,
          meta: dbError.meta,
        });
      }

      // Prepare order data for emails
      const orderEmailData = {
        orderNumber: order.orderNumber,
        customerName: user 
          ? (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email)
          : body.shippingAddress.name,
        customerEmail: user?.email || body.shippingAddress.email || body.shippingAddress.phone || 'guest@fusionaura.com',
        items: order.items.map((item: any) => ({
          name: item.product.name,
          quantity: item.quantity,
          price: Number(item.price),
        })),
        subtotal,
        tax,
        total,
        shippingAddress: {
          name: body.shippingAddress.name,
          addressLine1: body.shippingAddress.addressLine1,
          addressLine2: body.shippingAddress.addressLine2,
          city: body.shippingAddress.city,
          province: body.shippingAddress.province,
          postalCode: body.shippingAddress.postalCode,
          phone: body.shippingAddress.phone,
        },
      };

      // Only send admin notification for COD orders immediately
      // For online payments (iKhokha), admin is notified via webhook when payment is confirmed
      if (body.paymentMethod === 'cod') {
        try {
          console.log('📧 COD order - Sending admin notifications for new order...');
          await sendOrderEmail(orderEmailData);
        } catch (error) {
          console.error('Failed to send admin order notification:', error);
          // Continue even if email fails
        }
      } else {
        console.log('💳 Online payment selected - Admin will be notified after payment is confirmed');
      }

      // Send order confirmation to customer ONLY if they are a registered user
      if (userId && user?.email) {
        try {
          console.log('📧 Sending order confirmation to registered customer:', user.email);
          await sendOrderConfirmationToCustomer({
            ...orderEmailData,
            customerEmail: user.email,
            customerName: user.firstName && user.lastName 
              ? `${user.firstName} ${user.lastName}` 
              : user.firstName || 'Valued Customer',
          });
        } catch (error) {
          console.error('Failed to send customer confirmation email:', error);
          // Continue even if email fails
        }
      } else {
        console.log('⚠️  Guest order - no confirmation email sent to customer');
      }

      return reply.status(201).send({
        success: true,
        data: order,
      });
    }
  );

  // Get user's orders (authenticated)
  fastify.get('/', { preHandler: authenticate }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = (request as AuthenticatedRequest).user.id;
    const query = request.query as { page?: string; limit?: string };

    const page = parseInt(query.page || '1', 10);
    const limit = Math.min(parseInt(query.limit || '20', 10), 100);
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { userId },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  images: true,
                },
              },
            },
          },
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.order.count({ where: { userId } }),
    ]);

    console.log(`📋 Found ${orders.length} orders for userId: ${userId} (total: ${total})`);
    if (orders.length > 0) {
      console.log(`   Order IDs: ${orders.map((o: any) => o.id).join(', ')}`);
    }

    return reply.send({
      success: true,
      data: orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  });

  // Get single order (public - by ID or order number, works for guests)
  fastify.get('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const params = request.params as { id: string };
    
    // Try to get user from token (optional)
    let userId: string | null = null;
    let userRole: string | null = null;
    try {
      const authHeader = request.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const decoded = fastify.jwt.verify(token) as { id: string; email: string };
        userId = decoded.id;
        
        // Get user role to check if admin
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { role: true },
        });
        userRole = user?.role || null;
      }
    } catch (error) {
      // Not authenticated - proceed as guest
      userId = null;
      userRole = null;
    }

    // Try to find order by ID or order number
    const whereClause: any = {
      OR: [
        { id: params.id },
        { orderNumber: params.id },
      ],
      deletedAt: null, // Exclude soft-deleted orders
    };

    // If user is authenticated but NOT admin, only show their orders or guest orders
    // Admins can see all orders, guests can see any order (they'll need order number)
    if (userId && userRole !== 'ADMIN') {
      whereClause.AND = [
        {
          OR: [
            { userId },
            { userId: null }, // Guest orders visible to anyone with order number
          ],
        },
      ];
    }
    // If admin or guest, no additional restrictions - can see any order

    const order = await prisma.order.findFirst({
      where: whereClause,
      include: {
        items: {
          include: {
            product: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!order) {
      return reply.status(404).send({
        success: false,
        error: 'Order not found',
      });
    }

    return reply.send({
      success: true,
      data: order,
    });
  });

  // Get all orders (admin only)
  fastify.get(
    '/admin/all',
    { preHandler: requireRole('ADMIN') },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const query = request.query as { page?: string; limit?: string; status?: string; search?: string };

      const page = parseInt(query.page || '1', 10);
      const limit = Math.min(parseInt(query.limit || '20', 10), 100);
      const skip = (page - 1) * limit;

      const where: any = {
        deletedAt: null, // Exclude soft-deleted orders by default
      };
      if (query.status) {
        where.status = query.status;
      }

      // Search by order number, customer name, or email
      if (query.search) {
        where.OR = [
          { orderNumber: { contains: query.search, mode: 'insensitive' } },
          { shippingName: { contains: query.search, mode: 'insensitive' } },
          { shippingPhone: { contains: query.search, mode: 'insensitive' } },
          { user: { email: { contains: query.search, mode: 'insensitive' } } },
          { user: { firstName: { contains: query.search, mode: 'insensitive' } } },
          { user: { lastName: { contains: query.search, mode: 'insensitive' } } },
        ];
      }

      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
              },
            },
            items: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
          skip,
          take: limit,
          orderBy: {
            createdAt: 'desc',
          },
        }),
        prisma.order.count({ where }),
      ]);

      console.log(`✅ Admin orders query - Found ${orders.length} orders (total: ${total})`);
      if (orders.length > 0) {
        console.log(`   Order numbers: ${orders.map((o: any) => o.orderNumber).join(', ')}`);
      }

      return reply.send({
        success: true,
        data: orders,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    }
  );

  // Update order status (admin only)
  fastify.patch(
    '/:id/status',
    { preHandler: requireRole('ADMIN') },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const params = request.params as { id: string };
      const body = updateOrderStatusSchema.parse(request.body);

      const order = await prisma.order.findUnique({
        where: { id: params.id },
        include: {
          items: {
            include: {
              product: {
                include: {
                  inventory: true,
                },
              },
            },
          },
        },
      });

      if (!order) {
        return reply.status(404).send({
          success: false,
          error: 'Order not found',
        });
      }

      // If accepting order, reserve inventory
      if (body.status === 'ACCEPTED' && order.status === 'PENDING') {
        // Reserve inventory (decrement available quantity and increment reserved)
        for (const item of order.items) {
          if (item.product.inventory) {
            await prisma.inventory.update({
              where: { productId: item.productId },
              data: {
                quantity: {
                  decrement: item.quantity,
                },
                reserved: {
                  increment: item.quantity,
                },
              },
            });
          }
        }
      }

      // If declining, release any reserved inventory back to available stock
      if (body.status === OrderStatus.DECLINED && order.status === OrderStatus.ACCEPTED) {
        for (const item of order.items) {
          if (item.product.inventory) {
            await prisma.inventory.update({
              where: { productId: item.productId },
              data: {
                quantity: {
                  increment: item.quantity,
                },
                reserved: {
                  decrement: item.quantity,
                },
              },
            });
          }
        }
      }

      // If completing order, permanently remove reserved inventory (items are sold and delivered)
      if (body.status === OrderStatus.COMPLETED && order.status !== OrderStatus.COMPLETED) {
        for (const item of order.items) {
          if (item.product.inventory) {
            // Only decrement reserved (quantity was already decremented when order was ACCEPTED)
            // This permanently removes the items from inventory as they've been delivered
            await prisma.inventory.update({
              where: { productId: item.productId },
              data: {
                reserved: {
                  decrement: item.quantity,
                },
              },
            });
          }
        }
      }

      // If cancelling an accepted order, release reserved inventory back to available stock
      if (body.status === OrderStatus.CANCELLED && order.status === OrderStatus.ACCEPTED) {
        for (const item of order.items) {
          if (item.product.inventory) {
            await prisma.inventory.update({
              where: { productId: item.productId },
              data: {
                quantity: {
                  increment: item.quantity,
                },
                reserved: {
                  decrement: item.quantity,
                },
              },
            });
          }
        }
      }

      const updatedOrder = await prisma.order.update({
        where: { id: params.id },
        data: { status: body.status as OrderStatus },
        include: {
          user: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      // Send notification to customer
      try {
        const customerEmail = updatedOrder.user?.email || undefined;
        const customerPhone = updatedOrder.shippingPhone || undefined;
        const customerName = updatedOrder.user
          ? (updatedOrder.user.firstName && updatedOrder.user.lastName
              ? `${updatedOrder.user.firstName} ${updatedOrder.user.lastName}`
              : updatedOrder.user.email)
          : updatedOrder.shippingName || 'Customer';

        if (customerEmail || customerPhone) {
          await sendOrderStatusUpdateEmail({
            orderNumber: updatedOrder.orderNumber,
            customerName,
            customerEmail,
            customerPhone,
            status: updatedOrder.status,
            items: updatedOrder.items.map((item: any) => ({
              name: item.product.name,
              quantity: item.quantity,
              price: Number(item.price),
            })),
            total: Number(updatedOrder.total),
          });
        }
      } catch (error) {
        console.error('Failed to send customer notification:', error);
        // Don't fail the request if notification fails
      }

      return reply.send({
        success: true,
        data: updatedOrder,
      });
    }
  );

  // Delete/Archive order (admin only) - soft delete
  fastify.delete(
    '/:id',
    { preHandler: requireRole('ADMIN') },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const params = request.params as { id: string };

      const order = await prisma.order.findUnique({
        where: { id: params.id },
        include: {
          items: {
            include: {
              product: {
                include: {
                  inventory: true,
                },
              },
            },
          },
        },
      });

      if (!order) {
        return reply.status(404).send({ success: false, error: 'Order not found' });
      }

      // Only allow deletion of completed, declined, or cancelled orders
      const deletableStatuses: OrderStatus[] = [OrderStatus.COMPLETED, OrderStatus.DECLINED, OrderStatus.CANCELLED];
      if (!deletableStatuses.includes(order.status)) {
        return reply.status(400).send({
          success: false,
          error: 'Only completed, declined, or cancelled orders can be deleted',
        });
      }

      // Soft delete by setting deletedAt
      await prisma.order.update({
        where: { id: params.id },
        data: { deletedAt: new Date() } as any,
      });

      return reply.send({
        success: true,
        message: 'Order archived successfully',
      });
    }
  );

  // Update order items (admin only) - for active orders only
  fastify.patch(
    '/:id/items',
    { preHandler: requireRole('ADMIN') },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const params = request.params as { id: string };
      const body = updateOrderItemsSchema.parse(request.body);

      const order = await prisma.order.findUnique({
        where: { id: params.id },
        include: {
          items: {
            include: {
              product: {
                include: {
                  inventory: true,
                },
              },
            },
          },
        },
      });

      if (!order) {
        return reply.status(404).send({ success: false, error: 'Order not found' });
      }

      // Only allow editing of orders that are not completed, declined, or cancelled
      const nonEditableStatuses: OrderStatus[] = [OrderStatus.COMPLETED, OrderStatus.DECLINED, OrderStatus.CANCELLED];
      if (nonEditableStatuses.includes(order.status)) {
        return reply.status(400).send({
          success: false,
          error: 'Cannot edit completed, declined, or cancelled orders',
        });
      }

      // Validate products and inventory
      const productIds = body.items.map((item) => item.productId);
      const products = await prisma.product.findMany({
        where: {
          id: { in: productIds },
          deletedAt: null,
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

      // Check inventory availability
      for (const item of body.items) {
        const product = products.find((p: any) => p.id === item.productId);
        if (!product || !product.inventory) {
          return reply.status(400).send({
            success: false,
            error: `Product ${product?.name || item.productId} has no inventory`,
          });
        }

        // Calculate current reserved quantity (excluding this order's items)
        const currentReserved = product.inventory.reserved;
        const orderItemQuantity = order.items.find((oi: any) => oi.productId === item.productId)?.quantity || 0;
        const availableReserved = currentReserved - orderItemQuantity;
        const availableQuantity = product.inventory.quantity + availableReserved;

        if (item.quantity > availableQuantity) {
          return reply.status(400).send({
            success: false,
            error: `Insufficient inventory for ${product.name}. Available: ${availableQuantity}, Requested: ${item.quantity}`,
          });
        }
      }

      // Calculate new totals
      let subtotal = 0;
      const orderItems = [];

      for (const item of body.items) {
        const product = products.find((p: any) => p.id === item.productId)!;
        const itemPrice = Number(product.price);
        const itemTotal = itemPrice * item.quantity;
        subtotal += itemTotal;

        orderItems.push({
          productId: item.productId,
          quantity: item.quantity,
          price: itemPrice,
          total: itemTotal,
        });
      }

      const tax = subtotal * 0.15; // 15% VAT
      const shipping = order.shipping; // Keep original shipping
      const total = subtotal + tax + Number(shipping);

      // Update inventory - release old items, reserve new items
      for (const oldItem of order.items) {
        if (oldItem.product.inventory) {
          await prisma.inventory.update({
            where: { productId: oldItem.productId },
            data: {
              quantity: {
                increment: oldItem.quantity,
              },
              reserved: {
                decrement: oldItem.quantity,
              },
            },
          });
        }
      }

      // Reserve new items
      for (const item of body.items) {
        const product = products.find((p: any) => p.id === item.productId)!;
        if (product.inventory) {
          await prisma.inventory.update({
            where: { productId: item.productId },
            data: {
              quantity: {
                decrement: item.quantity,
              },
              reserved: {
                increment: item.quantity,
              },
            },
          });
        }
      }

      // Delete old order items
      await prisma.orderItem.deleteMany({
        where: { orderId: params.id },
      });

      // Create new order items
      await prisma.orderItem.createMany({
        data: orderItems.map((item) => ({
          orderId: params.id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          total: item.total,
        })),
      });

      // Update order totals
      const updatedOrder = await prisma.order.update({
        where: { id: params.id },
        data: {
          subtotal,
          tax,
          total,
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          user: true,
        },
      });

      return reply.send({
        success: true,
        data: updatedOrder,
      });
    }
  );
}
