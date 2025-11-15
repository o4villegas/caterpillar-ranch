-- Migration: Add database indexes for admin dashboard performance
-- Created: 2025-11-15
-- Purpose: Optimize queries for dashboard stats, order lists, and game analytics

-- Note: Most indexes already exist in schema.sql. Adding only missing ones.

-- Game completions indexes (for analytics dashboard)
CREATE INDEX IF NOT EXISTS idx_game_completions_completed_at ON game_completions(completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_game_completions_game_type ON game_completions(game_type);

-- Products index (for updated_at sorting)
CREATE INDEX IF NOT EXISTS idx_products_updated_at ON products(updated_at DESC);
