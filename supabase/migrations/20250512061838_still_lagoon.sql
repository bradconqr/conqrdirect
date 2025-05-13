/*
  # Add external_link product type and related fields
  
  1. New Features
    - Add 'external_link' as a valid product type
    - Add fields for external link products:
      - target_url - The destination URL
      - link_type - Type of external link (affiliate, personal, subscription)
      - link_text - Custom call-to-action text
      - commission_rate - For tracking affiliate commissions
      
  2. Changes
    - Update products table check constraint to include the new type
    - Add new columns specific to external link products
    - Use DO block for safely adding constraints
*/

-- First update the type check constraint to allow 'external_link' type
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_type_check;
ALTER TABLE products ADD CONSTRAINT products_type_check 
  CHECK (type IN ('download', 'course', 'membership', 'webinar', '1on1call', 'external_link'));

-- Add new columns for external link products
ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS target_url TEXT,
  ADD COLUMN IF NOT EXISTS link_type TEXT,
  ADD COLUMN IF NOT EXISTS link_text TEXT,
  ADD COLUMN IF NOT EXISTS commission_rate NUMERIC;

-- Add a check constraint for link_type using DO block to avoid IF NOT EXISTS syntax error
DO $$
BEGIN
  -- Check if the constraint already exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'products_link_type_check' AND conrelid = 'products'::regclass
  ) THEN
    -- Add the constraint if it doesn't exist
    ALTER TABLE products ADD CONSTRAINT products_link_type_check
      CHECK (link_type IS NULL OR link_type IN ('affiliate', 'personal', 'subscription'));
  END IF;
END $$;