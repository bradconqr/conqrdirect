/*
  # Add store_users table to track which store a user signed up for

  1. New Tables
    - `store_users`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `creator_id` (uuid, references creators)
      - `created_at` (timestamp)
      - `is_subscribed` (boolean)
  2. Security
    - Enable RLS on `store_users` table
    - Add policies for users and creators to access their data
*/

-- Create store_users table to track which stores a user is associated with
CREATE TABLE IF NOT EXISTS store_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  is_subscribed BOOLEAN DEFAULT TRUE,
  
  -- Each user can only be associated with a creator once
  UNIQUE(user_id, creator_id)  
);

-- Enable RLS
ALTER TABLE store_users ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own associations
CREATE POLICY "Users can view their own store associations"
  ON store_users FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow creators to view users associated with their store
CREATE POLICY "Creators can view their store users"
  ON store_users FOR SELECT
  TO authenticated
  USING (creator_id IN (
    SELECT id FROM creators WHERE user_id = auth.uid()
  ));

-- Users can manage their own subscriptions
CREATE POLICY "Users can update their store subscriptions"
  ON store_users FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Let users create their own associations
CREATE POLICY "Users can create their store associations"
  ON store_users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Add a function to update user metadata when they join a store
CREATE OR REPLACE FUNCTION public.update_user_store_association()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the user's auth metadata to include this creator ID in their associated_creators array
  UPDATE auth.users
  SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
                           jsonb_build_object('last_joined_store', NEW.creator_id)
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add trigger to update user metadata when they join a store
CREATE TRIGGER on_store_user_created
  AFTER INSERT ON store_users
  FOR EACH ROW EXECUTE PROCEDURE public.update_user_store_association();