/**
 * Newsletter API Routes
 *
 * Endpoints for newsletter email collection
 * POST /api/newsletter/subscribe - Add email to subscriber list
 */

import { Hono } from 'hono';
import { checkRateLimit } from '../lib/rateLimiter';
import { sendWelcomeEmail } from '../lib/email';

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

    // Send welcome email (non-blocking - don't fail subscription if email fails)
    try {
      await sendWelcomeEmail(c.env, normalizedEmail);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Continue - subscription was successful even if email failed
    }

    return c.json({
      success: true,
      message: 'You\'ve joined the colony! 🐛',
    });
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    return c.json({ error: 'Failed to subscribe' }, 500);
  }
});

/**
 * GET /api/newsletter/unsubscribe
 *
 * Unsubscribe from newsletter (via email link)
 *
 * Query params:
 *   email: subscriber email (base64 encoded for URL safety)
 *
 * Response: HTML page confirming unsubscribe
 */
newsletter.get('/unsubscribe', async (c) => {
  try {
    const encodedEmail = c.req.query('email');

    if (!encodedEmail) {
      return c.html(`
        <html>
          <head><title>Unsubscribe - Caterpillar Ranch</title></head>
          <body style="background:#1a1a1a;color:#f4f0e6;font-family:sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;">
            <div style="text-align:center;max-width:400px;padding:20px;">
              <h1 style="color:#FF1493;">Invalid Link</h1>
              <p>This unsubscribe link is invalid or has expired.</p>
            </div>
          </body>
        </html>
      `);
    }

    // Decode email from base64
    let email: string;
    try {
      email = atob(encodedEmail).toLowerCase().trim();
    } catch {
      return c.html(`
        <html>
          <head><title>Unsubscribe - Caterpillar Ranch</title></head>
          <body style="background:#1a1a1a;color:#f4f0e6;font-family:sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;">
            <div style="text-align:center;max-width:400px;padding:20px;">
              <h1 style="color:#FF1493;">Invalid Link</h1>
              <p>This unsubscribe link is invalid or has expired.</p>
            </div>
          </body>
        </html>
      `);
    }

    const db = c.env.DB;

    // Find and deactivate subscriber
    const result = await db
      .prepare('UPDATE newsletter_subscribers SET active = 0 WHERE email = ? AND active = 1')
      .bind(email)
      .run();

    if (result.meta.changes === 0) {
      return c.html(`
        <html>
          <head><title>Unsubscribe - Caterpillar Ranch</title></head>
          <body style="background:#1a1a1a;color:#f4f0e6;font-family:sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;">
            <div style="text-align:center;max-width:400px;padding:20px;">
              <h1 style="color:#9B8FB5;">Already Unsubscribed</h1>
              <p>This email is not currently subscribed to our newsletter.</p>
              <a href="https://caterpillar-ranch.lando555.workers.dev" style="color:#00CED1;">Return to the Ranch</a>
            </div>
          </body>
        </html>
      `);
    }

    return c.html(`
      <html>
        <head><title>Unsubscribed - Caterpillar Ranch</title></head>
        <body style="background:#1a1a1a;color:#f4f0e6;font-family:sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;">
          <div style="text-align:center;max-width:400px;padding:20px;">
            <h1 style="color:#32CD32;">Successfully Unsubscribed</h1>
            <p style="color:#9B8FB5;">You've left the colony. We'll miss you! 🐛</p>
            <p style="margin-top:20px;color:#9B8FB5;">Changed your mind?</p>
            <a href="https://caterpillar-ranch.lando555.workers.dev" style="color:#00CED1;">Return to the Ranch</a>
          </div>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Unsubscribe error:', error);
    return c.html(`
      <html>
        <head><title>Error - Caterpillar Ranch</title></head>
        <body style="background:#1a1a1a;color:#f4f0e6;font-family:sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;">
          <div style="text-align:center;max-width:400px;padding:20px;">
            <h1 style="color:#FF1493;">Something went wrong</h1>
            <p>Please try again later or contact support.</p>
          </div>
        </body>
      </html>
    `);
  }
});

export default newsletter;
