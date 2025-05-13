/*
  # Fix ambiguous column references in store functions

  1. Changes
    - Fix ambiguous `creator_id` references in functions by using proper parameter prefixing
    - Drop existing functions first, then recreate them with updated parameter names
    - Add proper table aliases to clarify column references

  2. Security
    - Maintain existing function permissions
    - Preserve SECURITY DEFINER setting
*/

-- Drop existing functions first before recreating them
DROP FUNCTION IF EXISTS public.create_user_with_data(uuid, text, text);
DROP FUNCTION IF EXISTS public.invite_user_to_store(uuid, text, text);

-- Recreate the create_user_with_data function with fixed parameter naming
CREATE FUNCTION public.create_user_with_data(
  p_creator_id UUID,
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
  WHERE id = p_creator_id;
  
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
  -- Use table alias and parameter prefixing to disambiguate
  IF EXISTS (
    SELECT 1 FROM store_users su
    WHERE su.user_id = new_user_id AND su.creator_id = p_creator_id
  ) THEN
    -- User is already associated with this store
    RETURN new_user_id;
  END IF;
  
  -- Add user to store_users with explicit column references
  INSERT INTO store_users (user_id, creator_id, created_at)
  VALUES (new_user_id, p_creator_id, now());
  
  RETURN new_user_id;
END;
$$;

-- Grant execute privilege to authenticated users
GRANT EXECUTE ON FUNCTION public.create_user_with_data TO authenticated;

COMMENT ON FUNCTION public.create_user_with_data IS 'Associates an existing user with a creator store or returns null if the user does not exist';

-- Recreate the invite_user_to_store function for consistency
CREATE FUNCTION public.invite_user_to_store(
  p_creator_id UUID,
  user_email TEXT,
  custom_message TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invitation_id UUID;
  creator_user_id UUID;
BEGIN
  -- Check if the calling user is authenticated
  IF auth.uid() IS NULL THEN
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
  
  IF creator_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Not authorized to invite users to this store';
  END IF;

  -- Insert the invitation
  INSERT INTO store_invitations (creator_id, email, message, created_at)
  VALUES (p_creator_id, user_email, custom_message, now())
  RETURNING id INTO invitation_id;
  
  -- In a real implementation, you would trigger an email to the user here
  -- This could be done via a trigger or webhook
  
  RETURN invitation_id;
END;
$$;

-- Grant execute privilege to authenticated users
GRANT EXECUTE ON FUNCTION public.invite_user_to_store TO authenticated;