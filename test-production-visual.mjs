#!/usr/bin/env node
/**
 * Production Visual Testing Script
 *
 * Tests the production site with headed Playwright and captures screenshots
 * for visual verification.
 *
 * Usage: node test-production-visual.mjs
 */

import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const PRODUCTION_URL = 'https://caterpillar-ranch.lando555.workers.dev';
const SCREENSHOT_DIR = 'test-screenshots-production';

// Ensure screenshot directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

console.log('🎭 Starting Production Visual Testing...\n');
console.log(`📍 URL: ${PRODUCTION_URL}`);
console.log(`📸 Screenshots: ${SCREENSHOT_DIR}/\n`);

async function runVisualTests() {
  // Launch browser in headless mode (WSL2 doesn't support headed without X11)
  const browser = await chromium.launch({
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  });

  const page = await context.newPage();

  try {
    console.log('Test 1: Homepage Initial Load');
    console.log('━'.repeat(50));

    // Navigate to homepage
    await page.goto(PRODUCTION_URL, { waitUntil: 'networkidle' });
    console.log('✅ Page loaded');

    // Wait for animations to settle
    await page.waitForTimeout(2000);

    // Screenshot 1: Full homepage
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '01-homepage-full.png'),
      fullPage: true,
    });
    console.log('📸 Screenshot: 01-homepage-full.png');

    // Screenshot 2: Above the fold
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '02-homepage-atf.png'),
    });
    console.log('📸 Screenshot: 02-homepage-atf.png\n');

    console.log('Test 2: Logo and Header');
    console.log('━'.repeat(50));

    // Check if logo is visible
    const logo = await page.locator('img[alt*="Caterpillar Ranch"]').first();
    const isLogoVisible = await logo.isVisible();
    console.log(`Logo visible: ${isLogoVisible ? '✅' : '❌'}`);

    // Screenshot 3: Logo closeup
    await logo.screenshot({
      path: path.join(SCREENSHOT_DIR, '03-logo-closeup.png'),
    });
    console.log('📸 Screenshot: 03-logo-closeup.png\n');

    console.log('Test 3: Product Grid');
    console.log('━'.repeat(50));

    // Count product cards
    const productCards = await page.locator('.card').all();
    console.log(`Product cards found: ${productCards.length} ${productCards.length === 4 ? '✅' : '❌'}`);

    // Screenshot 4: First product card
    if (productCards.length > 0) {
      await productCards[0].screenshot({
        path: path.join(SCREENSHOT_DIR, '04-product-card-punk.png'),
      });
      console.log('📸 Screenshot: 04-product-card-punk.png');
    }

    // Test hover state
    console.log('\n🖱️  Testing hover state...');
    await productCards[0].hover();
    await page.waitForTimeout(500);
    await productCards[0].screenshot({
      path: path.join(SCREENSHOT_DIR, '05-product-card-hover.png'),
    });
    console.log('📸 Screenshot: 05-product-card-hover.png\n');

    console.log('Test 4: Cart Icon');
    console.log('━'.repeat(50));

    // Find cart icon
    const cartIcon = await page.locator('button[aria-label*="Shopping cart"]').first();
    const isCartVisible = await cartIcon.isVisible();
    console.log(`Cart icon visible: ${isCartVisible ? '✅' : '❌'}`);

    // Screenshot 5: Cart icon
    await cartIcon.screenshot({
      path: path.join(SCREENSHOT_DIR, '06-cart-icon.png'),
    });
    console.log('📸 Screenshot: 06-cart-icon.png\n');

    console.log('Test 5: Open Product Modal');
    console.log('━'.repeat(50));

    // Click first "View Details" button
    const viewDetailsButton = await page.locator('button:has-text("View Details")').first();
    await viewDetailsButton.click();
    console.log('✅ Clicked "View Details"');

    // Wait for modal to appear
    await page.waitForTimeout(1000);

    // Screenshot 6: Product modal
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '07-product-modal.png'),
    });
    console.log('📸 Screenshot: 07-product-modal.png');

    // Check modal title
    const modalTitle = await page.locator('h3:has-text("Caterpillar Ranch")').first();
    const isModalVisible = await modalTitle.isVisible();
    console.log(`Modal visible: ${isModalVisible ? '✅' : '❌'}`);

    // Screenshot 7: Size selector
    const sizeSelector = await page.locator('label:has-text("Choose Your Offering Size")').first();
    if (await sizeSelector.isVisible()) {
      const sizeContainer = await sizeSelector.locator('..').first();
      await sizeContainer.screenshot({
        path: path.join(SCREENSHOT_DIR, '08-size-selector.png'),
      });
      console.log('📸 Screenshot: 08-size-selector.png');
    }

    // Select a size
    console.log('\n🖱️  Testing size selection...');
    const sizeButton = await page.locator('button:has-text("M")').first();
    await sizeButton.click();
    await page.waitForTimeout(300);
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '09-size-selected.png'),
    });
    console.log('📸 Screenshot: 09-size-selected.png\n');

    console.log('Test 6: Game Modal');
    console.log('━'.repeat(50));

    // Click "Play Game" button
    const playGameButton = await page.locator('button:has-text("Play Game")').first();
    if (await playGameButton.isVisible()) {
      await playGameButton.click();
      console.log('✅ Clicked "Play Game"');
      await page.waitForTimeout(1000);

      // Screenshot 10: Game modal
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, '10-game-modal.png'),
      });
      console.log('📸 Screenshot: 10-game-modal.png');

      // Check for 6 games
      const gameButtons = await page.locator('button:has-text("The Culling"), button:has-text("Cursed Harvest"), button:has-text("Bug Telegram"), button:has-text("Hungry Caterpillar"), button:has-text("Midnight Garden"), button:has-text("Metamorphosis")').all();
      console.log(`Game options found: ${gameButtons.length} ${gameButtons.length === 6 ? '✅' : '❌'}`);

      // Close game modal
      const skipButton = await page.locator('button:has-text("Skip")').first();
      await skipButton.click();
      await page.waitForTimeout(500);
    } else {
      console.log('⚠️  Play Game button not visible (might be disabled)');
    }

    console.log('\nTest 7: Add to Cart');
    console.log('━'.repeat(50));

    // Click "Claim Your Harvest" button
    const addToCartButton = await page.locator('button:has-text("Claim Your Harvest")').first();
    if (await addToCartButton.isVisible()) {
      await addToCartButton.click();
      console.log('✅ Clicked "Claim Your Harvest"');

      // Wait for loading state
      await page.waitForTimeout(500);

      // Screenshot 11: Loading state
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, '11-add-to-cart-loading.png'),
      });
      console.log('📸 Screenshot: 11-add-to-cart-loading.png');

      // Wait for toast notification
      await page.waitForTimeout(1500);

      // Screenshot 12: Toast notification
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, '12-toast-notification.png'),
      });
      console.log('📸 Screenshot: 12-toast-notification.png');
    }

    // Wait for modal to close
    await page.waitForTimeout(1000);

    console.log('\nTest 8: Cart with Items');
    console.log('━'.repeat(50));

    // Screenshot 13: Cart icon with badge
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '13-cart-icon-with-items.png'),
    });
    console.log('📸 Screenshot: 13-cart-icon-with-items.png');

    // Click cart icon
    const cartButton = await page.locator('button[aria-label*="Shopping cart"]').first();
    await cartButton.click();
    await page.waitForTimeout(1000);

    // Screenshot 14: Cart drawer
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '14-cart-drawer.png'),
    });
    console.log('📸 Screenshot: 14-cart-drawer.png');

    // Check cart drawer title
    const cartTitle = await page.locator('text="Your Order is Growing"').first();
    const isCartDrawerVisible = await cartTitle.isVisible();
    console.log(`Cart drawer visible: ${isCartDrawerVisible ? '✅' : '❌'}`);

    console.log('\nTest 9: Environmental Horror Elements');
    console.log('━'.repeat(50));

    // Close cart drawer
    const closeButton = await page.locator('button:has-text("Continue Shopping")').first();
    if (await closeButton.isVisible()) {
      await closeButton.click();
      await page.waitForTimeout(500);
    }

    // Wait for night sky stars to render
    await page.waitForTimeout(2000);

    // Screenshot 15: Full page with environmental effects
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '15-environmental-horror.png'),
      fullPage: true,
    });
    console.log('📸 Screenshot: 15-environmental-horror.png');

    // Check for night sky
    const nightSky = await page.locator('div[style*="opacity:0.6"]').first();
    const hasNightSky = await nightSky.isVisible();
    console.log(`Night sky present: ${hasNightSky ? '✅' : '❌'}`);

    // Check for barn light
    const barnLight = await page.locator('.barn-light').first();
    const hasBarnLight = await barnLight.isVisible();
    console.log(`Barn light present: ${hasBarnLight ? '✅' : '❌'}`);

    // Check for garden shadows
    const gardenShadows = await page.locator('.garden-shadows').first();
    const hasGardenShadows = await gardenShadows.isVisible();
    console.log(`Garden shadows present: ${hasGardenShadows ? '✅' : '❌'}`);

    console.log('\nTest 10: Mobile Responsive');
    console.log('━'.repeat(50));

    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);

    // Screenshot 16: Mobile homepage
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '16-mobile-homepage.png'),
      fullPage: true,
    });
    console.log('📸 Screenshot: 16-mobile-homepage.png');

    // Open product modal on mobile
    const mobileViewDetails = await page.locator('button:has-text("View Details")').first();
    await mobileViewDetails.click();
    await page.waitForTimeout(1000);

    // Screenshot 17: Mobile product drawer
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '17-mobile-product-drawer.png'),
    });
    console.log('📸 Screenshot: 17-mobile-product-drawer.png\n');

    console.log('✅ All visual tests complete!');
    console.log(`\n📁 Screenshots saved to: ${SCREENSHOT_DIR}/`);
    console.log('\n📊 Summary:');
    console.log(`   Total screenshots: 17`);
    console.log(`   Components tested: 10`);
    console.log(`   Interactive tests: 5`);

  } catch (error) {
    console.error('\n❌ Error during testing:', error.message);

    // Take error screenshot
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'error-state.png'),
    });
    console.log('📸 Error screenshot saved');

    throw error;
  } finally {
    await browser.close();
    console.log('\n🎭 Browser closed');
  }
}

// Run tests
runVisualTests().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
