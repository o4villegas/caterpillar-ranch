/**
 * Contact Form API Routes
 *
 * Endpoints for customer contact submissions
 * POST /api/contact/submit - Submit contact form message
 */

import { Hono } from 'hono';
import { checkRateLimit } from '../lib/rateLimiter';

const contact = new Hono<{ Bindings: Cloudflare.Env }>();

const VALID_SUBJECTS = ['Order Issue', 'Product Question', 'Other'] as const;

/**
 * POST /api/contact/submit
 *
 * Submit contact form message
 *
 * Request body:
 *   { name: string, email: string, subject: string, message: string }
 *
 * Response:
 *   Success: { success: true, message: string }
 *   Error: { error: string }
 */
contact.post('/submit', async (c) => {
  try {
    // Rate limiting: 3 requests per hour per IP
    const clientIP = c.req.header('CF-Connecting-IP') || 'unknown';
    const rateLimit = await checkRateLimit(
      c.env.CATALOG_CACHE,
      `${clientIP}:contact`,
      3,    // 3 requests
      3600  // per hour (3600 seconds)
    );

    if (!rateLimit.allowed) {
      return c.json({
        error: 'Too many requests. Please try again later.',
        retryAfter: 3600,
      }, 429);
    }

    const body = await c.req.json<{
      name: string;
      email: string;
      subject: string;
      message: string;
    }>();

    const { name, email, subject, message } = body;

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return c.json({ error: 'Name is required' }, 400);
    }

    if (!email || typeof email !== 'string') {
      return c.json({ error: 'Email is required' }, 400);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return c.json({ error: 'Invalid email format' }, 400);
    }

    if (!subject || !VALID_SUBJECTS.includes(subject as any)) {
      return c.json({ error: 'Invalid subject' }, 400);
    }

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return c.json({ error: 'Message is required' }, 400);
    }

    // Length validation
    if (name.trim().length > 100) {
      return c.json({ error: 'Name is too long (max 100 characters)' }, 400);
    }

    if (message.trim().length > 2000) {
      return c.json({ error: 'Message is too long (max 2000 characters)' }, 400);
    }

    // Insert contact message
    const db = c.env.DB;
    await db
      .prepare(
        'INSERT INTO contact_messages (name, email, subject, message) VALUES (?, ?, ?, ?)'
      )
      .bind(name.trim(), email.toLowerCase().trim(), subject, message.trim())
      .run();

    return c.json({
      success: true,
      message: 'Message received! We\'ll respond to your inquiry soon. 🐛',
    });
  } catch (error) {
    console.error('Contact form submission error:', error);
    return c.json({ error: 'Failed to submit message' }, 500);
  }
});

export default contact;
