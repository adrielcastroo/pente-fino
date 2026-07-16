// Auge (Unilux ERP) -> Pente Fino sync
// Espelha: saldo, produtos, depósitos, movimentações, lotes
// Sem API oficial: scraper autenticado com rotas candidatas.

import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

const AUGE_BASE_URL = Deno.env.get('AUGE_BASE_URL') ?? 'https://unilux.auge.app';
const AUGE_USERNAME = Deno.env.get('AUGE_USERNAME') ?? '';
const AUGE_PASSWORD = Deno.env.get('AUGE_PASSWORD') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

type Entity = 'saldo' | 'produtos' | 'depositos' | 'movimentacoes' | 'lotes';
const ALL_ENTITIES: Entity[] = ['produtos', 'depositos', 'saldo', 'movimentacoes', 'lotes'];

// ---------- Cookie jar ----------
class Jar {
  private store = new Map<string, string>();
  ingest(res: Response) {
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

const LOGIN_PATH_CANDIDATES = ['/login', '/auth/login', '/entrar', '/acesso', '/signin', '/sign-in', '/usuarios/login', '/api/login', '/api/auth/login'];

async function login(jar: Jar): Promise<void> {
  let loginHtml = '';
  let loginPath: string | null = null;
  let lastStatus = 0;

  for (const p of LOGIN_PATH_CANDIDATES) {
    try {
      const res = await fetch(`${AUGE_BASE_URL}${p}`, {
        redirect: 'manual',
        headers: { 'User-Agent': 'PenteFinoBot/1.0', 'Accept': 'text/html,application/json' },
      });
      lastStatus = res.status;
      jar.ingest(res);
      if (res.status === 200 || res.status === 302) {
        loginHtml = await res.text();
        loginPath = p;
        break;
      }
      await res.body?.cancel();
    } catch (_) { /* try next */ }
  }

  if (!loginPath) {
    throw new Error(`Nenhuma rota de login respondeu em ${AUGE_BASE_URL} (último HTTP ${lastStatus}). Envie o HAR da tela de login para mapear a URL correta.`);
  }

  const csrfMatch =
    loginHtml.match(/name="_token"\s+value="([^"]+)"/i) ||
    loginHtml.match(/name="csrf-token"\s+content="([^"]+)"/i) ||
    loginHtml.match(/name="csrfmiddlewaretoken"\s+value="([^"]+)"/i);
  const csrf = csrfMatch?.[1];

  const body = new URLSearchParams();
  for (const k of ['email', 'username', 'user', 'login']) body.set(k, AUGE_USERNAME);
  body.set('password', AUGE_PASSWORD);
  body.set('senha', AUGE_PASSWORD);
  if (csrf) body.set('_token', csrf);

  const postRes = await fetch(`${AUGE_BASE_URL}${loginPath}`, {
    method: 'POST',
    redirect: 'manual',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': jar.header(),
      'Referer': `${AUGE_BASE_URL}${loginPath}`,
      'User-Agent': 'PenteFinoBot/1.0',
      ...(csrf ? { 'X-CSRF-TOKEN': csrf } : {}),
    },
    body,
  });
  jar.ingest(postRes);

  if (postRes.status !== 302 && postRes.status !== 200 && postRes.status !== 204) {
    throw new Error(`Login Auge falhou em ${loginPath} (HTTP ${postRes.status}). Envie o HAR do login para mapear os campos e a URL corretos.`);
  }
}

// Tenta candidatos de rota, devolve o primeiro payload JSON não-vazio (array)
async function tryRoutes(jar: Jar, paths: string[]): Promise<any[] | null> {
  for (const path of paths) {
    try {
      const res = await fetch(`${AUGE_BASE_URL}${path}`, {
        headers: {
          'Cookie': jar.header(),
          'Accept': 'application/json, text/html;q=0.9',
          'User-Agent': 'PenteFinoBot/1.0',
        },
      });
      if (!res.ok) { await res.body?.cancel(); continue; }
      const text = await res.text();
      // Endpoint retorna text/html mas com corpo JSON
      try {
        const data = JSON.parse(text);
        const arr = Array.isArray(data) ? data : (data.data ?? data.rows ?? data.items ?? data.results ?? []);
        if (Array.isArray(arr) && arr.length > 0) return arr;
      } catch { /* not json */ }
    } catch (_) { /* try next */ }
  }
  return null;
}

// Rota real das Saídas (HAR): POST form-urlencoded, retorna {data: [...]}
async function fetchSaidas(jar: Jar, sinceDaysAgo = 60): Promise<any[] | null> {
  const from = new Date(Date.now() - sinceDaysAgo * 86400000);
  const dd = String(from.getDate()).padStart(2, '0');
  const mm = String(from.getMonth() + 1).padStart(2, '0');
  const yy = from.getFullYear();
  const body = new URLSearchParams({
    dtCriacaoDe: `${dd}/${mm}/${yy}`,
    dtCriacaoAte: '',
    idSituacao: '',
    cdDepositoOrigem: '',
    cdItem: '',
  });
  const res = await fetch(`${AUGE_BASE_URL}/l.unilux/modInventario/estoque/ajax/getSaidaEstoque.php`, {
    method: 'POST',
    headers: {
      'Cookie': jar.header(),
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'X-Requested-With': 'XMLHttpRequest',
      'Origin': AUGE_BASE_URL,
      'Referer': `${AUGE_BASE_URL}/l.unilux/modInventario/estoque/gerirSaidaEstoque.php`,
      'User-Agent': 'PenteFinoBot/1.0',
      'Accept': 'application/json, text/plain, */*',
    },
    body,
  });
  if (!res.ok) { await res.body?.cancel(); return null; }
  const text = await res.text();
  try {
    const j = JSON.parse(text);
    return Array.isArray(j?.data) ? j.data : null;
  } catch { return null; }
}

const CANDIDATES: Record<Entity, string[]> = {
  saldo: [
    '/api/estoque/saldos', '/api/saldos', '/estoque/saldos.json',
    '/estoque/saldos', '/relatorios/saldo-estoque.json',
  ],
  produtos: [
    '/api/produtos', '/api/cadastros/produtos', '/produtos.json',
    '/cadastros/produtos.json', '/api/itens',
  ],
  depositos: [
    '/api/depositos', '/api/armazens', '/depositos.json', '/cadastros/depositos.json',
  ],
  movimentacoes: [
    '/api/estoque/movimentacoes', '/api/movimentacoes',
    '/estoque/movimentacoes.json', '/relatorios/movimentacoes.json',
  ],
  lotes: [
    '/api/lotes', '/api/estoque/lotes', '/lotes.json', '/estoque/lotes.json',
  ],
};

// ---------- Normalizadores ----------
function mapSaldo(r: any) {
  return {
    codigo: String(r.codigo ?? r.sku ?? r.produto ?? r.codigo_produto ?? '').trim(),
    descricao: r.descricao ?? r.nome ?? null,
    deposito: String(r.deposito ?? r.armazem ?? r.deposito_codigo ?? 'PADRAO'),
    quantidade: Number(r.saldo ?? r.quantidade ?? r.qtd ?? 0),
    unidade: r.unidade ?? r.un ?? null,
    raw: r,
    synced_at: new Date().toISOString(),
  };
}
function mapProduto(r: any) {
  return {
    codigo: String(r.codigo ?? r.sku ?? r.id_externo ?? '').trim(),
    descricao: r.descricao ?? r.nome ?? null,
    unidade: r.unidade ?? r.un ?? null,
    ncm: r.ncm ?? null,
    categoria: r.categoria ?? r.grupo ?? null,
    ativo: r.ativo ?? true,
    raw: r,
    synced_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}
function mapDeposito(r: any) {
  return {
    codigo: String(r.codigo ?? r.id ?? r.sigla ?? '').trim(),
    nome: r.nome ?? r.descricao ?? null,
    localizacao: r.localizacao ?? r.endereco ?? null,
    ativo: r.ativo ?? true,
    raw: r,
    synced_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}
function mapMovimentacao(r: any) {
  // Fields from real Auge endpoint /l.unilux/modInventario/estoque/ajax/getSaidaEstoque.php
  const idExt = String(r.cdMovEstoqueERP ?? r.id ?? r.id_externo ?? '').trim();
  const dt = r.dtCriacao ?? r.data ?? r.data_movimento ?? null;
  // Parse "DD/MM/YYYY HH:mm:ss" -> ISO
  let iso: string | null = null;
  if (typeof dt === 'string' && dt.includes('/')) {
    const [d, t] = dt.split(' ');
    const [dd, mm, yy] = d.split('/');
    iso = `${yy}-${mm}-${dd}T${t ?? '00:00:00'}-03:00`;
  } else if (dt) {
    iso = String(dt);
  }
  const qt = typeof r.qtItem === 'string' ? Number(r.qtItem.replace(',', '.')) : Number(r.qtItem ?? r.quantidade ?? r.qtd ?? 0);
  return {
    id_externo: idExt,
    tipo: (r.idTipoMovimentacao === 'S' ? 'saida' : r.idTipoMovimentacao === 'E' ? 'entrada' : String(r.tipo ?? 'movimento')).toLowerCase(),
    codigo_produto: String(r.cdItem ?? r.codigo ?? r.produto ?? '').trim() || '-', // header endpoint has no item
    deposito: r.cdDepositoOrigem ?? r.deposito ?? r.armazem ?? null,
    quantidade: isFinite(qt) ? qt : 0,
    documento: r.nrTransfEstoqueERP ?? r.documento ?? r.nf ?? null,
    data_movimento: iso,
    observacao: r.dsObservacao ?? r.observacao ?? null,
    raw: r,
    synced_at: new Date().toISOString(),
  };
}
function mapLote(r: any) {
  return {
    codigo_produto: String(r.codigo ?? r.produto ?? r.sku ?? '').trim(),
    lote: String(r.lote ?? r.numero_lote ?? '').trim(),
    deposito: r.deposito ?? r.armazem ?? null,
    quantidade: Number(r.quantidade ?? r.saldo ?? 0),
    data_fabricacao: r.data_fabricacao ?? r.fabricacao ?? null,
    data_validade: r.data_validade ?? r.validade ?? null,
    raw: r,
    synced_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

// ---------- Sync por entidade ----------
async function syncEntity(admin: any, jar: Jar, entity: Entity, triggeredBy: string | null) {
  const { data: run } = await admin.from('auge_sync_runs')
    .insert({ status: 'running', triggered_by: triggeredBy, entidade: entity })
    .select('id').single();
  const runId = run?.id;

  try {
    const raw = await tryRoutes(jar, CANDIDATES[entity]);
    if (!raw) {
      throw new Error(`Nenhuma rota candidata respondeu com dados para ${entity}.`);
    }

    let upserted = 0;
    if (entity === 'saldo') {
      const rows = raw.map(mapSaldo).filter(r => r.codigo);
      const { error, count } = await admin.from('auge_produtos_saldo')
        .upsert(rows, { onConflict: 'codigo,deposito', count: 'exact' });
      if (error) throw error;
      upserted = count ?? rows.length;
    } else if (entity === 'produtos') {
      const rows = raw.map(mapProduto).filter(r => r.codigo);
      const { error, count } = await admin.from('auge_produtos')
        .upsert(rows, { onConflict: 'codigo', count: 'exact' });
      if (error) throw error;
      upserted = count ?? rows.length;
    } else if (entity === 'depositos') {
      const rows = raw.map(mapDeposito).filter(r => r.codigo);
      const { error, count } = await admin.from('auge_depositos')
        .upsert(rows, { onConflict: 'codigo', count: 'exact' });
      if (error) throw error;
      upserted = count ?? rows.length;
    } else if (entity === 'movimentacoes') {
      const rows = raw.map(mapMovimentacao).filter(r => r.codigo_produto && r.id_externo);
      const { error, count } = await admin.from('auge_movimentacoes')
        .upsert(rows, { onConflict: 'id_externo', count: 'exact' });
      if (error) throw error;
      upserted = count ?? rows.length;
    } else if (entity === 'lotes') {
      const rows = raw.map(mapLote).filter(r => r.codigo_produto && r.lote);
      const { error, count } = await admin.from('auge_lotes')
        .upsert(rows, { onConflict: 'codigo_produto,lote,deposito', count: 'exact' });
      if (error) throw error;
      upserted = count ?? rows.length;
    }

    await admin.from('auge_sync_runs').update({
      status: 'success',
      finished_at: new Date().toISOString(),
      rows_processed: raw.length,
      rows_upserted: upserted,
    }).eq('id', runId);

    return { entity, processed: raw.length, upserted };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await admin.from('auge_sync_runs').update({
      status: 'error',
      finished_at: new Date().toISOString(),
      error_message: msg,
    }).eq('id', runId);
    return { entity, error: msg };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
  const url = new URL(req.url);
  const entityParam = url.searchParams.get('entity');
  const entities: Entity[] = entityParam
    ? entityParam.split(',').filter(e => (ALL_ENTITIES as string[]).includes(e)) as Entity[]
    : ALL_ENTITIES;

  const authHeader = req.headers.get('Authorization');
  let triggeredBy: string | null = null;
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const anon = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY')!, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data } = await anon.auth.getClaims(authHeader.replace('Bearer ', ''));
      triggeredBy = data?.claims?.sub ?? null;
    } catch (_) { /* cron/anon */ }
  }

  try {
    if (!AUGE_USERNAME || !AUGE_PASSWORD) {
      throw new Error('Credenciais AUGE_USERNAME / AUGE_PASSWORD não configuradas.');
    }

    const jar = new Jar();
    await login(jar);

    const results = [];
    for (const e of entities) {
      results.push(await syncEntity(admin, jar, e, triggeredBy));
    }

    const totalUpserted = results.reduce((s, r: any) => s + (r.upserted ?? 0), 0);
    return new Response(JSON.stringify({ ok: true, upserted: totalUpserted, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    // Return 200 so supabase.functions.invoke() doesn't throw; UI reads ok:false
    return new Response(JSON.stringify({ ok: false, error: msg, fallback: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
