-- Add missing columns to products table if they don't exist
ALTER TABLE products ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 100;
ALTER TABLE products ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Merchandise';

-- Clear all existing passwords so users can create fresh accounts with correct hash
-- This fixes the password mismatch issue caused by toLowerCase()
UPDATE customers SET password = NULL;
