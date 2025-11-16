/**
 * Page Object Model: Checkout Flow
 *
 * CHECK app/routes/checkout.tsx and checkout.review.tsx if methods fail!
 */

import { Page, Locator, expect } from '@playwright/test';
import { selectors } from '../utils/selectors';
import { fillShippingForm, waitForAnimations, type ShippingInfo } from '../utils/helpers';

export class CheckoutPage {
  readonly page: Page;
  readonly title: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.title = page.locator(selectors.checkout.title);
    this.submitButton = page.locator(selectors.checkout.submitButton);
  }

  async goto() {
    await this.page.goto('/checkout');
    await waitForAnimations(this.page);
  }

  async fillForm(data?: Partial<ShippingInfo>) {
    await fillShippingForm(this.page, data);
  }

  async submit() {
    await this.submitButton.click();
    await waitForAnimations(this.page);
  }

  async assertValidationError(field: string) {
    const errors = this.page.locator(selectors.checkout.validationError);
    await expect(errors.first()).toBeVisible();
  }

  async assertOnReviewPage() {
    await expect(this.page).toHaveURL('/checkout/review');
    const reviewTitle = this.page.locator(selectors.review.title);
    await expect(reviewTitle).toBeVisible();
  }
}

export class CheckoutReviewPage {
  readonly page: Page;
  readonly title: Locator;
  readonly placeOrderButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.title = page.locator(selectors.review.title);
    this.placeOrderButton = page.locator(selectors.review.placeOrderButton);
  }

  async placeOrder() {
    await this.placeOrderButton.click();
    await waitForAnimations(this.page, 2000); // Order creation takes time
  }

  async assertOrderSummaryVisible() {
    const summary = this.page.locator(selectors.review.orderSummary);
    await expect(summary).toBeVisible();
  }
}

export class CheckoutConfirmationPage {
  readonly page: Page;
  readonly title: Locator;
  readonly orderNumber: Locator;

  constructor(page: Page) {
    this.page = page;
    this.title = page.locator(selectors.confirmation.title);
    this.orderNumber = page.locator(selectors.confirmation.orderNumber);
  }

  async assertOrderConfirmed() {
    await expect(this.title).toBeVisible();
    await expect(this.orderNumber).toBeVisible();
  }

  async getOrderNumber() {
    const text = await this.orderNumber.textContent();
    return text?.replace('Order #', '').trim() || '';
  }
}
