/**
 * Test Cart Integration Flow
 *
 * Verifies:
 * 1. Navigate to product page
 * 2. Add item to cart
 * 3. Verify cart icon updates
 * 4. Open cart drawer
 * 5. Verify item appears in cart
 */

import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('🧪 Testing Cart Integration Flow...\n');

  // Capture console messages
  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push(msg.text());
    if (msg.type() === 'error') {
      console.error('❌ Browser Error:', msg.text());
    }
  });

  // Capture errors
  page.on('pageerror', err => {
    console.error('❌ Page Error:', err.message);
  });

  try {
    // Step 1: Load homepage
    console.log('📍 Step 1: Loading homepage...');
    await page.goto('https://caterpillar-ranch.lando555.workers.dev/', {
      waitUntil: 'networkidle',
      timeout: 15000
    });
    await page.screenshot({ path: 'test-cart-flow-1-homepage.png' });
    console.log('✅ Homepage loaded\n');

    // Step 2: Verify cart icon shows 0 items
    console.log('📍 Step 2: Checking initial cart state...');
    const cartIcon = page.locator('button[aria-label*="Shopping cart"]');
    const cartLabel = await cartIcon.getAttribute('aria-label');
    console.log(`   Initial cart label: "${cartLabel}"`);
    await page.screenshot({ path: 'test-cart-flow-2-empty-cart.png' });
    console.log('');

    // Step 3: Click first product (Punk Edition)
    console.log('📍 Step 3: Clicking product...');
    const firstProduct = page.locator('button[aria-label="View Caterpillar Ranch - Punk Edition"]').first();
    await firstProduct.click({ force: true }); // Force click to bypass animation stability checks
    await page.waitForTimeout(1500);

    // Wait for product page to load
    await page.waitForURL('**/products/punk-edition', { timeout: 5000 });
    console.log('✅ Navigated to product page: /products/punk-edition');
    await page.screenshot({ path: 'test-cart-flow-3-product-page.png' });
    console.log('');

    // Step 4: Select size M
    console.log('📍 Step 4: Selecting size M...');
    const sizeM = page.locator('button:has-text("M")').first();
    await sizeM.click({ force: true });
    await page.waitForTimeout(500);
    console.log('✅ Size M selected');
    await page.screenshot({ path: 'test-cart-flow-4-size-selected.png' });
    console.log('');

    // Step 5: Click "Claim Your Harvest"
    console.log('📍 Step 5: Adding to cart...');
    const addButton = page.locator('button:has-text("Claim Your Harvest")');
    await addButton.click({ force: true });

    // Wait for toast notification
    await page.waitForTimeout(1000);
    console.log('✅ Clicked "Claim Your Harvest"');
    await page.screenshot({ path: 'test-cart-flow-5-adding.png' });

    // Wait for navigation back to homepage
    await page.waitForURL('**/', { timeout: 5000 });
    console.log('✅ Navigated back to homepage');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-cart-flow-6-back-home.png' });
    console.log('');

    // Step 6: Check cart icon updated
    console.log('📍 Step 6: Verifying cart icon updated...');
    const updatedCartLabel = await page.locator('button[aria-label*="Shopping cart"]').getAttribute('aria-label');
    console.log(`   Updated cart label: "${updatedCartLabel}"`);

    if (updatedCartLabel && updatedCartLabel.includes('1 item')) {
      console.log('✅ SUCCESS: Cart icon shows 1 item');
    } else {
      console.log('❌ FAILURE: Cart icon did NOT update (still shows 0)');
    }
    await page.screenshot({ path: 'test-cart-flow-7-cart-icon.png' });
    console.log('');

    // Step 7: Open cart drawer
    console.log('📍 Step 7: Opening cart drawer...');
    await page.locator('button[aria-label*="Shopping cart"]').click({ force: true });
    await page.waitForTimeout(1500);

    // Check drawer content
    const drawerTitle = await page.locator('h2.text-2xl').first().textContent();
    console.log(`   Drawer title: "${drawerTitle}"`);

    // Check for product in cart
    const productInCart = await page.locator('text=Caterpillar Ranch - Punk Edition').count();

    if (drawerTitle === 'Your Order is Growing' && productInCart > 0) {
      console.log('✅ SUCCESS: Cart contains the added product');
    } else {
      console.log('❌ FAILURE: Cart is empty or product not found');
      console.log(`   - Title matches "Your Order is Growing": ${drawerTitle === 'Your Order is Growing'}`);
      console.log(`   - Product found in cart: ${productInCart > 0}`);
    }

    await page.screenshot({ path: 'test-cart-flow-8-cart-drawer.png', fullPage: true });
    console.log('');

    // Step 8: Check localStorage
    console.log('📍 Step 8: Checking localStorage...');
    const cartData = await page.evaluate(() => {
      return localStorage.getItem('caterpillar-ranch-cart');
    });

    if (cartData) {
      const parsed = JSON.parse(cartData);
      console.log('✅ Cart data found in localStorage:');
      console.log(`   - Items count: ${parsed.items?.length || 0}`);
      if (parsed.items?.length > 0) {
        console.log(`   - First item: ${parsed.items[0].product.name} (${parsed.items[0].variant.size})`);
        console.log(`   - Quantity: ${parsed.items[0].quantity}`);
      }
    } else {
      console.log('❌ FAILURE: No cart data in localStorage');
    }
    console.log('');

    // Final verdict
    console.log('='.repeat(60));
    if (updatedCartLabel?.includes('1 item') && productInCart > 0 && cartData) {
      console.log('✅✅✅ CART INTEGRATION WORKS PERFECTLY ✅✅✅');
      process.exit(0);
    } else {
      console.log('❌❌❌ CART INTEGRATION HAS ISSUES ❌❌❌');
      console.log('\nIssues detected:');
      if (!updatedCartLabel?.includes('1 item')) {
        console.log('  - Cart icon did not update');
      }
      if (productInCart === 0) {
        console.log('  - Product not found in cart drawer');
      }
      if (!cartData) {
        console.log('  - Cart data not saved to localStorage');
      }
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'test-cart-flow-error.png', fullPage: true });
    console.log('📸 Error screenshot saved: test-cart-flow-error.png');
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
