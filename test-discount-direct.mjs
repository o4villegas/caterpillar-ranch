/**
 * Direct Test: Discount Application to Product Page
 *
 * This test bypasses the game and directly adds a discount to localStorage
 * to verify that the product page correctly reads and displays it.
 *
 * Tests:
 * 1. Navigate to product page
 * 2. Inject discount into localStorage (simulate game completion)
 * 3. Reload page
 * 4. Verify discount is displayed
 * 5. Add to cart with discount
 * 6. Verify cart item has discount applied
 */

import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('🧪 Testing Direct Discount Application...\n');

  try {
    // Step 1: Navigate to product page
    console.log('📍 Step 1: Loading product page...');
    await page.goto('https://caterpillar-ranch.lando555.workers.dev/products/punk-edition', {
      waitUntil: 'networkidle',
      timeout: 15000
    });
    console.log('✅ Product page loaded\n');

    // Step 2: Inject discount into localStorage
    console.log('📍 Step 2: Injecting 30% discount into localStorage...');
    await page.evaluate(() => {
      const cart = {
        items: [],
        discounts: [
          {
            id: 'test-discount-12345',
            productId: 'punk-edition', // Using slug
            discountPercent: 30,
            gameType: 'culling',
            earnedAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
            applied: false
          }
        ],
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem('caterpillar-ranch-cart', JSON.stringify(cart));
    });
    console.log('✅ Discount injected (30% off)\n');

    // Step 3: Reload page to trigger useEffect
    console.log('📍 Step 3: Reloading page to apply discount...');
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    console.log('✅ Page reloaded\n');

    // Step 4: Verify discount displayed
    console.log('📍 Step 4: Verifying discount displayed on product page...');
    await page.screenshot({ path: 'test-discount-direct-1-page.png' });

    const discountText = await page.locator('text=/30% Ranch Blessing Applied/i').count();
    const strikethroughPrice = await page.locator('span.line-through').count();
    const discountedPrice = await page.locator('.text-ranch-lime').first().textContent();

    console.log(`   Discount text found: ${discountText > 0 ? 'YES' : 'NO'}`);
    console.log(`   Strikethrough price found: ${strikethroughPrice > 0 ? 'YES' : 'NO'}`);
    console.log(`   Displayed price: ${discountedPrice}`);

    if (discountText > 0 && strikethroughPrice > 0) {
      console.log('✅ SUCCESS: Discount displayed correctly');
    } else {
      console.log('❌ FAILURE: Discount not displayed');
      console.log('\nDEBUG: Checking page content...');
      const bodyText = await page.locator('body').textContent();
      console.log('   Body contains "30%":', bodyText.includes('30%'));
      console.log('   Body contains "Blessing":', bodyText.includes('Blessing'));
    }
    console.log('');

    // Step 5: Add to cart with discount
    console.log('📍 Step 5: Adding item to cart...');
    const sizeM = page.locator('button:has-text("M")').first();
    await sizeM.click({ force: true });
    await page.waitForTimeout(500);

    const addButton = page.locator('button:has-text("Claim Your Harvest")');
    await addButton.click({ force: true });
    await page.waitForTimeout(2000);
    console.log('✅ Item added to cart\n');

    // Step 6: Open cart and verify discount
    console.log('📍 Step 6: Verifying cart item has discount...');
    await page.locator('button[aria-label*="Shopping cart"]').click({ force: true });
    await page.waitForTimeout(1500);

    await page.screenshot({ path: 'test-discount-direct-2-cart.png', fullPage: true });

    // Check localStorage
    const cartData = await page.evaluate(() => {
      return localStorage.getItem('caterpillar-ranch-cart');
    });

    const cart = JSON.parse(cartData);
    console.log('Cart Data:');
    console.log(`   - Items: ${cart.items?.length || 0}`);
    console.log(`   - Discounts: ${cart.discounts?.length || 0}`);

    if (cart.items?.length > 0) {
      const item = cart.items[0];
      console.log(`   - Item discount: ${item.earnedDiscount}%`);
      console.log(`   - Product: ${item.product.name}`);
      console.log(`   - Size: ${item.variant.size}`);
      console.log(`   - Quantity: ${item.quantity}`);

      if (item.earnedDiscount === 30) {
        console.log('✅ SUCCESS: Item has 30% discount applied');
      } else {
        console.log(`❌ FAILURE: Item discount is ${item.earnedDiscount}% (expected 30%)`);
      }
    }
    console.log('');

    // Final verdict
    console.log('='.repeat(60));
    if (discountText > 0 && strikethroughPrice > 0 && cart.items?.[0]?.earnedDiscount === 30) {
      console.log('✅✅✅ DISCOUNT INTEGRATION WORKS! ✅✅✅');
      console.log('\nVerified:');
      console.log('  ✅ Product page reads discount from CartContext');
      console.log('  ✅ Discount displayed with strikethrough price');
      console.log('  ✅ Discount applied to cart item when added');
      console.log('  ✅ Cart persists discount in localStorage');
      process.exit(0);
    } else {
      console.log('❌❌❌ DISCOUNT INTEGRATION HAS ISSUES ❌❌❌');
      console.log('\nProblems:');
      if (discountText === 0) console.log('  ❌ Discount text not shown');
      if (strikethroughPrice === 0) console.log('  ❌ Original price not struck through');
      if (cart.items?.[0]?.earnedDiscount !== 30) console.log('  ❌ Discount not applied to cart item');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'test-discount-direct-error.png', fullPage: true });
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
