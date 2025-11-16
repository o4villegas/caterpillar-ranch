-- Migration: Add missing indexes to product_variants table
-- Date: 2025-11-16
-- Reason: Indexes defined in schema.sql but never created in production
-- Impact: Improves query performance for variant lookups and joins

-- Index for joining variants to products (most frequently used)
-- Used by: Homepage product loading, product detail pages
CREATE INDEX IF NOT EXISTS idx_variants_product_id ON product_variants(product_id);

-- Index for Printful sync operations (used during product sync)
-- Used by: Product sync endpoints to check for existing variants
CREATE INDEX IF NOT EXISTS idx_variants_printful_variant_id ON product_variants(printful_variant_id);

-- Index for filtering in-stock variants (used in catalog queries)
-- Used by: Catalog queries to show only available products
CREATE INDEX IF NOT EXISTS idx_variants_in_stock ON product_variants(in_stock);
