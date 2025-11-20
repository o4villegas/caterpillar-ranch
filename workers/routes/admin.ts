/**
 * Admin API Routes
 *
 * Endpoints for admin portal functionality
 * GET /api/admin/search - Global search across products and orders
 * GET /api/admin/analytics/dashboard-stats - Dashboard stats
 * GET /api/admin/analytics/recent-activity - Recent orders and games
 * GET /api/admin/products - Product management (list, sync, reorder)
 */

import { Hono } from 'hono';
import { requireAuth } from '../lib/auth';
import analyticsRoutes from './admin/analytics';
import productsRoutes from './admin/products';
import designsRoutes from './admin/designs';
import syncLogsRoutes from './admin/sync-logs';

type Variables = {
  userId: number;
  userEmail: string;
};

const admin = new Hono<{ Bindings: Cloudflare.Env; Variables: Variables }>();

// Mount analytics routes
admin.route('/analytics', analyticsRoutes);

// Mount products routes
admin.route('/products', productsRoutes);

// Mount designs routes
admin.route('/designs', designsRoutes);

// Mount sync logs routes
admin.route('/sync-logs', syncLogsRoutes);

/**
 * GET /api/admin/search
 *
 * Global search endpoint for admin portal
 * Searches products and orders by query string
 *
 * Query params:
 *   q: search query string
 *
 * Response:
 *   {
 *     products: Array<{ id: string; label: string; sublabel?: string }>,
 *     orders: Array<{ id: string; label: string; sublabel?: string }>
 *   }
 */
admin.get('/search', requireAuth, async (c) => {
  try {
    const query = c.req.query('q');

    if (!query || query.trim().length === 0) {
      return c.json({ products: [], orders: [] });
    }

    const searchTerm = `%${query.toLowerCase()}%`;
    const db = c.env.DB;

    // Search products by name or Printful ID
    // Note: products table stores Printful catalog data
    const productsResult = await db
      .prepare(
        `SELECT id, name, printful_product_id
         FROM products
         WHERE LOWER(name) LIKE ?1 OR CAST(printful_product_id AS TEXT) LIKE ?1
         ORDER BY name ASC
         LIMIT 5`
      )
      .bind(searchTerm)
      .all();

    const products = (productsResult.results || []).map((p: any) => ({
      type: 'product' as const,
      id: p.id.toString(),
      label: p.name,
      sublabel: `Printful ID: ${p.printful_product_id}`,
    }));

    // Search orders by order ID or customer email
    const ordersResult = await db
      .prepare(
        `SELECT id, customer_email, total, status
         FROM orders
         WHERE CAST(id AS TEXT) LIKE ?1 OR LOWER(customer_email) LIKE ?1
         ORDER BY created_at DESC
         LIMIT 5`
      )
      .bind(searchTerm)
      .all();

    const orders = (ordersResult.results || []).map((o: any) => ({
      type: 'order' as const,
      id: o.id.toString(),
      label: `Order #${o.id}`,
      sublabel: `${o.customer_email} - $${o.total} (${o.status})`,
    }));

    return c.json({ products, orders });
  } catch (error) {
    console.error('Search error:', error);
    return c.json({ error: 'Search failed' }, 500);
  }
});

export default admin;
