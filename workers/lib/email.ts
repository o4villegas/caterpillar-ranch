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
    from: 'Caterpillar Ranch <orders@therancch.com>',
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
    from: 'Caterpillar Ranch <shipping@therancch.com>',
    to: data.customerEmail,
    subject: `Your Order Has Shipped: ${data.orderId} - Caterpillar Ranch`,
    html,
  });
}

/**
 * Featured products for welcome email
 * These are dynamically fetched in production, but we use popular defaults as fallback
 */
interface FeaturedProduct {
  name: string;
  slug: string;
  imageUrl: string;
  price: string;
}

const DEFAULT_FEATURED_PRODUCTS: FeaturedProduct[] = [
  {
    name: 'Toxic Wayst Tee',
    slug: 'toxic-wayst-tee',
    imageUrl: 'https://files.cdn.printful.com/files/bef/bef133ee2d2befd9076c7c0442bcb17d_preview.png',
    price: '$24.99',
  },
  {
    name: 'Melty Tee',
    slug: 'melty-tee',
    imageUrl: 'https://files.cdn.printful.com/files/434/434b405c79567bee3e4a0711bec57c68_preview.png',
    price: '$24.99',
  },
  {
    name: 'Cooti Pi Tee',
    slug: 'cooti-pi-tee',
    imageUrl: 'https://files.cdn.printful.com/files/885/8858ea15e6113b23cc732a859af1e2a7_preview.png',
    price: '$24.99',
  },
];

/**
 * Generate enhanced welcome email HTML for newsletter subscribers
 * Features: Logo, horror aesthetic, featured products, games teaser, social links
 */
function generateWelcomeEmailHtml(email: string, featuredProducts?: FeaturedProduct[]): string {
  const products = featuredProducts || DEFAULT_FEATURED_PRODUCTS;
  const encodedEmail = btoa(email);
  const unsubscribeUrl = `https://therancch.com/api/newsletter/unsubscribe?email=${encodedEmail}`;
  const baseUrl = 'https://therancch.com';

  // Generate product cards HTML
  const productCardsHtml = products.slice(0, 3).map(product => `
    <td style="width: 33.33%; padding: 8px; vertical-align: top;">
      <a href="${baseUrl}/products/${product.slug}" style="text-decoration: none; display: block;">
        <div style="background-color: #3d3458; border-radius: 8px; overflow: hidden; border: 2px solid #4A3258;">
          <img src="${product.imageUrl}" alt="${product.name}" width="160" height="160" style="width: 100%; height: auto; display: block; object-fit: cover;">
          <div style="padding: 12px; text-align: center;">
            <p style="margin: 0 0 4px; color: #f4f0e6; font-size: 13px; font-weight: bold;">${product.name}</p>
            <p style="margin: 0; color: #32CD32; font-size: 14px; font-weight: bold;">${product.price}</p>
          </div>
        </div>
      </a>
    </td>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <title>Welcome to the Colony - Caterpillar Ranch</title>
  <!--[if mso]>
  <style type="text/css">
    table { border-collapse: collapse; }
    td { padding: 0; }
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #1a1a1a; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; -webkit-font-smoothing: antialiased;">

  <!-- Preview text (hidden but shows in inbox preview) -->
  <div style="display: none; max-height: 0; overflow: hidden;">
    You're now part of the colony! 🐛 Discover horrifyingly adorable tees and earn discounts by playing games...
  </div>

  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #1a1a1a; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #2a2440; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.4);">

          <!-- Header with Logo -->
          <tr>
            <td style="background: linear-gradient(180deg, #4A3258 0%, #2a2440 100%); padding: 40px 30px; text-align: center;">
              <img src="${baseUrl}/cr-logo.png" alt="Caterpillar Ranch" width="180" height="180" style="width: 180px; height: auto; margin-bottom: 16px;">
              <h1 style="margin: 0; color: #FF1493; font-size: 32px; letter-spacing: 3px; text-shadow: 0 0 20px rgba(255,20,147,0.5);">
                CATERPILLAR RANCCH
              </h1>
              <p style="margin: 12px 0 0; color: #9B8FB5; font-size: 16px; font-style: italic;">
                Adorable Horror Tees
              </p>
            </td>
          </tr>

          <!-- Welcome Banner -->
          <tr>
            <td style="background: linear-gradient(90deg, #00CED1 0%, #32CD32 100%); padding: 20px 30px; text-align: center;">
              <h2 style="margin: 0; color: #1a1a1a; font-size: 24px; font-weight: bold;">
                🐛 You've Joined the Colony! 🐛
              </h2>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 35px 30px;">
              <p style="color: #f4f0e6; font-size: 17px; line-height: 1.7; margin: 0 0 25px;">
                The caterpillars are <span style="color: #32CD32;">thrilled</span> to have you. Something wonderful (and slightly unsettling) is growing here at the Ranch...
              </p>

              <!-- Benefits Box -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #1a1a1a; border-radius: 12px; margin-bottom: 30px; border: 2px solid #4A3258;">
                <tr>
                  <td style="padding: 25px;">
                    <p style="margin: 0 0 15px; color: #FF1493; font-size: 18px; font-weight: bold;">As a colony member, you get:</p>
                    <table cellpadding="0" cellspacing="0" role="presentation">
                      <tr>
                        <td style="padding: 8px 0; color: #f4f0e6; font-size: 15px;">
                          <span style="color: #00CED1; margin-right: 10px;">✦</span> First access to new horrifyingly adorable designs
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #f4f0e6; font-size: 15px;">
                          <span style="color: #32CD32; margin-right: 10px;">✦</span> Exclusive colony-only discount codes
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #f4f0e6; font-size: 15px;">
                          <span style="color: #FF1493; margin-right: 10px;">✦</span> Limited edition drops before anyone else
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #f4f0e6; font-size: 15px;">
                          <span style="color: #9B8FB5; margin-right: 10px;">✦</span> Behind-the-scenes ranch happenings
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Featured Products Section -->
              <p style="margin: 0 0 15px; color: #f4f0e6; font-size: 18px; font-weight: bold; text-align: center;">
                🎨 Fresh From the Ranch
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom: 30px;">
                <tr>
                  ${productCardsHtml}
                </tr>
              </table>

              <!-- Games Teaser -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background: linear-gradient(135deg, #3d3458 0%, #2a2440 100%); border-radius: 12px; margin-bottom: 30px; border: 2px solid #32CD32;">
                <tr>
                  <td style="padding: 25px; text-align: center;">
                    <p style="margin: 0 0 8px; font-size: 28px;">🎮</p>
                    <p style="margin: 0 0 10px; color: #32CD32; font-size: 18px; font-weight: bold;">Play Games, Earn Discounts</p>
                    <p style="margin: 0; color: #9B8FB5; font-size: 14px; line-height: 1.5;">
                      Each product has mini-games you can play to unlock up to <span style="color: #00CED1; font-weight: bold;">15% off</span>.<br>
                      The better you play, the bigger your discount!
                    </p>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td align="center">
                    <a href="${baseUrl}" style="display: inline-block; background: linear-gradient(135deg, #00CED1 0%, #32CD32 100%); color: #1a1a1a; text-decoration: none; padding: 18px 40px; border-radius: 50px; font-weight: bold; font-size: 18px; box-shadow: 0 4px 15px rgba(0,206,209,0.4);">
                      Start Shopping 🛒
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #1a1a1a; padding: 30px; text-align: center; border-top: 2px solid #4A3258;">
              <!-- Social Links -->
              <p style="margin: 0 0 15px; color: #9B8FB5; font-size: 14px;">Follow the infestation:</p>
              <table cellpadding="0" cellspacing="0" role="presentation" style="margin: 0 auto 20px;">
                <tr>
                  <td style="padding: 0 8px;">
                    <a href="https://www.instagram.com/caterpillar_ranch" style="color: #FF1493; text-decoration: none; font-size: 14px;">Instagram</a>
                  </td>
                  <td style="color: #4A3258; padding: 0 8px;">|</td>
                  <td style="padding: 0 8px;">
                    <a href="https://www.tiktok.com/@caterpillar_ranch" style="color: #00CED1; text-decoration: none; font-size: 14px;">TikTok</a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 8px; color: #9B8FB5; font-size: 13px; font-style: italic;">
                "The colony is growing... one caterpillar at a time."
              </p>
              <p style="margin: 0 0 15px; color: #4A3258; font-size: 12px;">
                © ${new Date().getFullYear()} Caterpillar Ranch. All rights reserved.
              </p>
              <p style="margin: 0; font-size: 11px;">
                <a href="${unsubscribeUrl}" style="color: #9B8FB5; text-decoration: underline;">Unsubscribe from this list</a>
              </p>
            </td>
          </tr>

        </table>

        <!-- Tiny footer outside main card -->
        <p style="margin: 20px 0 0; color: #4A3258; font-size: 11px; text-align: center;">
          Sent with 🐛 from Caterpillar Ranch
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * Send welcome email to new newsletter subscriber
 */
export async function sendWelcomeEmail(
  env: Cloudflare.Env,
  email: string
): Promise<void> {
  const resend = new Resend(env.RESEND_API_KEY);

  const html = generateWelcomeEmailHtml(email);

  await resend.emails.send({
    from: 'Caterpillar Ranch <hello@therancch.com>',
    to: email,
    subject: 'Welcome to the Colony! 🐛 - Caterpillar Ranch',
    html,
  });
}
