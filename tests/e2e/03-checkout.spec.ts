/**
 * E2E Test: Checkout Flow
 *
 * Tests shipping form, review, and confirmation
 * CRITICAL: If tests fail, check app/routes/checkout*.tsx first!
 */

import { test, expect } from '@playwright/test';
import { CheckoutPage, CheckoutReviewPage, CheckoutConfirmationPage } from '../pages/CheckoutPage';
import {
  addProductToCart,
  clearCart,
  waitForAnimations,
  getProductSlug,
} from '../utils/helpers';

test.describe('Checkout Flow', () => {
  let productSlug: string;

  test.beforeAll(async ({ request }) => {
    // Fetch a real product slug once for all tests
    productSlug = await getProductSlug(request, 0);
    console.log(`Using product for checkout tests: ${productSlug}`);
  });

  test.beforeEach(async ({ page, request }) => {
    // Add product to cart before each test
    await addProductToCart(page, productSlug, 'M', 1);
  });

  test.afterEach(async ({ page }) => {
    await clearCart(page);
  });

  test('should complete full checkout flow', async ({ page }) => {
    const checkout = new CheckoutPage(page);
    const review = new CheckoutReviewPage(page);
    const confirmation = new CheckoutConfirmationPage(page);

    // Step 1: Fill shipping form
    await checkout.goto();
    await checkout.fillForm();
    await checkout.submit();

    // Step 2: Review order
    await checkout.assertOnReviewPage();
    await review.assertOrderSummaryVisible();
    await review.placeOrder();

    // Step 3: Verify confirmation
    await waitForAnimations(page, 2000);
    await expect(page).toHaveURL('/checkout/confirmation');
    await confirmation.assertOrderConfirmed();

    // Get order number
    const orderNum = await confirmation.getOrderNumber();
    console.log(`✅ Order placed: ${orderNum}`);
    expect(orderNum).toBeTruthy();
  });

  test('should validate required fields', async ({ page }) => {
    const checkout = new CheckoutPage(page);

    await checkout.goto();

    // Submit without filling form
    await checkout.submit();

    // Should show validation errors
    await checkout.assertValidationError('email');
  });

  test('should validate email format', async ({ page }) => {
    const checkout = new CheckoutPage(page);

    await checkout.goto();
    await checkout.fillForm({ email: 'invalid-email' });
    await checkout.submit();

    // Should show email validation error
    await checkout.assertValidationError('email');
  });

  test('should allow optional address line 2', async ({ page }) => {
    const checkout = new CheckoutPage(page);

    await checkout.goto();
    await checkout.fillForm({
      address2: 'Apt 4B',
    });
    await checkout.submit();

    // Should proceed to review
    await checkout.assertOnReviewPage();
  });

  test('should redirect to homepage if cart is empty', async ({ page }) => {
    await clearCart(page);

    // Try to access checkout
    await page.goto('/checkout');
    await waitForAnimations(page);

    // Should redirect to homepage
    await expect(page).toHaveURL('/');
  });
});
