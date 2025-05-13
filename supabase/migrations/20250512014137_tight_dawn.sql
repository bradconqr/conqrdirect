/*
  # Convert user to creator

  1. Updates
    - Update user with ID c0de63a6-f83f-4b49-bdd5-b2b3e994e35a to be a creator
  2. New Records
    - Create a new creator profile for the user
  3. Security
    - No changes to existing security policies
*/

-- Update the user to be a creator
UPDATE public.users
SET is_creator = true,
    updated_at = now()
WHERE id = 'c0de63a6-f83f-4b49-bdd5-b2b3e994e35a';

-- Create a creator profile for this user
-- Store name is required, using a placeholder that can be updated later
INSERT INTO public.creators (
  user_id,
  store_name,
  store_description,
  created_at,
  updated_at
)
VALUES (
  'c0de63a6-f83f-4b49-bdd5-b2b3e994e35a',
  'My Creator Store',  -- Default name that can be updated
  'My creator store description', -- Default description that can be updated
  now(),
  now()
)
ON CONFLICT (user_id) DO NOTHING; -- Don't create duplicate if already exists