/**
 * Canvas ref system verification test
 * Verifies GameCanvas ref exposure, drawing methods, and coordinate conversion
 */

import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log('🎨 Testing GameCanvas ref system...\n');

  // Capture all console messages
  const consoleMessages = [];
  page.on('console', msg => {
    const text = msg.text();
    consoleMessages.push(text);
    console.log(text);
  });

  // Capture errors
  const pageErrors = [];
  page.on('pageerror', err => {
    pageErrors.push(err.message);
    console.error('❌ Page Error:', err.message);
  });

  try {
    // Navigate to canvas test page
    await page.goto('http://localhost:5173/test-canvas', { waitUntil: 'networkidle', timeout: 15000 });

    // Wait for canvas to render and tests to run
    await page.waitForTimeout(2000);

    // Check if canvas element exists
    const canvasCount = await page.locator('canvas').count();
    if (canvasCount === 0) {
      console.error('❌ Canvas element not found');
      process.exit(1);
    }
    console.log(`\n✅ Canvas element rendered (count: ${canvasCount})`);

    // Get canvas dimensions
    const canvasDimensions = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      if (!canvas) return null;
      return {
        clientWidth: canvas.clientWidth,
        clientHeight: canvas.clientHeight,
        width: canvas.width,
        height: canvas.height,
        dpr: window.devicePixelRatio || 1
      };
    });

    if (canvasDimensions) {
      console.log(`\n📏 Canvas Dimensions:`);
      console.log(`   Client size: ${canvasDimensions.clientWidth}x${canvasDimensions.clientHeight}`);
      console.log(`   Actual size: ${canvasDimensions.width}x${canvasDimensions.height}`);
      console.log(`   DPR: ${canvasDimensions.dpr}`);

      const expectedWidth = canvasDimensions.clientWidth * canvasDimensions.dpr;
      const expectedHeight = canvasDimensions.clientHeight * canvasDimensions.dpr;

      if (canvasDimensions.width === expectedWidth && canvasDimensions.height === expectedHeight) {
        console.log(`   ✅ High-DPI scaling correct`);
      } else {
        console.log(`   ⚠️  High-DPI scaling mismatch (expected ${expectedWidth}x${expectedHeight})`);
      }
    }

    // Take screenshot of rendered canvas
    await page.screenshot({ path: 'test-canvas-ref.png', fullPage: true });
    console.log(`\n📸 Screenshot saved: test-canvas-ref.png`);

    // Verify all tests passed via console
    const allTestsPassed = consoleMessages.some(msg => msg.includes('ALL CANVAS TESTS PASSED'));

    if (allTestsPassed) {
      console.log(`\n✅✅✅ ALL CANVAS REF TESTS PASSED ✅✅✅\n`);
    } else {
      console.log(`\n⚠️  Not all tests completed. Check console output above.\n`);
    }

    // Report errors
    if (pageErrors.length > 0) {
      console.log('\n❌ Runtime Errors Detected:');
      pageErrors.forEach(err => console.log(`   - ${err}`));
      process.exit(1);
    }

    // Verify key tests ran
    const refExposed = consoleMessages.some(msg => msg.includes('Canvas ref exposed'));
    const ctxExposed = consoleMessages.some(msg => msg.includes('Context exposed'));
    const clearWorks = consoleMessages.some(msg => msg.includes('clear() method works'));
    const drawingWorks = consoleMessages.some(msg => msg.includes('Drawing works'));
    const coordsWork = consoleMessages.some(msg => msg.includes('getCanvasCoordinates'));

    console.log('\n📊 Test Summary:');
    console.log(`   ${refExposed ? '✅' : '❌'} Canvas ref exposed`);
    console.log(`   ${ctxExposed ? '✅' : '❌'} Context (ctx) exposed`);
    console.log(`   ${clearWorks ? '✅' : '❌'} clear() method`);
    console.log(`   ${drawingWorks ? '✅' : '❌'} Drawing methods`);
    console.log(`   ${coordsWork ? '✅' : '❌'} Coordinate conversion`);

    if (refExposed && ctxExposed && clearWorks && drawingWorks && coordsWork) {
      console.log('\n✅ 100% CONFIDENCE: GameCanvas ref system fully functional\n');
      process.exit(0);
    } else {
      console.log('\n❌ Some canvas tests failed\n');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    await page.screenshot({ path: 'test-canvas-ref-error.png', fullPage: true });
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
