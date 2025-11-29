/**
 * Stripe Webhook Handler
 *
 * Processes Stripe events after successful payment
 * Creates and confirms Printful orders when payment is complete
 */

import { Hono } from 'hono';
import {
  createStripeClient,
  verifyWebhookSignature,
  extractOrderMetadata,
} from '../../lib/stripe';
import { PrintfulClient } from '../../lib/printful';
import type { PrintfulRecipient, PrintfulOrderItem, PrintfulCosts } from '../../lib/printful';
import { sendOrderConfirmationEmail } from '../../lib/email';

const stripeWebhooks = new Hono<{ Bindings: Cloudflare.Env }>();

/**
 * Maximum discount percentage allowed
 */
const MAX_DISCOUNT_PERCENT = 15;

/**
 * Validate and cap discount percentage
 */
function validateDiscount(discountPercent: number): number {
  if (discountPercent < 0) return 0;
  if (discountPercent > MAX_DISCOUNT_PERCENT) return MAX_DISCOUNT_PERCENT;
  return discountPercent;
}

/**
 * Calculate retail costs
 */
function calculateRetailCosts(
  subtotal: number,
  discountPercent: number
): PrintfulCosts {
  const validatedDiscount = validateDiscount(discountPercent);
  const discountAmount = subtotal * (validatedDiscount / 100);
  const total = subtotal - discountAmount;

  return {
    currency: 'USD',
    subtotal: subtotal.toFixed(2),
    discount: discountAmount.toFixed(2),
    shipping: '0.00',
    tax: '0.00',
    total: total.toFixed(2),
  };
}

/**
 * POST /api/webhooks/stripe
 * Handle Stripe webhook events
 */
stripeWebhooks.post('/', async (c) => {
  const signature = c.req.header('stripe-signature');

  if (!signature) {
    console.error('[Stripe Webhook] Missing signature header');
    return c.json({ error: 'Missing signature' }, 400);
  }

  let event;
  const payload = await c.req.text();

  try {
    const stripe = createStripeClient(c.env.STRIPE_SECRET_KEY);
    event = verifyWebhookSignature(
      stripe,
      payload,
      signature,
      c.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('[Stripe Webhook] Signature verification failed:', err);
    return c.json(
      { error: 'Invalid signature' },
      400
    );
  }

  console.log(`[Stripe Webhook] Event received: ${event.type}`);

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;

      // Only process paid sessions
      if (session.payment_status !== 'paid') {
        console.log(`[Stripe Webhook] Session ${session.id} not yet paid, skipping`);
        return c.json({ received: true });
      }

      try {
        await handleSuccessfulPayment(c.env, session);
      } catch (error) {
        console.error('[Stripe Webhook] Error processing payment:', error);
        // Return 200 to prevent Stripe from retrying (we'll handle errors internally)
        return c.json({ received: true, error: 'Processing error' });
      }
      break;
    }

    case 'payment_intent.succeeded': {
      // Additional confirmation (session.completed is primary)
      console.log(`[Stripe Webhook] Payment intent succeeded: ${event.data.object.id}`);
      break;
    }

    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object;
      console.error(`[Stripe Webhook] Payment failed: ${paymentIntent.id}`, paymentIntent.last_payment_error);
      break;
    }

    default:
      console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
  }

  return c.json({ received: true });
});

/**
 * Process successful payment
 * Creates Printful order, persists to D1, sends confirmation email
 */
async function handleSuccessfulPayment(
  env: Cloudflare.Env,
  session: {
    id: string;
    metadata?: Record<string, string> | null;
    customer_email?: string | null;
    payment_intent?: string | { id: string } | null;
    amount_total?: number | null;
  }
): Promise<void> {
  const orderId = session.metadata?.orderId;

  if (!orderId) {
    throw new Error('Missing orderId in session metadata');
  }

  console.log(`[Stripe Webhook] Processing order: ${orderId}`);

  // Retrieve cart data from KV (stored during checkout session creation)
  const cartDataJson = await env.CATALOG_CACHE.get(`checkout:${orderId}`);

  if (!cartDataJson) {
    throw new Error(`Cart data not found for order: ${orderId}`);
  }

  const cartData = JSON.parse(cartDataJson) as {
    items: Array<{
      productId: string;
      productName: string;
      variantId: string;
      variantSize: string;
      variantColor: string;
      printfulVariantId: number;
      unitPrice: number;
      quantity: number;
      discountPercent: number;
    }>;
    shipping: {
      email: string;
      name: string;
      address: string;
      address2?: string;
      city: string;
      state: string;
      zip: string;
      country: string;
      phone?: string;
    };
    shippingCost: number;
    discountPercent: number;
  };

  // Transform to Printful recipient format
  const recipient: PrintfulRecipient = {
    name: cartData.shipping.name,
    email: cartData.shipping.email,
    phone: cartData.shipping.phone || '',
    address1: cartData.shipping.address,
    address2: cartData.shipping.address2 || undefined,
    city: cartData.shipping.city,
    state_code: cartData.shipping.state,
    country_code: cartData.shipping.country,
    zip: cartData.shipping.zip,
  };

  // Transform cart items to Printful format
  const printfulItems: PrintfulOrderItem[] = cartData.items.map(item => ({
    variant_id: item.printfulVariantId,
    quantity: item.quantity,
    retail_price: (item.unitPrice * (1 - item.discountPercent / 100)).toFixed(2),
  }));

  // Calculate subtotal and retail costs
  const subtotal = cartData.items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );
  const retailCosts = calculateRetailCosts(subtotal, cartData.discountPercent);

  // Create Printful client
  const printful = new PrintfulClient(env.PRINTFUL_API_TOKEN, env.PRINTFUL_STORE_ID);

  // Create draft order with Printful
  console.log(`[Stripe Webhook] Creating Printful order for: ${orderId}`);
  const printfulOrder = await printful.createOrder(
    orderId,
    recipient,
    printfulItems,
    retailCosts
  );

  console.log(`[Stripe Webhook] Printful draft order created: ${printfulOrder.id}`);

  // Persist order to D1 database
  const db = env.DB;
  const now = new Date().toISOString();
  const validatedDiscount = validateDiscount(cartData.discountPercent);
  const discountAmount = parseFloat(retailCosts.discount);
  const totalAmount = parseFloat(retailCosts.total);

  // Get payment intent ID
  const paymentIntentId = typeof session.payment_intent === 'string'
    ? session.payment_intent
    : session.payment_intent?.id || '';

  // Idempotency check: Skip if order already exists (prevents duplicates from webhook retries)
  const existingOrder = await db
    .prepare('SELECT id FROM orders WHERE id = ?')
    .bind(orderId)
    .first();

  if (existingOrder) {
    console.log(`[Stripe Webhook] Order ${orderId} already exists, skipping duplicate webhook`);
    return;
  }

  // Insert into orders table (with Stripe payment info)
  await db
    .prepare(
      `INSERT INTO orders (
        id, customer_email, customer_name,
        shipping_address_line1, shipping_address_line2,
        shipping_city, shipping_state, shipping_zip, shipping_country,
        subtotal, discount_amount, total,
        printful_order_id, printful_status,
        stripe_checkout_session_id, stripe_payment_intent_id,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      orderId,
      cartData.shipping.email,
      cartData.shipping.name,
      cartData.shipping.address,
      cartData.shipping.address2 || null,
      cartData.shipping.city,
      cartData.shipping.state,
      cartData.shipping.zip,
      cartData.shipping.country,
      subtotal,
      discountAmount,
      totalAmount,
      printfulOrder.id,
      'draft',
      session.id,
      paymentIntentId,
      now
    )
    .run();

  // Insert order items
  for (const item of cartData.items) {
    const itemSubtotal = item.unitPrice * (1 - item.discountPercent / 100) * item.quantity;

    await db
      .prepare(
        `INSERT INTO order_items (
          order_id, product_id, product_name,
          variant_id, variant_size, variant_color,
          unit_price, quantity, discount_percent, subtotal,
          printful_variant_id, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        orderId,
        item.productId,
        item.productName,
        item.variantId,
        item.variantSize,
        item.variantColor,
        item.unitPrice,
        item.quantity,
        item.discountPercent,
        itemSubtotal,
        item.printfulVariantId,
        now
      )
      .run();
  }

  console.log(`[Stripe Webhook] Order persisted to D1: ${orderId}`);

  // Confirm order with Printful (moves to fulfillment)
  console.log(`[Stripe Webhook] Confirming Printful order: ${printfulOrder.id}`);
  const confirmedOrder = await printful.confirmOrder(printfulOrder.id);

  // Update D1 with confirmed status
  await db
    .prepare(
      `UPDATE orders
       SET printful_status = ?, confirmed_at = ?
       WHERE id = ?`
    )
    .bind('confirmed', now, orderId)
    .run();

  console.log(`[Stripe Webhook] Printful order confirmed: ${confirmedOrder.id}`);

  // Send confirmation email via Resend
  try {
    await sendOrderConfirmationEmail(env, {
      orderId,
      customerEmail: cartData.shipping.email,
      customerName: cartData.shipping.name,
      items: cartData.items.map(item => ({
        name: item.productName,
        size: item.variantSize,
        quantity: item.quantity,
        price: item.unitPrice * (1 - item.discountPercent / 100) * item.quantity,
      })),
      subtotal,
      discount: discountAmount,
      shipping: cartData.shippingCost,
      total: totalAmount,
      shippingAddress: {
        name: cartData.shipping.name,
        address1: cartData.shipping.address,
        address2: cartData.shipping.address2,
        city: cartData.shipping.city,
        state: cartData.shipping.state,
        zip: cartData.shipping.zip,
        country: cartData.shipping.country,
      },
    });
    console.log(`[Stripe Webhook] Confirmation email sent for: ${orderId}`);
  } catch (emailError) {
    // Log but don't fail the webhook
    console.error(`[Stripe Webhook] Failed to send confirmation email:`, emailError);
  }

  // Clean up cart data from KV
  await env.CATALOG_CACHE.delete(`checkout:${orderId}`);

  console.log(`[Stripe Webhook] Order processing complete: ${orderId}`);
}

export default stripeWebhooks;
