// Auge (Unilux ERP) -> Pente Fino sync
// Endpoints confirmados via HAR:
//   - Login: GET /login (extrai _token) + POST /login (form-urlencoded)
//   - Produtos + Saldos: GET /l.unilux/modInventario/Ajax/getItensEstoque.php
//   - Saídas: POST /l.unilux/modInventario/estoque/ajax/getSaidaEstoque.php

import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

const AUGE_BASE_URL = (Deno.env.get('AUGE_BASE_URL') ?? 'https://unilux.auge.app').replace(/\/$/, '');
const AUGE_USERNAME = Deno.env.get('AUGE_USERNAME') ?? '';
const AUGE_PASSWORD = Deno.env.get('AUGE_PASSWORD') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

type Entity = 'saldo' | 'produtos' | 'depositos' | 'movimentacoes' | 'lotes';
const ALL_ENTITIES: Entity[] = ['produtos', 'saldo', 'movimentacoes', 'depositos', 'lotes'];
const UNMAPPED: Entity[] = ['depositos', 'lotes'];

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

// ---------- Login (Laravel padrão) ----------
async function login(jar: Jar): Promise<void> {
  const loginUrl = `${AUGE_BASE_URL}/login`;
  const getRes = await fetch(loginUrl, {
    redirect: 'manual',
    headers: {
      'User-Agent': UA,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
    },
  });
  jar.ingest(getRes);
  const html = await getRes.text();

  const csrfMatch =
    html.match(/name="_token"\s+value="([^"]+)"/i) ||
    html.match(/name="csrf-token"\s+content="([^"]+)"/i);
  const csrf = csrfMatch?.[1];
  if (!csrf) {
    throw new Error(`Não foi possível extrair _token da página de login (HTTP ${getRes.status}).`);
  }

  const body = new URLSearchParams({
    _token: csrf,
    email: AUGE_USERNAME,
    password: AUGE_PASSWORD,
  });

  const postRes = await fetch(loginUrl, {
    method: 'POST',
    redirect: 'manual',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': jar.header(),
      'Referer': loginUrl,
      'Origin': AUGE_BASE_URL,
      'User-Agent': UA,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
      'Upgrade-Insecure-Requests': '1',
    },
    body,
  });
  jar.ingest(postRes);
  await postRes.body?.cancel();

  // Sucesso = 302 para /home. 200 = página de login re-renderizada (credenciais inválidas).
  if (postRes.status !== 302) {
    throw new Error(`Login Auge falhou (HTTP ${postRes.status}). Verifique AUGE_USERNAME/AUGE_PASSWORD.`);
  }
  const loc = postRes.headers.get('location') ?? '';
  if (loc.includes('/login')) {
    throw new Error('Login Auge redirecionou de volta para /login — credenciais inválidas.');
  }
}

// ---------- Parser numérico BR: "2.995,00" -> 2995 ----------
function parseNumBR(v: any): number {
  if (v == null) return 0;
  if (typeof v === 'number') return v;
  const s = String(v).trim();
  if (!s) return 0;
  // remove separador de milhar, troca vírgula por ponto
  const norm = s.replace(/\./g, '').replace(',', '.');
  const n = Number(norm);
  return isFinite(n) ? n : 0;
}

// ---------- Produtos + Saldos (endpoint único) ----------
async function fetchItensEstoque(jar: Jar): Promise<any[]> {
  const url = `${AUGE_BASE_URL}/l.unilux/modInventario/Ajax/getItensEstoque.php`
    + `?idEstoca=Y&idVende=&idCompra=&idLiquidavel=Y&idEmEstoque=&idAtivo=Y`
    + `&dsPesquisaGeralCdItem=**&dsPesquisaGeralNmItem=&cdGrupo=&idTipoItem=N&_=${Date.now()}`;
  const res = await fetch(url, {
    headers: {
      'Cookie': jar.header(),
      'X-Requested-With': 'XMLHttpRequest',
      'Referer': `${AUGE_BASE_URL}/l.unilux/modInventario/consultaItens.php`,
      'User-Agent': UA,
      'Accept': 'application/json, text/javascript, */*; q=0.01',
    },
  });
  if (!res.ok) {
    await res.body?.cancel();
    throw new Error(`getItensEstoque falhou (HTTP ${res.status}).`);
  }
  const text = await res.text();
  const j = JSON.parse(text);
  return Array.isArray(j?.data) ? j.data : [];
}

// ---------- Saídas ----------
async function fetchSaidas(jar: Jar, sinceDaysAgo = 60): Promise<any[]> {
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
      'User-Agent': UA,
      'Accept': 'application/json, text/plain, */*',
    },
    body,
  });
  if (!res.ok) {
    await res.body?.cancel();
    throw new Error(`getSaidaEstoque falhou (HTTP ${res.status}).`);
  }
  const text = await res.text();
  const j = JSON.parse(text);
  return Array.isArray(j?.data) ? j.data : [];
}

// ---------- Normalizadores ----------
function mapProdutoFromItem(r: any) {
  return {
    codigo: String(r.cdItem ?? '').trim(),
    descricao: r.nmItem ?? null,
    unidade: r.idUMEstoque ?? null,
    ncm: r.idNCM ?? null,
    categoria: r.nmGrupoItem ?? null,
    ativo: r.idAtivo === 'Y' || r.idAtivo === true,
    raw: r,
    synced_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function mapSaldoFromItem(r: any) {
  const disponivel = r['qtDisponível'] ?? r.qtDisponivel ?? r.qtEstoque;
  return {
    codigo: String(r.cdItem ?? '').trim(),
    descricao: r.nmItem ?? null,
    deposito: 'PADRAO',
    quantidade: parseNumBR(disponivel),
    unidade: r.idUMEstoque ?? null,
    raw: {
      qtEstoque: r.qtEstoque,
      qtEntradaPrevista: r.qtEntradaPrevista,
      qtSaidaPrevista: r.qtSaidaPrevista,
      qtDisponivel: disponivel,
    },
    synced_at: new Date().toISOString(),
  };
}

function mapMovimentacao(r: any) {
  const idExt = String(r.cdMovEstoqueERP ?? '').trim();
  const dt = r.dtCriacao;
  let iso: string | null = null;
  if (typeof dt === 'string' && dt.includes('/')) {
    const [d, t] = dt.split(' ');
    const [dd, mm, yy] = d.split('/');
    iso = `${yy}-${mm}-${dd}T${t ?? '00:00:00'}-03:00`;
  }
  return {
    id_externo: idExt,
    tipo: r.idTipoMovimentacao === 'S' ? 'saida' : r.idTipoMovimentacao === 'E' ? 'entrada' : 'movimento',
    codigo_produto: '-', // endpoint de cabeçalho não retorna item; aguarda HAR do drill-down
    deposito: null,
    quantidade: parseNumBR(r.qtItem),
    documento: r.nrTransfEstoqueERP ?? null,
    data_movimento: iso,
    observacao: r.dsObservacao ?? null,
    raw: r,
    synced_at: new Date().toISOString(),
  };
}

// ---------- Sync por entidade ----------
async function syncEntity(admin: any, jar: Jar, entity: Entity, triggeredBy: string | null) {
  if (UNMAPPED.includes(entity)) {
    return { entity, skipped: true, reason: 'Endpoint ainda não mapeado (aguardando HAR).' };
  }

  const { data: run } = await admin.from('auge_sync_runs')
    .insert({ status: 'running', triggered_by: triggeredBy, entidade: entity })
    .select('id').single();
  const runId = run?.id;

  try {
    let processed = 0;
    let upserted = 0;

    if (entity === 'produtos' || entity === 'saldo') {
      const items = await fetchItensEstoque(jar);
      processed = items.length;

      if (entity === 'produtos') {
        const rows = items.map(mapProdutoFromItem).filter(r => r.codigo);
        const { error, count } = await admin.from('auge_produtos')
          .upsert(rows, { onConflict: 'codigo', count: 'exact' });
        if (error) throw error;
        upserted = count ?? rows.length;
      } else {
        const rows = items.map(mapSaldoFromItem).filter(r => r.codigo);
        const { error, count } = await admin.from('auge_produtos_saldo')
          .upsert(rows, { onConflict: 'codigo,deposito', count: 'exact' });
        if (error) throw error;
        upserted = count ?? rows.length;
      }
    } else if (entity === 'movimentacoes') {
      const saidas = await fetchSaidas(jar);
      processed = saidas.length;
      const rows = saidas.map(mapMovimentacao).filter(r => r.id_externo);
      const { error, count } = await admin.from('auge_movimentacoes')
        .upsert(rows, { onConflict: 'id_externo', count: 'exact' });
      if (error) throw error;
      upserted = count ?? rows.length;
    }

    await admin.from('auge_sync_runs').update({
      status: 'success',
      finished_at: new Date().toISOString(),
      rows_processed: processed,
      rows_upserted: upserted,
    }).eq('id', runId);

    return { entity, processed, upserted };
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
    : ALL_ENTITIES.filter(e => !UNMAPPED.includes(e));

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
    return new Response(JSON.stringify({ ok: false, error: msg, fallback: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
