// Proxy genérico para webhooks n8n do usuário.
// Sempre responde 200 para que o cliente consiga ler o corpo real
// (o Supabase functions.invoke lança erro genérico em status não-2xx).

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (payload: unknown) =>
  new Response(JSON.stringify(payload), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, method = "POST", body, headers } = await req.json();

    if (!url || typeof url !== "string") {
      return json({ ok: false, error: "url é obrigatório" });
    }

    let upstream: Response;
    try {
      upstream = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", ...(headers || {}) },
        body: body !== undefined
          ? (typeof body === "string" ? body : JSON.stringify(body))
          : undefined,
      });
    } catch (e) {
      return json({
        ok: false,
        error: `Não foi possível alcançar o webhook: ${(e as Error).message}. ` +
          `Verifique se a URL é acessível pela internet (localhost não funciona).`,
      });
    }

    const text = await upstream.text();
    let data: unknown = text;
    try { data = JSON.parse(text); } catch { /* keep text */ }

    return json({
      ok: upstream.ok,
      status: upstream.status,
      data,
      ...(upstream.ok ? {} : { error: `Webhook respondeu ${upstream.status}: ${text.slice(0, 300)}` }),
    });
  } catch (e) {
    return json({ ok: false, error: (e as Error).message || "proxy_failed" });
  }
});
