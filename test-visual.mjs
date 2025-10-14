import { chromium } from '@playwright/test';

const url = 'https://caterpillar-ranch.lando555.workers.dev';

(async () => {
  console.log('🎭 Launching Playwright...');
  const browser = await chromium.launch();
  const page = await browser.newPage();

  console.log(`📸 Navigating to ${url}...`);
  await page.goto(url, { waitUntil: 'networkidle' });

  // Wait for content to load
  await page.waitForTimeout(3000);

  // Take full page screenshot
  console.log('📸 Capturing full page screenshot...');
  await page.screenshot({
    path: 'screenshot-full.png',
    fullPage: true
  });

  // Take viewport screenshot
  console.log('📸 Capturing viewport screenshot...');
  await page.screenshot({
    path: 'screenshot-viewport.png'
  });

  // Get computed styles of key elements
  console.log('\n🎨 Analyzing styles...');

  const styles = await page.evaluate(() => {
    const results = {};

    // Check body background
    const body = document.querySelector('body');
    if (body) {
      const bodyStyles = window.getComputedStyle(body);
      results.body = {
        backgroundColor: bodyStyles.backgroundColor,
        color: bodyStyles.color,
        fontFamily: bodyStyles.fontFamily,
      };
    }

    // Check header
    const header = document.querySelector('h1');
    if (header) {
      const headerStyles = window.getComputedStyle(header);
      results.header = {
        color: headerStyles.color,
        fontSize: headerStyles.fontSize,
        textShadow: headerStyles.textShadow,
        className: header.className,
        text: header.textContent,
      };
    }

    // Check product cards
    const cards = document.querySelectorAll('.card');
    results.cards = {
      count: cards.length,
      styles: cards.length > 0 ? (() => {
        const cardStyles = window.getComputedStyle(cards[0]);
        return {
          backgroundColor: cardStyles.backgroundColor,
          borderRadius: cardStyles.borderRadius,
          padding: cardStyles.padding,
          className: cards[0].className,
        };
      })() : 'No cards found',
    };

    // Check for environmental effects
    results.environmentalEffects = {
      nightSky: !!document.querySelector('[aria-hidden="true"]'),
      barnLight: document.querySelectorAll('.barn-light').length,
      gardenShadows: document.querySelectorAll('.garden-shadows').length,
      cursorTrail: document.querySelectorAll('.cursor-trail').length,
    };

    // Check all stylesheets
    results.stylesheets = Array.from(document.styleSheets).map(sheet => {
      try {
        return {
          href: sheet.href,
          rulesCount: sheet.cssRules?.length || 0,
        };
      } catch (e) {
        return { href: sheet.href, error: 'CORS blocked' };
      }
    });

    // Check Tailwind classes
    const bodyClasses = body?.className || '';
    results.tailwindDetected = bodyClasses.includes('tw-') ||
                                document.querySelector('[class*="tw-"]') !== null;

    return results;
  });

  console.log('\n📊 Style Analysis Results:');
  console.log(JSON.stringify(styles, null, 2));

  // Check for console errors
  console.log('\n⚠️  Checking for console errors...');
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  // Reload to catch any console errors
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  if (errors.length > 0) {
    console.log('Found errors:', errors);
  } else {
    console.log('No console errors detected');
  }

  // Get network requests
  console.log('\n🌐 Network Requests:');
  const requests = [];
  page.on('request', request => {
    requests.push({
      url: request.url(),
      resourceType: request.resourceType(),
    });
  });

  await page.reload({ waitUntil: 'networkidle' });

  const cssRequests = requests.filter(r => r.resourceType === 'stylesheet');
  console.log('CSS files loaded:', cssRequests.map(r => r.url));

  console.log('\n✅ Screenshots saved:');
  console.log('  - screenshot-full.png (full page)');
  console.log('  - screenshot-viewport.png (viewport)');

  await browser.close();
})();
