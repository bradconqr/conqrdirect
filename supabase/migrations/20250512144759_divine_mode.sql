/*
  # Add sizes array to products table
  
  1. Changes
     - Add sizes column to products table as text array
     - Maintain backward compatibility with existing size column
     - Update products that have a single size to use the new array format
     
  2. Security
     - No changes to existing policies
*/

-- Add sizes column as text array
ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS sizes TEXT[];

-- Migrate data from size to sizes for existing products
DO $$
BEGIN
  -- Update products that have a size but no sizes
  UPDATE products
  SET sizes = ARRAY[size]
  WHERE size IS NOT NULL AND (sizes IS NULL OR array_length(sizes, 1) IS NULL);
END $$;