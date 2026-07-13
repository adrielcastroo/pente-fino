// Auge (Unilux ERP) -> Pente Fino stock sync
// Scraper de leitura autenticado. Sem API oficial.
// Precisa de: AUGE_BASE_URL, AUGE_USERNAME, AUGE_PASSWORD

import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const AUGE_BASE_URL = Deno.env.get('AUGE_BASE_URL') ?? 'https://unilux.auge.app';
const AUGE_USERNAME = Deno.env.get('AUGE_USERNAME') ?? '';
const AUGE_PASSWORD = Deno.env.get('AUGE_PASSWORD') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface SaldoRow {
  codigo: string;
  descricao?: string;
  deposito: string;
  quantidade: number;
  unidade?: string;
  raw?: unknown;
}

// ---------- Cookie jar minimalista ----------
class Jar {
  private store = new Map<string, string>();
  ingest(res: Response) {
    // Deno agrega Set-Cookie em getSetCookie()
    const cookies = (res.headers as any).getSetCookie?.() ?? [];
    for (const c of cookies) {
      const [pair] = c.split(';');
      const eq = pair.indexOf('=');
      if (eq > 0) this.store.set(pair.slice(0, eq).trim(), pair.slice(eq + 1).trim());
    }
  }
  header(): string {
    return [...this.store.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
  }
}

// ---------- Login (form-based, tenta descoberta) ----------
async function login(jar: Jar): Promise<void> {
  // 1) GET página de login para pegar cookies iniciais + eventual csrf/token
  const loginPageRes = await fetch(`${AUGE_BASE_URL}/login`, {
    redirect: 'manual',
    headers: { 'User-Agent': 'PenteFinoBot/1.0' },
  });
  jar.ingest(loginPageRes);
  const loginHtml = await loginPageRes.text();

  // Detecta token CSRF comum (Laravel/Django/Rails)
  const csrfMatch =
    loginHtml.match(/name="_token"\s+value="([^"]+)"/i) ||
    loginHtml.match(/name="csrf-token"\s+content="([^"]+)"/i) ||
    loginHtml.match(/name="csrfmiddlewaretoken"\s+value="([^"]+)"/i);
  const csrf = csrfMatch?.[1];

  // 2) POST credenciais. Nomes de campo comuns; ajustar após HAR real.
  const body = new URLSearchParams();
  body.set('email', AUGE_USERNAME);
  body.set('username', AUGE_USERNAME);
  body.set('user', AUGE_USERNAME);
  body.set('login', AUGE_USERNAME);
  body.set('password', AUGE_PASSWORD);
  body.set('senha', AUGE_PASSWORD);
  if (csrf) body.set('_token', csrf);

  const postRes = await fetch(`${AUGE_BASE_URL}/login`, {
    method: 'POST',
    redirect: 'manual',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': jar.header(),
      'Referer': `${AUGE_BASE_URL}/login`,
      'User-Agent': 'PenteFinoBot/1.0',
      ...(csrf ? { 'X-CSRF-TOKEN': csrf } : {}),
    },
    body,
  });
  jar.ingest(postRes);

  // Sucesso geralmente = 302 para /home ou /dashboard
  if (postRes.status !== 302 && postRes.status !== 200) {
    throw new Error(`Login Auge falhou (HTTP ${postRes.status}). Verifique campos do formulário reais.`);
  }
}

// ---------- Scrape do saldo ----------
// TODO: ajustar path e parser após inspecionar a tela real de estoque do Auge.
async function fetchSaldos(jar: Jar): Promise<SaldoRow[]> {
  const candidates = [
    '/api/estoque/saldos',
    '/estoque/saldos.json',
    '/estoque',
    '/relatorios/saldo-estoque',
  ];

  for (const path of candidates) {
    const res = await fetch(`${AUGE_BASE_URL}${path}`, {
      headers: {
        'Cookie': jar.header(),
        'Accept': 'application/json, text/html;q=0.9',
        'User-Agent': 'PenteFinoBot/1.0',
      },
    });
    if (!res.ok) continue;
    const ct = res.headers.get('content-type') ?? '';
    if (ct.includes('application/json')) {
      const data = await res.json();
      const arr = Array.isArray(data) ? data : (data.data ?? data.rows ?? data.items ?? []);
      if (!Array.isArray(arr) || arr.length === 0) continue;
      return arr.map((r: any) => ({
        codigo: String(r.codigo ?? r.sku ?? r.produto ?? '').trim(),
        descricao: r.descricao ?? r.nome ?? undefined,
        deposito: String(r.deposito ?? r.armazem ?? 'PADRAO'),
        quantidade: Number(r.saldo ?? r.quantidade ?? r.qtd ?? 0),
        unidade: r.unidade ?? r.un ?? undefined,
        raw: r,
      })).filter(r => r.codigo);
    }
    // Fallback: parse tabela HTML — placeholder até termos o HTML real
    const html = await res.text();
    if (html.includes('<table')) {
      return parseHtmlTable(html);
    }
  }
  throw new Error('Nenhum endpoint conhecido de saldo respondeu. Colar HAR de /estoque para eu ajustar o parser.');
}

function parseHtmlTable(html: string): SaldoRow[] {
  const rows: SaldoRow[] = [];
  const trRe = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  const tdRe = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
  let m: RegExpExecArray | null;
  while ((m = trRe.exec(html))) {
    const cells: string[] = [];
    let c: RegExpExecArray | null;
    while ((c = tdRe.exec(m[1]))) cells.push(c[1].replace(/<[^>]+>/g, '').trim());
    if (cells.length >= 3 && /^[A-Z0-9-]+$/i.test(cells[0])) {
      rows.push({
        codigo: cells[0],
        descricao: cells[1],
        deposito: cells[2] || 'PADRAO',
        quantidade: Number(cells[3]?.replace(/\./g, '').replace(',', '.') || 0),
        unidade: cells[4],
      });
    }
  }
  return rows;
}

// ---------- Handler ----------
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
  const authHeader = req.headers.get('Authorization');
  let triggeredBy: string | null = null;
  if (authHeader?.startsWith('Bearer ')) {
    const anon = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data } = await anon.auth.getClaims(authHeader.replace('Bearer ', ''));
    triggeredBy = data?.claims?.sub ?? null;
  }

  const { data: run } = await admin
    .from('auge_sync_runs')
    .insert({ status: 'running', triggered_by: triggeredBy })
    .select('id')
    .single();
  const runId = run?.id;

  try {
    if (!AUGE_USERNAME || !AUGE_PASSWORD) {
      throw new Error('Credenciais AUGE_USERNAME / AUGE_PASSWORD não configuradas.');
    }

    const jar = new Jar();
    await login(jar);
    const rows = await fetchSaldos(jar);

    let upserted = 0;
    if (rows.length > 0) {
      const payload = rows.map(r => ({
        codigo: r.codigo,
        descricao: r.descricao ?? null,
        deposito: r.deposito,
        quantidade: r.quantidade,
        unidade: r.unidade ?? null,
        raw: r.raw ?? null,
        synced_at: new Date().toISOString(),
      }));
      const { error, count } = await admin
        .from('auge_produtos_saldo')
        .upsert(payload, { onConflict: 'codigo,deposito', count: 'exact' });
      if (error) throw error;
      upserted = count ?? payload.length;
    }

    await admin.from('auge_sync_runs').update({
      status: 'success',
      finished_at: new Date().toISOString(),
      rows_processed: rows.length,
      rows_upserted: upserted,
    }).eq('id', runId);

    return new Response(JSON.stringify({ ok: true, rows: rows.length, upserted }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await admin.from('auge_sync_runs').update({
      status: 'error',
      finished_at: new Date().toISOString(),
      error_message: msg,
    }).eq('id', runId);
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
