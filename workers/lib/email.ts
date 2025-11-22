/**
 * Email Client using Resend
 *
 * Handles transactional emails: order confirmation, shipping notification
 * Docs: https://resend.com/docs
 */

import { Resend } from 'resend';

export interface OrderConfirmationData {
  orderId: string;
  customerEmail: string;
  customerName: string;
  items: Array<{
    name: string;
    size: string;
    quantity: number;
    price: number;
  }>;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  shippingAddress: {
    name: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
}

export interface ShippingNotificationData {
  orderId: string;
  customerEmail: string;
  customerName: string;
  trackingNumber: string;
  trackingUrl: string;
  carrier: string;
}

/**
 * Generate order confirmation email HTML
 */
function generateOrderConfirmationHtml(data: OrderConfirmationData): string {
  const itemsHtml = data.items
    .map(
      item => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #3d3458;">
          <strong style="color: #f4f0e6;">${item.name}</strong><br>
          <span style="color: #9B8FB5; font-size: 14px;">Size: ${item.size}</span>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #3d3458; text-align: center; color: #9B8FB5;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #3d3458; text-align: right; color: #00CED1;">$${item.price.toFixed(2)}</td>
      </tr>
    `
    )
    .join('');

  const addressLine2 = data.shippingAddress.address2
    ? `${data.shippingAddress.address2}<br>`
    : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation - Caterpillar Ranch</title>
</head>
<body style="margin: 0; padding: 0; background-color: #1a1a1a; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #1a1a1a; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #2a2440; border-radius: 12px; overflow: hidden;">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #4A3258 0%, #2a2440 100%); padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #FF1493; font-size: 28px; letter-spacing: 2px;">
                CATERPILLAR RANCH
              </h1>
              <p style="margin: 10px 0 0; color: #9B8FB5; font-size: 14px;">
                The Ranch Has Accepted Your Order
              </p>
            </td>
          </tr>

          <!-- Order Confirmation -->
          <tr>
            <td style="padding: 30px;">
              <h2 style="color: #32CD32; margin: 0 0 20px; font-size: 24px;">
                Order Confirmed! 🐛
              </h2>

              <p style="color: #f4f0e6; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Hi ${data.customerName},<br><br>
                Thank you for your order! The caterpillars are busy preparing your harvest.
              </p>

              <div style="background-color: #3d3458; border-radius: 8px; padding: 15px; margin-bottom: 25px;">
                <p style="margin: 0; color: #9B8FB5; font-size: 14px;">Order Number</p>
                <p style="margin: 5px 0 0; color: #00CED1; font-size: 20px; font-weight: bold;">${data.orderId}</p>
              </div>

              <!-- Order Items -->
              <h3 style="color: #f4f0e6; margin: 0 0 15px; font-size: 18px;">Your Items</h3>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 25px;">
                <tr style="background-color: #3d3458;">
                  <td style="padding: 12px; color: #9B8FB5; font-size: 14px;">Item</td>
                  <td style="padding: 12px; color: #9B8FB5; font-size: 14px; text-align: center;">Qty</td>
                  <td style="padding: 12px; color: #9B8FB5; font-size: 14px; text-align: right;">Price</td>
                </tr>
                ${itemsHtml}
              </table>

              <!-- Order Summary -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 25px;">
                <tr>
                  <td style="padding: 8px 0; color: #9B8FB5;">Subtotal</td>
                  <td style="padding: 8px 0; color: #f4f0e6; text-align: right;">$${data.subtotal.toFixed(2)}</td>
                </tr>
                ${
                  data.discount > 0
                    ? `
                <tr>
                  <td style="padding: 8px 0; color: #32CD32;">Discount</td>
                  <td style="padding: 8px 0; color: #32CD32; text-align: right;">-$${data.discount.toFixed(2)}</td>
                </tr>
                `
                    : ''
                }
                <tr>
                  <td style="padding: 8px 0; color: #9B8FB5;">Shipping</td>
                  <td style="padding: 8px 0; color: #32CD32; text-align: right;">${data.shipping > 0 ? `$${data.shipping.toFixed(2)}` : 'FREE'}</td>
                </tr>
                <tr style="border-top: 2px solid #4A3258;">
                  <td style="padding: 15px 0 0; color: #f4f0e6; font-size: 18px; font-weight: bold;">Total</td>
                  <td style="padding: 15px 0 0; color: #00CED1; font-size: 18px; font-weight: bold; text-align: right;">$${data.total.toFixed(2)}</td>
                </tr>
              </table>

              <!-- Shipping Address -->
              <h3 style="color: #f4f0e6; margin: 0 0 15px; font-size: 18px;">Shipping To</h3>
              <div style="background-color: #3d3458; border-radius: 8px; padding: 15px; color: #9B8FB5; line-height: 1.6;">
                <strong style="color: #f4f0e6;">${data.shippingAddress.name}</strong><br>
                ${data.shippingAddress.address1}<br>
                ${addressLine2}
                ${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.zip}<br>
                ${data.shippingAddress.country}
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #3d3458; padding: 25px; text-align: center;">
              <p style="margin: 0 0 10px; color: #9B8FB5; font-size: 14px;">
                Questions? Reply to this email or visit our store.
              </p>
              <p style="margin: 0; color: #9B8FB5; font-size: 12px;">
                © ${new Date().getFullYear()} Caterpillar Ranch. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * Generate shipping notification email HTML
 */
function generateShippingNotificationHtml(data: ShippingNotificationData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Order Has Shipped - Caterpillar Ranch</title>
</head>
<body style="margin: 0; padding: 0; background-color: #1a1a1a; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #1a1a1a; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #2a2440; border-radius: 12px; overflow: hidden;">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #4A3258 0%, #2a2440 100%); padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #FF1493; font-size: 28px; letter-spacing: 2px;">
                CATERPILLAR RANCH
              </h1>
              <p style="margin: 10px 0 0; color: #9B8FB5; font-size: 14px;">
                Your Harvest is on the Move!
              </p>
            </td>
          </tr>

          <!-- Shipping Info -->
          <tr>
            <td style="padding: 30px;">
              <h2 style="color: #32CD32; margin: 0 0 20px; font-size: 24px;">
                Your Order Has Shipped! 📦
              </h2>

              <p style="color: #f4f0e6; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Hi ${data.customerName},<br><br>
                Great news! Your order is on its way to you.
              </p>

              <div style="background-color: #3d3458; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
                <p style="margin: 0 0 10px; color: #9B8FB5; font-size: 14px;">Order Number</p>
                <p style="margin: 0 0 20px; color: #00CED1; font-size: 18px; font-weight: bold;">${data.orderId}</p>

                <p style="margin: 0 0 10px; color: #9B8FB5; font-size: 14px;">Carrier</p>
                <p style="margin: 0 0 20px; color: #f4f0e6; font-size: 16px;">${data.carrier}</p>

                <p style="margin: 0 0 10px; color: #9B8FB5; font-size: 14px;">Tracking Number</p>
                <p style="margin: 0; color: #f4f0e6; font-size: 16px;">${data.trackingNumber}</p>
              </div>

              <a href="${data.trackingUrl}" style="display: inline-block; background: linear-gradient(135deg, #00CED1 0%, #32CD32 100%); color: #1a1a1a; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: bold; font-size: 16px;">
                Track Your Package
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #3d3458; padding: 25px; text-align: center;">
              <p style="margin: 0 0 10px; color: #9B8FB5; font-size: 14px;">
                Questions? Reply to this email or visit our store.
              </p>
              <p style="margin: 0; color: #9B8FB5; font-size: 12px;">
                © ${new Date().getFullYear()} Caterpillar Ranch. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * Send order confirmation email
 */
export async function sendOrderConfirmationEmail(
  env: Cloudflare.Env,
  data: OrderConfirmationData
): Promise<void> {
  const resend = new Resend(env.RESEND_API_KEY);

  const html = generateOrderConfirmationHtml(data);

  await resend.emails.send({
    from: 'Caterpillar Ranch <orders@caterpillar.ranch>',
    to: data.customerEmail,
    subject: `Order Confirmed: ${data.orderId} - Caterpillar Ranch`,
    html,
  });
}

/**
 * Send shipping notification email
 */
export async function sendShippingNotificationEmail(
  env: Cloudflare.Env,
  data: ShippingNotificationData
): Promise<void> {
  const resend = new Resend(env.RESEND_API_KEY);

  const html = generateShippingNotificationHtml(data);

  await resend.emails.send({
    from: 'Caterpillar Ranch <shipping@caterpillar.ranch>',
    to: data.customerEmail,
    subject: `Your Order Has Shipped: ${data.orderId} - Caterpillar Ranch`,
    html,
  });
}
