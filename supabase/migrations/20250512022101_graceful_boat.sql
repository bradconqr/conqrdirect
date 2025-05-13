/*
  # Create admin user creation function

  1. New Functions
    - `create_user_with_data` - Creates a user and associated store user record
    
  2. Changes
    - Uses the public schema for the function
    - Designed to work with RLS policies
    - Allows creators to add users to their store
*/

-- Function to create a new user and add them to a store
CREATE OR REPLACE FUNCTION public.create_user_with_data(
  creator_id UUID,
  user_email TEXT,
  user_name TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_user_id UUID;
  creator_user_id UUID;
BEGIN
  -- Check if the calling user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Get the creator's user_id to verify permissions
  SELECT user_id INTO creator_user_id
  FROM creators
  WHERE id = creator_id;
  
  -- Verify the creator exists and the calling user is the creator
  IF creator_user_id IS NULL THEN
    RAISE EXCEPTION 'Creator not found';
  END IF;
  
  IF creator_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Not authorized to add users to this store';
  END IF;

  -- Check if user already exists
  SELECT id INTO new_user_id
  FROM auth.users
  WHERE email = user_email;
  
  IF new_user_id IS NULL THEN
    -- User doesn't exist, return null (the client will handle inviting a new user)
    RETURN NULL;
  END IF;
  
  -- If user exists, check if they're already associated with this creator's store
  IF EXISTS (
    SELECT 1 FROM store_users
    WHERE user_id = new_user_id AND creator_id = creator_id
  ) THEN
    -- User is already associated with this store
    RETURN new_user_id;
  END IF;
  
  -- Add user to store_users
  INSERT INTO store_users (user_id, creator_id, created_at)
  VALUES (new_user_id, creator_id, now());
  
  RETURN new_user_id;
END;
$$;

-- Grant execute privilege to authenticated users
GRANT EXECUTE ON FUNCTION public.create_user_with_data TO authenticated;

COMMENT ON FUNCTION public.create_user_with_data IS 'Associates an existing user with a creator store or returns null if the user does not exist';