/**
 * Stripe Checkout Integration Test
 *
 * Tests the complete checkout flow from cart to Stripe payment page
 * Uses Playwright to automate browser interactions
 */

import { test, expect } from '@playwright/test';
import { selectors } from '../utils/selectors';

test.describe('Stripe Checkout Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing cart data
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.removeItem('caterpillar-ranch-cart');
      sessionStorage.removeItem('checkout_shipping');
      sessionStorage.removeItem('pending_order');
    });
    // Reload to apply cleared storage
    await page.reload();
  });

  test('complete checkout flow to Stripe', async ({ page }) => {
    // Step 1: Go to homepage and add product to cart
    await page.goto('/');
    await expect(page).toHaveTitle(/Caterpillar Ranch/);

    // Wait for products to load - look for product grid with cards
    // The cards use motion.button with class "card"
    await page.waitForSelector('.card', { timeout: 15000 });

    // Wait for animations to settle
    await page.waitForTimeout(500);

    // Click on first product card
    const productCard = page.locator('.card').first();
    await expect(productCard).toBeVisible();

    // Use Promise.all to handle navigation + click together
    await Promise.all([
      page.waitForURL(/\/products\//, { timeout: 15000 }),
      productCard.click()
    ]);

    // Wait for product page to fully load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    // Verify we're on the product page by checking for size buttons or back button
    await expect(page.locator('button:has-text("Back to Products")')).toBeVisible({ timeout: 5000 });

    // Select a size - use aria-pressed attribute to find size buttons
    // These are the actual size selection buttons in the product page
    const sizeButton = page.locator('button[aria-pressed]').first();
    await sizeButton.waitFor({ state: 'visible', timeout: 5000 });
    await sizeButton.click({ force: true });

    // Wait for size selection to register and button text to change
    await page.waitForTimeout(1000);

    // Verify a size was selected (button should now show "Claim Your Harvest")
    await expect(page.locator('button:has-text("Claim Your Harvest")')).toBeVisible({ timeout: 5000 });

    // Click Add to Cart
    const addToCartButton = page.locator('button:has-text("Claim Your Harvest")');
    await addToCartButton.click({ force: true });

    // Wait for cart to update
    await page.waitForTimeout(2000);

    // Step 2: Open cart and proceed to checkout
    const cartIcon = page.locator(selectors.cart.icon);
    await cartIcon.click();

    // Wait for cart drawer to open
    await page.waitForSelector(selectors.cart.drawer, { timeout: 5000 });

    // Click checkout button - use "Proceed to Harvest" or similar
    const checkoutButton = page.locator('button:has-text("Proceed"), button:has-text("Harvest"), button:has-text("Checkout")').first();
    await checkoutButton.waitFor({ state: 'visible', timeout: 5000 });
    await checkoutButton.click();

    // Wait for checkout page
    await page.waitForURL(/\/checkout/, { timeout: 10000 });

    // Step 3: Fill shipping information - scope to form to avoid footer email input
    const checkoutForm = page.locator('form').first();
    await checkoutForm.locator('input[type="email"]').fill('test@example.com');
    await checkoutForm.locator('input[placeholder*="John Doe"]').fill('Test User');
    await checkoutForm.locator('input[placeholder*="123 Main"]').fill('123 Test Street');
    await checkoutForm.locator('input[placeholder*="City"]').fill('Test City');
    await checkoutForm.locator('input[placeholder*="CA"]').fill('CA');
    await checkoutForm.locator('input[placeholder*="12345"]').fill('90210');

    // Click continue to review
    const continueButton = page.locator(selectors.checkout.submitButton);
    await continueButton.click();

    // Step 4: Review page - click Pay Now
    await page.waitForURL(/\/checkout\/review/, { timeout: 10000 });

    // Wait for review page to load
    await page.waitForTimeout(1000);

    // Click Pay Now button (updated text)
    const payButton = page.locator('button:has-text("Pay Now")');
    await expect(payButton).toBeVisible({ timeout: 5000 });
    await payButton.click();

    // Step 5: Should redirect to Stripe Checkout
    // Wait for navigation to Stripe
    await page.waitForURL(/checkout\.stripe\.com/, { timeout: 20000 });

    // Verify we're on Stripe checkout page
    expect(page.url()).toContain('checkout.stripe.com');

    // Take screenshot for verification
    await page.screenshot({ path: 'tests/screenshots/stripe-checkout.png', fullPage: true });

    console.log('✅ Successfully reached Stripe Checkout!');
    console.log('URL:', page.url());
  });

  test.skip('stripe checkout with test card payment', async ({ page }) => {
    // SKIPPED: Stripe Checkout uses iframes that are difficult to automate
    // The card inputs are intentionally protected by Stripe for security
    // For full payment testing, use Stripe's test mode with webhooks
    // or manual testing in the browser

    // Step 1: Go to homepage and add product to cart
    await page.goto('/');

    // Wait for products to load - look for product cards
    await page.waitForSelector('.card', { timeout: 15000 });
    await page.waitForTimeout(500);

    // Click on first product
    const productCard = page.locator('.card').first();
    await expect(productCard).toBeVisible();
    await productCard.click();

    // Wait for product page to load
    await page.waitForURL(/\/products\//, { timeout: 10000 });

    // Select a size - look for size buttons
    const sizeButton = page.locator('button:has-text("M"), button:has-text("L"), button:has-text("S")').first();
    await sizeButton.waitFor({ state: 'visible', timeout: 5000 });
    await sizeButton.click();

    // Click Add to Cart
    const addToCartButton = page.locator(selectors.product.addToCartButton);
    await addToCartButton.click();
    await page.waitForTimeout(1500);

    // Open cart and checkout
    const cartIcon = page.locator(selectors.cart.icon);
    await cartIcon.click();
    await page.waitForSelector(selectors.cart.drawer, { timeout: 5000 });

    const checkoutButton = page.locator('button:has-text("Proceed"), button:has-text("Harvest"), button:has-text("Checkout")').first();
    await checkoutButton.click();
    await page.waitForURL(/\/checkout/, { timeout: 10000 });

    // Fill shipping info - scope to form to avoid footer email input
    const checkoutForm = page.locator('form').first();
    await checkoutForm.locator('input[type="email"]').fill('test@example.com');
    await checkoutForm.locator('input[placeholder*="John Doe"]').fill('Test User');
    await checkoutForm.locator('input[placeholder*="123 Main"]').fill('123 Test Street');
    await checkoutForm.locator('input[placeholder*="City"]').fill('Test City');
    await checkoutForm.locator('input[placeholder*="CA"]').fill('CA');
    await checkoutForm.locator('input[placeholder*="12345"]').fill('90210');

    const continueButton = checkoutForm.locator('button[type="submit"]');
    await continueButton.click();

    // Review and pay
    await page.waitForURL(/\/checkout\/review/, { timeout: 10000 });
    await page.waitForTimeout(1000);

    const payButton = page.locator('button:has-text("Pay Now")');
    await payButton.click();

    // Wait for Stripe Checkout
    await page.waitForURL(/checkout\.stripe\.com/, { timeout: 20000 });

    // Take a screenshot of Stripe page
    await page.screenshot({ path: 'tests/screenshots/stripe-payment-page.png', fullPage: true });

    // Fill Stripe test card details
    // Stripe Checkout uses a single-page form
    await page.waitForTimeout(2000); // Wait for Stripe to fully load

    try {
      // Look for email field first (Stripe pre-fills from session)
      const emailField = page.locator('input[name="email"], input[autocomplete="email"]').first();
      if (await emailField.isVisible()) {
        await emailField.fill('test@example.com');
      }

      // Card number - Stripe test card
      const cardInput = page.locator('input[name="cardNumber"], input[placeholder*="1234"]').first();
      await cardInput.waitFor({ state: 'visible', timeout: 10000 });
      await cardInput.fill('4242424242424242');

      // Expiry
      const expiryInput = page.locator('input[name="cardExpiry"], input[placeholder*="MM"]').first();
      await expiryInput.fill('1234');

      // CVC
      const cvcInput = page.locator('input[name="cardCvc"], input[placeholder*="CVC"]').first();
      await cvcInput.fill('123');

      // Billing name (if present)
      const nameInput = page.locator('input[name="billingName"], input[placeholder*="name" i]').first();
      if (await nameInput.isVisible()) {
        await nameInput.fill('Test User');
      }

      // ZIP/Postal code (if present)
      const zipInput = page.locator('input[name="billingPostalCode"], input[placeholder*="ZIP" i]').first();
      if (await zipInput.isVisible()) {
        await zipInput.fill('90210');
      }

      // Take screenshot before submit
      await page.screenshot({ path: 'tests/screenshots/stripe-filled-form.png', fullPage: true });

      // Submit payment
      const submitButton = page.locator('button[type="submit"], button:has-text("Pay")').first();
      await submitButton.click();

      // Wait for redirect back to success page
      await page.waitForURL(/\/checkout\/success/, { timeout: 45000 });

      // Verify success page
      await expect(page.locator('text=Order Confirmed, text=Success, text=Thank you, text=Confirmed').first()).toBeVisible({ timeout: 10000 });

      // Take final screenshot
      await page.screenshot({ path: 'tests/screenshots/order-success.png', fullPage: true });

      console.log('✅ Payment completed successfully!');
      console.log('Final URL:', page.url());

    } catch (error) {
      // Stripe Checkout has a complex DOM, take screenshot for debugging
      await page.screenshot({ path: 'tests/screenshots/stripe-payment-error.png', fullPage: true });
      console.log('Error during Stripe payment:', error);
      console.log('Current URL:', page.url());
      throw error;
    }
  });
});
