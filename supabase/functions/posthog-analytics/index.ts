// Proxy para a API do PostHog (analytics/events/insights)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const key = Deno.env.get("POSTHOG_API_KEY");
  const projectId = Deno.env.get("POSTHOG_PROJECT_ID");
  const host = Deno.env.get("POSTHOG_HOST") ?? "https://us.posthog.com";
  if (!key || !projectId) {
    return new Response(
      JSON.stringify({ error: "POSTHOG_API_KEY / POSTHOG_PROJECT_ID não configurados" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const url = new URL(req.url);
  const action = url.searchParams.get("action") ?? "events";
  const period = url.searchParams.get("period") ?? "-24h";
  const eventFilter = url.searchParams.get("event") ?? "";
  const limit = url.searchParams.get("limit") ?? "50";

  const base = `${host.replace(/\/$/, "")}/api/projects/${encodeURIComponent(projectId)}`;
  const auth = { Authorization: `Bearer ${key}`, "Content-Type": "application/json" };

  try {
    if (action === "insights") {
      const r = await fetch(`${base}/insights/?limit=20`, { headers: auth });
      return new Response(await r.text(), { status: r.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (action === "event_definitions") {
      const r = await fetch(`${base}/event_definitions/?limit=200`, { headers: auth });
      return new Response(await r.text(), { status: r.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (action === "trend") {
      // Trend do evento nos últimos N períodos via HogQL
      const event = eventFilter || "$pageview";
      const q = {
        query: {
          kind: "TrendsQuery",
          series: [{ kind: "EventsNode", event, math: "total" }],
          dateRange: { date_from: period },
          interval: period.includes("h") ? "hour" : "day",
        },
      };
      const r = await fetch(`${base}/query/`, { method: "POST", headers: auth, body: JSON.stringify(q) });
      return new Response(await r.text(), { status: r.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    // default: events recentes
    const params = new URLSearchParams({ limit });
    if (eventFilter) params.set("event", eventFilter);
    if (period) params.set("after", isoFromRelative(period));
    const r = await fetch(`${base}/events/?${params}`, { headers: auth });
    return new Response(await r.text(), { status: r.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function isoFromRelative(rel: string): string {
  const m = /^-(\d+)([hd])$/.exec(rel);
  if (!m) return new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const n = Number(m[1]);
  const ms = m[2] === "h" ? n * 3600_000 : n * 86_400_000;
  return new Date(Date.now() - ms).toISOString();
}
