// Follow this setup guide to integrate the Deno runtime into your application:
// https://deno.land/manual/examples/deploy_node_app

import { createClient } from "npm:@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "npm:stripe@12.16.0";

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
      cartItems, 
      userId = 'guest', 
      successUrl = `${req.headers.get("origin")}/checkout/success`,
      cancelUrl = `${req.headers.get("origin")}/cart` 
    } = await req.json();

    // Validate the request
    if (!cartItems || !cartItems.length) {
      return new Response(
        JSON.stringify({ error: "Missing cart items" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400 
        }
      );
    }

    // Get the products details
    const productIds = cartItems.map((item: { productId: string }) => item.productId);
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, name, price, discount_price, type, creator_id")
      .in("id", productIds);

    if (productsError || !products.length) {
      return new Response(
        JSON.stringify({ error: "Could not fetch products", details: productsError }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400 
        }
      );
    }

    // Get creator details for each product
    const creatorIds = [...new Set(products.map(product => product.creator_id))];
    const { data: creators, error: creatorsError } = await supabase
      .from("creators")
      .select("id, stripe_connected_account_id, store_name")
      .in("id", creatorIds);

    if (creatorsError) {
      return new Response(
        JSON.stringify({ error: "Could not fetch creator data", details: creatorsError }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400 
        }
      );
    }

    // Create line items for Stripe
    const lineItems = products.map(product => {
      const cartItem = cartItems.find((item: { productId: string }) => item.productId === product.id);
      const price = product.discount_price || product.price;
      
      return {
        price_data: {
          currency: 'usd',
          product_data: {
            name: product.name,
            metadata: {
              product_id: product.id,
              product_type: product.type,
              creator_id: product.creator_id
            }
          },
          unit_amount: price, // Price in cents
        },
        quantity: cartItem.quantity || 1,
      };
    });

    // Create a Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: userId || 'guest',
      metadata: {
        user_id: userId || 'guest',
      },
      payment_intent_data: {
        metadata: {
          user_id: userId || 'guest',
        },
      },
    });

    return new Response(
      JSON.stringify({ id: session.id, url: session.url }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400 
      }
    );
  }
});