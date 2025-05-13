/*
  # Add 1on1call product type and fields
  
  1. Changes
     - Update the products table's type CHECK constraint to include '1on1call'
     - Add new fields specifically for 1on1 call products:
         - call_duration (integer)
         - call_platform (text)
         - available_days (text[]) 
         - call_time_slots (text[])
*/

-- First update the type check constraint to allow '1on1call' type
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_type_check;
ALTER TABLE products ADD CONSTRAINT products_type_check 
  CHECK (type IN ('download', 'course', 'membership', 'webinar', '1on1call'));

-- Add new columns for 1on1 call products
ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS call_duration INTEGER,
  ADD COLUMN IF NOT EXISTS call_platform TEXT,
  ADD COLUMN IF NOT EXISTS available_days TEXT[],
  ADD COLUMN IF NOT EXISTS call_time_slots TEXT[];