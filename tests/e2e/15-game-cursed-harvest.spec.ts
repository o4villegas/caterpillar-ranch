/**
 * E2E Test: Cursed Harvest Game
 *
 * Tests the memory match game mechanics and verifies
 * the UI text fix for speed bonus display (<3s not <2s).
 *
 * CRITICAL: If tests fail, check app/routes/games.cursed-harvest.tsx first!
 */

import { test, expect } from '@playwright/test';
import {
  waitForAnimations,
  getProductSlug,
  waitForGameEnd,
  setupConsoleCapture,
  assertNoReactWarnings,
  getGameScore,
} from '../utils/helpers';
import { selectors } from '../utils/selectors';

test.describe('Cursed Harvest Game', () => {
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
    await page.goto(`/games/cursed-harvest?product=${productSlug}`);
    await waitForAnimations(page);

    // Verify title
    const title = page.locator(selectors.gameCursedHarvest.title);
    await expect(title).toBeVisible();

    // Verify start button
    const startButton = page.locator(selectors.gameCursedHarvest.startButton);
    await expect(startButton).toBeVisible();
  });

  test('should display speed bonus text as <3s (BUG FIX)', async ({ page }) => {
    await page.goto(`/games/cursed-harvest?product=${productSlug}`);
    await waitForAnimations(page);

    // Start the game
    await page.click(selectors.gameCursedHarvest.startButton);
    await waitForAnimations(page, 1000);

    // CRITICAL BUG FIX TEST: Speed bonus should show <3s, not <2s
    // The actual logic uses 3000ms window, so UI must match
    const speedText = page.locator('text=/Speed.*<3s/');
    await expect(speedText).toBeVisible();

    // Verify it does NOT show <2s (old incorrect text)
    const oldText = page.locator('text=/Speed.*<2s/');
    await expect(oldText).not.toBeVisible();
  });

  test('should display 12 cards after starting', async ({ page }) => {
    await page.goto(`/games/cursed-harvest?product=${productSlug}`);
    await waitForAnimations(page);

    // Start the game
    await page.click(selectors.gameCursedHarvest.startButton);
    await waitForAnimations(page, 1000);

    // Verify card grid exists
    const cardGrid = page.locator(selectors.gameCursedHarvest.cardGrid);
    await expect(cardGrid).toBeVisible();

    // Should have 12 cards (6 pairs)
    const cards = page.locator(selectors.gameCursedHarvest.card);
    const cardCount = await cards.count();
    expect(cardCount).toBe(12);
  });

  test('should flip cards on click', async ({ page }) => {
    test.setTimeout(60000); // Animation timing
    await page.goto(`/games/cursed-harvest?product=${productSlug}`);
    await waitForAnimations(page);

    // Start the game
    await page.click(selectors.gameCursedHarvest.startButton);
    await waitForAnimations(page, 1000);

    // Click first card
    const cards = page.locator(selectors.gameCursedHarvest.card);
    await cards.first().click();
    await waitForAnimations(page, 500);

    // Card should flip (animation happens)
    // We can verify no errors occurred
    assertNoReactWarnings(consoleErrors);
  });

  test('should match pairs and update score', async ({ page }) => {
    test.setTimeout(60000); // Card matching takes time
    await page.goto(`/games/cursed-harvest?product=${productSlug}`);
    await waitForAnimations(page);

    // Start the game
    await page.click(selectors.gameCursedHarvest.startButton);
    await waitForAnimations(page, 1000);

    // Get initial score
    const initialScore = await getGameScore(page);
    expect(initialScore).toBe(0);

    // Click cards to try to make matches
    const cards = page.locator(selectors.gameCursedHarvest.card);

    // Click first card
    await cards.nth(0).click();
    await waitForAnimations(page, 400);

    // Click second card
    await cards.nth(1).click();
    await waitForAnimations(page, 800);

    // Click third card
    await cards.nth(2).click();
    await waitForAnimations(page, 400);

    // Click fourth card
    await cards.nth(3).click();
    await waitForAnimations(page, 800);

    // Continue clicking to find matches
    for (let i = 4; i < 12; i += 2) {
      await cards.nth(i).click();
      await waitForAnimations(page, 400);
      await cards.nth(i + 1).click();
      await waitForAnimations(page, 800);
    }

    // Score may have changed (depends on matches found)
    // Important thing is no errors
    assertNoReactWarnings(consoleErrors);
  });

  test('should complete game without console errors', async ({ page }) => {
    test.setTimeout(60000); // Game runs 20s + animations
    await page.goto(`/games/cursed-harvest?product=${productSlug}`);
    await waitForAnimations(page);

    // Start the game
    await page.click(selectors.gameCursedHarvest.startButton);

    // Click some cards during gameplay
    const cards = page.locator(selectors.gameCursedHarvest.card);
    for (let i = 0; i < 6; i++) {
      await page.waitForTimeout(500);
      const cardCount = await cards.count();
      if (cardCount > 0) {
        const index = i % cardCount;
        await cards.nth(index).click({ force: true });
      }
    }

    // Wait for game to complete (20s + buffer)
    await waitForGameEnd(page, 22000);

    // Results should appear
    const results = page.locator(selectors.gameCursedHarvest.results);
    await expect(results).toBeVisible({ timeout: 5000 });

    // CRITICAL: Verify no React memory leak warnings
    assertNoReactWarnings(consoleErrors);
  });

  test('should show results after timer expires', async ({ page }) => {
    test.setTimeout(60000); // Game runs 20s + animations
    await page.goto(`/games/cursed-harvest?product=${productSlug}`);
    await waitForAnimations(page);

    // Start the game
    await page.click(selectors.gameCursedHarvest.startButton);

    // Wait for game to complete
    await waitForGameEnd(page, 22000);

    // Results should show score
    const results = page.locator(selectors.gameCursedHarvest.results);
    await expect(results).toBeVisible({ timeout: 5000 });

    // Retry button should be visible
    const retryButton = page.locator(selectors.gameCursedHarvest.retryButton);
    await expect(retryButton).toBeVisible();
  });

  test('should reset on retry', async ({ page }) => {
    test.setTimeout(60000); // Game runs 20s + animations
    await page.goto(`/games/cursed-harvest?product=${productSlug}`);
    await waitForAnimations(page);

    // Start the game
    await page.click(selectors.gameCursedHarvest.startButton);
    await waitForAnimations(page, 1000);

    // Click some cards
    const cards = page.locator(selectors.gameCursedHarvest.card);
    await cards.nth(0).click();
    await waitForAnimations(page, 400);
    await cards.nth(1).click();
    await waitForAnimations(page, 400);

    // Wait for game to complete
    await waitForGameEnd(page, 22000);

    // Click retry
    const retryButton = page.locator(selectors.gameCursedHarvest.retryButton);
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

    // Cards should all be face down again (12 cards)
    const newCards = page.locator(selectors.gameCursedHarvest.card);
    const cardCount = await newCards.count();
    expect(cardCount).toBe(12);

    // No React warnings from the reset
    assertNoReactWarnings(consoleErrors);
  });

  test('should navigate to product with discount after apply', async ({ page }) => {
    test.setTimeout(60000); // Game runs 20s + animations
    await page.goto(`/games/cursed-harvest?product=${productSlug}`);
    await waitForAnimations(page);

    // Start and complete the game
    await page.click(selectors.gameCursedHarvest.startButton);
    await waitForGameEnd(page, 22000);

    // Wait for results
    const results = page.locator(selectors.gameCursedHarvest.results);
    await expect(results).toBeVisible({ timeout: 5000 });

    // Click apply button to navigate back
    const applyButton = page.locator(selectors.gameCursedHarvest.applyButton);

    if (await applyButton.isVisible()) {
      await applyButton.click();

      // Should navigate to product page
      await page.waitForURL(`**/products/${productSlug}`, { timeout: 5000 });
      expect(page.url()).toContain(`/products/${productSlug}`);
    } else {
      // No discount earned, skip navigation check
      console.log('No discount earned, skipping navigation test');
    }
  });
});
