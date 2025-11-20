/**
 * Admin Sync Logs API
 *
 * Endpoints:
 * - GET /api/admin/sync-logs - List sync logs (paginated, filterable)
 * - GET /api/admin/sync-logs/hidden-products - List all hidden products
 * - POST /api/admin/sync-logs/restore/:productId - Restore hidden product to active
 */

import { Hono } from 'hono';
import { requireAuth } from '../../lib/auth';
import type { AuthVariables } from '../../lib/auth';

const syncLogs = new Hono<{ Bindings: Cloudflare.Env; Variables: AuthVariables }>();

// All routes require authentication
syncLogs.use('*', requireAuth);

/**
 * GET /api/admin/sync-logs
 *
 * List sync logs with pagination and filters
 *
 * Query params:
 * - action: 'all' | 'added' | 'updated' | 'hidden' | 'error' (default: 'all')
 * - page: number (default: 1)
 * - limit: number (default: 50, max: 200)
 */
syncLogs.get('/', async (c) => {
  const db = c.env.DB;

  // Parse query parameters
  const action = c.req.query('action') || 'all';
  const page = parseInt(c.req.query('page') || '1', 10);
  const limit = Math.min(parseInt(c.req.query('limit') || '50', 10), 200);
  const offset = (page - 1) * limit;

  try {
    // Build WHERE clause
    const whereClause = action !== 'all' ? 'WHERE action = ?' : '';
    const params: any[] = action !== 'all' ? [action] : [];

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM sync_logs ${whereClause}`;
    const countResult = await db.prepare(countQuery).bind(...params).first<{ total: number }>();
    const total = countResult?.total || 0;

    // Get paginated logs
    const query = `
      SELECT
        id, sync_timestamp, action,
        product_id, printful_product_id, product_name,
        reason, details
      FROM sync_logs
      ${whereClause}
      ORDER BY sync_timestamp DESC
      LIMIT ? OFFSET ?
    `;

    const logsResult = await db.prepare(query)
      .bind(...params, limit, offset)
      .all();

    return c.json({
      logs: logsResult.results || [],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Failed to fetch sync logs:', error);
    return c.json(
      { error: 'Failed to fetch sync logs', details: error instanceof Error ? error.message : 'Unknown error' },
      500
    );
  }
});

/**
 * GET /api/admin/sync-logs/hidden-products
 *
 * List all products with status='hidden'
 *
 * Query params:
 * - page: number (default: 1)
 * - limit: number (default: 20, max: 100)
 */
syncLogs.get('/hidden-products', async (c) => {
  const db = c.env.DB;

  // Parse query parameters
  const page = parseInt(c.req.query('page') || '1', 10);
  const limit = Math.min(parseInt(c.req.query('limit') || '20', 10), 100);
  const offset = (page - 1) * limit;

  try {
    // Get total count
    const countResult = await db.prepare(`
      SELECT COUNT(*) as total FROM products WHERE status = 'hidden'
    `).first<{ total: number }>();
    const total = countResult?.total || 0;

    // Get paginated hidden products
    const productsResult = await db.prepare(`
      SELECT
        id, name, slug,
        printful_product_id,
        base_price, retail_price,
        image_url,
        updated_at
      FROM products
      WHERE status = 'hidden'
      ORDER BY updated_at DESC
      LIMIT ? OFFSET ?
    `).bind(limit, offset).all();

    return c.json({
      products: productsResult.results || [],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Failed to fetch hidden products:', error);
    return c.json(
      { error: 'Failed to fetch hidden products', details: error instanceof Error ? error.message : 'Unknown error' },
      500
    );
  }
});

/**
 * POST /api/admin/sync-logs/restore/:productId
 *
 * Restore a hidden product to active status
 */
syncLogs.post('/restore/:productId', async (c) => {
  const db = c.env.DB;
  const productId = c.req.param('productId');

  try {
    // Verify product exists and is hidden
    const product = await db.prepare(`
      SELECT id, name, printful_product_id, status
      FROM products
      WHERE id = ?
    `).bind(productId).first<{ id: string; name: string; printful_product_id: number; status: string }>();

    if (!product) {
      return c.json({ error: 'Product not found' }, 404);
    }

    if (product.status !== 'hidden') {
      return c.json({ error: 'Product is not hidden (current status: ' + product.status + ')' }, 400);
    }

    // Restore product to active status
    await db.prepare(`
      UPDATE products
      SET status = 'active', updated_at = datetime('now')
      WHERE id = ?
    `).bind(productId).run();

    // Log the restoration
    await db.prepare(`
      INSERT INTO sync_logs (
        action, product_id, printful_product_id, product_name,
        reason, details
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      'updated',
      productId,
      product.printful_product_id,
      product.name,
      'Product manually restored to active by admin',
      JSON.stringify({ restoredFrom: 'hidden', manualAction: true })
    ).run();

    return c.json({
      success: true,
      product: {
        id: productId,
        name: product.name,
        status: 'active',
      },
    });
  } catch (error) {
    console.error('Failed to restore product:', error);
    return c.json(
      { error: 'Failed to restore product', details: error instanceof Error ? error.message : 'Unknown error' },
      500
    );
  }
});

export default syncLogs;
