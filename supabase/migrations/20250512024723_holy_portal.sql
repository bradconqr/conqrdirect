/*
  # Add alternative store invitation and user management functions
  
  1. New Functions
     - create_store_invitation: Creates an invitation record for a user to join a store
     - accept_store_invitation: Accepts a store invitation and adds the user to the store
     - get_store_invitations: Gets all invitations for a creator's store
     
  2. Security
     - All functions use SECURITY DEFINER to ensure proper permission checks
     - RLS policies are maintained and enforced
*/

-- Function to create a store invitation
CREATE OR REPLACE FUNCTION public.create_store_invitation(
  p_creator_id UUID,
  p_email TEXT,
  p_message TEXT DEFAULT NULL
) 
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invitation_id UUID;
  v_creator_user_id UUID;
BEGIN
  -- Check if the calling user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Get the creator's user_id to verify permissions
  SELECT user_id INTO v_creator_user_id
  FROM creators
  WHERE id = p_creator_id;
  
  -- Verify the creator exists and the calling user is the creator
  IF v_creator_user_id IS NULL THEN
    RAISE EXCEPTION 'Creator not found';
  END IF;
  
  IF v_creator_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Not authorized to invite users to this store';
  END IF;

  -- Create the invitation
  INSERT INTO store_invitations (creator_id, email, message, created_at)
  VALUES (p_creator_id, p_email, p_message, now())
  RETURNING id INTO v_invitation_id;
  
  -- In a complete implementation, this would trigger an email to the user
  -- with a signup/login link that includes the invitation ID
  
  RETURN v_invitation_id;
END;
$$;

-- Function to accept a store invitation
CREATE OR REPLACE FUNCTION public.accept_store_invitation(
  p_invitation_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email TEXT;
  v_creator_id UUID;
  v_current_user_id UUID;
BEGIN
  -- Get the current user ID
  v_current_user_id := auth.uid();
  
  -- Check if the calling user is authenticated
  IF v_current_user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Get invitation details
  SELECT email, creator_id INTO v_email, v_creator_id
  FROM store_invitations
  WHERE id = p_invitation_id
    AND accepted_at IS NULL;
    
  -- If invitation doesn't exist or is already accepted
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Check if the current user matches the invited email
  IF NOT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = v_current_user_id
      AND email = v_email
  ) THEN
    RETURN FALSE;
  END IF;
  
  -- Mark invitation as accepted
  UPDATE store_invitations
  SET 
    accepted_at = now(),
    user_id = v_current_user_id
  WHERE id = p_invitation_id;
  
  -- Add user to store
  INSERT INTO store_users (user_id, creator_id, created_at)
  VALUES (v_current_user_id, v_creator_id, now())
  ON CONFLICT (user_id, creator_id) DO NOTHING;
  
  RETURN TRUE;
END;
$$;

-- Function to get invitations for a creator's store
CREATE OR REPLACE FUNCTION public.get_store_invitations(
  p_creator_id UUID
)
RETURNS SETOF store_invitations
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the calling user is authenticated
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;
  
  -- Check if the creator belongs to the calling user
  IF NOT EXISTS (
    SELECT 1 FROM creators
    WHERE id = p_creator_id
      AND user_id = auth.uid()
  ) THEN
    RETURN;
  END IF;
  
  -- Return invitations for this creator
  RETURN QUERY
  SELECT *
  FROM store_invitations
  WHERE creator_id = p_creator_id
  ORDER BY created_at DESC;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.create_store_invitation(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_store_invitation(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_store_invitations(UUID) TO authenticated;

-- Add explanatory comments
COMMENT ON FUNCTION public.create_store_invitation IS 'Creates an invitation for a user to join a creator store';
COMMENT ON FUNCTION public.accept_store_invitation IS 'Accepts a store invitation and adds the user to the store';
COMMENT ON FUNCTION public.get_store_invitations IS 'Gets all invitations for a creator''s store';