import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { email, type, action } = await req.json();

    if (action === "forgot-password") {
      // 1. Rate Limit Check
      const { data: isAllowed, error: limitError } = await supabaseClient.rpc(
        "check_reset_rate_limit",
        { target_email: email, window_minutes: 15, max_attempts: 3 }
      );

      if (limitError || !isAllowed) {
        return new Response(
          JSON.stringify({ error: "Too many requests. Please try again in 15 minutes." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // 2. Audit Log - Request Started
      await supabaseClient.from("auth_audit_logs").insert({
        event_type: "forgot_password_request",
        email,
        status: "pending",
        ip_address: req.headers.get("x-forwarded-for") || "unknown",
      });

      // 3. Send Recovery Link/OTP via Supabase Auth
      // We don't reveal if user exists (security best practice)
      if (type === "otp") {
        const { error: otpError } = await supabaseClient.auth.signInWithOtp({
          email,
          options: {
            shouldCreateUser: false,
          },
        });
        if (otpError) throw otpError;
      } else {
        const { error: resetError } = await supabaseClient.auth.resetPasswordForEmail(email);
        if (resetError) throw resetError;
      }

      // 4. Update Audit Log - Success
      await supabaseClient.from("auth_audit_logs").insert({
        event_type: "forgot_password_request_sent",
        email,
        status: "success",
      });

      return new Response(
        JSON.stringify({ message: "If an account exists with this email, instructions have been sent." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
