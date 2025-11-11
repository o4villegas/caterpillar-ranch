# Comprehensive Caterpillar Ranch Architecture Analysis
## Foundation Assessment for Admin Portal Integration

**Analysis Date:** 2025-11-10  
**Codebase Status:** Phase 3 In Progress  
**Total Application Code:** 37 TypeScript files, 4,049 lines

---

## 1. CURRENT PRODUCT SYSTEM

### Product Schema Definition
**File:** `/home/lando555/caterpillar-ranch/app/lib/types/product.ts` (26 lines)

```typescript
export type ProductSize = 'S' | 'M' | 'L' | 'XL' | 'XXL';

export interface ProductVariant {
  id: string;
  size: ProductSize;
  color: string;
  inStock: boolean;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number; // Base price in dollars
  imageUrl: string; // Path to product image
  variants: ProductVariant[];
  tags: string[]; // e.g., ['horror', 'punk', 'rock']
  createdAt?: string; // ISO date string
}

export interface ProductFilters {
  tags?: string[];
  inStock?: boolean;
  minPrice?: number;
  maxPrice?: number;
}
```

**Schema Analysis:**
- Minimal schema with core e-commerce fields
- Single color per variant (no color options within size)
- No Printful-specific fields (mockup_url, print_areas, sku, etc.)
- No pricing variants (all products flat-priced)
- `createdAt` is optional (not currently used)

**Gaps for Printful Integration:**
- Missing: `printfulProductId` (Printful catalog ID)
- Missing: `printfulVariantIds` (map variants to Printful IDs)
- Missing: `mockupUrl` or `previewImages` (for product display)
- Missing: `sku` or external identifier
- Missing: Variant-level pricing (Printful supports per-variant prices)
- Missing: Availability/inventory tracking (currently just `inStock: boolean`)

### Product Data Source
**File:** `/home/lando555/caterpillar-ranch/app/lib/mocks/products.ts` (107 lines)

**Current Products (4 Total):**
1. `cr-punk` - Dark Gray (S,M,L,XL all in stock) - Price: $30
2. `cr-rock` - Stone Gray (S,M,L,XL all in stock) - Price: $30
3. `cr-weird` - Lavender (S,M,L in stock, XL out of stock) - Price: $30
4. `cr-anime` - White (S,M,L,XL all in stock) - Price: $30

**Static Data Pattern:**
- All products hardcoded in `mockProducts` array
- No async loading (synchronous import)
- Helper functions for lookup:
  - `getProductById(id: string)` - O(n) lookup
  - `getProductBySlug(slug: string)` - O(n) lookup
  - `getProductsByTags(tags: string[])` - O(n) filter
  - `getInStockVariants(productId: string)` - O(n) filter

### Components Consuming Product Data

**1. Home Route (`app/routes/home.tsx`)**
- Lines 21-26: Loader function
```typescript
export function loader({ context }: Route.LoaderArgs) {
  const cloudflare = context.cloudflare as { env: Env };
  return {
    products: mockProducts,
    message: cloudflare.env.VALUE_FROM_CLOUDFLARE,
  };
}
```
- Directly imports and passes `mockProducts` to component
- No caching or API calls
- Uses Framer Motion for animations (card hover effects)

**2. Product Detail Route (`app/routes/product.tsx`)**
- Line 7: `import { getProductBySlug } from '~/lib/mocks/products';`
- Line 16: `const product = getProductBySlug(params.slug);`
- Includes full SEO meta tags (Open Graph, Twitter Card) using product data
- Passes product to `ProductView` component for rendering

**3. ProductView Component (`app/lib/components/ProductView.tsx`)**
- Receives `product` as prop
- Renders image from `product.imageUrl` (e.g., `/products/CR-PUNK.png`)
- Size selection using `product.variants`
- Price display: `product.price`

**Data Flow Diagram:**
```
mockProducts (static array)
    ↓
home.tsx loader → passes to Home component → renders product grid
    ↓
product.tsx loader → getProductBySlug() → ProductView component
    ↓
ProductView renders: image, name, description, variants, price
```

---

## 2. CURRENT CART & ORDER SYSTEM

### Cart Type System
**File:** `/home/lando555/caterpillar-ranch/app/lib/types/cart.ts` (116 lines)

**Core Interfaces:**

```typescript
export interface CartItem {
  id: string; // Unique ID for cart item (generated client-side: ${product.id}-${variantId}-${Date.now()})
  product: Product;
  variantId: string;
  variant: ProductVariant; // Denormalized for easy access
  quantity: number; // 1-99
  earnedDiscount: number; // 0-40%
  addedAt: string; // ISO timestamp
}

export interface Discount {
  id: string; // Unique discount ID
  productId: string; // Product this discount applies to
  gameType: 'culling' | 'harvest' | 'telegram' | 'snake' | 'garden' | 'metamorphosis' | 'last-resort';
  discountPercent: number; // 10-40%
  earnedAt: string; // ISO timestamp
  expiresAt: string; // ISO timestamp (30 minutes from earnedAt)
  applied: boolean; // True if discount is currently applied to cart item
}

export interface Cart {
  items: CartItem[];
  discounts: Discount[]; // All earned discounts (applied + unapplied)
  lastUpdated: string; // ISO timestamp
}

export interface CartTotals {
  subtotal: number; // Sum of (item.price * item.quantity) before discounts
  totalDiscount: number; // Sum of all discounts applied (capped at 40% of subtotal)
  effectiveDiscountPercent: number; // Actual discount percentage applied (0-40)
  total: number; // Subtotal - totalDiscount
  itemCount: number; // Total number of items (sum of quantities)
  savings: number; // Amount saved (same as totalDiscount, for display)
}
```

**Cart Actions (useReducer):**
- `ADD_ITEM` - Add product variant with quantity and optional discount
- `REMOVE_ITEM` - Remove item by ID
- `UPDATE_QUANTITY` - Change quantity (1-99 clamp)
- `APPLY_DISCOUNT` - Link discount to specific item
- `REMOVE_DISCOUNT` - Unlink discount
- `ADD_DISCOUNT` - Add new discount to collection
- `CLEAR_CART` - Empty cart
- `LOAD_CART` - Restore from storage
- `SYNC_FROM_SERVER` - Future: cross-device sync (placeholder)

### Cart Context Implementation
**File:** `/home/lando555/caterpillar-ranch/app/lib/contexts/CartContext.tsx` (386 lines)

**Persistent Storage Strategy:**
```typescript
// Lines 23-24
const CART_STORAGE_KEY = 'caterpillar-ranch-cart';
const SESSION_TOKEN_KEY = 'caterpillar-ranch-session';

// Lines 272-290: Load on mount
useEffect(() => {
  const savedCart = localStorage.getItem(CART_STORAGE_KEY);
  const savedSession = localStorage.getItem(SESSION_TOKEN_KEY);
  if (savedCart) {
    dispatch({ type: 'LOAD_CART', payload: JSON.parse(savedCart) });
  }
  if (savedSession) {
    setSessionToken(savedSession);
  }
}, []);

// Lines 293-301: Auto-save on every cart change
useEffect(() => {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch (error) {
    console.error('Failed to save cart to localStorage:', error);
  }
}, [cart]);
```

**Discount Cap Enforcement (Lines 217-258):**
```typescript
function calculateTotals(cart: Cart): CartTotals {
  // Calculate subtotal from all items
  const subtotal = cart.items.reduce((sum, item) => {
    return sum + item.product.price * item.quantity;
  }, 0);

  // Sum all item discounts
  let totalDiscountBeforeCap = 0;
  cart.items.forEach((item) => {
    const itemSubtotal = item.product.price * item.quantity;
    const itemDiscount = (itemSubtotal * item.earnedDiscount) / 100;
    totalDiscountBeforeCap += itemDiscount;
  });

  // ENFORCE 40% CAP (critical for business model)
  const maxDiscount = subtotal * 0.4;
  const totalDiscount = Math.min(totalDiscountBeforeCap, maxDiscount);
  const effectiveDiscountPercent = subtotal > 0 ? (totalDiscount / subtotal) * 100 : 0;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    totalDiscount: Math.round(totalDiscount * 100) / 100,
    effectiveDiscountPercent: Math.round(effectiveDiscountPercent * 10) / 10,
    total: Math.round((subtotal - totalDiscount) * 100) / 100,
    itemCount,
    savings: totalDiscount,
  };
}
```

**Key Rules Implemented:**
1. Each cart item ID is unique: `${product.id}-${variantId}-${Date.now()}`
2. Same product+variant can have multiple cart entries with different discounts (line 51-56)
3. Discounts expire after 30 minutes
4. Only 6 game types + 1 "last-resort" game type supported
5. Multiple discounts can be stored but only applied to specific items

### Current Order/Checkout Implementation
**File:** `/home/lando555/caterpillar-ranch/app/routes/checkout.tsx` (50+ lines)
**File:** `/home/lando555/caterpillar-ranch/app/routes/checkout.review.tsx` (80+ lines)
**File:** `/home/lando555/caterpillar-ranch/app/routes/checkout.confirmation.tsx` (80+ lines)

**Checkout Flow (3-Step Process):**

1. **Step 1: Shipping Information** (`checkout.tsx`)
   - Form validation (email, name, address, city, state, zip, country, phone)
   - Stores in `sessionStorage('checkout_shipping')`
   - Redirects to review if complete

2. **Step 2: Review Order** (`checkout.review.tsx`)
   - Loads shipping info from sessionStorage
   - Displays cart items with images and totals
   - **Line 67-72: Simulates order creation**
   ```typescript
   const orderId = `RANCH-${Date.now()}`;
   const order = {
     id: orderId,
     items: cart.items,
     shipping: shippingInfo,
     totals,
     placedAt: new Date().toISOString(),
     status: 'confirmed',
   };
   ```
   - Stores order in localStorage: `'caterpillar-ranch-orders'`
   - Redirects to confirmation with query: `/checkout/confirmation?order=${orderId}`

3. **Step 3: Confirmation** (`checkout.confirmation.tsx`)
   - Loads order from localStorage by ID (from search params)
   - Displays order details, tracking info placeholder
   - Shows success messaging

**CRITICAL GAP:** All orders are stored in localStorage only. No server-side persistence. When Printful integration happens, orders must go through `/api/orders` endpoints.

---

## 3. CURRENT API STRUCTURE

### Hono Entry Point
**File:** `/home/lando555/caterpillar-ranch/workers/app.ts` (20 lines)

```typescript
import { Hono } from "hono";
import { createRequestHandler } from "react-router";

const app = new Hono();

// Add more routes here (PLACEHOLDER)

app.get("*", (c) => {
  const requestHandler = createRequestHandler(
    () => import("virtual:react-router/server-build"),
    import.meta.env.MODE,
  );

  return requestHandler(c.req.raw, {
    cloudflare: { env: c.env, ctx: c.executionCtx },
  });
});

export default app;
```

**Current State:**
- Only catch-all route for React Router SSR
- Comment "Add more routes here" indicates API routes should be added BEFORE the catch-all
- **No API endpoints currently implemented**
- Access to Cloudflare env via `c.env` (for KV, R2, secrets)
- Access to execution context via `c.executionCtx` (for async operations)

### API Route Pattern (Expected)
Routes should be added before line 8 (before the catch-all):

```typescript
// Template for future API routes:
app.get("/api/catalog/products", async (c) => {
  // Fetch from KV cache or Printful
  return c.json({ data: [...] });
});

app.post("/api/cart/session", async (c) => {
  // Create session token for persistent cart
  return c.json({ sessionToken: "...", items: [...] });
});

app.post("/api/orders", async (c) => {
  // Create order draft in Printful
  return c.json({ orderId: "..." });
});
```

### Environment & Bindings
**File:** `/home/lando555/caterpillar-ranch/wrangler.jsonc` (47 lines)

**Current Configuration:**
```jsonc
{
  "name": "caterpillar-ranch",
  "compatibility_date": "2025-10-08",
  "main": "./workers/app.ts",
  "vars": {
    "VALUE_FROM_CLOUDFLARE": "Hello from Hono/CF"
  },
  "observability": {
    "enabled": true
  },
  // Commented out options:
  // "kv_namespaces": [ ... ] - NO KV NAMESPACES CONFIGURED
  // "r2_buckets": [ ... ] - NO R2 BUCKETS CONFIGURED
  // "assets": { directory: "./public/" } - NO STATIC ASSETS BINDING
}
```

**What's Missing for Production:**
```jsonc
{
  "kv_namespaces": [
    { "binding": "CATALOG_CACHE", "id": "..." }, // Product caching
    { "binding": "CART_SESSIONS", "id": "..." }, // Guest cart sessions
    { "binding": "ORDER_TEMP", "id": "..." }, // Temporary order storage
  ],
  "r2_buckets": [
    { "binding": "UPLOADS", "bucket_name": "caterpillar-uploads" } // User uploads
  ],
  "d1_databases": [
    { "binding": "DB", "database_name": "caterpillar-ranch" } // Orders, users
  ],
  "env": {
    "production": {
      "vars": {
        "PRINTFUL_API_TOKEN": "***", // Should be secret, not var
        "ENVIRONMENT": "production"
      }
    }
  }
}
```

### No Authentication Currently Implemented
- No user sessions or accounts
- No JWT tokens
- No role-based access control
- Cart is guest-only via localStorage

**For Admin Portal:**
- Needs authentication layer
- Consider: Cloudflare Access, custom JWT, or external OAuth provider
- Must protect API routes: `/api/admin/*`

---

## 4. CURRENT ROUTING CONFIGURATION

**File:** `/home/lando555/caterpillar-ranch/app/routes.ts` (15 lines)

```typescript
export default [
  index("routes/home.tsx"),
  route("products/:slug", "routes/product.tsx"),
  route("checkout", "routes/checkout.tsx"),
  route("checkout/review", "routes/checkout.review.tsx"),
  route("checkout/confirmation", "routes/checkout.confirmation.tsx"),
  route("games/the-culling", "routes/games.the-culling.tsx"),
  route("games/cursed-harvest", "routes/games.cursed-harvest.tsx"),
  route("games/bug-telegram", "routes/games.bug-telegram.tsx"),
  route("games/hungry-caterpillar", "routes/games.hungry-caterpillar.tsx"),
  route("games/midnight-garden", "routes/games.midnight-garden.tsx"),
  route("games/metamorphosis-queue", "routes/games.metamorphosis-queue.tsx"),
]
```

**Route Structure:**
- **Public Routes:** `/`, `/products/:slug`, `/checkout/*`, `/games/*`
- **No Protected Routes:** No `/admin` routes configured yet
- **No Fallback Route:** No 404 catch-all or error boundary for routes

**Admin Portal Routes to Add:**
```typescript
// New routes for admin panel
route("admin", "routes/admin/layout.tsx"),
route("admin/dashboard", "routes/admin/dashboard.tsx"),
route("admin/products", "routes/admin/products.tsx"),
route("admin/products/new", "routes/admin/products.new.tsx"),
route("admin/products/:id/edit", "routes/admin/products.edit.tsx"),
route("admin/orders", "routes/admin/orders.tsx"),
route("admin/orders/:id", "routes/admin/orders.detail.tsx"),
```

---

## 5. STORAGE & STATE MANAGEMENT CAPABILITIES

### localStorage (Client-Side Guest State)
Currently Used:
- `'caterpillar-ranch-cart'` - Cart state (CartContext, lines 23, 275)
- `'caterpillar-ranch-session'` - Session token (CartContext, line 24)
- `'game:the-culling:best-score'` - Game leaderboard (games.the-culling.tsx, line 63)
- `'caterpillar-ranch-orders'` - Order history (checkout.confirmation.tsx, line 77)
- Session storage: `'checkout_shipping'` - Shipping info during checkout (checkout.review.tsx, line 44)

**Capacity:** ~5-10MB per domain
**Persistence:** Until browser clear or explicit delete
**Security:** None (visible to JavaScript, not encrypted)

### KV Storage (Cloudflare Workers - Server-Side)
**Current Status:** NOT CONFIGURED in wrangler.jsonc

**Planned Uses (from CLAUDE.md):**
- Product catalog cache (1-hour TTL)
- Session data (cart + discounts, 30-min TTL)
- Rate limiting counters
- Webhook signatures for Printful

**Example KV Schema (Not Implemented):**
```
catalog:products:list → [Product[]]
catalog:product:{id} → Product
session:{token} → CartSession
order:{id}:temp → OrderDraft
```

### D1 Database (Cloudflare SQL - Not Used Yet)
**Status:** Not configured

**When to Add:**
- User accounts (Phase 2)
- Order history beyond localStorage
- Game completion tracking for leaderboards
- Analytics (game stats, popular products)

**Schema Needed:**
```sql
-- Users table
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  created_at TIMESTAMP,
  preferences JSON
);

-- Orders table
CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  items JSON,
  shipping JSON,
  totals JSON,
  printful_order_id TEXT,
  status TEXT,
  created_at TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Game completions
CREATE TABLE game_completions (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  product_id TEXT,
  game_type TEXT,
  score INT,
  discount_earned INT,
  created_at TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### R2 Storage (Cloudflare Object Storage - Not Used Yet)
**Status:** Not configured

**Planned Uses:**
- User-uploaded designs for custom print orders
- Generated mockup preview images
- Product images as backup/CDN

---

## 6. STATIC ASSETS & IMAGE MANAGEMENT

**Public Directory:** `/home/lando555/caterpillar-ranch/public/`

**Current Assets:**
- `/public/cr-logo.png` (733 KB) - Main brand logo
- `/public/cr-favicon.svg` (457 KB) - Favicon
- `/public/favicon.ico` (15 KB) - Legacy favicon
- `/public/products/CR-PUNK.png` (292 KB)
- `/public/products/CR-ROCK.png` (500 KB)
- `/public/products/CR-WEIRD.png` (505 KB)
- `/public/products/CR-ANIME.png` (708 KB)
- `/public/patterns/` - Pattern overlays
- `/public/test-session-tracking.html` - Debug tool

**Product Image Usage:**
- Referenced in `Product.imageUrl` field (e.g., `/products/CR-PUNK.png`)
- Loaded in ProductView component via `<img src={product.imageUrl}>`
- Displayed in home page grid
- SEO meta tags use full URL: `${baseUrl}${product.imageUrl}`

**For Printful Integration:**
- Printful returns `image_url` from API (usually CDN URL)
- Will need to update schema: `imageUrl` → `imageUrl` or `printfulImageUrl`
- Consider caching Printful images to R2 for reliability

---

## 7. GAME SYSTEM & DISCOUNT MECHANICS

### Game Routes (Currently Implemented)
**Files:** `app/routes/games.*.tsx` (6 games)

```
/games/the-culling → Whack-a-mole (25s)
/games/cursed-harvest → Memory match (30s)
/games/bug-telegram → Speed typing (30s)
/games/hungry-caterpillar → Snake game (45s)
/games/midnight-garden → Reflex clicker (25s)
/games/metamorphosis-queue → Timing game (25s)
```

### Score to Discount Conversion
**File:** `app/lib/components/Games/utils/scoreConversion.ts` (98 lines)

**Tier System:**
```typescript
export function calculateDiscount(score: number): number {
  if (score >= 45) return 40;  // 45-50+ points → 40% off
  if (score >= 35) return 30;  // 35-44 points → 30% off
  if (score >= 20) return 20;  // 20-34 points → 20% off
  if (score >= 10) return 10;  // 10-19 points → 10% off
  return 0;                    // 0-9 points → 0% off (can retry)
}
```

**Discount Lifetime:**
- Earned when game completes
- Expires 30 minutes from earn time (from Discount interface, line 32 of cart.ts)
- Can be applied to specific cart items
- Cannot be combined: 40% max cap enforced globally

### Game Flow Integration
**Pattern in game routes** (e.g., `games.the-culling.tsx`, line 50):

```typescript
const { addDiscount, removeDiscount, cart } = useCart();

// When game ends:
const discountResult = getDiscountResult(finalScore);
if (discountResult.discountPercent > 0) {
  const newDiscount: Discount = {
    id: `discount-${Date.now()}`,
    productId: productSlug, // From query param
    gameType: 'culling',
    discountPercent: discountResult.discountPercent,
    earnedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    applied: false,
  };
  addDiscount(newDiscount); // Adds to CartContext
}

// Navigate back to product with discount ready
navigate(`/products/${productSlug}`);
```

**No Server-Side Validation (Critical Gap):**
- Discount scores calculated client-side
- No verification that user actually earned the discount
- For production, must validate:
  1. Game completion recorded on server
  2. Score verified (prevent score spoofing)
  3. Apply discount server-side at checkout

---

## 8. AUTHENTICATION & SESSION MANAGEMENT

**Current Status:** NONE IMPLEMENTED

### Guest-Only Flow:
1. User browses products (no login required)
2. Adds items to cart (stored in localStorage)
3. Plays games (client-side score calculation)
4. Checks out with email + shipping address
5. Order stored in localStorage only

### Missing Components:
- No user registration or login
- No session tokens for persistence across devices
- No admin authentication
- No API authentication (no JWT, no OAuth, no Cloudflare Access)

### For Admin Portal Required:
```typescript
// Middleware pattern needed:
async function protectedRoute(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  // Verify token (implement strategy)
  const user = await verifyToken(token, c.env.JWT_SECRET);
  if (!user) {
    return c.json({ error: 'Invalid token' }, 401);
  }

  // Store user in context for next handler
  c.set('user', user);
  await next();
}

// Usage:
app.use('/api/admin/*', protectedRoute);

app.get('/api/admin/products', (c) => {
  const user = c.get('user');
  // Only admins can access
  if (user.role !== 'admin') {
    return c.json({ error: 'Forbidden' }, 403);
  }
  // ...
});
```

---

## 9. GAPS FOR ADMIN PORTAL INTEGRATION

### Product Management Gaps
- [ ] No API endpoint to fetch products from Printful
- [ ] No API endpoint to create/update/delete products
- [ ] No way to add Printful product IDs to our schema
- [ ] No variant image handling for different print areas
- [ ] No inventory sync with Printful

### Order Management Gaps
- [ ] No database to store orders (only localStorage)
- [ ] No Printful order creation API endpoint
- [ ] No order status tracking from Printful
- [ ] No shipping label generation
- [ ] No webhook handling for order updates

### Authentication Gaps
- [ ] No admin user model
- [ ] No login endpoint
- [ ] No JWT/token generation
- [ ] No role-based access control (RBAC)
- [ ] No admin user management UI

### API Architecture Gaps
- [ ] No KV cache configured
- [ ] No D1 database configured
- [ ] No request logging
- [ ] No error handling middleware
- [ ] No CORS configuration
- [ ] No rate limiting

### UI/UX Gaps
- [ ] No admin dashboard
- [ ] No product CRUD interface
- [ ] No order management interface
- [ ] No analytics/reporting

---

## 10. SPECIFIC INTEGRATION POINTS FOR PRINTFUL

### Where Printful API Calls Will Live
**Location:** `workers/app.ts` (lines 1-8, before catch-all)

### Printful API Base URL
```
https://api.printful.com/v2
```

### Key Endpoints to Implement

**1. Catalog: Fetch Products**
```
GET /api/catalog/products
→ Proxy to: GET https://api.printful.com/v2/catalog-products
→ Store in: CATALOG_CACHE KV
→ TTL: 1 hour
```

**2. Catalog: Get Product Details**
```
GET /api/catalog/products/:id
→ Proxy to: GET https://api.printful.com/v2/catalog-products/:id
```

**3. Orders: Estimate Shipping**
```
POST /api/orders/estimate
→ Proxy to: POST https://api.printful.com/v2/orders/estimate
→ Input: cart items + shipping address
→ Returns: shipping rates, taxes, total
```

**4. Orders: Create Draft**
```
POST /api/orders
→ Proxy to: POST https://api.printful.com/v2/orders (status: draft)
→ Input: Product ID, variants, recipient address
→ Returns: draft order with ID
```

**5. Orders: Confirm**
```
POST /api/orders/:id/confirm
→ Proxy to: POST https://api.printful.com/v2/orders/:id/confirm
→ Returns: confirmed order (charged)
```

### Authentication for Printful API
**Location in wrangler.jsonc (to be added):**
```jsonc
"env": {
  "production": {
    "vars": {
      "PRINTFUL_API_TOKEN": "..." // Should be added as secret via CLI:
                                   // wrangler secret put PRINTFUL_API_TOKEN
    }
  }
}
```

**Usage in Hono:**
```typescript
app.get('/api/catalog/products', async (c) => {
  const token = c.env.PRINTFUL_API_TOKEN;
  const res = await fetch('https://api.printful.com/v2/catalog-products', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  return c.json(await res.json());
});
```

### Data Transformation (Printful → Our Schema)
**Location:** New file `app/lib/transformers/printful.ts`

**Example:**
```typescript
function transformPrintfulProduct(printfulData: any): Product {
  return {
    id: printfulData.id.toString(),
    name: printfulData.title,
    slug: printfulData.title.toLowerCase().replace(/\s+/g, '-'),
    description: printfulData.description,
    price: parseFloat(printfulData.retail_price),
    imageUrl: printfulData.image, // Printful CDN URL or cache to R2
    variants: printfulData.variants.map(v => ({
      id: v.id.toString(),
      size: v.size,
      color: v.color,
      inStock: v.in_stock
    })),
    tags: [], // Could derive from Printful categories
    createdAt: new Date().toISOString(),
  };
}
```

---

## 11. DATA FLOW SUMMARY DIAGRAMS

### Current Product Data Flow
```
mockProducts[] (static)
  ↓
home.tsx loader
  ↓
Home component renders ProductGrid
  ↓
ProductCard components
  ↓
User clicks product
  ↓
product.tsx loader (getProductBySlug)
  ↓
ProductView component
  ↓
ProductModal + GameModal
  ↓
Add to cart → CartContext state
  ↓
Cart persisted to localStorage
```

### Current Cart & Order Flow
```
ProductView.addToCart(product, variant, qty)
  ↓
CartContext.addToCart() reducer
  ↓
Cart state updated
  ↓
useEffect saves to localStorage
  ↓
User navigates to /checkout
  ↓
CheckoutPage (form validation)
  ↓
sessionStorage.setItem('checkout_shipping', {...})
  ↓
User navigates to /checkout/review
  ↓
CheckoutReviewPage (displays summary)
  ↓
User clicks "Place Order"
  ↓
Mock order created with timestamp ID
  ↓
Order stored in localStorage
  ↓
Navigate to /checkout/confirmation?order={id}
  ↓
CheckoutConfirmationPage loads order from localStorage
  ↓
DEAD END: Order not sent to Printful
```

### Discount Game Flow
```
/products/:slug page renders
  ↓
GameModal opens
  ↓
User selects game from GameModal.tsx
  ↓
Navigate to /games/{type}?product={slug}
  ↓
Game component (e.g., games.the-culling.tsx)
  ↓
Game logic calculates score (client-side)
  ↓
GameResults component shows discount
  ↓
calculateDiscount(score) → determines tier
  ↓
newDiscount created with 30-min expiry
  ↓
CartContext.addDiscount() stores in state + localStorage
  ↓
Navigate back to /products/{slug}
  ↓
ProductView detects discount in CartContext
  ↓
Discount auto-applied to product (earnedDiscount field)
  ↓
User adds to cart with discount
  ↓
CartContext calculates totals with 40% cap
```

### Future Admin Portal Auth Flow (Not Implemented)
```
Admin user visits /admin
  ↓
No auth → redirect to /login
  ↓
/login page with email + password form
  ↓
POST /api/auth/login with credentials
  ↓
Hono endpoint verifies against admin database (D1)
  ↓
JWT token generated and returned
  ↓
Token stored in secure httpOnly cookie
  ↓
Client redirected to /admin/dashboard
  ↓
Every API request sends Authorization header
  ↓
protectedRoute middleware verifies JWT
  ↓
Allow access to /api/admin/* endpoints
```

---

## 12. RECOMMENDATIONS FOR ADMIN PORTAL

### Priority 1: Database & Auth (Foundation)
1. **Add D1 database** to wrangler.jsonc
   - Create users table (email, password_hash, role, created_at)
   - Create sessions table (user_id, token, expires_at)
   - Implement login endpoint: `POST /api/auth/login`

2. **Add JWT authentication middleware** in workers/app.ts
   - Generate JWT on login
   - Verify JWT on admin routes
   - Use `c.env.JWT_SECRET` from wrangler secrets

3. **Add admin routes** in app/routes.ts
   - `/admin/login` - Login page
   - `/admin/dashboard` - Main dashboard
   - Protected by middleware

### Priority 2: Product Management
1. **Add KV cache** to wrangler.jsonc (CATALOG_CACHE namespace)
2. **Implement GET /api/catalog/products** endpoint
   - Fetch from Printful API
   - Cache in KV (1-hour TTL)
   - Return transformed Product[]

3. **Create ProductList admin page**
   - `/admin/products` displays all products
   - Shows: name, price, variants, inStock status
   - Actions: Edit, Delete, Sync with Printful

4. **Create ProductEdit admin page**
   - `/admin/products/:id/edit`
   - Form to update product details
   - POST to `/api/admin/products/:id` to save

### Priority 3: Order Management
1. **Add D1 orders table** (schema shown above)
2. **Implement POST /api/orders** endpoint
   - Creates draft order in Printful
   - Stores in D1
   - Returns order ID

3. **Implement POST /api/orders/:id/confirm** endpoint
   - Confirms order with Printful
   - Updates status in D1
   - Sends confirmation email

4. **Create OrderList admin page**
   - `/admin/orders` displays all orders
   - Shows: order ID, customer, total, status, date
   - Filter/search functionality

5. **Create OrderDetail admin page**
   - `/admin/orders/:id`
   - Shows full order details
   - Shipment tracking from Printful

### Priority 4: Analytics & Reporting
1. Add game completion tracking (D1)
2. Create `/admin/analytics` page
3. Show: popular products, game statistics, discount usage

---

## 13. CONCLUSION: CURRENT STRENGTHS & WEAKNESSES

### Strengths
✅ Clean, modular type system (Product, Cart, Discount)
✅ Robust discount capping and validation (40% max)
✅ Well-structured React Router routes
✅ Comprehensive game system with scoring
✅ Good component organization (lib/components, lib/contexts)
✅ Proper environmental separation (dev/prod potential)
✅ Proper SSR setup with React Router v7

### Critical Weaknesses
❌ No backend API routes (all mock data)
❌ No database (localStorage only)
❌ No authentication system
❌ No Printful integration
❌ No admin portal
❌ Orders not persisted beyond localStorage
❌ Game scores not server-validated (security risk)
❌ No KV or D1 bindings configured
❌ No error handling or logging

### For Admin Portal: Must Build First
1. **Authentication** - Login, JWT, RBAC
2. **Database** - D1 with orders, users, game stats
3. **Product API** - Fetch/cache from Printful
4. **Order API** - Create/confirm with Printful
5. **Admin UI** - Product CRUD, order management, analytics

