-- Add password column to customers table
ALTER TABLE customers ADD COLUMN IF NOT EXISTS password TEXT;

-- Delete the default QP MEMBER account
DELETE FROM customers WHERE name = 'QP MEMBER' OR email = 'qp@member.com';

-- Update the email unique constraint to be case-insensitive
DROP INDEX IF EXISTS idx_customers_email;
CREATE UNIQUE INDEX idx_customers_email ON customers(LOWER(email));
