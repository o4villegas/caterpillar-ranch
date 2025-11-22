/**
 * Page Object Model: Cart Drawer
 *
 * CHECK app/lib/components/Cart/CartDrawer.tsx if methods fail!
 */

import { Page, Locator, expect } from '@playwright/test';
import { selectors } from '../utils/selectors';
import { waitForAnimations } from '../utils/helpers';

export class CartDrawer {
  readonly page: Page;
  readonly icon: Locator;
  readonly badge: Locator;
  readonly drawer: Locator;
  readonly checkoutButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.icon = page.locator(selectors.cart.icon);
    this.badge = page.locator(selectors.cart.badge);
    this.drawer = page.locator(selectors.cart.drawer);
    this.checkoutButton = page.locator(selectors.cart.checkoutButton);
  }

  async open() {
    // Wait for Framer Motion animations to stabilize (whileHover, wiggle-wrong, heartbeat-pulse)
    await this.page.waitForTimeout(1500);

    // Force click to bypass stability checks (animations never fully stabilize)
    await this.icon.click({ force: true });
    await waitForAnimations(this.page);
    await expect(this.drawer).toBeVisible();
  }

  async close() {
    await this.page.keyboard.press('Escape');
    await waitForAnimations(this.page, 300);
  }

  async getItemCount() {
    const text = await this.badge.textContent();
    return parseInt(text || '0', 10);
  }

  async getCartItems() {
    const items = this.page.locator(selectors.cart.item);
    return await items.count();
  }

  async removeItem(index: number = 0) {
    const removeButtons = this.page.locator(selectors.cart.removeButton);
    await removeButtons.nth(index).click({ force: true });
    await waitForAnimations(this.page, 500);
  }

  async getTotals() {
    // Wait for cart totals to be visible
    await waitForAnimations(this.page, 500);

    // Get subtotal - should always exist
    const subtotalLocator = this.page.locator(selectors.cart.subtotal);
    const subtotalText = await subtotalLocator.first().textContent().catch(() => '');

    // Discount is optional (only appears when discount is earned)
    const discountLocator = this.page.locator(selectors.cart.discount);
    const discountExists = await discountLocator.count() > 0;
    const discountText = discountExists ? await discountLocator.first().textContent().catch(() => '') : '';

    // Get total - should always exist
    const totalLocator = this.page.locator(selectors.cart.total);
    const totalText = await totalLocator.first().textContent().catch(() => '');

    return {
      subtotal: subtotalText || '',
      discount: discountText || '',
      total: totalText || '',
    };
  }

  async proceedToCheckout() {
    await waitForAnimations(this.page, 500);
    await this.checkoutButton.click({ force: true });
    await waitForAnimations(this.page);
  }

  async assertHasItems() {
    const count = await this.getItemCount();
    expect(count).toBeGreaterThan(0);
  }

  async assertEmpty() {
    await this.open();
    const emptyTitle = this.page.locator(selectors.cart.drawerEmpty);
    await expect(emptyTitle).toBeVisible();
  }
}
