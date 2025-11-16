/**
 * E2E Test: API Response Validation
 *
 * Tests API endpoints, status codes, response structure
 * CRITICAL: If tests fail, check workers/routes/ implementation first!
 */

import { test, expect } from '@playwright/test';
import { validateAPIResponse } from '../utils/helpers';

test.describe('API Validation', () => {
  test('should fetch products API', async ({ page }) => {
    await page.goto('/');

    // Intercept products API call
    const response = await validateAPIResponse(page, '/api/catalog/products', 200);

    // Verify response structure
    const data = await response.json();
    expect(data).toHaveProperty('products');
    expect(Array.isArray(data.products)).toBe(true);

    console.log(`✅ Products API returned ${data.products.length} products`);
  });

  test('should handle admin login API', async ({ page }) => {
    await page.goto('/admin/login');

    // Monitor login API call
    const responsePromise = page.waitForResponse((resp) =>
      resp.url().includes('/api/auth/login')
    );

    // Fill and submit form
    await page.fill('input#email', 'lando@gvoassurancepartners.com');
    await page.fill('input#password', 'duderancch');
    await page.click('button[type="submit"]');

    // Wait for response
    const response = await responsePromise;

    // Verify success
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('token');
    expect(data).toHaveProperty('user');

    console.log('✅ Login API response valid');
  });

  test('should fetch dashboard stats API', async ({ page }) => {
    // Login first
    await page.goto('/admin/login');
    await page.fill('input#email', 'lando@gvoassurancepartners.com');
    await page.fill('input#password', 'duderancch');
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin/dashboard');

    // Monitor stats API call
    const response = await page.waitForResponse((resp) =>
      resp.url().includes('/api/admin/analytics/dashboard-stats')
    );

    // Verify response
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('orders');
    expect(data).toHaveProperty('revenue');
    expect(data).toHaveProperty('products');
    expect(data).toHaveProperty('games');

    console.log('✅ Dashboard stats API valid');
  });
});
