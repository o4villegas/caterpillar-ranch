/**
 * Core Session Tracking Test
 *
 * Focused test for the critical session-based game replay functionality:
 * 1. Button shows initially
 * 2. Button hides after play (same session)
 * 3. Button shows again after session clear (new session simulation)
 *
 * Run: node test-session-tracking-core.mjs
 */

import { chromium } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';
const PRODUCT_URL = `${BASE_URL}/products/punk-edition`;

console.log('🐛 Core Session Tracking Test');
console.log('='.repeat(80));

const browser = await chromium.launch({
  headless: false,  // Show browser
  slowMo: 1000,     // 1 second between actions (easy to watch)
});

const context = await browser.newContext({
  viewport: { width: 1280, height: 720 },
});

const page = await context.newPage();

try {
  // ========================================================================
  // TEST 1: Initial State - Play Game Button Shows
  // ========================================================================
  console.log('\n📍 TEST 1: Initial State - Play Game Button Shows');
  console.log('-'.repeat(80));

  await page.goto(PRODUCT_URL);
  await page.waitForLoadState('networkidle');

  // Check sessionStorage is empty
  const sessionData1 = await page.evaluate(() => {
    const key = 'caterpillar-ranch-played-games';
    return sessionStorage.getItem(key) ? JSON.parse(sessionStorage.getItem(key)) : [];
  });
  console.log(`sessionStorage: ${JSON.stringify(sessionData1)}`);

  // Select size
  await page.click('button:has-text("M")', { force: true });
  await page.waitForTimeout(500);

  // Check Play Game button exists
  const playButton1 = page.locator('button:has-text("🎮 Play Game")');
  await playButton1.waitFor({ state: 'visible', timeout: 5000 });
  const isEnabled1 = await playButton1.isEnabled();

  console.log(`✅ PASS: Play Game button is visible and enabled (${isEnabled1})`);

  // ========================================================================
  // TEST 2: Click Play Game - Button Hides
  // ========================================================================
  console.log('\n📍 TEST 2: Click Play Game - Button Hides in Same Session');
  console.log('-'.repeat(80));

  await playButton1.click({ force: true });
  await page.waitForTimeout(2000);

  // Check sessionStorage contains product
  const sessionData2 = await page.evaluate(() => {
    const key = 'caterpillar-ranch-played-games';
    return sessionStorage.getItem(key) ? JSON.parse(sessionStorage.getItem(key)) : [];
  });
  console.log(`sessionStorage: ${JSON.stringify(sessionData2)}`);

  if (!sessionData2.includes('cr-punk')) {
    throw new Error('sessionStorage should contain cr-punk');
  }

  // Navigate back if needed (in case game opened in modal/route)
  const currentUrl = page.url();
  if (currentUrl !== PRODUCT_URL) {
    await page.goto(PRODUCT_URL);
    await page.waitForLoadState('networkidle');
  }

  // Select size again
  await page.click('button:has-text("M")', { force: true });
  await page.waitForTimeout(500);

  // Check Play Game button is now HIDDEN
  const playButtonExists = await page.locator('button:has-text("🎮 Play Game")').count();

  if (playButtonExists > 0) {
    throw new Error('Play Game button should be hidden');
  }

  console.log(`✅ PASS: Play Game button is hidden (count: ${playButtonExists})`);

  // ========================================================================
  // TEST 3: Clear Session Storage - Button Shows Again
  // ========================================================================
  console.log('\n📍 TEST 3: New Session (Clear sessionStorage) - Button Shows Again');
  console.log('-'.repeat(80));

  // Clear sessionStorage (simulates closing tab and reopening)
  await page.evaluate(() => {
    sessionStorage.clear();
  });

  // Reload page
  await page.reload();
  await page.waitForLoadState('networkidle');

  // Check sessionStorage is empty
  const sessionData3 = await page.evaluate(() => {
    const key = 'caterpillar-ranch-played-games';
    return sessionStorage.getItem(key) ? JSON.parse(sessionStorage.getItem(key)) : [];
  });
  console.log(`sessionStorage after clear: ${JSON.stringify(sessionData3)}`);

  if (sessionData3.length !== 0) {
    throw new Error('sessionStorage should be empty after clear');
  }

  // Select size
  await page.click('button:has-text("M")', { force: true });
  await page.waitForTimeout(500);

  // Check Play Game button is VISIBLE again
  const playButton3 = page.locator('button:has-text("🎮 Play Game")');
  await playButton3.waitFor({ state: 'visible', timeout: 5000 });
  const isEnabled3 = await playButton3.isEnabled();

  console.log(`✅ PASS: Play Game button is visible again (${isEnabled3})`);
  console.log('\n🎉 NEW SESSION REPLAY WORKS CORRECTLY!');

  // ========================================================================
  // SUMMARY
  // ========================================================================
  console.log('\n' + '='.repeat(80));
  console.log('✅ ALL TESTS PASSED!');
  console.log('='.repeat(80));
  console.log('Session-based game replay functionality is working correctly:');
  console.log('  ✅ Button shows on initial visit');
  console.log('  ✅ Button hides after playing (same session)');
  console.log('  ✅ Button shows again after tab close (new session)');
  console.log('='.repeat(80));

  // Keep browser open for review
  console.log('\n⏳ Keeping browser open for 10 seconds for review...');
  await page.waitForTimeout(10000);

  await browser.close();
  process.exit(0);

} catch (error) {
  console.error('\n❌ TEST FAILED:', error.message);
  console.error('\n⏳ Keeping browser open for 10 seconds...');
  await page.waitForTimeout(10000);
  await browser.close();
  process.exit(1);
}
