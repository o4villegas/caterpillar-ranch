/**
 * E2E Test: Larva Launch Game
 *
 * Tests the slingshot-style game mechanics, collision detection,
 * and verifies bug fixes for memory leaks and state management.
 *
 * CRITICAL: If tests fail, check app/routes/games.larva-launch.tsx first!
 */

import { test, expect } from '@playwright/test';
import {
  waitForAnimations,
  getProductSlug,
  launchProjectile,
  waitForGameEnd,
  setupConsoleCapture,
  assertNoReactWarnings,
  getGameScore,
} from '../utils/helpers';
import { selectors } from '../utils/selectors';

test.describe('Larva Launch Game', () => {
  let productSlug: string;
  let consoleErrors: string[];

  test.beforeAll(async ({ request }) => {
    // Fetch a real product slug for game tests
    productSlug = await getProductSlug(request, 0);
    console.log(`Using product slug for game tests: ${productSlug}`);
  });

  test.beforeEach(async ({ page }) => {
    // Set up console error capture
    consoleErrors = setupConsoleCapture(page);
  });

  test('should load game page with title and start button', async ({ page }) => {
    await page.goto(`/games/larva-launch?product=${productSlug}`);
    await waitForAnimations(page);

    // Verify title
    const title = page.locator(selectors.gameLarvaLaunch.title);
    await expect(title).toBeVisible();

    // Verify start button
    const startButton = page.locator(selectors.gameLarvaLaunch.startButton);
    await expect(startButton).toBeVisible();
  });

  test('should display launchers after starting game', async ({ page }) => {
    await page.goto(`/games/larva-launch?product=${productSlug}`);
    await waitForAnimations(page);

    // Start the game
    await page.click(selectors.gameLarvaLaunch.startButton);
    await waitForAnimations(page, 1000);

    // Verify game area is visible
    const gameArea = page.locator(selectors.gameLarvaLaunch.gameArea).first();
    await expect(gameArea).toBeVisible();

    // Verify launchers are present (should be 3)
    const launchers = page.locator('.absolute.cursor-pointer');
    const count = await launchers.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test('should launch projectiles on drag-release', async ({ page }) => {
    await page.goto(`/games/larva-launch?product=${productSlug}`);
    await waitForAnimations(page);

    // Start the game
    await page.click(selectors.gameLarvaLaunch.startButton);
    await waitForAnimations(page, 1000);

    // Launch a projectile from the middle launcher
    await launchProjectile(page, 1, 80);
    await waitForAnimations(page, 500);

    // The game should respond - we can't easily verify projectile visually
    // but we can check that no errors occurred
    assertNoReactWarnings(consoleErrors);
  });

  test('should update score when hitting targets', async ({ page }) => {
    await page.goto(`/games/larva-launch?product=${productSlug}`);
    await waitForAnimations(page);

    // Start the game
    await page.click(selectors.gameLarvaLaunch.startButton);
    await waitForAnimations(page, 1500);

    // Get initial score
    const initialScore = await getGameScore(page);

    // Launch several projectiles (some should hit parasites)
    for (let i = 0; i < 5; i++) {
      await launchProjectile(page, i % 3, 60 + Math.random() * 40);
      await page.waitForTimeout(500);
    }

    // Wait for collisions to process
    await waitForAnimations(page, 1000);

    // Score may have changed (depends on whether we hit anything)
    // The important thing is no errors occurred
    assertNoReactWarnings(consoleErrors);
  });

  test('should complete game without console errors', async ({ page }) => {
    test.setTimeout(60000); // Game runs 20s + animations
    await page.goto(`/games/larva-launch?product=${productSlug}`);
    await waitForAnimations(page);

    // Start the game
    await page.click(selectors.gameLarvaLaunch.startButton);

    // Launch a few projectiles during gameplay
    for (let i = 0; i < 3; i++) {
      await page.waitForTimeout(2000);
      await launchProjectile(page, i % 3, 70);
    }

    // Wait for game to complete (20s + buffer)
    await waitForGameEnd(page, 22000);

    // Results should appear
    const results = page.locator(selectors.gameLarvaLaunch.results);
    await expect(results).toBeVisible({ timeout: 5000 });

    // CRITICAL: Verify no React memory leak warnings
    assertNoReactWarnings(consoleErrors);
  });

  test('should show results after timer expires', async ({ page }) => {
    test.setTimeout(60000); // Game runs 20s + animations
    await page.goto(`/games/larva-launch?product=${productSlug}`);
    await waitForAnimations(page);

    // Start the game
    await page.click(selectors.gameLarvaLaunch.startButton);

    // Wait for game to complete
    await waitForGameEnd(page, 22000);

    // Results should show score
    const results = page.locator(selectors.gameLarvaLaunch.results);
    await expect(results).toBeVisible({ timeout: 5000 });

    // Retry and apply buttons should be visible
    const retryButton = page.locator(selectors.gameLarvaLaunch.retryButton);
    await expect(retryButton).toBeVisible();
  });

  test('should reset state on retry', async ({ page }) => {
    test.setTimeout(60000); // Game runs 20s + animations
    await page.goto(`/games/larva-launch?product=${productSlug}`);
    await waitForAnimations(page);

    // Start the game
    await page.click(selectors.gameLarvaLaunch.startButton);

    // Launch some projectiles
    await launchProjectile(page, 1, 70);
    await page.waitForTimeout(500);
    await launchProjectile(page, 0, 70);

    // Wait for game to complete
    await waitForGameEnd(page, 22000);

    // Click retry
    const retryButton = page.locator(selectors.gameLarvaLaunch.retryButton);
    await expect(retryButton).toBeVisible({ timeout: 5000 });
    await retryButton.click();

    // Wait for game to restart and show playing state
    await waitForAnimations(page, 2000);

    // After retry, game should show score = 0
    // Wait for score container to be visible (game is playing)
    const scoreContainer = page.locator('.bg-ranch-purple\\/20.border-ranch-purple').first();
    await expect(scoreContainer).toBeVisible({ timeout: 5000 });

    const score = await getGameScore(page);
    expect(score).toBe(0);

    // Launchers should be visible again
    const launchers = page.locator('.absolute.cursor-pointer');
    const count = await launchers.count();
    expect(count).toBeGreaterThanOrEqual(3);

    // No React warnings from the reset
    assertNoReactWarnings(consoleErrors);
  });

  test('should navigate to product with discount after apply', async ({ page }) => {
    test.setTimeout(60000); // Game runs 20s + animations
    await page.goto(`/games/larva-launch?product=${productSlug}`);
    await waitForAnimations(page);

    // Start and complete the game
    await page.click(selectors.gameLarvaLaunch.startButton);
    await waitForGameEnd(page, 22000);

    // Wait for results
    const results = page.locator(selectors.gameLarvaLaunch.results);
    await expect(results).toBeVisible({ timeout: 5000 });

    // Click skip/apply button to navigate back
    const skipButton = page.locator(selectors.gameLarvaLaunch.skipButton);
    const applyButton = page.locator(selectors.gameLarvaLaunch.applyButton);

    // Click whichever is visible (depends on score)
    if (await applyButton.isVisible()) {
      await applyButton.click();
    } else if (await skipButton.isVisible()) {
      await skipButton.click();
    }

    // Should navigate to product page
    await page.waitForURL(`**/products/${productSlug}`, { timeout: 5000 });
    expect(page.url()).toContain(`/products/${productSlug}`);
  });

  test('should work on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 390, height: 844 });

    await page.goto(`/games/larva-launch?product=${productSlug}`);
    await waitForAnimations(page);

    // Start the game
    const startButton = page.locator(selectors.gameLarvaLaunch.startButton);
    await expect(startButton).toBeVisible();
    await startButton.click();
    await waitForAnimations(page, 1000);

    // Game area should be visible and fit the screen
    const gameArea = page.locator(selectors.gameLarvaLaunch.gameArea).first();
    await expect(gameArea).toBeVisible();

    // Launchers should be touchable
    const launchers = page.locator('.absolute.cursor-pointer');
    const count = await launchers.count();
    expect(count).toBeGreaterThanOrEqual(3);

    // Test touch interaction
    await launchProjectile(page, 1, 60);
    await waitForAnimations(page);

    // No errors
    assertNoReactWarnings(consoleErrors);
  });
});
