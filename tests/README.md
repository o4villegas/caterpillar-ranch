# Caterpillar Ranch - E2E Test Suite

Comprehensive automated testing for Caterpillar Ranch using Playwright.

## 📋 Test Coverage

✅ **Homepage & Product Pages** - Load times, product display, navigation
✅ **Cart Functionality** - Add/remove items, quantity, discounts, persistence
✅ **Checkout Flow** - Form validation, shipping info, review, confirmation
✅ **Admin Workflow** - Login, dashboard, orders, analytics, products
✅ **Game Testing** - The Culling game (1 game as specified)
✅ **Visual Regression** - Screenshot comparisons
✅ **API Validation** - Response codes, data structure, error handling
✅ **Performance** - Core Web Vitals (LCP, FCP, TTI)
✅ **Horror UI** - Stars, barn light, cursor trail, animations

### Multi-Viewport Testing
- **Mobile**: iPhone 12 Pro (390x844), Pixel 5 (393x851)
- **Tablet**: iPad Pro (1024x1366)
- **Desktop**: Chrome, Firefox, Safari (1920x1080)

## 🚀 Quick Start

### Run All Tests (Local Dev)
```bash
npm run dev           # Start dev server in terminal 1
npm test              # Run tests in terminal 2
```

### Run Tests Against Production
```bash
npm run test:prod
```

### View Test Results
```bash
npm run test:report
```

### Debug Tests
```bash
npm run test:debug    # Interactive debugging
npm run test:headed   # Show browser window
npm run test:ui       # Playwright UI mode
```

## 📁 Test Structure

```
tests/
├── e2e/                         # Test files
│   ├── 01-homepage.spec.ts      # Homepage tests
│   ├── 02-cart.spec.ts          # Cart functionality
│   ├── 03-checkout.spec.ts      # Checkout flow
│   ├── 04-admin.spec.ts         # Admin workflow
│   ├── 05-game-culling.spec.ts  # The Culling game
│   ├── 06-visual-regression.spec.ts
│   ├── 07-api-validation.spec.ts
│   ├── 08-performance.spec.ts
│   └── 09-horror-ui.spec.ts
├── pages/                       # Page Object Models
│   ├── HomePage.ts
│   ├── CartDrawer.ts
│   ├── CheckoutPage.ts
│   └── AdminPages.ts
├── utils/                       # Test utilities
│   ├── selectors.ts             # Centralized selectors
│   └── helpers.ts               # Helper functions
└── README.md                    # This file
```

## 🔍 Test Failure Protocol

**CRITICAL**: When a test fails, follow this protocol:

1. **✅ Check Application Code First**
   - Navigate to the file mentioned in the test comment
   - Verify the feature is fully implemented
   - Check for missing components, routes, or APIs

2. **✅ Verify Implementation**
   - Ensure all selectors match actual HTML structure
   - Confirm API endpoints return expected data
   - Check database schema matches queries

3. **✅ Fix Application Code**
   - Implement missing features
   - Fix broken functionality
   - Update incomplete implementations

4. **✅ Only Then Check Test**
   - If code is correct, investigate test logic
   - Update selectors if HTML structure changed
   - Adjust expectations if requirements changed

**Example:**
```
❌ Test fails: "should display product grid"

1. CHECK: app/routes/home.tsx - Is product grid rendered?
2. CHECK: Does .grid.grid-cols-1 class exist in HTML?
3. CHECK: Are products fetching from database/API?
4. FIX: Implement missing grid rendering
5. RERUN: Test should pass now
```

## 📊 Test Reports

Test results are saved to:
- `test-results/html/` - HTML report
- `test-results/screenshots/` - Failure screenshots
- `test-results/visual-baseline/` - Visual regression baselines
- `test-results/artifacts/` - Videos, traces, HAR files

## 🎯 Environment Variables

```bash
# Test against production
TEST_URL=https://caterpillar-ranch.lando555.workers.dev npm test

# Test against local dev (default)
npm test  # Uses http://localhost:5173
```

## 🔧 Configuration

See `playwright.config.ts` for:
- Viewport sizes
- Browser selection
- Retry strategies
- Timeout values
- Reporter settings

## 📝 Writing New Tests

1. Create test file in `tests/e2e/`
2. Use page objects from `tests/pages/`
3. Use selectors from `tests/utils/selectors.ts`
4. Use helpers from `tests/utils/helpers.ts`

**Example:**
```typescript
import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';

test('my new test', async ({ page }) => {
  const home = new HomePage(page);
  await home.goto();
  await home.assertLoaded();

  // Your test logic here
});
```

## 🐛 Common Issues

### Tests timeout
- Increase timeout in `playwright.config.ts`
- Check if dev server is running
- Verify network connectivity

### Selector not found
- **CHECK APP CODE FIRST!**
- Verify element exists in actual HTML
- Update selector in `tests/utils/selectors.ts`

### Visual regression mismatch
- Review screenshot in `test-results/visual-baseline/`
- If intentional change, update baseline
- If bug, fix application code

## 📞 Support

If tests reveal missing implementations:
- ✅ This is GOOD - tests are validating completeness
- ✅ Implement the missing feature
- ✅ Rerun tests to verify

Never adjust tests to pass if the feature isn't implemented!
