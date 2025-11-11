/**
 * Orders API Routes
 *
 * Endpoints for order estimation, creation, and confirmation
 * Proxies Printful API with server-side discount validation
 */

import { Hono } from 'hono';
import { PrintfulClient } from '../lib/printful';
import type {
  PrintfulRecipient,
  PrintfulOrderItem,
  PrintfulCosts,
} from '../lib/printful';

const orders = new Hono<{ Bindings: Cloudflare.Env }>();

/**
 * Maximum discount percentage allowed (server-side enforcement)
 */
const MAX_DISCOUNT_PERCENT = 40;

/**
 * Validate and cap discount percentage
 */
function validateDiscount(discountPercent: number): number {
  if (discountPercent < 0) return 0;
  if (discountPercent > MAX_DISCOUNT_PERCENT) return MAX_DISCOUNT_PERCENT;
  return discountPercent;
}

/**
 * Calculate retail costs based on subtotal and discount
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
    shipping: '0.00', // Free shipping
    tax: '0.00', // Tax calculated by Printful
    total: total.toFixed(2),
  };
}

/**
 * POST /api/orders/estimate
 * Estimate order costs before checkout
 */
orders.post('/estimate', async (c) => {
  try {
    const body = await c.req.json<{
      recipient: PrintfulRecipient;
      items: PrintfulOrderItem[];
      discountPercent?: number;
    }>();

    const { recipient, items, discountPercent = 0 } = body;

    // Validate required fields
    if (!recipient || !items || items.length === 0) {
      return c.json(
        {
          error: 'Missing required fields',
          details: 'recipient and items are required',
        },
        400
      );
    }

    const printful = new PrintfulClient(c.env.PRINTFUL_API_TOKEN, c.env.PRINTFUL_STORE_ID);

    // Get estimate from Printful
    const estimate = await printful.estimateOrder(recipient, items);

    // Calculate retail costs with validated discount
    const subtotal = parseFloat(estimate.costs.subtotal);
    const retailCosts = calculateRetailCosts(subtotal, discountPercent);

    return c.json({
      data: {
        ...estimate,
        retailCosts,
        appliedDiscountPercent: validateDiscount(discountPercent),
        maxDiscountPercent: MAX_DISCOUNT_PERCENT,
      },
      meta: { source: 'printful-api' },
    });
  } catch (error) {
    console.error('Error estimating order:', error);
    return c.json(
      {
        error: 'Failed to estimate order',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

/**
 * POST /api/orders
 * Create draft order with Printful
 */
orders.post('/', async (c) => {
  try {
    const body = await c.req.json<{
      externalId: string;
      recipient: PrintfulRecipient;
      items: PrintfulOrderItem[];
      discountPercent?: number;
    }>();

    const { externalId, recipient, items, discountPercent = 0 } = body;

    // Validate required fields
    if (!externalId || !recipient || !items || items.length === 0) {
      return c.json(
        {
          error: 'Missing required fields',
          details: 'externalId, recipient, and items are required',
        },
        400
      );
    }

    const printful = new PrintfulClient(c.env.PRINTFUL_API_TOKEN, c.env.PRINTFUL_STORE_ID);

    // Calculate retail costs with validated discount
    // First, estimate to get subtotal
    const estimate = await printful.estimateOrder(recipient, items);
    const subtotal = parseFloat(estimate.costs.subtotal);
    const retailCosts = calculateRetailCosts(subtotal, discountPercent);

    // Create draft order
    const order = await printful.createOrder(
      externalId,
      recipient,
      items,
      retailCosts
    );

    return c.json({
      data: {
        ...order,
        appliedDiscountPercent: validateDiscount(discountPercent),
        maxDiscountPercent: MAX_DISCOUNT_PERCENT,
      },
      meta: { source: 'printful-api', status: 'draft' },
    });
  } catch (error) {
    console.error('Error creating order:', error);
    return c.json(
      {
        error: 'Failed to create order',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

/**
 * POST /api/orders/:id/confirm
 * Confirm draft order (moves to fulfillment)
 */
orders.post('/:id/confirm', async (c) => {
  try {
    const orderId = parseInt(c.req.param('id'));

    if (isNaN(orderId)) {
      return c.json({ error: 'Invalid order ID' }, 400);
    }

    const printful = new PrintfulClient(c.env.PRINTFUL_API_TOKEN, c.env.PRINTFUL_STORE_ID);

    // Confirm the order
    const order = await printful.confirmOrder(orderId);

    return c.json({
      data: order,
      meta: { source: 'printful-api', status: 'confirmed' },
    });
  } catch (error) {
    console.error('Error confirming order:', error);
    return c.json(
      {
        error: 'Failed to confirm order',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

/**
 * GET /api/orders/:id
 * Get order status by Printful order ID
 */
orders.get('/:id', async (c) => {
  try {
    const orderId = parseInt(c.req.param('id'));

    if (isNaN(orderId)) {
      return c.json({ error: 'Invalid order ID' }, 400);
    }

    const printful = new PrintfulClient(c.env.PRINTFUL_API_TOKEN, c.env.PRINTFUL_STORE_ID);

    const order = await printful.getOrder(orderId);

    return c.json({
      data: order,
      meta: { source: 'printful-api' },
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    return c.json(
      {
        error: 'Failed to fetch order',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

/**
 * GET /api/orders/external/:externalId
 * Get order by external ID (our order reference)
 */
orders.get('/external/:externalId', async (c) => {
  try {
    const externalId = c.req.param('externalId');

    if (!externalId) {
      return c.json({ error: 'External ID is required' }, 400);
    }

    const printful = new PrintfulClient(c.env.PRINTFUL_API_TOKEN, c.env.PRINTFUL_STORE_ID);

    const order = await printful.getOrderByExternalId(externalId);

    return c.json({
      data: order,
      meta: { source: 'printful-api' },
    });
  } catch (error) {
    console.error('Error fetching order by external ID:', error);
    return c.json(
      {
        error: 'Failed to fetch order',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

export default orders;
