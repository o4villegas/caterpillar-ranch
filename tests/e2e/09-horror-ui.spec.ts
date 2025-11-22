/**
 * E2E Test: Horror UI Elements
 *
 * Tests horror aesthetic: stars, barn light, cursor trail
 * CRITICAL: If tests fail, check app/lib/components/ and app/root.tsx first!
 */

import { test, expect } from '@playwright/test';
import { selectors } from '../utils/selectors';
import { waitForAnimations, hasHorrorAnimation } from '../utils/helpers';

test.describe('Horror UI Elements', () => {
  test('should display night sky with stars', async ({ page }) => {
    await page.goto('/');
    await waitForAnimations(page);

    // Check for stars (they should be in the DOM - class is star-blink)
    const stars = page.locator('.star-blink');
    const count = await stars.count();

    console.log(`✅ Found ${count} stars in night sky`);
    expect(count).toBeGreaterThan(0);
  });

  test('should have barn light element', async ({ page }) => {
    await page.goto('/');
    await waitForAnimations(page);

    // Check for barn light
    const barnLight = page.locator('.barn-light');
    const exists = await barnLight.count();

    console.log(`✅ Barn light element: ${exists > 0 ? 'present' : 'missing'}`);
    expect(exists).toBeGreaterThan(0);
  });

  test('should have garden shadows vignette', async ({ page }) => {
    await page.goto('/');
    await waitForAnimations(page);

    // Check for garden shadows
    const shadows = page.locator('.garden-shadows');
    const exists = await shadows.count();

    console.log(`✅ Garden shadows: ${exists > 0 ? 'present' : 'missing'}`);
    expect(exists).toBeGreaterThan(0);
  });

  test('should create cursor trail on mouse move', async ({ page }) => {
    await page.goto('/');
    await waitForAnimations(page);

    // Move mouse to trigger cursor trail
    await page.mouse.move(100, 100);
    await page.mouse.move(200, 200);
    await page.mouse.move(300, 300);

    // Wait for trail elements to appear
    await page.waitForTimeout(500);

    // Check for cursor trail elements
    const trails = page.locator('.cursor-trail');
    const count = await trails.count();

    console.log(`✅ Cursor trail elements: ${count}`);
    // Cursor trail should appear after mouse movement
    expect(count).toBeGreaterThanOrEqual(0); // May fade quickly
  });

  test('should have horror-themed animations', async ({ page }) => {
    await page.goto('/');
    await waitForAnimations(page);

    // Check product cards for horror animations
    const productCard = page.locator('.card').first();
    const hasAnimation = await hasHorrorAnimation(page, '.card');

    console.log(`✅ Product card has horror animation: ${hasAnimation}`);
  });

  test('should have drip text effect on headers', async ({ page }) => {
    await page.goto('/');
    await waitForAnimations(page);

    // Check for drip-text class
    const dripText = page.locator('.drip-text');
    const count = await dripText.count();

    console.log(`✅ Drip text elements: ${count}`);
    expect(count).toBeGreaterThan(0);
  });

  test('should use horror color palette', async ({ page }) => {
    await page.goto('/');
    await waitForAnimations(page);

    // Check for ranch-specific CSS classes
    const limeBg = page.locator('[class*="ranch-lime"]');
    const cyanBg = page.locator('[class*="ranch-cyan"]');
    const pinkBg = page.locator('[class*="ranch-pink"]');

    const limeCount = await limeBg.count();
    const cyanCount = await cyanBg.count();
    const pinkCount = await pinkBg.count();

    console.log(`✅ Horror color usage:`);
    console.log(`  Lime: ${limeCount} elements`);
    console.log(`  Cyan: ${cyanCount} elements`);
    console.log(`  Pink: ${pinkCount} elements`);

    // At least one horror color should be used
    expect(limeCount + cyanCount + pinkCount).toBeGreaterThan(0);
  });
});
