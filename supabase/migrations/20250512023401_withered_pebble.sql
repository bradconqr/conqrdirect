/*
  # Add admin user creation capability

  1. New Functions
    - `admin_create_user`: Creates a new user in auth and users tables
    - Allows administrators to directly create users through the admin interface
    
  2. Security
    - Function uses SECURITY DEFINER to run with elevated privileges
    - Only authenticated users can execute the function
    - Function validates caller permissions before creating users
*/

-- Function to create a new user directly from admin interface
CREATE OR REPLACE FUNCTION public.admin_create_user(
  p_creator_id UUID,
  user_email TEXT,
  user_password TEXT,
  user_name TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_user_id UUID;
  creator_user_id UUID;
  current_user_id UUID;
BEGIN
  -- Get the current user ID
  current_user_id := auth.uid();
  
  -- Check if the calling user is authenticated
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Get the creator's user_id to verify permissions
  SELECT user_id INTO creator_user_id
  FROM creators
  WHERE id = p_creator_id;
  
  -- Verify the creator exists and the calling user is the creator
  IF creator_user_id IS NULL THEN
    RAISE EXCEPTION 'Creator not found';
  END IF;
  
  IF creator_user_id != current_user_id THEN
    RAISE EXCEPTION 'Not authorized to create users for this store';
  END IF;
  
  -- Check if user with this email already exists
  PERFORM 1 FROM auth.users WHERE email = user_email;
  IF FOUND THEN
    RAISE EXCEPTION 'User with this email already exists';
  END IF;

  -- Create the user using Supabase's built-in function
  -- This creates a proper auth.users entry with password hash
  SELECT id INTO new_user_id FROM auth.create_user(
    user_email,  -- email
    user_password, -- password
    NULL,  -- phone (not used)
    NULL,  -- provider (null means email provider)
    NULL,  -- instance_id (null uses default instance)
    NULL,  -- is_anonymous (false by default)
    NULL,  -- email_confirm (null means use instance default)
    NULL,  -- phone_confirm (null means use instance default)
    jsonb_build_object('full_name', user_name), -- user_metadata
    NULL,  -- default_role (null uses default)
    NULL,  -- bypass_confirmation (null means false)
    NULL,  -- confirm_token_validity (null uses instance default)
    jsonb_build_object('aud', 'authenticated'), -- app_metadata
    NULL,  -- create_admin (null means false)
    NULL   -- create_otp (null uses instance default)
  );
  
  -- If the above function call succeeded, also insert user into the users table
  INSERT INTO users (id, email, full_name, created_at, updated_at)
  VALUES (new_user_id, user_email, user_name, now(), now());
  
  -- Also associate the user with this creator's store
  INSERT INTO store_users (user_id, creator_id, created_at)
  VALUES (new_user_id, p_creator_id, now());
  
  RETURN new_user_id;
END;
$$;

-- Grant execute privilege to authenticated users
GRANT EXECUTE ON FUNCTION public.admin_create_user TO authenticated;

COMMENT ON FUNCTION public.admin_create_user IS 'Creates a new user and adds them to a creator store. Only callable by the creator.';