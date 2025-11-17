/**
 * Shared Printful Product Sync Logic
 *
 * Used by both:
 * - Scheduled cron job (daily at 2 AM UTC)
 * - Admin sync-all endpoint (manual trigger)
 */

import { PrintfulClient } from './printful';
import type { PrintfulStoreProduct } from './printful';

export interface SyncResult {
  added: number;
  updated: number;
  errors: string[];
  duration: string;
}

/**
 * Extract size and color from Printful variant data
 */
function extractSizeAndColor(
  variant: PrintfulStoreProduct['sync_variants'][0]
): { size: string; color: string } | null {
  const nameParts = variant.name.split(' / ');
  let rawSize: string;
  let color: string;

  if (nameParts.length === 3) {
    // Format: "Product / Color / Size"
    color = nameParts[1];
    rawSize = nameParts[2];
  } else if (nameParts.length === 2) {
    // Format: "Product / Size"
    const productNameMatch = variant.product.name.match(/\(([^/]+)\s*\/\s*[^)]+\)/);
    color = productNameMatch ? productNameMatch[1].trim() : 'Black';
    rawSize = nameParts[1];
  } else {
    return null;
  }

  // Map size
  const normalized = rawSize.trim().toUpperCase();
  let size: string | null = null;

  if (['S', 'M', 'L', 'XL', 'XXL'].includes(normalized)) {
    size = normalized;
  } else {
    const sizeMap: Record<string, string> = {
      'SMALL': 'S', 'MEDIUM': 'M', 'LARGE': 'L',
      'X-LARGE': 'XL', 'XLARGE': 'XL',
      '2XL': 'XXL', '2X': 'XXL', 'XX-LARGE': 'XXL', 'XXLARGE': 'XXL',
    };
    size = sizeMap[normalized] || null;
  }

  if (!size) return null;

  return { size, color };
}

/**
 * Sync all products from Printful to D1 database
 *
 * @param env - Cloudflare environment with DB, API tokens
 * @param logPrefix - Prefix for console logs (e.g., "[CRON]", "[API]")
 * @returns SyncResult with counts and errors
 */
export async function syncAllProducts(
  env: Cloudflare.Env,
  logPrefix: string = '[SYNC]'
): Promise<SyncResult> {
  const printful = new PrintfulClient(
    env.PRINTFUL_API_TOKEN,
    env.PRINTFUL_STORE_ID
  );

  const db = env.DB;
  const startTime = Date.now();
  let addedCount = 0;
  let updatedCount = 0;
  const errors: string[] = [];

  // Fetch all store products from Printful
  console.log(`${logPrefix} Fetching products from Printful...`);
  const storeProducts = await printful.getStoreProducts();
  console.log(`${logPrefix} Found ${storeProducts.length} products to sync`);

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

          // Sync variants using UPSERT pattern
          for (const variant of sync_variants) {
            if (!variant.synced || variant.is_ignored) continue;

            const extracted = extractSizeAndColor(variant);
            if (!extracted) continue;

            const { size, color } = extracted;
            const variantId = `${productId}-${size.toLowerCase()}-${variant.variant_id}`;

            // Use INSERT OR REPLACE to handle UNIQUE constraint on printful_variant_id
            // This allows the same Printful variant to be reused across different store products
            await db.prepare(`
              INSERT OR REPLACE INTO product_variants (
                id, product_id,
                size, color,
                printful_variant_id,
                in_stock,
                created_at, updated_at
              ) VALUES (
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                COALESCE((SELECT created_at FROM product_variants WHERE printful_variant_id = ?), datetime('now')),
                datetime('now')
              )
            `).bind(
              variantId,
              productId,
              size,
              color,
              variant.variant_id,
              1,
              variant.variant_id  // For COALESCE to preserve original created_at
            ).run();
          }
        } catch (error) {
          console.error(`${logPrefix} Failed to sync product ${item.id}:`, error);
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

  console.log(`${logPrefix} Sync completed in ${duration}s`);
  console.log(`${logPrefix} Added: ${addedCount}, Updated: ${updatedCount}, Errors: ${errors.length}`);

  if (errors.length > 0) {
    console.error(`${logPrefix} Errors during sync:`, errors);
  }

  return {
    added: addedCount,
    updated: updatedCount,
    errors,
    duration: `${duration}s`,
  };
}
