-- This script updates all existing accounts to have a known test password
-- Run this ONCE to fix any accounts created with the old hash function
-- The password will be set to "password123" for all existing accounts

-- First, let's update any accounts that might have the old hash format
-- The new hash for "password123" using our updated function is: pw_b6c5e8a1

UPDATE customers 
SET password = 'pw_b6c5e8a1'
WHERE password IS NULL OR password = '' OR password NOT LIKE 'pw_%';

-- Show what accounts exist
SELECT id, name, email, password FROM customers;
