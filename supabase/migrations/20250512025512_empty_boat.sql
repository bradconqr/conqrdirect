/*
  # Fix User Data Synchronization

  1. Changes
     - Creates a function and trigger to properly sync auth users to public users table
     - Adds a join function to retrieve complete customer data 
     - Performs a one-time sync of existing auth users to public users table
  
  2. Security
     - Ensures all functions have proper security definer settings
     - Maintains existing RLS policies
*/

-- Function to sync a user from auth.users to public.users with better data handling
CREATE OR REPLACE FUNCTION public.sync_auth_user_to_public()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert or update the user in the public.users table
  INSERT INTO public.users (
    id, 
    email, 
    full_name,
    created_at, 
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.created_at,
    COALESCE(NEW.updated_at, NEW.created_at)
  )
  ON CONFLICT (id) 
  DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    updated_at = EXCLUDED.updated_at;
  
  RETURN NEW;
END;
$$;

-- Create the trigger on auth.users if it doesn't already exist
DO $$
BEGIN
  -- Drop existing trigger with the same name if it exists
  DROP TRIGGER IF EXISTS sync_auth_users_to_public ON auth.users;
  
  -- Create the new trigger
  CREATE TRIGGER sync_auth_users_to_public
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_auth_user_to_public();
END
$$;

-- Function to get complete customer data for a creator
CREATE OR REPLACE FUNCTION public.get_creator_customers(p_creator_id UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  created_at TIMESTAMPTZ,
  is_subscribed BOOLEAN,
  email TEXT,
  full_name TEXT,
  last_login_at TIMESTAMPTZ,
  purchases_count BIGINT,
  total_spent BIGINT
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  -- Check if the calling user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
    RETURN;
  END IF;
  
  -- Check if the caller is the creator
  IF NOT EXISTS (
    SELECT 1 FROM creators
    WHERE id = p_creator_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized to view this creator''s customers';
    RETURN;
  END IF;

  RETURN QUERY
  WITH purchase_stats AS (
    SELECT
      p.customer_id,
      COUNT(p.id) AS purchases_count,
      COALESCE(SUM(p.price - COALESCE(p.discount_applied, 0)), 0) AS total_spent
    FROM
      purchases p
    WHERE
      p.status = 'completed'
    GROUP BY
      p.customer_id
  )
  SELECT 
    su.id,
    su.user_id,
    su.created_at,
    su.is_subscribed,
    u.email,
    u.full_name,
    au.last_sign_in_at AS last_login_at,
    COALESCE(ps.purchases_count, 0) AS purchases_count,
    COALESCE(ps.total_spent, 0) AS total_spent
  FROM
    store_users su
  JOIN
    users u ON su.user_id = u.id
  LEFT JOIN
    auth.users au ON su.user_id = au.id
  LEFT JOIN
    purchase_stats ps ON ps.customer_id = su.user_id
  WHERE
    su.creator_id = p_creator_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_creator_customers(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_auth_user_to_public() TO service_role;

-- One-time sync of all existing auth users to ensure they're in the public users table
INSERT INTO users (id, email, full_name, created_at, updated_at)
SELECT 
  au.id, 
  au.email, 
  au.raw_user_meta_data->>'full_name', 
  au.created_at, 
  COALESCE(au.updated_at, au.created_at)
FROM 
  auth.users au
LEFT JOIN 
  users u ON au.id = u.id
WHERE 
  u.id IS NULL
ON CONFLICT (id) 
DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  updated_at = EXCLUDED.updated_at;

-- Update existing store_users entries to ensure they have proper user data
UPDATE store_users su
SET is_subscribed = true
WHERE is_subscribed IS NULL;

COMMENT ON FUNCTION public.sync_auth_user_to_public() IS 'Syncs user data from auth.users to public.users table when users are created or updated';
COMMENT ON FUNCTION public.get_creator_customers(UUID) IS 'Retrieves complete customer data for a creator including user details and purchase statistics';