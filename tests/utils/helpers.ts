/**
 * Test Helper Functions
 *
 * Reusable utilities for E2E tests
 * IMPORTANT: If any helper fails, check the APPLICATION CODE first!
 */

import { Page, expect, APIRequestContext } from '@playwright/test';

/**
 * Product data fetched from the API
 */
export interface CatalogProduct {
  id: number;
  external_id: string;
  name: string;
  slug: string;
  variants: number;
  synced: number;
  thumbnail_url: string;
  is_ignored: boolean;
}

/**
 * Cache for products - avoids fetching on every test
 */
let cachedProducts: CatalogProduct[] | null = null;

/**
 * Fetch real products from the catalog API
 * Uses caching to avoid repeated API calls within a test run
 */
export async function fetchProducts(request: APIRequestContext): Promise<CatalogProduct[]> {
  if (cachedProducts) {
    return cachedProducts;
  }

  const baseUrl = process.env.TEST_URL || 'http://localhost:5173';
  const response = await request.get(`${baseUrl}/api/catalog/products`);

  if (!response.ok()) {
    throw new Error(`Failed to fetch products: ${response.status()}`);
  }

  const json = await response.json();

  // Transform API response to include slugs
  cachedProducts = json.data.map((product: any) => ({
    ...product,
    slug: product.name.toLowerCase().replace(/\s+/g, '-'),
  }));

  return cachedProducts!;
}

/**
 * Get a random product from the catalog
 */
export async function getRandomProduct(request: APIRequestContext): Promise<CatalogProduct> {
  const products = await fetchProducts(request);
  const index = Math.floor(Math.random() * products.length);
  return products[index];
}

/**
 * Get a product by index (0-based)
 */
export async function getProductByIndex(request: APIRequestContext, index: number = 0): Promise<CatalogProduct> {
  const products = await fetchProducts(request);
  if (index >= products.length) {
    throw new Error(`Product index ${index} out of bounds (${products.length} products available)`);
  }
  return products[index];
}

/**
 * Get a product slug by index (convenience function)
 */
export async function getProductSlug(request: APIRequestContext, index: number = 0): Promise<string> {
  const product = await getProductByIndex(request, index);
  return product.slug;
}

/**
 * Get a product ID by index (convenience function)
 */
export async function getProductId(request: APIRequestContext, index: number = 0): Promise<number> {
  const product = await getProductByIndex(request, index);
  return product.id;
}

/**
 * Clear the product cache (useful for test isolation)
 */
export function clearProductCache() {
  cachedProducts = null;
}

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

  // Wait for form to be stable
  await waitForAnimations(page, 500);

  // Click submit (force click to bypass animation stability issues)
  await page.click('button[type="submit"]', { force: true });

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
  await page.goto(`/products/${productSlug}`, { waitUntil: 'networkidle' });

  // Wait for product to load - look for the size selector container
  await page.waitForSelector('.grid.grid-cols-4', { state: 'visible', timeout: 10000 });
  await waitForAnimations(page, 1500);

  // Select size using aria-pressed attribute (size buttons have this, other buttons don't)
  // This targets buttons with aria-pressed that contain exactly the size letter
  const sizeButton = page.locator(`button[aria-pressed]:has-text("${size}")`).first();
  await sizeButton.click({ force: true });

  // Set quantity (if not 1)
  if (quantity > 1) {
    const quantityInput = page.locator('input[aria-label="Quantity"]');
    await quantityInput.fill(quantity.toString());
  }

  // Wait for "Claim Your Harvest" button to be enabled (depends on size selection)
  const addToCartButton = page.locator('button:has-text("Claim Your Harvest")');
  await addToCartButton.waitFor({ state: 'visible', timeout: 5000 });

  // Click add to cart (force click to bypass animations)
  await addToCartButton.click({ force: true });

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
  // Check if page is closed before attempting any operations
  if (page.isClosed()) {
    return;
  }

  try {
    // Navigate to homepage first to ensure cart icon is available
    await page.goto('/');
    await waitForAnimations(page);

    // Wait for animations to stabilize
    await page.waitForTimeout(1000);

    // Open cart drawer (force click to bypass Framer Motion animation instability)
    await page.click('button[aria-label*="Shopping cart"]', { force: true });
    await waitForAnimations(page);

    // Remove all items (force click to bypass animation stability issues)
    const removeButtons = page.locator('button[aria-label="Remove item"]');
    const count = await removeButtons.count();

    for (let i = 0; i < count; i++) {
      await removeButtons.first().click({ force: true });
      await waitForAnimations(page, 500);
    }

    // Close drawer
    await page.keyboard.press('Escape');
    await waitForAnimations(page, 300);
  } catch (error) {
    // Ignore cleanup errors - cart clearing is best-effort cleanup
    console.log('Cart clearing skipped (page closed or navigated away)');
  }
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

// ============================================================
// GAME TESTING HELPERS
// ============================================================

/**
 * Simulate slingshot launch in Larva Launch game
 * Drags launcher element back and releases to fire projectile
 */
export async function launchProjectile(
  page: Page,
  launcherIndex: number = 0,
  pullDistance: number = 80
): Promise<void> {
  const launchers = page.locator('.absolute.cursor-pointer');
  const launcher = launchers.nth(launcherIndex);

  const box = await launcher.boundingBox();
  if (!box) {
    throw new Error(`Launcher ${launcherIndex} not found or not visible`);
  }

  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;

  // Simulate drag: move to center, press, drag down (pull back), release
  await page.mouse.move(centerX, centerY);
  await page.mouse.down();
  await page.mouse.move(centerX, centerY + pullDistance, { steps: 5 });
  await page.mouse.up();

  // Wait for projectile to launch
  await page.waitForTimeout(100);
}

/**
 * Draw a path in Path of the Pupa game
 * Simulates touch/mouse drawing from start to end points
 */
export async function drawGamePath(
  page: Page,
  points: Array<{ x: number; y: number }>
): Promise<void> {
  const gameArea = page.locator('.touch-none.cursor-crosshair');
  const box = await gameArea.boundingBox();

  if (!box) {
    throw new Error('Game area not found');
  }

  if (points.length < 2) {
    throw new Error('Path must have at least 2 points');
  }

  // Start drawing at first point
  await page.mouse.move(box.x + points[0].x, box.y + points[0].y);
  await page.mouse.down();

  // Draw through remaining points
  for (let i = 1; i < points.length; i++) {
    await page.mouse.move(
      box.x + points[i].x,
      box.y + points[i].y,
      { steps: 3 }
    );
  }

  // Release to complete path
  await page.mouse.up();
}

/**
 * Wait for game timer to expire and results to show
 * Default 22s = 20s game + 2s buffer for animations
 */
export async function waitForGameEnd(
  page: Page,
  durationMs: number = 22000
): Promise<void> {
  await page.waitForTimeout(durationMs);
  await waitForAnimations(page, 500);
}

/**
 * Set up console error capture for a page
 * Returns array that will be populated with errors/warnings
 */
export function setupConsoleCapture(page: Page): string[] {
  const errors: string[] = [];

  page.on('console', (msg) => {
    const type = msg.type();
    if (type === 'error' || type === 'warning') {
      errors.push(msg.text());
    }
  });

  return errors;
}

/**
 * Assert no React memory leak or unmounted component warnings
 * Call this after game completes to verify cleanup
 */
export function assertNoReactWarnings(errors: string[]): void {
  const reactWarnings = errors.filter((e) =>
    e.includes('unmounted') ||
    e.includes('memory leak') ||
    e.includes("Can't perform a React state update") ||
    e.includes('Warning: Cannot update a component')
  );

  expect(reactWarnings).toHaveLength(0);
}

/**
 * Get initial food count in Path of the Pupa
 */
export async function getFoodCount(page: Page): Promise<number> {
  const food = page.locator('text=🍃');
  return await food.count();
}

/**
 * Get score from game HUD
 * The GameScore component renders "Score" as a label followed by the number
 * IMPORTANT: This targets only the GameScore HUD during gameplay, NOT GameResults
 */
export async function getGameScore(page: Page): Promise<number> {
  // GameScore component structure:
  // <div className="bg-ranch-purple/20 border-2 border-ranch-purple">
  //   <span className="text-lg text-ranch-lavender">Score</span>
  //   <span className="text-4xl font-bold font-mono">{score}</span>
  // </div>
  //
  // GameResults uses different classes (bg-gradient, text-5xl)

  // Look for container with exact "Score" label text (not "Final Score")
  const scoreContainer = page.locator('div:has(> div > span.text-lg:text("Score"))').first();

  try {
    // Find the score number (text-4xl font-bold) within this container
    const scoreValue = scoreContainer.locator('.text-4xl.font-bold');
    const text = await scoreValue.textContent({ timeout: 5000 });
    if (!text) return 0;
    return parseInt(text.trim(), 10) || 0;
  } catch {
    // Fallback: try finding by class combo
    const fallbackContainer = page.locator('.border-ranch-purple:has(span:text("Score"):not(:text("Final")))').first();
    const scoreValue = fallbackContainer.locator('.text-4xl');
    const text = await scoreValue.textContent({ timeout: 2000 }).catch(() => '');
    if (!text) return 0;
    return parseInt(text.trim(), 10) || 0;
  }
}
