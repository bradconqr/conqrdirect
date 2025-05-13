import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';

export interface Subscription {
  status: string;
  priceId: string | null;
  subscriptionId: string | null;
  subscriptionId: string | null;
  currentPeriodEnd: number | null;
  cancelAtPeriodEnd: boolean;
  paymentMethodBrand: string | null;
  paymentMethodLast4: string | null;
}

export function useSubscription() {
  const { user } = useAuthStore();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshIntervalId, setRefreshIntervalId] = useState<number | null>(null);

  useEffect(() => {
    if (!user) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    // Clear any existing interval when component unmounts or user changes
    return () => {
      if (refreshIntervalId) {
        clearInterval(refreshIntervalId);
      }
    };
  }, [user, refreshIntervalId]);

  useEffect(() => {
    if (!user) return;

    async function fetchSubscription() {
      try {
        setLoading(true);
        setError(null);

        // Fetch subscription data from the view
        const { data, error } = await supabase
          .from('stripe_user_subscriptions')
          .select('*')
          .maybeSingle();

        if (error) {
          console.error("Error fetching subscription data:", error);
          throw error;
        }

        if (data) {
          setSubscription({
            status: data.subscription_status,
            priceId: data.price_id,
            subscriptionId: data.subscription_id,
            currentPeriodEnd: data.current_period_end,
            cancelAtPeriodEnd: data.cancel_at_period_end,
            paymentMethodBrand: data.payment_method_brand,
            paymentMethodLast4: data.payment_method_last4,
          });
        } else {
          console.log("No active subscription found for user");
          setSubscription(null);
        }
      } catch (err: any) {
        console.error('Error fetching subscription:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
     }

     // Initial fetch
     fetchSubscription();

     // Set up polling to refresh subscription data every 10 seconds
     // This ensures we get real-time updates from Stripe
     const interval = setInterval(fetchSubscription, 10000);
     setRefreshIntervalId(interval);

     // Clean up interval on unmount
     return () => clearInterval(interval);
   }, [user]);

  // Helper function to get the current plan details
  const getCurrentPlan = () => {
    if (!subscription?.priceId) return null;
    
    // Import products dynamically to avoid circular dependencies
    const { products } = require('../stripe-config');
    
    const planKey = Object.keys(products).find(key => 
      products[key].priceId === subscription.priceId
    );
    
    return planKey ? products[planKey] : null;
  };

  return { subscription, loading, error, getCurrentPlan };
}