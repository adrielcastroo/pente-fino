// Proxy seguro para a API do Sentry
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const token = Deno.env.get("SENTRY_AUTH_TOKEN");
    const org = Deno.env.get("SENTRY_ORG_SLUG");
    if (!token || !org) {
      return json({ error: "SENTRY_AUTH_TOKEN ou SENTRY_ORG_SLUG não configurados", issues: [] }, 200);
    }

    // Aceita parâmetros via querystring OU via body JSON (invoke com body)
    const url = new URL(req.url);
    let body: Record<string, any> = {};
    if (req.method !== "GET" && req.method !== "HEAD") {
      try { body = await req.json(); } catch { body = {}; }
    }
    const p = (k: string, d = "") =>
      (body?.[k] as string | undefined) ?? url.searchParams.get(k) ?? d;

    const action = p("action", "issues");
    const project = p("project", "");
    const query = p("query", "is:unresolved");
    const period = p("period", "24h");
    const limit = p("limit", "25");

    const base = `https://sentry.io/api/0/organizations/${encodeURIComponent(org)}`;
    let target = "";
    if (action === "projects") {
      target = `${base}/projects/`;
    } else if (action === "stats" || action === "stats_v2") {
      target = `${base}/stats_v2/?field=sum(quantity)&groupBy=category&groupBy=outcome&statsPeriod=${period}${project ? `&project=${encodeURIComponent(project)}` : ""}`;
    } else {
      const params = new URLSearchParams({ query, statsPeriod: period, limit: String(limit) });
      if (project) params.set("project", project);
      target = `${base}/issues/?${params}`;
    }

    let resp: Response;
    try {
      resp = await fetch(target, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
    } catch (e) {
      // Falha de rede — não derruba a função
      return json({ error: `Falha de rede ao contactar Sentry: ${String(e)}`, issues: [] }, 200);
    }

    const text = await resp.text();
    if (!resp.ok) {
      return json(
        { error: `Sentry retornou ${resp.status}`, detail: text.slice(0, 500), issues: [] },
        200,
      );
    }

    let data: unknown = [];
    try { data = JSON.parse(text); } catch { data = []; }

    // Padroniza retorno para o widget/tab: sempre { issues: [...] } quando action=issues
    if (action === "issues") {
      return json({ issues: Array.isArray(data) ? data : [] });
    }
    return json(data);
  } catch (e) {
    // Nunca deixar a função crashar sem resposta
    return json({ error: `Erro interno: ${String(e)}`, issues: [] }, 200);
  }
});
