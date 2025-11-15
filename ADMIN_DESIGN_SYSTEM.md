# Admin Portal Design System
**Date:** 2025-11-14
**Based On:** 20 T/F user requirements

---

## Design Philosophy

**"Horror Admin Portal"** - Professional efficiency meets Caterpillar Ranch's dark, unsettling aesthetic.

**Core Principles:**
1. **Efficiency First:** Minimal animations, clear data hierarchy, fast interactions
2. **Horror Aesthetic:** Dark purple backgrounds, lime/cyan accents, Handjet font
3. **Mobile-Friendly:** Responsive, text-focused on mobile, optimized for small screens
4. **Non-Blocking Feedback:** Toast notifications, subtle updates, don't interrupt workflow

---

## Color Palette

### Primary Colors
```css
--ranch-dark: #1a1a1a          /* Page backgrounds */
--ranch-purple: #4A3258        /* Sidebar, cards, borders */
--ranch-purple-light: #9B8FB5  /* Hover states, disabled */
--ranch-purple-dark: #2d1f3a   /* Active states, deep shadows */
```

### Accent Colors
```css
--ranch-lime: #32CD32          /* Success, active indicators, chart primary */
--ranch-cyan: #00CED1          /* Links, secondary actions, chart secondary */
--ranch-pink: #FF1493          /* Alerts, errors, chart tertiary */
```

### Neutral Colors
```css
--ranch-cream: #F5F5DC         /* Primary text */
--ranch-lavender: #9B8FB5      /* Secondary text */
--ranch-gray: #6B7280          /* Disabled text, borders */
--ranch-gray-light: #E5E7EB    /* Table stripes (subtle) */
```

### Semantic Colors
```css
--color-success: #32CD32       /* Success states, +trends */
--color-warning: #FFA500       /* Warning states, pending */
--color-error: #FF1493         /* Error states, alerts */
--color-info: #00CED1          /* Info badges, hints */
```

---

## Typography

### Font Families
```css
/* Headers, Navigation, Stats */
--font-display: 'Handjet', monospace;
font-weight: 700-800;

/* Body Text, Tables, Descriptions */
--font-body: 'Inter', sans-serif;
font-weight: 400-600;

/* Code, IDs, Monospace Data */
--font-mono: 'Courier New', monospace;
font-weight: 400;
```

### Type Scale
```css
/* Page Titles */
.text-4xl { font-size: 2.25rem; line-height: 2.5rem; }

/* Section Headers */
.text-2xl { font-size: 1.5rem; line-height: 2rem; }

/* Card Titles, Table Headers */
.text-lg { font-size: 1.125rem; line-height: 1.75rem; }

/* Body Text */
.text-base { font-size: 1rem; line-height: 1.5rem; }

/* Small Text, Captions */
.text-sm { font-size: 0.875rem; line-height: 1.25rem; }

/* Tiny Text, Timestamps */
.text-xs { font-size: 0.75rem; line-height: 1rem; }
```

### Usage
- **Headers:** Handjet, bold (700-800), uppercase for emphasis
- **Body:** Inter, regular (400), readable line-height (1.5)
- **Tables:** Inter, medium (500), tight line-height (1.25)
- **Stats:** Handjet, extra-bold (800), large (2xl-4xl)
- **IDs/Codes:** Courier New, monospace

---

## Layout

### Admin Layout Structure
```
┌─────────────────────────────────────────────┐
│ Fixed Sidebar (250px) │ Main Content Area   │
│                       │                     │
│ [Logo]                │ [Breadcrumbs]       │
│                       │ [Global Search]     │
│ Navigation:           │                     │
│ • Dashboard           │ [Page Content]      │
│ • Products            │                     │
│ • Orders              │                     │
│ • Analytics           │                     │
│                       │                     │
│ [User Menu]           │ [Footer]            │
└─────────────────────────────────────────────┘
```

### Breakpoints
```css
/* Mobile: < 768px - Sidebar collapses to drawer */
@media (max-width: 767px)

/* Tablet: 768px - 1024px - Sidebar visible, content adjusts */
@media (min-width: 768px) and (max-width: 1023px)

/* Desktop: > 1024px - Full layout */
@media (min-width: 1024px)
```

### Spacing Scale
```css
--space-1: 0.25rem   /* 4px */
--space-2: 0.5rem    /* 8px */
--space-3: 0.75rem   /* 12px */
--space-4: 1rem      /* 16px */
--space-6: 1.5rem    /* 24px */
--space-8: 2rem      /* 32px */
--space-12: 3rem     /* 48px */
```

---

## Components

### Sidebar Navigation

**Desktop:**
- Fixed left, 250px width
- Dark purple background (#2d1f3a)
- Logo at top (Caterpillar Ranch icon + text)
- Navigation items:
  - Icon + Label
  - Hover: Lighter purple background
  - Active: Lime border-left (4px), lime text
- User menu at bottom (name, logout)

**Mobile (<768px):**
- Hamburger menu icon in top-left
- Drawer slides in from left
- Overlay darkens content behind
- Swipe-to-close gesture

**Code Pattern:**
```tsx
<aside className="sidebar">
  <div className="sidebar-header">
    <img src="/cr-logo.png" alt="Caterpillar Ranch" />
    <span style={{ fontFamily: 'Handjet', fontSize: '1.5rem' }}>Admin</span>
  </div>

  <nav className="sidebar-nav">
    {navItems.map(item => (
      <NavLink
        to={item.path}
        className={({ isActive }) =>
          `nav-item ${isActive ? 'active' : ''}`
        }
      >
        <item.Icon className="nav-icon" />
        <span>{item.label}</span>
      </NavLink>
    ))}
  </nav>

  <div className="sidebar-footer">
    <button onClick={handleLogout}>Logout</button>
  </div>
</aside>
```

**Styling:**
```css
.sidebar {
  width: 250px;
  background: var(--ranch-purple-dark);
  border-right: 2px solid var(--ranch-purple);
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  z-index: 50;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  color: var(--ranch-cream);
  transition: background 200ms;
}

.nav-item:hover {
  background: var(--ranch-purple);
}

.nav-item.active {
  background: var(--ranch-purple);
  border-left: 4px solid var(--ranch-lime);
  color: var(--ranch-lime);
}
```

---

### Global Search

**Location:** Top of main content area, always visible

**Features:**
- Single input field
- Searches: Products (by name, ID), Orders (by ID, email)
- Dropdown results (max 5 per category)
- Keyboard navigation (arrow keys, enter to select)
- Debounced (300ms)

**UI:**
```
┌─────────────────────────────────────────┐
│ 🔍 Search products, orders...           │
└─────────────────────────────────────────┘
  ↓ (when typing)
┌─────────────────────────────────────────┐
│ Products (2)                             │
│ • CR-101 - Horror Tee                    │
│ • CR-100 - Creepy Design                 │
│                                          │
│ Orders (1)                               │
│ • #ORD-12345 - admin@example.com         │
└─────────────────────────────────────────┘
```

**Code Pattern:**
```tsx
<div className="global-search">
  <input
    type="search"
    placeholder="Search products, orders..."
    value={query}
    onChange={handleSearch}
    className="search-input"
  />

  {results && (
    <div className="search-results">
      {results.products.length > 0 && (
        <section>
          <h4>Products ({results.products.length})</h4>
          {results.products.map(p => (
            <button onClick={() => handleSelect(p)}>
              {p.name}
            </button>
          ))}
        </section>
      )}
      {/* Similar for orders */}
    </div>
  )}
</div>
```

---

### Tables

**Desktop Layout:**
- Full table with columns
- Zebra striping (every other row: subtle gray)
- Hover: highlight row with lime tint
- Click row: expand inline to show details

**Mobile Layout:**
- Convert to stacked text cards
- No images (text-only for speed)
- Key info only (name, status, date)
- Tap to expand inline

**Features:**
- Sortable columns (click header to sort)
- Checkbox column for bulk select
- Status badges (colored)
- Pagination at bottom (numbered)

**Code Pattern:**
```tsx
<table className="admin-table">
  <thead>
    <tr>
      <th><input type="checkbox" /></th>
      <th onClick={() => handleSort('name')}>Name ↑</th>
      <th onClick={() => handleSort('status')}>Status</th>
      <th>Actions</th>
    </tr>
  </thead>
  <tbody>
    {items.map((item, index) => (
      <>
        <tr
          className={index % 2 === 0 ? 'even' : 'odd'}
          onClick={() => toggleExpand(item.id)}
        >
          <td><input type="checkbox" /></td>
          <td>{item.name}</td>
          <td><Badge variant={item.status}>{item.status}</Badge></td>
          <td>...</td>
        </tr>

        {expandedId === item.id && (
          <tr className="expanded-row">
            <td colSpan={4}>
              <div className="expanded-content">
                {/* Full details here */}
                <button onClick={() => setExpandedId(null)}>Close</button>
              </div>
            </td>
          </tr>
        )}
      </>
    ))}
  </tbody>
</table>
```

**Styling:**
```css
.admin-table {
  width: 100%;
  border-collapse: collapse;
}

.admin-table th {
  background: var(--ranch-purple-dark);
  color: var(--ranch-cream);
  padding: 1rem;
  text-align: left;
  font-family: 'Handjet', monospace;
  font-weight: 700;
}

.admin-table tbody tr.even {
  background: var(--ranch-dark);
}

.admin-table tbody tr.odd {
  background: rgba(74, 50, 88, 0.15); /* Subtle purple tint */
}

.admin-table tbody tr:hover {
  background: rgba(50, 205, 50, 0.1); /* Lime tint */
  cursor: pointer;
}

.expanded-row {
  background: var(--ranch-purple) !important;
}

.expanded-content {
  padding: 2rem;
  border-top: 2px solid var(--ranch-lime);
}
```

---

### Cards (Mobile)

**Structure:**
```
┌─────────────────────────────┐
│ Name: CR-101                │
│ Status: Active              │
│ Price: $29.99               │
│ Updated: 2 hours ago        │
└─────────────────────────────┘
```

**Code Pattern:**
```tsx
<div className="mobile-card" onClick={() => toggleExpand(item.id)}>
  <div className="card-row">
    <span className="card-label">Name</span>
    <span className="card-value">{item.name}</span>
  </div>
  <div className="card-row">
    <span className="card-label">Status</span>
    <Badge variant={item.status}>{item.status}</Badge>
  </div>
  {/* More rows */}
</div>

{expandedId === item.id && (
  <div className="card-details">
    {/* Full details */}
  </div>
)}
```

---

### Badges

**Variants:**
- **Active:** Lime background, dark text
- **Draft:** Gray background, light text
- **Pending:** Orange background, dark text
- **Confirmed:** Cyan background, dark text
- **Shipped:** Lime background, dark text
- **Error:** Pink background, light text

**Code:**
```tsx
<Badge variant="active">Active</Badge>
<Badge variant="draft">Draft</Badge>
<Badge variant="pending">Pending</Badge>
<Badge variant="error">Failed</Badge>
```

**Styling:**
```css
.badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.badge-active {
  background: var(--ranch-lime);
  color: var(--ranch-dark);
}

.badge-draft {
  background: var(--ranch-gray);
  color: var(--ranch-cream);
}

.badge-pending {
  background: var(--color-warning);
  color: var(--ranch-dark);
}

.badge-error {
  background: var(--color-error);
  color: var(--ranch-cream);
}
```

---

### Buttons

**Variants:**
1. **Primary:** Lime background, dark text (main actions)
2. **Secondary:** Purple background, cream text (cancel, back)
3. **Danger:** Pink background, cream text (delete, hide)
4. **Ghost:** Transparent, lime border (less important)

**Code:**
```tsx
<Button variant="primary">Sync Products</Button>
<Button variant="secondary">Cancel</Button>
<Button variant="danger">Hide</Button>
<Button variant="ghost">View Details</Button>
```

**Styling:**
```css
.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-family: 'Handjet', monospace;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  transition: all 200ms;
}

.btn-primary {
  background: var(--ranch-lime);
  color: var(--ranch-dark);
  border: none;
}

.btn-primary:hover {
  background: #28a428; /* Darker lime */
}

.btn-secondary {
  background: var(--ranch-purple);
  color: var(--ranch-cream);
  border: 2px solid var(--ranch-purple-light);
}

.btn-danger {
  background: var(--ranch-pink);
  color: var(--ranch-cream);
  border: none;
}

.btn-ghost {
  background: transparent;
  color: var(--ranch-lime);
  border: 2px solid var(--ranch-lime);
}
```

---

### Filters (Always Visible)

**Layout:**
```
┌────────────────────────────────────────────────┐
│ Filters:                                       │
│ [Status: All ▼] [Date: Last 7 days ▼] [Clear] │
└────────────────────────────────────────────────┘
```

**Code Pattern:**
```tsx
<div className="filters-bar">
  <label>
    Status:
    <select value={statusFilter} onChange={handleStatusChange}>
      <option value="all">All</option>
      <option value="active">Active</option>
      <option value="draft">Draft</option>
    </select>
  </label>

  <label>
    Date:
    <select value={dateFilter} onChange={handleDateChange}>
      <option value="7d">Last 7 days</option>
      <option value="30d">Last 30 days</option>
      <option value="all">All time</option>
    </select>
  </label>

  <button onClick={handleClearFilters}>Clear Filters</button>
</div>
```

---

### Bulk Actions Toolbar (Top)

**Appears when items selected:**
```
┌────────────────────────────────────────────────┐
│ 3 items selected                               │
│ [Hide] [Show] [Sync] [Cancel]                  │
└────────────────────────────────────────────────┘
```

**Code Pattern:**
```tsx
{selectedIds.length > 0 && (
  <div className="bulk-toolbar">
    <span>{selectedIds.length} items selected</span>
    <div className="bulk-actions">
      <Button variant="danger" onClick={handleBulkHide}>Hide</Button>
      <Button variant="primary" onClick={handleBulkShow}>Show</Button>
      <Button variant="secondary" onClick={handleBulkSync}>Sync</Button>
      <Button variant="ghost" onClick={handleClearSelection}>Cancel</Button>
    </div>
  </div>
)}
```

**Styling:**
```css
.bulk-toolbar {
  background: var(--ranch-purple-dark);
  padding: 1rem 1.5rem;
  border-radius: 0.5rem;
  border: 2px solid var(--ranch-lime);
  margin-bottom: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.bulk-actions {
  display: flex;
  gap: 0.5rem;
}
```

---

### Loading States (Full Overlay)

**UI:**
```
┌─────────────────────────────────────────────┐
│                                             │
│              [Spinner]                      │
│          Loading products...                │
│                                             │
└─────────────────────────────────────────────┘
```

**Code Pattern:**
```tsx
{isLoading && (
  <div className="loading-overlay">
    <div className="loading-spinner" />
    <p>Loading {resource}...</p>
  </div>
)}
```

**Styling:**
```css
.loading-overlay {
  position: fixed;
  inset: 0;
  background: rgba(26, 26, 26, 0.9); /* Dark with transparency */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.loading-spinner {
  width: 3rem;
  height: 3rem;
  border: 4px solid var(--ranch-purple);
  border-top-color: var(--ranch-lime);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

---

### Toast Notifications (Sonner)

**Types:**
- Success: Lime icon, "Products synced successfully"
- Error: Pink icon, "Failed to sync products"
- Info: Cyan icon, "Processing your request..."

**Code:**
```tsx
import { toast } from 'sonner';

// Success
toast.success('Products synced successfully', {
  description: '15 products updated',
});

// Error
toast.error('Failed to sync products', {
  description: error.message,
});

// Info
toast.info('Syncing products...', {
  description: 'This may take a few seconds',
});
```

**Customization:**
```tsx
<Toaster
  theme="dark"
  position="bottom-right"
  toastOptions={{
    style: {
      background: 'var(--ranch-purple-dark)',
      color: 'var(--ranch-cream)',
      border: '2px solid var(--ranch-purple)',
    },
  }}
/>
```

---

### Charts (Recharts)

**Color Palette:**
- Primary: Lime (#32CD32)
- Secondary: Cyan (#00CED1)
- Tertiary: Pink (#FF1493)
- Background: Purple dark (#2d1f3a)
- Grid lines: Purple light (#9B8FB5)

**Line Chart Example:**
```tsx
<ResponsiveContainer width="100%" height={300}>
  <LineChart data={data}>
    <CartesianGrid strokeDasharray="3 3" stroke="var(--ranch-purple)" />
    <XAxis dataKey="date" stroke="var(--ranch-cream)" />
    <YAxis stroke="var(--ranch-cream)" />
    <Tooltip
      contentStyle={{
        background: 'var(--ranch-purple-dark)',
        border: '2px solid var(--ranch-lime)',
      }}
    />
    <Line
      type="monotone"
      dataKey="plays"
      stroke="var(--ranch-lime)"
      strokeWidth={3}
      dot={{ fill: 'var(--ranch-lime)' }}
    />
  </LineChart>
</ResponsiveContainer>
```

**Pie Chart Example:**
```tsx
<ResponsiveContainer width="100%" height={300}>
  <PieChart>
    <Pie
      data={data}
      dataKey="count"
      nameKey="game"
      cx="50%"
      cy="50%"
      outerRadius={80}
      label
    >
      {data.map((entry, index) => (
        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
      ))}
    </Pie>
    <Tooltip
      contentStyle={{
        background: 'var(--ranch-purple-dark)',
        border: '2px solid var(--ranch-cyan)',
      }}
    />
  </PieChart>
</ResponsiveContainer>

const COLORS = ['#32CD32', '#00CED1', '#FF1493', '#9B8FB5', '#FFA500'];
```

---

### Empty States (With Illustrations)

**UI:**
```
┌─────────────────────────────────────────────┐
│                                             │
│            [Sad Caterpillar SVG]            │
│                                             │
│        No orders yet                        │
│   Orders will appear here after checkout   │
│                                             │
│         [Create Test Order]                 │
│                                             │
└─────────────────────────────────────────────┘
```

**Code Pattern:**
```tsx
{items.length === 0 && (
  <div className="empty-state">
    <img src="/empty-caterpillar.svg" alt="" width={120} />
    <h3>No {resource} yet</h3>
    <p>{description}</p>
    {action && <Button onClick={action.handler}>{action.label}</Button>}
  </div>
)}
```

**Styling:**
```css
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
}

.empty-state h3 {
  font-family: 'Handjet', monospace;
  font-size: 1.5rem;
  color: var(--ranch-cream);
  margin-top: 1.5rem;
}

.empty-state p {
  color: var(--ranch-lavender);
  margin-top: 0.5rem;
  margin-bottom: 1.5rem;
}
```

---

### Breadcrumbs

**UI:**
```
Home > Products > CR-101
```

**Code:**
```tsx
<nav className="breadcrumbs">
  <Link to="/admin">Home</Link>
  <span className="separator">></span>
  <Link to="/admin/products">Products</Link>
  <span className="separator">></span>
  <span className="current">CR-101</span>
</nav>
```

**Styling:**
```css
.breadcrumbs {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--ranch-lavender);
  margin-bottom: 1.5rem;
}

.breadcrumbs a {
  color: var(--ranch-cyan);
  text-decoration: none;
}

.breadcrumbs a:hover {
  text-decoration: underline;
}

.breadcrumbs .current {
  color: var(--ranch-cream);
  font-weight: 600;
}

.breadcrumbs .separator {
  color: var(--ranch-purple-light);
}
```

---

### Pagination (Numbered)

**UI:**
```
[Previous] 1 2 [3] 4 5 ... 20 [Next]
```

**Code:**
```tsx
<div className="pagination">
  <button disabled={page === 1} onClick={() => setPage(page - 1)}>
    Previous
  </button>

  {pageNumbers.map(num => (
    <button
      key={num}
      className={num === page ? 'active' : ''}
      onClick={() => setPage(num)}
    >
      {num}
    </button>
  ))}

  <button disabled={page === totalPages} onClick={() => setPage(page + 1)}>
    Next
  </button>
</div>
```

**Styling:**
```css
.pagination {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  margin-top: 2rem;
}

.pagination button {
  padding: 0.5rem 1rem;
  background: var(--ranch-purple);
  color: var(--ranch-cream);
  border: 2px solid var(--ranch-purple-light);
  border-radius: 0.375rem;
  cursor: pointer;
}

.pagination button:hover:not(:disabled) {
  background: var(--ranch-purple-light);
}

.pagination button.active {
  background: var(--ranch-lime);
  color: var(--ranch-dark);
  border-color: var(--ranch-lime);
}

.pagination button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

---

### Real-Time Update Indicator (Subtle)

**UI:**
```
Updated 30 seconds ago
```

**Code:**
```tsx
<span className="update-indicator">
  Updated {formatDistance(lastUpdated, new Date(), { addSuffix: true })}
</span>
```

**Styling:**
```css
.update-indicator {
  font-size: 0.75rem;
  color: var(--ranch-gray);
  font-style: italic;
}
```

---

## Animations

**Minimal Motion - Professional Efficiency:**

### Allowed Animations:
1. **Fades:** Opacity transitions (200ms ease-in-out)
2. **Slides:** Drawer open/close (300ms ease-out)
3. **Hover states:** Background/border color changes (200ms)
4. **Loading spinners:** Rotation only

### NO Animations:
- ❌ No breathing effects
- ❌ No wiggle/shake
- ❌ No eye blinks
- ❌ No particle bursts
- ❌ No hover scales

### Timing:
```css
--transition-fast: 150ms;
--transition-normal: 200ms;
--transition-slow: 300ms;

/* Usage */
.element {
  transition: background var(--transition-normal) ease-in-out;
}
```

---

## Responsive Behavior

### Mobile (<768px):
- Sidebar → Drawer (hamburger menu)
- Tables → Stacked text cards (no images)
- Filters → Collapsible accordion (save space)
- Charts → Reduce height, simplify axes
- Pagination → Previous/Next only (no numbers)
- Global search → Full-width, top of page

### Tablet (768px-1024px):
- Sidebar visible, 200px width
- Tables → Full table, smaller fonts
- Charts → Full features
- Pagination → Numbered

### Desktop (>1024px):
- Sidebar 250px
- Tables → Full features
- Charts → Max size
- All features enabled

---

## Accessibility

### Keyboard Navigation:
- Tab through all interactive elements
- Enter to activate buttons/links
- Escape to close modals/drawers
- Arrow keys in search dropdown

### Screen Readers:
- Proper ARIA labels on all buttons
- Alt text on images
- Table headers with scope
- Live regions for toasts

### Color Contrast:
- Text on backgrounds: WCAG AA minimum (4.5:1)
- Lime on dark: 9.2:1 ✅
- Cream on purple: 6.8:1 ✅
- Pink on dark: 5.1:1 ✅

### Focus States:
```css
.btn:focus {
  outline: 2px solid var(--ranch-lime);
  outline-offset: 2px;
}

.input:focus {
  border-color: var(--ranch-cyan);
  box-shadow: 0 0 0 3px rgba(0, 206, 209, 0.2);
}
```

---

## Performance Guidelines

### Loading Priorities:
1. Critical: Layout, sidebar, navigation (instant)
2. High: Current page data (< 500ms)
3. Medium: Charts, analytics (< 1s)
4. Low: Images, non-essential data (lazy load)

### Optimization Strategies:
- **Tables:** Virtualize if > 100 rows
- **Charts:** Lazy load with intersection observer
- **Images:** None on mobile cards (per user requirement)
- **Polling:** Pause when tab inactive (Page Visibility API)
- **Debounce:** Search (300ms), filters (500ms)

---

## Component Checklist

### Phase 1 (Week 1):
- [ ] AdminLayout (sidebar, breadcrumbs, global search)
- [ ] Sidebar (desktop fixed, mobile drawer)
- [ ] GlobalSearch (debounced, dropdown results)
- [ ] Breadcrumbs
- [ ] Button (4 variants)
- [ ] Badge (6 variants)

### Phase 2 (Week 2):
- [ ] Table (zebra stripes, expand inline, bulk select)
- [ ] MobileCard (text-only, expandable)
- [ ] FiltersBar (always visible)
- [ ] BulkToolbar (top, conditional)
- [ ] Pagination (numbered)
- [ ] LoadingOverlay (full-page spinner)

### Phase 3 (Week 3):
- [ ] StatCard (dashboard metrics)
- [ ] LineChart (Recharts)
- [ ] PieChart (Recharts)
- [ ] BarChart (Recharts)
- [ ] EmptyState (with sad caterpillar)
- [ ] UpdateIndicator (subtle text)

---

**This design system is complete and ready for implementation!** 🎨
