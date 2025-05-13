/*
  # Add Stripe-related fields to users and creators tables
  
  1. Changes
     - Add stripe_customer_id and stripe_payment_method to users table
     - Add stripe_account_id to creators table
     - Add trial_ends_at to users table for tracking free trial periods
     
  2. Security
     - No changes to existing policies
*/

-- Add Stripe-related fields to users table
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_payment_method TEXT,
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;

-- Add Stripe account ID to creators table if it doesn't exist
-- (This is different from stripe_connected_account_id which is for Connect accounts)
ALTER TABLE creators
  ADD COLUMN IF NOT EXISTS stripe_account_id TEXT;

-- Create a function to set trial end date when a user signs up
CREATE OR REPLACE FUNCTION set_trial_end_date()
RETURNS TRIGGER AS $$
BEGIN
  -- Set trial end date to 14 days from now
  NEW.trial_ends_at := NOW() + INTERVAL '14 days';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to set trial end date for new users
DO $$
BEGIN
  -- Drop the trigger if it exists
  DROP TRIGGER IF EXISTS set_trial_end_date_trigger ON users;
  
  -- Create the trigger
  CREATE TRIGGER set_trial_end_date_trigger
  BEFORE INSERT ON users
  FOR EACH ROW
  WHEN (NEW.subscription_plan IS NOT NULL)
  EXECUTE FUNCTION set_trial_end_date();
END
$$;