// Admin Users Management Edge Function
// Handles all admin operations with service role to bypass RLS

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client with user's auth token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    // Check if user is admin using service role (bypasses RLS)
    const serviceSupabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: profile, error: profileError } = await serviceSupabase
      .from("profiles")
      .select("is_admin")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile?.is_admin) {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request
    const { action, ...params } = await req.json();

    // Handle different admin actions
    switch (action) {
      case "getAllUsers": {
        const { data, error } = await serviceSupabase
          .from("profiles")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, data }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "updateUserSubscription": {
        const { userId, plan, expiresAt } = params;
        
        const { data, error } = await serviceSupabase
          .from("profiles")
          .update({
            subscription_plan: plan,
            subscription_expires_at: expiresAt || null,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId)
          .select()
          .single();

        if (error) throw error;

        // Log admin action
        await serviceSupabase.from("admin_audit_log").insert({
          admin_user_id: user.id,
          action_type: "subscription_change",
          target_user_id: userId,
          details: { plan, expires_at: expiresAt },
        });

        return new Response(
          JSON.stringify({ success: true, data }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "toggleUserActive": {
        const { userId, isActive } = params;
        
        const { data, error } = await serviceSupabase
          .from("profiles")
          .update({ is_active: isActive })
          .eq("user_id", userId)
          .select()
          .single();

        if (error) throw error;

        // Log admin action
        await serviceSupabase.from("admin_audit_log").insert({
          admin_user_id: user.id,
          action_type: isActive ? "user_activated" : "user_deactivated",
          target_user_id: userId,
        });

        return new Response(
          JSON.stringify({ success: true, data }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "getStats": {
        const [usersResult, brokersResult, tradesResult, trialsResult] = await Promise.all([
          serviceSupabase.from("profiles").select("id", { count: "exact", head: true }),
          serviceSupabase.from("broker_accounts").select("id", { count: "exact", head: true }).eq("is_active", true),
          serviceSupabase.from("trades").select("id", { count: "exact", head: true }),
          serviceSupabase.from("profiles").select("id", { count: "exact", head: true }).eq("subscription_plan", "trial"),
        ]);

        return new Response(
          JSON.stringify({
            success: true,
            data: {
              totalUsers: usersResult.count || 0,
              activeBrokers: brokersResult.count || 0,
              totalTrades: tradesResult.count || 0,
              trialUsers: trialsResult.count || 0,
            },
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "getSettings": {
        const { data, error } = await serviceSupabase
          .from("admin_settings")
          .select("*");

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, data }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "updateSetting": {
        const { key, value } = params;
        
        const { data, error } = await serviceSupabase
          .from("admin_settings")
          .upsert({
            setting_key: key,
            setting_value: value,
            updated_by: user.id,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: "setting_key",
          })
          .select()
          .single();

        if (error) throw error;

        // Log admin action
        await serviceSupabase.from("admin_audit_log").insert({
          admin_user_id: user.id,
          action_type: "settings_update",
          details: { key, value },
        });

        return new Response(
          JSON.stringify({ success: true, data }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error: any) {
    console.error("Admin function error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

