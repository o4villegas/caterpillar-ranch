-- Migration: Add display_order column to products table
-- Date: 2025-11-15
-- Purpose: Enable product reordering for homepage display control

-- Add display_order column to products table
ALTER TABLE products ADD COLUMN display_order INTEGER;

-- Set initial display_order values based on existing product IDs
-- Products without display_order will be NULL (sorted last)
-- Admin can manually set order via reorder API endpoint
UPDATE products
SET display_order = CAST(SUBSTR(id, 4) AS INTEGER)
WHERE display_order IS NULL
  AND id LIKE 'cr-%';

-- For any products with non-numeric IDs, set display_order = ROWID
UPDATE products
SET display_order = ROWID
WHERE display_order IS NULL;

-- Create index for efficient sorting on homepage
CREATE INDEX IF NOT EXISTS idx_products_display_order ON products(display_order ASC);
