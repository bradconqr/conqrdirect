/*
  # Add sizes array column to products table
  
  1. Changes
     - Add sizes column as text array to products table
     - Ensure the column exists for storing product size options
     - This migration is idempotent and can be run multiple times safely
*/

-- Add sizes array column to products table if it doesn't exist
ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS sizes TEXT[];

-- Migrate existing size data to the new sizes array
-- This will convert single size values to arrays
UPDATE products
SET sizes = ARRAY[size]
WHERE size IS NOT NULL AND (sizes IS NULL OR array_length(sizes, 1) IS NULL);