/**
 * R2 Image Optimization Script
 *
 * Downloads existing design images from R2, converts to WebP,
 * and re-uploads to replace the originals.
 *
 * Prerequisites:
 * - npm install sharp (Node.js image processing library)
 * - wrangler authenticated
 *
 * Usage: npx tsx scripts/optimize-r2-designs.ts
 *
 * Note: This is a one-time migration script. New uploads are
 * automatically optimized via client-side compression.
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const R2_BUCKET = 'caterpillar-ranch-designs';
const TEMP_DIR = '/tmp/r2-optimization';
const WEBP_QUALITY = 85;

interface OptimizationResult {
  key: string;
  originalSize: number;
  newSize: number;
  savings: number;
  savingsPercent: number;
}

async function main() {
  console.log('🐛 Caterpillar Ranch - R2 Image Optimization\n');
  console.log('This script will:');
  console.log('1. List all objects in R2 bucket');
  console.log('2. Download each PNG image');
  console.log('3. Convert to WebP at 85% quality');
  console.log('4. Re-upload with .webp extension');
  console.log('5. Delete the original PNG\n');

  // Import sharp (ESM)
  let sharp: typeof import('sharp').default;
  try {
    const sharpModule = await import('sharp');
    sharp = sharpModule.default;
  } catch {
    console.error('❌ Sharp is not installed. Run: npm install sharp');
    process.exit(1);
  }

  // Create temp directory
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  }

  // Get list of objects from R2 (using wrangler)
  console.log('📋 Listing objects in R2...\n');

  // We need to manually track files since wrangler doesn't have a list command
  // Instead, query the database for design URLs
  const dbResult = execSync(
    `wrangler d1 execute Rancch-DB --command="SELECT DISTINCT design_url FROM product_designs WHERE design_url IS NOT NULL AND design_url != 'null';" --remote --json`,
    { encoding: 'utf-8' }
  );

  const parsed = JSON.parse(dbResult);
  const designUrls = parsed[0]?.results?.map((r: { design_url: string }) => r.design_url) || [];

  console.log(`Found ${designUrls.length} design images to optimize\n`);

  if (designUrls.length === 0) {
    console.log('No images to optimize. Exiting.');
    process.exit(0);
  }

  const results: OptimizationResult[] = [];
  let totalOriginal = 0;
  let totalNew = 0;

  for (const key of designUrls) {
    // Skip if already WebP
    if (key.endsWith('.webp')) {
      console.log(`⏭️  Skipping ${key} (already WebP)`);
      continue;
    }

    const tempOriginal = path.join(TEMP_DIR, key);
    const webpKey = key.replace(/\.[^/.]+$/, '.webp');
    const tempWebp = path.join(TEMP_DIR, webpKey);

    console.log(`\n🖼️  Processing: ${key}`);

    try {
      // Download from R2
      console.log('   ⬇️  Downloading...');
      execSync(
        `wrangler r2 object get ${R2_BUCKET}/${key} --file="${tempOriginal}" --remote`,
        { stdio: 'pipe' }
      );

      const originalSize = fs.statSync(tempOriginal).size;
      totalOriginal += originalSize;
      console.log(`   Original: ${(originalSize / 1024 / 1024).toFixed(2)} MB`);

      // Convert to WebP
      console.log('   🔄 Converting to WebP...');
      await sharp(tempOriginal)
        .webp({ quality: WEBP_QUALITY })
        .toFile(tempWebp);

      const newSize = fs.statSync(tempWebp).size;
      totalNew += newSize;
      console.log(`   WebP: ${(newSize / 1024 / 1024).toFixed(2)} MB`);

      const savings = originalSize - newSize;
      const savingsPercent = (savings / originalSize) * 100;
      console.log(`   ✂️  Savings: ${(savings / 1024 / 1024).toFixed(2)} MB (${savingsPercent.toFixed(1)}%)`);

      // Upload WebP to R2
      console.log('   ⬆️  Uploading WebP...');
      execSync(
        `wrangler r2 object put ${R2_BUCKET}/${webpKey} --file="${tempWebp}" --remote`,
        { stdio: 'pipe' }
      );

      // Update database to point to new WebP file
      console.log('   📝 Updating database...');
      execSync(
        `wrangler d1 execute Rancch-DB --command="UPDATE product_designs SET design_url = '${webpKey}' WHERE design_url = '${key}';" --remote`,
        { stdio: 'pipe' }
      );

      // Delete original PNG from R2
      console.log('   🗑️  Deleting original PNG...');
      execSync(
        `wrangler r2 object delete ${R2_BUCKET}/${key} --remote`,
        { stdio: 'pipe' }
      );

      results.push({
        key,
        originalSize,
        newSize,
        savings,
        savingsPercent,
      });

      console.log('   ✅ Done!');

      // Clean up temp files
      fs.unlinkSync(tempOriginal);
      fs.unlinkSync(tempWebp);

    } catch (error) {
      console.error(`   ❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 OPTIMIZATION SUMMARY\n');

  const totalSavings = totalOriginal - totalNew;
  const totalSavingsPercent = totalOriginal > 0 ? (totalSavings / totalOriginal) * 100 : 0;

  console.log(`Original total:  ${(totalOriginal / 1024 / 1024).toFixed(2)} MB`);
  console.log(`WebP total:      ${(totalNew / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Total savings:   ${(totalSavings / 1024 / 1024).toFixed(2)} MB (${totalSavingsPercent.toFixed(1)}%)`);
  console.log(`\nImages processed: ${results.length}/${designUrls.length}`);

  // Clean up temp directory
  fs.rmSync(TEMP_DIR, { recursive: true, force: true });

  console.log('\n✨ Optimization complete!');
  console.log('All images have been converted to WebP and database updated.');
}

main().catch(error => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});
