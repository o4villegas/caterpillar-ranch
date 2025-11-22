/**
 * E2E Test: API Response Validation
 *
 * Tests API endpoints, status codes, response structure
 * CRITICAL: If tests fail, check workers/routes/ implementation first!
 */

import { test, expect } from '@playwright/test';
import { validateAPIResponse } from '../utils/helpers';

test.describe('API Validation', () => {
  test('should fetch products API', async ({ page, request }) => {
    // Fetch products directly using request fixture
    const baseUrl = process.env.TEST_URL || 'http://localhost:5173';
    const response = await request.get(`${baseUrl}/api/catalog/products`);

    expect(response.status()).toBe(200);

    // Verify response structure - API returns { data: [...], meta: {...} }
    const json = await response.json();
    expect(json).toHaveProperty('data');
    expect(Array.isArray(json.data)).toBe(true);
    expect(json.data.length).toBeGreaterThan(0);

    // Verify product structure
    const product = json.data[0];
    expect(product).toHaveProperty('id');
    expect(product).toHaveProperty('name');
    expect(product).toHaveProperty('thumbnail_url');

    console.log(`✅ Products API returned ${json.data.length} products`);
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
    await page.waitForTimeout(500); // Wait for animations
    await page.click('button[type="submit"]', { force: true });

    // Wait for response
    const response = await responsePromise;

    // Verify success
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('token');
    expect(data).toHaveProperty('user');

    console.log('✅ Login API response valid');
  });

  test('should fetch single product API', async ({ request }) => {
    const baseUrl = process.env.TEST_URL || 'http://localhost:5173';

    // First get a product ID
    const listResponse = await request.get(`${baseUrl}/api/catalog/products`);
    const listJson = await listResponse.json();
    const productId = listJson.data[0].id;

    // Fetch single product
    const response = await request.get(`${baseUrl}/api/catalog/products/${productId}`);
    expect(response.status()).toBe(200);

    const json = await response.json();
    expect(json).toHaveProperty('data');
    expect(json.data).toHaveProperty('sync_product');
    expect(json.data).toHaveProperty('sync_variants');
    expect(Array.isArray(json.data.sync_variants)).toBe(true);

    console.log(`✅ Single product API returned product: ${json.data.sync_product.name}`);
  });

  test('should fetch game stats API', async ({ request }) => {
    const baseUrl = process.env.TEST_URL || 'http://localhost:5173';

    // Fetch stats for a test session
    const response = await request.get(`${baseUrl}/api/games/stats/test-session-e2e`);
    expect(response.status()).toBe(200);

    const json = await response.json();
    expect(json).toHaveProperty('data');
    expect(json.data).toHaveProperty('sessionToken');
    expect(json.data).toHaveProperty('totalGamesPlayed');
    expect(json.data).toHaveProperty('totalDiscountEarned');

    console.log('✅ Game stats API response valid');
  });

  test('should handle cart sync API', async ({ request }) => {
    const baseUrl = process.env.TEST_URL || 'http://localhost:5173';

    // Test cart sync endpoint with valid data
    const response = await request.post(`${baseUrl}/api/cart/sync`, {
      data: {
        sessionToken: 'test-session-e2e-' + Date.now(),
        cart: {
          items: [],
          discounts: [],
        },
      },
    });

    expect(response.status()).toBe(200);

    const json = await response.json();
    expect(json).toHaveProperty('success');
    expect(json.success).toBe(true);

    console.log('✅ Cart sync API response valid');
  });

  test('should reject invalid cart sync request', async ({ request }) => {
    const baseUrl = process.env.TEST_URL || 'http://localhost:5173';

    // Test cart sync endpoint with missing data
    const response = await request.post(`${baseUrl}/api/cart/sync`, {
      data: {
        sessionToken: 'test-session',
        // Missing cart field
      },
    });

    expect(response.status()).toBe(400);

    const json = await response.json();
    expect(json).toHaveProperty('error');

    console.log('✅ Cart sync API correctly rejects invalid request');
  });
});
