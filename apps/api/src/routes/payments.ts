import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import crypto from 'crypto';
import { prisma } from '@fusionaura/db';
import { requireAuth } from '../middleware/auth';

// PayFast Configuration
const PAYFAST_CONFIG = {
  // Sandbox credentials (replace with live credentials in production)
  merchantId: process.env.PAYFAST_MERCHANT_ID || '10000100',
  merchantKey: process.env.PAYFAST_MERCHANT_KEY || '46f0cd694581a',
  passphrase: process.env.PAYFAST_PASSPHRASE || '', // Optional but recommended
  
  // URLs
  sandbox: process.env.NODE_ENV !== 'production',
  get processUrl() {
    return this.sandbox 
      ? 'https://sandbox.payfast.co.za/eng/process'
      : 'https://www.payfast.co.za/eng/process';
  },
  get validateUrl() {
    return this.sandbox
      ? 'https://sandbox.payfast.co.za/eng/query/validate'
      : 'https://www.payfast.co.za/eng/query/validate';
  }
};

// Generate PayFast signature
function generateSignature(data: Record<string, string>, passphrase?: string): string {
  // Create parameter string
  let pfOutput = '';
  for (const key in data) {
    if (data.hasOwnProperty(key) && data[key] !== '') {
      pfOutput += `${key}=${encodeURIComponent(data[key].trim()).replace(/%20/g, '+')}&`;
    }
  }

  // Remove last ampersand
  let getString = pfOutput.slice(0, -1);
  
  // Add passphrase if provided
  if (passphrase) {
    getString += `&passphrase=${encodeURIComponent(passphrase.trim()).replace(/%20/g, '+')}`;
  }

  // Generate MD5 hash
  return crypto.createHash('md5').update(getString).digest('hex');
}

// Validate PayFast signature from ITN
function validateSignature(pfData: Record<string, string>, pfParamString: string, passphrase?: string): boolean {
  // Generate our signature
  let tempParamString = pfParamString;
  if (passphrase) {
    tempParamString += `&passphrase=${encodeURIComponent(passphrase.trim()).replace(/%20/g, '+')}`;
  }
  
  const signature = crypto.createHash('md5').update(tempParamString).digest('hex');
  return pfData['signature'] === signature;
}

// Validate PayFast server IP
function validateIP(ip: string): boolean {
  const validHosts = [
    'www.payfast.co.za',
    'sandbox.payfast.co.za',
    'w1w.payfast.co.za',
    'w2w.payfast.co.za'
  ];
  
  // In production, you should resolve these hostnames and check against the IP
  // For now, we'll be lenient in sandbox mode
  if (PAYFAST_CONFIG.sandbox) return true;
  
  // Add IP validation logic here for production
  return true;
}

// Verify payment with PayFast server
async function validatePaymentWithServer(pfParamString: string): Promise<boolean> {
  try {
    const response = await fetch(PAYFAST_CONFIG.validateUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: pfParamString,
    });
    
    const result = await response.text();
    return result === 'VALID';
  } catch (error) {
    console.error('PayFast validation error:', error);
    return false;
  }
}

export const paymentRoutes: FastifyPluginAsync = async (fastify) => {
  // ============================================
  // INITIATE PAYMENT - Create payment request
  // ============================================
  fastify.post('/initiate', { preHandler: requireAuth }, async (request, reply) => {
    const schema = z.object({
      orderId: z.string().uuid(),
    });

    const { orderId } = schema.parse(request.body);
    const user = request.user as { id: string; email: string; firstName?: string; lastName?: string };

    // Get order details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { product: true } } },
    });

    if (!order) {
      return reply.status(404).send({ error: 'Order not found' });
    }

    if (order.userId !== user.id) {
      return reply.status(403).send({ error: 'Unauthorized' });
    }

    // Build return URLs
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const apiUrl = process.env.API_URL || 'http://localhost:3001';

    // PayFast payment data
    const paymentData: Record<string, string> = {
      // Merchant details
      merchant_id: PAYFAST_CONFIG.merchantId,
      merchant_key: PAYFAST_CONFIG.merchantKey,
      
      // URLs
      return_url: `${baseUrl}/orders/${orderId}/success`,
      cancel_url: `${baseUrl}/orders/${orderId}/cancelled`,
      notify_url: `${apiUrl}/api/payments/notify`, // ITN callback
      
      // Customer details
      name_first: user.firstName || '',
      name_last: user.lastName || '',
      email_address: user.email,
      
      // Transaction details
      m_payment_id: orderId, // Your internal order ID
      amount: order.total.toFixed(2),
      item_name: `FusionAura Order #${order.orderNumber}`,
      item_description: order.items.map(i => `${i.product.name} x${i.quantity}`).join(', ').substring(0, 255),
      
      // Optional: Custom fields
      custom_str1: order.orderNumber,
    };

    // Generate signature
    paymentData.signature = generateSignature(paymentData, PAYFAST_CONFIG.passphrase);

    // Build the redirect URL with query parameters
    const params = new URLSearchParams(paymentData);
    const redirectUrl = `${PAYFAST_CONFIG.processUrl}?${params.toString()}`;

    // Update order with payment initiation
    await prisma.order.update({
      where: { id: orderId },
      data: {
        stripePaymentIntentId: `payfast_${Date.now()}`, // Reusing field for PayFast reference
      },
    });

    return {
      success: true,
      redirectUrl,
      paymentData, // For debugging/form submission
    };
  });

  // ============================================
  // ITN (Instant Transaction Notification) - Webhook
  // ============================================
  fastify.post('/notify', async (request, reply) => {
    console.log('📬 PayFast ITN received');
    
    try {
      const pfData = request.body as Record<string, string>;
      console.log('ITN Data:', JSON.stringify(pfData, null, 2));

      // Build parameter string (excluding signature)
      const pfParamString = Object.keys(pfData)
        .filter(key => key !== 'signature')
        .map(key => `${key}=${encodeURIComponent(pfData[key].trim()).replace(/%20/g, '+')}`)
        .join('&');

      // 1. Validate signature
      if (!validateSignature(pfData, pfParamString, PAYFAST_CONFIG.passphrase)) {
        console.error('❌ Invalid PayFast signature');
        return reply.status(400).send('Invalid signature');
      }
      console.log('✅ Signature valid');

      // 2. Validate source IP (optional but recommended)
      const clientIP = request.ip;
      if (!validateIP(clientIP)) {
        console.error('❌ Invalid source IP:', clientIP);
        return reply.status(403).send('Invalid source');
      }

      // 3. Validate with PayFast server (recommended for production)
      if (!PAYFAST_CONFIG.sandbox) {
        const isValid = await validatePaymentWithServer(pfParamString);
        if (!isValid) {
          console.error('❌ PayFast server validation failed');
          return reply.status(400).send('Server validation failed');
        }
      }

      // 4. Get order and validate amount
      const orderId = pfData['m_payment_id'];
      const paymentStatus = pfData['payment_status'];
      const amountGross = parseFloat(pfData['amount_gross']);
      const pfPaymentId = pfData['pf_payment_id'];

      const order = await prisma.order.findUnique({
        where: { id: orderId },
      });

      if (!order) {
        console.error('❌ Order not found:', orderId);
        return reply.status(404).send('Order not found');
      }

      // Validate amount matches
      if (Math.abs(order.total.toNumber() - amountGross) > 0.01) {
        console.error('❌ Amount mismatch. Expected:', order.total, 'Got:', amountGross);
        return reply.status(400).send('Amount mismatch');
      }

      // 5. Process based on payment status
      console.log('Payment status:', paymentStatus);

      if (paymentStatus === 'COMPLETE') {
        // Payment successful - update order
        await prisma.order.update({
          where: { id: orderId },
          data: {
            status: 'PENDING', // Ready for admin to process
            stripePaymentIntentId: pfPaymentId, // Store PayFast payment ID
          },
        });
        console.log('✅ Order updated to PENDING (paid)');
      } else if (paymentStatus === 'CANCELLED') {
        await prisma.order.update({
          where: { id: orderId },
          data: {
            status: 'CANCELLED',
          },
        });
        console.log('⚠️ Order cancelled');
      } else if (paymentStatus === 'PENDING') {
        // Payment is pending (e.g., EFT)
        console.log('⏳ Payment pending');
      }

      // Return 200 OK to acknowledge receipt
      return reply.status(200).send('OK');
      
    } catch (error) {
      console.error('❌ ITN processing error:', error);
      return reply.status(500).send('Internal error');
    }
  });

  // ============================================
  // VERIFY PAYMENT - Check payment status
  // ============================================
  fastify.get('/verify/:orderId', { preHandler: requireAuth }, async (request, reply) => {
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
      isPaid: order.status !== 'CANCELLED' && order.stripePaymentIntentId?.startsWith('pf_'),
    };
  });

  // ============================================
  // GET PAYFAST CONFIG (for frontend)
  // ============================================
  fastify.get('/config', async () => {
    return {
      merchantId: PAYFAST_CONFIG.merchantId,
      sandbox: PAYFAST_CONFIG.sandbox,
      processUrl: PAYFAST_CONFIG.processUrl,
    };
  });
};
