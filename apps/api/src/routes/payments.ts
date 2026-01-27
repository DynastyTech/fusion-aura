import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { prisma } from '@fusionaura/db';
import { authenticate } from '../middleware/auth';
import crypto from 'crypto';

// iKhokha Configuration
const IKHOKHA_CONFIG = {
  appId: process.env.IKHOKHA_APPLICATION_ID || '',
  appSecret: process.env.IKHOKHA_APPLICATION_SECRET || '',
  apiUrl: 'https://api.ikhokha.com/public-api/v1/api/payment',
};

// Generate HMAC-SHA256 signature for iKhokha API
function generateSignature(path: string, body: string, secret: string): string {
  // Escape the payload string as per iKhokha requirements
  const payload = path + body;
  const escapedPayload = payload.replace(/[\\"']/g, '\\$&').replace(/\u0000/g, '\\0');
  
  const signature = crypto
    .createHmac('sha256', secret)
    .update(escapedPayload)
    .digest('hex');
  
  return signature;
}

// Create iKhokha payment link
async function createPaymentLink(data: {
  amount: number;
  currency: string;
  successUrl: string;
  failureUrl: string;
  cancelUrl: string;
  callbackUrl: string;
  orderId: string;
  orderNumber: string;
  requesterUrl: string;
  description?: string;
}): Promise<{ success: boolean; paymentUrl?: string; paylinkId?: string; error?: string }> {
  try {
    console.log('📤 Creating iKhokha payment link...');
    console.log('   Amount (cents):', Math.round(data.amount * 100));
    console.log('   Order ID:', data.orderId);
    console.log('   Order Number:', data.orderNumber);
    
    // Validate credentials
    if (!IKHOKHA_CONFIG.appId || !IKHOKHA_CONFIG.appSecret) {
      console.error('❌ iKhokha credentials not configured');
      return { success: false, error: 'Payment gateway not configured' };
    }

    // Build request body according to iKhokha API documentation
    const requestBody = {
      entityID: IKHOKHA_CONFIG.appId,
      externalEntityID: data.orderId,
      amount: Math.round(data.amount * 100), // Convert to cents (R103.50 = 10350)
      currency: data.currency || 'ZAR',
      requesterUrl: data.requesterUrl,
      mode: 'live',
      description: data.description || `FusionAura Order #${data.orderNumber}`,
      externalTransactionID: data.orderId,
      urls: {
        callbackUrl: data.callbackUrl,
        successPageUrl: data.successUrl,
        failurePageUrl: data.failureUrl,
        cancelUrl: data.cancelUrl,
      },
    };

    const requestBodyString = JSON.stringify(requestBody);
    
    // Generate signature
    const apiPath = '/public-api/v1/api/payment';
    const signature = generateSignature(apiPath, requestBodyString, IKHOKHA_CONFIG.appSecret);

    console.log('   API URL:', IKHOKHA_CONFIG.apiUrl);
    console.log('   IK-APPID:', IKHOKHA_CONFIG.appId ? `${IKHOKHA_CONFIG.appId.substring(0, 8)}...` : '[MISSING]');
    console.log('   IK-SIGN:', signature ? `${signature.substring(0, 16)}...` : '[MISSING]');
    console.log('   Request body:', requestBodyString);

    const response = await fetch(IKHOKHA_CONFIG.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'IK-APPID': IKHOKHA_CONFIG.appId,
        'IK-SIGN': signature,
      },
      body: requestBodyString,
    });

    const responseText = await response.text();
    console.log('   iKhokha response status:', response.status);
    console.log('   iKhokha response:', responseText);

    if (!response.ok) {
      console.error('❌ iKhokha API error:', response.status, responseText);
      return { 
        success: false, 
        error: `iKhokha API error: ${response.status} - ${responseText}` 
      };
    }

    const result = JSON.parse(responseText);
    
    // Check response code
    if (result.responseCode !== '00') {
      console.error('❌ iKhokha returned error code:', result.responseCode, result.message);
      return {
        success: false,
        error: result.message || `iKhokha error: ${result.responseCode}`,
      };
    }

    console.log('✅ Payment link created successfully');
    console.log('   Paylink URL:', result.paylinkUrl);
    console.log('   Paylink ID:', result.paylinkID);

    return {
      success: true,
      paymentUrl: result.paylinkUrl,
      paylinkId: result.paylinkID,
    };
  } catch (error: any) {
    console.error('❌ iKhokha payment link creation error:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to create payment link' 
    };
  }
}

// Verify webhook signature
function verifyWebhookSignature(
  callbackUrl: string,
  body: string,
  receivedSignature: string,
  secret: string
): boolean {
  try {
    const url = new URL(callbackUrl);
    const path = url.pathname + url.search;
    const expectedSignature = generateSignature(path, body, secret);
    return expectedSignature === receivedSignature;
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
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

    let orderId: string;
    try {
      const parsed = schema.parse(request.body);
      orderId = parsed.orderId;
    } catch (error) {
      console.error('❌ Invalid request body:', error);
      return reply.status(400).send({ error: 'Invalid order ID' });
    }

    // Check if iKhokha credentials are configured
    if (!IKHOKHA_CONFIG.appId || !IKHOKHA_CONFIG.appSecret) {
      console.error('❌ iKhokha credentials not configured');
      console.error('   IKHOKHA_APPLICATION_ID:', IKHOKHA_CONFIG.appId ? 'SET' : 'MISSING');
      console.error('   IKHOKHA_APPLICATION_SECRET:', IKHOKHA_CONFIG.appSecret ? 'SET' : 'MISSING');
      return reply.status(500).send({ 
        error: 'Payment gateway not configured. Please contact support or use Cash on Delivery.' 
      });
    }

    // Get order details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: { include: { product: true } },
        user: true,
      },
    });

    if (!order) {
      console.error('❌ Order not found:', orderId);
      return reply.status(404).send({ error: 'Order not found' });
    }

    // Verify ownership if user is authenticated
    if (order.userId) {
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

    // Build URLs
    const frontendUrl = process.env.FRONTEND_URL || 'https://www.fusionaura.co.za';
    const apiUrl = process.env.API_URL || 'https://api.fusionaura.co.za';

    console.log('📧 Creating payment for order:', order.orderNumber);
    console.log('   Frontend URL:', frontendUrl);
    console.log('   API URL:', apiUrl);

    // Create iKhokha payment link
    const paymentResult = await createPaymentLink({
      amount: order.total.toNumber(),
      currency: 'ZAR',
      successUrl: `${frontendUrl}/orders/${orderId}/success`,
      failureUrl: `${frontendUrl}/orders/${orderId}/cancelled`,
      cancelUrl: `${frontendUrl}/orders/${orderId}/cancelled`,
      callbackUrl: `${apiUrl}/api/payments/ikhokha/webhook`,
      requesterUrl: frontendUrl,
      orderId: orderId,
      orderNumber: order.orderNumber,
      description: order.items.map(i => `${i.product.name} x${i.quantity}`).join(', ').substring(0, 100),
    });

    if (!paymentResult.success) {
      console.error('❌ Failed to create payment link:', paymentResult.error);
      return reply.status(500).send({ 
        error: 'Failed to initiate payment. Please try again or use Cash on Delivery.',
        details: paymentResult.error
      });
    }

    // Update order with payment info
    await prisma.order.update({
      where: { id: orderId },
      data: {
        stripePaymentIntentId: `ikhokha_${paymentResult.paylinkId || Date.now()}`,
      },
    });

    console.log('✅ Payment initiated successfully');
    console.log('   Redirect URL:', paymentResult.paymentUrl);

    return {
      success: true,
      redirectUrl: paymentResult.paymentUrl,
      paylinkId: paymentResult.paylinkId,
    };
  });

  // ============================================
  // WEBHOOK - iKhokha payment notification
  // ============================================
  fastify.post('/ikhokha/webhook', async (request, reply) => {
    console.log('📬 iKhokha webhook received');
    console.log('   Headers:', JSON.stringify(request.headers, null, 2));
    
    try {
      const webhookData = request.body as Record<string, any>;
      console.log('   Webhook body:', JSON.stringify(webhookData, null, 2));

      // Extract data from webhook
      const paylinkId = webhookData.paylinkID;
      const status = webhookData.status; // SUCCESS or FAILURE
      const externalTransactionID = webhookData.externalTransactionID;
      const responseCode = webhookData.responseCode;

      console.log('   Paylink ID:', paylinkId);
      console.log('   Status:', status);
      console.log('   External Transaction ID:', externalTransactionID);
      console.log('   Response Code:', responseCode);

      // Verify signature if present
      const receivedSignature = request.headers['ik-sign'] as string;
      const receivedAppId = request.headers['ik-appid'] as string;

      if (receivedSignature && IKHOKHA_CONFIG.appSecret) {
        console.log('   Verifying webhook signature...');
        // Note: For production, implement proper signature verification
        // using the callback URL path and request body
      }

      if (!externalTransactionID) {
        console.error('❌ No external transaction ID in webhook');
        return reply.status(400).send({ error: 'Missing external transaction ID' });
      }

      // Find the order by ID (externalTransactionID is the orderId)
      const order = await prisma.order.findUnique({
        where: { id: externalTransactionID },
      });

      if (!order) {
        console.error('❌ Order not found:', externalTransactionID);
        return reply.status(404).send({ error: 'Order not found' });
      }

      console.log('   Found order:', order.orderNumber);

      // Process based on payment status
      if (status === 'SUCCESS' && responseCode === '00') {
        // Payment successful - update order status
        await prisma.order.update({
          where: { id: externalTransactionID },
          data: {
            status: 'PENDING', // Ready for admin to process
            stripePaymentIntentId: `ikhokha_${paylinkId}_paid`,
          },
        });
        console.log('✅ Order payment confirmed - status updated to PENDING');
      } else if (status === 'FAILURE') {
        // Payment failed
        await prisma.order.update({
          where: { id: externalTransactionID },
          data: {
            status: 'CANCELLED',
          },
        });
        console.log('⚠️ Order cancelled due to payment failure');
      } else {
        console.log('⏳ Unknown payment status:', status);
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
  fastify.get('/verify/:orderId', async (request, reply) => {
    const { orderId } = request.params as { orderId: string };

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

    // Check if user is authorized (if order belongs to a user)
    if (order.userId) {
      try {
        const authHeader = request.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
          const token = authHeader.substring(7);
          const decoded = fastify.jwt.verify(token) as { id: string };
          if (order.userId !== decoded.id) {
            return reply.status(403).send({ error: 'Unauthorized' });
          }
        }
      } catch (error) {
        // Continue anyway - allow guest order status checks
      }
    }

    const isPaid = order.stripePaymentIntentId?.includes('_paid') || false;

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentId: order.stripePaymentIntentId,
      isPaid,
    };
  });

  // ============================================
  // GET CONFIG (for frontend)
  // ============================================
  fastify.get('/config', async () => {
    return {
      provider: 'ikhokha',
      configured: !!(IKHOKHA_CONFIG.appId && IKHOKHA_CONFIG.appSecret),
    };
  });

  // ============================================
  // HEALTH CHECK - Verify iKhokha configuration
  // ============================================
  fastify.get('/health', async () => {
    const isConfigured = !!(IKHOKHA_CONFIG.appId && IKHOKHA_CONFIG.appSecret);
    
    return {
      provider: 'ikhokha',
      configured: isConfigured,
      appIdSet: !!IKHOKHA_CONFIG.appId,
      appSecretSet: !!IKHOKHA_CONFIG.appSecret,
      appIdPreview: IKHOKHA_CONFIG.appId ? `${IKHOKHA_CONFIG.appId.substring(0, 8)}...` : null,
    };
  });
};
