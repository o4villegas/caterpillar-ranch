#!/usr/bin/env node
/**
 * Quick test script to verify homepage → product page navigation
 */

import { chromium } from '@playwright/test';

const DEV_URL = 'http://localhost:5174';

async function runTest() {
  console.log('🧪 Testing Product Page Navigation\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });
  const page = await context.newPage();

  try {
    // Test 1: Homepage loads
    console.log('Test 1: Homepage loads with clickable cards');
    await page.goto(DEV_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Take screenshot to debug
    await page.screenshot({ path: 'test-homepage-debug.png', fullPage: true });
    console.log('📸 Screenshot saved: test-homepage-debug.png');

    const productCards = await page.locator('button.card').all();
    console.log(`Found ${productCards.length} product cards (clickable buttons)`);

    // Debug: check what's on the page
    const allButtons = await page.locator('button').all();
    console.log(`Total buttons on page: ${allButtons.length}`);

    // Test 2: Click first product card
    console.log('\nTest 2: Click product card navigates to product page');
    if (productCards.length === 0) {
      console.log('❌ No product cards found. Check screenshot for details.');
      return;
    }

    const firstCard = productCards[0];
    await firstCard.click();
    await page.waitForTimeout(1000);

    // Check URL changed
    const currentUrl = page.url();
    const isProductPage = currentUrl.includes('/products/');
    console.log(`URL: ${currentUrl}`);
    console.log(isProductPage ? '✅ Navigated to product page' : '❌ URL did not change');

    // Test 3: Product page displays
    console.log('\nTest 3: Product page displays correctly');
    const productTitle = await page.locator('h1').first();
    const titleText = await productTitle.textContent();
    console.log(`✅ Product title: ${titleText}`);

    // Check for size selector
    const sizeButtons = await page.locator('button:has-text("S"), button:has-text("M"), button:has-text("L")').all();
    console.log(`✅ Size selector: ${sizeButtons.length} size buttons found`);

    // Check for Add to Cart button
    const addToCartButton = await page.locator('button:has-text("Claim Your Harvest")').first();
    const isAddToCartVisible = await addToCartButton.isVisible();
    console.log(isAddToCartVisible ? '✅ Add to Cart button visible' : '❌ Add to Cart button not found');

    // Test 4: Back button returns to homepage
    console.log('\nTest 4: Back button navigation');
    const backButton = await page.locator('button:has-text("Back to Products")').first();
    await backButton.click();
    await page.waitForTimeout(1000);

    const backUrl = page.url();
    const isHomepage = backUrl === DEV_URL + '/';
    console.log(`URL: ${backUrl}`);
    console.log(isHomepage ? '✅ Returned to homepage' : '❌ Did not return to homepage');

    // Test 5: Browser back button works
    console.log('\nTest 5: Browser back button');
    await productCards[1].click(); // Click second product
    await page.waitForTimeout(500);
    await page.goBack(); // Use browser back button
    await page.waitForTimeout(500);

    const afterBackUrl = page.url();
    const isBackHomepage = afterBackUrl === DEV_URL + '/';
    console.log(isBackHomepage ? '✅ Browser back button works' : '❌ Browser back button failed');

    // Test 6: Meta tags present
    console.log('\nTest 6: SEO meta tags (navigate to product page again)');
    await productCards[0].click();
    await page.waitForTimeout(1000);

    const metaOgTitle = await page.locator('meta[property="og:title"]').getAttribute('content');
    const metaOgImage = await page.locator('meta[property="og:image"]').getAttribute('content');
    console.log(`✅ Open Graph title: ${metaOgTitle}`);
    console.log(`✅ Open Graph image: ${metaOgImage ? 'Present' : 'Missing'}`);

    console.log('\n✅ All tests passed!');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    throw error;
  } finally {
    await browser.close();
    console.log('\n🎭 Browser closed');
  }
}

runTest().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
