/**
 * Admin Subscribers API Routes
 *
 * Endpoints for managing newsletter subscribers
 * GET /api/admin/subscribers - List all subscribers with pagination
 * GET /api/admin/subscribers/export - Export subscribers as CSV
 * DELETE /api/admin/subscribers/:id - Remove a subscriber
 */

import { Hono } from 'hono';
import { requireAuth } from '../../lib/auth';
import { sendWelcomeEmail } from '../../lib/email';

type Variables = {
  userId: number;
  userEmail: string;
};

const subscribers = new Hono<{ Bindings: Cloudflare.Env; Variables: Variables }>();

/**
 * GET /api/admin/subscribers
 *
 * List all newsletter subscribers with pagination and filtering
 *
 * Query params:
 *   page: page number (default: 1)
 *   limit: items per page (default: 50, max: 100)
 *   status: 'active' | 'inactive' | 'all' (default: 'all')
 *   search: search by email
 *
 * Response:
 *   {
 *     subscribers: Array<{ id, email, subscribed_at, source, active }>,
 *     pagination: { page, limit, total, totalPages }
 *   }
 */
subscribers.get('/', requireAuth, async (c) => {
  try {
    const page = Math.max(1, parseInt(c.req.query('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(c.req.query('limit') || '50', 10)));
    const status = c.req.query('status') || 'all';
    const search = c.req.query('search') || '';
    const offset = (page - 1) * limit;

    const db = c.env.DB;

    // Build WHERE clause
    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (status === 'active') {
      conditions.push('active = 1');
    } else if (status === 'inactive') {
      conditions.push('active = 0');
    }

    if (search) {
      conditions.push('LOWER(email) LIKE ?');
      params.push(`%${search.toLowerCase()}%`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countQuery = `SELECT COUNT(*) as count FROM newsletter_subscribers ${whereClause}`;
    const countResult = await db
      .prepare(countQuery)
      .bind(...params)
      .first<{ count: number }>();

    const total = countResult?.count || 0;
    const totalPages = Math.ceil(total / limit);

    // Get subscribers
    const subscribersQuery = `
      SELECT id, email, subscribed_at, source, active
      FROM newsletter_subscribers
      ${whereClause}
      ORDER BY subscribed_at DESC
      LIMIT ? OFFSET ?
    `;
    const subscribersResult = await db
      .prepare(subscribersQuery)
      .bind(...params, limit, offset)
      .all<{
        id: number;
        email: string;
        subscribed_at: string;
        source: string;
        active: number;
      }>();

    return c.json({
      subscribers: subscribersResult.results || [],
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error('List subscribers error:', error);
    return c.json({ error: 'Failed to list subscribers' }, 500);
  }
});

/**
 * GET /api/admin/subscribers/stats
 *
 * Get subscriber statistics
 *
 * Response:
 *   { total, active, inactive, thisWeek, thisMonth }
 */
subscribers.get('/stats', requireAuth, async (c) => {
  try {
    const db = c.env.DB;

    const stats = await db.batch([
      db.prepare('SELECT COUNT(*) as count FROM newsletter_subscribers'),
      db.prepare('SELECT COUNT(*) as count FROM newsletter_subscribers WHERE active = 1'),
      db.prepare('SELECT COUNT(*) as count FROM newsletter_subscribers WHERE active = 0'),
      db.prepare(
        `SELECT COUNT(*) as count FROM newsletter_subscribers
         WHERE subscribed_at >= datetime('now', '-7 days')`
      ),
      db.prepare(
        `SELECT COUNT(*) as count FROM newsletter_subscribers
         WHERE subscribed_at >= datetime('now', '-30 days')`
      ),
    ]);

    return c.json({
      total: (stats[0].results?.[0] as any)?.count || 0,
      active: (stats[1].results?.[0] as any)?.count || 0,
      inactive: (stats[2].results?.[0] as any)?.count || 0,
      thisWeek: (stats[3].results?.[0] as any)?.count || 0,
      thisMonth: (stats[4].results?.[0] as any)?.count || 0,
    });
  } catch (error) {
    console.error('Subscriber stats error:', error);
    return c.json({ error: 'Failed to get stats' }, 500);
  }
});

/**
 * GET /api/admin/subscribers/export
 *
 * Export all active subscribers as CSV
 *
 * Response: CSV file download
 */
subscribers.get('/export', requireAuth, async (c) => {
  try {
    const db = c.env.DB;

    const result = await db
      .prepare(
        `SELECT email, subscribed_at, source
         FROM newsletter_subscribers
         WHERE active = 1
         ORDER BY subscribed_at DESC`
      )
      .all<{ email: string; subscribed_at: string; source: string }>();

    // Build CSV
    const headers = 'email,subscribed_at,source\n';
    const rows = (result.results || [])
      .map((s) => `${s.email},${s.subscribed_at},${s.source}`)
      .join('\n');

    const csv = headers + rows;

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="subscribers-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('Export subscribers error:', error);
    return c.json({ error: 'Failed to export subscribers' }, 500);
  }
});

/**
 * POST /api/admin/subscribers
 *
 * Manually add a new subscriber
 *
 * Request body:
 *   { email: string }
 *
 * Response:
 *   Success: { success: true, message: string }
 *   Error: { error: string }
 */
subscribers.post('/', requireAuth, async (c) => {
  try {
    const body = await c.req.json<{ email: string }>();
    const { email } = body;

    // Validate email
    if (!email || typeof email !== 'string') {
      return c.json({ error: 'Email is required' }, 400);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return c.json({ error: 'Invalid email format' }, 400);
    }

    const normalizedEmail = email.toLowerCase().trim();
    const db = c.env.DB;

    // Check if already exists
    const existing = await db
      .prepare('SELECT id, active FROM newsletter_subscribers WHERE email = ?')
      .bind(normalizedEmail)
      .first<{ id: number; active: number }>();

    if (existing) {
      if (existing.active === 1) {
        return c.json({ error: 'This email is already subscribed' }, 400);
      }

      // Reactivate inactive subscriber
      await db
        .prepare('UPDATE newsletter_subscribers SET active = 1, subscribed_at = datetime(\'now\') WHERE id = ?')
        .bind(existing.id)
        .run();

      return c.json({
        success: true,
        message: 'Subscriber reactivated',
      });
    }

    // Insert new subscriber
    await db
      .prepare('INSERT INTO newsletter_subscribers (email, source) VALUES (?, ?)')
      .bind(normalizedEmail, 'admin')
      .run();

    // Send welcome email (non-blocking)
    try {
      await sendWelcomeEmail(c.env, normalizedEmail);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Continue - subscription was successful even if email failed
    }

    return c.json({
      success: true,
      message: 'Subscriber added',
    });
  } catch (error) {
    console.error('Add subscriber error:', error);
    return c.json({ error: 'Failed to add subscriber' }, 500);
  }
});

/**
 * DELETE /api/admin/subscribers/:id
 *
 * Permanently delete a subscriber
 */
subscribers.delete('/:id', requireAuth, async (c) => {
  try {
    const id = parseInt(c.req.param('id'), 10);

    if (isNaN(id)) {
      return c.json({ error: 'Invalid subscriber ID' }, 400);
    }

    const db = c.env.DB;

    // Permanently delete the record
    const result = await db
      .prepare('DELETE FROM newsletter_subscribers WHERE id = ?')
      .bind(id)
      .run();

    if (result.meta.changes === 0) {
      return c.json({ error: 'Subscriber not found' }, 404);
    }

    return c.json({ success: true, message: 'Subscriber removed' });
  } catch (error) {
    console.error('Delete subscriber error:', error);
    return c.json({ error: 'Failed to remove subscriber' }, 500);
  }
});

export default subscribers;
