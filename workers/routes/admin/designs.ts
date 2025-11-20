/**
 * Admin Designs API Routes
 *
 * Handles admin-uploaded product design images
 * POST /api/admin/designs/upload - Upload design image
 * GET /api/admin/designs/:productId - Get design URL for product
 * GET /api/admin/designs/serve/:filename - Serve image from R2
 */

import { Hono } from 'hono';
import { requireAuth } from '../../lib/auth';

type Variables = {
  userId: number;
  userEmail: string;
};

const app = new Hono<{ Bindings: Cloudflare.Env; Variables: Variables }>();

/**
 * POST /api/admin/designs/upload
 *
 * Upload design image to R2 and save metadata to D1
 */
app.post('/upload', requireAuth, async (c) => {
  const userId = c.get('userId');

  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    const productId = formData.get('productId') as string;

    if (!file || !productId) {
      return c.json({ error: 'Missing file or productId' }, 400);
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return c.json({ error: 'File must be an image (PNG, JPG, WebP)' }, 400);
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return c.json({ error: 'File too large (max 10MB)' }, 400);
    }

    // Generate unique filename
    const ext = file.name.split('.').pop() || 'png';
    const timestamp = Date.now();
    const filename = `${productId}-${timestamp}.${ext}`;

    // Upload to R2
    await c.env.DESIGN_IMAGES.put(filename, file.stream(), {
      httpMetadata: {
        contentType: file.type,
      },
      customMetadata: {
        productId,
        uploadedBy: userId.toString(),
        originalFilename: file.name,
      },
    });

    // Save to D1
    const db = c.env.DB;
    await db
      .prepare(
        `INSERT INTO product_designs (product_id, design_url, created_by)
         VALUES (?, ?, ?)
         ON CONFLICT(product_id) DO UPDATE SET
           design_url = excluded.design_url,
           uploaded_at = CURRENT_TIMESTAMP,
           created_by = excluded.created_by`
      )
      .bind(productId, filename, userId)
      .run();

    return c.json({
      success: true,
      designUrl: `/api/admin/designs/serve/${filename}`,
      filename,
    });
  } catch (error) {
    console.error('Design upload failed:', error);
    return c.json({ error: 'Upload failed' }, 500);
  }
});

/**
 * GET /api/admin/designs/:productId
 *
 * Get design URL for a product
 */
app.get('/:productId', async (c) => {
  const productId = c.req.param('productId');
  const db = c.env.DB;

  try {
    const design = await db
      .prepare('SELECT design_url FROM product_designs WHERE product_id = ?')
      .bind(productId)
      .first<{ design_url: string }>();

    if (!design) {
      return c.json({ designUrl: null });
    }

    return c.json({
      designUrl: `/api/admin/designs/serve/${design.design_url}`,
      filename: design.design_url,
    });
  } catch (error) {
    console.error('Failed to fetch design:', error);
    return c.json({ error: 'Fetch failed' }, 500);
  }
});

/**
 * GET /api/admin/designs/serve/:filename
 *
 * Serve design image from R2
 * Public endpoint (no auth required for viewing)
 */
app.get('/serve/:filename', async (c) => {
  const filename = c.req.param('filename');

  try {
    const object = await c.env.DESIGN_IMAGES.get(filename);

    if (!object) {
      return c.notFound();
    }

    return new Response(object.body, {
      headers: {
        'Content-Type': object.httpMetadata?.contentType || 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'ETag': object.etag,
      },
    });
  } catch (error) {
    console.error('Failed to serve design:', error);
    return c.json({ error: 'Serve failed' }, 500);
  }
});

export default app;
