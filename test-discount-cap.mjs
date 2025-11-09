/**
 * Test 40% Discount Cap Enforcement
 *
 * Verifies that even if a user earns 60% discount, only 40% is applied
 */

import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('🔒 Testing 40% Discount Cap Enforcement...\n');

  try {
    // Navigate to product page
    await page.goto('https://caterpillar-ranch.lando555.workers.dev/products/punk-edition', {
      waitUntil: 'networkidle',
      timeout: 15000
    });

    // Inject 60% discount (should be capped at 40%)
    console.log('📍 Injecting 60% discount (should cap at 40%)...');
    await page.evaluate(() => {
      const cart = {
        items: [],
        discounts: [
          {
            id: 'test-discount-excessive',
            productId: 'punk-edition',
            discountPercent: 60, // Trying to apply 60%
            gameType: 'test',
            earnedAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
            applied: false
          }
        ],
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem('caterpillar-ranch-cart', JSON.stringify(cart));
    });

    // Reload to apply discount
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    console.log('✅ Discount injected and page reloaded\n');

    // Add item to cart
    console.log('📍 Adding item to cart...');
    const sizeM = page.locator('button:has-text("M")').first();
    await sizeM.click({ force: true });
    await page.waitForTimeout(500);

    const addButton = page.locator('button:has-text("Claim Your Harvest")');
    await addButton.click({ force: true });
    await page.waitForTimeout(2000);
    console.log('✅ Item added\n');

    // Open cart
    await page.locator('button[aria-label*="Shopping cart"]').click({ force: true });
    await page.waitForTimeout(1500);

    await page.screenshot({ path: 'test-discount-cap.png', fullPage: true });

    // Check cart data
    const cartData = await page.evaluate(() => {
      return localStorage.getItem('caterpillar-ranch-cart');
    });

    const cart = JSON.parse(cartData);
    const item = cart.items[0];
    const product = item.product;

    console.log('Cart Analysis:');
    console.log(`   Product price: $${product.price}`);
    console.log(`   Item earned discount: ${item.earnedDiscount}%`);
    console.log(`   Quantity: ${item.quantity}`);

    // Calculate expected prices
    const subtotal = product.price * item.quantity;
    const earnedDiscountAmount = (subtotal * item.earnedDiscount) / 100;
    const cappedDiscountAmount = (subtotal * 40) / 100;
    const expectedTotal = subtotal - cappedDiscountAmount;

    console.log(`\n   Subtotal: $${subtotal}`);
    console.log(`   Earned discount (${item.earnedDiscount}%): $${earnedDiscountAmount.toFixed(2)}`);
    console.log(`   Capped discount (40%): $${cappedDiscountAmount.toFixed(2)}`);
    console.log(`   Expected total: $${expectedTotal.toFixed(2)}`);

    // Get displayed price from page
    const displayedPriceText = await page.locator('.text-ranch-cyan').filter({ hasText: /^\$/ }).first().textContent();
    const displayedPrice = parseFloat(displayedPriceText.replace('$', ''));

    console.log(`\n   Displayed total: $${displayedPrice}`);

    if (Math.abs(displayedPrice - expectedTotal) < 0.01) {
      console.log('\n✅ SUCCESS: 40% cap is enforced!');
      console.log(`   Even though 60% was earned, only 40% was applied`);
      process.exit(0);
    } else {
      console.log('\n❌ FAILURE: Cap not enforced correctly');
      console.log(`   Expected: $${expectedTotal.toFixed(2)}`);
      console.log(`   Got: $${displayedPrice}`);
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'test-discount-cap-error.png', fullPage: true });
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
