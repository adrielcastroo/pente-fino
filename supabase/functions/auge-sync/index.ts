// Auge (Unilux ERP) -> Pente Fino sync
// Endpoints confirmados via HAR (login.har, 2026-07-16):
//   - GET  /login                                            -> HTML com <input name="_token">
//   - POST /login (form-urlencoded, _token+email+password)   -> 302 /home
//   - GET  /home                                             -> HTML com <meta name="csrf-token"> (novo CSRF autenticado)
//   - POST /api/v1/inventory/invty-available-by-categories   -> saldo (DataTables server-side)
//   - POST /api/v1/inventory/outgoing-items                  -> saídas agregadas por item (DataTables)

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
    // Deno: getSetCookie retorna array; fallback para header combinado
    const anyHeaders = res.headers as any;
    let cookies: string[] = [];
    if (typeof anyHeaders.getSetCookie === 'function') {
      cookies = anyHeaders.getSetCookie();
    } else {
      const raw = res.headers.get('set-cookie');
      if (raw) cookies = raw.split(/,(?=\s*[^;=]+=)/);
    }
    for (const c of cookies) {
      const [pair] = c.split(';');
      const eq = pair.indexOf('=');
      if (eq > 0) {
        const k = pair.slice(0, eq).trim();
        const v = pair.slice(eq + 1).trim();
        if (v && v !== 'deleted') this.store.set(k, v);
      }
    }
  }
  header(): string {
    return [...this.store.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
  }
  get(name: string): string | undefined {
    return this.store.get(name);
  }
}

// ---------- Login (Laravel) ----------
async function login(jar: Jar): Promise<{ csrf: string; apiToken: string | null }> {
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

  if (getRes.status !== 200) {
    throw new Error(`GET /login retornou HTTP ${getRes.status} — base URL configurada: ${AUGE_BASE_URL}`);
  }

  const csrfMatch =
    html.match(/name="_token"\s+value="([^"]+)"/i) ||
    html.match(/name="csrf-token"\s+content="([^"]+)"/i);
  const csrf = csrfMatch?.[1];
  if (!csrf) {
    throw new Error('Não foi possível extrair _token da página de login (HTML inesperado).');
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

  if (postRes.status !== 302) {
    throw new Error(`Login Auge falhou (HTTP ${postRes.status}) — verifique credenciais.`);
  }
  const loc = postRes.headers.get('location') ?? '';
  if (loc.includes('/login')) {
    throw new Error('Login redirecionou de volta para /login — credenciais inválidas.');
  }

  // GET /home para pegar CSRF autenticado (Laravel rotaciona após login)
  const homeUrl = `${AUGE_BASE_URL}/home`;
  const homeRes = await fetch(homeUrl, {
    redirect: 'manual',
    headers: {
      'Cookie': jar.header(),
      'User-Agent': UA,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Referer': loginUrl,
    },
  });
  jar.ingest(homeRes);
  const homeStatus = homeRes.status;
  const homeLoc = homeRes.headers.get('location') ?? '';
  const homeHtml = await homeRes.text();

  if (homeStatus !== 200) {
    throw new Error(`GET /home retornou ${homeStatus} (Location: ${homeLoc}) — sessão não autenticada após login.`);
  }

  const metaCsrf = homeHtml.match(/<meta[^>]+name="csrf-token"[^>]+content="([^"]+)"/i)?.[1];
  const apiTokenMatch = homeHtml.match(/userApiToken\s*:\s*['"]([^'"]+)['"]/);
  const apiToken = apiTokenMatch?.[1] ?? null;

  if (metaCsrf) return { csrf: metaCsrf, apiToken };

  // Fallback: XSRF-TOKEN cookie (URL-encoded)
  const xsrf = jar.get('XSRF-TOKEN');
  if (xsrf) {
    try { return { csrf: decodeURIComponent(xsrf), apiToken }; } catch { return { csrf: xsrf, apiToken }; }
  }

  throw new Error(`Login OK (302→${loc}), /home ${homeStatus}, mas nenhum CSRF encontrado (HTML len=${homeHtml.length}).`);
}

// ---------- DataTables helper ----------
function dtBody(columns: string[], length = -1): URLSearchParams {
  const p = new URLSearchParams();
  p.set('draw', '1');
  columns.forEach((c, i) => {
    p.set(`columns[${i}][data]`, c);
    p.set(`columns[${i}][name]`, c);
    p.set(`columns[${i}][searchable]`, 'true');
    p.set(`columns[${i}][orderable]`, 'true');
    p.set(`columns[${i}][search][value]`, '');
    p.set(`columns[${i}][search][regex]`, 'false');
  });
  p.set('order[0][column]', '0');
  p.set('order[0][dir]', 'asc');
  p.set('start', '0');
  p.set('length', String(length));
  p.set('search[value]', '');
  p.set('search[regex]', 'false');
  return p;
}

async function postApi(auth: { jar: Jar; csrf: string; apiToken: string | null }, path: string, body: URLSearchParams): Promise<any[]> {
  const headers: Record<string, string> = {
    'Cookie': auth.jar.header(),
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    'X-Requested-With': 'XMLHttpRequest',
    'X-CSRF-TOKEN': auth.csrf,
    'Origin': AUGE_BASE_URL,
    'Referer': `${AUGE_BASE_URL}/home`,
    'User-Agent': UA,
    'Accept': 'application/json, text/javascript, */*; q=0.01',
    'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
  };
  if (auth.apiToken) headers['Authorization'] = `Bearer ${auth.apiToken}`;

  const res = await fetch(`${AUGE_BASE_URL}${path}`, { method: 'POST', headers, body });
  auth.jar.ingest(res);
  const text = await res.text();
  if (!res.ok) {
    const cookieNames = [...(auth.jar as any).store.keys()].join(',');
    throw new Error(`POST ${path} HTTP ${res.status} | cookies=[${cookieNames}] | csrf=${auth.csrf.slice(0,8)}… | bearer=${auth.apiToken ? auth.apiToken.slice(0,8)+'…' : 'none'} | body=${text.slice(0, 150)}`);
  }
  let j: any;
  try { j = JSON.parse(text); } catch {
    throw new Error(`POST ${path}: resposta não-JSON (${text.slice(0, 120)})`);
  }
  return Array.isArray(j?.data) ? j.data : [];
}

function fetchSaldo(auth: { jar: Jar; csrf: string; apiToken: string | null }) {
  return postApi(auth, '/api/v1/inventory/invty-available-by-categories',
    dtBody(['description', 'inventory_um', 'available_qty']));
}
function fetchOutgoing(auth: { jar: Jar; csrf: string; apiToken: string | null }) {
  return postApi(auth, '/api/v1/inventory/outgoing-items',
    dtBody(['item_full_name', 'quantity']));
}

// Endpoint real de saídas (Auge legado / módulo PHP)
// POST /l.unilux/modInventario/estoque/ajax/getSaidaEstoque.php
// Body: dtCriacaoDe (dd/MM/yyyy), dtCriacaoAte, idSituacao, cdDepositoOrigem, cdItem
async function fetchSaidasPHP(
  auth: { jar: Jar; csrf: string; apiToken: string | null },
  daysBack = 30,
): Promise<any[]> {
  const path = '/l.unilux/modInventario/estoque/ajax/getSaidaEstoque.php';
  const de = new Date(Date.now() - daysBack * 24 * 3600 * 1000);
  const dd = String(de.getDate()).padStart(2, '0');
  const mm = String(de.getMonth() + 1).padStart(2, '0');
  const yyyy = de.getFullYear();
  const body = new URLSearchParams({
    dtCriacaoDe: `${dd}/${mm}/${yyyy}`,
    dtCriacaoAte: '',
    idSituacao: '',
    cdDepositoOrigem: '',
    cdItem: '',
  });
  const headers: Record<string, string> = {
    'Cookie': auth.jar.header(),
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    'X-Requested-With': 'XMLHttpRequest',
    'X-CSRF-TOKEN': auth.csrf,
    'Origin': AUGE_BASE_URL,
    'Referer': `${AUGE_BASE_URL}/l.unilux/modInventario/estoque/gerirSaidaEstoque.php`,
    'User-Agent': UA,
    'Accept': 'application/json, text/javascript, */*; q=0.01',
    'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
  };
  if (auth.apiToken) headers['Authorization'] = `Bearer ${auth.apiToken}`;
  const res = await fetch(`${AUGE_BASE_URL}${path}`, { method: 'POST', headers, body });
  auth.jar.ingest(res);
  const text = await res.text();
  if (!res.ok) throw new Error(`POST ${path} HTTP ${res.status} body=${text.slice(0,200)}`);
  let j: any;
  try { j = JSON.parse(text); } catch { throw new Error(`Resposta não-JSON: ${text.slice(0,120)}`); }
  return Array.isArray(j?.data) ? j.data : [];
}

function parseNum(v: any): number {
  if (v == null) return 0;
  if (typeof v === 'number') return v;
  const s = String(v).trim().replace(/\./g, '').replace(',', '.');
  const n = Number(s);
  return isFinite(n) ? n : Number(v) || 0;
}

function parseDateBR(v: any): string | null {
  if (!v) return null;
  const s = String(v).trim();
  const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2}):(\d{2}))?$/);
  if (!m) return null;
  const [, dd, mm, yyyy, hh = '00', mi = '00', ss = '00'] = m;
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}:${ss}-03:00`;
}

function extractCode(fullName: string): { code: string; name: string } {
  const m = fullName.match(/\[([^\]]+)\]\s*$/);
  if (m) return { code: m[1].trim(), name: fullName.slice(0, m.index).trim().replace(/\s+--\s*$/, '') };
  return { code: fullName.trim(), name: fullName.trim() };
}

function mapSaldo(r: any) {
  return {
    codigo: String(r.id ?? r.description ?? '').trim(),
    descricao: r.description ?? null,
    deposito: 'PADRAO',
    quantidade: parseNum(r.available_qty),
    unidade: r.inventory_um ?? null,
    raw: r,
    synced_at: new Date().toISOString(),
  };
}

function mapProduto(r: any) {
  // r vem do endpoint getItensEstoque.php:
  // { cdItem, nmItem, nmGrupoItem, idNCM, idItemEstoque(Y/N), idItemVenda, idItemCompra,
  //   idAtivo, idUMEstoque, qtEstoque, qtEntradaPrevista, qtSaidaPrevista, "qtDisponível" }
  const yn = (v: any) => v === 'Y' || v === true;
  const qtDisp = r['qtDisponível'] ?? r.qtDisponivel ?? r.qtDisponivél;
  return {
    codigo: String(r.cdItem ?? '').trim(),
    descricao: r.nmItem ?? null,
    unidade: r.idUMEstoque ?? null,
    ncm: r.idNCM ?? null,
    categoria: r.nmGrupoItem ?? null,
    ativo: yn(r.idAtivo),
    id_estoque: yn(r.idItemEstoque),
    id_venda: yn(r.idItemVenda),
    id_compra: yn(r.idItemCompra),
    qt_estoque: parseNum(r.qtEstoque),
    qt_entrada_prevista: parseNum(r.qtEntradaPrevista),
    qt_saida_prevista: parseNum(r.qtSaidaPrevista),
    qt_disponivel: parseNum(qtDisp),
    raw: r,
    synced_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

// Endpoint real de itens/cadastro (Auge legado / módulo PHP)
// GET /l.unilux/modInventario/Ajax/getItensEstoque.php
// Query: idEstoca, idVende, idCompra, idLiquidavel, idEmEstoque, idAtivo,
//        dsPesquisaGeralCdItem, dsPesquisaGeralNmItem(**=todos), cdGrupo, idTipoItem
async function fetchItensPHP(
  auth: { jar: Jar; csrf: string; apiToken: string | null },
): Promise<any[]> {
  const qs = new URLSearchParams({
    idEstoca: 'Y',
    idVende: '',
    idCompra: '',
    idLiquidavel: 'Y',
    idEmEstoque: '',
    idAtivo: 'Y',
    dsPesquisaGeralCdItem: '',
    dsPesquisaGeralNmItem: '**',
    cdGrupo: '102',
    idTipoItem: 'N',
    _: String(Date.now()),
  });
  const path = `/l.unilux/modInventario/Ajax/getItensEstoque.php?${qs.toString()}`;
  const headers: Record<string, string> = {
    'Cookie': auth.jar.header(),
    'X-Requested-With': 'XMLHttpRequest',
    'X-CSRF-TOKEN': auth.csrf,
    'Referer': `${AUGE_BASE_URL}/l.unilux/modInventario/consultaItens.php`,
    'User-Agent': UA,
    'Accept': 'application/json, text/javascript, */*; q=0.01',
    'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
  };
  if (auth.apiToken) headers['Authorization'] = `Bearer ${auth.apiToken}`;
  const res = await fetch(`${AUGE_BASE_URL}${path}`, { method: 'GET', headers });
  auth.jar.ingest(res);
  const text = await res.text();
  if (!res.ok) throw new Error(`GET getItensEstoque HTTP ${res.status} body=${text.slice(0,200)}`);
  let j: any;
  try { j = JSON.parse(text); } catch { throw new Error(`Resposta não-JSON: ${text.slice(0,120)}`); }
  return Array.isArray(j?.data) ? j.data : [];
}

function mapSaidaPHP(r: any) {
  const cd = r.cdTransferenciaEstoque ?? null;
  const cdErp = r.cdMovEstoqueERP ?? null;
  const nrErp = r.nrTransfEstoqueERP ?? null;
  const dtCri = r.dtCriacao ?? '';
  const keySeed = cd ?? cdErp ?? nrErp ?? `${r.nmUsuarioCriacao ?? ''}-${dtCri}`;
  return {
    id_externo: `saida-php:${keySeed}`,
    tipo: 'saida',
    codigo_produto: null,
    deposito: null,
    quantidade: parseNum(r.qtItem),
    documento: cd ? String(cd) : (nrErp ? String(nrErp) : null),
    data_movimento: parseDateBR(dtCri),
    observacao: r.dsObservacao ?? null,
    situacao: r.idSituacao ?? null,
    ds_situacao: r.dsSituacao ?? null,
    usuario_criacao: r.nmUsuarioCriacao ?? null,
    usuario_efetivacao: r.nmUsuarioEfetivacao ?? null,
    dt_efetivacao: parseDateBR(r.dtEfetivacao),
    documento_tipo: r.idTipoDocumento ?? null,
    valor: parseNum(r.vlCustoMovimentacao),
    ds_efetivacao: r.dsEfetivacao ?? null,
    cd_transferencia: cd ? String(cd) : null,
    raw: r,
    synced_at: new Date().toISOString(),
  };
}


// ---------- Sync ----------
async function syncEntity(admin: any, auth: { jar: Jar; csrf: string; apiToken: string | null }, entity: Entity, triggeredBy: string | null) {
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

    if (entity === 'saldo') {
      const items = await fetchSaldo(auth);
      processed = items.length;
      const rows = items.map(mapSaldo).filter(r => r.codigo);
      const { error, count } = await admin.from('auge_produtos_saldo')
        .upsert(rows, { onConflict: 'codigo,deposito', count: 'exact' });
      if (error) throw error;
      upserted = count ?? rows.length;
    } else if (entity === 'produtos') {
      const items = await fetchOutgoing(auth);
      processed = items.length;
      const rows = items.map(mapProduto).filter(r => r.codigo);
      const { error, count } = await admin.from('auge_produtos')
        .upsert(rows, { onConflict: 'codigo', count: 'exact' });
      if (error) throw error;
      upserted = count ?? rows.length;
    } else if (entity === 'movimentacoes') {
      const items = await fetchSaidasPHP(auth, 60);
      processed = items.length;
      const rows = items.map(mapSaidaPHP).filter(r => r.id_externo);
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
    const { csrf, apiToken } = await login(jar);
    const auth = { jar, csrf, apiToken };

    const results = [];
    for (const e of entities) {
      results.push(await syncEntity(admin, auth, e, triggeredBy));
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
