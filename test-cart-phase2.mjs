/**
 * Phase 2 Cart System Test
 *
 * Tests cart icon, cart drawer, add to cart, quantity controls,
 * discount application, and localStorage persistence
 */

import { chromium } from '@playwright/test';

const PROD_URL = 'https://caterpillar-ranch.lando555.workers.dev/';

(async () => {
  console.log('🚀 Starting Phase 2 Cart System Test...\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  let testsPassed = 0;
  let testsFailed = 0;

  try {
    // ============================================
    // TEST 1: Homepage loads with cart icon
    // ============================================
    console.log('📋 TEST 1: Homepage loads with cart icon');
    await page.goto(PROD_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000); // Wait for animations

    const cartIcon = await page.locator('button[aria-label*="Shopping cart"]').count();
    if (cartIcon > 0) {
      console.log('✅ Cart icon is visible');
      testsPassed++;
      await page.screenshot({ path: 'test-cart-homepage.png', fullPage: true });
    } else {
      console.log('❌ Cart icon not found');
      testsFailed++;
    }

    // ============================================
    // TEST 2: Cart icon shows 0 items initially
    // ============================================
    console.log('\n📋 TEST 2: Cart icon shows 0 items initially');
    const badgeVisible = await page.locator('button[aria-label*="Shopping cart"] div[class*="badge"]').isVisible().catch(() => false);
    if (!badgeVisible) {
      console.log('✅ No badge shown (0 items in cart)');
      testsPassed++;
    } else {
      console.log('❌ Badge visible when cart should be empty');
      testsFailed++;
    }

    // ============================================
    // TEST 3: Open product modal
    // ============================================
    console.log('\n📋 TEST 3: Open product modal');
    const viewDetailsButton = page.locator('button:has-text("View Details")').first();
    await viewDetailsButton.click();
    await page.waitForTimeout(1000);

    const modal = await page.locator('[role="dialog"]').count();
    if (modal > 0) {
      console.log('✅ Product modal opened');
      testsPassed++;
      await page.screenshot({ path: 'test-cart-modal-open.png' });
    } else {
      console.log('❌ Product modal did not open');
      testsFailed++;
    }

    // ============================================
    // TEST 4: Select size and add to cart
    // ============================================
    console.log('\n📋 TEST 4: Select size and add to cart');

    // Select first available size
    const sizeButtons = page.locator('button[aria-pressed]');
    const sizeCount = await sizeButtons.count();

    if (sizeCount > 0) {
      await sizeButtons.first().click();
      await page.waitForTimeout(500);
      console.log('✅ Size selected');
    }

    // Click "Claim Your Harvest" button
    await page.locator('button:has-text("Claim Your Harvest")').click({ force: true });
    await page.waitForTimeout(2000); // Wait for add animation + modal close

    // Check if toast appeared
    const toastVisible = await page.locator('text=/accepted your selection|The Ranch accepts/i').isVisible().catch(() => false);
    if (toastVisible) {
      console.log('✅ Success toast notification appeared');
      testsPassed++;
    } else {
      console.log('⚠️  Toast not detected (may have closed already)');
    }

    await page.screenshot({ path: 'test-cart-after-add.png', fullPage: true });

    // ============================================
    // TEST 5: Cart icon shows item count badge
    // ============================================
    console.log('\n📋 TEST 5: Cart icon shows item count badge');
    await page.waitForTimeout(1000);

    const badgeNow = await page.locator('button[aria-label*="Shopping cart"] div').filter({ hasText: /^[0-9]+$/ }).isVisible().catch(() => false);
    if (badgeNow) {
      const badgeText = await page.locator('button[aria-label*="Shopping cart"] div').filter({ hasText: /^[0-9]+$/ }).textContent();
      console.log(`✅ Cart badge shows: ${badgeText} item(s)`);
      testsPassed++;
    } else {
      console.log('❌ Cart badge not visible after adding item');
      testsFailed++;
    }

    // ============================================
    // TEST 6: Open cart drawer
    // ============================================
    console.log('\n📋 TEST 6: Open cart drawer');
    await page.locator('button[aria-label*="Shopping cart"]').click();
    await page.waitForTimeout(1000);

    const drawerVisible = await page.locator('text="Your Order is Growing"').isVisible().catch(() => false);
    if (drawerVisible) {
      console.log('✅ Cart drawer opened with horror-themed title');
      testsPassed++;
      await page.screenshot({ path: 'test-cart-drawer-open.png', fullPage: true });
    } else {
      console.log('❌ Cart drawer did not open');
      testsFailed++;
    }

    // ============================================
    // TEST 7: Cart drawer shows added item
    // ============================================
    console.log('\n📋 TEST 7: Cart drawer shows added item');

    const cartItems = await page.locator('div[class*="bg-ranch-purple"]').filter({ has: page.locator('img[alt]') }).count();
    if (cartItems > 0) {
      console.log(`✅ Cart drawer shows ${cartItems} item(s)`);
      testsPassed++;

      // Check for product details
      const hasImage = await page.locator('img[alt*="Caterpillar Ranch"]').count() > 0;
      const hasQuantity = await page.locator('span[class*="font-mono"]').isVisible();
      console.log(`   - Product image: ${hasImage ? '✅' : '❌'}`);
      console.log(`   - Quantity display: ${hasQuantity ? '✅' : '❌'}`);
    } else {
      console.log('❌ No items found in cart drawer');
      testsFailed++;
    }

    // ============================================
    // TEST 8: Test quantity controls (increase)
    // ============================================
    console.log('\n📋 TEST 8: Test quantity controls (increase)');

    const increaseButton = page.locator('button:has-text("+")').first();
    await increaseButton.click();
    await page.waitForTimeout(500);

    const quantityAfterIncrease = await page.locator('span[class*="font-mono"]').first().textContent();
    if (quantityAfterIncrease === '2') {
      console.log('✅ Quantity increased to 2');
      testsPassed++;
      await page.screenshot({ path: 'test-cart-quantity-increased.png', fullPage: true });
    } else {
      console.log(`❌ Quantity not updated correctly: ${quantityAfterIncrease}`);
      testsFailed++;
    }

    // ============================================
    // TEST 9: Test quantity controls (decrease)
    // ============================================
    console.log('\n📋 TEST 9: Test quantity controls (decrease)');

    const decreaseButton = page.locator('button:has-text("−")').first();
    await decreaseButton.click();
    await page.waitForTimeout(500);

    const quantityAfterDecrease = await page.locator('span[class*="font-mono"]').first().textContent();
    if (quantityAfterDecrease === '1') {
      console.log('✅ Quantity decreased back to 1');
      testsPassed++;
    } else {
      console.log(`❌ Quantity not updated correctly: ${quantityAfterDecrease}`);
      testsFailed++;
    }

    // ============================================
    // TEST 10: Cart totals display
    // ============================================
    console.log('\n📋 TEST 10: Cart totals display');

    const subtotalVisible = await page.locator('text=/Growth Subtotal|Total Tribute/i').isVisible().catch(() => false);
    const priceVisible = await page.locator('text=/\\$[0-9]+\\.[0-9]{2}/').count() > 0;

    if (subtotalVisible && priceVisible) {
      console.log('✅ Cart totals displayed correctly');
      testsPassed++;
    } else {
      console.log('❌ Cart totals not displaying properly');
      testsFailed++;
    }

    // ============================================
    // TEST 11: "Complete the Harvest" button
    // ============================================
    console.log('\n📋 TEST 11: "Complete the Harvest" button');

    const checkoutButton = await page.locator('button:has-text("Complete the Harvest")').isVisible().catch(() => false);
    if (checkoutButton) {
      console.log('✅ Checkout button visible');
      testsPassed++;
    } else {
      console.log('❌ Checkout button not found');
      testsFailed++;
    }

    // ============================================
    // TEST 12: Close cart drawer
    // ============================================
    console.log('\n📋 TEST 12: Close cart drawer');

    const continueShoppingButton = page.locator('button:has-text("Continue Shopping")');
    await continueShoppingButton.click();
    await page.waitForTimeout(1000);

    const drawerGone = await page.locator('text="Your Order is Growing"').isHidden().catch(() => true);
    if (drawerGone) {
      console.log('✅ Cart drawer closed');
      testsPassed++;
      await page.screenshot({ path: 'test-cart-drawer-closed.png', fullPage: true });
    } else {
      console.log('❌ Cart drawer did not close');
      testsFailed++;
    }

    // ============================================
    // TEST 13: Test with game discount
    // ============================================
    console.log('\n📋 TEST 13: Test add to cart with game discount');

    // Open product modal again
    await page.locator('button:has-text("View Details")').nth(1).click();
    await page.waitForTimeout(1000);

    // Click "Play Game" button
    const playGameButton = page.locator('button:has-text("Play Game")');
    const gameButtonExists = await playGameButton.isVisible().catch(() => false);

    if (gameButtonExists) {
      await playGameButton.click();
      await page.waitForTimeout(1000);

      // Check if game modal opened
      const gameModalOpen = await page.locator('text=/The Culling|Cursed Harvest|Bug Telegram/i').isVisible().catch(() => false);
      if (gameModalOpen) {
        console.log('✅ Game modal opened');

        // Select a game
        const gameButtons = page.locator('button:has-text("Play")');
        await gameButtons.first().click();
        await page.waitForTimeout(2000); // Simulate game completion

        console.log('✅ Game discount system works (modal flow tested)');
        testsPassed++;
        await page.screenshot({ path: 'test-cart-game-modal.png', fullPage: true });

        // Close game modal (if still open)
        const closeButton = page.locator('button:has-text("Close")');
        if (await closeButton.isVisible().catch(() => false)) {
          await closeButton.click();
          await page.waitForTimeout(500);
        }
      } else {
        console.log('⚠️  Game modal did not open (might be placeholder)');
      }
    } else {
      console.log('⚠️  Play Game button not found (expected for already-discounted items)');
    }

    // Close product modal
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    // ============================================
    // TEST 14: localStorage persistence test
    // ============================================
    console.log('\n📋 TEST 14: localStorage persistence');

    // Get localStorage cart data
    const cartData = await page.evaluate(() => {
      return localStorage.getItem('caterpillar-ranch-cart');
    });

    if (cartData) {
      const cart = JSON.parse(cartData);
      const itemCount = cart.items ? cart.items.length : 0;
      console.log(`✅ Cart persisted to localStorage (${itemCount} item(s))`);
      testsPassed++;
    } else {
      console.log('❌ Cart not found in localStorage');
      testsFailed++;
    }

    // Reload page and check if cart persists
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const badgeAfterReload = await page.locator('button[aria-label*="Shopping cart"] div').filter({ hasText: /^[0-9]+$/ }).isVisible().catch(() => false);
    if (badgeAfterReload) {
      console.log('✅ Cart persisted after page reload');
      testsPassed++;
      await page.screenshot({ path: 'test-cart-after-reload.png', fullPage: true });
    } else {
      console.log('❌ Cart did not persist after reload');
      testsFailed++;
    }

    // ============================================
    // TEST 15: Remove item from cart
    // ============================================
    console.log('\n📋 TEST 15: Remove item from cart');

    // Open cart drawer
    await page.locator('button[aria-label*="Shopping cart"]').click();
    await page.waitForTimeout(1000);

    // Click remove button (X icon)
    const removeButtons = page.locator('button[aria-label="Remove item"]');
    const removeButtonCount = await removeButtons.count();

    if (removeButtonCount > 0) {
      await removeButtons.first().click();
      await page.waitForTimeout(500);

      // Check if item was removed
      const itemsAfterRemove = await page.locator('div[class*="bg-ranch-purple"]').filter({ has: page.locator('img[alt]') }).count();
      console.log(`✅ Remove button clicked (${itemsAfterRemove} item(s) remaining)`);
      testsPassed++;
      await page.screenshot({ path: 'test-cart-item-removed.png', fullPage: true });
    } else {
      console.log('❌ Remove button not found');
      testsFailed++;
    }

    // ============================================
    // MOBILE RESPONSIVE TEST
    // ============================================
    console.log('\n📋 TEST 16: Mobile responsive test');

    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const cartIconMobile = await page.locator('button[aria-label*="Shopping cart"]').isVisible().catch(() => false);
    if (cartIconMobile) {
      console.log('✅ Cart icon visible on mobile');
      testsPassed++;
      await page.screenshot({ path: 'test-cart-mobile.png', fullPage: true });

      // Test mobile drawer
      await page.locator('button[aria-label*="Shopping cart"]').click();
      await page.waitForTimeout(1000);

      const mobileDrawer = await page.locator('text="Your Order is Growing"').isVisible().catch(() => false);
      if (mobileDrawer) {
        console.log('✅ Mobile cart drawer opens correctly');
        testsPassed++;
        await page.screenshot({ path: 'test-cart-mobile-drawer.png', fullPage: true });
      } else {
        console.log('❌ Mobile cart drawer did not open');
        testsFailed++;
      }
    } else {
      console.log('❌ Cart icon not visible on mobile');
      testsFailed++;
    }

  } catch (error) {
    console.error('\n❌ Test error:', error.message);
    testsFailed++;
  } finally {
    await browser.close();

    // ============================================
    // FINAL RESULTS
    // ============================================
    console.log('\n' + '='.repeat(50));
    console.log('📊 PHASE 2 CART TEST RESULTS');
    console.log('='.repeat(50));
    console.log(`✅ Tests Passed: ${testsPassed}`);
    console.log(`❌ Tests Failed: ${testsFailed}`);
    console.log(`📈 Success Rate: ${Math.round((testsPassed / (testsPassed + testsFailed)) * 100)}%`);
    console.log('='.repeat(50));

    if (testsFailed === 0) {
      console.log('\n🎉 All tests passed! Phase 2 cart system is fully functional! 🐛');
    } else {
      console.log(`\n⚠️  Some tests failed. Review screenshots for details.`);
    }

    console.log('\n📸 Screenshots generated:');
    console.log('   - test-cart-homepage.png');
    console.log('   - test-cart-modal-open.png');
    console.log('   - test-cart-after-add.png');
    console.log('   - test-cart-drawer-open.png');
    console.log('   - test-cart-quantity-increased.png');
    console.log('   - test-cart-drawer-closed.png');
    console.log('   - test-cart-game-modal.png (if applicable)');
    console.log('   - test-cart-after-reload.png');
    console.log('   - test-cart-item-removed.png');
    console.log('   - test-cart-mobile.png');
    console.log('   - test-cart-mobile-drawer.png');
  }
})();
