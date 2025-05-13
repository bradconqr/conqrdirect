/*
  # Remove physical product type from allowed types
  
  1. Changes
     - Update the products table type CHECK constraint to remove 'physical'
     - Keep all physical product columns for backward compatibility
     - Update the validate_product_type function to handle the change
     
  2. Security
     - No changes to existing policies
*/

-- Update the product type check constraint to remove 'physical' type
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_type_check;
ALTER TABLE products ADD CONSTRAINT products_type_check 
  CHECK (type IN ('download', 'course', 'membership', 'webinar', '1on1call', 'external_link', 'lead_magnet', 'ama', 'affiliate', 'service', 'ticket'));

-- Update the validate_product_type function to remove physical product handling
CREATE OR REPLACE FUNCTION public.validate_product_type()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  -- Ensure the product type is valid
  IF NEW.type NOT IN ('download', 'course', 'membership', 'webinar', '1on1call', 'external_link', 'lead_magnet', 'ama', 'affiliate', 'service', 'ticket') THEN
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

-- Drop the trigger for setting default sizes for physical products
DROP TRIGGER IF EXISTS set_default_sizes_trigger ON products;