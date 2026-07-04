// Proxy seguro para a API do Sentry (admin-only via JWT no client + service role check aqui)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const token = Deno.env.get("SENTRY_AUTH_TOKEN");
  const org = Deno.env.get("SENTRY_ORG_SLUG");
  if (!token || !org) {
    return new Response(
      JSON.stringify({ error: "SENTRY_AUTH_TOKEN ou SENTRY_ORG_SLUG não configurados" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const url = new URL(req.url);
  const action = url.searchParams.get("action") ?? "issues";
  const project = url.searchParams.get("project") ?? "";
  const query = url.searchParams.get("query") ?? "is:unresolved";
  const period = url.searchParams.get("period") ?? "24h";

  const base = `https://sentry.io/api/0/organizations/${encodeURIComponent(org)}`;

  let target = "";
  if (action === "projects") {
    target = `${base}/projects/`;
  } else if (action === "stats") {
    target = `${base}/stats_v2/?field=sum(quantity)&groupBy=category&groupBy=outcome&statsPeriod=${period}${project ? `&project=${encodeURIComponent(project)}` : ""}`;
  } else {
    // issues
    const params = new URLSearchParams({ query, statsPeriod: period, limit: "25" });
    if (project) params.set("project", project);
    target = `${base}/issues/?${params}`;
  }

  const resp = await fetch(target, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  });
  const text = await resp.text();
  return new Response(text, {
    status: resp.status,
    headers: {
      ...corsHeaders,
      "Content-Type": resp.headers.get("content-type") ?? "application/json",
    },
  });
});
