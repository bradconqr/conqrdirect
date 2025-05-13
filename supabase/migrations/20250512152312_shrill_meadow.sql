/*
  # Add sizes array to products table
  
  1. Changes
     - Add sizes TEXT[] column to products table
     - Migrate existing size data to the new sizes array
     - Ensure data consistency for physical products
  
  2. Security
     - No changes to existing security policies
*/

-- Add sizes array column to products table if it doesn't exist
ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS sizes TEXT[];

-- Migrate existing size data to the new sizes array
-- This will convert single size values to arrays
UPDATE products
SET sizes = ARRAY[size]
WHERE size IS NOT NULL AND (sizes IS NULL OR array_length(sizes, 1) IS NULL);