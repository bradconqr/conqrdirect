/*
  # Add admin_create_user function
  
  1. New Functions
    - `admin_create_user`: Creates a new user in auth schema and adds them to a creator's store
      - Takes parameters for creator_id, email, password, and name
      - Creates the user in auth.users table
      - Adds a record to public.users table
      - Links the user to the creator's store
  
  2. Security
    - Function is only accessible to authenticated users
    - Users can only create and add users to stores they own
*/

-- Function to create a new user and add them to a creator's store
CREATE OR REPLACE FUNCTION admin_create_user(
  p_creator_id UUID,
  user_email TEXT,
  user_password TEXT,
  user_name TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, public
AS $$
DECLARE
  v_user_id UUID;
  v_creator_user_id UUID;
BEGIN
  -- Verify the creator exists and get their user ID
  SELECT user_id INTO v_creator_user_id
  FROM public.creators
  WHERE id = p_creator_id;
  
  -- Check if the caller is the creator
  IF v_creator_user_id IS NULL OR v_creator_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: Only creators can add users to their own stores';
  END IF;
  
  -- Create the user in auth.users
  v_user_id := extensions.uuid_generate_v4();
  
  INSERT INTO auth.users (
    id,
    email,
    raw_user_meta_data,
    raw_app_meta_data,
    created_at,
    email_confirmed_at
  )
  VALUES (
    v_user_id,
    user_email,
    jsonb_build_object('full_name', user_name),
    jsonb_build_object('provider', 'email'),
    now(),
    now()
  );
  
  -- Set the user's password
  PERFORM auth.set_password(v_user_id, user_password);
  
  -- Create the user in public.users
  INSERT INTO public.users (
    id,
    email,
    full_name,
    created_at,
    updated_at
  )
  VALUES (
    v_user_id,
    user_email,
    user_name,
    now(),
    now()
  );
  
  -- Add the user to the store
  INSERT INTO public.store_users (
    user_id,
    creator_id,
    created_at,
    is_subscribed
  )
  VALUES (
    v_user_id,
    p_creator_id,
    now(),
    true
  );
  
  RETURN v_user_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION admin_create_user TO authenticated;