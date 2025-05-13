import { supabase } from './supabase';
import { loadStripe } from '@stripe/stripe-js';
import { products as stripeProducts } from '../stripe-config';

// Initialize Stripe
export const getStripe = async () => {
  try {
    const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_51RNl0KPxt4iTvCog1oMRnicDFRONDEshgJeNvQBC0OABGw61I8pksnH0BsyxrIwkHJAtAzK0goLrcTYDiEKmAAMK00IxBuRQpy';
    if (!stripeKey) {
      console.error('Stripe publishable key is missing');
      throw new Error('Stripe publishable key is missing');
    }
    return await loadStripe(stripeKey);
  } catch (error) {
    console.error('Error loading Stripe, using fallback key:', error);
    // Fallback to hardcoded key if environment variable fails
    return await loadStripe('pk_test_51RNl0KPxt4iTvCog1oMRnicDFRONDEshgJeNvQBC0OABGw61I8pksnH0BsyxrIwkHJAtAzK0goLrcTYDiEKmAAMK00IxBuRQpy');
  }
};

// Create a checkout session for a subscription
export async function createSubscriptionCheckout(priceId: string) {
  try {
    // Get the JWT token for the current user
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('You must be logged in to subscribe');
    }
    
    // Call the Supabase Edge Function
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        price_id: priceId,
        success_url: `${window.location.origin}/settings?checkout_success=true`,
        cancel_url: `${window.location.origin}/settings?checkout_canceled=true`,
        mode: 'subscription',
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create checkout session');
    }
    
    const { url } = await response.json();
    
    // Redirect to Stripe Checkout
    window.location.href = url;
    
    return { success: true };
  } catch (error: any) {
    console.error('Error creating subscription checkout:', error);
    return { success: false, error: error.message };
  }
}

// Create a checkout session for a one-time payment
export async function createPaymentCheckout(priceId: string) {
  try {
    // Get the JWT token for the current user
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('You must be logged in to make a purchase');
    }
    
    // Call the Supabase Edge Function
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        price_id: priceId,
        success_url: `${window.location.origin}/checkout/success`,
        cancel_url: `${window.location.origin}/checkout?canceled=true`,
        mode: 'payment',
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create checkout session');
    }
    
    const { url } = await response.json();
    
    // Redirect to Stripe Checkout
    window.location.href = url;
    
    return { success: true };
  } catch (error: any) {
    console.error('Error creating payment checkout:', error);
    return { success: false, error: error.message };
  }
}

// Get the product details for a subscription
export function getSubscriptionDetails(priceId: string | null) {
  if (!priceId) return null;
  
  return Object.values(stripeProducts).find(product => product.priceId === priceId) || null;
}

// Create checkout session for cart items
export const createCheckoutSession = async (cartItems: any[], userId: string) => {
  try {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        cartItems,
        userId,
      }),
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const session = await response.json();
    return session;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw new Error('Failed to create checkout session');
  }
}