/**
 * PNG Optimization Script
 *
 * Optimizes design images to reduce file size while maintaining quality.
 * Uses lossless PNG compression.
 *
 * Usage: npx tsx scripts/optimize-designs.ts
 */

import fs from 'fs';
import path from 'path';
import imagemin from 'imagemin';
import imageminOptipng from 'imagemin-optipng';

const DESIGNS_FOLDER = './designs';
const OPTIMIZED_FOLDER = './designs-optimized';

interface OptimizationResult {
  filename: string;
  originalSize: number;
  optimizedSize: number;
  savings: number;
  savingsPercent: number;
}

async function optimizeImages() {
  console.log('🐛 Caterpillar Ranch - PNG Optimization\n');

  // Create output folder
  if (!fs.existsSync(OPTIMIZED_FOLDER)) {
    fs.mkdirSync(OPTIMIZED_FOLDER, { recursive: true });
  }

  // Get all PNG files
  const files = fs.readdirSync(DESIGNS_FOLDER).filter(file =>
    /\.png$/i.test(file)
  );

  console.log(`📁 Found ${files.length} PNG files in ${DESIGNS_FOLDER}\n`);

  const results: OptimizationResult[] = [];
  let totalOriginal = 0;
  let totalOptimized = 0;

  for (const filename of files) {
    const filePath = path.join(DESIGNS_FOLDER, filename);
    const originalSize = fs.statSync(filePath).size;
    totalOriginal += originalSize;

    console.log(`🖼️  Processing: ${filename}`);
    console.log(`   Original size: ${(originalSize / (1024 * 1024)).toFixed(2)} MB`);

    try {
      // Optimize with optipng
      const optimizedFiles = await imagemin([filePath], {
        destination: OPTIMIZED_FOLDER,
        plugins: [
          imageminOptipng({
            optimizationLevel: 2 // 0-7, higher = slower but smaller
          })
        ]
      });

      if (optimizedFiles.length === 0) {
        console.log(`   ⚠️  Optimization failed - no output`);
        continue;
      }

      const optimizedPath = path.join(OPTIMIZED_FOLDER, filename);
      const optimizedSize = fs.statSync(optimizedPath).size;
      totalOptimized += optimizedSize;

      const savings = originalSize - optimizedSize;
      const savingsPercent = (savings / originalSize) * 100;

      results.push({
        filename,
        originalSize,
        optimizedSize,
        savings,
        savingsPercent
      });

      console.log(`   Optimized size: ${(optimizedSize / (1024 * 1024)).toFixed(2)} MB`);
      console.log(`   ✓ Saved: ${(savings / (1024 * 1024)).toFixed(2)} MB (${savingsPercent.toFixed(1)}%)\n`);
    } catch (error) {
      console.log(`   ✗ Error: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
    }
  }

  // Print summary
  console.log('='.repeat(60));
  console.log('📊 OPTIMIZATION SUMMARY\n');

  const totalSavings = totalOriginal - totalOptimized;
  const totalSavingsPercent = (totalSavings / totalOriginal) * 100;

  console.log(`Original total:  ${(totalOriginal / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`Optimized total: ${(totalOptimized / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`Total savings:   ${(totalSavings / (1024 * 1024)).toFixed(2)} MB (${totalSavingsPercent.toFixed(1)}%)`);
  console.log(`\nFiles processed: ${results.length}/${files.length}`);

  if (results.length > 0) {
    console.log('\n✨ Optimized images saved to:', OPTIMIZED_FOLDER);
    console.log('\nNext steps:');
    console.log('1. Review optimized images to ensure quality');
    console.log('2. If satisfied, replace original files:');
    console.log(`   rm -rf ${DESIGNS_FOLDER}/*.png`);
    console.log(`   mv ${OPTIMIZED_FOLDER}/*.png ${DESIGNS_FOLDER}/`);
    console.log('3. Re-run bulk upload script to update production');
  }
}

optimizeImages().catch(error => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});
