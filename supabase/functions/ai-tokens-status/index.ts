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
  usageProbe?: { url: string; body: unknown };
}

const PROVIDERS: ProviderCfg[] = [
  {
    id: "cerebras",
    label: "Cerebras",
    envKey: "CEREBRAS_API_KEY",
    probeUrl: "https://api.cerebras.ai/v1/models",
    authHeader: (k) => ({ Authorization: `Bearer ${k}` }),
    docs: "https://cloud.cerebras.ai",
    usageProbe: {
      url: "https://api.cerebras.ai/v1/chat/completions",
      body: { model: "llama-3.1-8b", messages: [{ role: "user", content: "hi" }], max_tokens: 1 },
    },
  },
  {
    id: "groq",
    label: "Groq",
    envKey: "GROQ_API_KEY",
    probeUrl: "https://api.groq.com/openai/v1/models",
    authHeader: (k) => ({ Authorization: `Bearer ${k}` }),
    docs: "https://console.groq.com/keys",
    usageProbe: {
      url: "https://api.groq.com/openai/v1/chat/completions",
      body: { model: "llama-3.1-8b-instant", messages: [{ role: "user", content: "hi" }], max_tokens: 1 },
    },
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

function parseResetToDate(v: string | null): string | null {
  if (!v) return null;
  const s = v.trim();
  // ISO date
  if (/^\d{4}-\d{2}-\d{2}T/.test(s)) {
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d.toISOString();
  }
  // Unix seconds
  if (/^\d{10}$/.test(s)) return new Date(parseInt(s, 10) * 1000).toISOString();
  // Unix ms
  if (/^\d{13}$/.test(s)) return new Date(parseInt(s, 10)).toISOString();
  // Duration like "1m30s", "45s", "2h", "500ms"
  const m = s.match(/^((\d+(?:\.\d+)?)h)?((\d+(?:\.\d+)?)m(?!s))?((\d+(?:\.\d+)?)s)?((\d+)ms)?$/);
  if (m) {
    const h = parseFloat(m[2] || "0");
    const min = parseFloat(m[4] || "0");
    const sec = parseFloat(m[6] || "0");
    const ms = parseFloat(m[8] || "0");
    const total = h * 3600000 + min * 60000 + sec * 1000 + ms;
    if (total > 0) return new Date(Date.now() + total).toISOString();
  }
  // Plain number: assume seconds from now
  if (/^\d+(\.\d+)?$/.test(s)) {
    return new Date(Date.now() + parseFloat(s) * 1000).toISOString();
  }
  return null;
}

function collectUsage(headers: Headers) {
  const pick = (k: string) => headers.get(k);
  const asNum = (v: string | null) => (v !== null && v !== "" && !isNaN(Number(v)) ? Number(v) : null);
  return {
    requestsLimit: asNum(pick("x-ratelimit-limit-requests")),
    requestsRemaining: asNum(pick("x-ratelimit-remaining-requests")),
    requestsReset: parseResetToDate(pick("x-ratelimit-reset-requests")),
    tokensLimit: asNum(pick("x-ratelimit-limit-tokens")),
    tokensRemaining: asNum(pick("x-ratelimit-remaining-tokens")),
    tokensReset: parseResetToDate(pick("x-ratelimit-reset-tokens")),
    retryAfter: parseResetToDate(pick("retry-after")),
  };
}

async function probe(cfg: ProviderCfg, key: string) {
  const started = performance.now();
  try {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), 8000);
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
      usage: collectUsage(res.headers),
    };
  } catch (err) {
    return {
      ok: false,
      httpStatus: 0,
      latencyMs: Math.round(performance.now() - started),
      modelCount: null,
      error: err instanceof Error ? err.message : String(err),
      usage: null,
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
