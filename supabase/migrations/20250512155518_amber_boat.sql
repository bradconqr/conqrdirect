/*
  # Add physical product type and update sizes handling
  
  1. Changes
     - Update products table type CHECK constraint to include 'physical'
     - Ensure sizes column exists as a text array
     - Set default sizes for physical products
     
  2. Security
     - No changes to existing policies
*/

-- Update the product type check constraint to allow 'physical' type
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_type_check;
ALTER TABLE products ADD CONSTRAINT products_type_check 
  CHECK (type IN ('download', 'course', 'membership', 'webinar', '1on1call', 'external_link', 'lead_magnet', 'ama', 'physical'));

-- Ensure sizes column exists
ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS sizes TEXT[];

-- Create a trigger function to set default sizes for physical products
CREATE OR REPLACE FUNCTION set_default_sizes()
RETURNS TRIGGER AS $$
BEGIN
  -- If it's a physical product and sizes is empty or null, set default sizes
  IF NEW.type = 'physical' AND (NEW.sizes IS NULL OR array_length(NEW.sizes, 1) IS NULL) THEN
    NEW.sizes := ARRAY['S', 'M', 'L', 'XL'];
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to set default sizes for physical products
DO $$
BEGIN
  -- Drop the trigger if it exists
  DROP TRIGGER IF EXISTS set_default_sizes_trigger ON products;
  
  -- Create the trigger
  CREATE TRIGGER set_default_sizes_trigger
  BEFORE INSERT OR UPDATE ON products
  FOR EACH ROW
  WHEN (NEW.type = 'physical')
  EXECUTE FUNCTION set_default_sizes();
END
$$;

-- Update existing physical products to have default sizes if they don't already
UPDATE products
SET sizes = ARRAY['S', 'M', 'L', 'XL']
WHERE type = 'physical' AND (sizes IS NULL OR array_length(sizes, 1) IS NULL);