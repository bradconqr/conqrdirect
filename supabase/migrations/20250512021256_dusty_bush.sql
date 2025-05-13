/*
  # Fix store_users user relationship

  1. Changes
    - Update the store_users table to correctly reference auth.users
    - Ensure proper foreign key relationship for the user_id column
  
  2. Security
    - No changes to existing policies
*/

-- Check if we need to update the foreign key for the user_id in store_users
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'store_users_user_id_fkey'
  ) THEN
    -- Drop the existing foreign key constraint if it exists
    ALTER TABLE IF EXISTS public.store_users 
    DROP CONSTRAINT IF EXISTS store_users_user_id_fkey;
  END IF;

  -- Re-create the foreign key constraint pointing to auth.users
  ALTER TABLE IF EXISTS public.store_users
  ADD CONSTRAINT store_users_user_id_fkey
  FOREIGN KEY (user_id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;
END $$;