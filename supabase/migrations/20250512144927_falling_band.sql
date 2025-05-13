/*
  # Add sizes array to products table
  
  1. Changes
     - Add a 'sizes' column to the products table as a text array
     - Migrate existing 'size' data to the new 'sizes' array format
     - Keep the existing 'size' column for backward compatibility
  
  2. Security
     - No changes to existing policies
*/

-- Add sizes array column to products table
ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS sizes TEXT[];

-- Migrate existing size data to the new sizes array
-- This will convert single size values to arrays
UPDATE products
SET sizes = ARRAY[size]
WHERE size IS NOT NULL AND sizes IS NULL;