// Proxy para a API do PostHog (analytics/events/insights)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const phErrorMessage = (status: number, text: string) => {
  let detail = text;
  try {
    const parsed = JSON.parse(text);
    detail = parsed?.detail ?? parsed?.message ?? text;
  } catch { /* ignore */ }
  if (status === 401 || status === 403) {
    return {
      error: `PostHog retornou ${status}`,
      detail:
        "O token do PostHog foi rejeitado ou não tem permissão. Gere um Personal API Key com escopos read para 'query', 'insight' e 'event_definition' e atualize POSTHOG_API_KEY.",
      posthogDetail: detail,
    };
  }
  return { error: `PostHog retornou ${status}`, detail: String(detail).slice(0, 500) };
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const key = Deno.env.get("POSTHOG_API_KEY");
    const projectId = Deno.env.get("POSTHOG_PROJECT_ID");
    const host = Deno.env.get("POSTHOG_HOST") ?? "https://us.posthog.com";
    if (!key || !projectId) {
      return json({ error: "POSTHOG_API_KEY / POSTHOG_PROJECT_ID não configurados", results: [] });
    }
    if (!/^\d+$/.test(projectId)) {
      return json({
        error:
          "POSTHOG_PROJECT_ID inválido: deve ser o ID numérico do projeto (ex.: 12345), não a chave 'phc_...'. Encontre em Settings → Project → Project ID no PostHog.",
        results: [],
      });
    }

    const url = new URL(req.url);
    const action = url.searchParams.get("action") ?? "events";
    const period = url.searchParams.get("period") ?? "-24h";
    const eventFilter = url.searchParams.get("event") ?? "";
    const limit = url.searchParams.get("limit") ?? "50";

    const base = `${host.replace(/\/$/, "")}/api/projects/${encodeURIComponent(projectId)}`;
    const auth = { Authorization: `Bearer ${key}`, "Content-Type": "application/json" };

    let target = "";
    let init: RequestInit = { headers: auth };
    if (action === "insights") {
      target = `${base}/insights/?limit=20`;
    } else if (action === "event_definitions") {
      target = `${base}/event_definitions/?limit=200`;
    } else if (action === "trend") {
      const event = eventFilter || "$pageview";
      const q = {
        query: {
          kind: "TrendsQuery",
          series: [{ kind: "EventsNode", event, math: "total" }],
          dateRange: { date_from: period },
          interval: period.includes("h") ? "hour" : "day",
        },
      };
      target = `${base}/query/`;
      init = { method: "POST", headers: auth, body: JSON.stringify(q) };
    } else {
      const params = new URLSearchParams({ limit });
      if (eventFilter) params.set("event", eventFilter);
      if (period) params.set("after", isoFromRelative(period));
      target = `${base}/events/?${params}`;
    }

    let r: Response;
    try {
      r = await fetch(target, init);
    } catch (e) {
      return json({ error: `Falha de rede ao contactar PostHog: ${String(e)}`, results: [] });
    }
    const text = await r.text();
    if (!r.ok) {
      return json({ ...phErrorMessage(r.status, text), results: [] });
    }
    let data: any = {};
    try { data = JSON.parse(text); } catch { data = {}; }
    return json(data);
  } catch (e) {
    return json({ error: `Erro interno: ${String(e)}`, results: [] });
  }
});

function isoFromRelative(rel: string): string {
  const m = /^-(\d+)([hd])$/.exec(rel);
  if (!m) return new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const n = Number(m[1]);
  const ms = m[2] === "h" ? n * 3600_000 : n * 86_400_000;
  return new Date(Date.now() - ms).toISOString();
}
