/**
 * Aggressive Logo GIF to WebP Conversion Script
 *
 * Uses more aggressive compression settings to hit target size
 * Target: 2.4MB → ~350KB (85% reduction)
 *
 * Usage: node convert-logo-aggressive.mjs
 */

import { execFile } from 'child_process';
import { promisify } from 'util';
import { statSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import gif2webp from 'gif2webp-bin';

const execFileAsync = promisify(execFile);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const INPUT_FILE = join(__dirname, 'public', 'cr-logo.gif');
const OUTPUT_FILE = join(__dirname, 'public', 'cr-logo.webp');

async function convertLogoToWebP(quality) {
  console.log(`\n🔄 Attempting conversion with quality ${quality}...`);

  try {
    const args = [
      '-q', quality.toString(),  // Variable quality
      '-m', '6',                 // Maximum compression
      '-lossy',                  // Lossy compression
      '-metadata', 'none',       // Strip metadata
      '-f', '30',                // Reduce to 30 FPS (from original framerate)
      INPUT_FILE,
      '-o', OUTPUT_FILE
    ];

    await execFileAsync(gif2webp, args);

    // Get output file size
    const outputStats = statSync(OUTPUT_FILE);
    const outputSizeKB = (outputStats.size / 1024).toFixed(2);

    console.log(`   Output size: ${outputSizeKB} KB`);

    return outputStats.size;
  } catch (error) {
    console.error(`   ❌ Failed: ${error.message}`);
    return null;
  }
}

async function findOptimalQuality() {
  console.log('🎬 Finding optimal quality settings...');

  const inputStats = statSync(INPUT_FILE);
  const inputSizeMB = (inputStats.size / 1024 / 1024).toFixed(2);
  console.log(`📊 Input size: ${inputSizeMB} MB`);

  const targetKB = 500;
  console.log(`🎯 Target size: <${targetKB} KB`);

  // Try different quality levels
  const qualityLevels = [50, 40, 30, 25, 20];

  for (const quality of qualityLevels) {
    const size = await convertLogoToWebP(quality);

    if (size === null) continue;

    const sizeKB = size / 1024;

    if (sizeKB < targetKB) {
      const reduction = (((inputStats.size - size) / inputStats.size) * 100).toFixed(1);
      console.log(`\n✅ SUCCESS! Quality ${quality} meets target`);
      console.log(`📊 Final size: ${sizeKB.toFixed(2)} KB`);
      console.log(`📉 Size reduction: ${reduction}%`);
      return true;
    }
  }

  // If we didn't hit target, the last one is the smallest
  const finalStats = statSync(OUTPUT_FILE);
  const finalSizeKB = (finalStats.size / 1024).toFixed(2);
  const reduction = (((inputStats.size - finalStats.size) / inputStats.size) * 100).toFixed(1);

  console.log(`\n⚠️  Could not reach target with tested quality levels`);
  console.log(`📊 Best achieved: ${finalSizeKB} KB at quality ${qualityLevels[qualityLevels.length - 1]}`);
  console.log(`📉 Size reduction: ${reduction}%`);

  return false;
}

// Run conversion
findOptimalQuality()
  .then((success) => {
    if (success) {
      console.log('\n🎉 Logo conversion successful!');
      process.exit(0);
    } else {
      console.log('\n⚠️  Conversion complete but target not met');
      console.log('💡 Consider frame reduction for smaller file size');
      process.exit(0);
    }
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
