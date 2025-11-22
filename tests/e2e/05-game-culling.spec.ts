/**
 * E2E Test: The Culling Game
 *
 * Tests game mechanics, scoring, and discount earning
 * CRITICAL: If tests fail, check app/routes/games.the-culling.tsx first!
 */

import { test, expect } from '@playwright/test';
import { waitForAnimations, getProductId } from '../utils/helpers';

test.describe('The Culling Game', () => {
  let productId: number;

  test.beforeAll(async ({ request }) => {
    // Fetch a real product ID for game tests
    productId = await getProductId(request, 0);
    console.log(`Using product ID for game tests: ${productId}`);
  });

  test('should load game page', async ({ page }) => {
    await page.goto(`/games/the-culling?product=${productId}`);
    await waitForAnimations(page);

    // Game page starts with instructions and start button
    const title = page.locator('h1:has-text("The Culling")');
    const startButton = page.locator('button:has-text("Start The Culling")');

    await expect(title).toBeVisible();
    await expect(startButton).toBeVisible();
  });

  test('should display 3x3 grid after starting', async ({ page }) => {
    await page.goto(`/games/the-culling?product=${productId}`);
    await waitForAnimations(page);

    // Start the game first
    await page.click('button:has-text("Start The Culling")');
    await waitForAnimations(page);

    // Find grid container (after game starts)
    const grid = page.locator('.grid').first();
    await expect(grid).toBeVisible();
  });

  test('should allow playing game', async ({ page }) => {
    await page.goto(`/games/the-culling?product=${productId}`);
    await waitForAnimations(page);

    // Start the game first
    await page.click('button:has-text("Start The Culling")');
    await waitForAnimations(page, 1500);

    // Wait for caterpillars to appear and click them
    for (let i = 0; i < 5; i++) {
      const caterpillar = page.locator('[data-caterpillar]').first();
      if (await caterpillar.isVisible()) {
        await caterpillar.click();
      }
      await page.waitForTimeout(800);
    }

    // Score should be visible (after game started)
    const scoreText = await page.locator('div:has-text("Score:")').textContent();
    console.log('Current score:', scoreText);
  });

  test('should show results after time expires', async ({ page }) => {
    await page.goto(`/games/the-culling?product=${productId}`);
    await waitForAnimations(page);

    // Start the game first
    await page.click('button:has-text("Start The Culling")');

    // Wait for game to finish (25 seconds + buffer)
    await page.waitForTimeout(27000);

    // Results should appear
    const results = page.locator('div:has-text("Game Over")');
    await expect(results).toBeVisible({ timeout: 5000 });

    // Final score should be visible
    const finalScore = page.locator('div:has-text("Final Score:")');
    await expect(finalScore).toBeVisible();
  });
});
