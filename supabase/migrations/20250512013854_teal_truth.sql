/*
  # Create users table and profiles system

  1. New Tables
    - `users` - Store user profile information linked to auth.users
  
  2. Security
    - Enable RLS on users table
    - Add policies for users to view/update their own data
  
  3. Functions
    - Create function for handling user profile management
*/

-- Create users table in the public schema
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  is_creator BOOLEAN DEFAULT false,
  subscribed_to_newsletter BOOLEAN DEFAULT false,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Users RLS policies
CREATE POLICY "Users can view their own user data"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own user data"
  ON public.users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create a secure function that will handle the profile logic
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, is_creator, subscribed_to_newsletter, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    COALESCE((NEW.raw_user_meta_data->>'is_creator')::boolean, false),
    COALESCE((NEW.raw_user_meta_data->>'subscribed_to_newsletter')::boolean, false),
    NEW.created_at,
    NEW.created_at
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Handle new user signups
-- Note: We need to use a Supabase webhook or Edge Function for this in production
-- This is a placeholder that will need to be implemented via the Supabase Dashboard
-- or using auth hooks in the application code
COMMENT ON FUNCTION public.handle_new_user IS 
'Function to create user profiles on signup. 
To use this in production, you need to set up an auth webhook or handle this in application code.';

-- Create a function to update last_login
CREATE OR REPLACE FUNCTION public.handle_user_login(user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.users
  SET last_login_at = now(), updated_at = now()
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.handle_user_login IS 
'Function to update last_login timestamp. 
This should be called from your application when a user logs in.';