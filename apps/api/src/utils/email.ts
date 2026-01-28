import { Resend } from 'resend';

// Initialize Resend client if API key is available
let resend: Resend | null = null;

if (process.env.RESEND_API_KEY) {
  resend = new Resend(process.env.RESEND_API_KEY);
  console.log('✅ Resend email service initialized');
} else {
  console.warn('⚠️  RESEND_API_KEY not configured - email functionality disabled');
  console.warn('   Get a free API key at https://resend.com');
}

// Email sender - use verified domain or Resend's default for testing
const getFromEmail = () => {
  // If you have a verified domain, use it
  if (process.env.EMAIL_FROM) {
    return process.env.EMAIL_FROM;
  }
  // Resend's default sender for testing (works without domain verification)
  return 'FusionAura <onboarding@resend.dev>';
};

// Password Reset Email
export interface PasswordResetEmailData {
  email: string;
  name: string;
  resetUrl: string;
}

export async function sendPasswordResetEmail(data: PasswordResetEmailData): Promise<void> {
  if (!resend) {
    console.log('⚠️  Email service not configured. Password reset email would be sent to:', data.email);
    console.log('Reset URL:', data.resetUrl);
    throw new Error('Email service not configured. Please contact support.');
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #7ab356, #569330); color: white; padding: 30px 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: linear-gradient(135deg, #7ab356, #569330); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
          .button:hover { opacity: 0.9; }
          .warning { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 8px; margin: 20px 0; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Password Reset</h1>
          </div>
          <div class="content">
            <p>Hi ${data.name},</p>
            <p>We received a request to reset your password for your FusionAura account.</p>
            
            <p style="text-align: center;">
              <a href="${data.resetUrl}" class="button">Reset My Password</a>
            </p>

            <div class="warning">
              <p><strong>⏰ This link expires in 1 hour.</strong></p>
              <p>If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.</p>
            </div>

            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #e9ecef; padding: 10px; border-radius: 5px; font-size: 12px;">
              ${data.resetUrl}
            </p>

            <div class="footer">
              <p>This email was sent by FusionAura</p>
              <p>If you have any questions, contact us at support@fusionaura.co.za</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    console.log('📧 Sending password reset email via Resend to:', data.email);
    
    const result = await resend.emails.send({
      from: getFromEmail(),
      to: data.email,
      subject: 'Reset Your Password - FusionAura',
      html,
    });

    if (result.error) {
      console.error('❌ Resend API error:', result.error);
      throw new Error(`Failed to send email: ${result.error.message}`);
    }

    console.log(`✅ Password reset email sent to ${data.email}`, result.data?.id);
  } catch (error: any) {
    console.error('❌ Error sending password reset email:', error.message);
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

export interface OrderEmailData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  shippingAddress: {
    name: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    province?: string;
    postalCode: string;
    phone?: string;
  };
}

// Admin emails to notify on new orders
const ADMIN_EMAILS = ['lraseemela@gmail.com', 'fusionauraza@gmail.com'];

// Send notification to admins when a new order is placed
export async function sendOrderEmail(orderData: OrderEmailData): Promise<void> {
  if (!resend) {
    console.log('⚠️  Email not configured. Order email would be sent to:', ADMIN_EMAILS.join(', '));
    console.log('Order details:', JSON.stringify(orderData, null, 2));
    return;
  }

  const itemsHtml = orderData.items
    .map(
      (item) => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">R${item.price.toFixed(2)}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">R${(item.price * item.quantity).toFixed(2)}</td>
    </tr>
  `
    )
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #7ab356, #569330); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 10px 10px; }
          .order-details { background: white; padding: 20px; margin: 20px 0; border-radius: 5px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th { background: #f0f0f0; padding: 10px; text-align: left; }
          .total { font-size: 18px; font-weight: bold; color: #569330; }
          .address { background: #f0f0f0; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .urgent { background: #fee2e2; border: 1px solid #ef4444; padding: 15px; border-radius: 8px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🛒 New Order Received</h1>
          </div>
          <div class="content">
            <div class="urgent">
              <p><strong>⚡ Action Required:</strong> A new order has been placed and requires your attention.</p>
            </div>

            <h2>Order #${orderData.orderNumber}</h2>
            
            <div class="order-details">
              <h3>Customer Information</h3>
              <p><strong>Name:</strong> ${orderData.customerName}</p>
              <p><strong>Email:</strong> ${orderData.customerEmail}</p>
              ${orderData.shippingAddress.phone ? `<p><strong>Phone:</strong> ${orderData.shippingAddress.phone}</p>` : ''}
            </div>

            <div class="order-details">
              <h3>Order Items</h3>
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th style="text-align: center;">Qty</th>
                    <th style="text-align: right;">Price</th>
                    <th style="text-align: right;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>
              <div style="margin-top: 20px; text-align: right;">
                <p>Subtotal: R${orderData.subtotal.toFixed(2)}</p>
                <p>VAT (15%): R${orderData.tax.toFixed(2)}</p>
                <p class="total">Total: R${orderData.total.toFixed(2)}</p>
              </div>
            </div>

            <div class="address">
              <h3>📍 Delivery Address</h3>
              <p>${orderData.shippingAddress.name}</p>
              <p>${orderData.shippingAddress.addressLine1}</p>
              ${orderData.shippingAddress.addressLine2 ? `<p>${orderData.shippingAddress.addressLine2}</p>` : ''}
              <p>${orderData.shippingAddress.city}${orderData.shippingAddress.province ? `, ${orderData.shippingAddress.province}` : ''}</p>
              <p>${orderData.shippingAddress.postalCode}</p>
            </div>

            <p style="margin-top: 30px; padding: 15px; background: #fff3cd; border-radius: 5px;">
              <strong>💳 Payment Method:</strong> Online Payment (iKhokha)
            </p>

            <p style="margin-top: 20px; text-align: center;">
              <a href="https://www.fusionaura.co.za/admin/orders" style="display: inline-block; background: linear-gradient(135deg, #7ab356, #569330); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">View Order in Dashboard</a>
            </p>
          </div>
        </div>
      </body>
    </html>
  `;

  // Send to all admin emails
  for (const adminEmail of ADMIN_EMAILS) {
    try {
      const result = await resend.emails.send({
        from: getFromEmail(),
        to: adminEmail,
        subject: `🛒 New Order #${orderData.orderNumber} - FusionAura`,
        html,
      });

      if (result.error) {
        console.error(`❌ Resend API error for ${adminEmail}:`, result.error);
        continue;
      }

      console.log(`✅ Admin order notification sent to ${adminEmail}. ID: ${result.data?.id}`);
    } catch (error) {
      console.error(`❌ Error sending admin email to ${adminEmail}:`, error);
    }
  }
}

// Send order confirmation to customer (only for registered customers)
export async function sendOrderConfirmationToCustomer(orderData: OrderEmailData): Promise<void> {
  if (!resend) {
    console.log('⚠️  Email not configured. Customer confirmation would be sent to:', orderData.customerEmail);
    return;
  }

  const itemsHtml = orderData.items
    .map(
      (item) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #eee;">${item.name}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">R${item.price.toFixed(2)}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">R${(item.price * item.quantity).toFixed(2)}</td>
    </tr>
  `
    )
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #7ab356, #569330); color: white; padding: 30px 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .success-icon { font-size: 48px; margin-bottom: 10px; }
          .order-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          th { background: #f0f0f0; padding: 12px; text-align: left; font-size: 14px; }
          .total-row { font-size: 18px; font-weight: bold; color: #569330; }
          .address-box { background: #e8f5e9; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4caf50; }
          .payment-box { background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; }
          .track-button { display: inline-block; background: linear-gradient(135deg, #7ab356, #569330); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="success-icon">✅</div>
            <h1>Order Confirmed!</h1>
            <p>Thank you for your order, ${orderData.customerName}!</p>
          </div>
          <div class="content">
            <p>We've received your order and it's now being reviewed. You'll receive another email once your order has been accepted and is being prepared.</p>

            <div class="order-box">
              <h3 style="margin-top: 0; color: #333;">Order #${orderData.orderNumber}</h3>
              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th style="text-align: center;">Qty</th>
                    <th style="text-align: right;">Price</th>
                    <th style="text-align: right;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>
              <div style="margin-top: 20px; text-align: right; border-top: 2px solid #eee; padding-top: 15px;">
                <p style="margin: 5px 0;">Subtotal: R${orderData.subtotal.toFixed(2)}</p>
                <p style="margin: 5px 0;">VAT (15%): R${orderData.tax.toFixed(2)}</p>
                <p class="total-row" style="margin: 10px 0 0 0;">Total: R${orderData.total.toFixed(2)}</p>
              </div>
            </div>

            <div class="address-box">
              <h3 style="margin-top: 0; color: #2e7d32;">📍 Delivery Address</h3>
              <p style="margin: 0;">${orderData.shippingAddress.name}</p>
              <p style="margin: 0;">${orderData.shippingAddress.addressLine1}</p>
              ${orderData.shippingAddress.addressLine2 ? `<p style="margin: 0;">${orderData.shippingAddress.addressLine2}</p>` : ''}
              <p style="margin: 0;">${orderData.shippingAddress.city}${orderData.shippingAddress.province ? `, ${orderData.shippingAddress.province}` : ''} ${orderData.shippingAddress.postalCode}</p>
            </div>

            <div class="payment-box">
              <p style="margin: 0;"><strong>💳 Payment:</strong> Paid via iKhokha</p>
              <p style="margin: 5px 0 0 0; font-size: 14px; color: #666;">Your payment of R${orderData.total.toFixed(2)} has been received. No payment required on delivery.</p>
            </div>

            <div style="text-align: center;">
              <a href="https://www.fusionaura.co.za/orders" class="track-button">Track Your Order</a>
            </div>

            <div class="footer">
              <p><strong>Questions?</strong> Reply to this email or contact us at support@fusionaura.co.za</p>
              <p>© ${new Date().getFullYear()} FusionAura. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    const result = await resend.emails.send({
      from: getFromEmail(),
      to: orderData.customerEmail,
      subject: `✅ Order Confirmed - #${orderData.orderNumber}`,
      html,
    });

    if (result.error) {
      console.error('❌ Resend API error:', result.error);
      return;
    }

    console.log(`✅ Order confirmation email sent to customer ${orderData.customerEmail}. ID: ${result.data?.id}`);
  } catch (error) {
    console.error('❌ Error sending customer confirmation email:', error);
  }
}

export interface OrderStatusUpdateData {
  orderNumber: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  status: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
}

export async function sendOrderStatusUpdateEmail(orderData: OrderStatusUpdateData): Promise<void> {
  // Skip if no email or phone provided
  if (!orderData.customerEmail && !orderData.customerPhone) {
    console.log('⚠️  No contact info provided for order status update');
    return;
  }

  if (!resend) {
    console.log('⚠️  Email not configured. Order status update would be sent to:', orderData.customerEmail || orderData.customerPhone);
    console.log('Order status update:', JSON.stringify(orderData, null, 2));
    return;
  }

  const statusMessages: Record<string, { title: string; message: string; color: string }> = {
    PENDING: {
      title: 'Payment Confirmed',
      message: 'Your payment has been received and your order is now being processed. We will notify you once it has been accepted.',
      color: '#3b82f6',
    },
    ACCEPTED: {
      title: 'Order Accepted',
      message: 'Great news! Your order has been accepted and is being prepared for delivery.',
      color: '#569330',
    },
    DECLINED: {
      title: 'Order Declined',
      message: 'Unfortunately, your order could not be processed at this time. Your payment will be refunded. Please contact us for assistance.',
      color: '#ef4444',
    },
    PENDING_DELIVERY: {
      title: 'Ready for Delivery',
      message: 'Your order is packed and ready for delivery. You will receive another update when it is dispatched.',
      color: '#3b82f6',
    },
    OUT_FOR_DELIVERY: {
      title: 'Out for Delivery',
      message: 'Exciting news! Your order is on its way to you. Please ensure someone is available to receive it.',
      color: '#f59e0b',
    },
    COMPLETED: {
      title: 'Order Delivered',
      message: 'Your order has been successfully delivered. Thank you for shopping with FusionAura!',
      color: '#569330',
    },
    CANCELLED: {
      title: 'Order Cancelled',
      message: 'Your order has been cancelled. If a payment was made, it will be refunded. Please contact us if you have any questions.',
      color: '#ef4444',
    },
  };

  const statusInfo = statusMessages[orderData.status] || {
    title: 'Order Status Updated',
    message: `Your order status has been updated to: ${orderData.status}`,
    color: '#6b7280',
  };

  const itemsHtml = orderData.items
    .map(
      (item) => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">R${(item.price * item.quantity).toFixed(2)}</td>
    </tr>
  `
    )
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: ${statusInfo.color}; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 10px 10px; }
          .greeting { font-size: 16px; margin-bottom: 20px; }
          .status-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid ${statusInfo.color}; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th { background: #f0f0f0; padding: 10px; text-align: left; }
          .total { font-size: 18px; font-weight: bold; color: ${statusInfo.color}; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>FusionAura</h1>
            <p style="margin: 0; font-size: 18px;">${statusInfo.title}</p>
          </div>
          <div class="content">
            <p class="greeting">Hi ${orderData.customerName},</p>
            
            <div class="status-box">
              <h2 style="margin-top: 0;">Order #${orderData.orderNumber}</h2>
              <p><strong>${statusInfo.title}</strong></p>
              <p>${statusInfo.message}</p>
            </div>

            <div style="background: white; padding: 20px; margin: 20px 0; border-radius: 5px;">
              <h3>Order Summary</h3>
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th style="text-align: center;">Quantity</th>
                    <th style="text-align: right;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>
              <div style="margin-top: 20px; text-align: right;">
                <p class="total">Total: R${orderData.total.toFixed(2)}</p>
              </div>
            </div>

            <p style="margin-top: 20px; padding: 15px; background: #e0f2fe; border-radius: 5px;">
              <strong>Payment Method:</strong> Online Payment (iKhokha)
            </p>

            <div style="text-align: center; margin-top: 30px;">
              <a href="https://www.fusionaura.co.za/track-order" style="display: inline-block; background: linear-gradient(135deg, #7ab356, #569330); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Track Your Order</a>
            </div>

            <div class="footer">
              <p>If you have any questions about your order, please contact us at <a href="mailto:fusionauraza@gmail.com">fusionauraza@gmail.com</a></p>
              <p>© ${new Date().getFullYear()} FusionAura. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  // Send email if email is provided
  if (orderData.customerEmail) {
    try {
      const result = await resend.emails.send({
        from: getFromEmail(),
        to: orderData.customerEmail,
        subject: `${statusInfo.title} - Order #${orderData.orderNumber}`,
        html,
      });

      if (result.error) {
        console.error('❌ Resend API error:', result.error);
        return;
      }

      console.log(`✅ Order status update email sent to ${orderData.customerEmail}`);
    } catch (error) {
      console.error('Error sending order status email:', error);
    }
  }

  // Note: SMS would require a service like Twilio, AWS SNS, etc.
  if (orderData.customerPhone) {
    console.log(`📱 SMS notification would be sent to ${orderData.customerPhone}: ${statusInfo.title} - Order #${orderData.orderNumber}`);
  }
}
