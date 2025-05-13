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
    // Get request JSON data
    const { publishableKey, secretKey } = await req.json();

    // Validate the request
    if (!publishableKey || !secretKey) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Both publishable key and secret key are required" 
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400 
        }
      );
    }

    // Validate key formats
    if (!publishableKey.startsWith('pk_')) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Invalid publishable key format. It should start with 'pk_'" 
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400 
        }
      );
    }

    if (!secretKey.startsWith('sk_')) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Invalid secret key format. It should start with 'sk_'" 
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400 
        }
      );
    }

    // Initialize Stripe with the provided secret key
    const stripe = new Stripe(secretKey, {
      apiVersion: "2023-10-16",
    });

    // Test the connection by making a simple API call
    try {
      // Attempt to retrieve account information
      const account = await stripe.account.retrieve();
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Stripe connection successful",
          accountId: account.id
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200 
        }
      );
    } catch (stripeError: any) {
      console.error('Stripe API error:', stripeError);
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: stripeError.message || "Failed to connect to Stripe API"
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400 
        }
      );
    }
  } catch (error: any) {
    console.error('Error testing Stripe connection:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: error.message || "An unexpected error occurred"
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});