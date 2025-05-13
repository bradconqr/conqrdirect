/*
  # Add lead magnet product type
  
  1. Changes
     - Update products table type CHECK constraint to include 'lead_magnet'
     - Add new columns to products table for lead magnet specific fields:
       - lead_magnet_file
       - email_list_name
       - thank_you_message
       - redirect_url
       - opt_in_required
       - opt_in_text
       
  2. Security
     - No changes to existing policies
*/

-- Update the product type check constraint to include lead_magnet
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_type_check;
ALTER TABLE products ADD CONSTRAINT products_type_check 
  CHECK (type IN ('download', 'course', 'membership', 'webinar', '1on1call', 'external_link', 'lead_magnet'));

-- Add new columns for lead magnet products
ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS lead_magnet_file TEXT,
  ADD COLUMN IF NOT EXISTS email_list_name TEXT,
  ADD COLUMN IF NOT EXISTS thank_you_message TEXT,
  ADD COLUMN IF NOT EXISTS redirect_url TEXT,
  ADD COLUMN IF NOT EXISTS opt_in_required BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS opt_in_text TEXT;