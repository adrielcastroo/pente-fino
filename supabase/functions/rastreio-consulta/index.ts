// supabase/functions/rastreio-consulta/index.ts
// Proxy para consulta de rastreamento (Seu Rastreio) + cache em expedicao_rastreio_eventos.
// Requer secret SEURASTREIO_TOKEN. Sem o token, retorna 501 com instruções.

import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return json({ error: 'Unauthorized' }, 401);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !anonKey || !serviceKey) return json({ error: 'Config error' }, 500);

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claims } = await userClient.auth.getClaims(authHeader.replace('Bearer ', ''));
    if (!claims?.claims) return json({ error: 'Unauthorized' }, 401);

    const body = await req.json().catch(() => ({}));
    const cargaId: string | undefined = body?.carga_id;
    if (!cargaId) return json({ error: 'carga_id obrigatório' }, 400);

    const admin = createClient(supabaseUrl, serviceKey);

    const { data: carga, error: cargaErr } = await admin
      .from('expedicao_cargas')
      .select('id, codigo_rastreio, transportadora_tipo')
      .eq('id', cargaId)
      .maybeSingle();
    if (cargaErr) return json({ error: cargaErr.message }, 500);
    if (!carga) return json({ error: 'Carga não encontrada' }, 404);
    if (!carga.codigo_rastreio) return json({ error: 'Carga sem código de rastreio' }, 400);

    const token = Deno.env.get('SEURASTREIO_TOKEN');
    if (!token) {
      return json({
        error: 'SEURASTREIO_TOKEN não configurado',
        hint: 'Cadastre a chave da API do Seu Rastreio nos secrets do projeto para habilitar consulta automática.',
      }, 501);
    }

    // Seu Rastreio API — https://seurastreio.com.br/api-docs
    const url = `https://api.seurastreio.com.br/v1/rastreios/${encodeURIComponent(carga.codigo_rastreio)}`;
    const resp = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    });
    if (!resp.ok) {
      const txt = await resp.text().catch(() => '');
      return json({ error: `Provedor retornou ${resp.status}`, detail: txt.slice(0, 500) }, 502);
    }

    const payload = await resp.json();
    // Estrutura defensiva — normalizamos os eventos
    const rawEvents: any[] =
      payload?.eventos ?? payload?.events ?? payload?.data?.eventos ?? [];

    const rows = rawEvents
      .map((e) => {
        const iso = e.data ?? e.data_evento ?? e.dtHrCriado ?? e.date;
        if (!iso) return null;
        return {
          carga_id: cargaId,
          data_evento: new Date(iso).toISOString(),
          status: e.status ?? e.situacao ?? e.tipo ?? null,
          local: e.local ?? e.cidade ?? e.origem ?? null,
          descricao: e.descricao ?? e.mensagem ?? e.detalhe ?? null,
          raw: e,
        };
      })
      .filter(Boolean);

    let inseridos = 0;
    if (rows.length > 0) {
      const { error: upErr, count } = await admin
        .from('expedicao_rastreio_eventos')
        .upsert(rows, { onConflict: 'carga_id,data_evento,status', count: 'exact', ignoreDuplicates: true });
      if (upErr) return json({ error: upErr.message }, 500);
      inseridos = count ?? 0;
    }

    return json({ ok: true, total: rows.length, novos: inseridos });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
