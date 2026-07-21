import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

type ProviderId = "cerebras" | "groq" | "nvidia" | "lovable";

interface ProviderCfg {
  id: ProviderId;
  label: string;
  envKey: string;
  probeUrl: string;
  authHeader: (key: string) => Record<string, string>;
  docs: string;
}

const PROVIDERS: ProviderCfg[] = [
  {
    id: "cerebras",
    label: "Cerebras",
    envKey: "CEREBRAS_API_KEY",
    probeUrl: "https://api.cerebras.ai/v1/models",
    authHeader: (k) => ({ Authorization: `Bearer ${k}` }),
    docs: "https://cloud.cerebras.ai",
  },
  {
    id: "groq",
    label: "Groq",
    envKey: "GROQ_API_KEY",
    probeUrl: "https://api.groq.com/openai/v1/models",
    authHeader: (k) => ({ Authorization: `Bearer ${k}` }),
    docs: "https://console.groq.com/keys",
  },
  {
    id: "nvidia",
    label: "NVIDIA NIM",
    envKey: "NVIDIA_API_KEY",
    probeUrl: "https://integrate.api.nvidia.com/v1/models",
    authHeader: (k) => ({ Authorization: `Bearer ${k}` }),
    docs: "https://build.nvidia.com",
  },
  {
    id: "lovable",
    label: "Lovable AI Gateway",
    envKey: "LOVABLE_API_KEY",
    probeUrl: "https://ai.gateway.lovable.dev/v1/models",
    authHeader: (k) => ({ "Lovable-API-Key": k }),
    docs: "https://docs.lovable.dev",
  },
];

function mask(k: string): string {
  if (!k) return "";
  if (k.length <= 8) return "•".repeat(k.length);
  return `${k.slice(0, 4)}${"•".repeat(Math.min(12, k.length - 8))}${k.slice(-4)}`;
}

async function probe(cfg: ProviderCfg, key: string) {
  const started = performance.now();
  try {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), 6000);
    const res = await fetch(cfg.probeUrl, {
      method: "GET",
      headers: { ...cfg.authHeader(key), Accept: "application/json" },
      signal: ac.signal,
    });
    clearTimeout(t);
    const latency = Math.round(performance.now() - started);
    let modelCount: number | null = null;
    if (res.ok) {
      try {
        const body = await res.json();
        if (Array.isArray(body?.data)) modelCount = body.data.length;
        else if (Array.isArray(body?.models)) modelCount = body.models.length;
      } catch { /* ignore */ }
    }
    return {
      ok: res.ok,
      httpStatus: res.status,
      latencyMs: latency,
      modelCount,
      error: res.ok ? null : `HTTP ${res.status}`,
    };
  } catch (err) {
    return {
      ok: false,
      httpStatus: 0,
      latencyMs: Math.round(performance.now() - started),
      modelCount: null,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Admin-only
    const service = createClient(SUPABASE_URL, SERVICE);
    const { data: roles } = await service
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id);
    const isAdmin = (roles ?? []).some((r: { role: string }) => r.role === "admin");
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results = await Promise.all(
      PROVIDERS.map(async (cfg) => {
        const key = Deno.env.get(cfg.envKey) ?? "";
        const configured = key.length > 0;
        const health = configured ? await probe(cfg, key) : null;
        return {
          id: cfg.id,
          label: cfg.label,
          envKey: cfg.envKey,
          configured,
          masked: configured ? mask(key) : null,
          length: configured ? key.length : 0,
          docs: cfg.docs,
          health,
        };
      }),
    );

    return new Response(
      JSON.stringify({ providers: results, checkedAt: new Date().toISOString() }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
