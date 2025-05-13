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
    const { subscriptionId } = await req.json();

    // Validate the request
    if (!subscriptionId) {
      return new Response(
        JSON.stringify({ success: false, message: "Subscription ID is required" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400 
        }
      );
    }

    // Get auth user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, message: "Authorization header is required" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401 
        }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, message: "Unauthorized" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401 
        }
      );
    }

    // Get the subscription from the database
    const { data: subscriptionData, error: subscriptionError } = await supabase
      .from('stripe_subscriptions')
      .select('subscription_id, customer_id')
      .eq('price_id', subscriptionId)
      .single();

    if (subscriptionError || !subscriptionData) {
      return new Response(
        JSON.stringify({ success: false, message: "Subscription not found" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404 
        }
      );
    }

    // Verify the user owns this subscription
    const { data: customerData, error: customerError } = await supabase
      .from('stripe_customers')
      .select('user_id')
      .eq('customer_id', subscriptionData.customer_id)
      .single();

    if (customerError || !customerData || customerData.user_id !== user.id) {
      return new Response(
        JSON.stringify({ success: false, message: "Unauthorized to cancel this subscription" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 403 
        }
      );
    }

    // Cancel the subscription in Stripe
    if (subscriptionData.subscription_id) {
      await stripe.subscriptions.update(subscriptionData.subscription_id, {
        cancel_at_period_end: true,
      });
    }

    // Update the subscription in the database
    await supabase
      .from('stripe_subscriptions')
      .update({
        cancel_at_period_end: true,
        updated_at: new Date().toISOString()
      })
      .eq('subscription_id', subscriptionData.subscription_id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Subscription cancelled successfully. You will still have access until the end of your current billing period." 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: error.message || 'Failed to cancel subscription' 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});