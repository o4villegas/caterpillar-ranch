/**
 * Stripe Client Wrapper
 *
 * Handles Stripe Checkout session creation and webhook verification
 * Docs: https://stripe.com/docs/api
 */

import Stripe from 'stripe';

export interface CheckoutLineItem {
  productName: string;
  productImage: string;
  unitPrice: number; // In dollars (will convert to cents)
  quantity: number;
  variantSize: string;
  variantColor: string;
  discountPercent: number;
}

export interface CheckoutSessionParams {
  lineItems: CheckoutLineItem[];
  customerEmail: string;
  shippingInfo: {
    name: string;
    address: string;
    address2?: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    phone?: string;
  };
  discountPercent: number;
  shippingCost: number; // In dollars
  orderId: string; // Our external order ID (RANCH-xxx)
  successUrl: string;
  cancelUrl: string;
}

export interface CheckoutSessionResult {
  sessionId: string;
  url: string;
}

/**
 * Create Stripe client instance
 */
export function createStripeClient(apiKey: string): Stripe {
  return new Stripe(apiKey, {
    apiVersion: '2025-11-17.clover',
    typescript: true,
  });
}

/**
 * Create a Stripe Checkout session
 */
export async function createCheckoutSession(
  stripe: Stripe,
  params: CheckoutSessionParams
): Promise<CheckoutSessionResult> {
  // Convert line items to Stripe format
  const stripeLineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = params.lineItems.map(item => {
    // Calculate price after discount (in cents)
    const discountedPrice = item.unitPrice * (1 - item.discountPercent / 100);
    const priceInCents = Math.round(discountedPrice * 100);

    return {
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.productName,
          description: `Size: ${item.variantSize} | Color: ${item.variantColor}`,
          images: item.productImage ? [item.productImage] : [],
        },
        unit_amount: priceInCents,
      },
      quantity: item.quantity,
    };
  });

  // Add shipping as a line item if > 0
  if (params.shippingCost > 0) {
    stripeLineItems.push({
      price_data: {
        currency: 'usd',
        product_data: {
          name: 'Shipping',
          description: 'Standard shipping',
        },
        unit_amount: Math.round(params.shippingCost * 100),
      },
      quantity: 1,
    });
  }

  // Create the checkout session
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: stripeLineItems,
    customer_email: params.customerEmail,
    success_url: `${params.successUrl}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: params.cancelUrl,
    metadata: {
      orderId: params.orderId,
      discountPercent: params.discountPercent.toString(),
      shippingName: params.shippingInfo.name,
      shippingAddress: params.shippingInfo.address,
      shippingAddress2: params.shippingInfo.address2 || '',
      shippingCity: params.shippingInfo.city,
      shippingState: params.shippingInfo.state,
      shippingZip: params.shippingInfo.zip,
      shippingCountry: params.shippingInfo.country,
      shippingPhone: params.shippingInfo.phone || '',
    },
    payment_intent_data: {
      metadata: {
        orderId: params.orderId,
      },
    },
  });

  if (!session.url) {
    throw new Error('Stripe session created but no URL returned');
  }

  return {
    sessionId: session.id,
    url: session.url,
  };
}

/**
 * Verify Stripe webhook signature
 */
export function verifyWebhookSignature(
  stripe: Stripe,
  payload: string,
  signature: string,
  webhookSecret: string
): Stripe.Event {
  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}

/**
 * Retrieve checkout session with line items
 */
export async function getCheckoutSession(
  stripe: Stripe,
  sessionId: string
): Promise<Stripe.Checkout.Session> {
  return stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['line_items', 'payment_intent'],
  });
}

/**
 * Extract order metadata from Stripe session
 */
export function extractOrderMetadata(session: Stripe.Checkout.Session): {
  orderId: string;
  discountPercent: number;
  shippingInfo: {
    name: string;
    email: string;
    address: string;
    address2: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    phone: string;
  };
  paymentIntentId: string;
  amountPaid: number;
} {
  const metadata = session.metadata || {};

  return {
    orderId: metadata.orderId || '',
    discountPercent: parseFloat(metadata.discountPercent || '0'),
    shippingInfo: {
      name: metadata.shippingName || '',
      email: session.customer_email || '',
      address: metadata.shippingAddress || '',
      address2: metadata.shippingAddress2 || '',
      city: metadata.shippingCity || '',
      state: metadata.shippingState || '',
      zip: metadata.shippingZip || '',
      country: metadata.shippingCountry || '',
      phone: metadata.shippingPhone || '',
    },
    paymentIntentId: typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id || '',
    amountPaid: (session.amount_total || 0) / 100, // Convert cents to dollars
  };
}
