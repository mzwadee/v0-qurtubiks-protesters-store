-- Reset all passwords to a known value so users can sign in again
-- After this, all users will have the password "password123"

-- First, let's see what's in the customers table
SELECT id, name, email, password FROM customers;

-- Update all passwords to use the correct hash for "password123"
-- Hash calculation: "qx_password123_store" -> hash -> "pw_" + hex
-- This matches the hashPassword function in the code
UPDATE customers 
SET password = 'pw_7b5ab5c3'
WHERE password IS NOT NULL OR password IS NULL;

-- Verify the update
SELECT id, name, email, password FROM customers;
