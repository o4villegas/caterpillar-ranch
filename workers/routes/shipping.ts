/**
 * Shipping API Routes
 *
 * Handles shipping rate estimation from Printful
 * Caches rates in KV for performance
 */

import { Hono } from 'hono';
import { PrintfulClient } from '../lib/printful';
import type { PrintfulRecipient, PrintfulOrderItem } from '../lib/printful';

const shipping = new Hono<{ Bindings: Cloudflare.Env }>();

/**
 * Cache TTL for shipping rates (5 minutes)
 */
const SHIPPING_CACHE_TTL = 5 * 60;

/**
 * Generate cache key for shipping estimate
 */
function generateCacheKey(
  zip: string,
  country: string,
  items: Array<{ variant_id: number; quantity: number }>
): string {
  const itemsHash = items
    .map(i => `${i.variant_id}:${i.quantity}`)
    .sort()
    .join(',');
  return `shipping:${country}:${zip}:${itemsHash}`;
}

/**
 * POST /api/shipping/estimate
 * Estimate shipping costs from Printful
 */
shipping.post('/estimate', async (c) => {
  try {
    const body = await c.req.json<{
      recipient: {
        zip: string;
        country: string;
        state?: string;
        city?: string;
      };
      items: Array<{
        printfulVariantId: number;
        quantity: number;
      }>;
    }>();

    const { recipient, items } = body;

    // Validate required fields
    if (!recipient || !recipient.zip || !recipient.country) {
      return c.json(
        {
          error: 'Missing required fields',
          details: 'recipient.zip and recipient.country are required',
        },
        400
      );
    }

    if (!items || items.length === 0) {
      return c.json(
        {
          error: 'Missing required fields',
          details: 'items array is required',
        },
        400
      );
    }

    // Transform items for cache key and Printful API
    const printfulItems = items.map(item => ({
      variant_id: item.printfulVariantId,
      quantity: item.quantity,
    }));

    // Check cache
    const cacheKey = generateCacheKey(recipient.zip, recipient.country, printfulItems);
    const cached = await c.env.CATALOG_CACHE.get(cacheKey);

    if (cached) {
      const cachedData = JSON.parse(cached);
      return c.json({
        data: cachedData,
        meta: { source: 'cache' },
      });
    }

    // Create Printful recipient (minimal for shipping estimate)
    const printfulRecipient: PrintfulRecipient = {
      name: 'Shipping Estimate',
      email: 'estimate@example.com',
      address1: '123 Main St',
      city: recipient.city || 'Anytown',
      state_code: recipient.state || 'CA',
      country_code: recipient.country,
      zip: recipient.zip,
    };

    // Create Printful order items
    const orderItems: PrintfulOrderItem[] = printfulItems.map(item => ({
      variant_id: item.variant_id,
      quantity: item.quantity,
      retail_price: '0.00', // Not needed for shipping estimate
    }));

    // Get estimate from Printful
    const printful = new PrintfulClient(c.env.PRINTFUL_API_TOKEN, c.env.PRINTFUL_STORE_ID);
    const estimate = await printful.estimateOrder(printfulRecipient, orderItems);

    // Extract shipping cost
    const shippingCost = parseFloat(estimate.costs.shipping);

    // Build response data
    const responseData = {
      shipping: shippingCost,
      currency: estimate.costs.currency,
      estimatedDelivery: estimate.shipping_date,
      // Offer free shipping if subtotal would qualify (optional promo)
      freeShippingThreshold: 75, // Free shipping over $75
    };

    // Cache the result
    await c.env.CATALOG_CACHE.put(cacheKey, JSON.stringify(responseData), {
      expirationTtl: SHIPPING_CACHE_TTL,
    });

    return c.json({
      data: responseData,
      meta: { source: 'printful-api' },
    });
  } catch (error) {
    console.error('Error estimating shipping:', error);
    return c.json(
      {
        error: 'Failed to estimate shipping',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

/**
 * GET /api/shipping/methods
 * Get available shipping methods (static for now)
 */
shipping.get('/methods', async (c) => {
  // Return available shipping methods
  // Printful handles actual method selection during order creation
  return c.json({
    data: [
      {
        id: 'STANDARD',
        name: 'Standard Shipping',
        description: 'Delivered in 5-8 business days',
        estimatedDays: { min: 5, max: 8 },
      },
      {
        id: 'EXPEDITED',
        name: 'Expedited Shipping',
        description: 'Delivered in 2-4 business days',
        estimatedDays: { min: 2, max: 4 },
      },
    ],
    meta: { source: 'static' },
  });
});

export default shipping;
