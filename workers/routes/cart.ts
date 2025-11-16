/**
 * Cart API Routes
 *
 * Endpoints for syncing cart state to KV storage
 * Enables cross-device cart persistence and server-side discount validation
 */

import { Hono } from 'hono';
import type { Cart } from '../../app/lib/types/cart';

const cart = new Hono<{ Bindings: Cloudflare.Env }>();

/**
 * KV storage key prefix for cart sessions
 */
const CART_PREFIX = 'cart:';

/**
 * Cart session TTL (30 minutes in seconds)
 */
const CART_TTL = 30 * 60;

/**
 * POST /api/cart/sync
 * Save cart state to KV storage
 */
cart.post('/sync', async (c) => {
  try {
    const body = await c.req.json<{
      sessionToken: string;
      cart: Cart;
    }>();

    const { sessionToken, cart: cartData } = body;

    // Validate required fields
    if (!sessionToken || !cartData) {
      return c.json(
        {
          error: 'Missing required fields',
          details: 'sessionToken and cart are required',
        },
        400
      );
    }

    // Validate session token format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(sessionToken)) {
      return c.json(
        {
          error: 'Invalid session token',
          details: 'Session token must be a valid UUID',
        },
        400
      );
    }

    // Store cart in KV with TTL
    const kv = c.env.CATALOG_CACHE; // Reusing CATALOG_CACHE KV namespace
    const key = `${CART_PREFIX}${sessionToken}`;

    await kv.put(key, JSON.stringify(cartData), {
      expirationTtl: CART_TTL,
    });

    return c.json({
      data: {
        sessionToken,
        synced: true,
        expiresAt: new Date(Date.now() + CART_TTL * 1000).toISOString(),
      },
      meta: { source: 'kv-storage', ttl: CART_TTL },
    });
  } catch (error) {
    console.error('Error syncing cart:', error);
    return c.json(
      {
        error: 'Failed to sync cart',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

/**
 * GET /api/cart/session/:sessionToken
 * Load cart state from KV storage
 */
cart.get('/session/:sessionToken', async (c) => {
  try {
    const sessionToken = c.req.param('sessionToken');

    if (!sessionToken) {
      return c.json({ error: 'Session token is required' }, 400);
    }

    // Validate session token format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(sessionToken)) {
      return c.json(
        {
          error: 'Invalid session token',
          details: 'Session token must be a valid UUID',
        },
        400
      );
    }

    // Retrieve cart from KV
    const kv = c.env.CATALOG_CACHE;
    const key = `${CART_PREFIX}${sessionToken}`;
    const cartJson = await kv.get(key);

    if (!cartJson) {
      // Cart not found or expired
      return c.json(
        {
          data: null,
          meta: { source: 'kv-storage', found: false },
        },
        404
      );
    }

    const cartData = JSON.parse(cartJson) as Cart;

    return c.json({
      data: {
        sessionToken,
        cart: cartData,
      },
      meta: { source: 'kv-storage', found: true },
    });
  } catch (error) {
    console.error('Error loading cart:', error);
    return c.json(
      {
        error: 'Failed to load cart',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

/**
 * DELETE /api/cart/session/:sessionToken
 * Clear cart session from KV storage
 */
cart.delete('/session/:sessionToken', async (c) => {
  try {
    const sessionToken = c.req.param('sessionToken');

    if (!sessionToken) {
      return c.json({ error: 'Session token is required' }, 400);
    }

    // Validate session token format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(sessionToken)) {
      return c.json(
        {
          error: 'Invalid session token',
          details: 'Session token must be a valid UUID',
        },
        400
      );
    }

    // Delete cart from KV
    const kv = c.env.CATALOG_CACHE;
    const key = `${CART_PREFIX}${sessionToken}`;
    await kv.delete(key);

    return c.json({
      data: {
        sessionToken,
        cleared: true,
      },
      meta: { source: 'kv-storage' },
    });
  } catch (error) {
    console.error('Error clearing cart:', error);
    return c.json(
      {
        error: 'Failed to clear cart',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

export default cart;
