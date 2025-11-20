/**
 * Bulk Design Upload Script
 *
 * Uploads product design images from local folder to R2 and updates D1.
 *
 * Usage:
 *   1. Place design images in ./designs/ folder
 *   2. Name files by product name (e.g., "Protest Tee.png", "Fear Tee.jpg")
 *   3. Run: npx tsx scripts/bulk-upload-designs.ts
 *
 * Requirements:
 *   - Admin authentication (provide admin_token via environment or .env)
 *   - Images must be PNG, JPG, or WebP (max 10MB each)
 */

import fs from 'fs';
import path from 'path';
import { FormData } from 'formdata-node';
import { fileFromPath } from 'formdata-node/file-from-path';

// Configuration
const DESIGNS_FOLDER = './designs';
const API_BASE_URL = process.env.API_URL || 'https://caterpillar-ranch.lando555.workers.dev';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';

interface Product {
  id: string;
  name: string;
  design_url: string | null;
}

interface UploadResult {
  filename: string;
  productName: string;
  productId: string;
  status: 'success' | 'error' | 'skipped';
  message?: string;
}

/**
 * Fetch all active products from API
 */
async function fetchProducts(): Promise<Product[]> {
  console.log('📡 Fetching products from database...');

  const response = await fetch(`${API_BASE_URL}/api/admin/products`, {
    headers: {
      'Authorization': `Bearer ${ADMIN_TOKEN}`,
      'Cookie': `admin_token=${ADMIN_TOKEN}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch products: ${response.status} ${response.statusText}`);
  }

  const data = await response.json() as { products: Product[] };
  // Return all products since API doesn't include design_url field
  return data.products;
}

/**
 * Normalize product name for matching (lowercase, remove special chars)
 */
function normalizeProductName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Match image filename to product by name (fuzzy matching)
 */
function matchProductByFilename(filename: string, products: Product[]): Product | null {
  // Remove file extension
  const nameWithoutExt = filename.replace(/\.(png|jpg|jpeg|webp)$/i, '');
  const normalized = normalizeProductName(nameWithoutExt);

  // Try exact match first
  for (const product of products) {
    if (normalizeProductName(product.name) === normalized) {
      return product;
    }
  }

  // Try partial match (filename contains product name or vice versa)
  for (const product of products) {
    const productNormalized = normalizeProductName(product.name);
    if (normalized.includes(productNormalized) || productNormalized.includes(normalized)) {
      return product;
    }
  }

  return null;
}

/**
 * Upload single design image to API
 */
async function uploadDesign(filePath: string, productId: string): Promise<void> {
  const formData = new FormData();
  // Explicitly set MIME type based on extension
  const ext = path.extname(filePath).toLowerCase();
  const mimeType = ext === '.png' ? 'image/png' : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'image/webp';
  const file = await fileFromPath(filePath, { type: mimeType });
  formData.append('file', file);
  formData.append('productId', productId);

  const response = await fetch(`${API_BASE_URL}/api/admin/designs/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ADMIN_TOKEN}`,
      'Cookie': `admin_token=${ADMIN_TOKEN}`,
    },
    body: formData as any,
  });

  if (!response.ok) {
    const errorData = await response.json() as { error?: string };
    throw new Error(errorData.error || `Upload failed: ${response.status}`);
  }
}

/**
 * Main bulk upload function
 */
async function bulkUpload() {
  console.log('🐛 Caterpillar Ranch - Bulk Design Upload\n');

  // Validate environment
  if (!ADMIN_TOKEN) {
    console.error('❌ Error: ADMIN_TOKEN not set');
    console.log('   Set via environment variable: export ADMIN_TOKEN="your-token"');
    console.log('   Or create .env file with: ADMIN_TOKEN=your-token');
    process.exit(1);
  }

  // Check designs folder exists
  if (!fs.existsSync(DESIGNS_FOLDER)) {
    console.error(`❌ Error: Designs folder not found: ${DESIGNS_FOLDER}`);
    console.log(`   Create folder and add images: mkdir ${DESIGNS_FOLDER}`);
    process.exit(1);
  }

  // Get image files from folder
  const files = fs.readdirSync(DESIGNS_FOLDER).filter(file =>
    /\.(png|jpg|jpeg|webp)$/i.test(file)
  );

  if (files.length === 0) {
    console.error(`❌ Error: No image files found in ${DESIGNS_FOLDER}`);
    console.log('   Add PNG, JPG, or WebP files to the folder');
    process.exit(1);
  }

  console.log(`📁 Found ${files.length} image files in ${DESIGNS_FOLDER}`);

  // Fetch products
  let products: Product[];
  try {
    products = await fetchProducts();
    console.log(`📦 Found ${products.length} products without designs\n`);
  } catch (error) {
    console.error('❌ Failed to fetch products:', error);
    process.exit(1);
  }

  // Process uploads
  const results: UploadResult[] = [];

  for (const filename of files) {
    const filePath = path.join(DESIGNS_FOLDER, filename);
    const fileSize = fs.statSync(filePath).size;
    const fileSizeMB = (fileSize / (1024 * 1024)).toFixed(2);

    console.log(`\n📸 Processing: ${filename} (${fileSizeMB} MB)`);

    // Validate file size
    if (fileSize > 10 * 1024 * 1024) {
      console.log(`   ⚠️  Skipped: File too large (max 10MB)`);
      results.push({
        filename,
        productName: '',
        productId: '',
        status: 'skipped',
        message: 'File too large (max 10MB)',
      });
      continue;
    }

    // Match to product
    const product = matchProductByFilename(filename, products);

    if (!product) {
      console.log(`   ⚠️  Skipped: No matching product found`);
      results.push({
        filename,
        productName: '',
        productId: '',
        status: 'skipped',
        message: 'No matching product found',
      });
      continue;
    }

    console.log(`   ✓ Matched to: ${product.name} (${product.id})`);

    // Upload
    try {
      await uploadDesign(filePath, product.id);
      console.log(`   ✓ Uploaded successfully`);
      results.push({
        filename,
        productName: product.name,
        productId: product.id,
        status: 'success',
      });
    } catch (error) {
      console.log(`   ✗ Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      results.push({
        filename,
        productName: product.name,
        productId: product.id,
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 UPLOAD SUMMARY\n');

  const success = results.filter(r => r.status === 'success').length;
  const errors = results.filter(r => r.status === 'error').length;
  const skipped = results.filter(r => r.status === 'skipped').length;

  console.log(`✓ Success: ${success}`);
  console.log(`✗ Errors:  ${errors}`);
  console.log(`⚠ Skipped: ${skipped}`);
  console.log(`─────────────────`);
  console.log(`  Total:   ${results.length}`);

  if (errors > 0) {
    console.log('\n❌ ERRORS:\n');
    results
      .filter(r => r.status === 'error')
      .forEach(r => {
        console.log(`   ${r.filename} → ${r.productName}`);
        console.log(`   └─ ${r.message}`);
      });
  }

  if (skipped > 0) {
    console.log('\n⚠️  SKIPPED:\n');
    results
      .filter(r => r.status === 'skipped')
      .forEach(r => {
        console.log(`   ${r.filename}`);
        console.log(`   └─ ${r.message}`);
      });
  }

  console.log('\n✨ Done!');
}

// Run script
bulkUpload().catch(error => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});
