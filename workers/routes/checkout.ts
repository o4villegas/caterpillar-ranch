/**
 * Checkout API Routes
 *
 * Handles Stripe Checkout session creation
 * Payment flow: Cart → Shipping → Review → Stripe Checkout → Webhook → Printful
 */

import { Hono } from 'hono';
import {
  createStripeClient,
  createCheckoutSession,
  type CheckoutLineItem,
} from '../lib/stripe';

const checkout = new Hono<{ Bindings: Cloudflare.Env }>();

/**
 * Maximum discount percentage allowed (server-side enforcement)
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
 * POST /api/checkout/create-session
 * Create a Stripe Checkout session for payment
 */
checkout.post('/create-session', async (c) => {
  try {
    const body = await c.req.json<{
      items: Array<{
        productId: string;
        productName: string;
        productImage: string;
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
      shippingCost?: number;
      discountPercent: number;
    }>();

    const { items, shipping, shippingCost = 0, discountPercent } = body;

    // Validate required fields
    if (!items || items.length === 0) {
      return c.json(
        { error: 'Missing required fields', details: 'items array is required' },
        400
      );
    }

    if (!shipping || !shipping.email || !shipping.name || !shipping.address) {
      return c.json(
        { error: 'Missing required fields', details: 'shipping info is required' },
        400
      );
    }

    // Generate our external order ID
    const orderId = `RANCH-${Date.now()}`;

    // Validate discount (server-side enforcement)
    const validatedDiscount = validateDiscount(discountPercent);

    // Transform items to checkout line items
    const lineItems: CheckoutLineItem[] = items.map(item => ({
      productName: item.productName,
      productImage: item.productImage,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      variantSize: item.variantSize,
      variantColor: item.variantColor,
      discountPercent: validateDiscount(item.discountPercent),
    }));

    // Get base URL for success/cancel redirects
    const origin = new URL(c.req.url).origin;

    // Create Stripe client
    const stripe = createStripeClient(c.env.STRIPE_SECRET_KEY);

    // Store cart data in KV for retrieval after payment
    // This ensures we have the full cart data when the webhook fires
    const cartData = {
      items: items.map(item => ({
        productId: item.productId,
        productName: item.productName,
        variantId: item.variantId,
        variantSize: item.variantSize,
        variantColor: item.variantColor,
        printfulVariantId: item.printfulVariantId,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        discountPercent: validateDiscount(item.discountPercent),
      })),
      shipping,
      shippingCost,
      discountPercent: validatedDiscount,
      createdAt: new Date().toISOString(),
    };

    await c.env.CATALOG_CACHE.put(
      `checkout:${orderId}`,
      JSON.stringify(cartData),
      { expirationTtl: 60 * 60 } // 1 hour TTL
    );

    // Create Stripe Checkout session
    const session = await createCheckoutSession(stripe, {
      lineItems,
      customerEmail: shipping.email,
      shippingInfo: {
        name: shipping.name,
        address: shipping.address,
        address2: shipping.address2,
        city: shipping.city,
        state: shipping.state,
        zip: shipping.zip,
        country: shipping.country,
        phone: shipping.phone,
      },
      discountPercent: validatedDiscount,
      shippingCost,
      orderId,
      successUrl: `${origin}/checkout/success`,
      cancelUrl: `${origin}/checkout/review`,
    });

    return c.json({
      data: {
        sessionId: session.sessionId,
        url: session.url,
        orderId,
      },
      meta: { source: 'stripe' },
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return c.json(
      {
        error: 'Failed to create checkout session',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

/**
 * GET /api/checkout/session/:sessionId
 * Get checkout session status (for client-side confirmation)
 */
checkout.get('/session/:sessionId', async (c) => {
  try {
    const sessionId = c.req.param('sessionId');

    if (!sessionId) {
      return c.json({ error: 'Session ID is required' }, 400);
    }

    const stripe = createStripeClient(c.env.STRIPE_SECRET_KEY);

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    return c.json({
      data: {
        status: session.status,
        paymentStatus: session.payment_status,
        orderId: session.metadata?.orderId,
        customerEmail: session.customer_email,
        amountTotal: session.amount_total ? session.amount_total / 100 : 0,
      },
      meta: { source: 'stripe' },
    });
  } catch (error) {
    console.error('Error retrieving checkout session:', error);
    return c.json(
      {
        error: 'Failed to retrieve checkout session',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

export default checkout;
