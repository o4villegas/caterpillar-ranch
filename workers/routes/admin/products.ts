/**
 * Admin Products Management API
 *
 * Endpoints:
 * - GET    /api/admin/products          - List products (paginated, searchable, filterable)
 * - GET    /api/admin/products/:id      - Get single product with variants
 * - POST   /api/admin/products/:id/toggle-status - Toggle active/hidden status
 * - POST   /api/admin/products/:id/sync - Sync single product from Printful
 * - POST   /api/admin/products/sync-all - Batch sync all products with progress
 * - POST   /api/admin/products/bulk-action - Bulk hide/show/sync
 * - POST   /api/admin/products/:id/reorder - Move product up/down in display order
 */

import { Hono } from 'hono';
import { requireAuth } from '../../lib/auth';

const products = new Hono<{ Bindings: Env }>();

// All routes require authentication
products.use('*', requireAuth);

/**
 * Helper: Map Printful size to our database size constraints
 * Database allows: 'S', 'M', 'L', 'XL', 'XXL'
 */
function mapSize(printfulSize: string): string | null {
  const normalized = printfulSize.trim().toUpperCase();

  // Direct matches
  if (['S', 'M', 'L', 'XL', 'XXL'].includes(normalized)) {
    return normalized;
  }

  // Common variations
  const sizeMap: Record<string, string> = {
    'SMALL': 'S',
    'MEDIUM': 'M',
    'LARGE': 'L',
    'X-LARGE': 'XL',
    'XLARGE': 'XL',
    '2XL': 'XXL',
    '2X': 'XXL',
    'XX-LARGE': 'XXL',
    'XXLARGE': 'XXL',
  };

  if (sizeMap[normalized]) {
    return sizeMap[normalized];
  }

  // XS (extra small) not supported - skip this variant
  if (normalized === 'XS' || normalized === 'EXTRA SMALL' || normalized === 'X-SMALL') {
    return null;
  }

  // 3XL, 4XL, 5XL not supported - skip these variants
  if (normalized.match(/^[3-9]X/) || normalized.match(/^XXX/)) {
    return null;
  }

  console.warn(`Unknown size from Printful: "${printfulSize}" - skipping variant`);
  return null;
}

/**
 * GET /api/admin/products
 *
 * List products with pagination, search, and filters
 *
 * Query params:
 * - search: string (search by name or Printful ID)
 * - status: 'all' | 'active' | 'hidden'
 * - page: number (default: 1)
 * - limit: number (default: 20, max: 100)
 */
products.get('/', async (c) => {
  const db = c.env.DB;

  // Parse query parameters
  const search = c.req.query('search') || '';
  const status = c.req.query('status') || 'all';
  const page = parseInt(c.req.query('page') || '1', 10);
  const limit = Math.min(parseInt(c.req.query('limit') || '20', 10), 100);
  const offset = (page - 1) * limit;

  try {
    // Build WHERE clause
    const whereConditions: string[] = [];
    const params: any[] = [];

    if (status !== 'all') {
      whereConditions.push('status = ?');
      params.push(status);
    }

    if (search) {
      whereConditions.push('(name LIKE ? OR CAST(printful_product_id AS TEXT) LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    const whereClause = whereConditions.length > 0
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM products ${whereClause}`;
    const countResult = await db.prepare(countQuery).bind(...params).first<{ total: number }>();
    const total = countResult?.total || 0;

    // Get paginated products
    const query = `
      SELECT
        id, name, slug,
        printful_product_id,
        base_price, retail_price,
        image_url,
        status,
        printful_synced_at,
        display_order,
        created_at,
        updated_at
      FROM products
      ${whereClause}
      ORDER BY display_order ASC NULLS LAST, created_at DESC
      LIMIT ? OFFSET ?
    `;

    const productsResult = await db.prepare(query)
      .bind(...params, limit, offset)
      .all();

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
    console.error('Failed to fetch products:', error);
    return c.json(
      { error: 'Failed to fetch products', details: error instanceof Error ? error.message : 'Unknown error' },
      500
    );
  }
});

/**
 * GET /api/admin/products/:id
 *
 * Get single product with all variants
 */
products.get('/:id', async (c) => {
  const db = c.env.DB;
  const productId = c.req.param('id');

  try {
    // Get product
    const productResult = await db.prepare(`
      SELECT
        id, name, slug, description,
        printful_product_id,
        base_price, retail_price,
        image_url, tags,
        status, published_at,
        printful_synced_at,
        display_order,
        created_at, updated_at
      FROM products
      WHERE id = ?
    `).bind(productId).first();

    if (!productResult) {
      return c.json({ error: 'Product not found' }, 404);
    }

    // Get variants
    const variantsResult = await db.prepare(`
      SELECT
        id, product_id,
        size, color,
        printful_variant_id,
        in_stock,
        created_at, updated_at
      FROM product_variants
      WHERE product_id = ?
      ORDER BY size ASC
    `).bind(productId).all();

    return c.json({
      product: productResult,
      variants: variantsResult.results || [],
    });
  } catch (error) {
    console.error('Failed to fetch product:', error);
    return c.json(
      { error: 'Failed to fetch product', details: error instanceof Error ? error.message : 'Unknown error' },
      500
    );
  }
});

/**
 * POST /api/admin/products/:id/toggle-status
 *
 * Toggle product status between active/hidden
 *
 * Body: { status: 'active' | 'hidden' }
 */
products.post('/:id/toggle-status', async (c) => {
  const db = c.env.DB;
  const productId = c.req.param('id');

  try {
    const body = await c.req.json<{ status: string }>();
    const newStatus = body.status;

    // Validate status
    if (!['active', 'hidden'].includes(newStatus)) {
      return c.json({ error: 'Invalid status. Must be "active" or "hidden"' }, 400);
    }

    // Update product status
    const result = await db.prepare(`
      UPDATE products
      SET status = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(newStatus, productId).run();

    if (result.meta.changes === 0) {
      return c.json({ error: 'Product not found' }, 404);
    }

    // Get updated product
    const updatedProduct = await db.prepare(`
      SELECT id, name, status, updated_at
      FROM products
      WHERE id = ?
    `).bind(productId).first();

    return c.json({
      success: true,
      product: updatedProduct,
    });
  } catch (error) {
    console.error('Failed to toggle product status:', error);
    return c.json(
      { error: 'Failed to toggle status', details: error instanceof Error ? error.message : 'Unknown error' },
      500
    );
  }
});

/**
 * POST /api/admin/products/:id/sync
 *
 * Sync single product from Printful API
 * Fetches latest data (name, price, variants) and updates D1
 */
products.post('/:id/sync', async (c) => {
  const db = c.env.DB;
  const productId = c.req.param('id');

  try {
    // Get current product to find Printful ID
    const currentProduct = await db.prepare(`
      SELECT printful_product_id
      FROM products
      WHERE id = ?
    `).bind(productId).first<{ printful_product_id: number }>();

    if (!currentProduct) {
      return c.json({ error: 'Product not found' }, 404);
    }

    // Import Printful client
    const { PrintfulClient } = await import('../../lib/printful');
    const printful = new PrintfulClient(
      c.env.PRINTFUL_API_TOKEN,
      c.env.PRINTFUL_STORE_ID
    );

    // Fetch from Printful
    const printfulProduct = await printful.getStoreProduct(currentProduct.printful_product_id);

    if (!printfulProduct || !printfulProduct.sync_product) {
      return c.json({ error: 'Failed to fetch product from Printful' }, 500);
    }

    const { sync_product, sync_variants } = printfulProduct;

    // Generate slug from name
    const slug = sync_product.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Extract tags from name
    const tags = JSON.stringify(['apparel']);

    // Calculate base price from first variant
    const basePrice = sync_variants.length > 0
      ? parseFloat(sync_variants[0].retail_price)
      : 0;

    // Update product in D1
    await db.prepare(`
      UPDATE products
      SET
        name = ?,
        slug = ?,
        base_price = ?,
        image_url = ?,
        tags = ?,
        printful_synced_at = datetime('now'),
        updated_at = datetime('now')
      WHERE id = ?
    `).bind(
      sync_product.name,
      slug,
      basePrice,
      sync_product.thumbnail_url,
      tags,
      productId
    ).run();

    // Delete existing variants
    await db.prepare(`
      DELETE FROM product_variants
      WHERE product_id = ?
    `).bind(productId).run();

    // Insert new variants
    for (const variant of sync_variants) {
      if (!variant.synced || variant.is_ignored) continue;

      // Extract size and color from variant name
      // Format: "Product Name / Color / Size" (e.g., "Resistance Tee / Black / S")
      const nameParts = variant.name.split(' / ');
      const rawSize = nameParts.length >= 3 ? nameParts[2] : 'M';  // Size is at index 2
      const color = nameParts.length >= 2 ? nameParts[1] : 'Black';  // Color is at index 1
      const size = mapSize(rawSize);

      // Skip variants with unsupported sizes
      if (!size) {
        console.warn(`Skipping variant ${variant.variant_id} - unsupported size: "${rawSize}"`);
        continue;
      }

      const variantId = `${productId}-${size.toLowerCase()}-${variant.variant_id}`;

      await db.prepare(`
        INSERT INTO product_variants (
          id, product_id,
          size, color,
          printful_variant_id,
          in_stock,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `).bind(
        variantId,
        productId,
        size,
        color,  // Use extracted color from variant name
        variant.variant_id,
        1 // Default to in stock (stock sync omitted in MVP)
      ).run();
    }

    // Get updated product
    const updatedProduct = await db.prepare(`
      SELECT
        id, name, base_price, printful_synced_at, updated_at
      FROM products
      WHERE id = ?
    `).bind(productId).first();

    return c.json({
      success: true,
      product: updatedProduct,
      changes: ['name', 'price', 'variants'],
    });
  } catch (error) {
    console.error('Failed to sync product:', error);
    return c.json(
      { error: 'Failed to sync product', details: error instanceof Error ? error.message : 'Unknown error' },
      500
    );
  }
});

/**
 * POST /api/admin/products/sync-all
 *
 * Sync all products from Printful catalog
 * Uses streaming for progress updates (Phase 3 MVP: simple batch processing)
 */
products.post('/sync-all', async (c) => {
  const db = c.env.DB;

  try {
    // Import Printful client
    const { PrintfulClient } = await import('../../lib/printful');
    const printful = new PrintfulClient(
      c.env.PRINTFUL_API_TOKEN,
      c.env.PRINTFUL_STORE_ID
    );

    const startTime = Date.now();
    let addedCount = 0;
    let updatedCount = 0;
    const errors: string[] = [];

    // Fetch all store products from Printful
    const storeProducts = await printful.getStoreProducts();

    // Process products in batches of 10 (rate limiting: 500ms delay between batches)
    const batchSize = 10;
    for (let i = 0; i < storeProducts.length; i += batchSize) {
      const batch = storeProducts.slice(i, i + batchSize);

      // Process batch in parallel
      await Promise.all(
        batch.map(async (item) => {
          try {
            // Fetch full product details
            const fullProduct = await printful.getStoreProduct(item.id);

            if (!fullProduct || !fullProduct.sync_product) {
              errors.push(`Failed to fetch product ${item.id}`);
              return;
            }

            const { sync_product, sync_variants } = fullProduct;

            // Generate ID and slug
            const productId = `cr-${sync_product.id}`;
            const slug = sync_product.name
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-|-$/g, '');

            const tags = JSON.stringify(['apparel']);
            const basePrice = sync_variants.length > 0
              ? parseFloat(sync_variants[0].retail_price)
              : 0;

            // Check if product exists
            const existingProduct = await db.prepare(`
              SELECT id FROM products WHERE id = ?
            `).bind(productId).first();

            if (existingProduct) {
              // Update existing product
              await db.prepare(`
                UPDATE products
                SET
                  name = ?,
                  slug = ?,
                  base_price = ?,
                  image_url = ?,
                  tags = ?,
                  printful_synced_at = datetime('now'),
                  updated_at = datetime('now')
                WHERE id = ?
              `).bind(
                sync_product.name,
                slug,
                basePrice,
                sync_product.thumbnail_url,
                tags,
                productId
              ).run();

              updatedCount++;
            } else {
              // Insert new product (auto-publish: status='active')
              // New products get display_order = NULL (sorted last)
              await db.prepare(`
                INSERT INTO products (
                  id, name, slug, description,
                  base_price, retail_price,
                  printful_product_id,
                  image_url, tags,
                  status, published_at,
                  printful_synced_at,
                  display_order,
                  created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'), NULL, datetime('now'), datetime('now'))
              `).bind(
                productId,
                sync_product.name,
                slug,
                `A unique design from Caterpillar Ranch. ${sync_product.name}`,
                basePrice,
                null,
                sync_product.id,
                sync_product.thumbnail_url,
                tags,
                'active'
              ).run();

              addedCount++;
            }

            // Delete existing variants
            await db.prepare(`
              DELETE FROM product_variants WHERE product_id = ?
            `).bind(productId).run();

            // Insert variants
            for (const variant of sync_variants) {
              if (!variant.synced || variant.is_ignored) continue;

              // Extract size and color from variant name
              // Format: "Product Name / Color / Size" (e.g., "Resistance Tee / Black / S")
              const nameParts = variant.name.split(' / ');
              const rawSize = nameParts.length >= 3 ? nameParts[2] : 'M';  // Size is at index 2
              const color = nameParts.length >= 2 ? nameParts[1] : 'Black';  // Color is at index 1
              const size = mapSize(rawSize);

              // Skip variants with unsupported sizes
              if (!size) {
                console.warn(`Skipping variant ${variant.variant_id} - unsupported size: "${rawSize}"`);
                continue;
              }

              const variantId = `${productId}-${size.toLowerCase()}-${variant.variant_id}`;

              await db.prepare(`
                INSERT INTO product_variants (
                  id, product_id,
                  size, color,
                  printful_variant_id,
                  in_stock,
                  created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
              `).bind(
                variantId,
                productId,
                size,
                color,  // Use extracted color from variant name
                variant.variant_id,
                1
              ).run();
            }
          } catch (error) {
            console.error(`Failed to sync product ${item.id}:`, error);
            errors.push(`Product ${item.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        })
      );

      // Rate limiting: 500ms delay between batches
      if (i + batchSize < storeProducts.length) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    return c.json({
      success: true,
      results: {
        added: addedCount,
        updated: updatedCount,
        errors,
        duration: `${duration}s`,
      },
    });
  } catch (error) {
    console.error('Failed to sync all products:', error);
    return c.json(
      { error: 'Failed to sync products', details: error instanceof Error ? error.message : 'Unknown error' },
      500
    );
  }
});

/**
 * POST /api/admin/products/bulk-action
 *
 * Perform bulk action on selected products
 *
 * Body: {
 *   action: 'hide' | 'show' | 'sync'
 *   productIds: string[]
 * }
 */
products.post('/bulk-action', async (c) => {
  const db = c.env.DB;

  try {
    const body = await c.req.json<{ action: string; productIds: string[] }>();
    const { action, productIds } = body;

    if (!action || !productIds || !Array.isArray(productIds)) {
      return c.json({ error: 'Invalid request. Requires action and productIds array' }, 400);
    }

    if (productIds.length === 0) {
      return c.json({ error: 'No products selected' }, 400);
    }

    const succeeded: string[] = [];
    const failed: Array<{ id: string; error: string }> = [];

    if (action === 'hide' || action === 'show') {
      const newStatus = action === 'hide' ? 'hidden' : 'active';

      for (const productId of productIds) {
        try {
          const result = await db.prepare(`
            UPDATE products
            SET status = ?, updated_at = datetime('now')
            WHERE id = ?
          `).bind(newStatus, productId).run();

          if (result.meta.changes > 0) {
            succeeded.push(productId);
          } else {
            failed.push({ id: productId, error: 'Product not found' });
          }
        } catch (error) {
          failed.push({
            id: productId,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
    } else if (action === 'sync') {
      // Sync each product individually
      // Import Printful client
      const { PrintfulClient } = await import('../../lib/printful');
      const printful = new PrintfulClient(
        c.env.PRINTFUL_API_TOKEN,
        c.env.PRINTFUL_STORE_ID
      );

      for (const productId of productIds) {
        try {
          // Get Printful ID
          const product = await db.prepare(`
            SELECT printful_product_id FROM products WHERE id = ?
          `).bind(productId).first<{ printful_product_id: number }>();

          if (!product) {
            failed.push({ id: productId, error: 'Product not found' });
            continue;
          }

          // Fetch and update (same logic as individual sync)
          const printfulProduct = await printful.getStoreProduct(product.printful_product_id);

          if (!printfulProduct || !printfulProduct.sync_product) {
            failed.push({ id: productId, error: 'Failed to fetch from Printful' });
            continue;
          }

          const { sync_product, sync_variants } = printfulProduct;

          const slug = sync_product.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');

          const basePrice = sync_variants.length > 0
            ? parseFloat(sync_variants[0].retail_price)
            : 0;

          await db.prepare(`
            UPDATE products
            SET
              name = ?,
              slug = ?,
              base_price = ?,
              image_url = ?,
              printful_synced_at = datetime('now'),
              updated_at = datetime('now')
            WHERE id = ?
          `).bind(
            sync_product.name,
            slug,
            basePrice,
            sync_product.thumbnail_url,
            productId
          ).run();

          succeeded.push(productId);
        } catch (error) {
          failed.push({
            id: productId,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }

        // Rate limiting: 500ms delay between syncs
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    } else {
      return c.json({ error: 'Invalid action. Must be "hide", "show", or "sync"' }, 400);
    }

    return c.json({
      success: true,
      results: {
        succeeded,
        failed,
      },
    });
  } catch (error) {
    console.error('Failed to perform bulk action:', error);
    return c.json(
      { error: 'Failed to perform bulk action', details: error instanceof Error ? error.message : 'Unknown error' },
      500
    );
  }
});

/**
 * POST /api/admin/products/:id/reorder
 *
 * Move product up or down in display order
 *
 * Body: { direction: 'up' | 'down' }
 */
products.post('/:id/reorder', async (c) => {
  const db = c.env.DB;
  const productId = c.req.param('id');

  try {
    const body = await c.req.json<{ direction: string }>();
    const direction = body.direction;

    if (!['up', 'down'].includes(direction)) {
      return c.json({ error: 'Invalid direction. Must be "up" or "down"' }, 400);
    }

    // Get current product's display_order
    const currentProduct = await db.prepare(`
      SELECT id, display_order
      FROM products
      WHERE id = ?
    `).bind(productId).first<{ id: string; display_order: number | null }>();

    if (!currentProduct) {
      return c.json({ error: 'Product not found' }, 404);
    }

    const currentOrder = currentProduct.display_order;

    // If product has no display_order yet, assign one
    if (currentOrder === null) {
      // Get max display_order
      const maxOrder = await db.prepare(`
        SELECT MAX(display_order) as max_order FROM products
      `).first<{ max_order: number | null }>();

      const newOrder = (maxOrder?.max_order || 0) + 1;

      await db.prepare(`
        UPDATE products
        SET display_order = ?, updated_at = datetime('now')
        WHERE id = ?
      `).bind(newOrder, productId).run();

      return c.json({
        success: true,
        message: 'Product assigned display order',
        products: [{ id: productId, display_order: newOrder }],
      });
    }

    // Find adjacent product
    let adjacentProduct;

    if (direction === 'up') {
      // Find product with next lower display_order
      adjacentProduct = await db.prepare(`
        SELECT id, display_order
        FROM products
        WHERE display_order < ?
        ORDER BY display_order DESC
        LIMIT 1
      `).bind(currentOrder).first<{ id: string; display_order: number }>();
    } else {
      // Find product with next higher display_order
      adjacentProduct = await db.prepare(`
        SELECT id, display_order
        FROM products
        WHERE display_order > ?
        ORDER BY display_order ASC
        LIMIT 1
      `).bind(currentOrder).first<{ id: string; display_order: number }>();
    }

    if (!adjacentProduct) {
      return c.json({
        success: false,
        message: direction === 'up' ? 'Already at top' : 'Already at bottom',
      });
    }

    // Swap display_order values
    const adjacentOrder = adjacentProduct.display_order;

    await db.prepare(`
      UPDATE products
      SET display_order = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(adjacentOrder, productId).run();

    await db.prepare(`
      UPDATE products
      SET display_order = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(currentOrder, adjacentProduct.id).run();

    return c.json({
      success: true,
      products: [
        { id: productId, display_order: adjacentOrder },
        { id: adjacentProduct.id, display_order: currentOrder },
      ],
    });
  } catch (error) {
    console.error('Failed to reorder product:', error);
    return c.json(
      { error: 'Failed to reorder product', details: error instanceof Error ? error.message : 'Unknown error' },
      500
    );
  }
});

export default products;
