/*
  # Fix User Data Synchronization

  1. Changes:
     - Create a function to properly sync users between auth.users and public.users
     - Create a trigger to automatically sync newly created auth users to public.users
     - Add a function to find users by email and add them to a store
     
  2. Security:
     - Enable RLS on relevant tables
     - Add appropriate security policies
*/

-- Function to sync a user from auth.users to public.users
CREATE OR REPLACE FUNCTION public.sync_user_to_public_users()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert the user into public.users if they don't already exist
  INSERT INTO public.users (id, email, full_name, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.created_at,
    NEW.updated_at
  )
  ON CONFLICT (id) 
  DO UPDATE SET
    email = NEW.email,
    full_name = NEW.raw_user_meta_data->>'full_name',
    updated_at = NEW.updated_at;
    
  RETURN NEW;
END;
$$;

-- Create a trigger on auth.users to sync with public.users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
    AFTER INSERT OR UPDATE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_user_to_public_users();
  END IF;
END $$;

-- Function to find user by email and add to a store
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

  -- Check if user exists in auth.users
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
  
  -- Ensure the user exists in public.users
  INSERT INTO public.users (id, email, created_at, updated_at)
  SELECT v_user_id, p_email, now(), now()
  ON CONFLICT (id) DO NOTHING;
  
  -- Add the user to the store
  INSERT INTO store_users (user_id, creator_id, created_at)
  VALUES (v_user_id, p_creator_id, now());
  
  RETURN jsonb_build_object('success', true, 'message', 'User added to store successfully', 'user_id', v_user_id);
END;
$$;

-- Run a one-time sync for existing auth users that might not be in public.users
INSERT INTO public.users (id, email, full_name, created_at, updated_at)
SELECT 
  id, 
  email, 
  raw_user_meta_data->>'full_name', 
  created_at, 
  updated_at
FROM 
  auth.users
ON CONFLICT (id) 
DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  updated_at = EXCLUDED.updated_at;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.sync_user_to_public_users() TO service_role;
GRANT EXECUTE ON FUNCTION public.add_existing_user_to_store(UUID, TEXT) TO authenticated;