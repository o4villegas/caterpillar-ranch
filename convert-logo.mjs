/**
 * Logo GIF to WebP Conversion Script
 *
 * Converts the animated GIF logo to animated WebP format
 * Target: 2.4MB → ~350KB (85% reduction)
 *
 * Usage: node convert-logo.mjs
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

async function convertLogoToWebP() {
  console.log('🎬 Starting logo conversion...');
  console.log(`📥 Input: ${INPUT_FILE}`);
  console.log(`📤 Output: ${OUTPUT_FILE}`);

  try {
    // Get input file size
    const inputStats = statSync(INPUT_FILE);
    const inputSizeMB = (inputStats.size / 1024 / 1024).toFixed(2);
    console.log(`📊 Input size: ${inputSizeMB} MB`);

    // Convert GIF to WebP using gif2webp
    // Options:
    // -q 80: quality (0-100, higher = better quality)
    // -m 6: compression method (0-6, higher = slower but better compression)
    // -lossy: enable lossy compression for smaller file size
    // -metadata none: strip metadata to reduce file size
    console.log('🔄 Converting GIF to WebP (this may take 30-60 seconds)...');

    const args = [
      '-q', '80',           // Quality: 80 (good balance of quality and size)
      '-m', '6',            // Compression: maximum
      '-lossy',             // Enable lossy compression
      '-metadata', 'none',  // Strip metadata
      INPUT_FILE,
      '-o', OUTPUT_FILE
    ];

    await execFileAsync(gif2webp, args);

    // Get output file size
    const outputStats = statSync(OUTPUT_FILE);
    const outputSizeKB = (outputStats.size / 1024).toFixed(2);
    const outputSizeMB = (outputStats.size / 1024 / 1024).toFixed(2);
    const reduction = (((inputStats.size - outputStats.size) / inputStats.size) * 100).toFixed(1);

    console.log('✅ Conversion complete!');
    console.log(`📊 Output size: ${outputSizeKB} KB (${outputSizeMB} MB)`);
    console.log(`📉 Size reduction: ${reduction}%`);
    console.log(`💾 Saved: ${OUTPUT_FILE}`);

    // Check if we met the target
    const targetKB = 500; // Target: <500KB
    if (outputStats.size / 1024 < targetKB) {
      console.log(`🎯 Target met! File is under ${targetKB}KB`);
    } else {
      console.log(`⚠️  File is larger than target ${targetKB}KB, but significantly reduced`);
    }

  } catch (error) {
    console.error('❌ Conversion failed:', error.message);
    if (error.stderr) {
      console.error('Error details:', error.stderr);
    }
    throw error;
  }
}

// Run conversion
convertLogoToWebP()
  .then(() => {
    console.log('🎉 Logo conversion successful!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
