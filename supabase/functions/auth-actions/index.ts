import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const ALLOWED_ORIGINS = [
  "https://pente-fino.vercel.app",
  "http://localhost:5173",
  "http://localhost:3000",
];
const ALLOWED_REDIRECT_PATHS = ["/reset-password", "/login", "/"];

function corsHeaders(origin: string) {
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin)
      ? origin
      : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Max-Age": "86400",
  };
}

async function getAuthenticatedUser(req: Request, supabase: ReturnType<typeof createClient>) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders(req.headers.get("origin") ?? "") });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Auth required: only logged-in users can request password reset/OTP
    const user = await getAuthenticatedUser(req, supabaseClient);
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders(req.headers.get("origin") ?? ""), "Content-Type": "application/json" },
      });
    }

    const { email, type, action, redirectTo } = await req.json();

    if (action === "forgot-password") {
      // 1. Rate Limit Check
      const { data: isAllowed, error: limitError } = await supabaseClient.rpc(
        "check_reset_rate_limit",
        { target_email: email, window_minutes: 15, max_attempts: 3 }
      );

      if (limitError || !isAllowed) {
        return new Response(
          JSON.stringify({ error: "Too many requests. Please try again in 15 minutes." }),
          { status: 429, headers: { ...corsHeaders(req.headers.get("origin") ?? ""), "Content-Type": "application/json" } }
        );
      }

      // 2. Audit Log - Request Started
      await supabaseClient.rpc("log_auth_event", {
        p_event_type: "forgot_password_request",
        p_email: email,
        p_status: "pending",
        p_metadata: { ip_address: req.headers.get("x-forwarded-for") || "unknown" },
      });

      // 3. Send Recovery Link/OTP via Supabase Auth
      if (type === "otp") {
        await supabaseClient.auth.signInWithOtp({
          email,
          options: {
            shouldCreateUser: false,
          },
        });
      } else {
        const safeRedirect = ALLOWED_REDIRECT_PATHS.includes(redirectTo)
          ? redirectTo
          : "/reset-password";
        await supabaseClient.auth.resetPasswordForEmail(email, { redirectTo: safeRedirect });
      }

      // 4. Update Audit Log - Success
      await supabaseClient.rpc("log_auth_event", {
        p_event_type: "forgot_password_request_sent",
        p_email: email,
        p_status: "success",
      });

      return new Response(
        JSON.stringify({ message: "If an account exists with this email, instructions have been sent." }),
        { status: 200, headers: { ...corsHeaders(req.headers.get("origin") ?? ""), "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders(req.headers.get("origin") ?? ""), "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders(req.headers.get("origin") ?? ""), "Content-Type": "application/json" },
    });
  }
});
