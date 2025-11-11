import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const consoleMessages = [];
  page.on('console', msg => {
    const msgType = msg.type();
    const msgText = msg.text();
    consoleMessages.push('[' + msgType + '] ' + msgText);
  });

  const failedRequests = [];
  page.on('requestfailed', request => {
    const failure = request.failure();
    failedRequests.push({
      url: request.url(),
      failure: failure ? failure.errorText : 'unknown'
    });
  });

  const imageRequests = [];
  page.on('response', response => {
    const url = response.url();
    if (url.includes('printful') || url.includes('.png') || url.includes('.webp')) {
      const headers = response.headers();
      imageRequests.push({
        url: url,
        status: response.status(),
        contentType: headers['content-type'] || 'unknown'
      });
    }
  });

  console.log('Testing PRODUCTION: https://caterpillar-ranch.lando555.workers.dev/products/cr-100');
  console.log('');

  try {
    await page.goto('https://caterpillar-ranch.lando555.workers.dev/products/cr-100', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    await page.waitForTimeout(2000);

    const productImage = page.locator('img[alt="CR-100"]').first();
    const imageVisible = await productImage.isVisible().catch(() => false);
    const imageSrc = await productImage.getAttribute('src').catch(() => null);
    const naturalWidth = await productImage.evaluate(img => img.naturalWidth).catch(() => 0);
    const naturalHeight = await productImage.evaluate(img => img.naturalHeight).catch(() => 0);

    console.log('IMAGE ELEMENT STATUS:');
    console.log('  Visible: ' + imageVisible);
    console.log('  src attribute: ' + imageSrc);
    console.log('  naturalWidth: ' + naturalWidth + 'px');
    console.log('  naturalHeight: ' + naturalHeight + 'px');
    console.log('  Loaded: ' + (naturalWidth > 0 ? 'YES' : 'NO - Image failed to load'));
    console.log('');

    console.log('IMAGE NETWORK REQUESTS:');
    imageRequests.forEach(req => {
      console.log('  ' + req.status + ' ' + req.contentType + ' ' + req.url.substring(0, 100));
    });

    console.log('');
    console.log('FAILED REQUESTS:');
    if (failedRequests.length > 0) {
      failedRequests.forEach(req => {
        console.log('  ' + req.failure + ': ' + req.url);
      });
    } else {
      console.log('  None');
    }

    console.log('');
    console.log('CONSOLE MESSAGES:');
    if (consoleMessages.length > 0) {
      consoleMessages.forEach(msg => console.log('  ' + msg));
    } else {
      console.log('  None');
    }

    await page.screenshot({ path: '/tmp/product_page_prod.png', fullPage: false });
    console.log('');
    console.log('Screenshot saved: /tmp/product_page_prod.png');

  } catch (error) {
    console.error('ERROR:', error.message);
  }

  await browser.close();
})();
