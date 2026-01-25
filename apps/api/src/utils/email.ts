import { config } from '../config';

// Optional nodemailer import - won't break if not configured
let nodemailer: any;
let transporter: any;

try {
  nodemailer = require('nodemailer');
  // Create reusable transporter only if SMTP is configured
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS, // App password for Gmail
      },
    });
  }
} catch (error) {
  console.warn('Nodemailer not available, email functionality disabled');
}

// Password Reset Email
export interface PasswordResetEmailData {
  email: string;
  name: string;
  resetUrl: string;
}

export async function sendPasswordResetEmail(data: PasswordResetEmailData): Promise<void> {
  // Skip if SMTP not configured
  if (!transporter || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('⚠️  Email not configured. Password reset email would be sent to:', data.email);
    console.log('Reset URL:', data.resetUrl);
    return;
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
          .header { background: linear-gradient(135deg, #82aa5a, #418755); color: white; padding: 30px 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: linear-gradient(135deg, #82aa5a, #418755); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
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
              <p>If you have any questions, contact us at alphageneralsol@gmail.com</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: `"FusionAura" <${process.env.SMTP_USER || 'noreply@fusionaura.com'}>`,
      to: data.email,
      subject: 'Reset Your Password - FusionAura',
      html,
    });
    console.log(`✅ Password reset email sent to ${data.email}`);
  } catch (error) {
    console.error('❌ Error sending password reset email:', error);
    throw error; // Rethrow to let the caller handle it
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

export async function sendOrderEmail(orderData: OrderEmailData): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL || 'lraseemela@gmail.com';
  
  // Skip email if SMTP not configured or transporter not available
  if (!transporter || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('⚠️  Email not configured. Order email would be sent to:', adminEmail);
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
          .header { background: #4ade80; color: white; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 20px; }
          .order-details { background: white; padding: 20px; margin: 20px 0; border-radius: 5px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th { background: #f0f0f0; padding: 10px; text-align: left; }
          .total { font-size: 18px; font-weight: bold; color: #22c55e; }
          .address { background: #f0f0f0; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>FusionAura - New Order</h1>
          </div>
          <div class="content">
            <h2>Order #${orderData.orderNumber}</h2>
            <p>A new order has been placed and requires your attention.</p>
            
            <div class="order-details">
              <h3>Customer Information</h3>
              <p><strong>Name:</strong> ${orderData.customerName}</p>
              <p><strong>Email:</strong> ${orderData.customerEmail}</p>
            </div>

            <div class="order-details">
              <h3>Order Items</h3>
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th style="text-align: center;">Quantity</th>
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
              <h3>Delivery Address</h3>
              <p>${orderData.shippingAddress.name}</p>
              <p>${orderData.shippingAddress.addressLine1}</p>
              ${orderData.shippingAddress.addressLine2 ? `<p>${orderData.shippingAddress.addressLine2}</p>` : ''}
              <p>${orderData.shippingAddress.city}${orderData.shippingAddress.province ? `, ${orderData.shippingAddress.province}` : ''}</p>
              <p>${orderData.shippingAddress.postalCode}</p>
              ${orderData.shippingAddress.phone ? `<p><strong>Phone:</strong> ${orderData.shippingAddress.phone}</p>` : ''}
            </div>

            <p style="margin-top: 30px; padding: 15px; background: #fff3cd; border-radius: 5px;">
              <strong>Payment Method:</strong> Cash on Delivery
            </p>

            <p style="margin-top: 20px;">
              Please log in to the admin dashboard to accept or decline this order.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    const result = await transporter.sendMail({
      from: `"FusionAura" <${process.env.SMTP_USER || 'noreply@fusionaura.com'}>`,
      to: adminEmail,
      subject: `New Order #${orderData.orderNumber} - FusionAura`,
      html,
    });
    console.log(`✅ Order email sent successfully to ${adminEmail}. Message ID: ${result.messageId}`);
  } catch (error) {
    console.error('❌ Error sending email:', error);
    // Don't throw - email failure shouldn't block order creation
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

  // Skip email if SMTP not configured
  if (!transporter || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('⚠️  Email not configured. Order status update would be sent to:', orderData.customerEmail || orderData.customerPhone);
    console.log('Order status update:', JSON.stringify(orderData, null, 2));
    return;
  }

  const statusMessages: Record<string, { title: string; message: string; color: string }> = {
    ACCEPTED: {
      title: 'Order Accepted',
      message: 'Your order has been accepted and is being prepared for delivery.',
      color: '#22c55e',
    },
    DECLINED: {
      title: 'Order Declined',
      message: 'Unfortunately, your order could not be processed at this time. Please contact us for assistance.',
      color: '#ef4444',
    },
    PENDING_DELIVERY: {
      title: 'Ready for Delivery',
      message: 'Your order is ready and awaiting delivery.',
      color: '#3b82f6',
    },
    OUT_FOR_DELIVERY: {
      title: 'Out for Delivery',
      message: 'Your order is on its way! Please ensure someone is available to receive it.',
      color: '#f59e0b',
    },
    COMPLETED: {
      title: 'Order Delivered',
      message: 'Your order has been successfully delivered. Thank you for shopping with us!',
      color: '#22c55e',
    },
    CANCELLED: {
      title: 'Order Cancelled',
      message: 'Your order has been cancelled. If you have any questions, please contact us.',
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
          .header { background: ${statusInfo.color}; color: white; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 20px; }
          .status-box { background: white; padding: 20px; margin: 20px 0; border-radius: 5px; border-left: 4px solid ${statusInfo.color}; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th { background: #f0f0f0; padding: 10px; text-align: left; }
          .total { font-size: 18px; font-weight: bold; color: ${statusInfo.color}; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>FusionAura - ${statusInfo.title}</h1>
          </div>
          <div class="content">
            <div class="status-box">
              <h2>Order #${orderData.orderNumber}</h2>
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
              <strong>Payment Method:</strong> Cash on Delivery
            </p>

            <p style="margin-top: 20px; color: #6b7280; font-size: 14px;">
              If you have any questions about your order, please contact us.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;

  // Send email if email is provided
  if (orderData.customerEmail) {
    try {
      await transporter.sendMail({
        from: `"FusionAura" <${process.env.SMTP_USER || 'noreply@fusionaura.com'}>`,
        to: orderData.customerEmail,
        subject: `${statusInfo.title} - Order #${orderData.orderNumber}`,
        html,
      });
      console.log(`Order status update email sent to ${orderData.customerEmail}`);
    } catch (error) {
      console.error('Error sending order status email:', error);
    }
  }

  // Note: SMS would require a service like Twilio, AWS SNS, etc.
  // For now, we'll log it
  if (orderData.customerPhone) {
    console.log(`📱 SMS notification would be sent to ${orderData.customerPhone}: ${statusInfo.title} - Order #${orderData.orderNumber}`);
    // TODO: Integrate SMS service (Twilio, AWS SNS, etc.)
  }
}

