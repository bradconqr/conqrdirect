/*
  # Add gradient theme support to creators table
  
  1. Changes
     - Update existing theme_settings to include gradient field
     - Set default gradient for existing creators
     
  2. Security
     - No changes to existing policies
*/

-- Update existing creators to have a gradient in their theme_settings
UPDATE creators
SET theme_settings = jsonb_set(
  COALESCE(theme_settings, '{}'::jsonb),
  '{gradient}',
  '"linear-gradient(to right, #6366f1, #8b5cf6)"'::jsonb
)
WHERE theme_settings IS NULL OR NOT theme_settings ? 'gradient';

-- Update existing creators to have the purple-indigo theme
UPDATE creators
SET theme_settings = jsonb_set(
  COALESCE(theme_settings, '{}'::jsonb),
  '{theme}',
  '"purple-indigo"'::jsonb
)
WHERE theme_settings IS NULL OR NOT theme_settings ? 'theme' OR theme_settings->>'theme' = 'default';

-- Update primary and accent colors for consistency
UPDATE creators
SET theme_settings = jsonb_set(
  COALESCE(theme_settings, '{}'::jsonb),
  '{primaryColor}',
  '"#6366f1"'::jsonb
)
WHERE theme_settings IS NULL OR NOT theme_settings ? 'primaryColor';

UPDATE creators
SET theme_settings = jsonb_set(
  COALESCE(theme_settings, '{}'::jsonb),
  '{accentColor}',
  '"#8b5cf6"'::jsonb
)
WHERE theme_settings IS NULL OR NOT theme_settings ? 'accentColor';