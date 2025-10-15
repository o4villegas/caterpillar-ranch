#!/usr/bin/env node
/**
 * Image Optimization Script
 *
 * Optimizes:
 * - Logo GIF: 2.4MB → <500KB (80% reduction)
 * - Product PNGs: Convert to WebP, keep PNG fallback
 *
 * Usage: node scripts/optimize-images.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import imagemin from 'imagemin';
import imageminGifsicle from 'imagemin-gifsicle';
import imageminWebP from 'imagemin-webp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

// File paths
const LOGO_SOURCE = path.join(projectRoot, 'DO-NOT-DELETE', 'cr-logo.gif');
const LOGO_DEST = path.join(projectRoot, 'public', 'cr-logo.gif');
const PRODUCTS_DIR = path.join(projectRoot, 'public', 'products');

// Helper: Format bytes to human-readable
function formatBytes(bytes) {
  return (bytes / 1024).toFixed(2) + ' KB';
}

// Helper: Get file size
function getFileSize(filePath) {
  return fs.statSync(filePath).size;
}

// Task 1: Optimize Logo GIF
async function optimizeLogoGIF() {
  console.log('\n🎨 Optimizing Logo GIF...');
  console.log(`Source: ${LOGO_SOURCE}`);

  const beforeSize = getFileSize(LOGO_SOURCE);
  console.log(`Before: ${formatBytes(beforeSize)} (${(beforeSize / 1024 / 1024).toFixed(2)} MB)`);

  // Create backup
  const backupPath = LOGO_DEST.replace('.gif', '.backup.gif');
  if (!fs.existsSync(backupPath)) {
    fs.copyFileSync(LOGO_DEST, backupPath);
    console.log(`✅ Backup created: ${path.basename(backupPath)}`);
  }

  // Optimize with gifsicle
  // Strategy: Reduce colors significantly and use optimization without lossy
  // (lossy mode can sometimes increase file size for certain GIFs)
  const files = await imagemin([LOGO_SOURCE], {
    destination: path.dirname(LOGO_DEST),
    plugins: [
      imageminGifsicle({
        optimizationLevel: 3,
        colors: 64, // Reduce from 256 to 64 colors (more aggressive)
        // Note: lossy compression removed - sometimes increases size
      })
    ]
  });

  const afterSize = getFileSize(LOGO_DEST);
  const reduction = ((beforeSize - afterSize) / beforeSize * 100).toFixed(1);

  console.log(`After: ${formatBytes(afterSize)} (${(afterSize / 1024 / 1024).toFixed(2)} MB)`);
  console.log(`✅ Reduced by ${reduction}% (${formatBytes(beforeSize - afterSize)} saved)`);

  if (afterSize > 500 * 1024) {
    console.warn(`⚠️  Still larger than 500KB target. Consider further optimization.`);
  } else {
    console.log(`🎉 Target achieved! <500KB`);
  }

  return { before: beforeSize, after: afterSize, reduction };
}

// Task 2: Convert Product PNGs to WebP
async function optimizeProductImages() {
  console.log('\n🖼️  Optimizing Product Images...');

  const pngFiles = fs.readdirSync(PRODUCTS_DIR)
    .filter(file => file.endsWith('.png'))
    .map(file => path.join(PRODUCTS_DIR, file));

  if (pngFiles.length === 0) {
    console.log('No PNG files found in products directory.');
    return [];
  }

  const results = [];

  for (const pngPath of pngFiles) {
    const fileName = path.basename(pngPath);
    const webpPath = pngPath.replace('.png', '.webp');

    console.log(`\n  Processing: ${fileName}`);

    const beforeSize = getFileSize(pngPath);
    console.log(`    PNG: ${formatBytes(beforeSize)}`);

    // Convert to WebP with Sharp (quality 85)
    await sharp(pngPath)
      .webp({ quality: 85, effort: 6 })
      .toFile(webpPath);

    const afterSize = getFileSize(webpPath);
    const reduction = ((beforeSize - afterSize) / beforeSize * 100).toFixed(1);

    console.log(`    WebP: ${formatBytes(afterSize)} (${reduction}% smaller)`);

    results.push({
      file: fileName,
      png: beforeSize,
      webp: afterSize,
      reduction
    });
  }

  return results;
}

// Task 3: Generate report
function generateReport(logoResult, productResults) {
  console.log('\n📊 OPTIMIZATION REPORT');
  console.log('='.repeat(60));

  console.log('\n📦 Logo GIF:');
  console.log(`  Before:    ${formatBytes(logoResult.before)}`);
  console.log(`  After:     ${formatBytes(logoResult.after)}`);
  console.log(`  Savings:   ${logoResult.reduction}%`);

  if (productResults.length > 0) {
    console.log('\n📦 Product Images:');
    let totalPngSize = 0;
    let totalWebPSize = 0;

    productResults.forEach(result => {
      console.log(`  ${result.file}:`);
      console.log(`    PNG:  ${formatBytes(result.png)}`);
      console.log(`    WebP: ${formatBytes(result.webp)} (${result.reduction}% smaller)`);

      totalPngSize += result.png;
      totalWebPSize += result.webp;
    });

    const totalReduction = ((totalPngSize - totalWebPSize) / totalPngSize * 100).toFixed(1);
    console.log(`\n  Total PNG size:  ${formatBytes(totalPngSize)}`);
    console.log(`  Total WebP size: ${formatBytes(totalWebPSize)}`);
    console.log(`  Total savings:   ${totalReduction}% (${formatBytes(totalPngSize - totalWebPSize)})`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Optimization complete!');
  console.log('\nNext steps:');
  console.log('1. Test the optimized logo: npm run dev');
  console.log('2. Update ProductModal to use WebP with PNG fallback');
  console.log('3. Measure performance improvement with Lighthouse');
  console.log('');
}

// Main execution
async function main() {
  console.log('🚀 Starting Image Optimization...');

  try {
    // Optimize logo GIF
    const logoResult = await optimizeLogoGIF();

    // Optimize product images
    const productResults = await optimizeProductImages();

    // Generate report
    generateReport(logoResult, productResults);

  } catch (error) {
    console.error('\n❌ Error during optimization:', error.message);
    process.exit(1);
  }
}

main();
