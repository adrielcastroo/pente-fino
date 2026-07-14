// Edge Function: carrier-track
// Proxy unificado server-side para rastreamento multi-transportadora.
// - Elimina CORS (todas as chamadas externas rodam no servidor)
// - Não vaza tokens (Bearer/API keys ficam em Deno.env)
// - Tenta em cascata: Melhor Envio → Seu Rastreio (agregador BR) → SSW (com CNPJ) → Jamef público
// - Retorna TrackResponse unificado ou 404 com detalhes por transportadora
//
// POST body: { code: string, preferred?: string, cnpj?: string, nf?: string }

import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const SEURASTREIO_TOKEN = Deno.env.get('SEURASTREIO_TOKEN') || '';
const UA = 'Pente Fino ERP (adrielpompeo@gmail.com)';

// --- Types ---
type TrackingStatus =
  | 'pendente' | 'pagamento' | 'preparacao' | 'despachado'
  | 'em_transito' | 'entregue' | 'erro' | 'devolvido';

interface TrackingEvent {
  timestamp: string;
  status: TrackingStatus;
  location?: string;
  description: string;
  details?: Record<string, unknown>;
}

interface TrackResponse {
  code: string;
  carrier: string;
  status: TrackingStatus;
  events: TrackingEvent[];
  lastUpdate: string;
  raw?: unknown;
}

interface Attempt { carrier: string; reason: string; ok: boolean }

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function normalizeStatus(raw: string): TrackingStatus {
  const s = String(raw || '').toLowerCase();
  if (/entreg/.test(s) || /delivered/.test(s)) return 'entregue';
  if (/devolv|return/.test(s)) return 'devolvido';
  if (/erro|error|extrav|fail|suspend/.test(s)) return 'erro';
  if (/transit|encaminh|em rota/.test(s)) return 'em_transito';
  if (/despach|posted|coletad|expedid/.test(s)) return 'despachado';
  if (/prepar|manuseio|process/.test(s)) return 'preparacao';
  if (/pag/.test(s)) return 'pagamento';
  return 'pendente';
}

function admin() {
  return createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// --- Provider: Melhor Envio (via existing edge function to reuse OAuth token) ---
async function tryMelhorEnvio(code: string): Promise<TrackResponse> {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/melhor-envio`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SERVICE_KEY}`,
      apikey: SERVICE_KEY,
    },
    body: JSON.stringify({ action: 'track', code }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.error || `Melhor Envio HTTP ${res.status}`);
  return body as TrackResponse;
}

// --- Provider: Seu Rastreio (aggregator BR — covers many small carriers) ---
async function trySeuRastreio(code: string, preferred?: string): Promise<TrackResponse> {
  if (!SEURASTREIO_TOKEN) throw new Error('SEURASTREIO_TOKEN não configurado');
  // Seu Rastreio public API (v1). Attempts a couple of known endpoint shapes.
  const attempts = [
    { url: 'https://api.seurastreio.com.br/v1/tracking/query', body: { tracking_code: code, carrier: preferred } },
    { url: 'https://api.seurastreio.com.br/rastreios/consultar', body: { codigos: [code] } },
  ];
  let lastErr = '';
  for (const a of attempts) {
    try {
      const res = await fetch(a.url, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SEURASTREIO_TOKEN}`,
          'User-Agent': UA,
        },
        body: JSON.stringify(a.body),
      });
      if (!res.ok) { lastErr = `HTTP ${res.status}`; continue; }
      const data = await res.json().catch(() => ({}));
      const rawEvents: Array<Record<string, unknown>> =
        (data.events as never) || (data.eventos as never) ||
        (Array.isArray(data) ? data[0]?.eventos : null) || (data.data?.events as never) || [];
      if (!rawEvents.length) { lastErr = 'sem eventos'; continue; }
      const events: TrackingEvent[] = rawEvents.map((e) => ({
        timestamp: String(e.datetime || e.timestamp || e.data_hora || e.date || new Date().toISOString()),
        status: normalizeStatus(String(e.status || e.situacao || e.description || '')),
        location: (e.location || e.local || e.cidade) as string | undefined,
        description: String(e.description || e.descricao || e.situacao || e.status || ''),
        details: e,
      }));
      const last = events[events.length - 1];
      return {
        code, carrier: preferred || (data.carrier as string) || 'seurastreio',
        status: last?.status || 'pendente',
        events, lastUpdate: last?.timestamp || new Date().toISOString(), raw: data,
      };
    } catch (e) { lastErr = (e as Error).message; }
  }
  throw new Error(`Seu Rastreio: ${lastErr}`);
}

// --- Provider: SSW (Sistema Simples Web — plataforma pública usada por dezenas de carriers BR) ---
// Requer CNPJ do pagador + número da NF. Endpoint SOAP público.
async function trySSW(nf: string, cnpj: string, carrierHint?: string): Promise<TrackResponse> {
  const clean = { nf: nf.replace(/\D/g, ''), cnpj: cnpj.replace(/\D/g, '') };
  if (!clean.cnpj || clean.cnpj.length !== 14) throw new Error('SSW: CNPJ inválido');
  if (!clean.nf) throw new Error('SSW: NF inválida');

  const soap = `<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:urn="urn:sswinfbr.sswRastreio">
  <soapenv:Header/>
  <soapenv:Body>
    <urn:cliente>
      <cnpj>${clean.cnpj}</cnpj>
      <nro>${clean.nf}</nro>
    </urn:cliente>
  </soapenv:Body>
</soapenv:Envelope>`;
  const res = await fetch('https://ssw.inf.br/ws/sswRastreio/index.php', {
    method: 'POST',
    headers: { 'Content-Type': 'text/xml; charset=utf-8', SOAPAction: 'urn:sswinfbr.sswRastreio#cliente', 'User-Agent': UA },
    body: soap,
  });
  const xml = await res.text();
  if (!res.ok) throw new Error(`SSW HTTP ${res.status}`);

  // Parse SSW envelope: extract <ocorrencias> blocks
  const events: TrackingEvent[] = [];
  const blocks = xml.match(/<tracking[\s\S]*?<\/tracking>|<ocorrencia[\s\S]*?<\/ocorrencia>/gi) || [];
  const pick = (b: string, tag: string) => {
    const m = b.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'));
    return m ? m[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim() : '';
  };
  for (const b of blocks) {
    const desc = pick(b, 'ocorrencia') || pick(b, 'descricao') || pick(b, 'dominio');
    const data = pick(b, 'data_hora') || pick(b, 'data');
    const cidade = pick(b, 'cidade');
    if (!desc && !data) continue;
    events.push({
      timestamp: data ? new Date(data.replace(' ', 'T')).toISOString() : new Date().toISOString(),
      status: normalizeStatus(desc),
      location: cidade || undefined,
      description: desc,
      details: { raw: b.slice(0, 500) },
    });
  }
  if (!events.length) throw new Error('SSW: nenhum evento retornado (verifique CNPJ e NF)');
  const last = events[events.length - 1];
  return {
    code: nf, carrier: carrierHint || 'ssw',
    status: last.status, events,
    lastUpdate: last.timestamp, raw: { xml: xml.slice(0, 2000) },
  };
}

// --- Orchestration ---
async function trackAll(code: string, opts: { preferred?: string; cnpj?: string; nf?: string }): Promise<{ result?: TrackResponse; attempts: Attempt[] }> {
  const attempts: Attempt[] = [];

  // 1. Melhor Envio (código deve ser alfanumérico compatível)
  try {
    const r = await tryMelhorEnvio(code);
    attempts.push({ carrier: 'melhorenvio', ok: true, reason: 'ok' });
    return { result: r, attempts };
  } catch (e) { attempts.push({ carrier: 'melhorenvio', ok: false, reason: (e as Error).message }); }

  // 2. Seu Rastreio (agregador BR)
  if (SEURASTREIO_TOKEN) {
    try {
      const r = await trySeuRastreio(code, opts.preferred);
      attempts.push({ carrier: 'seurastreio', ok: true, reason: 'ok' });
      return { result: r, attempts };
    } catch (e) { attempts.push({ carrier: 'seurastreio', ok: false, reason: (e as Error).message }); }
  } else {
    attempts.push({ carrier: 'seurastreio', ok: false, reason: 'SEURASTREIO_TOKEN ausente' });
  }

  // 3. SSW — só se CNPJ + NF fornecidos (rastreio B2B de São Miguel/Aceville/Rodonaves/Jamef e outras)
  if (opts.cnpj && (opts.nf || code)) {
    try {
      const r = await trySSW(opts.nf || code, opts.cnpj, opts.preferred);
      attempts.push({ carrier: 'ssw', ok: true, reason: 'ok' });
      return { result: r, attempts };
    } catch (e) { attempts.push({ carrier: 'ssw', ok: false, reason: (e as Error).message }); }
  } else {
    attempts.push({ carrier: 'ssw', ok: false, reason: 'CNPJ do pagador é obrigatório para rastreio via SSW (São Miguel/Aceville/Rodonaves/Jamef e demais transportadoras fracionadas BR)' });
  }

  return { attempts };
}

// Ignore auth here (RLS protects the actual data table via trackingService).
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => ({}));
    const code = String(body.code || '').trim();
    if (!code) return json({ error: 'code obrigatório' }, 400);

    const { result, attempts } = await trackAll(code, {
      preferred: body.preferred,
      cnpj: body.cnpj,
      nf: body.nf,
    });

    if (result) {
      // Log audit (best-effort)
      admin().from('audit_logs').insert({
        action: 'INSERT', entity: 'tracking_query', entity_id: code,
        after_data: { carrier: result.carrier, events: result.events.length } as never,
      }).then(() => {}, () => {});
      return json(result);
    }

    return json({
      error: 'Nenhuma transportadora encontrou este código',
      attempts,
      hint: attempts.some(a => a.reason.includes('CNPJ'))
        ? 'Para transportadoras fracionadas B2B (Jamef, São Miguel, Aceville, Rodonaves, etc.), envie também o CNPJ do pagador e o número da NF.'
        : undefined,
    }, 404);
  } catch (e) {
    return json({ error: (e as Error).message || 'erro interno' }, 500);
  }
});
