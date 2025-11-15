-- Migration: Add newsletter subscribers and contact messages tables
-- Created: 2025-11-15
-- Purpose: Support footer newsletter signup and contact form functionality

-- Newsletter subscribers table
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  subscribed_at TEXT NOT NULL DEFAULT (datetime('now')),
  source TEXT DEFAULT 'footer',
  active INTEGER NOT NULL DEFAULT 1,
  CONSTRAINT email_format CHECK (email LIKE '%@%.%')
);

CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_active ON newsletter_subscribers(active);

-- Contact messages table
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

CREATE INDEX IF NOT EXISTS idx_contact_status ON contact_messages(status);
CREATE INDEX IF NOT EXISTS idx_contact_created_at ON contact_messages(created_at DESC);
