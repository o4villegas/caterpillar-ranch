/**
 * UI Enhancements Test Suite
 *
 * Tests all recent implementations:
 * 1. Drip effect on headline
 * 2. Breathing animations on product cards
 * 3. GameModal with HORROR_COPY constants
 * 4. Tier-specific celebrations (10%, 20%, 30%, 40%)
 * 5. Timer heartbeat pulse at <10s
 */

import { chromium } from '@playwright/test';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BASE_URL = 'http://localhost:5173';
const SCREENSHOT_DIR = join(__dirname, 'screenshots', 'ui-enhancements');

async function runTests() {
  console.log('🚀 Starting UI Enhancement Tests...\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
  });
  const page = await context.newPage();

  try {
    // Test 1: Homepage - Drip Effect & Breathing
    console.log('📍 Test 1: Homepage Visual Elements');
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Check drip-text class on headline
    const headline = await page.locator('.drip-text').first();
    const hasDripClass = await headline.count() > 0;
    console.log(`  ✓ Drip effect class: ${hasDripClass ? '✅' : '❌'}`);

    // Check for filter: url(#drip-filter) in computed styles
    const headlineStyle = await headline.evaluate(el => {
      return window.getComputedStyle(el).filter;
    });
    const hasDripFilter = headlineStyle.includes('drip-filter');
    console.log(`  ✓ Drip SVG filter applied: ${hasDripFilter ? '✅' : '❌'}`);

    // Check product images have breathing animation
    const productImages = await page.locator('.product-image img').all();
    const firstImageAnimation = await productImages[0].evaluate(el => {
      return window.getComputedStyle(el).animation;
    });
    const hasBreathing = firstImageAnimation.includes('breathe');
    console.log(`  ✓ Product card breathing: ${hasBreathing ? '✅' : '❌'}`);

    await page.screenshot({
      path: join(SCREENSHOT_DIR, '01-homepage-drip-breathing.png'),
      fullPage: true
    });

    // Test 2: Product Page & Game Modal
    console.log('\n📍 Test 2: Game Modal with HORROR_COPY');

    // Click first product (use force to bypass animation stability checks)
    await page.locator('.card').first().click({ force: true });
    await page.waitForURL(/\/products\/.+/);

    // Click "Play Game" button
    await page.locator('button:has-text("Play Game")').click({ force: true });
    await page.waitForSelector('[role="dialog"]');

    // Verify modal title
    const modalTitle = await page.locator('[role="dialog"] h2').textContent();
    const hasCorrectTitle = modalTitle === 'Choose Your Challenge';
    console.log(`  ✓ Modal title: ${hasCorrectTitle ? '✅' : '❌'} (${modalTitle})`);

    // Verify all 6 games appear with correct titles
    const gameButtons = await page.locator('[role="dialog"] button').all();
    const gameTitles = await Promise.all(
      gameButtons.slice(0, 6).map(btn => btn.textContent())
    );

    const expectedTitles = [
      'The Culling',
      'Cursed Harvest',
      'Bug Telegram',
      'Hungry Caterpillar',
      'Midnight Garden',
      'Metamorphosis Queue'
    ];

    console.log('  Game titles:');
    gameTitles.forEach((title, i) => {
      const matches = title.includes(expectedTitles[i]);
      console.log(`    ${matches ? '✅' : '❌'} ${title.trim()}`);
    });

    await page.screenshot({
      path: join(SCREENSHOT_DIR, '02-game-modal.png')
    });

    // Test 3: The Culling Game with HORROR_COPY
    console.log('\n📍 Test 3: The Culling Game Instructions');

    await page.locator('button:has-text("The Culling")').click({ force: true });
    await page.waitForURL(/\/games\/the-culling/);
    await page.waitForLoadState('networkidle');

    // Check instructions text from HORROR_COPY
    const instruction1 = await page.locator('p.text-ranch-cream').first().textContent();
    const instruction2 = await page.locator('p.text-ranch-lavender').last().textContent();
    const hasInstruction1 = instruction1.includes('Tap invasive caterpillars');
    const hasInstruction2 = instruction2.includes('Avoid the good ones');

    console.log(`  ✓ Instruction 1: ${hasInstruction1 ? '✅' : '❌'}`);
    console.log(`  ✓ Instruction 2: ${hasInstruction2 ? '✅' : '❌'}`);

    // Check start button text
    const startButtonText = await page.locator('button:has-text("Start")').textContent();
    const hasCorrectButton = startButtonText.includes('Start The Culling');
    console.log(`  ✓ Start button: ${hasCorrectButton ? '✅' : '❌'} (${startButtonText.trim()})`);

    await page.screenshot({
      path: join(SCREENSHOT_DIR, '03-culling-start.png')
    });

    // Test 4: Timer Heartbeat Pulse
    console.log('\n📍 Test 4: Timer Heartbeat Animation');

    // Start game
    await page.locator('button:has-text("Start")').click({ force: true });
    await page.waitForTimeout(500);

    // Wait for timer to show (should be at 25s)
    await page.waitForSelector('text=Time Left');

    // Wait until timer is < 10s (wait ~16 seconds)
    console.log('  ⏱️  Waiting for timer to reach <10s...');
    await page.waitForTimeout(17000);

    // Give React a moment to re-render with the new class
    await page.waitForTimeout(500);

    // Check if heartbeat-pulse class is applied
    const timerElement = await page.locator('div:has-text("Time Left")').first();
    const timerClasses = await timerElement.getAttribute('class');
    const hasHeartbeat = timerClasses && timerClasses.includes('heartbeat-pulse');
    console.log(`  ✓ Heartbeat pulse at <10s: ${hasHeartbeat ? '✅' : '❌'}`);

    // Check timer color is yellow at <10s
    const timerTextColor = await page.locator('span:has-text("s")').first().evaluate(el => {
      return window.getComputedStyle(el).color;
    });
    console.log(`  ✓ Timer color at <10s: ${timerTextColor}`);

    await page.screenshot({
      path: join(SCREENSHOT_DIR, '04-timer-heartbeat.png')
    });

    // Wait for game to end
    console.log('  ⏱️  Waiting for game to complete...');
    await page.waitForTimeout(11000); // Wait for remaining time + buffer

    // Test 5: Tier Celebrations
    console.log('\n📍 Test 5: Game Results & Tier Celebrations');

    // Wait for results screen (button text varies by score)
    await page.waitForSelector('text=/Claim Discount|Return to Product/');

    // Get score (displayed as just the number under "Final Score")
    await page.waitForSelector('text=Final Score');
    const scoreElement = await page.locator('span:has-text("Final Score") + div').first();
    const scoreText = await scoreElement.textContent();
    const score = parseInt(scoreText.trim());
    console.log(`  Final Score: ${score} points`);

    // Determine expected tier
    let expectedTier, expectedMessage;
    if (score >= 45) {
      expectedTier = '40%';
      expectedMessage = 'MAXIMUM BLESSING!';
    } else if (score >= 35) {
      expectedTier = '30%';
      expectedMessage = 'The Colony Rejoices!';
    } else if (score >= 20) {
      expectedTier = '20%';
      expectedMessage = 'A Generous Blessing!';
    } else if (score >= 10) {
      expectedTier = '10%';
      expectedMessage = 'The Ranch Approves';
    } else {
      expectedTier = '0%';
      expectedMessage = null;
    }

    console.log(`  Expected Tier: ${expectedTier}`);

    if (expectedMessage) {
      // Check for celebration message
      const celebrationText = await page.locator(`text=${expectedMessage}`).count();
      const hasCelebration = celebrationText > 0;
      console.log(`  ✓ Celebration message: ${hasCelebration ? '✅' : '❌'} (${expectedMessage})`);

      // Check for celebration border styling
      const celebrationDiv = await page.locator(`div:has-text("${expectedMessage}")`).first();
      const borderClasses = await celebrationDiv.getAttribute('class');

      let expectedBorder;
      if (expectedTier === '40%') expectedBorder = 'border-ranch-lime';
      else if (expectedTier === '30%') expectedBorder = 'border-ranch-cyan';
      else if (expectedTier === '20%') expectedBorder = 'border-yellow-400';
      else if (expectedTier === '10%') expectedBorder = 'border-ranch-lavender';

      const hasCorrectBorder = borderClasses && borderClasses.includes(expectedBorder);
      console.log(`  ✓ Tier border styling: ${hasCorrectBorder ? '✅' : '❌'} (${expectedBorder})`);
    }

    await page.screenshot({
      path: join(SCREENSHOT_DIR, '05-game-results-tier.png')
    });

    // Summary
    console.log('\n📊 Test Summary:');
    console.log(`  Screenshots saved to: ${SCREENSHOT_DIR}`);
    console.log('  ✅ All visual tests completed!');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    await page.screenshot({
      path: join(SCREENSHOT_DIR, 'error.png')
    });
  } finally {
    await browser.close();
  }
}

// Run tests
runTests().catch(console.error);
