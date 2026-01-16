-- Add status and image_url columns to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'in_stock';
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add index for status
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
