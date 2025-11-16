/**
 * E2E Test: Homepage
 *
 * Tests homepage loading, product display, and navigation
 * CRITICAL: If tests fail, check app/routes/home.tsx implementation first!
 */

import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { assertPerformance, waitForAnimations } from '../utils/helpers';

test.describe('Homepage', () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    await homePage.goto();
  });

  test('should load and display logo', async ({ page }) => {
    // Verify logo is visible
    await expect(homePage.logo).toBeVisible();

    // Verify logo has correct alt text
    await expect(homePage.logo).toHaveAttribute(
      'alt',
      'Caterpillar Ranch - Horror Tees'
    );

    // Verify logo has correct source
    await expect(homePage.logo).toHaveAttribute('src', '/cr-logo.png');
  });

  test('should display product grid', async ({ page }) => {
    // Verify product grid is visible
    await expect(homePage.productGrid).toBeVisible();

    // Verify products are loaded
    const count = await homePage.getProductCount();
    expect(count).toBeGreaterThan(0);
    console.log(`✅ Found ${count} products on homepage`);
  });

  test('should display product cards with all information', async ({ page }) => {
    await homePage.assertProductsVisible();

    // Get product names and prices
    const names = await homePage.getProductNames();
    const prices = await homePage.getProductPrices();

    console.log('Products:', names);
    console.log('Prices:', prices);

    // Verify all products have names
    names.forEach((name) => {
      expect(name).toBeTruthy();
      expect(name.length).toBeGreaterThan(0);
    });

    // Verify all products have prices
    prices.forEach((price) => {
      expect(price).toMatch(/\$[\d.]+/);
    });
  });

  test('should navigate to product page on card click', async ({ page }) => {
    // Click first product
    await homePage.clickProduct(0);

    // Verify URL changed to product page
    await expect(page).toHaveURL(/\/products\/.+/);

    // Verify product view is displayed
    await waitForAnimations(page);
    const productImage = page.locator('img.w-full').first();
    await expect(productImage).toBeVisible();
  });

  test('should pass performance benchmarks', async ({ page }) => {
    const vitals = await assertPerformance(page);

    console.log('Core Web Vitals:');
    console.log(`  LCP: ${vitals.lcp}ms`);
    console.log(`  FCP: ${vitals.fcp}ms`);
    console.log(`  TTI: ${vitals.tti}ms`);

    // Assertions already done in assertPerformance()
  });

  test('should have responsive design on mobile', async ({ page, viewport }) => {
    // Skip if not mobile viewport
    if (!viewport || viewport.width > 768) {
      test.skip();
    }

    // Verify product grid adapts to mobile
    await homePage.assertProductsVisible();

    // On mobile, products should stack (1 column)
    const grid = homePage.productGrid;
    const gridClass = await grid.getAttribute('class');
    expect(gridClass).toContain('grid-cols-1');
  });

  test('should have responsive design on tablet', async ({ page, viewport }) => {
    // Skip if not tablet viewport
    if (!viewport || viewport.width < 768 || viewport.width > 1024) {
      test.skip();
    }

    // Verify product grid adapts to tablet
    await homePage.assertProductsVisible();

    // On tablet, should show 2 columns
    const grid = homePage.productGrid;
    const gridClass = await grid.getAttribute('class');
    expect(gridClass).toContain('md:grid-cols-2');
  });

  test('should have responsive design on desktop', async ({ page, viewport }) => {
    // Skip if not desktop viewport
    if (!viewport || viewport.width < 1024) {
      test.skip();
    }

    // Verify product grid adapts to desktop
    await homePage.assertProductsVisible();

    // On desktop, should show 4 columns
    const grid = homePage.productGrid;
    const gridClass = await grid.getAttribute('class');
    expect(gridClass).toContain('lg:grid-cols-4');
  });
});
