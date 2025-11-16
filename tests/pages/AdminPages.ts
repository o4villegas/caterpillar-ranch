/**
 * Page Object Models: Admin Pages
 *
 * CHECK app/routes/admin/ if methods fail!
 */

import { Page, Locator, expect } from '@playwright/test';
import { selectors } from '../utils/selectors';
import { waitForAnimations, loginAsAdmin } from '../utils/helpers';

export class AdminLoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator(selectors.adminLogin.emailInput);
    this.passwordInput = page.locator(selectors.adminLogin.passwordInput);
    this.submitButton = page.locator(selectors.adminLogin.submitButton);
  }

  async goto() {
    await this.page.goto('/admin/login');
    await waitForAnimations(this.page);
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
    await waitForAnimations(this.page, 1500);
  }

  async loginAsAdmin() {
    await loginAsAdmin(this.page);
  }

  async assertOnDashboard() {
    await expect(this.page).toHaveURL('/admin/dashboard');
  }
}

export class AdminDashboardPage {
  readonly page: Page;
  readonly ordersToday: Locator;
  readonly revenueToday: Locator;
  readonly activeProducts: Locator;
  readonly gamesToday: Locator;

  constructor(page: Page) {
    this.page = page;
    this.ordersToday = page.locator(selectors.adminDashboard.ordersToday);
    this.revenueToday = page.locator(selectors.adminDashboard.revenueToday);
    this.activeProducts = page.locator(selectors.adminDashboard.activeProducts);
    this.gamesToday = page.locator(selectors.adminDashboard.gamesToday);
  }

  async goto() {
    await this.page.goto('/admin/dashboard');
    await waitForAnimations(this.page);
  }

  async getStats() {
    const stats = {
      orders: await this.ordersToday.textContent(),
      revenue: await this.revenueToday.textContent(),
      products: await this.activeProducts.textContent(),
      games: await this.gamesToday.textContent(),
    };
    return stats;
  }

  async navigateToOrders() {
    await this.page.click(selectors.adminDashboard.ordersLink);
    await waitForAnimations(this.page);
  }

  async navigateToAnalytics() {
    await this.page.click(selectors.adminDashboard.analyticsLink);
    await waitForAnimations(this.page);
  }

  async navigateToProducts() {
    await this.page.click(selectors.adminDashboard.productsLink);
    await waitForAnimations(this.page);
  }

  async assertStatsVisible() {
    await expect(this.ordersToday).toBeVisible();
    await expect(this.revenueToday).toBeVisible();
    await expect(this.activeProducts).toBeVisible();
    await expect(this.gamesToday).toBeVisible();
  }
}

export class AdminOrdersPage {
  readonly page: Page;
  readonly title: Locator;
  readonly table: Locator;
  readonly searchInput: Locator;

  constructor(page: Page) {
    this.page = page;
    this.title = page.locator(selectors.adminOrders.title);
    this.table = page.locator(selectors.adminOrders.table);
    this.searchInput = page.locator(selectors.adminOrders.searchInput);
  }

  async goto() {
    await this.page.goto('/admin/orders');
    await waitForAnimations(this.page);
  }

  async getOrderCount() {
    const rows = this.page.locator(selectors.adminOrders.tableRow);
    return await rows.count();
  }

  async searchOrders(query: string) {
    await this.searchInput.fill(query);
    await waitForAnimations(this.page, 500);
  }

  async assertHasOrders() {
    const count = await this.getOrderCount();
    expect(count).toBeGreaterThan(0);
  }
}

export class AdminAnalyticsPage {
  readonly page: Page;
  readonly title: Locator;
  readonly revenueChart: Locator;
  readonly ordersChart: Locator;

  constructor(page: Page) {
    this.page = page;
    this.title = page.locator(selectors.adminAnalytics.title);
    this.revenueChart = page.locator(selectors.adminAnalytics.revenueChart);
    this.ordersChart = page.locator(selectors.adminAnalytics.ordersChart);
  }

  async goto() {
    await this.page.goto('/admin/analytics');
    await waitForAnimations(this.page);
  }

  async assertChartsVisible() {
    await expect(this.revenueChart).toBeVisible();
    await expect(this.ordersChart).toBeVisible();
  }
}
