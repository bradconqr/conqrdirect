/*
  # Add cancel-subscription function
  
  1. New Functions
     - `cancel_subscription` - Allows users to cancel their Stripe subscription
     
  2. Security
     - Function uses SECURITY DEFINER to ensure proper permission checks
     - Only authenticated users can cancel their own subscriptions
*/

-- Function to cancel a subscription
CREATE OR REPLACE FUNCTION public.cancel_subscription(subscription_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_customer_id TEXT;
BEGIN
  -- Get the current user ID
  v_user_id := auth.uid();
  
  -- Check if the user is authenticated
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Get the customer ID for this user
  SELECT customer_id INTO v_customer_id
  FROM stripe_customers
  WHERE user_id = v_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No customer record found for this user';
  END IF;
  
  -- Update the subscription to be cancelled at period end
  UPDATE stripe_subscriptions
  SET 
    cancel_at_period_end = TRUE,
    updated_at = now()
  WHERE customer_id = v_customer_id;
  
  -- In a real implementation, you would also call the Stripe API to cancel the subscription
  -- This would be done via a webhook or edge function
  
  RETURN TRUE;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.cancel_subscription(TEXT) TO authenticated;

COMMENT ON FUNCTION public.cancel_subscription IS 'Cancels a subscription at the end of the current billing period';