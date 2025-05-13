/*
  # Add subscription fields to users and creators tables
  
  1. Changes
     - Add subscription_plan and subscription_price to users table
     - Add store_slug to creators table for unique store URLs
     
  2. Security
     - No changes to existing policies
*/

-- Add subscription fields to users table
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS subscription_plan TEXT,
  ADD COLUMN IF NOT EXISTS subscription_price INTEGER;

-- Add store_slug to creators table
ALTER TABLE creators 
  ADD COLUMN IF NOT EXISTS store_slug TEXT;

-- Create a function to generate a unique store slug
CREATE OR REPLACE FUNCTION generate_unique_store_slug(store_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
  slug_exists BOOLEAN;
BEGIN
  -- Convert store name to slug format
  base_slug := lower(regexp_replace(store_name, '[^a-zA-Z0-9]+', '-', 'g'));
  
  -- Remove leading and trailing hyphens
  base_slug := trim(both '-' from base_slug);
  
  -- Add random suffix
  final_slug := base_slug || '-' || floor(random() * 10000)::text;
  
  -- Check if slug exists
  LOOP
    SELECT EXISTS(
      SELECT 1 FROM creators WHERE store_slug = final_slug
    ) INTO slug_exists;
    
    EXIT WHEN NOT slug_exists;
    
    -- If slug exists, add counter and try again
    counter := counter + 1;
    final_slug := base_slug || '-' || counter::text;
  END LOOP;
  
  RETURN final_slug;
END;
$$;

-- Create a trigger to automatically generate a store slug when a creator is created
CREATE OR REPLACE FUNCTION set_default_store_slug()
RETURNS TRIGGER AS $$
BEGIN
  -- Only set store_slug if it's NULL
  IF NEW.store_slug IS NULL THEN
    NEW.store_slug := generate_unique_store_slug(NEW.store_name);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to set default store slug for new creators
DO $$
BEGIN
  -- Drop the trigger if it exists
  DROP TRIGGER IF EXISTS set_default_store_slug_trigger ON creators;
  
  -- Create the trigger
  CREATE TRIGGER set_default_store_slug_trigger
  BEFORE INSERT ON creators
  FOR EACH ROW
  EXECUTE FUNCTION set_default_store_slug();
END
$$;

-- Update existing creators to have a store slug if they don't already
UPDATE creators
SET store_slug = generate_unique_store_slug(store_name)
WHERE store_slug IS NULL;