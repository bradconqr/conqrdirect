import { createClient } from "npm:@supabase/supabase-js@2";
import Stripe from "npm:stripe@12.16.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
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

    // Initialize Supabase client with service role key (to bypass RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get request JSON data
    const { product } = await req.json();

    // Validate the request
    if (!product || !product.id) {
      return new Response(
        JSON.stringify({ error: "Missing product data" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400 
        }
      );
    }

    // Fetch the creator for this product to get their Stripe keys
    const { data: creator, error: creatorError } = await supabase
      .from("creators")
      .select("social_links")
      .eq("id", product.creator_id)
      .single();

    if (creatorError) {
      return new Response(
        JSON.stringify({ error: "Could not fetch creator data", details: creatorError }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400 
        }
      );
    }

    // Get Stripe secret key from creator's social links
    const stripeSecretKey = creator.social_links?.stripe_secret_key;
    if (!stripeSecretKey) {
      return new Response(
        JSON.stringify({ error: "Stripe secret key not configured for this creator" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400 
        }
      );
    }

    // Initialize Stripe with the creator's secret key
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

    // Check if the product already exists in Stripe
    const { data: metadata, error: metadataError } = await supabase
      .from("product_metadata")
      .select("stripe_product_id, stripe_price_id")
      .eq("product_id", product.id)
      .maybeSingle();

    let stripeProduct;
    let stripePrice;

    // If the product already has a Stripe ID, update it; otherwise create it
    if (metadata?.stripe_product_id) {
      // Update existing product
      stripeProduct = await stripe.products.update(
        metadata.stripe_product_id,
        {
          name: product.name,
          description: product.description,
          images: product.thumbnail ? [product.thumbnail] : undefined,
          metadata: {
            product_id: product.id,
            creator_id: product.creator_id,
            product_type: product.type,
          },
          active: !!product.published_at,
        }
      );

      // Update or create a new price if the price has changed
      if (metadata?.stripe_price_id) {
        // We can't update the amount of an existing price, so we need to create a new one
        // and update our metadata
        const currentPrice = await stripe.prices.retrieve(metadata.stripe_price_id);
        
        if (currentPrice.unit_amount !== product.price) {
          // Create a new price
          stripePrice = await stripe.prices.create({
            product: stripeProduct.id,
            unit_amount: product.price,
            currency: 'usd',
            metadata: {
              product_id: product.id,
            },
          });

          // Update our metadata with the new price ID
          await supabase
            .from("product_metadata")
            .update({ 
              stripe_price_id: stripePrice.id,
              updated_at: new Date().toISOString()
            })
            .eq("product_id", product.id);
        } else {
          stripePrice = currentPrice;
        }
      } else {
        // Create a price for an existing product that doesn't have one
        stripePrice = await stripe.prices.create({
          product: stripeProduct.id,
          unit_amount: product.price,
          currency: 'usd',
          metadata: {
            product_id: product.id,
          },
        });

        // Update metadata with the new price ID
        await supabase
          .from("product_metadata")
          .update({ 
            stripe_price_id: stripePrice.id,
            updated_at: new Date().toISOString()
          })
          .eq("product_id", product.id);
      }
    } else {
      // Create a new product in Stripe
      stripeProduct = await stripe.products.create({
        name: product.name,
        description: product.description,
        images: product.thumbnail ? [product.thumbnail] : undefined,
        metadata: {
          product_id: product.id,
          creator_id: product.creator_id,
          product_type: product.type,
        },
        active: !!product.published_at,
      });

      // Create a price for the new product
      stripePrice = await stripe.prices.create({
        product: stripeProduct.id,
        unit_amount: product.price,
        currency: 'usd',
        metadata: {
          product_id: product.id,
        },
      });

      // Store the Stripe product and price IDs in our database
      await supabase
        .from("product_metadata")
        .insert({
          product_id: product.id,
          stripe_product_id: stripeProduct.id,
          stripe_price_id: stripePrice.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        stripeProductId: stripeProduct.id,
        stripePriceId: stripePrice.id
      }),
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