/*
  # Add theme_settings column to creators table
  
  1. Changes
     - Add theme_settings column to creators table as JSONB type
     - This column will store theme and layout preferences for the creator's store
     
  2. Security
     - No changes to existing policies
*/

-- Add theme_settings column to creators table
ALTER TABLE creators 
  ADD COLUMN IF NOT EXISTS theme_settings JSONB;

-- Update existing creators to have an empty theme_settings object
UPDATE creators
SET theme_settings = '{}'::jsonb
WHERE theme_settings IS NULL;