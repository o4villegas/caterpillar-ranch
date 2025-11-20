# Phase 3: Product Management - Implementation Plan
**Date:** 2025-11-15
**Status:** Ready to Build (Investigation Complete)
**Estimated Time:** 3 days (24 hours)

---

## 🔬 Pre-Build Investigation Results (2025-11-15)

### Investigation Summary
Conducted comprehensive pre-build investigation to verify 3 critical architectural assumptions:

**1. Printful Variant Stock Field** ✅ **EXISTS (but requires extra API calls)**
- **Endpoint:** `GET /v2/catalog-variants/{id}/availability`
- **Issue:** Stock data NOT included in main product/variant responses
- **Impact:** Would require N extra API calls (1 per variant) to fetch stock status
- **Example:** 20 products × 4 variants = 80 extra API calls
- **Rate Limit Risk:** Printful allows 120 req/min - large catalogs could hit limits
- **DECISION:** **Omit stock status from ProductDetailModal variants table (Phase 3 MVP)**
  - Rationale: Faster sync, no rate limit risk, simpler implementation
  - Future Enhancement: Can add stock status in Phase 4 with proper caching strategy
  - Impact: Users won't see "In Stock: Yes/No" in admin portal (acceptable for MVP)

**2. Home.tsx Loader Architecture** ⚠️ **BREAKING CHANGE REQUIRED**
- **Current:** home.tsx fetches directly from Printful API, bypasses D1 database
- **Problem:** Cannot respect `display_order` without querying D1 products table
- **Required Change:** Refactor home.tsx loader to:
  1. Query D1 products table with `ORDER BY display_order ASC NULLS LAST`
  2. Fall back to Printful API for fresh installs (before first sync)
  3. Document: Products won't display until admin performs first sync
- **Impact:** Breaking change to existing homepage behavior
- **Benefits:** Enables product reordering, improves page load speed (D1 faster than Printful API)
- **DECISION:** **Refactor home.tsx as part of Phase 3 implementation**

**3. Variant Price Storage** ✅ **VERIFIED**
- **Schema:** Variants table does NOT have price column
- **Pricing Model:** All variants share price from parent `products` table
  - `products.base_price` (Printful's cost) - used as default retail price
  - `products.retail_price` (Admin override) - optional custom markup
- **ProductDetailModal:** Display single price (from product), not per-variant pricing
- **Variants Table Columns:** Size, Color, Printful Variant ID, Stock Status (omitted in MVP)
- **DECISION:** **Use product-level pricing for all variants (matches current schema)**

### Database Schema Verification

**Products Table** (workers/db/schema.sql:24-48):
```sql
CREATE TABLE products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  base_price REAL NOT NULL,        -- Printful cost (used as default)
  retail_price REAL,               -- Admin override (optional)
  printful_product_id INTEGER NOT NULL,
  printful_synced_at TEXT,
  image_url TEXT NOT NULL,
  tags TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'hidden')),
  published_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  -- display_order INTEGER will be added in migration
);
```

**Product Variants Table** (workers/db/schema.sql:58-78):
```sql
CREATE TABLE product_variants (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  size TEXT NOT NULL CHECK (size IN ('S', 'M', 'L', 'XL', 'XXL')),
  color TEXT NOT NULL,
  printful_variant_id INTEGER NOT NULL UNIQUE,
  in_stock INTEGER NOT NULL DEFAULT 1,  -- Will NOT sync from Printful in MVP
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);
```

### Architectural Decisions

**Stock Status Handling:**
- ❌ DO NOT fetch from `/v2/catalog-variants/{id}/availability` in MVP
- ✅ Use `product_variants.in_stock` column (default value: 1)
- ✅ Omit "Stock" column from ProductDetailModal variants table
- 📋 Future: Add stock sync in Phase 4 with proper batching and caching

**Homepage Product Display:**
- ❌ DO NOT fetch from Printful API in home.tsx loader
- ✅ Query D1 products table: `SELECT * FROM products WHERE status='active' ORDER BY display_order ASC NULLS LAST`
- ✅ Fallback to Printful API only if D1 products table is empty (fresh install)
- 📋 Document: Homepage requires initial sync from admin portal to display products

**Variant Pricing:**
- ❌ DO NOT store per-variant prices in product_variants table
- ✅ Display product-level price (base_price or retail_price) for all variants
- ✅ ProductDetailModal shows single price at top, variants table shows Size/Color/ID only

---

## Requirements Summary (From 20 T/F Questions)

### Product List View
- ✅ **Table view** on desktop (data-dense, columns)
- ✅ **Card view** on mobile (stacked, touch-friendly)
- ✅ **Search:** Requires Enter key (not instant, fewer API calls)
- ✅ **Pagination:** 20 per page with page numbers
- ✅ **Bulk actions:** Select checkboxes first, then choose action
- ✅ **Filter:** Status dropdown only (All, Active, Hidden) - NO tag filtering
- ✅ **Sort:** Fixed order (newest synced first) - NO sort dropdown
- ✅ **Thumbnails:** Show small product images (64x64px)
- ✅ **Columns:** Image, Name, Printful ID, Status, Price, Last Synced, Actions

### Product Detail Modal
- ✅ **Modal overlay** (not full page, stays on list)
- ✅ **Read-only** product info (name, description, price)
- ✅ **Variants table:** Show ALL variants (size, color, Printful ID) - **Stock status omitted in MVP**
- ✅ **Actions:** Hide/Show toggle, Sync button
- ✅ **No editing:** Cannot change name, price, or description

### Product Sync
- ✅ **Sync All button** with progress modal (blocking UI)
- ✅ **Individual sync:** Only from product detail modal (not quick action on list)
- ✅ **Strategy:** Upsert (add new products, update existing)
- ✅ **Auto-publish:** New products set to status='active' immediately
- ✅ **Images:** Use Printful CDN URLs directly (no R2 hosting)
- ✅ **Direction:** Printful → Our App (pull catalog data)

### Product States
- ✅ **Two states:** Active, Hidden (no draft state)
- ✅ **Active:** Visible on main site homepage
- ✅ **Hidden:** Not visible on site, only in admin

### NEW FEATURE: Display Order Management
- ✅ **Reorder products** to control homepage display order
- ✅ **UI:** Up/Down arrow buttons (mobile-friendly)
- ✅ **Storage:** `display_order` column (INTEGER)
- ✅ **Homepage:** Respects display_order when showing products

---

## Database Changes

### Migration: Add display_order Column

**File:** `workers/db/migrations/003_add_display_order.sql`

```sql
-- Add display_order column to products table
ALTER TABLE products ADD COLUMN display_order INTEGER;

-- Set initial display_order based on creation date (newest first)
UPDATE products SET display_order = id WHERE display_order IS NULL;

-- Create index for sorting
CREATE INDEX IF NOT EXISTS idx_products_display_order ON products(display_order ASC);
```

**Updated Products Table:**
```sql
CREATE TABLE products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  base_price REAL NOT NULL,
  retail_price REAL,
  printful_product_id INTEGER NOT NULL,
  printful_synced_at TEXT,
  image_url TEXT NOT NULL,
  tags TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'hidden')), -- Removed 'draft'
  published_at TEXT,
  display_order INTEGER, -- NEW: Controls homepage display order
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

---

## API Endpoints

### 1. GET /api/admin/products

**Purpose:** Fetch paginated product list with search and filters

**Query Params:**
- `search` (string, optional): Search by name or Printful ID (requires Enter key)
- `status` (string, optional): Filter by status ('all', 'active', 'hidden')
- `page` (number, default: 1): Page number
- `limit` (number, default: 20): Items per page

**Response:**
```json
{
  "products": [
    {
      "id": "cr-punk",
      "name": "CR-PUNK Caterpillar Tee",
      "printful_product_id": 123456,
      "status": "active",
      "base_price": 29.99,
      "image_url": "https://files.cdn.printful.com/...",
      "printful_synced_at": "2025-11-15T12:00:00Z",
      "display_order": 1
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

**Sorting:** ORDER BY display_order ASC (fixed, no dropdown)

**File:** `workers/routes/admin/products.ts`

---

### 2. GET /api/admin/products/:id

**Purpose:** Fetch single product with full details (for modal)

**Response:**
```json
{
  "product": {
    "id": "cr-punk",
    "name": "CR-PUNK Caterpillar Tee",
    "description": "Horror punk caterpillar design...",
    "printful_product_id": 123456,
    "status": "active",
    "base_price": 29.99,
    "retail_price": null,
    "image_url": "https://files.cdn.printful.com/...",
    "printful_synced_at": "2025-11-15T12:00:00Z",
    "display_order": 1,
    "created_at": "2025-11-01T10:00:00Z",
    "updated_at": "2025-11-15T12:00:00Z"
  },
  "variants": [
    {
      "id": "var-1",
      "size": "M",
      "color": "Black",
      "printful_variant_id": 4012,
      "price": 29.99,
      "in_stock": true
    },
    {
      "id": "var-2",
      "size": "L",
      "color": "Black",
      "printful_variant_id": 4013,
      "price": 29.99,
      "in_stock": true
    }
  ]
}
```

**File:** `workers/routes/admin/products.ts`

---

### 3. POST /api/admin/products/:id/toggle-status

**Purpose:** Toggle product between active/hidden

**Request:**
```json
{
  "status": "hidden" // or "active"
}
```

**Response:**
```json
{
  "success": true,
  "product": {
    "id": "cr-punk",
    "status": "hidden",
    "updated_at": "2025-11-15T12:30:00Z"
  }
}
```

**File:** `workers/routes/admin/products.ts`

---

### 4. POST /api/admin/products/:id/sync

**Purpose:** Sync single product from Printful API

**Response:**
```json
{
  "success": true,
  "product": {
    "id": "cr-punk",
    "name": "CR-PUNK Caterpillar Tee (Updated)",
    "base_price": 31.99, // Price updated from Printful
    "printful_synced_at": "2025-11-15T12:35:00Z"
  },
  "changes": ["price", "variants"]
}
```

**Logic:**
1. Fetch from Printful API: `GET /v2/catalog-products/{printful_product_id}`
2. Update D1 database (upsert product + variants)
3. Return updated product data

**File:** `workers/routes/admin/products.ts`

---

### 5. POST /api/admin/products/sync-all

**Purpose:** Sync all products from Printful catalog

**Request:** (empty body)

**Response (Streaming):**
```json
{
  "progress": {
    "current": 5,
    "total": 20,
    "status": "syncing",
    "currentProduct": "CR-PUNK"
  }
}
```

**Final Response:**
```json
{
  "success": true,
  "results": {
    "added": 3,
    "updated": 17,
    "errors": [],
    "duration": "12.5s"
  }
}
```

**Logic:**
1. Fetch all products from Printful: `GET /v2/catalog-products`
2. For each product:
   - Fetch full details: `GET /v2/catalog-products/{id}`
   - Upsert to D1 (add if new, update if exists)
   - Set status='active' for new products
   - Preserve display_order for existing products
3. Stream progress updates to frontend

**File:** `workers/routes/admin/products.ts`

---

### 6. POST /api/admin/products/bulk-action

**Purpose:** Perform bulk actions (hide/show/sync) on selected products

**Request:**
```json
{
  "action": "hide", // or "show", "sync"
  "productIds": ["cr-punk", "cr-rock", "cr-weird"]
}
```

**Response:**
```json
{
  "success": true,
  "results": {
    "succeeded": ["cr-punk", "cr-rock"],
    "failed": [
      {
        "id": "cr-weird",
        "error": "Product not found"
      }
    ]
  }
}
```

**File:** `workers/routes/admin/products.ts`

---

### 7. POST /api/admin/products/:id/reorder

**Purpose:** Move product up/down in display order

**Request:**
```json
{
  "direction": "up" // or "down"
}
```

**Response:**
```json
{
  "success": true,
  "products": [
    {
      "id": "cr-punk",
      "display_order": 1
    },
    {
      "id": "cr-rock",
      "display_order": 2
    }
  ]
}
```

**Logic:**
1. Get current product's display_order (e.g., 3)
2. If direction='up':
   - Find product with display_order=2
   - Swap: current becomes 2, previous becomes 3
3. If direction='down':
   - Find product with display_order=4
   - Swap: current becomes 4, next becomes 3
4. Return updated products

**File:** `workers/routes/admin/products.ts`

---

## Frontend Components

### 1. ProductTable Component

**File:** `app/lib/components/admin/ProductTable.tsx`

**Props:**
```typescript
interface ProductTableProps {
  products: Product[];
  selectedIds: string[];
  onSelectProduct: (id: string) => void;
  onSelectAll: () => void;
  onViewProduct: (id: string) => void;
  onReorderProduct: (id: string, direction: 'up' | 'down') => void;
}
```

**Features:**
- Checkbox column (select all + individual)
- Thumbnail column (64x64px image)
- Name column (clickable to open modal)
- Printful ID column (monospace font)
- Status column (badge: green=active, gray=hidden)
- Price column (formatted as currency)
- Last Synced column (relative time: "2 hours ago")
- Actions column (Up/Down arrows for reordering)

**Mobile View:**
- Switch to card layout (stacked)
- Show: Thumbnail, Name, Status, Price
- Hide: Printful ID, Last Synced (show in modal)
- Actions: Tap card to open modal, swipe for reorder

---

### 2. ProductDetailModal Component

**File:** `app/lib/components/admin/ProductDetailModal.tsx`

**Props:**
```typescript
interface ProductDetailModalProps {
  productId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusToggle: (id: string, newStatus: string) => void;
  onSync: (id: string) => void;
}
```

**Sections:**
1. **Header:** Product name + Close button
2. **Product Info (Read-Only):**
   - Image (large preview)
   - Name, Description
   - Printful Product ID
   - Base Price (from Printful)
   - Status badge
   - Last Synced timestamp
3. **Variants Table:**
   - Columns: Size, Color, Printful Variant ID
   - Price shown at product level (not per-variant)
   - Stock status omitted in MVP (future enhancement)
   - All rows visible (no pagination for variants)
4. **Actions:**
   - Hide/Show toggle button (changes status)
   - Sync button (refetch from Printful)
   - Close button

**Loading State:** Skeleton loaders while fetching product details

---

### 3. SyncProgressModal Component

**File:** `app/lib/components/admin/SyncProgressModal.tsx`

**Props:**
```typescript
interface SyncProgressModalProps {
  isOpen: boolean;
  progress: {
    current: number;
    total: number;
    currentProduct?: string;
  };
  onCancel?: () => void;
}
```

**Features:**
- Progress bar (e.g., "Syncing 5 of 20")
- Current product name (e.g., "Syncing: CR-PUNK...")
- Cancel button (optional, stops sync)
- Success/Error summary when complete

**Design:**
- Blocks UI (modal overlay)
- Horror theme colors (lime progress bar)
- Breathing animation on progress bar

---

### 4. ProductFilters Component

**File:** `app/lib/components/admin/ProductFilters.tsx`

**Props:**
```typescript
interface ProductFiltersProps {
  search: string;
  status: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit: () => void;
  onStatusChange: (status: string) => void;
}
```

**Elements:**
- Search input (text field + Enter key or Search button)
- Status dropdown (All, Active, Hidden)
- Clear filters button

---

### 5. BulkActionsToolbar Component

**File:** `app/lib/components/admin/BulkActionsToolbar.tsx`

**Props:**
```typescript
interface BulkActionsToolbarProps {
  selectedCount: number;
  onHide: () => void;
  onShow: () => void;
  onSync: () => void;
  onClearSelection: () => void;
}
```

**Features:**
- Shows when selectedCount > 0
- Displays: "X products selected"
- Action buttons: Hide, Show, Sync
- Clear selection button

---

### 6. Products List Page

**File:** `app/routes/admin/products.list.tsx`

**Features:**
- Header with "Products" title + "Sync All" button
- ProductFilters component
- BulkActionsToolbar component (conditional)
- ProductTable component
- Pagination controls (Prev, 1, 2, 3, Next)
- ProductDetailModal component (controlled by state)
- SyncProgressModal component (controlled by state)

**State Management:**
```typescript
const [products, setProducts] = useState([]);
const [selectedIds, setSelectedIds] = useState([]);
const [filters, setFilters] = useState({ search: '', status: 'all' });
const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
const [selectedProductId, setSelectedProductId] = useState(null);
const [syncProgress, setSyncProgress] = useState(null);
```

---

## Implementation Steps

### Step 1: Database Migration (1 hour)
1. Create `003_add_display_order.sql`
2. Add display_order column
3. Set initial values
4. Create index
5. Execute migration (local + production)

### Step 2: Home.tsx Refactoring (2 hours) - **BREAKING CHANGE**
1. Refactor loader to query D1 products table
2. Add fallback to Printful API for fresh installs
3. Implement display_order sorting
4. Test homepage with empty database (shows fallback)
5. Test homepage after products exist (shows D1 products)
6. Verify performance (page load < 100ms)

### Step 3: Backend API Routes (8 hours)
1. Create `workers/routes/admin/products.ts`
2. Implement all 7 endpoints (list, detail, toggle, sync, sync-all, bulk, reorder)
3. Add Printful API integration
4. Test with curl

### Step 4: Frontend Components (12 hours)
1. ProductTable component (4 hours)
   - Desktop table layout
   - Mobile card layout
   - Reorder arrows
2. ProductDetailModal component (3 hours)
   - Product info display
   - Variants table (Size, Color, Printful ID only - no stock/price)
   - Actions
3. SyncProgressModal component (2 hours)
   - Progress bar
   - Stream updates
4. ProductFilters component (1 hour)
5. BulkActionsToolbar component (1 hour)
6. Products list page (1 hour)

### Step 5: Testing & Polish (3 hours)
1. Test all CRUD operations
2. Test bulk actions
3. Test sync (single + all)
4. Test reordering
5. Test home.tsx refactor (fresh install vs with products)
6. Test mobile responsive
7. TypeScript validation

---

## Success Criteria

- [ ] Can view paginated product list (table on desktop, cards on mobile)
- [ ] Can search products by name or Printful ID (Enter key required)
- [ ] Can filter by status (All, Active, Hidden)
- [ ] Can select multiple products (checkboxes)
- [ ] Can bulk hide/show/sync selected products
- [ ] Can click product to open detail modal
- [ ] Can view all product variants in modal
- [ ] Can toggle product status (active ↔ hidden)
- [ ] Can sync single product from Printful
- [ ] Can sync all products with progress modal
- [ ] Can reorder products with up/down arrows
- [ ] Homepage respects display_order when showing products
- [ ] Homepage queries D1 database (not Printful API)
- [ ] Homepage loads in < 100ms (D1 query performance)
- [ ] Homepage shows fallback on fresh install (before first sync)
- [ ] Products appear on homepage immediately after sync
- [ ] Hidden products disappear from homepage immediately
- [ ] All actions show loading states
- [ ] All actions show success/error toasts
- [ ] Mobile-friendly (works on 320px viewports)

---

## Files to Create/Modify

**New Files:**
```
workers/db/migrations/003_add_display_order.sql
workers/routes/admin/products.ts
app/routes/admin/products.list.tsx
app/lib/components/admin/ProductTable.tsx
app/lib/components/admin/ProductDetailModal.tsx
app/lib/components/admin/SyncProgressModal.tsx
app/lib/components/admin/ProductFilters.tsx
app/lib/components/admin/BulkActionsToolbar.tsx
```

**Modified Files:**
```
workers/routes/admin.ts (mount products routes)
app/routes/home.tsx (BREAKING CHANGE - refactor to query D1)
```

### home.tsx Refactoring Details

**File:** `app/routes/home.tsx`

**Current Behavior:**
- Imports PrintfulClient directly in loader
- Fetches products from Printful API
- No ORDER BY clause (returns in Printful's order)
- No database interaction

**Required Changes:**
1. **Query D1 products table first:**
   ```typescript
   const dbProducts = await db.prepare(`
     SELECT id, name, slug, description, base_price, retail_price,
            image_url, status, display_order
     FROM products
     WHERE status = 'active'
     ORDER BY display_order ASC NULLS LAST
   `).all();
   ```

2. **Fetch variants for each product:**
   ```typescript
   const variants = await db.prepare(`
     SELECT id, size, color, printful_variant_id, in_stock
     FROM product_variants
     WHERE product_id = ?
   `).bind(productId).all();
   ```

3. **Fallback to Printful API (fresh install only):**
   ```typescript
   if (dbProducts.results.length === 0) {
     // Fresh install - no products synced yet
     const printful = new PrintfulClient(...);
     const storeProducts = await printful.getStoreProducts();
     return { products: transformProducts(storeProducts), source: 'printful' };
   }
   ```

4. **Transform D1 results to Product type:**
   - Map base_price or retail_price to product.price
   - Attach variants array to each product
   - Use display_order for ordering

**Impact:**
- ⚠️ **BREAKING:** Homepage will show NO products until admin performs first sync
- ✅ **BENEFIT:** Faster page load (D1 query ~5ms vs Printful API ~200ms)
- ✅ **BENEFIT:** Enables product reordering feature
- ✅ **BENEFIT:** Products display immediately after admin hides/shows them

**Testing Required:**
- [ ] Fresh install: Homepage shows fallback message or Printful products
- [ ] After first sync: Homepage displays D1 products in display_order
- [ ] After reordering: Homepage reflects new order immediately
- [ ] After hiding product: Product disappears from homepage
- [ ] Performance: Page load time < 100ms (D1 query)

---

## Estimated Timeline

| Task | Time | Status |
|------|------|--------|
| Database migration | 1 hour | Pending |
| API endpoints (7 total) | 8 hours | Pending |
| **home.tsx refactoring** | **2 hours** | **Pending** |
| ProductTable component | 4 hours | Pending |
| ProductDetailModal component | 3 hours | Pending |
| SyncProgressModal component | 2 hours | Pending |
| ProductFilters component | 1 hour | Pending |
| BulkActionsToolbar component | 1 hour | Pending |
| Products list page | 1 hour | Pending |
| Testing & polish | 3 hours | Pending |
| **Total** | **26 hours** | **0% Complete** |

---

**Ready to build Phase 3!** 🚀
