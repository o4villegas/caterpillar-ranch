-- Migration: Add Stripe payment columns to orders table
-- Run with: wrangler d1 execute Rancch-DB --file=workers/db/migrations/001_add_stripe_columns.sql --remote

-- Add Stripe checkout session ID column
ALTER TABLE orders ADD COLUMN stripe_checkout_session_id TEXT;

-- Add Stripe payment intent ID column
ALTER TABLE orders ADD COLUMN stripe_payment_intent_id TEXT;

-- Create index for Stripe payment intent (useful for webhook lookups)
CREATE INDEX IF NOT EXISTS idx_orders_stripe_payment_intent_id ON orders(stripe_payment_intent_id);
