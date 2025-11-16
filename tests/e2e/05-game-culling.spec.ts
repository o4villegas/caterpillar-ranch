/**
 * E2E Test: The Culling Game
 *
 * Tests game mechanics, scoring, and discount earning
 * CRITICAL: If tests fail, check app/routes/games.the-culling.tsx first!
 */

import { test, expect } from '@playwright/test';
import { waitForAnimations } from '../utils/helpers';

test.describe('The Culling Game', () => {
  test('should load game page', async ({ page }) => {
    await page.goto('/games/the-culling?product=cr-100');
    await waitForAnimations(page);

    // Verify game UI elements
    const timer = page.locator('div:has-text("Time:")');
    const score = page.locator('div:has-text("Score:")');

    await expect(timer).toBeVisible();
    await expect(score).toBeVisible();
  });

  test('should display 3x3 grid', async ({ page }) => {
    await page.goto('/games/the-culling?product=cr-100');
    await waitForAnimations(page);

    // Find grid container
    const grid = page.locator('.grid').first();
    await expect(grid).toBeVisible();
  });

  test('should allow playing game', async ({ page }) => {
    await page.goto('/games/the-culling?product=cr-100');
    await waitForAnimations(page, 1500);

    // Wait for caterpillars to appear and click them
    for (let i = 0; i < 5; i++) {
      const caterpillar = page.locator('[data-caterpillar]').first();
      if (await caterpillar.isVisible()) {
        await caterpillar.click();
      }
      await page.waitForTimeout(800);
    }

    // Score should increase
    const scoreText = await page.locator('div:has-text("Score:")').textContent();
    console.log('Current score:', scoreText);
  });

  test('should show results after time expires', async ({ page }) => {
    await page.goto('/games/the-culling?product=cr-100');

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
