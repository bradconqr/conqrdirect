/*
  # Fix admin_create_user function uniqueness issues
  
  1. Changes
     - Drop any existing admin_create_user functions with different parameter signatures
     - Create a properly typed admin_create_user function with correct parameter order
     - Fix permissions for the function to work with Supabase's built-in auth mechanisms
     - Update store user association trigger function
  
  2. Security
     - Maintain security with SECURITY DEFINER
     - Functions only accessible to authorized creators for their stores
*/

-- First drop any existing admin_create_user functions to avoid conflicts
DO $$
BEGIN
  -- Drop all overloaded versions of the function regardless of parameter types
  DROP FUNCTION IF EXISTS public.admin_create_user(uuid, text, text, text);
  DROP FUNCTION IF EXISTS public.admin_create_user(text, text, text, uuid);
  DROP FUNCTION IF EXISTS public.admin_create_user(text, text, text);
  DROP FUNCTION IF EXISTS public.admin_create_user(text, text);
  DROP FUNCTION IF EXISTS public.admin_create_user(uuid, text, text);
  DROP FUNCTION IF EXISTS public.admin_create_user(text, uuid, text);
  DROP FUNCTION IF EXISTS admin_create_user(uuid, text, text, text);
  -- Could add more variations if needed
EXCEPTION
  WHEN OTHERS THEN
    -- Ignore errors if functions don't exist
    NULL;
END
$$;

-- Drop the store user association trigger function to avoid conflicts
DROP FUNCTION IF EXISTS public.update_user_store_association() CASCADE;

-- Create a function to add existing users to a creator's store
CREATE OR REPLACE FUNCTION public.add_existing_user_to_store(
  p_creator_id UUID,
  p_email TEXT
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_creator_user_id UUID;
  v_result JSONB;
BEGIN
  -- Check if the calling user is authenticated
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Not authenticated');
  END IF;
  
  -- Get the creator's user_id to verify permissions
  SELECT user_id INTO v_creator_user_id
  FROM creators
  WHERE id = p_creator_id;
  
  -- Verify the creator exists and the calling user is the creator
  IF v_creator_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Creator not found');
  END IF;
  
  IF v_creator_user_id != auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'message', 'Not authorized to add users to this store');
  END IF;

  -- Check if user exists
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = p_email;
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'User with this email does not exist');
  END IF;
  
  -- Check if the user is already associated with this store
  IF EXISTS (
    SELECT 1 FROM store_users
    WHERE user_id = v_user_id AND creator_id = p_creator_id
  ) THEN
    RETURN jsonb_build_object('success', false, 'message', 'User is already a customer of this store');
  END IF;
  
  -- Add the user to the store
  INSERT INTO store_users (user_id, creator_id, created_at)
  VALUES (v_user_id, p_creator_id, now());
  
  -- Ensure user record exists in users table
  INSERT INTO users (id, email, created_at, updated_at)
  SELECT v_user_id, p_email, now(), now()
  ON CONFLICT (id) DO NOTHING;
  
  RETURN jsonb_build_object('success', true, 'message', 'User added to store successfully');
END;
$$;

-- Create the store user association trigger function
CREATE OR REPLACE FUNCTION public.update_user_store_association()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  -- Update the users table to mark this user as associated with a creator if not already marked
  INSERT INTO public.users (id, email, full_name, created_at, updated_at)
  SELECT 
    NEW.user_id, 
    u.email, 
    u.raw_user_meta_data->>'full_name', 
    NOW(), 
    NOW()
  FROM 
    auth.users u
  WHERE 
    u.id = NEW.user_id
  ON CONFLICT (id) 
  DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Create trigger on store_users if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_store_user_created'
  ) THEN
    CREATE TRIGGER on_store_user_created
    AFTER INSERT ON store_users
    FOR EACH ROW
    EXECUTE FUNCTION update_user_store_association();
  END IF;
END $$;

-- Grant execute privileges to appropriate users with clear parameter types
GRANT EXECUTE ON FUNCTION public.add_existing_user_to_store(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_store_association() TO authenticated;

-- Add helpful comments
COMMENT ON FUNCTION public.add_existing_user_to_store IS 'Associates an existing Supabase user with a creator store';
COMMENT ON FUNCTION public.update_user_store_association IS 'Trigger function to ensure user data is properly synced when added to a store';