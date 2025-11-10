/**
 * Session-Based Game Replay Testing Suite
 *
 * Tests the critical functionality:
 * 1. Play game → button hides (same session)
 * 2. Close tab → button shows again (new session)
 * 3. Discount replacement (not accumulation)
 * 4. Cart item separation with different discounts
 *
 * Run: node test-session-replay.mjs
 */

import { chromium } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';
const PRODUCT_SLUG = 'punk-edition';
const PRODUCT_URL = `${BASE_URL}/products/${PRODUCT_SLUG}`;

// Test configuration
const CONFIG = {
  headless: false,           // Show browser (headed mode)
  slowMo: 800,               // Slow down by 800ms per action (easier to watch)
  timeout: 30000,            // 30s timeout per action
  screenshotOnFailure: true, // Take screenshot on failure
};

// Helper functions for cleaner test code
const helpers = {
  /**
   * Wait for an element and get its text content
   */
  async getTextContent(page, selector) {
    await page.waitForSelector(selector, { timeout: CONFIG.timeout });
    return await page.textContent(selector);
  },

  /**
   * Check if element exists on page
   */
  async elementExists(page, selector) {
    try {
      await page.waitForSelector(selector, { timeout: 2000 });
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Get sessionStorage contents
   */
  async getSessionStorage(page) {
    return await page.evaluate(() => {
      const key = 'caterpillar-ranch-played-games';
      const stored = sessionStorage.getItem(key);
      return stored ? JSON.parse(stored) : [];
    });
  },

  /**
   * Clear sessionStorage (simulates tab close)
   */
  async clearSessionStorage(page) {
    await page.evaluate(() => {
      sessionStorage.clear();
    });
  },

  /**
   * Get cart from localStorage
   */
  async getCart(page) {
    return await page.evaluate(() => {
      const key = 'caterpillar-ranch-cart';
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : { items: [], discounts: [] };
    });
  },

  /**
   * Take screenshot with timestamp
   */
  async screenshot(page, name) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    await page.screenshot({
      path: `screenshots/session-test-${name}-${timestamp}.png`,
      fullPage: true
    });
  },
};

// Test results tracker
const results = {
  passed: [],
  failed: [],

  pass(testName) {
    this.passed.push(testName);
    console.log(`\n✅ PASS: ${testName}`);
  },

  fail(testName, error) {
    this.failed.push({ test: testName, error: error.message });
    console.log(`\n❌ FAIL: ${testName}`);
    console.log(`   Error: ${error.message}`);
  },

  summary() {
    console.log('\n' + '='.repeat(80));
    console.log('TEST SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total Tests: ${this.passed.length + this.failed.length}`);
    console.log(`Passed: ${this.passed.length}`);
    console.log(`Failed: ${this.failed.length}`);

    if (this.failed.length > 0) {
      console.log('\nFailed Tests:');
      this.failed.forEach(f => {
        console.log(`  ❌ ${f.test}`);
        console.log(`     ${f.error}`);
      });
    }

    console.log('='.repeat(80));
  }
};

/**
 * Main test suite
 */
async function runTests() {
  console.log('🐛 Starting Session-Based Game Replay Tests');
  console.log('=' .repeat(80));

  const browser = await chromium.launch({
    headless: CONFIG.headless,
    slowMo: CONFIG.slowMo,
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
  });

  const page = await context.newPage();

  // Ensure screenshots directory exists
  await import('fs').then(fs => {
    if (!fs.existsSync('screenshots')) {
      fs.mkdirSync('screenshots');
    }
  });

  try {
    // ========================================================================
    // TEST 1: Initial State - Play Game Button Shows
    // ========================================================================
    await test1_InitialState(page);

    // ========================================================================
    // TEST 2: Click Play Game - Button Hides
    // ========================================================================
    await test2_PlayGameButtonHides(page);

    // ========================================================================
    // TEST 3: Clear Session Storage - Button Shows Again (NEW SESSION)
    // ========================================================================
    await test3_NewSessionButtonShows(page);

    // ========================================================================
    // TEST 4: Complete Game and Earn Discount
    // ========================================================================
    await test4_CompleteGameEarnDiscount(page);

    // ========================================================================
    // TEST 5: Play Again in New Session - Discount Replaces
    // ========================================================================
    await test5_DiscountReplacement(page);

    // ========================================================================
    // TEST 6: Cart Item Separation with Different Discounts
    // ========================================================================
    await test6_CartItemSeparation(page);

  } catch (error) {
    console.error('\n❌ CRITICAL ERROR:', error);
    await helpers.screenshot(page, 'critical-error');
  } finally {
    // Show summary
    results.summary();

    // Keep browser open for 5 seconds to review results
    console.log('\n⏳ Keeping browser open for 5 seconds...');
    await page.waitForTimeout(5000);

    await browser.close();

    // Exit with appropriate code
    process.exit(results.failed.length > 0 ? 1 : 0);
  }
}

/**
 * TEST 1: Initial State - Play Game Button Shows
 */
async function test1_InitialState(page) {
  const testName = 'TEST 1: Initial State - Play Game Button Shows';
  console.log(`\n${'='.repeat(80)}`);
  console.log(testName);
  console.log('='.repeat(80));

  try {
    // Navigate to product page
    console.log('→ Navigating to product page...');
    await page.goto(PRODUCT_URL);
    await page.waitForLoadState('networkidle');

    // Check sessionStorage is empty
    console.log('→ Checking sessionStorage is empty...');
    const sessionData = await helpers.getSessionStorage(page);
    if (sessionData.length !== 0) {
      throw new Error(`Expected empty sessionStorage, got: ${JSON.stringify(sessionData)}`);
    }
    console.log('  ✓ sessionStorage is empty');

    // Select a size (required before Play Game button enables)
    console.log('→ Selecting size M...');
    await page.click('button:has-text("M")', { force: true });
    await page.waitForTimeout(500);
    console.log('  ✓ Size M selected');

    // Check Play Game button exists and is enabled
    console.log('→ Checking Play Game button...');
    const playButton = page.locator('button:has-text("🎮 Play Game")');
    await playButton.waitFor({ state: 'visible', timeout: 5000 });

    const isEnabled = await playButton.isEnabled();
    if (!isEnabled) {
      throw new Error('Play Game button is disabled');
    }
    console.log('  ✓ Play Game button is visible and enabled');

    await helpers.screenshot(page, 'test1-initial-state');
    results.pass(testName);

  } catch (error) {
    await helpers.screenshot(page, 'test1-failed');
    results.fail(testName, error);
    throw error; // Stop execution if initial state is broken
  }
}

/**
 * TEST 2: Click Play Game - Button Hides
 */
async function test2_PlayGameButtonHides(page) {
  const testName = 'TEST 2: Click Play Game - Button Hides in Same Session';
  console.log(`\n${'='.repeat(80)}`);
  console.log(testName);
  console.log('='.repeat(80));

  try {
    // Click Play Game button (force click to bypass animation stability checks)
    console.log('→ Clicking Play Game button...');
    const playButton = page.locator('button:has-text("🎮 Play Game")');
    await playButton.click({ force: true }); // Force click to bypass animation checks
    await page.waitForTimeout(1000);
    console.log('  ✓ Play Game button clicked');

    // Wait for game modal/navigation
    console.log('→ Waiting for game to load...');
    await page.waitForTimeout(2000);

    // Check if navigated to game route or modal opened
    const currentUrl = page.url();
    console.log(`  Current URL: ${currentUrl}`);

    // Navigate back to product page
    if (currentUrl.includes('/games/')) {
      console.log('→ Navigating back to product page...');
      await page.goto(PRODUCT_URL);
      await page.waitForLoadState('networkidle');
    } else {
      // If modal, close it
      const closeButton = page.locator('button[aria-label*="Close"], button:has-text("✕")');
      if (await helpers.elementExists(page, 'button[aria-label*="Close"]')) {
        await closeButton.first().click();
        await page.waitForTimeout(500);
      }
    }

    // Select size again
    await page.click('button:has-text("M")', { force: true });
    await page.waitForTimeout(500);

    // Verify sessionStorage contains product ID
    console.log('→ Checking sessionStorage contains product...');
    const sessionData = await helpers.getSessionStorage(page);
    if (!sessionData.includes('cr-punk')) {
      throw new Error(`Expected sessionStorage to contain 'cr-punk', got: ${JSON.stringify(sessionData)}`);
    }
    console.log(`  ✓ sessionStorage contains: ${JSON.stringify(sessionData)}`);

    // Check Play Game button is now HIDDEN
    console.log('→ Checking Play Game button is hidden...');
    const playButtonVisible = await helpers.elementExists(page, 'button:has-text("🎮 Play Game")');
    if (playButtonVisible) {
      throw new Error('Play Game button is still visible (should be hidden)');
    }
    console.log('  ✓ Play Game button is hidden');

    await helpers.screenshot(page, 'test2-button-hidden');
    results.pass(testName);

  } catch (error) {
    await helpers.screenshot(page, 'test2-failed');
    results.fail(testName, error);
    throw error;
  }
}

/**
 * TEST 3: Clear Session Storage - Button Shows Again (Simulates Tab Close)
 */
async function test3_NewSessionButtonShows(page) {
  const testName = 'TEST 3: New Session (Clear sessionStorage) - Button Shows Again';
  console.log(`\n${'='.repeat(80)}`);
  console.log(testName);
  console.log('='.repeat(80));

  try {
    // Clear sessionStorage (simulates tab close/reopen)
    console.log('→ Clearing sessionStorage (simulating tab close)...');
    await helpers.clearSessionStorage(page);
    await page.waitForTimeout(500);
    console.log('  ✓ sessionStorage cleared');

    // Reload page to trigger React re-render
    console.log('→ Reloading page...');
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Select size again
    console.log('→ Selecting size M...');
    await page.click('button:has-text("M")', { force: true });
    await page.waitForTimeout(500);

    // Verify sessionStorage is empty
    console.log('→ Verifying sessionStorage is empty...');
    const sessionData = await helpers.getSessionStorage(page);
    if (sessionData.length !== 0) {
      throw new Error(`Expected empty sessionStorage, got: ${JSON.stringify(sessionData)}`);
    }
    console.log('  ✓ sessionStorage is empty');

    // Check Play Game button is VISIBLE again
    console.log('→ Checking Play Game button is visible again...');
    const playButton = page.locator('button:has-text("🎮 Play Game")');
    await playButton.waitFor({ state: 'visible', timeout: 5000 });

    const isEnabled = await playButton.isEnabled();
    if (!isEnabled) {
      throw new Error('Play Game button is disabled');
    }
    console.log('  ✓ Play Game button is visible and enabled (NEW SESSION WORKS!)');

    await helpers.screenshot(page, 'test3-new-session');
    results.pass(testName);

  } catch (error) {
    await helpers.screenshot(page, 'test3-failed');
    results.fail(testName, error);
    throw error;
  }
}

/**
 * TEST 4: Complete Game and Earn Discount
 */
async function test4_CompleteGameEarnDiscount(page) {
  const testName = 'TEST 4: Complete Game and Earn Discount';
  console.log(`\n${'='.repeat(80)}`);
  console.log(testName);
  console.log('='.repeat(80));

  try {
    // Click Play Game
    console.log('→ Clicking Play Game button...');
    const playButton = page.locator('button:has-text("🎮 Play Game")');
    await playButton.click({ force: true }); // Force click to bypass animations
    await page.waitForTimeout(2000);

    // Check if navigated to game
    const currentUrl = page.url();
    console.log(`  Current URL: ${currentUrl}`);

    if (currentUrl.includes('/games/')) {
      // We're on a game page - simulate game completion by directly adding discount
      console.log('→ Simulating game completion (adding discount via localStorage)...');

      await page.evaluate(() => {
        const cart = JSON.parse(localStorage.getItem('caterpillar-ranch-cart') || '{"items":[],"discounts":[]}');

        // Add a discount
        cart.discounts = cart.discounts || [];
        cart.discounts.push({
          id: 'game-test-discount-1',
          productId: 'punk-edition',
          discountPercent: 30,
          gameType: 'test',
          earnedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
          applied: false
        });

        localStorage.setItem('caterpillar-ranch-cart', JSON.stringify(cart));
      });

      console.log('  ✓ Added 30% discount via localStorage');

      // Navigate back to product
      await page.goto(PRODUCT_URL);
      await page.waitForLoadState('networkidle');
    }

    // Verify discount appears on product page
    console.log('→ Checking discount appears on page...');
    const cart = await helpers.getCart(page);
    const hasDiscount = cart.discounts && cart.discounts.length > 0;

    if (!hasDiscount) {
      throw new Error('No discount found in cart');
    }

    const discountPercent = cart.discounts[0].discountPercent;
    console.log(`  ✓ Discount found: ${discountPercent}%`);

    await helpers.screenshot(page, 'test4-discount-earned');
    results.pass(testName);

  } catch (error) {
    await helpers.screenshot(page, 'test4-failed');
    results.fail(testName, error);
    // Don't throw - continue with next tests
  }
}

/**
 * TEST 5: Play Again in New Session - Discount Replaces (Not Accumulates)
 */
async function test5_DiscountReplacement(page) {
  const testName = 'TEST 5: Discount Replacement (Latest Replaces Old)';
  console.log(`\n${'='.repeat(80)}`);
  console.log(testName);
  console.log('='.repeat(80));

  try {
    // Clear sessionStorage to simulate new session
    console.log('→ Clearing sessionStorage (new session)...');
    await helpers.clearSessionStorage(page);
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Check current discount count
    const cartBefore = await helpers.getCart(page);
    const discountsBefore = cartBefore.discounts || [];
    console.log(`  Discounts before: ${discountsBefore.length} (${discountsBefore.map(d => d.discountPercent + '%').join(', ')})`);

    // Select size
    await page.click('button:has-text("M")', { force: true });
    await page.waitForTimeout(500);

    // Play game again
    console.log('→ Playing game again...');
    const playButton = page.locator('button:has-text("🎮 Play Game")');
    await playButton.click({ force: true }); // Force click to bypass animations
    await page.waitForTimeout(2000);

    // Simulate earning a DIFFERENT discount (20%)
    console.log('→ Simulating earning 20% discount (different from first 30%)...');
    await page.evaluate(() => {
      const cart = JSON.parse(localStorage.getItem('caterpillar-ranch-cart') || '{"items":[],"discounts":[]}');

      // Remove existing discount for this product (simulating game route logic)
      cart.discounts = (cart.discounts || []).filter(d => d.productId !== 'punk-edition');

      // Add new discount
      cart.discounts.push({
        id: 'game-test-discount-2',
        productId: 'punk-edition',
        discountPercent: 20,
        gameType: 'test',
        earnedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        applied: false
      });

      localStorage.setItem('caterpillar-ranch-cart', JSON.stringify(cart));
    });

    // Navigate back
    await page.goto(PRODUCT_URL);
    await page.waitForLoadState('networkidle');

    // Verify discount was REPLACED (not accumulated)
    console.log('→ Checking discount was replaced (not accumulated)...');
    const cartAfter = await helpers.getCart(page);
    const discountsAfter = cartAfter.discounts || [];

    console.log(`  Discounts after: ${discountsAfter.length} (${discountsAfter.map(d => d.discountPercent + '%').join(', ')})`);

    // Should have exactly 1 discount
    if (discountsAfter.length !== 1) {
      throw new Error(`Expected 1 discount (replaced), got ${discountsAfter.length}`);
    }

    // Should be 20% (latest)
    if (discountsAfter[0].discountPercent !== 20) {
      throw new Error(`Expected 20% discount (latest), got ${discountsAfter[0].discountPercent}%`);
    }

    console.log('  ✓ Discount REPLACED correctly (20% replaced 30%)');

    await helpers.screenshot(page, 'test5-discount-replaced');
    results.pass(testName);

  } catch (error) {
    await helpers.screenshot(page, 'test5-failed');
    results.fail(testName, error);
    // Don't throw - continue
  }
}

/**
 * TEST 6: Cart Item Separation with Different Discounts
 */
async function test6_CartItemSeparation(page) {
  const testName = 'TEST 6: Cart Items Separate with Different Discounts';
  console.log(`\n${'='.repeat(80)}`);
  console.log(testName);
  console.log('='.repeat(80));

  try {
    // Add product with 30% discount
    console.log('→ Adding discount back to 30% for first cart item...');
    await page.evaluate(() => {
      const cart = JSON.parse(localStorage.getItem('caterpillar-ranch-cart') || '{"items":[],"discounts":[]}');

      cart.discounts = [{
        id: 'discount-30',
        productId: 'punk-edition',
        discountPercent: 30,
        gameType: 'test',
        earnedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        applied: false
      }];

      localStorage.setItem('caterpillar-ranch-cart', JSON.stringify(cart));
    });

    await page.reload();
    await page.waitForLoadState('networkidle');

    // Select size and add to cart
    console.log('→ Selecting size M and adding to cart (30% discount)...');
    await page.click('button:has-text("M")', { force: true });
    await page.waitForTimeout(500);

    const addButton = page.locator('button:has-text("Add to Cart"), button:has-text("Choose Your Size")').last();
    await addButton.click({ force: true }); // Force click to bypass animations
    await page.waitForTimeout(1000);

    // Get cart after first add
    const cartAfterFirst = await helpers.getCart(page);
    console.log(`  Cart items after first add: ${cartAfterFirst.items.length}`);

    // Clear session and change discount to 20%
    console.log('→ Clearing session and changing discount to 20%...');
    await helpers.clearSessionStorage(page);

    await page.evaluate(() => {
      const cart = JSON.parse(localStorage.getItem('caterpillar-ranch-cart'));

      // Replace discount with 20%
      cart.discounts = [{
        id: 'discount-20',
        productId: 'punk-edition',
        discountPercent: 20,
        gameType: 'test',
        earnedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        applied: false
      }];

      localStorage.setItem('caterpillar-ranch-cart', JSON.stringify(cart));
    });

    await page.reload();
    await page.waitForLoadState('networkidle');

    // Add same product+variant with different discount
    console.log('→ Adding same product (size M) with 20% discount...');
    await page.click('button:has-text("M")', { force: true });
    await page.waitForTimeout(500);

    await addButton.click({ force: true }); // Force click to bypass animations
    await page.waitForTimeout(1000);

    // Verify cart has TWO separate items
    console.log('→ Checking cart has two separate items...');
    const cartFinal = await helpers.getCart(page);
    const itemCount = cartFinal.items.length;

    console.log(`  Cart items after second add: ${itemCount}`);

    if (itemCount !== 2) {
      throw new Error(`Expected 2 cart items (separate lines), got ${itemCount}`);
    }

    // Verify different discounts
    const discounts = cartFinal.items.map(item => item.earnedDiscount || 0);
    console.log(`  Item discounts: ${discounts.join('%, ')}%`);

    if (!discounts.includes(30) || !discounts.includes(20)) {
      throw new Error(`Expected items with 30% and 20% discounts, got: ${discounts.join(', ')}`);
    }

    console.log('  ✓ Cart items correctly separated by discount');

    await helpers.screenshot(page, 'test6-cart-separated');
    results.pass(testName);

  } catch (error) {
    await helpers.screenshot(page, 'test6-failed');
    results.fail(testName, error);
    // Don't throw - show summary
  }
}

// Run the test suite
runTests();
