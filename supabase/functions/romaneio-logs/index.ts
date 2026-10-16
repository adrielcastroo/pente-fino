import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = [
  "https://pente-fino.vercel.app",
  "http://localhost:5173",
  "http://localhost:3000",
];

function corsHeaders(origin: string) {
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Max-Age": "86400",
  };
}

async function getAuthenticatedUser(req: Request, supabase: ReturnType<typeof createClient>) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }
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
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    const user = await getAuthenticatedUser(req, supabase);
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders(req.headers.get("origin") ?? ""), "Content-Type": "application/json" },
      });
    }

    // 支持两种 action：list（查询日志列表）和 archive（写入日志）
    const url = new URL(req.url);
    const action = url.searchParams.get("action") ?? "list";

    if (action === "archive") {
      const body = await req.json();
      const { referencia, total_linhas, rows, observacao } = body;

      const { data, error } = await supabase
        .from("romaneio_automatico_logs")
        .insert({
          referencia,
          total_linhas,
          rows: typeof rows === "string" ? rows : JSON.stringify(rows),
          origem: "importacao_manual",
          status: "arquivado",
          observacao,
        })
        .select("id")
        .single();

      if (error) throw error;
      return new Response(JSON.stringify({ ok: true, id: data?.id }), {
        headers: { ...corsHeaders(req.headers.get("origin") ?? ""), "Content-Type": "application/json" },
      });
    }

    // default: list logs
    const { data, error } = await supabase
      .from("romaneio_automatico_logs")
      .select("*")
      .order("criado_em", { ascending: false })
      .limit(50);

    if (error) throw error;
    return new Response(JSON.stringify({ ok: true, data: data ?? [] }), {
      headers: { ...corsHeaders(req.headers.get("origin") ?? ""), "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ ok: false, error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders(req.headers.get("origin") ?? ""), "Content-Type": "application/json" },
    });
  }
});
