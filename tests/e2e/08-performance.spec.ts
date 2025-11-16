/**
 * E2E Test: Performance Metrics
 *
 * Tests Core Web Vitals (LCP, FCP, TTI)
 * CRITICAL: If metrics fail, investigate bundle size, image optimization, SSR performance first!
 */

import { test, expect } from '@playwright/test';
import { getCoreWebVitals, waitForProductsToLoad } from '../utils/helpers';

test.describe('Performance Metrics', () => {
  test('homepage should meet Core Web Vitals thresholds', async ({ page }) => {
    await page.goto('/');
    await waitForProductsToLoad(page);

    const vitals = await getCoreWebVitals(page);

    console.log('Homepage Core Web Vitals:');
    console.log(`  LCP: ${vitals.lcp}ms (target: <2500ms good, <4000ms acceptable)`);
    console.log(`  FCP: ${vitals.fcp}ms (target: <1800ms good, <3000ms acceptable)`);
    console.log(`  TTI: ${vitals.tti}ms (target: <3800ms good, <7300ms acceptable)`);

    // Assertions
    expect(vitals.lcp).toBeLessThan(4000); // Acceptable threshold
    expect(vitals.fcp).toBeLessThan(3000);
    expect(vitals.tti).toBeLessThan(7300);
  });

  test('product page should load quickly', async ({ page }) => {
    await page.goto('/products/cr-100');

    const vitals = await getCoreWebVitals(page);

    console.log('Product Page Core Web Vitals:');
    console.log(`  LCP: ${vitals.lcp}ms`);
    console.log(`  FCP: ${vitals.fcp}ms`);
    console.log(`  TTI: ${vitals.tti}ms`);

    expect(vitals.lcp).toBeLessThan(4000);
    expect(vitals.fcp).toBeLessThan(3000);
    expect(vitals.tti).toBeLessThan(7300);
  });

  test('admin dashboard should load within acceptable time', async ({ page }) => {
    // Login
    await page.goto('/admin/login');
    await page.fill('input#email', 'lando@gvoassurancepartners.com');
    await page.fill('input#password', 'duderancch');
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin/dashboard');

    const vitals = await getCoreWebVitals(page);

    console.log('Admin Dashboard Core Web Vitals:');
    console.log(`  LCP: ${vitals.lcp}ms`);
    console.log(`  FCP: ${vitals.fcp}ms`);
    console.log(`  TTI: ${vitals.tti}ms`);

    expect(vitals.lcp).toBeLessThan(5000); // Slightly relaxed for admin
    expect(vitals.fcp).toBeLessThan(3000);
    expect(vitals.tti).toBeLessThan(8000);
  });
});
