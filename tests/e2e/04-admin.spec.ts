/**
 * E2E Test: Admin Workflow
 *
 * Tests admin login, dashboard, orders, analytics
 * CRITICAL: If tests fail, check app/routes/admin/ first!
 */

import { test, expect } from '@playwright/test';
import {
  AdminLoginPage,
  AdminDashboardPage,
  AdminOrdersPage,
  AdminAnalyticsPage,
} from '../pages/AdminPages';

test.describe('Admin Workflow', () => {
  test('should login as admin', async ({ page }) => {
    const login = new AdminLoginPage(page);

    await login.goto();
    await login.login('lando@gvoassurancepartners.com', 'duderancch');

    // Should redirect to dashboard
    await login.assertOnDashboard();
  });

  test('should display dashboard stats', async ({ page }) => {
    const login = new AdminLoginPage(page);
    const dashboard = new AdminDashboardPage(page);

    // Login first
    await login.goto();
    await login.loginAsAdmin();

    // Verify stats visible
    await dashboard.assertStatsVisible();

    // Get stats
    const stats = await dashboard.getStats();
    console.log('Dashboard Stats:', stats);

    expect(stats.orders).toBeTruthy();
    expect(stats.revenue).toBeTruthy();
    expect(stats.products).toBeTruthy();
    expect(stats.games).toBeTruthy();
  });

  test('should navigate to orders page', async ({ page }) => {
    const login = new AdminLoginPage(page);
    const dashboard = new AdminDashboardPage(page);
    const orders = new AdminOrdersPage(page);

    // Login and navigate
    await login.goto();
    await login.loginAsAdmin();
    await dashboard.navigateToOrders();

    // Verify on orders page
    await expect(page).toHaveURL('/admin/orders');
    await expect(orders.title).toBeVisible();
  });

  test('should navigate to analytics page', async ({ page }) => {
    const login = new AdminLoginPage(page);
    const dashboard = new AdminDashboardPage(page);
    const analytics = new AdminAnalyticsPage(page);

    // Login and navigate
    await login.goto();
    await login.loginAsAdmin();
    await dashboard.navigateToAnalytics();

    // Verify on analytics page
    await expect(page).toHaveURL('/admin/analytics');
    await expect(analytics.title).toBeVisible();
    await analytics.assertChartsVisible();
  });

  test('should require authentication', async ({ page }) => {
    // Try to access dashboard without login
    await page.goto('/admin/dashboard');

    // Should redirect to login
    await expect(page).toHaveURL('/admin/login');
  });
});
