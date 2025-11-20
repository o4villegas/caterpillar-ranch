-- Product design images table
-- Stores admin-uploaded design images for products
-- Design images are used as hero/thumbnail images instead of Printful mockups

CREATE TABLE IF NOT EXISTS product_designs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id TEXT NOT NULL UNIQUE,
  design_url TEXT NOT NULL,  -- R2 filename (e.g., "protest-tee-1234567890.png")
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_product_designs_product_id ON product_designs(product_id);

-- Note: product_id references Printful product ID (string)
-- No FK constraint to products table since we fetch from Printful API dynamically
