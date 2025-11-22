-- Caterpillar Ranch Database Schema
-- D1 SQLite Database for Printful Admin Portal

-- ============================================================================
-- Table: users
-- Purpose: Admin user accounts with bcrypt password hashing
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_login_at TEXT,
  CONSTRAINT email_format CHECK (email LIKE '%@%.%')
);

CREATE INDEX idx_users_email ON users(email);

-- ============================================================================
-- Table: products
-- Purpose: Product catalog synced from Printful with admin customization
-- ============================================================================
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY, -- e.g., "cr-punk"
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,

  -- Pricing (retail price set by admin, base price from Printful)
  base_price REAL NOT NULL, -- Printful's cost
  retail_price REAL, -- Admin's custom markup (if NULL, use base_price)

  -- Printful Integration
  printful_product_id INTEGER NOT NULL,
  printful_synced_at TEXT,

  -- Product Details
  image_url TEXT NOT NULL,
  tags TEXT, -- JSON array: ["horror", "punk"]

  -- Admin Control
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'hidden')),
  published_at TEXT,
  display_order INTEGER, -- Controls homepage display order (NULL = sorted last)

  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_printful_product_id ON products(printful_product_id);
CREATE INDEX idx_products_display_order ON products(display_order ASC);

-- ============================================================================
-- Table: product_variants
-- Purpose: Size/color variants for each product (synced from Printful)
-- ============================================================================
CREATE TABLE IF NOT EXISTS product_variants (
  id TEXT PRIMARY KEY, -- e.g., "cr-punk-m-dark-gray"
  product_id TEXT NOT NULL,

  -- Variant Details
  size TEXT NOT NULL CHECK (size IN ('S', 'M', 'L', 'XL', 'XXL')),
  color TEXT NOT NULL,

  -- Printful Integration
  -- NOTE: printful_variant_id is NOT UNIQUE because multiple products can use
  -- the same Printful base garment (e.g., Gildan 64000 Black/S) with different designs
  printful_variant_id INTEGER NOT NULL,

  -- Inventory
  in_stock INTEGER NOT NULL DEFAULT 1, -- Boolean: 1=available, 0=out of stock

  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),

  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE INDEX idx_variants_product_id ON product_variants(product_id);
CREATE INDEX idx_variants_printful_variant_id ON product_variants(printful_variant_id);
CREATE INDEX idx_variants_in_stock ON product_variants(in_stock);

-- ============================================================================
-- Table: orders
-- Purpose: Customer orders sent to Printful for fulfillment
-- ============================================================================
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY, -- e.g., "RANCH-1736901234567"

  -- Customer Info
  customer_email TEXT NOT NULL,
  customer_name TEXT NOT NULL,

  -- Shipping Address
  shipping_address_line1 TEXT NOT NULL,
  shipping_address_line2 TEXT,
  shipping_city TEXT NOT NULL,
  shipping_state TEXT NOT NULL,
  shipping_zip TEXT NOT NULL,
  shipping_country TEXT NOT NULL DEFAULT 'US',

  -- Order Totals
  subtotal REAL NOT NULL,
  discount_amount REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL,

  -- Printful Integration
  printful_order_id INTEGER, -- NULL until confirmed with Printful
  printful_status TEXT, -- draft, pending, fulfilled, cancelled

  -- Tracking
  tracking_number TEXT,
  tracking_url TEXT,

  -- Stripe Payment Integration
  stripe_checkout_session_id TEXT, -- Stripe Checkout session ID
  stripe_payment_intent_id TEXT, -- Stripe Payment Intent ID

  -- Timestamps
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  confirmed_at TEXT, -- When order sent to Printful
  shipped_at TEXT,

  CONSTRAINT valid_totals CHECK (total >= 0 AND subtotal >= 0)
);

CREATE INDEX idx_orders_customer_email ON orders(customer_email);
CREATE INDEX idx_orders_printful_order_id ON orders(printful_order_id);
CREATE INDEX idx_orders_printful_status ON orders(printful_status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

-- ============================================================================
-- Table: order_items
-- Purpose: Line items for each order
-- ============================================================================
CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id TEXT NOT NULL,

  -- Product Details (snapshot at time of order)
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  variant_id TEXT NOT NULL,
  variant_size TEXT NOT NULL,
  variant_color TEXT NOT NULL,

  -- Pricing (snapshot at time of order)
  unit_price REAL NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  discount_percent REAL NOT NULL DEFAULT 0 CHECK (discount_percent >= 0 AND discount_percent <= 100),
  subtotal REAL NOT NULL,

  -- Printful Integration
  printful_variant_id INTEGER NOT NULL,

  created_at TEXT NOT NULL DEFAULT (datetime('now')),

  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT valid_pricing CHECK (subtotal >= 0 AND unit_price >= 0)
);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

-- ============================================================================
-- Table: game_completions
-- Purpose: Track game plays and discount earnings for analytics
-- ============================================================================
CREATE TABLE IF NOT EXISTS game_completions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  -- Session Tracking
  session_token TEXT NOT NULL, -- From localStorage

  -- Game Details
  game_type TEXT NOT NULL CHECK (
    game_type IN (
      'culling',
      'harvest',
      'telegram',
      'snake',
      'garden',
      'metamorphosis'
    )
  ),
  product_id TEXT NOT NULL,

  -- Score & Discount
  score INTEGER NOT NULL CHECK (score >= 0),
  discount_earned REAL NOT NULL CHECK (discount_earned >= 0 AND discount_earned <= 40),

  -- Timestamp
  completed_at TEXT NOT NULL DEFAULT (datetime('now')),

  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE INDEX idx_game_completions_session_token ON game_completions(session_token);
CREATE INDEX idx_game_completions_product_id ON game_completions(product_id);
CREATE INDEX idx_game_completions_game_type ON game_completions(game_type);
CREATE INDEX idx_game_completions_completed_at ON game_completions(completed_at DESC);

-- ============================================================================
-- Triggers: Auto-update updated_at timestamps
-- ============================================================================
CREATE TRIGGER IF NOT EXISTS update_products_updated_at
  AFTER UPDATE ON products
  FOR EACH ROW
BEGIN
  UPDATE products SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_product_variants_updated_at
  AFTER UPDATE ON product_variants
  FOR EACH ROW
BEGIN
  UPDATE product_variants SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- ============================================================================
-- Table: newsletter_subscribers
-- Purpose: Email collection for newsletter/marketing
-- ============================================================================
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  subscribed_at TEXT NOT NULL DEFAULT (datetime('now')),
  source TEXT DEFAULT 'footer', -- Track signup location (footer, popup, etc)
  active INTEGER NOT NULL DEFAULT 1, -- 1=active, 0=unsubscribed

  CONSTRAINT email_format CHECK (email LIKE '%@%.%')
);

CREATE INDEX idx_newsletter_email ON newsletter_subscribers(email);
CREATE INDEX idx_newsletter_active ON newsletter_subscribers(active);

-- ============================================================================
-- Table: contact_messages
-- Purpose: Store contact form submissions from customers
-- ============================================================================
CREATE TABLE IF NOT EXISTS contact_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL CHECK (subject IN ('Order Issue', 'Product Question', 'Other')),
  message TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied')),

  CONSTRAINT email_format CHECK (email LIKE '%@%.%')
);

CREATE INDEX idx_contact_status ON contact_messages(status);
CREATE INDEX idx_contact_created_at ON contact_messages(created_at DESC);

-- ============================================================================
-- Table: sync_logs
-- Purpose: Audit trail for daily Printful product sync operations
-- ============================================================================
CREATE TABLE IF NOT EXISTS sync_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  -- Sync Metadata
  sync_timestamp TEXT NOT NULL DEFAULT (datetime('now')),
  action TEXT NOT NULL CHECK (action IN ('added', 'updated', 'hidden', 'error')),

  -- Product Reference
  product_id TEXT, -- Our internal product ID (e.g., "cr-403422954")
  printful_product_id INTEGER, -- Printful's product ID
  product_name TEXT,

  -- Action Details
  reason TEXT NOT NULL, -- Human-readable reason (e.g., "Product no longer in Printful store")
  details TEXT, -- JSON string with additional context (e.g., variant counts, error messages)

  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

CREATE INDEX idx_sync_logs_timestamp ON sync_logs(sync_timestamp DESC);
CREATE INDEX idx_sync_logs_action ON sync_logs(action);
CREATE INDEX idx_sync_logs_product_id ON sync_logs(product_id);
