/*
  # Fix admin_create_user function uniqueness issue
  
  1. Changes
    - Drop existing admin_create_user function before recreating it
    - Ensure the function can be properly identified by its parameter list
    - Maintain the same functionality for user creation and store association
  
  2. Security
    - Maintain security definer settings
    - Keep appropriate permissions for authenticated users
*/

-- First drop any existing admin_create_user functions to avoid conflicts
DO $$
BEGIN
  -- Drop all overloaded versions of the function
  DROP FUNCTION IF EXISTS public.admin_create_user(TEXT, TEXT, TEXT, UUID);
  DROP FUNCTION IF EXISTS public.admin_create_user(TEXT, TEXT, TEXT);
  DROP FUNCTION IF EXISTS public.admin_create_user(TEXT, TEXT);
  
  -- You could add more DROP statements here if there are other variants
EXCEPTION
  WHEN OTHERS THEN
    -- Ignore errors if functions don't exist
    NULL;
END
$$;

-- Create a function to create users and add them to a creator's store
CREATE OR REPLACE FUNCTION public.admin_create_user(
  p_email TEXT,
  p_password TEXT,
  p_full_name TEXT DEFAULT NULL,
  p_creator_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_user_id UUID;
  usr RECORD;
BEGIN
  -- Check if the calling user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- If creator_id is provided, verify the creator exists and calling user has permission
  IF p_creator_id IS NOT NULL THEN
    -- Check if the creator exists and belongs to the calling user
    IF NOT EXISTS (
      SELECT 1 FROM creators 
      WHERE id = p_creator_id AND user_id = auth.uid()
    ) THEN
      RAISE EXCEPTION 'Creator not found or not authorized';
    END IF;
  END IF;

  -- Check if user already exists
  SELECT id INTO new_user_id
  FROM auth.users
  WHERE email = p_email;
  
  IF new_user_id IS NOT NULL THEN
    RAISE EXCEPTION 'User with this email already exists';
  END IF;
  
  -- Insert into auth.users directly (requires appropriate permissions)
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    p_email,
    crypt(p_password, gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    json_build_object('full_name', p_full_name),
    now(),
    now(),
    '',
    '',
    '',
    ''
  ) RETURNING id INTO new_user_id;
  
  -- Create user profile
  INSERT INTO public.users (id, email, full_name, created_at, updated_at)
  VALUES (new_user_id, p_email, p_full_name, now(), now());
  
  -- If creator_id was provided, associate the user with the creator's store
  IF p_creator_id IS NOT NULL THEN
    INSERT INTO store_users (user_id, creator_id, created_at)
    VALUES (new_user_id, p_creator_id, now());
  END IF;
  
  RETURN new_user_id;
END;
$$;

-- Create or replace the function for the on_store_user_created trigger
-- First drop existing function to avoid conflicts
DROP FUNCTION IF EXISTS public.update_user_store_association() CASCADE;

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

-- Grant execute privileges to appropriate users
GRANT EXECUTE ON FUNCTION public.admin_create_user(TEXT, TEXT, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_create_user(TEXT, TEXT, TEXT, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.update_user_store_association() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_store_association() TO service_role;

-- Add helpful comments
COMMENT ON FUNCTION public.admin_create_user(TEXT, TEXT, TEXT, UUID) IS 'Creates a new user and optionally associates them with a creator store';
COMMENT ON FUNCTION public.update_user_store_association() IS 'Trigger function to ensure user data is properly synced when added to a store';