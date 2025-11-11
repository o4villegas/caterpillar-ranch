/**
 * Catalog API Routes
 *
 * Endpoints for accessing the product catalog
 * Implements caching strategy with KV storage
 */

import { Hono } from 'hono';
import { PrintfulClient, PrintfulCache } from '../lib/printful';

const catalog = new Hono<{ Bindings: Cloudflare.Env }>();

/**
 * GET /api/catalog/products
 * Get all products (cached)
 */
catalog.get('/products', async (c) => {
  try {
    const cache = new PrintfulCache(c.env.CATALOG_CACHE);

    // Check cache first
    const cachedProducts = await cache.getProducts();
    if (cachedProducts) {
      return c.json({
        data: cachedProducts,
        meta: { cached: true, source: 'kv' },
      });
    }

    // Fetch from Printful if not cached
    const printful = new PrintfulClient(c.env.PRINTFUL_API_TOKEN);
    const products = await printful.getCatalogProducts();

    // Cache the results
    await cache.setProducts(products);

    return c.json({
      data: products,
      meta: { cached: false, source: 'printful-api' },
    });
  } catch (error) {
    console.error('Error fetching catalog products:', error);
    return c.json(
      {
        error: 'Failed to fetch products',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

/**
 * GET /api/catalog/products/:id
 * Get product by ID (cached)
 */
catalog.get('/products/:id', async (c) => {
  try {
    const productId = parseInt(c.req.param('id'));

    if (isNaN(productId)) {
      return c.json({ error: 'Invalid product ID' }, 400);
    }

    const cache = new PrintfulCache(c.env.CATALOG_CACHE);

    // Check cache first
    const cachedProduct = await cache.getProduct(productId);
    if (cachedProduct) {
      return c.json({
        data: cachedProduct,
        meta: { cached: true, source: 'kv' },
      });
    }

    // Fetch from Printful if not cached
    const printful = new PrintfulClient(c.env.PRINTFUL_API_TOKEN);
    const product = await printful.getProduct(productId);

    // Cache the result
    await cache.setProduct(product);

    return c.json({
      data: product,
      meta: { cached: false, source: 'printful-api' },
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    return c.json(
      {
        error: 'Failed to fetch product',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

/**
 * POST /api/catalog/invalidate
 * Invalidate product cache (admin only)
 * Requires authentication
 */
catalog.post('/invalidate', async (c) => {
  try {
    // TODO: Add requireAuth middleware when admin endpoints are ready
    // For now, this is accessible without auth in development

    const body = await c.req.json<{
      productId?: number;
      all?: boolean;
    }>();

    const cache = new PrintfulCache(c.env.CATALOG_CACHE);

    if (body.all) {
      await cache.invalidateAll();
      return c.json({
        message: 'All product cache invalidated',
        invalidated: 'all',
      });
    }

    if (body.productId) {
      await cache.invalidateProduct(body.productId);
      return c.json({
        message: 'Product cache invalidated',
        invalidated: body.productId,
      });
    }

    return c.json({ error: 'Must specify productId or all: true' }, 400);
  } catch (error) {
    console.error('Error invalidating cache:', error);
    return c.json(
      {
        error: 'Failed to invalidate cache',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

export default catalog;
