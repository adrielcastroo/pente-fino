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

type Entity = 'saldo' | 'produtos' | 'depositos' | 'movimentacoes' | 'entradas' | 'lotes' | 'transferencias';
const ALL_ENTITIES: Entity[] = ['produtos', 'saldo', 'movimentacoes', 'entradas', 'depositos', 'lotes', 'transferencias'];
const UNMAPPED: Entity[] = []; // todos tentam endpoints; erros são registrados no run

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

// Endpoint real de entradas (Auge legado / módulo PHP)
// POST /l.unilux/modInventario/estoque/ajax/getEntradaEstoque.php
// Body: dtCriacaoDe (dd/MM/yyyy), dtCriacaoAte, idSituacao, cdDepositoOrigem, cdItem
async function fetchEntradasPHP(
  auth: { jar: Jar; csrf: string; apiToken: string | null },
  daysBack = 30,
): Promise<any[]> {
  const path = '/l.unilux/modInventario/estoque/ajax/getEntradaEstoque.php';
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
    'Referer': `${AUGE_BASE_URL}/l.unilux/modInventario/estoque/gerirEntradaEstoque.php`,
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

function mapEntradaPHP(r: any) {
  // Mesma shape das saídas/transferências (módulo estoque legado PHP)
  const cd = r.cdEntradaEstoque ?? r.cdTransferenciaEstoque ?? r.cdMovimentoEstoque ?? null;
  const cdErp = r.cdMovEstoqueERP ?? null;
  const nrErp = r.nrEntradaEstoqueERP ?? r.nrTransfEstoqueERP ?? null;
  const dtCri = r.dtCriacao ?? '';
  const keySeed = cd ?? cdErp ?? nrErp ?? `${r.nmUsuarioCriacao ?? ''}-${dtCri}`;
  return {
    id_externo: `entrada-php:${keySeed}`,
    tipo: 'entrada',
    codigo_produto: r.cdItem ?? null,
    deposito: r.cdDepositoDestino ?? r.cdDeposito ?? null,
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

// ---------- Endpoints tentativos (Auge legado / PHP) ----------
// Sem HAR confirmado — tentamos rotas prováveis. Se todas 404, run marca error.
async function tryPHP(
  auth: { jar: Jar; csrf: string; apiToken: string | null },
  paths: Array<{ method: 'GET' | 'POST'; path: string; body?: URLSearchParams; referer?: string }>,
): Promise<{ data: any[]; path: string }> {
  const errors: string[] = [];
  for (const p of paths) {
    try {
      const headers: Record<string, string> = {
        'Cookie': auth.jar.header(),
        'X-Requested-With': 'XMLHttpRequest',
        'X-CSRF-TOKEN': auth.csrf,
        'Referer': p.referer ?? `${AUGE_BASE_URL}/home`,
        'User-Agent': UA,
        'Accept': 'application/json, text/javascript, */*; q=0.01',
      };
      if (p.method === 'POST') headers['Content-Type'] = 'application/x-www-form-urlencoded; charset=UTF-8';
      if (auth.apiToken) headers['Authorization'] = `Bearer ${auth.apiToken}`;
      const res = await fetch(`${AUGE_BASE_URL}${p.path}`, {
        method: p.method,
        headers,
        body: p.method === 'POST' ? p.body : undefined,
      });
      auth.jar.ingest(res);
      const text = await res.text();
      if (!res.ok) { errors.push(`${p.path} HTTP ${res.status}`); continue; }
      let j: any;
      try { j = JSON.parse(text); } catch { errors.push(`${p.path} não-JSON`); continue; }
      const data = Array.isArray(j?.data) ? j.data : (Array.isArray(j) ? j : null);
      if (data && data.length >= 0) return { data, path: p.path };
      errors.push(`${p.path} sem data[]`);
    } catch (e) {
      errors.push(`${p.path}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  throw new Error(`Nenhum endpoint respondeu. Tentativas: ${errors.join(' | ')}`);
}

async function fetchDepositosPHP(auth: any) {
  return tryPHP(auth, [
    { method: 'GET', path: '/l.unilux/modInventario/Ajax/getDepositos.php' },
    { method: 'GET', path: '/l.unilux/modInventario/Ajax/getEstoques.php' },
    { method: 'POST', path: '/l.unilux/modInventario/estoque/ajax/getDepositos.php', body: new URLSearchParams({ idAtivo: 'Y' }) },
    { method: 'GET', path: '/l.unilux/modCadastro/Ajax/getDepositos.php' },
  ]);
}

async function fetchLotesPHP(auth: any) {
  return tryPHP(auth, [
    { method: 'GET', path: '/l.unilux/modInventario/Ajax/getLotes.php?dsPesquisaGeralCdItem=&dsPesquisaGeralNmItem=**' },
    { method: 'POST', path: '/l.unilux/modInventario/estoque/ajax/getLotes.php', body: new URLSearchParams({ idAtivo: 'Y', dsPesquisaGeralNmItem: '**' }) },
    { method: 'GET', path: '/l.unilux/modInventario/Ajax/getItensLote.php' },
  ]);
}

async function fetchTransferenciasPHP(auth: any, daysBack = 60) {
  const de = new Date(Date.now() - daysBack * 24 * 3600 * 1000);
  const dd = String(de.getDate()).padStart(2, '0');
  const mm = String(de.getMonth() + 1).padStart(2, '0');
  const yyyy = de.getFullYear();
  const body = new URLSearchParams({
    dtCriacaoDe: `${dd}/${mm}/${yyyy}`,
    dtCriacaoAte: '',
    idSituacao: '',
    cdDepositoOrigem: '',
    cdDepositoDestino: '',
    cdItem: '',
    idLogisticaTransf: 'N',
    idUsuario: '',
  });
  return tryPHP(auth, [
    { method: 'POST', path: '/l.unilux/modInventario/estoque/ajax/getTransferenciaEstoque.php', body },
    { method: 'POST', path: '/l.unilux/modInventario/estoque/ajax/getTransfDeposito.php', body },
    { method: 'POST', path: '/l.unilux/modInventario/estoque/ajax/getTransferencias.php', body },
  ]);
}

function mapDeposito(r: any) {
  return {
    codigo: String(r.cdDeposito ?? r.cdEstoque ?? r.id ?? '').trim(),
    nome: r.nmDeposito ?? r.nmEstoque ?? r.nome ?? r.description ?? null,
    localizacao: r.dsLocalizacao ?? r.localizacao ?? null,
    ativo: (r.idAtivo ?? 'Y') === 'Y',
    tipo: r.idTipoDeposito ?? r.tipo ?? null,
    empresa: r.nmEmpresa ?? r.empresa ?? null,
    filial: r.nmFilial ?? r.filial ?? null,
    raw: r,
    synced_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function mapLote(r: any) {
  return {
    codigo_produto: String(r.cdItem ?? r.codigo_produto ?? '').trim(),
    lote: String(r.nrLote ?? r.cdLote ?? r.lote ?? '').trim(),
    deposito: r.cdDeposito ?? r.deposito ?? null,
    quantidade: parseNum(r.qtItem ?? r.quantidade),
    data_fabricacao: r.dtFabricacao ? (parseDateBR(r.dtFabricacao) ?? null)?.slice(0, 10) : null,
    data_validade: r.dtValidade ? (parseDateBR(r.dtValidade) ?? null)?.slice(0, 10) : null,
    raw: r,
    synced_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function mapTransferencia(r: any) {
  const cd = r.cdTransferenciaEstoque ?? r.cdTransferencia ?? r.id ?? '';
  return {
    id_externo: `transf-php:${cd || `${r.nmUsuarioCriacao ?? ''}-${r.dtCriacao ?? ''}`}`,
    _cd: cd ? String(cd) : null, // interno: usado para enriquecimento
    deposito_origem: r.cdDepositoOrigem ?? r.nmDepositoOrigem ?? null,
    deposito_destino: r.cdDepositoDestino ?? r.nmDepositoDestino ?? null,
    codigo_produto: r.cdItem ?? null,
    quantidade: parseNum(r.qtItem),
    situacao: r.idSituacao ?? null,
    ds_situacao: r.dsSituacao ?? null,
    data_movimento: parseDateBR(r.dtCriacao),
    usuario_criacao: r.nmUsuarioCriacao ?? null,
    usuario_efetivacao: r.nmUsuarioEfetivacao ?? null,
    usuario_enviou_logistica: r.nmUsuarioEnviouLogistica ?? null,
    usuario_recebido_logistica: r.nmUsuarioRecebidoLogistica ?? null,
    valor: parseNum(r.vlCustoMovimentacao),
    documento: cd ? String(cd) : null,
    nr_efetivacao: r.nrTransfEstoqueERP ? String(r.nrTransfEstoqueERP) : null,
    ds_efetivacao: r.dsEfetivacao ?? null,
    observacao: r.dsObservacao ?? r.dsObs ?? null,
    raw: r,
    synced_at: new Date().toISOString(),
  };
}

// Busca detalhe individual (manterTransferenciaEstoque?cdMov=...) para preencher
// campos ausentes no LIST: origem/destino/item.
async function fetchTransferenciaDetalhe(
  auth: { jar: Jar; csrf: string; apiToken: string | null },
  cd: string,
): Promise<any | null> {
  const path = `/l.unilux/modInventario/estoque/ajax/manterTransferenciaEstoque.php?cdMov=${encodeURIComponent(cd)}`;
  try {
    const headers: Record<string, string> = {
      'Cookie': auth.jar.header(),
      'X-Requested-With': 'XMLHttpRequest',
      'X-CSRF-TOKEN': auth.csrf,
      'Referer': `${AUGE_BASE_URL}/home`,
      'User-Agent': UA,
      'Accept': 'application/json, text/javascript, */*; q=0.01',
    };
    if (auth.apiToken) headers['Authorization'] = `Bearer ${auth.apiToken}`;
    const res = await fetch(`${AUGE_BASE_URL}${path}`, { method: 'GET', headers });
    auth.jar.ingest(res);
    if (!res.ok) return null;
    const text = await res.text();
    let j: any;
    try { j = JSON.parse(text); } catch { return null; }
    const d = Array.isArray(j?.data) ? j.data[0] : (j?.data ?? j);
    return d && typeof d === 'object' ? d : null;
  } catch {
    return null;
  }
}

// Enriquece linhas cujos campos-chave (origem/destino/item) estão faltando.
async function enrichTransferencias(
  auth: { jar: Jar; csrf: string; apiToken: string | null },
  rows: any[],
  concurrency = 4,
  maxToEnrich = 300,
): Promise<{ enriched: number; failed: number; attempted: number }> {
  const pending = rows.filter(r =>
    r._cd && (!r.deposito_origem || !r.deposito_destino || !r.codigo_produto)
  ).slice(0, maxToEnrich);

  let enriched = 0;
  let failed = 0;
  let idx = 0;

  async function worker() {
    while (idx < pending.length) {
      const i = idx++;
      const row = pending[i];
      const det = await fetchTransferenciaDetalhe(auth, row._cd);
      if (!det) { failed++; continue; }
      row.deposito_origem = row.deposito_origem ?? det.cdDepositoOrigem ?? det.cdDepositoOrig ?? null;
      row.deposito_destino = row.deposito_destino ?? det.cdDepositoDestino ?? det.cdDepositoDest ?? null;
      row.codigo_produto = row.codigo_produto ?? det.cdItem ?? det.codigoItem ?? null;
      row.quantidade = row.quantidade ?? parseNum(det.qtItem);
      row.situacao = row.situacao ?? det.idSituacao ?? null;
      row.ds_situacao = row.ds_situacao ?? det.dsSituacao ?? null;
      row.usuario_efetivacao = row.usuario_efetivacao ?? det.nmUsuarioEfetivacao ?? null;
      row.usuario_enviou_logistica = row.usuario_enviou_logistica ?? det.nmUsuarioEnviouLogistica ?? null;
      row.usuario_recebido_logistica = row.usuario_recebido_logistica ?? det.nmUsuarioRecebidoLogistica ?? null;
      row.valor = row.valor ?? parseNum(det.vlCustoMovimentacao);
      row.nr_efetivacao = row.nr_efetivacao ?? (det.nrTransfEstoqueERP ? String(det.nrTransfEstoqueERP) : null);
      row.ds_efetivacao = row.ds_efetivacao ?? det.dsEfetivacao ?? null;
      row.observacao = row.observacao ?? det.dsObservacao ?? det.dsObs ?? null;
      row.raw = { ...(row.raw ?? {}), _detalhe: det };
      row.detalhe_sincronizado_em = new Date().toISOString();
      enriched++;
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, pending.length) }, worker));
  return { enriched, failed, attempted: pending.length };
}

// ============================================================
// CRIAR / EFETIVAR TRANSFERÊNCIA
// Endpoint: POST /l.unilux/modInventario/estoque/controle/ctlTransferenciaEstoque.php
// idAcao=1 -> cria (rascunho), retorna { cdMovimentacao: "180340" }
// idAcao=2 -> efetiva, body: cdMovimentacao=<id>
// Confirmado via HAR unilux.auge.app-transferencia.har (2026-07-17)
// ============================================================
interface TransferenciaItem {
  cdItem: string;
  cdDepositoOrigem: string;
  cdDepositoDestino: string;
  qtd: number | string;
  nrLote?: string | null;
}

async function postCtlTransferencia(
  auth: { jar: Jar; csrf: string; apiToken: string | null },
  body: URLSearchParams,
): Promise<any> {
  const path = '/l.unilux/modInventario/estoque/controle/ctlTransferenciaEstoque.php';
  const headers: Record<string, string> = {
    'Cookie': auth.jar.header(),
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    'X-Requested-With': 'XMLHttpRequest',
    'X-CSRF-TOKEN': auth.csrf,
    'Origin': AUGE_BASE_URL,
    'Referer': `${AUGE_BASE_URL}/l.unilux/modInventario/estoque/gerirTransferenciaEstoque.php`,
    'User-Agent': UA,
    'Accept': 'application/json, text/javascript, */*; q=0.01',
    'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
  };
  if (auth.apiToken) headers['Authorization'] = `Bearer ${auth.apiToken}`;
  const res = await fetch(`${AUGE_BASE_URL}${path}`, { method: 'POST', headers, body });
  auth.jar.ingest(res);
  const text = await res.text();
  if (!res.ok) throw new Error(`ctlTransferencia HTTP ${res.status}: ${text.slice(0, 200)}`);
  try { return JSON.parse(text); } catch { throw new Error(`ctlTransferencia resposta não-JSON: ${text.slice(0, 120)}`); }
}

async function criarTransferencia(
  auth: { jar: Jar; csrf: string; apiToken: string | null },
  itens: TransferenciaItem[],
  observacao = '',
): Promise<string> {
  if (!itens.length) throw new Error('Ao menos 1 item é obrigatório.');
  const body = new URLSearchParams();
  body.set('idAcao', '1');
  body.set('cdMovivimentacao', ''); // typo intencional (bate com Auge)
  body.set('idUm', 'UN');
  body.set('idEfetivacao', '');
  body.set('idValidacao', 'N');
  body.set('idDuplicar', 'N');
  body.set('dsObservacao', observacao || '');
  body.set('idLancamentoAjuste', 'N');
  itens.forEach((it, i) => {
    body.append('cdItem[]', it.cdItem);
    body.append('cdDepositoOrigem[]', it.cdDepositoOrigem);
    body.append('cdDepositoDestino[]', it.cdDepositoDestino);
    const q = typeof it.qtd === 'number' ? it.qtd.toFixed(6).replace('.', ',') : String(it.qtd);
    body.append('qtdTransferencia[]', q);
    body.append('cdIndex[]', String(i));
    body.append('nrLote[]', it.nrLote ?? '');
  });
  // Linha vazia extra + cdMovivimentacao repetido (observado no HAR)
  body.append('cdItem[]', '');
  body.append('cdIndex[]', String(itens.length));
  body.append('cdMovivimentacao', '');

  const j = await postCtlTransferencia(auth, body);
  const cd = j?.cdMovimentacao ?? j?.cdMovivimentacao;
  if (!cd) throw new Error(`Resposta sem cdMovimentacao: ${JSON.stringify(j).slice(0, 200)}`);
  return String(cd);
}

async function efetivarTransferencia(
  auth: { jar: Jar; csrf: string; apiToken: string | null },
  cdMovimentacao: string,
): Promise<void> {
  const body = new URLSearchParams();
  body.set('idAcao', '2');
  body.set('cdMovimentacao', cdMovimentacao);
  const j = await postCtlTransferencia(auth, body);
  if (j?.ok !== 'ok' && j?.status !== 'ok') {
    throw new Error(`Efetivação retornou: ${JSON.stringify(j).slice(0, 200)}`);
  }
}

// Atualiza um rascunho existente: mesma estrutura de idAcao=1, porém com
// cdMovivimentacao preenchido com o cd atual (padrão observado no portal Auge).
async function atualizarTransferencia(
  auth: { jar: Jar; csrf: string; apiToken: string | null },
  cdMovimentacao: string,
  itens: TransferenciaItem[],
  observacao = '',
): Promise<string> {
  if (!itens.length) throw new Error('Ao menos 1 item é obrigatório.');
  const body = new URLSearchParams();
  body.set('idAcao', '1');
  body.set('cdMovivimentacao', cdMovimentacao); // typo intencional
  body.set('idUm', 'UN');
  body.set('idEfetivacao', '');
  body.set('idValidacao', 'N');
  body.set('idDuplicar', 'N');
  body.set('dsObservacao', observacao || '');
  body.set('idLancamentoAjuste', 'N');
  itens.forEach((it, i) => {
    body.append('cdItem[]', it.cdItem);
    body.append('cdDepositoOrigem[]', it.cdDepositoOrigem);
    body.append('cdDepositoDestino[]', it.cdDepositoDestino);
    const q = typeof it.qtd === 'number' ? it.qtd.toFixed(6).replace('.', ',') : String(it.qtd);
    body.append('qtdTransferencia[]', q);
    body.append('cdIndex[]', String(i));
    body.append('nrLote[]', it.nrLote ?? '');
  });
  body.append('cdItem[]', '');
  body.append('cdIndex[]', String(itens.length));
  body.append('cdMovivimentacao', cdMovimentacao);

  const j = await postCtlTransferencia(auth, body);
  const cd = j?.cdMovimentacao ?? j?.cdMovivimentacao ?? cdMovimentacao;
  return String(cd);
}

// Exclui / cancela rascunho no Auge. Tenta idAcao=3 (padrão observado em
// controllers PHP similares do Auge). Se o portal usa outro código, o JSON de
// resposta é propagado para diagnóstico.
async function excluirTransferencia(
  auth: { jar: Jar; csrf: string; apiToken: string | null },
  cdMovimentacao: string,
): Promise<any> {
  const body = new URLSearchParams();
  body.set('idAcao', '3');
  body.set('cdMovimentacao', cdMovimentacao);
  body.set('cdMovivimentacao', cdMovimentacao);
  const j = await postCtlTransferencia(auth, body);
  if (j?.ok !== 'ok' && j?.status !== 'ok' && j?.erro) {
    throw new Error(`Exclusão retornou: ${JSON.stringify(j).slice(0, 200)}`);
  }
  return j;
}


// Calcula quantos dias precisamos buscar com base no último sync.
// Adiciona 2 dias de overlap para não perder registros que chegaram atrasados.
function daysSince(iso: string | null | undefined, min = 3, max = 90): number {
  if (!iso) return max;
  const diff = Math.ceil((Date.now() - new Date(iso).getTime()) / 86_400_000) + 2;
  return Math.min(Math.max(diff, min), max);
}

function maxDateISO(rows: any[], field = 'data_movimento'): string | null {
  let m: number | null = null;
  for (const r of rows) {
    const v = r?.[field];
    if (!v) continue;
    const t = new Date(v).getTime();
    if (isFinite(t) && (m == null || t > m)) m = t;
  }
  return m ? new Date(m).toISOString() : null;
}

async function syncEntity(admin: any, auth: { jar: Jar; csrf: string; apiToken: string | null }, entity: Entity, triggeredBy: string | null) {
  if (UNMAPPED.includes(entity)) {
    return { entity, skipped: true, reason: 'Endpoint ainda não mapeado (aguardando HAR).' };
  }

  // Estado anterior (para sync incremental)
  const { data: prevState } = await admin
    .from('auge_sync_state')
    .select('last_max_dt')
    .eq('entidade', entity)
    .maybeSingle();
  const lastMax: string | null = prevState?.last_max_dt ?? null;

  const { data: run } = await admin.from('auge_sync_runs')
    .insert({ status: 'running', triggered_by: triggeredBy, entidade: entity })
    .select('id').single();
  const runId = run?.id;

  try {
    let processed = 0;
    let upserted = 0;
    let newMaxDt: string | null = null;

    if (entity === 'saldo') {
      const items = await fetchSaldo(auth);
      processed = items.length;
      const rows = items.map(mapSaldo).filter(r => r.codigo);
      const { error, count } = await admin.from('auge_produtos_saldo')
        .upsert(rows, { onConflict: 'codigo,deposito', count: 'exact' });
      if (error) throw error;
      upserted = count ?? rows.length;
    } else if (entity === 'produtos') {
      const items = await fetchItensPHP(auth);
      processed = items.length;
      const rows = items.map(mapProduto).filter(r => r.codigo);
      const { error, count } = await admin.from('auge_produtos')
        .upsert(rows, { onConflict: 'codigo', count: 'exact' });
      if (error) throw error;
      upserted = count ?? rows.length;
    } else if (entity === 'movimentacoes') {
      const days = daysSince(lastMax);
      const items = await fetchSaidasPHP(auth, days);
      processed = items.length;
      const rows = items.map(mapSaidaPHP).filter(r => r.id_externo);
      newMaxDt = maxDateISO(rows);
      const { error, count } = await admin.from('auge_movimentacoes')
        .upsert(rows, { onConflict: 'id_externo', count: 'exact' });
      if (error) throw error;
      upserted = count ?? rows.length;
      await admin.from('auge_sync_runs').update({ detalhes: { days_back: days, last_max_dt: lastMax } }).eq('id', runId);
    } else if (entity === 'entradas') {
      const days = Math.min(daysSince(lastMax), 30);
      const items = await fetchEntradasPHP(auth, days);
      processed = items.length;
      const rows = items.map(mapEntradaPHP).filter(r => r.id_externo).map(r => { const { raw, ...rest } = r; return rest; });
      newMaxDt = maxDateISO(rows);
      const { error, count } = await admin.from('auge_movimentacoes')
        .upsert(rows, { onConflict: 'id_externo', count: 'exact' });
      if (error) throw error;
      upserted = count ?? rows.length;
      await admin.from('auge_sync_runs').update({ detalhes: { days_back: days, last_max_dt: lastMax, tipo: 'entrada' } }).eq('id', runId);
    } else if (entity === 'depositos') {
      const { data: items, path } = await fetchDepositosPHP(auth);
      processed = items.length;
      const rows = items.map(mapDeposito).filter(r => r.codigo);
      const { error, count } = await admin.from('auge_depositos')
        .upsert(rows, { onConflict: 'codigo', count: 'exact' });
      if (error) throw error;
      upserted = count ?? rows.length;
      await admin.from('auge_sync_runs').update({ detalhes: { path } }).eq('id', runId);
    } else if (entity === 'lotes') {
      const { data: items, path } = await fetchLotesPHP(auth);
      processed = items.length;
      const rows = items.map(mapLote).filter(r => r.codigo_produto && r.lote);
      const { error, count } = await admin.from('auge_lotes')
        .upsert(rows, { onConflict: 'codigo_produto,lote,deposito', count: 'exact', ignoreDuplicates: false });
      if (error) throw error;
      upserted = count ?? rows.length;
      await admin.from('auge_sync_runs').update({ detalhes: { path } }).eq('id', runId);
    } else if (entity === 'transferencias') {
      const days = daysSince(lastMax);
      const { data: items, path } = await fetchTransferenciasPHP(auth, days);
      processed = items.length;
      const mapped = items.map(mapTransferencia).filter(r => r.id_externo);
      // Enriquece com endpoint de detalhe (origem/destino/item)
      const enrichStats = await enrichTransferencias(auth, mapped, 4, 300);
      // Remove campo interno antes do upsert
      const rows = mapped.map(({ _cd, ...rest }: any) => rest);
      newMaxDt = maxDateISO(rows);
      const { error, count } = await admin.from('auge_transferencias')
        .upsert(rows, { onConflict: 'id_externo', count: 'exact' });
      if (error) throw error;
      upserted = count ?? rows.length;
      await admin.from('auge_sync_runs').update({
        detalhes: { path, days_back: days, last_max_dt: lastMax, enrich: enrichStats },
      }).eq('id', runId);
    }

    const nowIso = new Date().toISOString();
    await admin.from('auge_sync_runs').update({
      status: 'success',
      finished_at: nowIso,
      rows_processed: processed,
      rows_upserted: upserted,
    }).eq('id', runId);

    // Persiste estado de sync incremental
    await admin.from('auge_sync_state').upsert({
      entidade: entity,
      last_synced_at: nowIso,
      last_max_dt: newMaxDt ?? lastMax,
      last_status: 'success',
      last_error: null,
    }, { onConflict: 'entidade' });

    return { entity, processed, upserted, incremental: !!lastMax };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const nowIso = new Date().toISOString();
    await admin.from('auge_sync_runs').update({
      status: 'error',
      finished_at: nowIso,
      error_message: msg,
    }).eq('id', runId);
    await admin.from('auge_sync_state').upsert({
      entidade: entity,
      last_synced_at: nowIso,
      last_status: 'error',
      last_error: msg,
    }, { onConflict: 'entidade' });
    return { entity, error: msg };
  }
}

// ============================================================
// Consulta ao vivo de lotes (tecidos) e séries (motores/controles)
// Endpoints (confirmados via HAR 2026-07-18):
//   POST /l.unilux/modInventario/estoque/ajax/getLote.php  body: cdItem, cdDeposito
//   POST /l.unilux/modInventario/estoque/ajax/getSerie.php body: cdItem, cdDeposito
// ============================================================
async function postAjaxJson(
  auth: { jar: Jar; csrf: string; apiToken: string | null },
  path: string,
  body: URLSearchParams,
): Promise<any> {
  const headers: Record<string, string> = {
    'Cookie': auth.jar.header(),
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    'X-Requested-With': 'XMLHttpRequest',
    'X-CSRF-TOKEN': auth.csrf,
    'Origin': AUGE_BASE_URL,
    'Referer': `${AUGE_BASE_URL}/l.unilux/modInventario/estoque/gerirTransferenciaEstoque.php`,
    'User-Agent': UA,
    'Accept': 'application/json, text/javascript, */*; q=0.01',
  };
  if (auth.apiToken) headers['Authorization'] = `Bearer ${auth.apiToken}`;
  const res = await fetch(`${AUGE_BASE_URL}${path}`, { method: 'POST', headers, body });
  auth.jar.ingest(res);
  const text = await res.text();
  if (!res.ok) throw new Error(`POST ${path} HTTP ${res.status}: ${text.slice(0, 200)}`);
  try { return JSON.parse(text); } catch { throw new Error(`Resposta não-JSON em ${path}: ${text.slice(0, 120)}`); }
}

function parseBRNumber(v: any): number {
  if (v == null) return 0;
  const s = String(v).replace(/\./g, '').replace(',', '.');
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

async function fetchLotesLive(auth: any, cdItem: string, cdDeposito: string) {
  const body = new URLSearchParams({ cdItem, cdDeposito });
  const j = await postAjaxJson(auth, '/l.unilux/modInventario/estoque/ajax/getLote.php', body);
  const data = Array.isArray(j?.data) ? j.data : [];
  return data.map((r: any) => ({
    lote: r.dsDeposito ?? '',       // Ex: "TEC02.B.N04  PROC29863/26 27M-1"
    quantidade: parseBRNumber(r.qtDeposito),
    selecionado: parseBRNumber(r.qtDepositoSelecionado),
    cdItem: r.cdItem,
    cdDeposito: r.cdDeposito,
  })).filter((r: any) => r.lote);
}

async function fetchSeriesLive(auth: any, cdItem: string, cdDeposito: string) {
  const body = new URLSearchParams({ cdItem, cdDeposito });
  const j = await postAjaxJson(auth, '/l.unilux/modInventario/estoque/ajax/getSerie.php', body);
  const data = Array.isArray(j?.data) ? j.data : [];
  return data.map((r: any) => ({
    lote: r.cdSerie ?? '',          // Ex: "CX01 NF 148470 NT926069000349"
    idSerie: r.idSerie ?? null,
    quantidade: parseBRNumber(r.qtDeposito),
    selecionado: parseBRNumber(r.qtDepositoSelecionado),
    cdItem: r.cdItem,
    cdDeposito: r.cdDeposito,
  })).filter((r: any) => r.lote);
}


// ============================================================
// Sincronização Tecidos → estoque_posicoes (por endereço embutido)
// Parse do dsDeposito: "TEC0.B.N05 PROC19395/23 27m-2" | "TEC02.B.N04 PROC29863/26 27M-1"
// ============================================================
// Aceita TEC + 1-2 dígitos, nível 1-2 dígitos, M/m com sufixo opcional.
// Aceita TEC + 1-2 dígitos, coluna A-Z, nível 1-2 dígitos.
// Aceita espaço opcional entre a metragem e o sufixo "-N" (ex: "30m -1" ou "30m-1").
const TEC_ADDR_RE = /^TEC(\d{1,2})\.([A-Z])\.N(\d{1,2})\s+(.+?)\s+(\d+(?:[.,]\d+)?)\s*M\s*(-\d+)?\s*$/i;
// CHÃO / CHAO / chao / Chão (com ou sem acento, qualquer case)
const CHAO_ADDR_RE = /^CH[ÃA]O\s+(.+?)\s+(\d+(?:[.,]\d+)?)\s*M\s*(-\d+)?\s*$/i;
const DEP_CENTRAL = '01';     // Central
const DEP_PROVISORIO = '11';  // Central Provisório

function parseLoteTecido(dsDeposito: string): {
  estrutura: string; coluna: string; nivel: number;
  proc: string; m_linear: number; sufixo: string; endereco: string;
} | null {
  if (!dsDeposito) return null;
  const s = dsDeposito.replace(/\s+/g, ' ').trim();

  // 1) CHÃO e variantes → aloca sempre no endereço "CHÃO"
  const c = s.match(CHAO_ADDR_RE);
  if (c) {
    const [, proc, ml, suf] = c;
    return {
      estrutura: 'CHÃO', coluna: 'G', nivel: 1,
      proc: proc.trim(),
      m_linear: parseFloat(ml.replace(',', '.')),
      sufixo: suf || '',
      endereco: 'CHÃO',
    };
  }

  // 2) TECxx.Y.Nzz — normaliza TEC2 → TEC02, N4 → N04
  const m = s.match(TEC_ADDR_RE);
  if (!m) return null;
  const [, num, col, niv, proc, ml, suf] = m;
  const estrutura = `TEC${num.padStart(2, '0')}`;
  const coluna = col.toUpperCase();
  const nivelStr = niv.padStart(2, '0');
  return {
    estrutura,
    coluna,
    nivel: parseInt(niv, 10),
    proc: proc.trim(),
    m_linear: parseFloat(ml.replace(',', '.')),
    sufixo: suf || '',
    endereco: `${estrutura}.${coluna}.N${nivelStr}`,
  };
}

const extractLargura = (desc: string): number => {
  if (!desc) return 0;
  const clamp = (v: number) => (v >= 0.5 && v <= 5 ? v : 0);
  const preL = desc.match(/(?<![\d.,])(\d{1,2}(?:[.,]\d{1,3})?)\s*L\b/i);
  if (preL) return clamp(parseFloat(preL[1].replace(',', '.')));
  const posL = desc.match(/\bL\s*(\d{1,2}(?:[.,]\d{1,3})?)\b/i);
  if (posL) return clamp(parseFloat(posL[1].replace(',', '.')));
  const cm = desc.match(/(\d{2,3})\s*cm\b/i);
  if (cm) return clamp(parseFloat(cm[1]) / 100);
  return 0;
};

async function syncTecidosMap(admin: any, auth: any, runId?: string) {
  const startedAt = new Date().toISOString();
  const logProgress = async (detalhes: any) => {
    if (!runId) return;
    try { await admin.from('auge_sync_runs').update({ detalhes }).eq('id', runId); } catch (_) { /* noop */ }
  };

  // 1. Todos os produtos (paginado)
  const produtos: { codigo: string; descricao: string }[] = [];
  const PAGE = 1000;
  for (let offset = 0; ; offset += PAGE) {
    const { data, error } = await admin
      .from('auge_produtos').select('codigo, descricao')
      .order('codigo', { ascending: true }).range(offset, offset + PAGE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    produtos.push(...data);
    if (data.length < PAGE) break;
  }
  const items = produtos.filter((p: any) => p.codigo);
  await logProgress({ fase: 'produtos_carregados', total: items.length });

  // 2. Depósitos ativos (para varrer "sumidos")
  const { data: depsData } = await admin.from('auge_depositos').select('codigo, nome').order('codigo');
  const depsAtivos: string[] = (depsData ?? [])
    .map((d: any) => String(d.codigo).padStart(2, '0'))
    .filter((c: string) => c !== DEP_CENTRAL && c !== DEP_PROVISORIO);

  // 3. Fetch dep 01 + dep 11 para cada item (batch 15)
  type LoteBruto = {
    cdItem: string;
    descricao: string;
    largura: number;
    dsDeposito: string;
    quantidade: number;
    cdDeposito: string;
  };
  const brutos01: LoteBruto[] = [];
  const brutos11: LoteBruto[] = [];

  const BATCH = 15;
  let processed = 0;
  for (let i = 0; i < items.length; i += BATCH) {
    const chunk = items.slice(i, i + BATCH);
    const results = await Promise.allSettled(
      chunk.map(async (p: any) => {
        const largura = extractLargura(p.descricao ?? '');
        const [r01, r11] = await Promise.all([
          fetchLotesLive(auth, p.codigo, DEP_CENTRAL).catch(() => []),
          fetchLotesLive(auth, p.codigo, DEP_PROVISORIO).catch(() => []),
        ]);
        return {
          d01: r01.map((r: any) => ({ cdItem: p.codigo, descricao: p.descricao ?? '', largura, dsDeposito: r.lote, quantidade: r.quantidade, cdDeposito: DEP_CENTRAL })),
          d11: r11.map((r: any) => ({ cdItem: p.codigo, descricao: p.descricao ?? '', largura, dsDeposito: r.lote, quantidade: r.quantidade, cdDeposito: DEP_PROVISORIO })),
        };
      })
    );
    for (const r of results) {
      if (r.status === 'fulfilled') {
        brutos01.push(...r.value.d01);
        brutos11.push(...r.value.d11);
      }
    }
    processed += chunk.length;
    if (processed % 60 === 0 || processed >= items.length) {
      await logProgress({ fase: 'fetching_dep_01_11', processed, total: items.length, dep01: brutos01.length, dep11: brutos11.length });
    }
  }

  // 4. Constroi mapa lote_sistema → registro (01 prevalece sobre 11)
  type Parsed = { raw: LoteBruto; addr: NonNullable<ReturnType<typeof parseLoteTecido>> };
  const mapAtual = new Map<string, Parsed>();
  const semPadrao: LoteBruto[] = [];
  // 11 primeiro, 01 sobrescreve
  for (const l of brutos11) {
    const addr = parseLoteTecido(l.dsDeposito);
    if (!addr) { semPadrao.push(l); continue; }
    mapAtual.set(l.dsDeposito, { raw: l, addr });
  }
  for (const l of brutos01) {
    const addr = parseLoteTecido(l.dsDeposito);
    if (!addr) { semPadrao.push(l); continue; }
    mapAtual.set(l.dsDeposito, { raw: l, addr });
  }

  // 5. Carrega estado atual do DB (posições TEC importadas do Auge)
  const posicoesExist: any[] = [];
  for (let offset = 0; ; offset += PAGE) {
    const { data, error } = await admin
      .from('estoque_posicoes')
      .select('id, estrutura, coluna, nivel, posicao, lote_sistema, item, largura, m_linear, m_linear_atual, deposito_atual, status, auge_cd_item')
      .or('estrutura.like.TEC%,estrutura.eq.CHÃO')
      .eq('conferente_entrada', 'Importado Auge')
      .range(offset, offset + PAGE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    posicoesExist.push(...data);
    if (data.length < PAGE) break;
  }
  const mapExist = new Map<string, any>();
  for (const p of posicoesExist) if (p.lote_sistema) mapExist.set(p.lote_sistema, p);

  // 6. Diff: para cada lote atual (01/11) → upsert; para cada existente ausente → verificar outros deps ou saída
  const nowIso = new Date().toISOString();
  const toInsert: any[] = [];
  const toUpdate: { id: string; patch: any }[] = [];
  const overflowRows: any[] = [];
  const saidas: any[] = [];
  const toDeleteIds: string[] = [];
  let transferidosCount = 0;
  let retornosCount = 0;

  // Agrupa novos por célula para alocar posição
  const novosPorCelula = new Map<string, Parsed[]>();
  for (const [loteSistema, cur] of mapAtual.entries()) {
    const existente = mapExist.get(loteSistema);
    const targetStatus = cur.raw.cdDeposito === DEP_CENTRAL ? 'ocupado' : 'bloqueado';
    const m2atual = cur.raw.largura > 0 ? +(cur.raw.quantidade * cur.raw.largura).toFixed(2) : 0;

    if (!existente) {
      const key = `${cur.addr.estrutura}.${cur.addr.coluna}.${cur.addr.nivel}`;
      if (!novosPorCelula.has(key)) novosPorCelula.set(key, []);
      novosPorCelula.get(key)!.push(cur);
    } else {
      // Retorno de "transferido" → conta
      if (existente.status === 'transferido') retornosCount++;
      toUpdate.push({
        id: existente.id,
        patch: {
          status: targetStatus,
          deposito_atual: cur.raw.cdDeposito,
          m_linear_atual: cur.raw.quantidade,
          m2_atual: m2atual,
          auge_cd_item: cur.raw.cdItem,
        },
      });
    }
  }

  // Lotes existentes que sumiram do 01 e 11
  const ausentes = posicoesExist.filter(p => !mapAtual.has(p.lote_sistema));
  // Para eficiência, agrupa por cdItem (evita duplicar chamadas)
  const porItem = new Map<string, any[]>();
  for (const p of ausentes) {
    const k = p.auge_cd_item || '';
    if (!k) { toDeleteIds.push(p.id); continue; }
    if (!porItem.has(k)) porItem.set(k, []);
    porItem.get(k)!.push(p);
  }

  const itensAusentes = Array.from(porItem.keys());
  let procA = 0;
  for (let i = 0; i < itensAusentes.length; i += BATCH) {
    const chunk = itensAusentes.slice(i, i + BATCH);
    const results = await Promise.allSettled(chunk.map(async (cdItem) => {
      const found: Record<string, { cdDeposito: string; quantidade: number }> = {};
      for (const dep of depsAtivos) {
        try {
          const rows = await fetchLotesLive(auth, cdItem, dep);
          for (const r of rows) {
            if (r.lote && !found[r.lote]) {
              found[r.lote] = { cdDeposito: dep, quantidade: r.quantidade };
            }
          }
        } catch (_) { /* noop */ }
      }
      return { cdItem, found };
    }));
    for (const r of results) {
      if (r.status !== 'fulfilled') continue;
      const { cdItem, found } = r.value;
      const positions = porItem.get(cdItem) ?? [];
      for (const p of positions) {
        const hit = found[p.lote_sistema];
        if (hit) {
          const largura = p.largura || 0;
          toUpdate.push({
            id: p.id,
            patch: {
              status: 'transferido',
              deposito_atual: hit.cdDeposito,
              m_linear_atual: hit.quantidade,
              m2_atual: largura > 0 ? +(hit.quantidade * largura).toFixed(2) : 0,
            },
          });
          transferidosCount++;
        } else {
          // Saiu completamente → grava saída + apaga posição
          saidas.push({
            estrutura: p.estrutura,
            coluna: p.coluna,
            nivel: p.nivel,
            posicao: p.posicao,
            item: p.item,
            lote_sistema: p.lote_sistema,
            m_linear: p.m_linear_atual ?? p.m_linear ?? 0,
            largura: p.largura ?? 0,
            m2: (p.m_linear_atual ?? p.m_linear ?? 0) * (p.largura ?? 0),
            conferente_saida: 'Auge Sync',
            observacoes: 'AUGE_SAIDA',
            data_saida: nowIso,
          });
          toDeleteIds.push(p.id);
        }
      }
    }
    procA += chunk.length;
    if (procA % 30 === 0 || procA >= itensAusentes.length) {
      await logProgress({ fase: 'diff_ausentes', procA, total: itensAusentes.length, transferidos: transferidosCount, saidas: saidas.length });
    }
  }

  // 7. Aloca novos em posições 1..30 por célula
  for (const [_key, list] of novosPorCelula.entries()) {
    list.sort((a, b) => a.raw.dsDeposito.localeCompare(b.raw.dsDeposito));
    // Posições ocupadas na célula (considerando existentes + já inserindo)
    const cellRef = list[0].addr;
    const ocupadas = new Set<number>();
    for (const p of posicoesExist) {
      if (p.estrutura === cellRef.estrutura && p.coluna === cellRef.coluna && p.nivel === cellRef.nivel) {
        ocupadas.add(p.posicao);
      }
    }
    for (const item of list) {
      const { addr, raw } = item;
      const status = raw.cdDeposito === DEP_CENTRAL ? 'ocupado' : 'bloqueado';
      const m2 = raw.largura > 0 ? +(raw.quantidade * raw.largura).toFixed(2) : 0;
      let pos = 1;
      while (pos <= 30 && ocupadas.has(pos)) pos++;
      const base = {
        estrutura: addr.estrutura,
        coluna: addr.coluna,
        nivel: addr.nivel,
        item: raw.descricao || raw.cdItem,
        m2, largura: raw.largura, m_linear: raw.quantidade,
        m_linear_atual: raw.quantidade,
        m2_atual: m2,
        deposito_atual: raw.cdDeposito,
        auge_cd_item: raw.cdItem,
        lote: `${raw.quantidade}M`,
        endereco: addr.endereco,
        lote_sistema: raw.dsDeposito,
        conferente_entrada: 'Importado Auge',
        data_registro: nowIso,
        proc: addr.proc,
      };
      if (pos <= 30) {
        toInsert.push({ ...base, posicao: pos, status });
        ocupadas.add(pos);
      } else {
        overflowRows.push({
          item: base.item, endereco_desejado: addr.endereco,
          estrutura: addr.estrutura, coluna: addr.coluna, nivel: addr.nivel,
          proc: addr.proc, m_linear: raw.quantidade, largura: raw.largura, m2,
          lote: `${raw.quantidade}M`, lote_sistema: raw.dsDeposito,
          auge_cd_item: raw.cdItem, auge_cd_deposito: raw.cdDeposito,
          synced_at: nowIso,
        });
      }
    }
  }

  // Overflow: sem padrão
  for (const raw of semPadrao) {
    overflowRows.push({
      item: raw.descricao || raw.cdItem, endereco_desejado: null,
      estrutura: null, coluna: null, nivel: null, proc: null,
      m_linear: null, largura: raw.largura || null, m2: null,
      lote: null, lote_sistema: raw.dsDeposito,
      auge_cd_item: raw.cdItem, auge_cd_deposito: raw.cdDeposito,
      synced_at: nowIso,
    });
  }

  // 8. Aplica writes
  const CH = 500;
  const applyInsert = async (table: string, rows: any[]) => {
    for (let i = 0; i < rows.length; i += CH) {
      const { error } = await admin.from(table).insert(rows.slice(i, i + CH));
      if (error) throw new Error(`${table}: ${error.message}`);
    }
  };

  if (toInsert.length) await applyInsert('estoque_posicoes', toInsert);
  if (saidas.length) {
    try { await applyInsert('estoque_saidas', saidas); } catch (e) { console.error('estoque_saidas:', e); }
  }
  for (const u of toUpdate) {
    await admin.from('estoque_posicoes').update(u.patch).eq('id', u.id);
  }
  if (toDeleteIds.length) {
    for (let i = 0; i < toDeleteIds.length; i += CH) {
      await admin.from('estoque_posicoes').delete().in('id', toDeleteIds.slice(i, i + CH));
    }
  }
  // tecidos_sem_espaco: reconstruído (limpa e insere)
  await admin.from('tecidos_sem_espaco').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (overflowRows.length) await applyInsert('tecidos_sem_espaco', overflowRows);

  return {
    startedAt,
    finishedAt: new Date().toISOString(),
    itens_consultados: items.length,
    dep01: brutos01.length,
    dep11: brutos11.length,
    novos_alocados: toInsert.length,
    atualizados: toUpdate.length,
    transferidos: transferidosCount,
    retornos: retornosCount,
    saidas: saidas.length,
    sem_espaco: overflowRows.length,
    lotes_sem_padrao: semPadrao.length,
  };
}



Deno.serve(async (req) => {

  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
  const url = new URL(req.url);
  const action = url.searchParams.get('action');
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

    // Kill-switch: se a flag auge_sync_enabled estiver desligada, bloqueia tudo (exceto ping)
    if (action !== 'ping') {
      const { data: flag } = await admin
        .from('feature_flags')
        .select('enabled')
        .eq('key', 'auge_sync_enabled')
        .maybeSingle();
      if (flag && flag.enabled === false) {
        return new Response(JSON.stringify({
          ok: false, disabled: true,
          error: 'Sincronização com o Auge está desligada no painel admin.',
        }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    const t0 = Date.now();
    const jar = new Jar();
    const { csrf, apiToken } = await login(jar);
    const auth = { jar, csrf, apiToken };


    if (action === 'ping') {
      return new Response(JSON.stringify({
        ok: true, connected: true, latency_ms: Date.now() - t0,
        has_api_token: !!apiToken, csrf_prefix: csrf.slice(0, 8),
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (
      action === 'transferencia_criar' ||
      action === 'transferencia_efetivar' ||
      action === 'transferencia_atualizar' ||
      action === 'transferencia_excluir'
    ) {
      let payload: any = {};
      try { payload = await req.json(); } catch { /* body opcional em query */ }

      const logDetalhes = (extra: any) => admin.from('auge_sync_runs').insert({
        status: 'success', triggered_by: triggeredBy, entidade: 'transferencias',
        finished_at: new Date().toISOString(),
        detalhes: { action, ...extra },
      });

      if (action === 'transferencia_criar') {
        const itens = Array.isArray(payload?.itens) ? payload.itens : [];
        if (!itens.length) throw new Error('Envie ao menos 1 item em "itens".');
        for (const it of itens) {
          if (!it?.cdItem || !it?.cdDepositoOrigem || !it?.cdDepositoDestino || !it?.qtd) {
            throw new Error('Cada item precisa de cdItem, cdDepositoOrigem, cdDepositoDestino e qtd.');
          }
        }
        const cd = await criarTransferencia(auth, itens, String(payload?.observacao ?? ''));
        let efetivado = false;
        if (payload?.efetivar === true) {
          await efetivarTransferencia(auth, cd);
          efetivado = true;
        }
        await logDetalhes({ cdMovimentacao: cd, efetivado, itens: itens.length });
        return new Response(JSON.stringify({ ok: true, cdMovimentacao: cd, efetivado }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (action === 'transferencia_atualizar') {
        const cd = String(payload?.cdMovimentacao ?? '').trim();
        const itens = Array.isArray(payload?.itens) ? payload.itens : [];
        if (!cd) throw new Error('cdMovimentacao é obrigatório.');
        if (!itens.length) throw new Error('Envie ao menos 1 item em "itens".');
        for (const it of itens) {
          if (!it?.cdItem || !it?.cdDepositoOrigem || !it?.cdDepositoDestino || !it?.qtd) {
            throw new Error('Cada item precisa de cdItem, cdDepositoOrigem, cdDepositoDestino e qtd.');
          }
        }
        const newCd = await atualizarTransferencia(auth, cd, itens, String(payload?.observacao ?? ''));
        await logDetalhes({ cdMovimentacao: newCd, itens: itens.length });
        return new Response(JSON.stringify({ ok: true, cdMovimentacao: newCd }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (action === 'transferencia_excluir') {
        const cd = String(payload?.cdMovimentacao ?? '').trim();
        if (!cd) throw new Error('cdMovimentacao é obrigatório.');
        const resp = await excluirTransferencia(auth, cd);
        // Remove local também
        await admin.from('auge_transferencias').delete().eq('documento', cd);
        await logDetalhes({ cdMovimentacao: cd, auge_resp: resp });
        return new Response(JSON.stringify({ ok: true, cdMovimentacao: cd, auge: resp }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // transferencia_efetivar
      const cd = String(payload?.cdMovimentacao ?? '').trim();
      if (!cd) throw new Error('cdMovimentacao é obrigatório.');
      await efetivarTransferencia(auth, cd);
      await logDetalhes({ cdMovimentacao: cd });
      return new Response(JSON.stringify({ ok: true, cdMovimentacao: cd, efetivado: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }


    if (action === 'sync_tecidos_map') {
      const runIns = await admin.from('auge_sync_runs').insert({
        entidade: 'tecidos_map',
        status: 'running',
        started_at: new Date().toISOString(),
        triggered_by: triggeredBy,
        detalhes: { fase: 'iniciando' },
      }).select('id').single();
      const runId = runIns.data?.id as string | undefined;

      const task = (async () => {
        try {
          const result = await syncTecidosMap(admin, auth, runId);
          if (runId) {
            await admin.from('auge_sync_runs').update({
              status: 'success',
              finished_at: new Date().toISOString(),
              rows_processed: result.itens_consultados,
              rows_upserted: (result.alocados ?? 0) + (result.sem_espaco ?? 0),
              detalhes: result,
            }).eq('id', runId);
          }
        } catch (e) {
          if (runId) {
            await admin.from('auge_sync_runs').update({
              status: 'error',
              finished_at: new Date().toISOString(),
              error_message: e instanceof Error ? e.message : String(e),
            }).eq('id', runId);
          }
        }
      })();

      // @ts-ignore - EdgeRuntime existe no Deno Deploy
      if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime?.waitUntil) {
        // @ts-ignore
        EdgeRuntime.waitUntil(task);
      }

      return new Response(JSON.stringify({
        ok: true,
        background: true,
        run_id: runId,
        message: 'Sincronização de tecidos iniciada em background. Acompanhe em /admin (histórico de runs).',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }





    if (action === 'lotes_live' || action === 'series_live') {
      let payload: any = {};
      try { payload = await req.json(); } catch { /* ignore */ }
      const cdItem = String(payload?.cdItem ?? '').trim();
      const cdDeposito = String(payload?.cdDeposito ?? '').trim();
      if (!cdItem || !cdDeposito) throw new Error('cdItem e cdDeposito são obrigatórios.');
      const data = action === 'lotes_live'
        ? await fetchLotesLive(auth, cdItem, cdDeposito)
        : await fetchSeriesLive(auth, cdItem, cdDeposito);
      return new Response(JSON.stringify({ ok: true, data, source: action }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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
