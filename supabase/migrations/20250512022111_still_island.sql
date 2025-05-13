/*
  # Create user invite function
  
  1. New Functions
    - `invite_user_to_store` - Adds a placeholder for inviting users to join a store
    
  2. Changes
    - Creates a function to handle sending invitations to new users
    - Stores pending invitations in a new table
*/

-- Create table to track invitations
CREATE TABLE IF NOT EXISTS public.store_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE(creator_id, email)
);

-- Enable RLS on store_invitations
ALTER TABLE public.store_invitations ENABLE ROW LEVEL SECURITY;

-- Policies for store_invitations
CREATE POLICY "Creators can view their invitations" 
  ON public.store_invitations
  FOR SELECT
  TO authenticated
  USING (creator_id IN (
    SELECT id FROM creators WHERE user_id = auth.uid()
  ));

CREATE POLICY "Creators can create invitations"
  ON public.store_invitations
  FOR INSERT
  TO authenticated
  WITH CHECK (creator_id IN (
    SELECT id FROM creators WHERE user_id = auth.uid()
  ));

CREATE POLICY "Creators can update their invitations"
  ON public.store_invitations
  FOR UPDATE
  TO authenticated
  USING (creator_id IN (
    SELECT id FROM creators WHERE user_id = auth.uid()
  ));

-- Function to invite a user to a store
CREATE OR REPLACE FUNCTION public.invite_user_to_store(
  creator_id UUID,
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
  WHERE id = creator_id;
  
  -- Verify the creator exists and the calling user is the creator
  IF creator_user_id IS NULL THEN
    RAISE EXCEPTION 'Creator not found';
  END IF;
  
  IF creator_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Not authorized to invite users to this store';
  END IF;

  -- Insert the invitation
  INSERT INTO store_invitations (creator_id, email, message, created_at)
  VALUES (creator_id, user_email, custom_message, now())
  RETURNING id INTO invitation_id;
  
  -- In a real implementation, you would trigger an email to the user here
  -- This could be done via a trigger or webhook
  
  RETURN invitation_id;
END;
$$;

-- Grant execute privilege to authenticated users
GRANT EXECUTE ON FUNCTION public.invite_user_to_store TO authenticated;

COMMENT ON FUNCTION public.invite_user_to_store IS 'Creates an invitation for a user to join a creator store';