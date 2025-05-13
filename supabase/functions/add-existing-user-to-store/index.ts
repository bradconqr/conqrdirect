// Follow this setup guide to integrate the Deno runtime into your application:
// https://deno.land/manual/examples/deploy_node_app

import { createClient } from "npm:@supabase/supabase-js@2";
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

    // Initialize Supabase client with service role key (to bypass RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get request JSON data
    const { creatorId, email, fullName } = await req.json();

    // Validate the request
    if (!creatorId || !email) {
      return new Response(
        JSON.stringify({ success: false, message: "Missing required data" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400 
        }
      );
    }

    // Check if the user exists
    const { data: existingUser, error: userError } = await supabase
      .from('auth.users')
      .select('id, email')
      .eq('email', email)
      .maybeSingle();

    if (userError) {
      return new Response(
        JSON.stringify({ success: false, message: "Error checking user existence" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500 
        }
      );
    }

    if (!existingUser) {
      // User doesn't exist, create an invitation
      const { data: invitation, error: inviteError } = await supabase
        .from('store_invitations')
        .insert({
          creator_id: creatorId,
          email: email,
          message: `You've been added as a contact by a creator.`,
          created_at: new Date().toISOString()
        })
        .select();

      if (inviteError) {
        return new Response(
          JSON.stringify({ success: false, message: "Error creating invitation" }),
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500 
          }
        );
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Invitation sent to user", 
          invitation: invitation 
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200 
        }
      );
    }

    // User exists, check if they're already associated with this creator
    const { data: existingStoreUser, error: storeUserError } = await supabase
      .from('store_users')
      .select('id')
      .eq('user_id', existingUser.id)
      .eq('creator_id', creatorId)
      .maybeSingle();

    if (storeUserError) {
      return new Response(
        JSON.stringify({ success: false, message: "Error checking store association" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500 
        }
      );
    }

    if (existingStoreUser) {
      return new Response(
        JSON.stringify({ success: false, message: "User is already a contact" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400 
        }
      );
    }

    // Add the user to the store
    const { data: newStoreUser, error: createError } = await supabase
      .from('store_users')
      .insert({
        user_id: existingUser.id,
        creator_id: creatorId,
        created_at: new Date().toISOString(),
        is_subscribed: true
      })
      .select();

    if (createError) {
      return new Response(
        JSON.stringify({ success: false, message: "Error adding user to store" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500 
        }
      );
    }

    // Update user's full name if provided
    if (fullName) {
      const { error: updateError } = await supabase
        .from('users')
        .update({ full_name: fullName })
        .eq('id', existingUser.id);

      if (updateError) {
        console.error("Error updating user name:", updateError);
        // Continue anyway since the main operation succeeded
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "User added to contacts successfully", 
        storeUser: newStoreUser 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, message: error.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});