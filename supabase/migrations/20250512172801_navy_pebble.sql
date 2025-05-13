/*
  # Add all product types to database schema
  
  1. Changes
     - Update the products table type CHECK constraint to include all product types
     - Add new columns for physical, affiliate, service, and ticket product types
     - Update the validate_product_type function to handle all product types
     
  2. Security
     - No changes to existing policies
*/

-- Update the product type check constraint to allow all product types
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_type_check;
ALTER TABLE products ADD CONSTRAINT products_type_check 
  CHECK (type IN ('download', 'course', 'membership', 'webinar', '1on1call', 'external_link', 'lead_magnet', 'ama', 'physical', 'affiliate', 'service', 'ticket'));

-- Add physical product specific fields if they don't exist
ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS sku TEXT,
  ADD COLUMN IF NOT EXISTS brand TEXT,
  ADD COLUMN IF NOT EXISTS weight NUMERIC,
  ADD COLUMN IF NOT EXISTS dimensions JSONB,
  ADD COLUMN IF NOT EXISTS inventory INTEGER,
  ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER,
  ADD COLUMN IF NOT EXISTS shipping_weight NUMERIC,
  ADD COLUMN IF NOT EXISTS shipping_dimensions JSONB,
  ADD COLUMN IF NOT EXISTS shipping_class TEXT,
  ADD COLUMN IF NOT EXISTS free_shipping BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS handling_time INTEGER,
  ADD COLUMN IF NOT EXISTS additional_images TEXT[],
  ADD COLUMN IF NOT EXISTS size TEXT;

-- Add service product specific fields if they don't exist
ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS service_type TEXT,
  ADD COLUMN IF NOT EXISTS service_duration INTEGER,
  ADD COLUMN IF NOT EXISTS service_deliverables TEXT[],
  ADD COLUMN IF NOT EXISTS service_turnaround_time INTEGER,
  ADD COLUMN IF NOT EXISTS service_revisions INTEGER;

-- Add ticket product specific fields if they don't exist
ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS ticket_type TEXT,
  ADD COLUMN IF NOT EXISTS venue TEXT,
  ADD COLUMN IF NOT EXISTS venue_address TEXT,
  ADD COLUMN IF NOT EXISTS event_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS event_time TEXT,
  ADD COLUMN IF NOT EXISTS ticket_quantity INTEGER,
  ADD COLUMN IF NOT EXISTS ticket_options JSONB,
  ADD COLUMN IF NOT EXISTS seating_chart TEXT,
  ADD COLUMN IF NOT EXISTS ticket_delivery_method TEXT,
  ADD COLUMN IF NOT EXISTS ticket_transferable BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS ticket_refund_policy TEXT;

-- Add affiliate product specific fields if they don't exist
ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS affiliate_network TEXT,
  ADD COLUMN IF NOT EXISTS cookie_duration INTEGER,
  ADD COLUMN IF NOT EXISTS terms_and_conditions TEXT;

-- Add constraints for ticket_type and ticket_delivery_method
DO $$
BEGIN
  -- Check if the constraint already exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'products_ticket_type_check' AND conrelid = 'products'::regclass
  ) THEN
    -- Add the constraint if it doesn't exist
    ALTER TABLE products ADD CONSTRAINT products_ticket_type_check
      CHECK (ticket_type IS NULL OR ticket_type IN ('online', 'physical', 'hybrid'));
  END IF;

  -- Check if the constraint already exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'products_ticket_delivery_method_check' AND conrelid = 'products'::regclass
  ) THEN
    -- Add the constraint if it doesn't exist
    ALTER TABLE products ADD CONSTRAINT products_ticket_delivery_method_check
      CHECK (ticket_delivery_method IS NULL OR ticket_delivery_method IN ('email', 'print', 'will_call', 'mobile'));
  END IF;

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

-- Update the validate_product_type function to handle all product types
CREATE OR REPLACE FUNCTION public.validate_product_type()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  -- Ensure the product type is valid
  IF NEW.type NOT IN ('download', 'course', 'membership', 'webinar', '1on1call', 'external_link', 'lead_magnet', 'ama', 'physical', 'affiliate', 'service', 'ticket') THEN
    RAISE EXCEPTION 'Invalid product type: %', NEW.type;
  END IF;
  
  -- Set type-specific default values if they're missing
  CASE NEW.type
    WHEN 'download' THEN
      -- Ensure download products have file-related fields
      IF NEW.file_url IS NULL THEN
        -- Don't set defaults for file_url as it should be provided by the user
        NULL;
      END IF;
      
    WHEN 'course' THEN
      -- Ensure course products have modules structure
      IF NEW.modules IS NULL THEN
        NEW.modules := '[]'::jsonb;
      END IF;
      
    WHEN 'membership' THEN
      -- Ensure membership products have benefits and interval
      IF NEW.benefits IS NULL THEN
        NEW.benefits := '[]'::jsonb;
      END IF;
      IF NEW.interval IS NULL THEN
        NEW.interval := 'monthly';
      END IF;
      
    WHEN '1on1call' THEN
      -- Ensure 1on1call products have call-related fields
      IF NEW.call_duration IS NULL THEN
        NEW.call_duration := 30; -- Default 30 minutes
      END IF;
      IF NEW.available_days IS NULL THEN
        NEW.available_days := ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']::text[];
      END IF;
      
    WHEN 'ama' THEN
      -- Ensure AMA products have response time
      IF NEW.response_time IS NULL THEN
        NEW.response_time := 24; -- Default 24 hours
      END IF;
      
    WHEN 'physical' THEN
      -- Ensure physical products have inventory
      IF NEW.inventory IS NULL THEN
        NEW.inventory := 0;
      END IF;
      IF NEW.sizes IS NULL THEN
        NEW.sizes := ARRAY['S', 'M', 'L', 'XL']::text[];
      END IF;
      
    WHEN 'service' THEN
      -- Ensure service products have duration
      IF NEW.service_duration IS NULL THEN
        NEW.service_duration := 60; -- Default 60 minutes
      END IF;
      IF NEW.service_deliverables IS NULL THEN
        NEW.service_deliverables := ARRAY[]::text[];
      END IF;
      
    WHEN 'ticket' THEN
      -- Ensure ticket products have quantity
      IF NEW.ticket_quantity IS NULL THEN
        NEW.ticket_quantity := 100; -- Default 100 tickets
      END IF;
      IF NEW.ticket_type IS NULL THEN
        NEW.ticket_type := 'online'; -- Default to online tickets
      END IF;
      
    WHEN 'affiliate' THEN
      -- Ensure affiliate products have commission rate
      IF NEW.commission_rate IS NULL THEN
        NEW.commission_rate := 10; -- Default 10% commission
      END IF;
      
    ELSE
      -- For other types, no special handling needed
      NULL;
  END CASE;
  
  RETURN NEW;
END;
$$;

-- Create or replace the trigger for product type validation
DROP TRIGGER IF EXISTS validate_product_type_trigger ON products;
CREATE TRIGGER validate_product_type_trigger
BEFORE INSERT OR UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION validate_product_type();