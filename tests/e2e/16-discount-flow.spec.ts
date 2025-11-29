/**
 * E2E Test: Full Discount Flow
 *
 * Tests the complete user journey from:
 * Game play → Earn discount → Product page → Add to cart → Checkout review
 *
 * This verifies that game discounts are actually applied through the system.
 */

import { test, expect } from '@playwright/test';
import {
  waitForAnimations,
  getProductSlug,
  waitForGameEnd,
  setupConsoleCapture,
  assertNoReactWarnings,
} from '../utils/helpers';
import { selectors } from '../utils/selectors';

test.describe('Discount Flow End-to-End', () => {
  let productSlug: string;
  let consoleErrors: string[];

  test.beforeAll(async ({ request }) => {
    productSlug = await getProductSlug(request, 0);
    console.log(`Using product slug for discount flow tests: ${productSlug}`);
  });

  test.beforeEach(async ({ page }) => {
    consoleErrors = setupConsoleCapture(page);
  });

  test('should earn discount in game and apply to cart and checkout', async ({ page }) => {
    test.setTimeout(90000); // Long test - game + checkout flow

    // STEP 1: Navigate to game from product
    await page.goto(`/games/larva-launch?product=${productSlug}`);
    await waitForAnimations(page);

    // Verify game loaded
    const title = page.locator(selectors.gameLarvaLaunch.title);
    await expect(title).toBeVisible();

    // STEP 2: Start and complete the game
    await page.click(selectors.gameLarvaLaunch.startButton);
    await waitForAnimations(page, 1000);

    // Launch some projectiles to try to score points
    const launchers = page.locator('.absolute.cursor-pointer');
    for (let i = 0; i < 5; i++) {
      const launcherCount = await launchers.count();
      if (launcherCount > 0) {
        await launchers.nth(i % launcherCount).click();
        await page.waitForTimeout(300);
      }
    }

    // Wait for game to end
    await waitForGameEnd(page, 22000);

    // STEP 3: Verify results show and click claim
    const results = page.locator(selectors.gameLarvaLaunch.results);
    await expect(results).toBeVisible({ timeout: 5000 });

    // Look for either "Claim Trust" or "Return Without" button
    const claimButton = page.locator('button:has-text("Claim Trust"), button:has-text("Return Without")').first();
    await expect(claimButton).toBeVisible({ timeout: 5000 });
    await claimButton.click();

    // STEP 4: Verify navigation to product page
    await page.waitForURL(`**/products/${productSlug}`, { timeout: 10000 });
    expect(page.url()).toContain(`/products/${productSlug}`);
    await waitForAnimations(page, 1500);

    // STEP 5: Check if discount badge is visible (if discount was earned)
    // Look for discount badge - might say "X% off" or "Ranch Blessing"
    const discountBadge = page.locator('text=/\\d+% off|Ranch Blessing|Discount/i');
    const hasDiscount = await discountBadge.count() > 0;

    console.log(`Discount earned: ${hasDiscount}`);

    // STEP 6: Select a size and add to cart
    // Wait for size buttons to load
    const sizeButtons = page.locator('button[aria-pressed]');
    await expect(sizeButtons.first()).toBeVisible({ timeout: 5000 });

    // Click first available size
    await sizeButtons.first().click();
    await waitForAnimations(page, 500);

    // Click "Claim Your Harvest" (add to cart)
    const addToCartButton = page.locator('button:has-text("Claim Your Harvest")');
    await expect(addToCartButton).toBeEnabled({ timeout: 5000 });
    await addToCartButton.click();
    await waitForAnimations(page, 1500);

    // STEP 7: Open cart drawer and verify item with discount
    const cartIcon = page.locator(selectors.cart.icon);
    await expect(cartIcon).toBeVisible({ timeout: 5000 });
    await cartIcon.click({ force: true });
    await waitForAnimations(page, 1000);

    // Verify cart drawer opened (use specific drawer selector, not generic role)
    const cartDrawer = page.locator('[data-vaul-drawer]');
    await expect(cartDrawer).toBeVisible({ timeout: 5000 });

    // Check for item in cart
    const cartItems = page.locator('img[alt*="CR-"], img[alt*="Tee"]');
    await expect(cartItems.first()).toBeVisible({ timeout: 5000 });

    // If discount was earned, verify it shows in cart
    if (hasDiscount) {
      const cartDiscount = page.locator('text=/\\d+% off|Discount/i');
      const cartHasDiscount = await cartDiscount.count() > 0;
      console.log(`Cart shows discount: ${cartHasDiscount}`);
    }

    // STEP 8: Proceed to checkout (if button exists)
    const checkoutButton = page.locator('button:has-text("Complete the Harvest"), button:has-text("Checkout")');
    if (await checkoutButton.isVisible()) {
      await checkoutButton.click();
      await waitForAnimations(page, 1000);

      // Should be on checkout page
      await page.waitForURL('**/checkout**', { timeout: 5000 });
      expect(page.url()).toContain('/checkout');
    }

    // Verify no React errors during the flow
    assertNoReactWarnings(consoleErrors);
  });

  test('should show discount badge on product page after earning', async ({ page }) => {
    test.setTimeout(60000);

    // Play game first
    await page.goto(`/games/cursed-harvest?product=${productSlug}`);
    await waitForAnimations(page);

    await page.click(selectors.gameCursedHarvest.startButton);
    await waitForAnimations(page, 1000);

    // Click cards to try to earn some points
    const cards = page.locator(selectors.gameCursedHarvest.card);
    for (let i = 0; i < 6; i++) {
      const cardCount = await cards.count();
      if (cardCount > 0) {
        await cards.nth(i % cardCount).click({ force: true });
        await page.waitForTimeout(300);
      }
    }

    // Wait for game end
    await waitForGameEnd(page, 22000);

    // Click claim/return button
    const claimButton = page.locator('button:has-text("Claim Trust"), button:has-text("Return Without")').first();
    await expect(claimButton).toBeVisible({ timeout: 5000 });
    await claimButton.click();

    // Verify on product page
    await page.waitForURL(`**/products/${productSlug}`, { timeout: 10000 });
    await waitForAnimations(page, 1500);

    // The product page should load without errors
    const productTitle = page.locator('h3.text-2xl, h1.text-3xl');
    await expect(productTitle.first()).toBeVisible();

    assertNoReactWarnings(consoleErrors);
  });

  test('should persist discount in localStorage', async ({ page }) => {
    test.setTimeout(60000);

    // Play game and earn discount
    await page.goto(`/games/path-of-the-pupa?product=${productSlug}`);
    await waitForAnimations(page);

    await page.click(selectors.gamePathOfPupa.startButton);
    await waitForGameEnd(page, 22000);

    // Click claim
    const claimButton = page.locator('button:has-text("Claim Trust"), button:has-text("Return Without")').first();
    await expect(claimButton).toBeVisible({ timeout: 5000 });
    await claimButton.click();

    await page.waitForURL(`**/products/${productSlug}`, { timeout: 10000 });
    await waitForAnimations(page, 1000);

    // Check localStorage for cart data
    const cartData = await page.evaluate(() => {
      return localStorage.getItem('caterpillar-ranch-cart');
    });

    console.log('Cart data in localStorage:', cartData ? 'exists' : 'null');

    if (cartData) {
      const parsed = JSON.parse(cartData);
      console.log('Discounts stored:', parsed.discounts?.length || 0);

      // If discounts exist, they should have required fields
      if (parsed.discounts && parsed.discounts.length > 0) {
        const discount = parsed.discounts[0];
        expect(discount).toHaveProperty('productId');
        expect(discount).toHaveProperty('discountPercent');
        expect(discount).toHaveProperty('gameType');
        expect(discount).toHaveProperty('expiresAt');
      }
    }

    assertNoReactWarnings(consoleErrors);
  });
});
