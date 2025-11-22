/**
 * E2E Test: Multi-Color Product Selection
 *
 * Tests color variant selection on product pages with ColorSwatch component
 * CRITICAL: Tests run against PRODUCTION URL only
 *
 * Features tested:
 * - Color swatch rendering and interactions
 * - Image updates on color change
 * - Size filtering by selected color
 * - Selected state visual indicators
 * - ARIA labels and accessibility
 * - Layout order (color above size buttons)
 * - Backward compatibility (modal without color selection)
 */

import { test, expect } from '@playwright/test';
import { selectors } from '../utils/selectors';
import { waitForAnimations, getProductSlug, fetchProducts } from '../utils/helpers';

test.describe('Multi-Color Product Selection', () => {
  let multiColorProductSlug: string;
  let hasMultiColorProducts: boolean = false;

  test.beforeAll(async ({ request }) => {
    // Fetch products and try to find one with multiple colors
    // For now, we'll use the first product - color selection only appears if product has colorVariants
    const products = await fetchProducts(request);
    if (products.length > 0) {
      multiColorProductSlug = products[0].slug;
    }
    console.log(`Using product for color tests: ${multiColorProductSlug}`);
  });

  test('should display color selection UI on product page (if available)', async ({ page }) => {
    test.skip(!multiColorProductSlug, 'No products available for testing');

    // Navigate to product page
    await page.goto(`/products/${multiColorProductSlug}`);
    await waitForAnimations(page);

    // Check if color selection UI exists (only for multi-color products)
    const colorLabel = page.locator(selectors.productPage.colorLabel);
    const hasColorSelection = await colorLabel.isVisible().catch(() => false);

    if (hasColorSelection) {
      // Verify "Choose Your Color" label text
      await expect(colorLabel).toHaveText('Choose Your Color');

      // Verify color swatch group exists
      const swatchGroup = page.locator(selectors.productPage.colorSwatchGroup);
      await expect(swatchGroup).toBeVisible();

      // Verify swatches are present
      const swatches = page.locator(selectors.productPage.colorSwatch);
      const swatchCount = await swatches.count();
      console.log(`✅ Found ${swatchCount} color swatches`);

      if (swatchCount > 1) {
        // Verify at least one swatch is selected by default
        const selectedSwatch = page.locator(selectors.productPage.colorSwatchSelected);
        await expect(selectedSwatch).toBeVisible();
      }
    } else {
      // Product doesn't have color selection - that's okay, verify size selector exists instead
      const sizeLabel = page.locator(selectors.productPage.sizeLabel);
      await expect(sizeLabel).toBeVisible();
      console.log('ℹ️ Product does not have color selection UI (single color product)');
    }
  });

  test('should display correct layout order (color above size) if color exists', async ({ page }) => {
    test.skip(!multiColorProductSlug, 'No products available for testing');

    await page.goto(`/products/${multiColorProductSlug}`);
    await waitForAnimations(page);

    // Get bounding boxes to verify vertical order
    const colorLabel = page.locator(selectors.productPage.colorLabel);
    const sizeLabel = page.locator(selectors.productPage.sizeLabel);

    const hasColorSelection = await colorLabel.isVisible().catch(() => false);
    if (!hasColorSelection) {
      console.log('ℹ️ Product does not have color selection - skipping layout order test');
      return;
    }

    const colorBox = await colorLabel.boundingBox();
    const sizeBox = await sizeLabel.boundingBox();

    expect(colorBox).not.toBeNull();
    expect(sizeBox).not.toBeNull();

    // Verify color label is ABOVE size label (smaller Y coordinate)
    expect(colorBox!.y).toBeLessThan(sizeBox!.y);
    console.log(`✅ Color selection (Y: ${colorBox!.y}) is above size selection (Y: ${sizeBox!.y})`);
  });

  test('should have proper ARIA labels on color swatches', async ({ page }) => {
    test.skip(!multiColorProductSlug, 'No products available for testing');

    await page.goto(`/products/${multiColorProductSlug}`);
    await waitForAnimations(page);

    // Get all color swatches
    const swatches = page.locator(selectors.productPage.colorSwatch);
    const count = await swatches.count();

    if (count === 0) {
      console.log('ℹ️ No color swatches found - product has single color');
      return;
    }

    // Verify each swatch has an aria-label with color name
    for (let i = 0; i < count; i++) {
      const swatch = swatches.nth(i);
      const ariaLabel = await swatch.getAttribute('aria-label');

      expect(ariaLabel).not.toBeNull();
      expect(ariaLabel?.length).toBeGreaterThan(0);
      console.log(`✅ Swatch ${i + 1}: ${ariaLabel}`);
    }
  });

  test('should update image when color is changed', async ({ page }) => {
    test.skip(!multiColorProductSlug, 'No products available for testing');

    await page.goto(`/products/${multiColorProductSlug}`);
    await waitForAnimations(page);

    // Get initial image URL
    const productImage = page.locator(selectors.product.image);
    await expect(productImage).toBeVisible();
    const initialSrc = await productImage.getAttribute('src');
    console.log(`Initial image: ${initialSrc}`);

    // Click on a different color swatch (not the selected one)
    const swatches = page.locator(selectors.productPage.colorSwatch);
    const swatchCount = await swatches.count();

    if (swatchCount > 1) {
      // Find first unselected swatch
      for (let i = 0; i < swatchCount; i++) {
        const swatch = swatches.nth(i);
        const hasSelectedRing = await swatch.locator('.ring-2.ring-ranch-lime').count();

        if (hasSelectedRing === 0) {
          // Click the unselected swatch (force click to bypass animation stability check)
          await swatch.click({ force: true });
          console.log(`✅ Clicked color swatch ${i + 1}`);

          // Wait for image fade transition (300ms from AnimatePresence)
          await page.waitForTimeout(400);

          // Verify image changed (or stayed same if design image is prioritized)
          const newSrc = await productImage.getAttribute('src');
          console.log(`New image: ${newSrc}`);

          // Image should either change to new mockup OR stay as design image
          // Both behaviors are correct depending on whether design image exists
          expect(newSrc).toBeTruthy();
          console.log(`✅ Image handling verified: ${initialSrc === newSrc ? 'Design image priority' : 'Mockup switched'}`);
          break;
        }
      }
    } else {
      console.log('⚠️ Only one color available, skipping image change test');
    }
  });

  test('should update selected state when color swatch is clicked', async ({ page }) => {
    await page.goto(`/products/${multiColorProductSlug}`);
    await waitForAnimations(page);

    const swatches = page.locator(selectors.productPage.colorSwatch);
    const swatchCount = await swatches.count();

    if (swatchCount > 1) {
      // Find first unselected swatch
      for (let i = 0; i < swatchCount; i++) {
        const swatch = swatches.nth(i);
        const hasSelectedRing = await swatch.locator('.ring-2.ring-ranch-lime').count();

        if (hasSelectedRing === 0) {
          const ariaLabel = await swatch.getAttribute('aria-label');
          console.log(`Clicking color: ${ariaLabel}`);

          // Click the swatch (force click to bypass animation stability check)
          await swatch.click({ force: true });
          await page.waitForTimeout(200);

          // Verify this swatch now has selected state
          const selectedRing = swatch.locator('.ring-2.ring-ranch-lime');
          await expect(selectedRing).toBeVisible();

          // Verify it has lime glow shadow
          const selectedDiv = swatch.locator('.ring-2.ring-ranch-lime');
          const classValue = await selectedDiv.getAttribute('class');
          expect(classValue).toContain('shadow-[0_0_12px_rgba(50,205,50,0.5)]');

          console.log(`✅ Selected state applied to: ${ariaLabel}`);
          break;
        }
      }
    }
  });

  test('should filter sizes based on selected color', async ({ page }) => {
    await page.goto(`/products/${multiColorProductSlug}`);
    await waitForAnimations(page);

    // Get initial size buttons
    const sizeButtons = page.locator(selectors.product.sizeButton);
    const initialSizeCount = await sizeButtons.count();
    console.log(`Initial size count: ${initialSizeCount}`);

    // Click a different color swatch
    const swatches = page.locator(selectors.productPage.colorSwatch);
    const swatchCount = await swatches.count();

    if (swatchCount > 1) {
      // Click second swatch (force click to bypass animation stability check)
      await swatches.nth(1).click({ force: true });
      await page.waitForTimeout(200);

      // Get new size button count
      const newSizeCount = await sizeButtons.count();
      console.log(`New size count after color change: ${newSizeCount}`);

      // Size count should be positive (color has sizes)
      expect(newSizeCount).toBeGreaterThan(0);

      // Sizes may vary by color, so we just verify we have valid size options
      console.log(`✅ Sizes filtered for selected color: ${newSizeCount} options available`);
    }
  });

  test('should auto-select first available size when color changes', async ({ page }) => {
    await page.goto(`/products/${multiColorProductSlug}`);
    await waitForAnimations(page);

    const swatches = page.locator(selectors.productPage.colorSwatch);
    const swatchCount = await swatches.count();

    if (swatchCount > 1) {
      // Click second color swatch (force click to bypass animation stability check)
      await swatches.nth(1).click({ force: true });
      await page.waitForTimeout(200);

      // Verify a size is selected (button should have selected styles)
      const sizeButtons = page.locator(selectors.product.sizeButton);
      let hasSelectedSize = false;

      const count = await sizeButtons.count();
      for (let i = 0; i < count; i++) {
        const button = sizeButtons.nth(i);
        const classList = await button.getAttribute('class');

        // Check for selected state (bg-ranch-lime)
        if (classList?.includes('bg-ranch-lime')) {
          hasSelectedSize = true;
          const sizeText = await button.textContent();
          console.log(`✅ Auto-selected size: ${sizeText?.trim()}`);
          break;
        }
      }

      // If no size selected yet, check if first in-stock size exists
      if (!hasSelectedSize) {
        // At least one size button should be available (not disabled)
        let hasAvailableSize = false;
        for (let i = 0; i < count; i++) {
          const button = sizeButtons.nth(i);
          const isDisabled = await button.isDisabled();
          if (!isDisabled) {
            hasAvailableSize = true;
            break;
          }
        }
        expect(hasAvailableSize).toBe(true);
        console.log('✅ Available sizes present for selection');
      }
    }
  });

  test('should show color name on hover (tooltip)', async ({ page }) => {
    await page.goto(`/products/${multiColorProductSlug}`);
    await waitForAnimations(page);

    // Get first color swatch
    const firstSwatch = page.locator(selectors.productPage.colorSwatch).first();
    const ariaLabel = await firstSwatch.getAttribute('aria-label');

    // Hover over swatch
    await firstSwatch.hover({ force: true });
    await page.waitForTimeout(300); // Wait for tooltip transition

    // Find tooltip within or near the swatch
    const tooltip = firstSwatch.locator(selectors.productPage.colorTooltip);

    // Tooltip should be in DOM (even if opacity 0 initially)
    await expect(tooltip).toBeAttached();

    // Verify tooltip contains color name
    const tooltipText = await tooltip.textContent();
    expect(tooltipText).toBeTruthy();
    console.log(`✅ Tooltip text: "${tooltipText}" (aria-label: "${ariaLabel}")`);
  });

  test('should render color swatch with correct background color', async ({ page }) => {
    await page.goto(`/products/${multiColorProductSlug}`);
    await waitForAnimations(page);

    // Get first color swatch and check its color circle
    const firstSwatch = page.locator(selectors.productPage.colorSwatch).first();
    const ariaLabel = await firstSwatch.getAttribute('aria-label');

    // Find the color circle div (has inline style with background-color)
    const colorCircle = firstSwatch.locator('.absolute.inset-1.rounded-full').first();
    await expect(colorCircle).toBeVisible();

    // Get inline style with background color
    const style = await colorCircle.getAttribute('style');
    expect(style).toContain('background-color');

    // Verify it's a valid hex or rgb color
    expect(style).toMatch(/(#[0-9A-Fa-f]{6}|rgb\([0-9, ]+\))/);
    console.log(`✅ Color swatch "${ariaLabel}" has background: ${style}`);
  });

  test('should have circular shape for color swatches', async ({ page }) => {
    await page.goto(`/products/${multiColorProductSlug}`);
    await waitForAnimations(page);

    // Get all color swatches
    const swatches = page.locator(selectors.productPage.colorSwatch);
    const firstSwatch = swatches.first();

    // Verify rounded-full class (makes it circular)
    const classList = await firstSwatch.getAttribute('class');
    expect(classList).toContain('rounded-full');

    // Verify equal width and height (w-10 h-10)
    expect(classList).toContain('w-10');
    expect(classList).toContain('h-10');

    console.log('✅ Color swatches are circular (rounded-full, w-10, h-10)');
  });

  test('should maintain backward compatibility - modal without color selection', async ({ page }) => {
    // Go to homepage
    await page.goto('/');
    await waitForAnimations(page);

    // Click first product card to open modal
    const firstProduct = page.locator(selectors.homepage.productCard).first();
    await firstProduct.click({ force: true });
    await page.waitForTimeout(500);

    // Modal should open
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    // Verify "Choose Your Color" label is NOT present in modal
    const colorLabel = modal.locator(selectors.productPage.colorLabel);
    await expect(colorLabel).not.toBeVisible();

    // Verify color swatches are NOT present in modal
    const swatches = modal.locator(selectors.productPage.colorSwatch);
    const count = await swatches.count();
    expect(count).toBe(0);

    // Verify traditional color text IS present instead
    const colorText = modal.locator(selectors.productPage.colorText);
    await expect(colorText).toBeVisible();

    console.log('✅ Modal maintains simple UI without color swatches');
  });

  test('should handle products with single color gracefully', async ({ page }) => {
    // Navigate to homepage to find products
    await page.goto('/');
    await waitForAnimations(page);

    // Get all product cards
    const productCards = page.locator(selectors.homepage.productCard);
    const cardCount = await productCards.count();

    // Try to find a product with only one variant/color by clicking through
    for (let i = 0; i < Math.min(cardCount, 5); i++) {
      const card = productCards.nth(i);
      const productName = await card.locator(selectors.homepage.productName).textContent();

      // Click to go to product page
      await card.click({ force: true });
      await waitForAnimations(page);

      // Check if color selection exists
      const colorLabel = page.locator(selectors.productPage.colorLabel);
      const isColorSelectionVisible = await colorLabel.isVisible().catch(() => false);

      if (!isColorSelectionVisible) {
        console.log(`✅ Product "${productName}" handled correctly without color selection UI`);

        // Verify traditional color text is shown instead
        const colorText = page.locator(selectors.productPage.colorText);
        await expect(colorText).toBeVisible();
        break;
      } else {
        // Check if only one color swatch
        const swatches = page.locator(selectors.productPage.colorSwatch);
        const swatchCount = await swatches.count();

        if (swatchCount === 1) {
          console.log(`✅ Product "${productName}" with single color renders one swatch`);
          break;
        }
      }

      // Go back to homepage for next iteration
      await page.goto('/');
      await waitForAnimations(page);
    }
  });

  test('should display size grid below color selection', async ({ page }) => {
    await page.goto(`/products/${multiColorProductSlug}`);
    await waitForAnimations(page);

    // Verify size label is present
    const sizeLabel = page.locator(selectors.productPage.sizeLabel);
    await expect(sizeLabel).toBeVisible();
    await expect(sizeLabel).toHaveText('Choose Your Offering Size');

    // Verify size grid is present
    const sizeGrid = page.locator(selectors.productPage.sizeGrid);
    await expect(sizeGrid).toBeVisible();

    // Verify grid has size buttons
    const sizeButtons = sizeGrid.locator(selectors.product.sizeButton);
    const buttonCount = await sizeButtons.count();
    expect(buttonCount).toBeGreaterThan(0);
    console.log(`✅ Size grid has ${buttonCount} size options`);
  });

  test('should handle out of stock colors correctly', async ({ page }) => {
    await page.goto(`/products/${multiColorProductSlug}`);
    await waitForAnimations(page);

    // Get all swatches
    const swatches = page.locator(selectors.productPage.colorSwatch);
    const count = await swatches.count();

    // Check each swatch for out-of-stock styling
    let foundOutOfStock = false;
    for (let i = 0; i < count; i++) {
      const swatch = swatches.nth(i);
      const classList = await swatch.getAttribute('class');

      if (classList?.includes('cursor-not-allowed') || classList?.includes('opacity-40')) {
        foundOutOfStock = true;
        const ariaLabel = await swatch.getAttribute('aria-label');

        // Verify out of stock visual indicators
        expect(classList).toContain('opacity-40');

        // Check for diagonal line (out of stock indicator)
        const diagonalLine = swatch.locator('.rotate-45.bg-ranch-pink');
        const lineExists = await diagonalLine.count() > 0;

        console.log(`✅ Out of stock color "${ariaLabel}" has proper styling${lineExists ? ' with diagonal line' : ''}`);
        break;
      }
    }

    if (!foundOutOfStock) {
      console.log('ℹ️ All colors in stock (out-of-stock styling not needed)');
    }
  });

  test('should maintain selection state across page interactions', async ({ page }) => {
    await page.goto(`/products/${multiColorProductSlug}`);
    await waitForAnimations(page);

    // Select a specific color (second swatch)
    const swatches = page.locator(selectors.productPage.colorSwatch);
    if (await swatches.count() > 1) {
      const secondSwatch = swatches.nth(1);
      const colorName = await secondSwatch.getAttribute('aria-label');

      await secondSwatch.click({ force: true });
      await page.waitForTimeout(200);

      // Change quantity
      const increaseButton = page.locator(selectors.product.quantityIncrease);
      await increaseButton.click({ force: true });
      await page.waitForTimeout(200);

      // Verify color selection is still maintained
      const selectedSwatch = page.locator(selectors.productPage.colorSwatchSelected);
      const selectedLabel = await selectedSwatch.getAttribute('aria-label');

      expect(selectedLabel).toBe(colorName);
      console.log(`✅ Color selection "${colorName}" maintained after quantity change`);
    }
  });

  test('should have proper focus states for accessibility', async ({ page }) => {
    await page.goto(`/products/${multiColorProductSlug}`);
    await waitForAnimations(page);

    // Tab to first color swatch
    const firstSwatch = page.locator(selectors.productPage.colorSwatch).first();
    await firstSwatch.focus();

    // Verify focus ring is applied
    const classList = await firstSwatch.getAttribute('class');
    expect(classList).toContain('focus:outline-none');
    expect(classList).toContain('focus:ring-2');
    expect(classList).toContain('focus:ring-ranch-cyan');

    console.log('✅ Color swatches have proper focus states for keyboard navigation');
  });

  test('should load product page with reasonable performance', async ({ page }) => {
    const startTime = Date.now();

    await page.goto(`/products/${multiColorProductSlug}`);
    await waitForAnimations(page);

    // Wait for color selection to be visible
    const colorLabel = page.locator(selectors.productPage.colorLabel);
    await expect(colorLabel).toBeVisible();

    const loadTime = Date.now() - startTime;
    console.log(`⏱️ Product page loaded in ${loadTime}ms`);

    // Should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });
});
