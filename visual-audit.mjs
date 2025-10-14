import { chromium } from '@playwright/test';

const url = 'https://caterpillar-ranch.lando555.workers.dev';

(async () => {
  console.log('🎭 Launching headed Playwright for visual audit...\n');

  const browser = await chromium.launch({
    headless: false, // Show browser
    slowMo: 1000,    // Slow down actions for visibility
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1,
  });

  const page = await context.newPage();

  console.log(`📸 Navigating to ${url}...\n`);
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  console.log('✅ Page loaded. Starting visual audit...\n');

  // 1. Capture initial state
  console.log('📷 Capturing desktop viewport...');
  await page.screenshot({
    path: 'audit-desktop-initial.png',
    fullPage: false
  });

  // 2. Test hover states (with force due to animations)
  console.log('🖱️  Testing hover states on buttons...');
  try {
    const firstButton = await page.locator('button:has-text("View")').first();
    await firstButton.hover({ force: true, timeout: 5000 });
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: 'audit-button-hover.png',
    });
    console.log('   ✅ Button hover captured');
  } catch (e) {
    console.log('   ⚠️  Button hover skipped (element unstable)');
  }

  // 3. Test card hover
  console.log('🖱️  Testing hover state on product card...');
  try {
    const firstCard = page.locator('.card').first();
    await firstCard.hover({ force: true, timeout: 5000 });
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: 'audit-card-hover.png',
    });
    console.log('   ✅ Card hover captured');
  } catch (e) {
    console.log('   ⚠️  Card hover skipped (element unstable)');
  }

  // 4. Scroll to see environmental effects
  console.log('📜 Scrolling to check full page experience...');
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1500);
  await page.screenshot({
    path: 'audit-scrolled.png',
  });

  // 5. Test mobile viewport
  console.log('📱 Testing mobile viewport (iPhone 14 Pro)...');
  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  await page.screenshot({
    path: 'audit-mobile-viewport.png',
    fullPage: false
  });

  // Scroll on mobile
  await page.evaluate(() => window.scrollTo(0, 400));
  await page.waitForTimeout(1000);
  await page.screenshot({
    path: 'audit-mobile-scrolled.png',
  });

  // 6. Measure key elements
  console.log('📏 Measuring element properties...');

  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const measurements = await page.evaluate(() => {
    const results = {};

    // Header measurements
    const header = document.querySelector('h1');
    if (header) {
      const headerStyles = window.getComputedStyle(header);
      results.header = {
        color: headerStyles.color,
        fontSize: headerStyles.fontSize,
        fontWeight: headerStyles.fontWeight,
        textShadow: headerStyles.textShadow,
        letterSpacing: headerStyles.letterSpacing,
      };
    }

    // Card measurements
    const card = document.querySelector('.card');
    if (card) {
      const cardStyles = window.getComputedStyle(card);
      const rect = card.getBoundingClientRect();
      results.card = {
        backgroundColor: cardStyles.backgroundColor,
        borderRadius: cardStyles.borderRadius,
        padding: cardStyles.padding,
        width: rect.width,
        height: rect.height,
      };
    }

    // Button measurements
    const button = document.querySelector('button');
    if (button) {
      const buttonStyles = window.getComputedStyle(button);
      results.button = {
        backgroundColor: buttonStyles.backgroundColor,
        color: buttonStyles.color,
        borderRadius: buttonStyles.borderRadius,
        padding: buttonStyles.padding,
        fontWeight: buttonStyles.fontWeight,
      };
    }

    // Price measurements
    const price = document.querySelector('.text-ranch-lime, .text-2xl');
    if (price) {
      const priceStyles = window.getComputedStyle(price);
      results.price = {
        color: priceStyles.color,
        fontSize: priceStyles.fontSize,
        fontWeight: priceStyles.fontWeight,
      };
    }

    // Badge measurements
    const badge = document.querySelector('.heartbeat-pulse');
    if (badge) {
      const badgeStyles = window.getComputedStyle(badge);
      results.badge = {
        backgroundColor: badgeStyles.backgroundColor,
        color: badgeStyles.color,
        padding: badgeStyles.padding,
        borderRadius: badgeStyles.borderRadius,
        animation: badgeStyles.animation,
      };
    }

    // Environmental effects check
    results.environment = {
      stars: document.querySelectorAll('.star-blink').length,
      barnLight: !!document.querySelector('.barn-light'),
      gardenShadows: !!document.querySelector('.garden-shadows'),
    };

    // Check animations
    const htmlElement = document.documentElement;
    const htmlStyles = window.getComputedStyle(htmlElement);
    results.globalAnimation = {
      animation: htmlStyles.animation,
    };

    return results;
  });

  console.log('\n📊 Element Measurements:');
  console.log(JSON.stringify(measurements, null, 2));

  // 7. Check for any visual issues
  console.log('\n🔍 Checking for visual issues...');

  const issues = await page.evaluate(() => {
    const problems = [];

    // Check text contrast
    const darkText = document.querySelectorAll('[class*="text-ranch-dark"]');
    if (darkText.length > 0) {
      problems.push('WARNING: Dark text on dark background detected');
    }

    // Check if images loaded
    const images = document.querySelectorAll('img');
    images.forEach((img, i) => {
      if (!img.complete || img.naturalHeight === 0) {
        problems.push(`WARNING: Image ${i + 1} failed to load`);
      }
    });

    // Check for overlapping elements
    const cards = document.querySelectorAll('.card');
    if (cards.length > 0) {
      const firstCardRect = cards[0].getBoundingClientRect();
      if (firstCardRect.top < 0) {
        problems.push('WARNING: Content overlaps with header');
      }
    }

    // Check button visibility
    const buttons = document.querySelectorAll('button');
    buttons.forEach((btn, i) => {
      const rect = btn.getBoundingClientRect();
      if (rect.width < 40 || rect.height < 30) {
        problems.push(`WARNING: Button ${i + 1} might be too small (${rect.width}x${rect.height})`);
      }
    });

    return problems;
  });

  if (issues.length > 0) {
    console.log('⚠️  Issues found:');
    issues.forEach(issue => console.log(`   - ${issue}`));
  } else {
    console.log('✅ No obvious visual issues detected');
  }

  console.log('\n📸 Screenshots saved:');
  console.log('   - audit-desktop-initial.png');
  console.log('   - audit-button-hover-1.png');
  console.log('   - audit-button-hover-2.png');
  console.log('   - audit-card-hover.png');
  console.log('   - audit-scrolled.png');
  console.log('   - audit-mobile-viewport.png');
  console.log('   - audit-mobile-scrolled.png');

  console.log('\n⏸️  Browser will stay open for 30 seconds for manual inspection...');
  console.log('   Feel free to interact with the page!\n');

  await page.waitForTimeout(30000);

  await browser.close();
  console.log('✅ Audit complete!');
})();
