// Follow this setup guide to integrate the Deno runtime into your application:
// https://deno.land/manual/examples/deploy_node_app

import { createClient } from "npm:@supabase/supabase-js@2";
import Stripe from "npm:stripe@12.16.0";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    // Get env vars
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY") || "";

    // Initialize Supabase client with service role key (to bypass RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Initialize Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

    // Get request JSON data
    const { 
      userId, 
      email, 
      name,
      paymentMethodId,
      plan,
      price
    } = await req.json();

    // Validate the request
    if (!userId || !email || !paymentMethodId) {
      return new Response(
        JSON.stringify({ 
          data: { 
            success: false, 
            message: "Missing required data" 
          }
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400 
        }
      );
    }

    // Create a customer in Stripe
    const customer = await stripe.customers.create({
      email,
      name,
      payment_method: paymentMethodId,
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
      metadata: {
        user_id: userId,
      },
    });

    // First create a product
    const product = await stripe.products.create({
      name: `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan`,
      metadata: {
        user_id: userId,
      },
    });

    // Then create a price for the product
    const stripePrice = await stripe.prices.create({
      product: product.id,
      unit_amount: price * 100, // Convert to cents
      currency: 'usd',
      recurring: {
        interval: 'month',
      },
    });

    // Create a subscription with a trial period
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: stripePrice.id }],
      trial_period_days: 14,
      payment_settings: {
        payment_method_types: ['card'],
        save_default_payment_method: 'on_subscription',
      },
      metadata: {
        user_id: userId,
      },
    });

    // Update the user record with Stripe customer ID
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        stripe_customer_id: customer.id,
        stripe_payment_method: paymentMethodId,
        trial_ends_at: new Date(subscription.trial_end * 1000).toISOString(),
      })
      .eq('id', userId);

    if (updateError) {
      throw updateError;
    }

    return new Response(
      JSON.stringify({ 
        data: {
          success: true, 
          customerId: customer.id,
          subscriptionId: subscription.id,
          trialEnd: new Date(subscription.trial_end * 1000).toISOString(),
        }
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error creating Stripe customer:', error);
    
    return new Response(
      JSON.stringify({ 
        data: {
          success: false, 
          message: error.message || 'Failed to create Stripe customer'
        }
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});