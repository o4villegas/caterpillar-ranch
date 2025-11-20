# Admin Portal Implementation Plan
**Date:** 2025-11-14
**Status:** Ready to Build
**Backend:** ✅ Complete (Auth, D1, Printful API)

---

## Executive Summary

Based on user requirements verification (10 T/F questions), this plan outlines building a **mobile-friendly**, **read-only** admin portal for monitoring the Caterpillar Ranch e-commerce store. The portal focuses on visibility and analytics rather than control, as Printful handles fulfillment and pricing.

### User Requirements (Verified)
1. ✅ **Auto-refresh dashboard** (30-60s polling, real-time updates)
2. ❌ **NO custom pricing** (Printful prices only, no admin overrides)
3. ❌ **NO product creation** (Printful catalog sync only)
4. ✅ **Mobile-friendly UI** (responsive design, works on phone/tablet)
5. ✅ **Full customer data** (emails, addresses visible for records)
6. ❌ **NO manual order control** (Printful webhooks only, read-only status)
7. ✅ **Game analytics dashboard** (plays, conversions, popular games)
8. ❌ **Single admin account** (no multi-user, no permissions)
9. ✅ **Bulk product operations** (multi-select hide/show/sync)
10. ✅ **Search/filter must-have** (by date, status, name, etc.)

### Scope
**Core Features (MVP):**
- Dashboard with real-time stats
- Product list/detail (read-only, sync from Printful)
- Order list/detail (read-only, customer data visible)
- Game analytics (plays, conversions, revenue impact)

**Explicitly Out of Scope:**
- Product creation/image upload
- Custom pricing/markup controls
- Manual order status changes
- Multi-admin/permissions system
- Customer management

---

## Architecture Overview

### Tech Stack (Existing)
- **Frontend:** React Router v7 (SSR), Tailwind CSS v4, shadcn/ui, Framer Motion
- **Backend:** Cloudflare Workers, Hono API, D1 Database, KV Cache
- **Auth:** JWT (bcryptjs), httpOnly cookies, Bearer tokens
- **External:** Printful API v2

### Admin Portal Structure
Following **Medusa admin patterns** (validated from reference repo):

```
app/routes/admin/
├── layout.tsx              # Shared admin layout (sidebar, nav, auth check)
├── dashboard.tsx           # Main dashboard (stats, charts, recent activity)
├── products/
│   ├── products.list.tsx   # Product list with search/filters/bulk
│   ├── products.detail.tsx # Single product view (read-only)
│   └── products.sync.tsx   # Trigger Printful sync
├── orders/
│   ├── orders.list.tsx     # Order list with search/filters
│   └── orders.detail.tsx   # Single order view (read-only)
└── analytics/
    └── analytics.games.tsx # Game analytics dashboard
```

### API Routes (Backend)
```
workers/routes/admin/
├── products.ts    # GET /api/admin/products, POST /api/admin/products/sync
├── orders.ts      # GET /api/admin/orders, GET /api/admin/orders/:id
└── analytics.ts   # GET /api/admin/analytics/games, /dashboard-stats
```

---

## Phase 1: Admin Layout & Navigation (Week 1, Days 1-2)

### 1.1 Admin Layout Component
**File:** `app/routes/admin/layout.tsx`

**Features:**
- Protected route (require auth, redirect to /admin/login)
- Responsive sidebar navigation (mobile drawer, desktop fixed)
- Top bar with admin name, logout button
- Active route highlighting
- Horror-themed styling (consistent with main site)

**Navigation Items:**
1. 📊 Dashboard
2. 📦 Products
3. 📋 Orders
4. 🎮 Games Analytics
5. 👤 Profile (logout)

**Code Pattern (from Medusa):**
```tsx
export async function loader({ context }: Route.LoaderArgs) {
  // requireAuth middleware
  const token = extractToken(context.request);
  if (!token) {
    throw redirect('/admin/login');
  }

  const payload = await verifyToken(token, context.cloudflare.env.JWT_SECRET);
  if (!payload) {
    throw redirect('/admin/login');
  }

  // Fetch admin user details
  const user = await getUserById(context.cloudflare.env.DB, payload.userId);
  return { user };
}

export default function AdminLayout() {
  const { user } = useLoaderData<typeof loader>();

  return (
    <div className="admin-layout">
      <Sidebar user={user} />
      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
}
```

**Components Needed:**
- `AdminSidebar.tsx` (desktop fixed, mobile drawer)
- `AdminTopBar.tsx` (breadcrumbs, user menu)
- `AdminNavLink.tsx` (active state styling)

**Styling:**
- Use ranch color palette (cyan, lime, pink, purple)
- Mobile-first: Tailwind responsive classes
- Animations: Framer Motion for sidebar slide-in

**Estimate:** 1 day (8 hours)

---

### 1.2 Authentication Flow
**File:** `app/routes/admin/login.tsx` (already exists)

**Enhancements Needed:**
- Error handling for failed login
- Loading states during auth check
- Remember me (extend JWT expiry)
- Auto-redirect if already logged in

**Estimate:** 2 hours (enhancements only, base exists)

---

## Phase 2: Dashboard (Week 1, Days 3-5)

### 2.1 Dashboard Stats Cards
**File:** `app/routes/admin/dashboard.tsx`

**Key Metrics:**
1. **Total Orders** (today, this week, this month)
2. **Revenue** (net after discounts)
3. **Active Products** (synced from Printful)
4. **Games Played** (today, conversion rate)

**Real-Time Updates:**
- Poll every 30 seconds using React Query or custom hook
- Show "Updated X seconds ago" timestamp
- Visual indicator when data refreshes

**API Endpoint:**
```typescript
// workers/routes/admin/analytics.ts
app.get('/dashboard-stats', requireAuth, async (c) => {
  const db = c.env.DB;

  // Queries:
  const ordersToday = await db.prepare(
    'SELECT COUNT(*) as count, SUM(CAST(total as REAL)) as revenue FROM orders WHERE DATE(created_at) = DATE("now")'
  ).first();

  const productsActive = await db.prepare(
    'SELECT COUNT(*) as count FROM products WHERE status = "active"'
  ).first();

  const gamesPlayedToday = await db.prepare(
    'SELECT COUNT(*) as plays, COUNT(CASE WHEN converted_to_purchase = 1 THEN 1 END) as conversions FROM game_completions WHERE DATE(created_at) = DATE("now")'
  ).first();

  return c.json({
    orders: { today: ordersToday.count, revenue: ordersToday.revenue },
    products: { active: productsActive.count },
    games: { plays: gamesPlayedToday.plays, conversions: gamesPlayedToday.conversions },
  });
});
```

**Components:**
- `StatCard.tsx` (reusable metric display)
- `RevenueChart.tsx` (optional: 7-day revenue line chart)
- `ActivityFeed.tsx` (recent orders, games played)

**Estimate:** 2 days (16 hours)

---

### 2.2 Recent Activity Feed
**Features:**
- Last 10 orders (customer email, total, status, timestamp)
- Last 10 games played (game type, score, discount earned)
- Real-time updates (30s poll)

**Styling:**
- Table format (mobile: stacked cards)
- Status badges (pending/confirmed/shipped)
- Click order to view details

**Estimate:** 1 day (8 hours)

---

## Phase 3: Product Management (Week 2, Days 1-3)

### 3.1 Product List
**File:** `app/routes/admin/products/products.list.tsx`

**Features:**
1. **Table view** (desktop) / **Card view** (mobile)
   - Columns: Image, Name, Status, Price, Printful ID, Last Synced
2. **Search bar** (by name, Printful ID)
3. **Filters:** Status (draft/active/hidden), Tags
4. **Bulk actions:**
   - Select multiple (checkboxes)
   - Bulk Hide/Show/Sync
5. **Pagination** (20 per page)
6. **"Sync from Printful" button** (top-right)

**API Endpoint:**
```typescript
// workers/routes/admin/products.ts
app.get('/products', requireAuth, async (c) => {
  const db = c.env.DB;
  const { search, status, page = 1, limit = 20 } = c.req.query();

  let query = 'SELECT * FROM products';
  const conditions = [];
  const params = [];

  if (search) {
    conditions.push('(name LIKE ? OR id LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }

  if (status && status !== 'all') {
    conditions.push('status = ?');
    params.push(status);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY updated_at DESC LIMIT ? OFFSET ?';
  params.push(limit, (page - 1) * limit);

  const products = await db.prepare(query).bind(...params).all();
  const total = await db.prepare('SELECT COUNT(*) as count FROM products').first();

  return c.json({
    products: products.results,
    pagination: { page, limit, total: total.count },
  });
});
```

**Components:**
- `ProductTable.tsx` (desktop table)
- `ProductCard.tsx` (mobile card)
- `ProductFilters.tsx` (search, dropdowns)
- `BulkActions.tsx` (multi-select toolbar)

**Estimate:** 2 days (16 hours)

---

### 3.2 Product Detail (Read-Only)
**File:** `app/routes/admin/products/products.detail.tsx`

**Sections:**
1. **Product Info:** Name, Printful ID, Status, Created/Updated dates
2. **Pricing:** Printful base price (read-only, no markup)
3. **Variants:** Table with sizes, Printful variant IDs, stock status
4. **Images:** Gallery from Printful CDN
5. **Sync History:** Last synced, sync button

**Actions:**
- "Hide Product" / "Show Product" toggle
- "Sync from Printful" button (refetch from API)

**Estimate:** 1 day (8 hours)

---

### 3.3 Printful Sync
**File:** `app/routes/admin/products/products.sync.tsx` (modal)

**Features:**
- Button triggers modal: "Sync All Products from Printful?"
- Loading spinner during sync
- Progress: "Syncing product 5 of 20..."
- Success: "Synced 20 products, added 3 new, updated 17"
- Errors: Show failed products with reason

**API Endpoint:**
```typescript
// workers/routes/admin/products.ts
app.post('/products/sync', requireAuth, async (c) => {
  const db = c.env.DB;
  const printful = new PrintfulClient(c.env.PRINTFUL_API_TOKEN, c.env.PRINTFUL_STORE_ID);

  // Fetch all products from Printful
  const printfulProducts = await printful.getStoreProducts();

  const results = { added: 0, updated: 0, errors: [] };

  for (const product of printfulProducts.data) {
    try {
      const fullProduct = await printful.getStoreProduct(product.id);
      const transformed = transformStoreProduct(fullProduct.data);

      // Upsert to D1
      const existing = await db.prepare('SELECT id FROM products WHERE printful_product_id = ?').bind(product.id).first();

      if (existing) {
        await db.prepare(
          'UPDATE products SET name = ?, slug = ?, base_price = ?, image_url = ?, printful_synced_at = datetime("now"), updated_at = datetime("now") WHERE printful_product_id = ?'
        ).bind(transformed.name, transformed.slug, transformed.basePrice, transformed.imageUrl, product.id).run();
        results.updated++;
      } else {
        await db.prepare(
          'INSERT INTO products (id, name, slug, base_price, image_url, printful_product_id, status, printful_synced_at) VALUES (?, ?, ?, ?, ?, ?, "draft", datetime("now"))'
        ).bind(transformed.id, transformed.name, transformed.slug, transformed.basePrice, transformed.imageUrl, product.id).run();
        results.added++;
      }
    } catch (error) {
      results.errors.push({ product: product.name, error: error.message });
    }
  }

  return c.json(results);
});
```

**Estimate:** 1 day (8 hours)

---

## Phase 4: Order Management (Week 2, Days 4-5 + Week 3, Days 1-2)

### 4.1 Order List
**File:** `app/routes/admin/orders/orders.list.tsx`

**Features:**
1. **Table view:**
   - Columns: Order ID, Customer Email, Total, Discount %, Status, Created At
2. **Search:** By order ID, customer email
3. **Filters:** Status (pending/confirmed/shipped), Date range
4. **Pagination:** 20 per page
5. **Sort:** By date (newest first default)

**API Endpoint:**
```typescript
// workers/routes/admin/orders.ts
app.get('/orders', requireAuth, async (c) => {
  const db = c.env.DB;
  const { search, status, startDate, endDate, page = 1, limit = 20 } = c.req.query();

  let query = 'SELECT id, customer_email, total, discount_percent, status, created_at FROM orders';
  const conditions = [];
  const params = [];

  if (search) {
    conditions.push('(id LIKE ? OR customer_email LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }

  if (status && status !== 'all') {
    conditions.push('status = ?');
    params.push(status);
  }

  if (startDate) {
    conditions.push('DATE(created_at) >= ?');
    params.push(startDate);
  }

  if (endDate) {
    conditions.push('DATE(created_at) <= ?');
    params.push(endDate);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, (page - 1) * limit);

  const orders = await db.prepare(query).bind(...params).all();
  const total = await db.prepare('SELECT COUNT(*) as count FROM orders').first();

  return c.json({
    orders: orders.results,
    pagination: { page, limit, total: total.count },
  });
});
```

**Components:**
- `OrderTable.tsx` (desktop)
- `OrderCard.tsx` (mobile)
- `OrderFilters.tsx` (search, date range, status)
- `StatusBadge.tsx` (color-coded status)

**Estimate:** 2 days (16 hours)

---

### 4.2 Order Detail (Read-Only)
**File:** `app/routes/admin/orders/orders.detail.tsx`

**Sections:**
1. **Order Summary:**
   - Order ID, Status, Created/Confirmed dates
   - Printful Status (from webhooks)
   - Test Mode indicator (if applicable)

2. **Customer Info:**
   - Email, Name
   - Shipping Address (full details)
   - Billing Address (if different)

3. **Order Items:**
   - Table: Product, Variant, Quantity, Price, Discount
   - Show which game earned each discount

4. **Payment Summary:**
   - Subtotal
   - Discount (with breakdown per item)
   - Total

5. **Tracking:**
   - Tracking Number (if available)
   - Tracking URL (link to carrier)
   - Shipped At timestamp

**API Endpoint:**
```typescript
// workers/routes/admin/orders.ts
app.get('/orders/:id', requireAuth, async (c) => {
  const db = c.env.DB;
  const orderId = c.req.param('id');

  const order = await db.prepare('SELECT * FROM orders WHERE id = ?').bind(orderId).first();

  if (!order) {
    return c.json({ error: 'Order not found' }, 404);
  }

  const items = await db.prepare('SELECT * FROM order_items WHERE order_id = ?').bind(orderId).all();

  return c.json({
    order,
    items: items.results,
  });
});
```

**Components:**
- `OrderHeader.tsx` (status, dates, test mode badge)
- `CustomerSection.tsx` (email, addresses)
- `OrderItemsTable.tsx` (products, discounts, games)
- `PaymentSummary.tsx` (totals breakdown)
- `TrackingInfo.tsx` (tracking link, status timeline)

**Estimate:** 2 days (16 hours)

---

## Phase 5: Game Analytics (Week 3, Days 3-5)

### 5.1 Analytics Dashboard
**File:** `app/routes/admin/analytics/analytics.games.tsx`

**Metrics:**
1. **Total Games Played** (all time, last 7 days, today)
2. **Conversion Rate** (% of plays that led to purchases)
3. **Average Discount Earned**
4. **Most Popular Game** (by play count)
5. **Revenue Impact:**
   - Total revenue with discounts
   - Total discount amount given
   - Net revenue after discounts

**Charts:**
1. **Games Played Over Time** (line chart, last 30 days)
2. **Game Type Distribution** (pie chart)
3. **Discount Tiers** (bar chart: 3%, 6%, 9%, 12%, 15%)
4. **Conversion Funnel:** Plays → Conversions → Revenue

**API Endpoint:**
```typescript
// workers/routes/admin/analytics.ts
app.get('/analytics/games', requireAuth, async (c) => {
  const db = c.env.DB;
  const { startDate, endDate } = c.req.query();

  // Total plays
  const plays = await db.prepare(
    'SELECT COUNT(*) as count FROM game_completions WHERE DATE(created_at) BETWEEN ? AND ?'
  ).bind(startDate || '2000-01-01', endDate || '2100-01-01').first();

  // Conversion rate
  const conversions = await db.prepare(
    'SELECT COUNT(*) as count FROM game_completions WHERE converted_to_purchase = 1 AND DATE(created_at) BETWEEN ? AND ?'
  ).bind(startDate || '2000-01-01', endDate || '2100-01-01').first();

  // Average discount
  const avgDiscount = await db.prepare(
    'SELECT AVG(discount_percent) as avg FROM game_completions WHERE DATE(created_at) BETWEEN ? AND ?'
  ).bind(startDate || '2000-01-01', endDate || '2100-01-01').first();

  // Game type distribution
  const byGameType = await db.prepare(
    'SELECT game_type, COUNT(*) as count FROM game_completions WHERE DATE(created_at) BETWEEN ? AND ? GROUP BY game_type ORDER BY count DESC'
  ).bind(startDate || '2000-01-01', endDate || '2100-01-01').all();

  // Revenue impact
  const revenue = await db.prepare(
    'SELECT SUM(CAST(total as REAL)) as net, SUM(CAST(discount_amount as REAL)) as discounts FROM orders WHERE DATE(created_at) BETWEEN ? AND ?'
  ).bind(startDate || '2000-01-01', endDate || '2100-01-01').first();

  return c.json({
    summary: {
      plays: plays.count,
      conversions: conversions.count,
      conversionRate: (conversions.count / plays.count * 100).toFixed(2),
      avgDiscount: avgDiscount.avg,
    },
    byGameType: byGameType.results,
    revenue: {
      net: revenue.net,
      discounts: revenue.discounts,
      gross: revenue.net + revenue.discounts,
    },
  });
});
```

**Components:**
- `MetricCard.tsx` (reusable stat display)
- `LineChart.tsx` (plays over time)
- `PieChart.tsx` (game distribution)
- `BarChart.tsx` (discount tiers)
- `DateRangePicker.tsx` (filter by date)

**Libraries:**
- **Recharts** (charts) or **Chart.js**
- **date-fns** (date formatting)

**Estimate:** 3 days (24 hours)

---

## Phase 6: Polish & Optimization (Week 4)

### 6.1 Mobile Optimization
**Tasks:**
- Test all screens on 320px - 428px viewports
- Convert tables to stacked cards on mobile
- Optimize sidebar for mobile drawer
- Touch-friendly buttons (44px min height)
- Test search/filter UX on mobile

**Estimate:** 1 day (8 hours)

---

### 6.2 Loading States & Error Handling
**Tasks:**
- Skeleton loaders for tables/cards
- Error boundaries for each route
- Retry logic for failed API calls
- Toast notifications for actions (sync, bulk ops)
- Empty states (no orders, no products)

**Estimate:** 1 day (8 hours)

---

### 6.3 Performance Optimization
**Tasks:**
- Implement React Query for data fetching/caching
- Debounce search inputs (300ms)
- Lazy load charts (intersection observer)
- Optimize D1 queries (add indexes if needed)
- Reduce bundle size (code splitting)

**Estimate:** 1 day (8 hours)

---

### 6.4 Documentation & Testing
**Tasks:**
- Admin user guide (how to sync, search, view orders)
- API endpoint documentation
- Manual testing checklist (all features)
- Browser compatibility (Chrome, Safari, Firefox)
- Responsive testing (desktop, tablet, mobile)

**Estimate:** 2 days (16 hours)

---

## Technical Specifications

### Component Library
**shadcn/ui components needed:**
- Table
- Card
- Badge
- Button
- Dialog/Modal
- Drawer (mobile sidebar)
- Input (search)
- Select (filters)
- Checkbox (bulk select)
- DatePicker
- Skeleton (loading states)

**Install:**
```bash
npx shadcn@latest add table card badge dialog drawer input select checkbox skeleton
```

---

### API Middleware
**File:** `workers/lib/middleware.ts`

**requireAuth middleware:**
Already exists in `workers/lib/auth.ts`, reuse for all `/api/admin/*` routes.

**Pattern:**
```typescript
import { requireAuth } from '../lib/auth';

app.get('/api/admin/products', requireAuth, async (c) => {
  // Admin-only logic
});
```

---

### Database Indexes
**Add for performance:**
```sql
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_game_completions_created_at ON game_completions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_game_completions_game_type ON game_completions(game_type);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
```

**Apply:**
```bash
wrangler d1 execute caterpillar-ranch-db --remote --file=./workers/db/indexes.sql
```

---

## Real-Time Updates Implementation

### Polling Strategy
**Hook:** `usePolling.ts`
```typescript
export function usePolling<T>(
  fetcher: () => Promise<T>,
  interval: number = 30000 // 30 seconds
) {
  const [data, setData] = useState<T | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    const fetch = async () => {
      const result = await fetcher();
      setData(result);
      setLastUpdated(new Date());
    };

    fetch(); // Initial fetch
    const timer = setInterval(fetch, interval);

    return () => clearInterval(timer);
  }, [fetcher, interval]);

  return { data, lastUpdated };
}
```

**Usage:**
```typescript
// In Dashboard component
const { data: stats, lastUpdated } = usePolling(
  () => fetch('/api/admin/analytics/dashboard-stats').then(r => r.json()),
  30000 // 30 seconds
);
```

---

## Timeline Summary

**Total Estimate:** 4 weeks (160 hours)

| Phase | Description | Days | Hours |
|-------|-------------|------|-------|
| 1 | Admin Layout & Navigation | 2 | 16 |
| 2 | Dashboard (Stats, Activity) | 3 | 24 |
| 3 | Product Management | 3 | 24 |
| 4 | Order Management | 4 | 32 |
| 5 | Game Analytics | 3 | 24 |
| 6 | Polish & Optimization | 5 | 40 |

**Milestones:**
- **Week 1 End:** Can login, see dashboard, view products
- **Week 2 End:** Can manage products, view orders
- **Week 3 End:** Can view game analytics
- **Week 4 End:** Production-ready, tested, documented

---

## Success Criteria

### Functional Requirements
- [x] Admin can login with existing credentials
- [ ] Dashboard shows real-time stats (auto-refresh)
- [ ] Can view/search/filter products
- [ ] Can sync products from Printful
- [ ] Can bulk hide/show products
- [ ] Can view/search/filter orders
- [ ] Can see full customer details
- [ ] Can view order tracking info
- [ ] Can view game analytics with charts
- [ ] Mobile-friendly (works on phone)

### Performance Requirements
- [ ] Dashboard loads in < 2 seconds
- [ ] Search results return in < 500ms
- [ ] Auto-refresh doesn't cause UI flicker
- [ ] Works offline (shows cached data)
- [ ] No memory leaks from polling

### UX Requirements
- [ ] Intuitive navigation
- [ ] Clear loading states
- [ ] Helpful error messages
- [ ] Accessible (keyboard nav, screen readers)
- [ ] Consistent with main site aesthetics

---

## Risk Mitigation

### Risk: Printful API rate limits during sync
**Mitigation:** Add rate limiting to sync endpoint (max 1 sync per minute), queue products for batch processing

### Risk: Large result sets slow down UI
**Mitigation:** Implement pagination (20 items per page), virtual scrolling for long lists

### Risk: Polling causes high Worker invocations
**Mitigation:** Use longer intervals (60s instead of 30s), only poll active tabs (Page Visibility API)

### Risk: Mobile viewport too small for tables
**Mitigation:** Convert to card view on mobile, prioritize essential data

---

## Next Steps (Immediate)

1. **Install dependencies:**
   ```bash
   npx shadcn@latest add table card badge dialog drawer input select checkbox skeleton
   npm install recharts date-fns
   ```

2. **Create admin route files:**
   ```bash
   mkdir -p app/routes/admin/products app/routes/admin/orders app/routes/admin/analytics
   touch app/routes/admin/layout.tsx
   touch app/routes/admin/dashboard.tsx
   ```

3. **Create admin API files:**
   ```bash
   mkdir -p workers/routes/admin
   touch workers/routes/admin/products.ts
   touch workers/routes/admin/orders.ts
   touch workers/routes/admin/analytics.ts
   ```

4. **Add database indexes:**
   ```bash
   cat > workers/db/indexes.sql << 'EOF'
   CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
   CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
   CREATE INDEX IF NOT EXISTS idx_game_completions_created_at ON game_completions(created_at DESC);
   CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
   EOF

   wrangler d1 execute caterpillar-ranch-db --remote --file=./workers/db/indexes.sql
   ```

5. **Start with Phase 1:** Build admin layout and navigation first.

---

## Questions for User (Before Starting)

1. **Design preference:** Match main site horror aesthetic (dark, purple, lime) or clean admin UI (light, minimal)?
2. **Chart library:** Recharts (React-specific) or Chart.js (more features)?
3. **Deployment cadence:** Push to production after each phase or all at once at end?
4. **Testing priority:** Focus on desktop first then mobile, or build mobile-first?

---

**Ready to proceed with implementation!** 🚀
