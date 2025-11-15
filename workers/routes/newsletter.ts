/**
 * Newsletter API Routes
 *
 * Endpoints for newsletter email collection
 * POST /api/newsletter/subscribe - Add email to subscriber list
 */

import { Hono } from 'hono';
import { checkRateLimit } from '../lib/rateLimiter';

const newsletter = new Hono<{ Bindings: Cloudflare.Env }>();

/**
 * POST /api/newsletter/subscribe
 *
 * Subscribe to newsletter
 *
 * Request body:
 *   { email: string, source?: string }
 *
 * Response:
 *   Success: { success: true, message: string }
 *   Error: { error: string }
 */
newsletter.post('/subscribe', async (c) => {
  try {
    // Rate limiting: 5 requests per hour per IP
    const clientIP = c.req.header('CF-Connecting-IP') || 'unknown';
    const rateLimit = await checkRateLimit(
      c.env.CATALOG_CACHE,
      `${clientIP}:newsletter`,
      5,    // 5 requests
      3600  // per hour (3600 seconds)
    );

    if (!rateLimit.allowed) {
      return c.json({
        error: 'Too many requests. Please try again later.',
        retryAfter: 3600,
      }, 429);
    }

    const body = await c.req.json<{ email: string; source?: string }>();
    const { email, source = 'footer' } = body;

    // Validate email
    if (!email || typeof email !== 'string') {
      return c.json({ error: 'Email is required' }, 400);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return c.json({ error: 'Invalid email format' }, 400);
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if already subscribed
    const db = c.env.DB;
    const existing = await db
      .prepare('SELECT id, active FROM newsletter_subscribers WHERE email = ?')
      .bind(normalizedEmail)
      .first<{ id: number; active: number }>();

    if (existing) {
      // If they were unsubscribed, reactivate
      if (existing.active === 0) {
        await db
          .prepare('UPDATE newsletter_subscribers SET active = 1, subscribed_at = datetime(\'now\') WHERE id = ?')
          .bind(existing.id)
          .run();

        return c.json({
          success: true,
          message: 'Welcome back to the colony! 🐛',
        });
      }

      // Already subscribed and active
      return c.json({
        success: true,
        message: 'You\'re already part of the colony! 🐛',
      });
    }

    // Insert new subscriber
    await db
      .prepare('INSERT INTO newsletter_subscribers (email, source) VALUES (?, ?)')
      .bind(normalizedEmail, source)
      .run();

    return c.json({
      success: true,
      message: 'You\'ve joined the colony! 🐛',
    });
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    return c.json({ error: 'Failed to subscribe' }, 500);
  }
});

export default newsletter;
