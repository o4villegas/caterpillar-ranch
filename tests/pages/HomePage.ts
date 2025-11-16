/**
 * Page Object Model: Homepage
 *
 * Encapsulates all interactions with the homepage
 * If methods fail, CHECK APP CODE in app/routes/home.tsx first!
 */

import { Page, Locator, expect } from '@playwright/test';
import { selectors } from '../utils/selectors';
import { waitForAnimations, waitForProductsToLoad } from '../utils/helpers';

export class HomePage {
  readonly page: Page;
  readonly logo: Locator;
  readonly productGrid: Locator;
  readonly productCards: Locator;

  constructor(page: Page) {
    this.page = page;
    this.logo = page.locator(selectors.homepage.logo);
    this.productGrid = page.locator(selectors.homepage.productGrid);
    this.productCards = page.locator(selectors.homepage.productCard);
  }

  async goto() {
    await this.page.goto('/');
    await waitForProductsToLoad(this.page);
  }

  async getProductCount() {
    return await this.productCards.count();
  }

  async clickProduct(index: number = 0) {
    await this.productCards.nth(index).click();
    await waitForAnimations(this.page);
  }

  async getProductNames() {
    const names: string[] = [];
    const count = await this.getProductCount();

    for (let i = 0; i < count; i++) {
      const nameElement = this.productCards.nth(i).locator(selectors.homepage.productName);
      const text = await nameElement.textContent();
      if (text) names.push(text.trim());
    }

    return names;
  }

  async getProductPrices() {
    const prices: string[] = [];
    const count = await this.getProductCount();

    for (let i = 0; i < count; i++) {
      const priceElement = this.productCards.nth(i).locator(selectors.homepage.productPrice);
      const text = await priceElement.textContent();
      if (text) prices.push(text.trim());
    }

    return prices;
  }

  async assertLoaded() {
    await expect(this.logo).toBeVisible();
    await expect(this.productGrid).toBeVisible();
    const count = await this.getProductCount();
    expect(count).toBeGreaterThan(0);
  }

  async assertProductsVisible() {
    const count = await this.getProductCount();
    expect(count).toBeGreaterThan(0);

    // Check first product has all elements
    const firstCard = this.productCards.first();
    await expect(firstCard.locator(selectors.homepage.productImage)).toBeVisible();
    await expect(firstCard.locator(selectors.homepage.productName)).toBeVisible();
    await expect(firstCard.locator(selectors.homepage.productPrice)).toBeVisible();
  }
}
