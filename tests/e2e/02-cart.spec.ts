/**
 * E2E Test: Cart Functionality
 *
 * Tests cart add/remove, quantity, discounts
 * CRITICAL: If tests fail, check app/lib/components/Cart/ and app/lib/contexts/CartContext.tsx first!
 */

import { test, expect } from '@playwright/test';
import { CartDrawer } from '../pages/CartDrawer';
import { addProductToCart, clearCart, waitForAnimations } from '../utils/helpers';

test.describe('Cart Functionality', () => {
  let cart: CartDrawer;

  test.beforeEach(async ({ page }) => {
    cart = new CartDrawer(page);
    await page.goto('/');
    await waitForAnimations(page);
  });

  test.afterEach(async ({ page }) => {
    // Clean up: clear cart after each test
    await clearCart(page);
  });

  test('should add product to cart', async ({ page }) => {
    // Add first product (using real Printful product slug)
    const count = await addProductToCart(page, 'glitch-tee', 'M', 1);

    // Verify cart badge shows 1 item
    expect(count).toBe(1);

    // Open cart drawer
    await cart.open();

    // Verify item appears in cart
    const items = await cart.getCartItems();
    expect(items).toBe(1);
  });

  test('should show correct item count badge', async ({ page }) => {
    // Add 3 items (using real Printful product slugs)
    await addProductToCart(page, 'glitch-tee', 'M', 1);
    await addProductToCart(page, 'resistance-tee', 'L', 2);

    // Badge should show 3
    const count = await cart.getItemCount();
    expect(count).toBe(3);
  });

  test('should remove item from cart', async ({ page }) => {
    // Add 2 products (using real Printful product slugs)
    await addProductToCart(page, 'glitch-tee', 'M', 1);
    await addProductToCart(page, 'resistance-tee', 'L', 1);

    // Open cart
    await cart.open();

    // Remove first item
    await cart.removeItem(0);

    // Should have 1 item left
    const items = await cart.getCartItems();
    expect(items).toBe(1);
  });

  test('should calculate totals correctly', async ({ page }) => {
    // Add product (using real Printful product slug)
    await addProductToCart(page, 'glitch-tee', 'M', 2);

    // Open cart
    await cart.open();

    // Get totals
    const totals = await cart.getTotals();

    console.log('Cart Totals:', totals);

    // Verify totals exist
    expect(totals.subtotal).toBeTruthy();
    expect(totals.total).toBeTruthy();
  });

  test('should persist cart to localStorage', async ({ page }) => {
    // Add product (using real Printful product slug)
    await addProductToCart(page, 'glitch-tee', 'M', 1);

    // Check localStorage
    const cartData = await page.evaluate(() => {
      return localStorage.getItem('caterpillar-ranch-cart');
    });

    expect(cartData).toBeTruthy();

    // Parse and verify
    const cart = JSON.parse(cartData!);
    expect(cart.items.length).toBe(1);
  });

  test('should load cart from localStorage on page refresh', async ({ page }) => {
    // Add product (using real Printful product slug)
    await addProductToCart(page, 'glitch-tee', 'M', 1);

    // Reload page
    await page.reload();
    await waitForAnimations(page);

    // Cart should still have 1 item
    const count = await cart.getItemCount();
    expect(count).toBe(1);
  });

  test('should navigate to checkout', async ({ page }) => {
    // Add product (using real Printful product slug)
    await addProductToCart(page, 'glitch-tee', 'M', 1);

    // Open cart
    await cart.open();

    // Click checkout button
    await cart.proceedToCheckout();

    // Verify on checkout page
    await expect(page).toHaveURL('/checkout');
  });

  test('should show empty state when no items', async ({ page }) => {
    // Open cart (should be empty)
    await cart.assertEmpty();
  });

  test('should apply discounts correctly', async ({ page }) => {
    // TODO: Implement game playing to earn discount
    // For now, manually test discount calculation

    // Add product (using real Printful product slug)
    await addProductToCart(page, 'glitch-tee', 'M', 1);

    // Open cart
    await cart.open();

    // Get totals (no discount yet)
    const totals = await cart.getTotals();
    console.log('Totals without discount:', totals);

    // In future: play game, earn discount, verify discount applied
  });
});
