/**
 * E2E Test: Visual Regression
 *
 * Captures screenshots for visual comparison
 * CRITICAL: If screenshots don't match expectations, check actual page rendering first!
 */

import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { waitForAnimations, waitForProductsToLoad } from '../utils/helpers';

test.describe('Visual Regression', () => {
  test('homepage screenshot', async ({ page }) => {
    await page.goto('/');
    await waitForProductsToLoad(page);

    await page.screenshot({
      path: 'test-results/visual-baseline/homepage.png',
      fullPage: true,
    });
  });

  test('product page screenshot', async ({ page }) => {
    await page.goto('/products/cr-100');
    await waitForAnimations(page);

    await page.screenshot({
      path: 'test-results/visual-baseline/product-page.png',
      fullPage: false,
    });
  });

  test('cart drawer screenshot', async ({ page }) => {
    // Add product first
    await page.goto('/products/cr-100');
    await waitForAnimations(page);
    await page.click('button:has-text("M")');
    await page.click('button:has-text("Claim Your Harvest")');
    await waitForAnimations(page, 1500);

    // Open cart
    await page.click('button[aria-label*="Shopping cart"]');
    await waitForAnimations(page);

    await page.screenshot({
      path: 'test-results/visual-baseline/cart-drawer.png',
      fullPage: false,
    });
  });

  test('checkout page screenshot', async ({ page }) => {
    // Add product first
    await page.goto('/products/cr-100');
    await waitForAnimations(page);
    await page.click('button:has-text("M")');
    await page.click('button:has-text("Claim Your Harvest")');
    await waitForAnimations(page, 1500);

    // Navigate to checkout
    await page.goto('/checkout');
    await waitForAnimations(page);

    await page.screenshot({
      path: 'test-results/visual-baseline/checkout.png',
      fullPage: true,
    });
  });

  test('admin dashboard screenshot', async ({ page }) => {
    // Login
    await page.goto('/admin/login');
    await page.fill('input#email', 'lando@gvoassurancepartners.com');
    await page.fill('input#password', 'duderancch');
    await page.click('button[type="submit"]');
    await waitForAnimations(page, 1500);

    await page.screenshot({
      path: 'test-results/visual-baseline/admin-dashboard.png',
      fullPage: true,
    });
  });
});
