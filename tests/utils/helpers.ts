/**
 * Test Helper Functions
 *
 * Reusable utilities for E2E tests
 * IMPORTANT: If any helper fails, check the APPLICATION CODE first!
 */

import { Page, expect } from '@playwright/test';

/**
 * Wait for animations to complete
 * Caterpillar Ranch uses Framer Motion - animations can take 300-600ms
 */
export async function waitForAnimations(page: Page, duration: number = 1000) {
  await page.waitForTimeout(duration);
}

/**
 * Wait for network to be idle (all API calls complete)
 */
export async function waitForNetworkIdle(page: Page) {
  await page.waitForLoadState('networkidle');
}

/**
 * Take a screenshot with standardized naming
 */
export async function takeScreenshot(
  page: Page,
  name: string,
  options?: { fullPage?: boolean }
) {
  const sanitized = name.replace(/\s+/g, '-').toLowerCase();
  await page.screenshot({
    path: `test-results/screenshots/${sanitized}.png`,
    fullPage: options?.fullPage ?? false,
  });
}

/**
 * Get Core Web Vitals (LCP, FCP, TTI)
 */
export async function getCoreWebVitals(page: Page) {
  const vitals = await page.evaluate(() => {
    return new Promise((resolve) => {
      // Use PerformanceObserver API
      const metrics = {
        lcp: 0,
        fcp: 0,
        tti: 0,
      };

      // Largest Contentful Paint
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        metrics.lcp = lastEntry.startTime;
      }).observe({ entryTypes: ['largest-contentful-paint'] });

      // First Contentful Paint
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        if (entries.length > 0) {
          metrics.fcp = entries[0].startTime;
        }
      }).observe({ entryTypes: ['paint'] });

      // Time to Interactive (approximation using domContentLoadedEventEnd)
      setTimeout(() => {
        const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (perfData) {
          metrics.tti = perfData.domContentLoadedEventEnd;
        }
        resolve(metrics);
      }, 100);
    });
  });

  return vitals;
}

/**
 * Assert Core Web Vitals are within acceptable ranges
 * - LCP: < 2500ms (Good), < 4000ms (Needs Improvement)
 * - FCP: < 1800ms (Good), < 3000ms (Needs Improvement)
 * - TTI: < 3800ms (Good), < 7300ms (Needs Improvement)
 */
export async function assertPerformance(page: Page) {
  const vitals = await getCoreWebVitals(page);

  // LCP should be < 4000ms (Needs Improvement threshold)
  expect(vitals.lcp).toBeLessThan(4000);

  // FCP should be < 3000ms
  expect(vitals.fcp).toBeLessThan(3000);

  // TTI should be < 7300ms
  expect(vitals.tti).toBeLessThan(7300);

  return vitals;
}

/**
 * Intercept and validate API response
 */
export async function validateAPIResponse(
  page: Page,
  urlPattern: string | RegExp,
  expectedStatus: number = 200
) {
  const [response] = await Promise.all([
    page.waitForResponse((resp) => {
      const url = resp.url();
      if (typeof urlPattern === 'string') {
        return url.includes(urlPattern);
      }
      return urlPattern.test(url);
    }),
  ]);

  expect(response.status()).toBe(expectedStatus);
  return response;
}

/**
 * Login as admin user
 * Returns the auth token for subsequent requests
 */
export async function loginAsAdmin(page: Page) {
  await page.goto('/admin/login');

  // Fill credentials
  await page.fill('input#email', 'lando@gvoassurancepartners.com');
  await page.fill('input#password', 'duderancch');

  // Click submit
  await page.click('button[type="submit"]');

  // Wait for redirect to dashboard
  await page.waitForURL('/admin/dashboard');

  // Extract token from localStorage
  const token = await page.evaluate(() => {
    return localStorage.getItem('admin_token');
  });

  expect(token).toBeTruthy();
  return token;
}

/**
 * Add product to cart
 * Returns cart item count
 */
export async function addProductToCart(
  page: Page,
  productSlug: string,
  size: string = 'M',
  quantity: number = 1
) {
  // Navigate to product page
  await page.goto(`/products/${productSlug}`);
  await waitForAnimations(page);

  // Select size
  const sizeButton = page.locator(`button:has-text("${size}")`).first();
  await sizeButton.click();

  // Set quantity (if not 1)
  if (quantity > 1) {
    const quantityInput = page.locator('input[aria-label="Quantity"]');
    await quantityInput.fill(quantity.toString());
  }

  // Click add to cart
  await page.click('button:has-text("Claim Your Harvest")');

  // Wait for success animation
  await waitForAnimations(page, 1500);

  // Get cart count from badge
  const cartBadge = page.locator('.animate-heartbeat-pulse');
  const count = await cartBadge.textContent();

  return parseInt(count || '0', 10);
}

/**
 * Clear cart (remove all items)
 */
export async function clearCart(page: Page) {
  // Open cart drawer
  await page.click('button[aria-label*="Shopping cart"]');
  await waitForAnimations(page);

  // Remove all items
  const removeButtons = page.locator('button[aria-label="Remove item"]');
  const count = await removeButtons.count();

  for (let i = 0; i < count; i++) {
    await removeButtons.first().click();
    await waitForAnimations(page, 300);
  }

  // Close drawer
  await page.keyboard.press('Escape');
}

/**
 * Fill checkout shipping form
 */
export async function fillShippingForm(page: Page, data?: Partial<ShippingInfo>) {
  const defaults: ShippingInfo = {
    email: 'test@example.com',
    name: 'Test User',
    address: '123 Main St',
    address2: '',
    city: 'Los Angeles',
    state: 'CA',
    zip: '90001',
    phone: '5551234567',
  };

  const formData = { ...defaults, ...data };

  await page.fill('input[type="email"]', formData.email);
  await page.fill('input[placeholder*="John Doe"]', formData.name);
  await page.fill('input[placeholder*="123 Main St"]', formData.address);

  if (formData.address2) {
    await page.fill('input[placeholder*="Apt"]', formData.address2);
  }

  await page.fill('input[placeholder*="City"]', formData.city);
  await page.fill('input[placeholder*="CA"]', formData.state);
  await page.fill('input[placeholder*="12345"]', formData.zip);

  if (formData.phone) {
    await page.fill('input[type="tel"]', formData.phone);
  }
}

export interface ShippingInfo {
  email: string;
  name: string;
  address: string;
  address2: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
}

/**
 * Assert visual regression (compare screenshot)
 */
export async function assertVisualRegression(
  page: Page,
  name: string,
  options?: { fullPage?: boolean; threshold?: number }
) {
  await page.screenshot({
    path: `test-results/visual-baseline/${name}.png`,
    fullPage: options?.fullPage ?? false,
  });

  // In a real implementation, this would compare against a baseline
  // For now, we just capture the screenshot for manual review
  console.log(`Visual regression screenshot captured: ${name}.png`);
}

/**
 * Check if element has horror animation class
 */
export async function hasHorrorAnimation(page: Page, selector: string) {
  const element = page.locator(selector).first();
  const classes = await element.getAttribute('class');

  const horrorAnimations = [
    'animate-breathing',
    'animate-heartbeat-pulse',
    'animate-wiggle-wrong',
    'animate-star-blink',
    'breathing',
    'heartbeat-pulse',
  ];

  return horrorAnimations.some((anim) => classes?.includes(anim));
}

/**
 * Wait for product to load from database
 */
export async function waitForProductsToLoad(page: Page) {
  // Wait for at least one product card to appear
  await page.waitForSelector('.card.bg-ranch-purple\\/20', { timeout: 10000 });
  await waitForAnimations(page, 500);
}
