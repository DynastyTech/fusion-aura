import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { prisma } from '@fusionaura/db';
import { authenticate } from '../middleware/auth';

// iKhokha Configuration
const IKHOKHA_CONFIG = {
  applicationId: process.env.IKHOKHA_APPLICATION_ID || '',
  applicationSecret: process.env.IKHOKHA_APPLICATION_SECRET || '',
  
  // API URLs - based on iKhokha documentation
  get apiUrl() {
    return 'https://api.ikhokha.com/public-api/v1';
  },
};

// Create iKhokha payment link
async function createPaymentLink(data: {
  amount: number;
  currency: string;
  successUrl: string;
  failureUrl: string;
  webhookUrl: string;
  orderId: string;
  orderNumber: string;
  customerEmail?: string;
  customerName?: string;
  customerPhone?: string;
  description?: string;
}): Promise<{ success: boolean; paymentUrl?: string; transactionId?: string; error?: string }> {
  try {
    console.log('📤 Creating iKhokha payment link...');
    console.log('Amount:', data.amount);
    console.log('Order ID:', data.orderId);
    console.log('Webhook URL:', data.webhookUrl);
    
    // Build request body according to iKhokha API documentation
    const requestBody: Record<string, any> = {
      amount: Math.round(data.amount * 100), // Convert to cents (R103.50 = 10350)
      currency: data.currency || 'ZAR',
      description: data.description || `FusionAura Order #${data.orderNumber}`,
      successUrl: data.successUrl,
      failureUrl: data.failureUrl,
      externalId: data.orderId,
    };

    // Add optional fields if provided
    if (data.customerEmail) requestBody.email = data.customerEmail;
    if (data.customerName) requestBody.customerName = data.customerName;
    if (data.customerPhone) requestBody.phone = data.customerPhone;

    console.log('Request body:', JSON.stringify(requestBody, null, 2));
    console.log('API URL:', `${IKHOKHA_CONFIG.apiUrl}/payment-link`);
    console.log('Headers:', {
      'Content-Type': 'application/json',
      'Application-Id': IKHOKHA_CONFIG.applicationId ? '[SET]' : '[MISSING]',
      'Application-Secret': IKHOKHA_CONFIG.applicationSecret ? '[SET]' : '[MISSING]',
    });

    const response = await fetch(`${IKHOKHA_CONFIG.apiUrl}/payment-link`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Application-Id': IKHOKHA_CONFIG.applicationId,
        'Application-Secret': IKHOKHA_CONFIG.applicationSecret,
      },
      body: JSON.stringify(requestBody),
    });

    const responseText = await response.text();
    console.log('iKhokha response status:', response.status);
    console.log('iKhokha response:', responseText);

    if (!response.ok) {
      console.error('❌ iKhokha API error:', responseText);
      return { 
        success: false, 
        error: `iKhokha API error: ${response.status} - ${responseText}` 
      };
    }

    const result = JSON.parse(responseText);
    
    return {
      success: true,
      paymentUrl: result.payUrl || result.paymentUrl || result.url,
      transactionId: result.transactionId || result.id,
    };
  } catch (error: any) {
    console.error('❌ iKhokha payment link creation error:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to create payment link' 
    };
  }
}

export const paymentRoutes: FastifyPluginAsync = async (fastify) => {
  // ============================================
  // INITIATE PAYMENT - Create iKhokha payment request
  // Works for both authenticated users and guests
  // ============================================
  fastify.post('/initiate', async (request, reply) => {
    const schema = z.object({
      orderId: z.string().uuid(),
    });

    const { orderId } = schema.parse(request.body);

    // Check if iKhokha credentials are configured
    if (!IKHOKHA_CONFIG.applicationId || !IKHOKHA_CONFIG.applicationSecret) {
      console.error('❌ iKhokha credentials not configured');
      return reply.status(500).send({ 
        error: 'Payment gateway not configured. Please contact support.' 
      });
    }

    // Get order details (works for both authenticated and guest orders)
    const order = await prisma.order.findUnique({
      where: { id: orderId },
        include: {
        items: { include: { product: true } },
        user: true,
        },
      });

    if (!order) {
      return reply.status(404).send({ error: 'Order not found' });
    }

    // Optional: Verify ownership if user is authenticated
    // Guest orders (no userId) can proceed without authentication
    if (order.userId) {
      // This is a user order - verify authentication
      try {
        const authHeader = request.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return reply.status(401).send({ error: 'Authentication required for this order' });
        }
        const token = authHeader.substring(7);
        const decoded = fastify.jwt.verify(token) as { id: string };
        if (order.userId !== decoded.id) {
          return reply.status(403).send({ error: 'Unauthorized - this order belongs to another user' });
        }
      } catch (error) {
        return reply.status(401).send({ error: 'Invalid or expired authentication token' });
      }
    }
    // Guest orders (order.userId is null) proceed without authentication check

    // Build return URLs
    const baseUrl = process.env.FRONTEND_URL || 'https://www.fusionaura.co.za';
    const apiUrl = process.env.API_URL || 'https://api.fusionaura.co.za';

    // Get customer details from order or user
    const customerEmail = order.user?.email || undefined;
    const customerName = order.user 
      ? `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim() 
      : order.shippingName;
    const customerPhone = order.shippingPhone || undefined;

    // Create iKhokha payment link
    const paymentResult = await createPaymentLink({
      amount: order.total.toNumber(),
      currency: 'ZAR',
      successUrl: `${baseUrl}/orders/${orderId}/success`,
      failureUrl: `${baseUrl}/orders/${orderId}/cancelled`,
      webhookUrl: `${apiUrl}/api/payments/ikhokha/webhook`,
      orderId: orderId,
      orderNumber: order.orderNumber,
      customerEmail,
      customerName,
      customerPhone,
      description: order.items.map(i => `${i.product.name} x${i.quantity}`).join(', ').substring(0, 255),
    });

    if (!paymentResult.success) {
      console.error('❌ Failed to create payment link:', paymentResult.error);
      return reply.status(500).send({ 
        error: 'Failed to initiate payment. Please try again or use Cash on Delivery.',
        details: paymentResult.error
      });
    }

    // Update order with payment initiation
    await prisma.order.update({
      where: { id: orderId },
      data: {
        stripePaymentIntentId: `ikhokha_${paymentResult.transactionId || Date.now()}`,
      },
    });

    console.log('✅ Payment link created:', paymentResult.paymentUrl);

    return {
      success: true,
      redirectUrl: paymentResult.paymentUrl,
      transactionId: paymentResult.transactionId,
    };
  });

  // ============================================
  // WEBHOOK - iKhokha payment notification
  // ============================================
  fastify.post('/ikhokha/webhook', async (request, reply) => {
    console.log('📬 iKhokha webhook received');
    
    try {
      const webhookData = request.body as Record<string, any>;
      console.log('Webhook Data:', JSON.stringify(webhookData, null, 2));

      // iKhokha webhook payload structure (adjust based on actual webhook format)
      const externalId = webhookData.externalId || webhookData.external_id || webhookData.orderId;
      const status = webhookData.status || webhookData.paymentStatus;
      const transactionId = webhookData.transactionId || webhookData.transaction_id || webhookData.id;
      const amount = webhookData.amount;

      if (!externalId) {
        console.error('❌ No external ID in webhook');
        return reply.status(400).send({ error: 'Missing external ID' });
      }

      // Find the order
      const order = await prisma.order.findUnique({
        where: { id: externalId },
      });

      if (!order) {
        console.error('❌ Order not found:', externalId);
        return reply.status(404).send({ error: 'Order not found' });
      }

      // Validate amount if provided (convert from cents)
      if (amount) {
        const expectedAmount = order.total.toNumber() * 100;
        if (Math.abs(expectedAmount - amount) > 100) { // Allow R1 tolerance
          console.error('❌ Amount mismatch. Expected:', expectedAmount, 'Got:', amount);
          return reply.status(400).send({ error: 'Amount mismatch' });
        }
      }

      // Process based on payment status
      console.log('Payment status:', status);

      const successStatuses = ['COMPLETE', 'COMPLETED', 'SUCCESS', 'SUCCESSFUL', 'PAID'];
      const cancelledStatuses = ['CANCELLED', 'CANCELED', 'FAILED', 'DECLINED'];

      if (successStatuses.includes(status?.toUpperCase())) {
        // Payment successful
        await prisma.order.update({
          where: { id: externalId },
        data: {
            status: 'PENDING', // Ready for admin to process
            stripePaymentIntentId: `ikhokha_${transactionId}`,
          },
        });
        console.log('✅ Order updated to PENDING (paid)');
      } else if (cancelledStatuses.includes(status?.toUpperCase())) {
        // Payment failed/cancelled
        await prisma.order.update({
          where: { id: externalId },
          data: {
            status: 'CANCELLED',
        },
      });
        console.log('⚠️ Order cancelled due to payment failure');
      } else {
        console.log('⏳ Payment status pending or unknown:', status);
      }

      // Return 200 OK to acknowledge receipt
      return reply.status(200).send({ success: true, message: 'Webhook processed' });
      
    } catch (error) {
      console.error('❌ Webhook processing error:', error);
      return reply.status(500).send({ error: 'Internal error' });
    }
  });

  // ============================================
  // VERIFY PAYMENT - Check payment status
  // ============================================
  fastify.get('/verify/:orderId', { preHandler: authenticate }, async (request, reply) => {
    const { orderId } = request.params as { orderId: string };
    const user = request.user as { id: string };

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        total: true,
        stripePaymentIntentId: true,
        userId: true,
        },
      });

    if (!order) {
      return reply.status(404).send({ error: 'Order not found' });
    }

    if (order.userId !== user.id) {
      return reply.status(403).send({ error: 'Unauthorized' });
    }

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentId: order.stripePaymentIntentId,
      isPaid: order.status !== 'CANCELLED' && order.stripePaymentIntentId?.startsWith('ikhokha_'),
    };
  });

  // ============================================
  // GET CONFIG (for frontend)
  // ============================================
  fastify.get('/config', async () => {
    return {
      provider: 'ikhokha',
      configured: !!(IKHOKHA_CONFIG.applicationId && IKHOKHA_CONFIG.applicationSecret),
    };
  });

  // ============================================
  // HEALTH CHECK - Verify iKhokha connection
  // ============================================
  fastify.get('/health', async () => {
    const isConfigured = !!(IKHOKHA_CONFIG.applicationId && IKHOKHA_CONFIG.applicationSecret);
    
    return {
      provider: 'ikhokha',
      configured: isConfigured,
      applicationIdSet: !!IKHOKHA_CONFIG.applicationId,
      applicationSecretSet: !!IKHOKHA_CONFIG.applicationSecret,
    };
  });
};
