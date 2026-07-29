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

const DEFAULT_AUGE_BASE_URL = (Deno.env.get('AUGE_BASE_URL') ?? 'https://unilux.auge.app').replace(/\/$/, '');
const FALLBACK_AUGE_USERNAME = Deno.env.get('AUGE_USERNAME') ?? '';
const FALLBACK_AUGE_PASSWORD = Deno.env.get('AUGE_PASSWORD') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Per-invocation credentials (replace previous module-level mutables)
let AUGE_BASE_URL = DEFAULT_AUGE_BASE_URL;
let AUGE_USERNAME = '';
let AUGE_PASSWORD = '';

/**
 * Load Auge credentials.
 * - If userId is provided: try `auge_user_credentials` for that user.
 *   If not found, throw AUGE_CREDENTIALS_MISSING (never fall back to another user's or the admin's credentials).
 * - If userId is null (cron/system): fall back to env `AUGE_USERNAME`/`AUGE_PASSWORD` (system automations).
 */
async function loadAugeCredentials(admin: ReturnType<typeof createClient>, userId: string | null) {
  AUGE_BASE_URL = DEFAULT_AUGE_BASE_URL;
  AUGE_USERNAME = '';
  AUGE_PASSWORD = '';

  if (userId) {
    const { data } = await admin
      .from('auge_user_credentials')
      .select('base_url,username,password')
      .eq('user_id', userId)
      .maybeSingle();
    if (!data || !data.username || !data.password) {
      const err: any = new Error('AUGE_CREDENTIALS_MISSING');
      err.code = 'AUGE_CREDENTIALS_MISSING';
      throw err;
    }
    if (data.base_url && String(data.base_url).trim()) AUGE_BASE_URL = String(data.base_url).trim().replace(/\/$/, '');
    AUGE_USERNAME = String(data.username).trim();
    AUGE_PASSWORD = String(data.password);
    return;
  }

  // System/cron path: use env fallback only
  AUGE_USERNAME = FALLBACK_AUGE_USERNAME;
  AUGE_PASSWORD = FALLBACK_AUGE_PASSWORD;
}


const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const TRANSFERENCIA_BACKFILL_BATCH = 8;

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

// listaTagsCustomizadas.php retorna HTML (linhas <tr>) com JSON no último <td>.
async function fetchListaTagsCustomizadas(
  auth: { jar: Jar; csrf: string; apiToken: string | null },
  cdConfiguracao: string,
  dsTagCustomizada = '',
): Promise<any[]> {
  const path = '/l.unilux/modInventario/tag/ajax/listaTagsCustomizadas.php';
  const body = new URLSearchParams();
  if (cdConfiguracao) body.set('cdConfiguracao', cdConfiguracao);
  if (dsTagCustomizada) body.set('dsTagCustomizada', dsTagCustomizada);
  const headers: Record<string, string> = {
    'Cookie': auth.jar.header(),
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    'X-Requested-With': 'XMLHttpRequest',
    'X-CSRF-TOKEN': auth.csrf,
    'Origin': AUGE_BASE_URL,
    'Referer': `${AUGE_BASE_URL}/l.unilux/modInventario/tag/manterTagCustomizada.php`,
    'User-Agent': UA,
    'Accept': 'text/html, */*; q=0.01',
    'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
  };
  if (auth.apiToken) headers['Authorization'] = `Bearer ${auth.apiToken}`;
  const res = await fetch(`${AUGE_BASE_URL}${path}`, { method: 'POST', headers, body });
  auth.jar.ingest(res);
  const html = await res.text();
  if (!res.ok) throw new Error(`POST ${path} HTTP ${res.status} body=${html.slice(0,200)}`);
  const rows: any[] = [];
  // Cada <tr> contém, no último <td> (oculto), um JSON stringificado do objeto.
  const trRe = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let m: RegExpExecArray | null;
  while ((m = trRe.exec(html)) !== null) {
    const inner = m[1];
    // pega o último <td>
    const tds = [...inner.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)];
    if (!tds.length) continue;
    const raw = tds[tds.length - 1][1]
      .replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      .replace(/<[^>]+>/g, '').trim();
    if (!raw.startsWith('{')) continue;
    try {
      const obj = JSON.parse(raw);
      if (obj && (obj.cdTagCustomizada || obj.cdConfiguracao)) rows.push(obj);
    } catch { /* linha de cabeçalho / não-JSON */ }
  }
  return rows;
}

// tagSelectListaConfiguracoes.php — Select2 do lookup "Configuração".
// Retorna [{id:"<codigo>", text:"Descrição ... [<codigo>]"}, ...].
async function fetchSelectConfiguracoes(
  auth: { jar: Jar; csrf: string; apiToken: string | null },
  term: string,
  nrPagina = 1,
  qtdItens = 500,
): Promise<Array<{ id: string; text: string }>> {
  const path = '/l.unilux/modInventario/tag/ajax/tagSelectListaConfiguracoes.php';
  const body = new URLSearchParams({ term, nrPagina: String(nrPagina), qtdItens: String(qtdItens) });
  const headers: Record<string, string> = {
    'Cookie': auth.jar.header(),
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    'X-Requested-With': 'XMLHttpRequest',
    'X-CSRF-TOKEN': auth.csrf,
    'Origin': AUGE_BASE_URL,
    'Referer': `${AUGE_BASE_URL}/l.unilux/modInventario/tag/manterTagCustomizada.php`,
    'User-Agent': UA,
    'Accept': 'application/json, text/javascript, */*; q=0.01',
    'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
  };
  if (auth.apiToken) headers['Authorization'] = `Bearer ${auth.apiToken}`;
  const res = await fetch(`${AUGE_BASE_URL}${path}`, { method: 'POST', headers, body });
  auth.jar.ingest(res);
  const text = await res.text();
  if (!res.ok) throw new Error(`POST ${path} HTTP ${res.status} body=${text.slice(0,200)}`);
  const trimmed = text.trim();
  if (!trimmed) return [];
  try {
    const j = JSON.parse(trimmed);
    if (Array.isArray(j)) return j;
    if (Array.isArray(j?.results)) return j.results;
    if (Array.isArray(j?.data)) return j.data;
    return [];
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Lookup "Tag Calculada" (select2 do formulário manterTagCustomizada.php).
// O Auge não devolve `dsTagCalculada` na listagem, então a lista de TAGs
// calculadas precisa ser consultada ao vivo. Como o caminho exato do ajax pode
// variar entre versões do Auge, tentamos alguns candidatos e memorizamos o
// primeiro que responder com dados.
// ---------------------------------------------------------------------------
const TAG_CALCULADA_PATHS = [
  // Fonte oficial: página /modInventario/tag/tag.php usa este select com a
  // lista COMPLETA de TAGs calculadas ([{value, text}]).
  '/l.unilux/modInventario/tag/ajax/tagSelectTag.php',
  '/l.unilux/modInventario/tag/ajax/tagSelectListaTagsCalculadas.php',
  '/l.unilux/modInventario/tag/ajax/tagSelectListaTagCalculada.php',
  '/l.unilux/modInventario/tag/ajax/selectListaTagsCalculadas.php',
  '/l.unilux/modInventario/tag/ajax/listaTagsCalculadas.php',
];
let TAG_CALCULADA_PATH_OK: string | null = null;

function parseSelectRows(text: string): Array<{ id: string; text: string }> {
  const trimmed = (text ?? '').trim();
  if (!trimmed) return [];
  // 1) JSON (select2)
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const j = JSON.parse(trimmed);
      const arr = Array.isArray(j) ? j : (Array.isArray(j?.results) ? j.results : (Array.isArray(j?.data) ? j.data : []));
      return arr
        .map((r: any) => ({
          id: String(r?.id ?? r?.value ?? r?.cdTag ?? r?.cdTagCalculada ?? r?.dsTagCalculada ?? '').trim(),
          text: String(r?.text ?? r?.nmTag ?? r?.dsTagCalculada ?? r?.nmTagCalculada ?? r?.id ?? '').trim(),
        }))
        .filter((r: { id: string; text: string }) => r.text.length > 0);
    } catch { /* cai para HTML */ }
  }
  // 2) HTML com <option value="..">texto</option>
  const out: Array<{ id: string; text: string }> = [];
  const re = /<option[^>]*value=["']([^"']*)["'][^>]*>([\s\S]*?)<\/option>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(trimmed)) !== null) {
    const label = m[2].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').trim();
    if (label) out.push({ id: m[1].trim() || label, text: label });
  }
  return out;
}

async function fetchSelectTagsCalculadas(
  auth: { jar: Jar; csrf: string; apiToken: string | null },
  term: string,
  nrPagina = 1,
  qtdItens = 500,
): Promise<Array<{ id: string; text: string }>> {
  const headers: Record<string, string> = {
    'Cookie': auth.jar.header(),
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    'X-Requested-With': 'XMLHttpRequest',
    'X-CSRF-TOKEN': auth.csrf,
    'Origin': AUGE_BASE_URL,
    'Referer': `${AUGE_BASE_URL}/l.unilux/modInventario/tag/manterTagCustomizada.php`,
    'User-Agent': UA,
    'Accept': 'application/json, text/javascript, text/html, */*; q=0.01',
    'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
  };
  if (auth.apiToken) headers['Authorization'] = `Bearer ${auth.apiToken}`;

  const candidates = TAG_CALCULADA_PATH_OK ? [TAG_CALCULADA_PATH_OK, ...TAG_CALCULADA_PATHS] : TAG_CALCULADA_PATHS;
  const tried = new Set<string>();
  for (const path of candidates) {
    if (tried.has(path)) continue;
    tried.add(path);
    try {
      const body = new URLSearchParams({
        term,
        q: term,
        dsTagCalculada: term,
        nrPagina: String(nrPagina),
        qtdItens: String(qtdItens),
      });
      const res = await fetch(`${AUGE_BASE_URL}${path}`, { method: 'POST', headers, body });
      auth.jar.ingest(res);
      const text = await res.text();
      if (!res.ok) continue;
      const rows = parseSelectRows(text);
      if (rows.length > 0) {
        TAG_CALCULADA_PATH_OK = path;
        return rows;
      }
    } catch { /* tenta o próximo candidato */ }
  }
  return [];
}

// ---------------------------------------------------------------------------
// Grade da página /modInventario/tag/tag.php — fonte CORRETA das TAGs
// calculadas, pois traz Nome, Descrição e Fórmula em colunas separadas.
// O select2 (tagSelectTag.php) devolve apenas o rótulo "FORMULA\NOME", que em
// vários casos NÃO corresponde ao Nome real cadastrado no Auge.
// O caminho do ajax pode variar entre versões: tentamos candidatos e
// memorizamos o primeiro que responder com linhas.
// ---------------------------------------------------------------------------
const TAG_GRID_PATHS = [
  '/l.unilux/modInventario/tag/ajax/listaTags.php',
  '/l.unilux/modInventario/tag/ajax/listaTag.php',
  '/l.unilux/modInventario/tag/ajax/getTags.php',
  '/l.unilux/modInventario/tag/ajax/getTag.php',
  '/l.unilux/modInventario/tag/ajax/tagLista.php',
];
let TAG_GRID_PATH_OK: string | null = null;

export type TagCalculadaRow = {
  cd_tag: string;
  nome: string;
  descricao: string | null;
  formula: string | null;
};

function pickStr(obj: Record<string, unknown>, keys: string[]): string {
  for (const k of keys) {
    const v = obj?.[k];
    if (v !== undefined && v !== null && String(v).trim() !== '') return String(v).trim();
  }
  return '';
}

function normalizeTagGridObject(obj: Record<string, unknown>): TagCalculadaRow | null {
  const cd = pickStr(obj, ['cdTag', 'cdTagCalculada', 'idTag', 'id']);
  const nome = pickStr(obj, ['nmTag', 'nmTagCalculada', 'dsNomeTag', 'nome', 'nmTagCalc']);
  const descricao = pickStr(obj, ['dsTag', 'dsTagCalculada', 'descricao', 'dsDescricao']);
  const formula = pickStr(obj, ['dsFormula', 'formula', 'dsExpressao', 'dsCalculo']);
  if (!nome && !descricao) return null;
  return {
    cd_tag: cd || nome || descricao,
    nome: nome || descricao,
    descricao: descricao || null,
    formula: formula || null,
  };
}

// Extrai linhas tanto de resposta JSON quanto de HTML (<tr> com JSON no último <td>).
function parseTagGridResponse(text: string): TagCalculadaRow[] {
  const trimmed = (text ?? '').trim();
  if (!trimmed) return [];
  const out: TagCalculadaRow[] = [];

  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const j = JSON.parse(trimmed);
      const arr = Array.isArray(j)
        ? j
        : (Array.isArray((j as any)?.data) ? (j as any).data
          : (Array.isArray((j as any)?.rows) ? (j as any).rows
            : (Array.isArray((j as any)?.results) ? (j as any).results : [])));
      for (const r of arr) {
        const row = normalizeTagGridObject(r ?? {});
        if (row) out.push(row);
      }
      if (out.length) return out;
    } catch { /* cai para HTML */ }
  }

  const trRe = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let m: RegExpExecArray | null;
  while ((m = trRe.exec(trimmed)) !== null) {
    const tds = [...m[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)]
      .map((t) => t[1]
        .replace(/&quot;/g, '"').replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
        .replace(/<[^>]+>/g, '').trim());
    if (!tds.length) continue;

    // 1) JSON escondido no último <td>
    const last = tds[tds.length - 1];
    if (last.startsWith('{')) {
      try {
        const row = normalizeTagGridObject(JSON.parse(last));
        if (row) { out.push(row); continue; }
      } catch { /* segue para leitura por colunas */ }
    }

    // 2) Colunas visíveis: Nome | Descrição | (Fórmula)
    const cols = tds.filter((c) => c.length > 0 && !c.startsWith('{'));
    if (cols.length >= 2) {
      const [nome, descricao, formula] = cols;
      // Ignora rótulos de formulário ("Nome:", "Tag:", "Operador:") e cabeçalhos.
      const isLabel = (v: string) => /:$/.test(v.trim());
      if (nome && !/^nome$/i.test(nome) && !isLabel(nome) && !isLabel(descricao ?? '')) {
        out.push({ cd_tag: nome, nome, descricao: descricao || null, formula: formula || null });
      }
    }
  }
  return out;
}

// Descobre os endpoints ajax realmente usados pela página tag.php, lendo o HTML
// da própria página (mais confiável do que adivinhar nomes de arquivo).
async function discoverTagGridPaths(
  auth: { jar: Jar; csrf: string; apiToken: string | null },
): Promise<{ paths: string[]; pageHtml: string }> {
  const headers: Record<string, string> = {
    'Cookie': auth.jar.header(),
    'User-Agent': UA,
    'Accept': 'text/html,application/xhtml+xml,*/*;q=0.8',
    'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
    'Referer': `${AUGE_BASE_URL}/l.unilux/modInventario/`,
  };
  if (auth.apiToken) headers['Authorization'] = `Bearer ${auth.apiToken}`;
  try {
    const res = await fetch(`${AUGE_BASE_URL}/l.unilux/modInventario/tag/tag.php`, { headers });
    auth.jar.ingest(res);
    const html = await res.text();
    const found = new Set<string>();
    for (const m of html.matchAll(/['"]([^'"]*ajax\/[A-Za-z0-9_.-]+\.php)['"]/gi)) {
      let p = m[1];
      if (p.startsWith('http')) {
        try { p = new URL(p).pathname; } catch { continue; }
      } else if (!p.startsWith('/')) {
        p = `/l.unilux/modInventario/tag/${p.replace(/^\.\//, '')}`;
      }
      found.add(p);
    }
    return { paths: [...found], pageHtml: html };
  } catch {
    return { paths: [], pageHtml: '' };
  }
}

async function fetchTagsCalculadasGrid(
  auth: { jar: Jar; csrf: string; apiToken: string | null },
): Promise<TagCalculadaRow[]> {
  const headers: Record<string, string> = {
    'Cookie': auth.jar.header(),
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    'X-Requested-With': 'XMLHttpRequest',
    'X-CSRF-TOKEN': auth.csrf,
    'Origin': AUGE_BASE_URL,
    'Referer': `${AUGE_BASE_URL}/l.unilux/modInventario/tag/tag.php`,
    'User-Agent': UA,
    'Accept': 'application/json, text/html, */*; q=0.01',
    'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
  };
  if (auth.apiToken) headers['Authorization'] = `Bearer ${auth.apiToken}`;

  const { paths: discovered, pageHtml } = await discoverTagGridPaths(auth);

  // A própria página já pode vir com a grade renderizada.
  if (pageHtml) {
    const inline = parseTagGridResponse(pageHtml);
    if (inline.length > 0) return inline;
  }

  const candidates = [
    ...(TAG_GRID_PATH_OK ? [TAG_GRID_PATH_OK] : []),
    // endpoints descobertos com "tag"/"lista" no nome primeiro
    ...discovered.filter((p) => /(lista|list|get|grid|consulta).*tag|tag.*(lista|list|grid)/i.test(p)),
    ...discovered,
    ...TAG_GRID_PATHS,
  ];
  const tried = new Set<string>();
  for (const path of candidates) {
    if (tried.has(path)) continue;
    tried.add(path);
    // Endpoints de select2 não servem (devolvem "FORMULA\NOME" sem colunas).
    if (/select/i.test(path)) continue;
    try {
      const body = new URLSearchParams({
        nrPagina: '1',
        qtdItens: '100000',
        idAtivo: 'Y',
        dsPesquisaGeral: '',
      });
      const res = await fetch(`${AUGE_BASE_URL}${path}`, { method: 'POST', headers, body });
      auth.jar.ingest(res);
      const text = await res.text();
      if (!res.ok) continue;
      const rows = parseTagGridResponse(text);
      if (rows.length > 0) {
        TAG_GRID_PATH_OK = path;
        return rows;
      }
    } catch { /* tenta o próximo candidato */ }
  }
  return [];
}



// Varre todas as configurações do Auge iterando termos de 1-2 caracteres
// alfanuméricos (Select2 exige minimumInputLength). Dedupa por id.
async function scanAllConfiguracoes(
  auth: { jar: Jar; csrf: string; apiToken: string | null },
  onProgress?: (found: number, doneTerms: number, totalTerms: number, currentTerm: string) => Promise<void>,
  onBatch?: (rows: Array<{ id: string; text: string }>) => Promise<void>,
): Promise<Map<string, string>> {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyz'.split('');
  const found = new Map<string, string>();
  const drillDown: string[] = [];
  let done = 0;
  const total = chars.length;

  const scanTerm = async (term: string): Promise<boolean> => {
    // retorna true se saturou (>= 500 na primeira página) — candidato a drill-down
    let page = 1;
    let saturated = false;
    while (true) {
      const rows = await fetchSelectConfiguracoes(auth, term, page, 500);
      const fresh: Array<{ id: string; text: string }> = [];
      for (const r of rows) {
        if (!r?.id) continue;
        const id = String(r.id);
        if (!found.has(id)) fresh.push({ id, text: String(r.text ?? '') });
        found.set(id, String(r.text ?? ''));
      }
      if (fresh.length && onBatch) await onBatch(fresh);
      if (page === 1 && rows.length >= 500) saturated = true;
      if (rows.length < 500) break;
      page++;
      if (page > 20) { saturated = true; break; }
    }
    return saturated;
  };

  // Concurrency para descoberta — dispara vários termos em paralelo.
  const CONC = 6;
  let ci = 0;
  const runners = Array.from({ length: CONC }, () => (async () => {
    while (true) {
      const i = ci++;
      if (i >= chars.length) return;
      const c = chars[i];
      try {
        const sat = await scanTerm(c);
        if (sat) drillDown.push(c);
      } catch { /* segue */ }
      done++;
      if (onProgress) await onProgress(found.size, done, total, c);
    }
  })());
  await Promise.all(runners);

  // Drill-down também em paralelo.
  const pairs: string[] = [];
  for (const c1 of drillDown) for (const c2 of chars) pairs.push(c1 + c2);
  let pi = 0;
  const drillers = Array.from({ length: CONC }, () => (async () => {
    while (true) {
      const i = pi++;
      if (i >= pairs.length) return;
      const term = pairs[i];
      try { await scanTerm(term); } catch { /* segue */ }
      if (onProgress) await onProgress(found.size, done, total, term);
    }
  })());
  await Promise.all(drillers);

  return found;
}

const TAG_CONFIG_CHARS = '0123456789abcdefghijklmnopqrstuvwxyz'.split('');
const TAG_CONFIG_SEED_TERMS = Array.from(new Set([
  '',
  ...TAG_CONFIG_CHARS,
  ...'áàãâéêíóôõúüç'.split(''),
  '.', '-', '_', '/', ' ',
]));
// Descoberta genérica de configurações: o Auge não restringe configuração ao
// padrão fixo. Começamos por termos alfanuméricos amplos e, quando o
// Select2 satura, aprofundamos com todos os caracteres (a -> aa, ab, a0...).
const TAG_CONFIG_PREFIXES = TAG_CONFIG_SEED_TERMS;
const TAG_DISCOVERY_PREFIX_CHUNK = 8;
const TAG_DISCOVERY_PAGE_SIZE = 500;
const TAG_DISCOVERY_TERM_CHUNK = 3;
const TAG_DISCOVERY_PAIR_CHUNK = 12;
const TAG_SCAN_CHUNK_SIZE = 120;
const TAG_SCAN_CONCURRENCY = 6;

async function scanConfiguracaoTerm(
  auth: { jar: Jar; csrf: string; apiToken: string | null },
  term: string,
): Promise<{ rows: Array<{ id: string; text: string }>; saturated: boolean }> {
  const map = new Map<string, string>();
  let page = 1;
  let saturated = false;

  while (true) {
    const rows = await fetchSelectConfiguracoes(auth, term, page, TAG_DISCOVERY_PAGE_SIZE);
    for (const r of rows) {
      if (!r?.id) continue;
      map.set(String(r.id), String(r.text ?? ''));
    }
    if (page === 1 && rows.length >= TAG_DISCOVERY_PAGE_SIZE) saturated = true;
    if (rows.length < TAG_DISCOVERY_PAGE_SIZE) break;
    page++;
    if (page > 30) {
      saturated = true;
      break;
    }
  }

  return {
    rows: Array.from(map.entries()).map(([id, text]) => ({ id, text })),
    saturated,
  };
}

async function upsertTagConfigScanRows(
  admin: any,
  rows: Array<{ id: string; text: string }>,
) {
  if (!rows.length) return;
  const deduped = Array.from(
    rows.reduce((acc, row) => {
      const id = String(row.id ?? '').trim();
      if (id) acc.set(id, String(row.text ?? ''));
      return acc;
    }, new Map<string, string>()).entries(),
  ).map(([id, text]) => ({
    cd_configuracao: id,
    nm_configuracao: text,
    qtd_tags: 0,
    // Deixa null para que a fase scan_tags só varra pendentes (incremental).
    // Configurações já escaneadas anteriormente NÃO são resetadas graças ao ignoreDuplicates.
    last_scanned_at: null,
    erro: null,
  }));

  if (!deduped.length) return;
  const { error } = await admin
    .from('auge_tag_custom_scan')
    .upsert(deduped, { onConflict: 'cd_configuracao', ignoreDuplicates: true });
  if (error) throw new Error(`Falha ao gravar configurações de TAG: ${error.message}`);
}

async function countTagConfigs(admin: any): Promise<number> {
  const { count } = await admin
    .from('auge_tag_custom_scan')
    .select('cd_configuracao', { count: 'exact', head: true });
  return count ?? 0;
}

async function countTagConfigsPending(admin: any): Promise<number> {
  const { count } = await admin
    .from('auge_tag_custom_scan')
    .select('cd_configuracao', { count: 'exact', head: true })
    .is('last_scanned_at', null);
  return count ?? 0;
}


async function saveTagRun(admin: any, runId: string, detalhes: any, extra?: any) {
  await admin.from('auge_sync_runs').update({ detalhes, ...(extra ?? {}) }).eq('id', runId);
}

async function syncTagCustomChunk(admin: any, auth: any, runId: string) {
  const { data: run } = await admin
    .from('auge_sync_runs')
    .select('status, detalhes')
    .eq('id', runId)
    .maybeSingle();

  if (!run || run.status !== 'running') return { ok: true, ignored: true };

  const detalhes = (run.detalhes ?? {}) as any;
  const stage = detalhes.stage ?? 'discover_prefix';

  if (stage === 'discover_prefix') {
    const prefixIndex = Number(detalhes.prefix_index ?? 0);
    const extraPrefixes: string[] = Array.isArray(detalhes.extra_prefixes) ? [...detalhes.extra_prefixes] : [];
    const extraIndex = Number(detalhes.extra_index ?? 0);

    // Combina prefixos base + extras (drill-down) numa fila unificada
    const basePrefixes = TAG_CONFIG_PREFIXES.slice(prefixIndex, prefixIndex + TAG_DISCOVERY_PREFIX_CHUNK);
    const needMore = basePrefixes.length < TAG_DISCOVERY_PREFIX_CHUNK;
    const extrasNeeded = needMore ? TAG_DISCOVERY_PREFIX_CHUNK - basePrefixes.length : 0;
    const chosenExtras = extraPrefixes.slice(extraIndex, extraIndex + Math.max(extrasNeeded, basePrefixes.length ? 0 : TAG_DISCOVERY_PREFIX_CHUNK));
    const prefixes = [...basePrefixes, ...chosenExtras];

    if (!prefixes.length) {
      const discovered = await countTagConfigs(admin);
      const nextDetails = {
        ...detalhes,
        stage: 'scan_tags',
        phase: `varrendo TAGs — ${discovered} configurações`,
        current: 0,
        total: discovered,
        cfg_count: discovered,
      };
      await saveTagRun(admin, runId, nextDetails, { rows_upserted: discovered });
      selfInvoke('sync_tag_custom_chunk', runId);
      return { ok: true, stage: 'scan_tags', discovered };
    }

    const foundRows: Array<{ id: string; text: string }> = [];
    let errors = Number(detalhes.errors ?? 0);
    const newDrillDowns: string[] = [];
    for (const prefix of prefixes) {
      try {
        const result = await scanConfiguracaoTerm(auth, prefix);
        foundRows.push(...result.rows.map((row) => ({ id: String(row.id ?? ''), text: String(row.text ?? '') })));
        // Drill-down: se o termo saturou, aprofunda em todo alfanumérico.
        if (result.saturated && prefix.length < 8) {
          for (const char of TAG_CONFIG_CHARS) newDrillDowns.push(`${prefix}${char}`);
        }
      } catch {
        errors += 1;
      }
    }
    await upsertTagConfigScanRows(admin, foundRows);

    const discovered = await countTagConfigs(admin);
    const nextPrefixIndex = Math.min(prefixIndex + basePrefixes.length, TAG_CONFIG_PREFIXES.length);
    const nextExtraIndex = extraIndex + chosenExtras.length;
      const mergedExtras = Array.from(new Set([...extraPrefixes, ...newDrillDowns]));
    const doneBase = nextPrefixIndex >= TAG_CONFIG_PREFIXES.length;
    const doneExtras = nextExtraIndex >= mergedExtras.length;
    const donePrefixes = doneBase && doneExtras;
    const totalQueue = TAG_CONFIG_PREFIXES.length + mergedExtras.length;
    const currentQueue = nextPrefixIndex + nextExtraIndex;

    const firstLabel = prefixes[0] || 'todos';
    const lastLabel = prefixes[prefixes.length - 1] || 'todos';
    const label = firstLabel === lastLabel ? firstLabel : `${firstLabel}…${lastLabel}`;
    const nextDetails = {
      ...detalhes,
      stage: donePrefixes ? 'scan_tags' : 'discover_prefix',
      phase: donePrefixes
        ? `varrendo TAGs — ${discovered} configurações`
        : `descobrindo configurações [${label}] — ${discovered} encontradas`,
      prefix_index: nextPrefixIndex,
      extra_prefixes: mergedExtras,
      extra_index: nextExtraIndex,
      cfg_offset: detalhes.cfg_offset ?? 0,
      current: donePrefixes ? 0 : currentQueue,
      total: donePrefixes ? discovered : totalQueue,
      cfg_count: discovered,
      com_tag: 0,
      sem_tag: 0,
      errors,
    };

    await saveTagRun(admin, runId, nextDetails, { rows_processed: 0, rows_upserted: discovered });
    selfInvoke('sync_tag_custom_chunk', runId);
    return { ok: true, stage: nextDetails.stage, discovered };
  }

  if (stage === 'discover_terms') {
    const termIndex = Number(detalhes.term_index ?? 0);
    const terms = TAG_CONFIG_CHARS.slice(termIndex, termIndex + TAG_DISCOVERY_TERM_CHUNK);
    const saturatedTerms = Array.isArray(detalhes.saturated_terms) ? [...detalhes.saturated_terms] : [];

    const results = await Promise.allSettled(terms.map((term) => scanConfiguracaoTerm(auth, term)));
    const foundRows: Array<{ id: string; text: string }> = [];
    results.forEach((result, index) => {
      if (result.status !== 'fulfilled') return;
      foundRows.push(...result.value.rows);
      if (result.value.saturated) saturatedTerms.push(terms[index]);
    });
    await upsertTagConfigScanRows(admin, foundRows);

    const discovered = await countTagConfigs(admin);
    const nextIndex = termIndex + terms.length;
    const nextDetails = {
      ...detalhes,
      stage: nextIndex >= TAG_CONFIG_CHARS.length ? 'discover_pairs' : 'discover_terms',
      phase: nextIndex >= TAG_CONFIG_CHARS.length
        ? `aprofundando configurações — ${discovered} encontradas`
        : `descobrindo configurações — ${discovered} encontradas`,
      term_index: nextIndex,
      total_terms: TAG_CONFIG_CHARS.length,
      saturated_terms: Array.from(new Set(saturatedTerms)),
      pair_index: detalhes.pair_index ?? 0,
      current: nextIndex,
      total: TAG_CONFIG_CHARS.length,
      cfg_count: discovered,
      com_tag: 0,
      sem_tag: 0,
      errors: 0,
    };

    await saveTagRun(admin, runId, nextDetails, { rows_processed: 0, rows_upserted: discovered });
    selfInvoke('sync_tag_custom_chunk', runId);
    return { ok: true, stage: nextDetails.stage, discovered };
  }

  if (stage === 'discover_pairs') {
    const saturatedTerms = Array.isArray(detalhes.saturated_terms) ? detalhes.saturated_terms : [];
    const pairs = saturatedTerms.flatMap((term: string) => TAG_CONFIG_CHARS.map((c) => `${term}${c}`));
    const pairIndex = Number(detalhes.pair_index ?? 0);
    const terms = pairs.slice(pairIndex, pairIndex + TAG_DISCOVERY_PAIR_CHUNK);

    const results = await Promise.allSettled(terms.map((term) => scanConfiguracaoTerm(auth, term)));
    const foundRows: Array<{ id: string; text: string }> = [];
    results.forEach((result) => {
      if (result.status === 'fulfilled') foundRows.push(...result.value.rows);
    });
    await upsertTagConfigScanRows(admin, foundRows);

    const discovered = await countTagConfigs(admin);
    const nextIndex = pairIndex + terms.length;
    const donePairs = nextIndex >= pairs.length;
    const nextDetails = {
      ...detalhes,
      stage: donePairs ? 'scan_tags' : 'discover_pairs',
      phase: donePairs
        ? `varrendo TAGs — ${discovered} configurações`
        : `aprofundando configurações — ${discovered} encontradas`,
      pair_index: nextIndex,
      total_pairs: pairs.length,
      cfg_offset: detalhes.cfg_offset ?? 0,
      current: donePairs ? 0 : nextIndex,
      total: donePairs ? discovered : Math.max(pairs.length, 1),
      cfg_count: discovered,
      com_tag: 0,
      sem_tag: 0,
      errors: 0,
    };

    await saveTagRun(admin, runId, nextDetails, { rows_processed: 0, rows_upserted: discovered });
    selfInvoke('sync_tag_custom_chunk', runId);
    return { ok: true, stage: nextDetails.stage, discovered };
  }

  if (stage === 'scan_tags') {
    const totalKnown = Number(detalhes.cfg_count ?? 0) || await countTagConfigs(admin);
    // Busca próximos pendentes (last_scanned_at IS NULL) — pula automaticamente
    // configurações já escaneadas em execuções anteriores.
    const { data: configs = [] } = await admin
      .from('auge_tag_custom_scan')
      .select('cd_configuracao, nm_configuracao')
      .is('last_scanned_at', null)
      .order('cd_configuracao', { ascending: true })
      .limit(TAG_SCAN_CHUNK_SIZE);

    if (!configs.length) {
      const finalDetails = {
        ...detalhes,
        stage: 'done',
        phase: 'concluído',
        current: totalKnown,
        total: totalKnown,
      };
      await saveTagRun(admin, runId, finalDetails, {
        status: 'success',
        finished_at: new Date().toISOString(),
        rows_processed: totalKnown,
        rows_upserted: Number(detalhes.com_tag ?? 0),
      });
      return { ok: true, done: true };
    }

    let idx = 0;
    let comTagDelta = 0;
    let semTagDelta = 0;
    let errDelta = 0;
    const tagRows: any[] = [];
    const scanRows: any[] = [];

    const worker = async () => {
      while (true) {
        const i = idx++;
        if (i >= configs.length) return;
        const cfg = configs[i] as any;
        const cd = String(cfg.cd_configuracao ?? '').trim();
        if (!cd) continue;
        try {
          const rows = await fetchListaTagsCustomizadas(auth, cd, '');
          if (rows.length) {
            comTagDelta++;
            tagRows.push(...rows.map((r) => ({
              cd_configuracao: cd,
              nm_configuracao: r.nmConfiguracao ?? cfg.nm_configuracao ?? null,
              cd_tag_customizada: String(r.cdTagCustomizada ?? ''),
              nm_tag_customizada: r.nmTagCustomizada ?? null,
              ds_tag_customizada: r.dsTagCustomizada ?? null,
              cd_tag_calculada: r.cdTagCalculada ?? null,
              ds_tag_calculada: r.dsTagCalculada ?? null,
              ds_tag_texto: r.dsTagTexto ?? null,
              raw: r,
              synced_at: new Date().toISOString(),
            })).filter((r) => r.cd_tag_customizada));
          } else {
            semTagDelta++;
          }
          scanRows.push({
            cd_configuracao: cd,
            nm_configuracao: cfg.nm_configuracao ?? null,
            qtd_tags: rows.length,
            last_scanned_at: new Date().toISOString(),
            erro: null,
          });
        } catch (e) {
          errDelta++;
          scanRows.push({
            cd_configuracao: cd,
            nm_configuracao: cfg.nm_configuracao ?? null,
            qtd_tags: 0,
            last_scanned_at: new Date().toISOString(),
            erro: getErrorMessage(e).slice(0, 400),
          });
        }
      }
    };

    await Promise.all(Array.from({ length: TAG_SCAN_CONCURRENCY }, () => worker()));

    if (tagRows.length) {
      const dedupedTags = Array.from(
        tagRows.reduce((acc, row) => {
          acc.set(`${row.cd_configuracao}::${row.cd_tag_customizada}`, row);
          return acc;
        }, new Map<string, any>()).values(),
      );
      await admin.from('auge_tag_custom').upsert(dedupedTags, { onConflict: 'cd_configuracao,cd_tag_customizada' });
    }
    if (scanRows.length) {
      await admin.from('auge_tag_custom_scan').upsert(scanRows, { onConflict: 'cd_configuracao' });
    }

    const pendingLeft = await countTagConfigsPending(admin);
    const scannedNow = Math.max(0, totalKnown - pendingLeft);
    const comTag = Number(detalhes.com_tag ?? 0) + comTagDelta;
    const semTag = Number(detalhes.sem_tag ?? 0) + semTagDelta;
    const errors = Number(detalhes.errors ?? 0) + errDelta;
    const done = pendingLeft === 0;
    const nextDetails = {
      ...detalhes,
      stage: done ? 'done' : 'scan_tags',
      phase: done ? 'concluído' : `varrendo TAGs (pulando já escaneadas) — restam ${pendingLeft}`,
      cfg_offset: scannedNow,
      current: scannedNow,
      total: totalKnown,
      cfg_count: totalKnown,
      com_tag: comTag,
      sem_tag: semTag,
      errors,
    };

    await saveTagRun(admin, runId, nextDetails, {
      status: done ? 'success' : 'running',
      finished_at: done ? new Date().toISOString() : null,
      rows_processed: scannedNow,
      rows_upserted: comTag,
      error_message: done && errors ? `${errors} erro(s) durante varredura` : null,
    });
    if (!done) selfInvoke('sync_tag_custom_chunk', runId);
    return { ok: true, done, current: nextDetails.current, total: totalKnown };
  }


  return { ok: true, stage };
}

// ============================================================================
// AUDITORIA DE COBERTURA — varre configurações no Auge sem assumir padrão de
// código e compara com o que temos gravado em auge_tag_custom_scan. Grava cada ID descoberto em
// auge_tag_audit_hits, e ao final calcula gaps (faltantes) e extras (órfãos).
// ============================================================================
async function auditTagNamespaceChunk(admin: any, auth: any, runId: string) {
  const { data: run } = await admin
    .from('auge_sync_runs')
    .select('status, detalhes')
    .eq('id', runId)
    .maybeSingle();
  if (!run || run.status !== 'running') return { ok: true, ignored: true };
  const detalhes = (run.detalhes ?? {}) as any;
  const stage = detalhes.stage ?? 'audit_discover';

  if (stage === 'audit_discover') {
    const prefixIndex = Number(detalhes.prefix_index ?? 0);
    const extraPrefixes: string[] = Array.isArray(detalhes.extra_prefixes) ? [...detalhes.extra_prefixes] : [];
    const extraIndex = Number(detalhes.extra_index ?? 0);

    const basePrefixes = TAG_CONFIG_PREFIXES.slice(prefixIndex, prefixIndex + TAG_DISCOVERY_PREFIX_CHUNK);
    const extrasNeeded = Math.max(0, TAG_DISCOVERY_PREFIX_CHUNK - basePrefixes.length);
    const chosenExtras = extraPrefixes.slice(extraIndex, extraIndex + extrasNeeded);
    const prefixes = [...basePrefixes, ...chosenExtras];

    if (!prefixes.length) {
      // Fim da descoberta → calcula diff
      await saveTagRun(admin, runId, { ...detalhes, stage: 'audit_diff', phase: 'calculando lacunas' });
      selfInvoke('audit_tag_namespace_chunk', runId);
      return { ok: true, stage: 'audit_diff' };
    }

    let errors = Number(detalhes.errors ?? 0);
    let saturated = Number(detalhes.saturated ?? 0);
    const newDrillDowns: string[] = [];
    const hitRows: Array<{ run_id: string; cd_configuracao: string; nm_configuracao: string | null; prefix: string }> = [];

    const results = await Promise.allSettled(prefixes.map((p) => scanConfiguracaoTerm(auth, p)));
    results.forEach((r, i) => {
      const prefix = prefixes[i];
      if (r.status !== 'fulfilled') { errors++; return; }
      for (const row of r.value.rows) {
        const cd = String(row.id ?? '').trim();
        if (!cd) continue;
        hitRows.push({ run_id: runId, cd_configuracao: cd, nm_configuracao: String(row.text ?? '') || null, prefix });
      }
      if (r.value.saturated && prefix.length < 8) {
        saturated++;
        for (const char of TAG_CONFIG_CHARS) newDrillDowns.push(`${prefix}${char}`);
      }
    });

    if (hitRows.length) {
      // dedupe por cd_configuracao (mantém primeiro)
      const map = new Map<string, typeof hitRows[number]>();
      for (const r of hitRows) if (!map.has(r.cd_configuracao)) map.set(r.cd_configuracao, r);
      const deduped = Array.from(map.values());
      // chunked insert para evitar payload gigante
      for (let i = 0; i < deduped.length; i += 500) {
        const slice = deduped.slice(i, i + 500);
        await admin.from('auge_tag_audit_hits').upsert(slice, { onConflict: 'run_id,cd_configuracao' });
      }
    }

    const nextPrefixIndex = Math.min(prefixIndex + basePrefixes.length, TAG_CONFIG_PREFIXES.length);
    const nextExtraIndex = extraIndex + chosenExtras.length;
      const mergedExtras = Array.from(new Set([...extraPrefixes, ...newDrillDowns]));
    const doneBase = nextPrefixIndex >= TAG_CONFIG_PREFIXES.length;
    const doneExtras = nextExtraIndex >= mergedExtras.length;
    const done = doneBase && doneExtras;

    const { count: hitsCount = 0 } = await admin
      .from('auge_tag_audit_hits')
      .select('cd_configuracao', { count: 'exact', head: true })
      .eq('run_id', runId);

    const totalQueue = TAG_CONFIG_PREFIXES.length + mergedExtras.length;
    const currentQueue = nextPrefixIndex + nextExtraIndex;
    const firstLabel = prefixes[0] || 'todos';
    const lastLabel = prefixes[prefixes.length - 1] || 'todos';
    const label = firstLabel === lastLabel ? firstLabel : `${firstLabel}…${lastLabel}`;

    const nextDetails = {
      ...detalhes,
      stage: done ? 'audit_diff' : 'audit_discover',
      phase: done ? 'calculando lacunas' : `auditando [${label}] — ${hitsCount} IDs no Auge`,
      prefix_index: nextPrefixIndex,
      extra_prefixes: mergedExtras,
      extra_index: nextExtraIndex,
      current: done ? totalQueue : currentQueue,
      total: totalQueue,
      hits: hitsCount,
      saturated,
      errors,
    };
    await saveTagRun(admin, runId, nextDetails);
    selfInvoke('audit_tag_namespace_chunk', runId);
    return { ok: true, stage: nextDetails.stage, hits: hitsCount };
  }

  if (stage === 'audit_diff') {
    // Compara auge_tag_audit_hits (run_id) vs auge_tag_custom_scan
    const remoteSet = new Set<string>();
    let from = 0;
    const step = 1000;
    while (true) {
      const { data } = await admin
        .from('auge_tag_audit_hits')
        .select('cd_configuracao')
        .eq('run_id', runId)
        .range(from, from + step - 1);
      const rows = (data ?? []) as Array<{ cd_configuracao: string }>;
      for (const r of rows) remoteSet.add(r.cd_configuracao);
      if (rows.length < step) break;
      from += step;
    }

    const localSet = new Set<string>();
    from = 0;
    while (true) {
      const { data } = await admin
        .from('auge_tag_custom_scan')
        .select('cd_configuracao')
        .range(from, from + step - 1);
      const rows = (data ?? []) as Array<{ cd_configuracao: string }>;
      for (const r of rows) localSet.add(r.cd_configuracao);
      if (rows.length < step) break;
      from += step;
    }

    const missing: string[] = []; // no Auge mas não temos localmente
    const extras: string[] = [];  // temos localmente mas não veio na varredura
    for (const cd of remoteSet) if (!localSet.has(cd)) missing.push(cd);
    for (const cd of localSet) if (!remoteSet.has(cd)) extras.push(cd);
    missing.sort();
    extras.sort();

    const coveragePct = remoteSet.size === 0 ? 100
      : Math.round(((remoteSet.size - missing.length) / remoteSet.size) * 10000) / 100;

    const finalDetails = {
      ...detalhes,
      stage: 'done',
      phase: 'auditoria concluída',
      hits: remoteSet.size,
      local_count: localSet.size,
      missing_count: missing.length,
      extras_count: extras.length,
      coverage_pct: coveragePct,
      // limita as amostras para não estourar JSONB
      missing_sample: missing.slice(0, 500),
      extras_sample: extras.slice(0, 500),
    };
    await saveTagRun(admin, runId, finalDetails, {
      status: 'success',
      finished_at: new Date().toISOString(),
      rows_processed: remoteSet.size,
      rows_upserted: missing.length,
      error_message: missing.length
        ? `${missing.length} configuração(ões) não estão em auge_tag_custom_scan`
        : null,
    });
    return { ok: true, done: true, missing: missing.length, extras: extras.length };
  }

  return { ok: true, stage };
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
  const raw = String(v).trim();
  const s = raw.includes(',') ? raw.replace(/\./g, '').replace(',', '.') : raw;
  const n = Number(s);
  return isFinite(n) ? n : Number(v) || 0;
}

function cleanText(v: any): string | null {
  if (v == null) return null;
  const s = String(v).replace(/\s+/g, ' ').trim();
  return s === '' ? null : s;
}

function firstText(...values: any[]): string | null {
  for (const value of values) {
    const s = cleanText(value);
    if (s != null) return s;
  }
  return null;
}

function getErrorMessage(error: unknown): string {
  if (error == null) return 'Erro desconhecido';
  if (error instanceof Error) return error.message || error.name || 'Error';
  if (typeof error === 'string') return error;
  if (typeof error === 'object') {
    const e = error as Record<string, any>;
    // Prioridades: message > error > error_description > details > hint > code
    const candidates = [e.message, e.error, e.error_description, e.details, e.hint, e.code, e.statusText];
    for (const c of candidates) {
      if (typeof c === 'string' && c.trim()) return c;
      if (c && typeof c === 'object') {
        try { const s = JSON.stringify(c); if (s && s !== '{}') return s; } catch { /* ignore */ }
      }
    }
    try {
      const s = JSON.stringify(error, Object.getOwnPropertyNames(error as any));
      if (s && s !== '{}') return s;
    } catch { /* ignore */ }
  }
  try { return String(error); } catch { return 'Erro não serializável'; }
}

function serializeError(error: unknown): { message: string; stack?: string; details?: any } {
  const message = getErrorMessage(error);
  const out: { message: string; stack?: string; details?: any } = { message };
  if (error instanceof Error && error.stack) {
    out.stack = error.stack.split('\n').slice(0, 8).join('\n');
  }
  if (error && typeof error === 'object' && !(error instanceof Error)) {
    try {
      const raw = JSON.stringify(error, Object.getOwnPropertyNames(error as any));
      if (raw && raw !== '{}') out.details = JSON.parse(raw);
    } catch { /* ignore */ }
  }
  return out;
}

function normalizeDescricaoProduto(v: any, codigo?: any): string | null {
  const s = cleanText(v);
  if (!s) return null;
  const code = cleanText(codigo);
  return code ? cleanText(s.replace(new RegExp(`\\s*\\[${code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\]\\s*$`), '')) : s;
}

function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/tr>/gi, '\n')
    .replace(/<\/td>|<\/th>/gi, ' | ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
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
      errors.push(`${p.path}: ${getErrorMessage(e)}`);
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

function toAugeDateParam(value: string | null | undefined): string | null {
  const s = cleanText(value);
  if (!s) return null;
  const br = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (br) return s;
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`;
  return null;
}

function daysBackDateParam(daysBack: number): string {
  const de = new Date(Date.now() - daysBack * 24 * 3600 * 1000);
  const dd = String(de.getDate()).padStart(2, '0');
  const mm = String(de.getMonth() + 1).padStart(2, '0');
  const yyyy = de.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

async function fetchTransferenciasPHP(auth: any, daysBack = 60, dateFrom?: string | null, dateTo?: string | null) {
  const dtCriacaoDe = toAugeDateParam(dateFrom) ?? daysBackDateParam(daysBack);
  const dtCriacaoAte = toAugeDateParam(dateTo) ?? '';
  const body = new URLSearchParams({
    dtCriacaoDe,
    dtCriacaoAte,
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
  const cdTransf = r.cdTransferenciaEstoque ?? r.cd_transferencia_estoque ?? r.cdTransferencia ?? r.cdMovimentacao ?? null;
  const cdMov = r.cdMovEstoqueERP ?? r.cd_mov_estoque_erp ?? r.cdMovERP ?? r.cdMov ?? null;
  const nrErp = r.nrTransfEstoqueERP ?? r.nr_transf_estoque_erp ?? r.nrDocumentoERP ?? r.nrMovEstoqueERP ?? null;
  const nrPortal = r.nrTransferencia ?? r.nr_transferencia ?? r.nrDocumento ?? null;
  const tipoDoc = r.idTipoDocumento ?? r.tipoDocumento ?? r.dsTipoDocumento ?? null;
  const isSap = /sap/i.test(String(tipoDoc ?? ''));
  const stableCode = isSap
    ? (cdMov ?? nrErp ?? cdTransf ?? nrPortal ?? r.id ?? '')
    : (cdTransf ?? cdMov ?? nrPortal ?? nrErp ?? r.id ?? '');
  const detailIds = Array.from(new Set([cdTransf, cdMov, nrErp, nrPortal].filter(Boolean).map(String)));
  return {
    id_externo: `transf-php:${stableCode || `${r.nmUsuarioCriacao ?? ''}-${r.dtCriacao ?? ''}`}`,
    _cd: stableCode ? String(stableCode) : null,        // interno: usado para enriquecimento (transferencia OU mov)
    _cd_mov: cdMov ? String(cdMov) : null,   // preferido para endpoint de detalhe (cdMov=)
    _cd_transf: cdTransf ? String(cdTransf) : null,
    _detail_ids: detailIds,
    deposito_origem: cleanText(r.cdDepositoOrigem ?? r.nmDepositoOrigem),
    deposito_destino: cleanText(r.cdDepositoDestino ?? r.nmDepositoDestino),
    codigo_produto: cleanText(r.cdItem),
    descricao_produto: normalizeDescricaoProduto(r.nmItem ?? r.dsItem ?? r.descricaoProduto, r.cdItem),
    quantidade: parseNum(r.qtItem),
    situacao: r.idSituacao ?? null,
    ds_situacao: r.dsSituacao ?? null,
    data_movimento: parseDateBR(r.dtCriacao),
    usuario_criacao: r.nmUsuarioCriacao ?? null,
    usuario_efetivacao: r.nmUsuarioEfetivacao ?? null,
    usuario_enviou_logistica: r.nmUsuarioEnviouLogistica ?? null,
    usuario_recebido_logistica: r.nmUsuarioRecebidoLogistica ?? null,
    valor: parseNum(r.vlCustoMovimentacao),
    documento: isSap ? firstText(cdTransf, nrPortal, nrErp, cdMov) : firstText(cdTransf, nrPortal, cdMov),
    nr_efetivacao: firstText(nrErp, isSap ? cdMov : null),
    ds_efetivacao: r.dsEfetivacao ?? null,
    observacao: r.dsObservacao ?? r.dsObs ?? null,
    raw: { ...r, _cd: stableCode ? String(stableCode) : null, _cdMovErp: cdMov ? String(cdMov) : null, _cdTransf: cdTransf ? String(cdTransf) : null, _detailIds: detailIds },
    synced_at: new Date().toISOString(),
  };
}

// Extrai campos da página HTML manterTransferenciaEstoque.php.
// Procura por <select name="X">…<option value="Y" selected>Texto</option>… e
// <input name="X" value="Y" />, cobrindo os principais campos.
function parseTransferenciaHTML(html: string): Record<string, any> | null {
  if (!html || html.length < 200) return null;
  const out: Record<string, any> = {};

  // Selects: name -> [selected value, selected text]
  const selectRe = /<select\b[^>]*\bname=["']([^"']+)["'][^>]*>([\s\S]*?)<\/select>/gi;
  let m: RegExpExecArray | null;
  while ((m = selectRe.exec(html)) !== null) {
    const name = m[1];
    const inner = m[2];
    const optRe = /<option\b([^>]*)>([\s\S]*?)<\/option>/gi;
    let om: RegExpExecArray | null;
    while ((om = optRe.exec(inner)) !== null) {
      const attrs = om[1];
      const label = om[2].replace(/<[^>]+>/g, '').trim();
      if (/\bselected\b/i.test(attrs)) {
        const vm = /\bvalue=["']([^"']*)["']/i.exec(attrs);
        const v = vm ? vm[1] : label;
        if (v !== '' && v !== '0') {
          out[name] = v;
          out[`${name}__label`] = label;
        }
        break;
      }
    }
  }

  // Inputs: name/value/type
  const inputRe = /<input\b([^>]+)\/?>/gi;
  while ((m = inputRe.exec(html)) !== null) {
    const attrs = m[1];
    const nm = /\bname=["']([^"']+)["']/i.exec(attrs);
    const vm = /\bvalue=["']([^"']*)["']/i.exec(attrs);
    const tm = /\btype=["']([^"']+)["']/i.exec(attrs);
    if (!nm) continue;
    const name = nm[1];
    if (out[name] !== undefined) continue;
    const type = tm ? tm[1].toLowerCase() : 'text';
    if (type === 'submit' || type === 'button' || type === 'image') continue;
    if (type === 'checkbox' || type === 'radio') {
      if (/\bchecked\b/i.test(attrs)) out[name] = vm ? vm[1] : 'on';
      continue;
    }
    if (vm && vm[1] !== '') out[name] = vm[1];
  }

  // inicializaLinhas([{...}, ...]) — dados reais dos itens embutidos no HTML
  try {
    const initRe = /inicializaLinhas\s*\(\s*(\[[\s\S]*?\])\s*\)\s*;/;
    const im = initRe.exec(html);
    if (im) {
      // JSON-like com aspas simples e sem quoting de chaves em alguns casos —
      // primeiro tenta JSON.parse; se falhar, converte para aspas duplas.
      let raw = im[1];
      let arr: any = null;
      try { arr = JSON.parse(raw); } catch {
        // Substitui aspas simples por duplas e cita chaves não citadas
        const norm = raw
          .replace(/'/g, '"')
          .replace(/([{,]\s*)([A-Za-z_][A-Za-z0-9_]*)\s*:/g, '$1"$2":');
        try { arr = JSON.parse(norm); } catch { arr = null; }
      }
      if (Array.isArray(arr) && arr.length > 0) {
        const item = arr[0];
        for (const k of Object.keys(item)) {
          if (out[k] === undefined && item[k] !== '' && item[k] !== null) {
            out[k] = item[k];
          }
        }
        out._itens = arr;
      }
    }
  } catch { /* ignore */ }

  // Se não encontramos absolutamente nada de identificável, devolve null
  if (!out.cdDepositoOrigem && !out.cdDepositoDestino && !out.cdItem
      && !out.cdTransferenciaEstoque && !out.cdMovEstoqueERP) {
    return null;
  }
  return out;
}



function mergeTransferenciaDetalhe(row: any, det: any, itens: any[]) {
  row.deposito_origem = cleanText(det.cdDepositoOrigem ?? det.nmDepositoOrigem) ?? row.deposito_origem ?? null;
  row.deposito_destino = cleanText(det.cdDepositoDestino ?? det.nmDepositoDestino) ?? row.deposito_destino ?? null;
  row.codigo_produto = cleanText(det.cdItem) ?? row.codigo_produto ?? null;
  row.descricao_produto = normalizeDescricaoProduto(
    det.nmItem ?? det.dsItem ?? det.descricaoProduto ?? det.textAbrev,
    det.cdItem ?? row.codigo_produto,
  ) ?? row.descricao_produto ?? null;
  row.observacao = firstText(row.observacao, det.dsObservacao, det.observacao);
  const qtdTransf = parseNum(det.qtdTransferencia ?? det.quantidade ?? det.qtItem);
  if (qtdTransf && itens.length <= 1) row.quantidade = qtdTransf;
  row.raw = { ...(row.raw ?? {}), _detalhe: det, _itens: itens };
  row.detalhe_sincronizado_em = new Date().toISOString();
}

function mergeDetailPayload(base: any | null, extra: any | null): any | null {
  if (!base) return extra;
  if (!extra) return base;
  const merged = { ...base };
  for (const [key, value] of Object.entries(extra)) {
    if (!hasValue(merged[key]) && hasValue(value)) merged[key] = value;
  }
  return merged;
}

function transferenciaDetailIds(row: any): string[] {
  const raw = row.raw ?? {};
  const values = [
    ...(Array.isArray(row._detail_ids) ? row._detail_ids : []),
    ...(Array.isArray(raw._detailIds) ? raw._detailIds : []),
    row._cd_transf,
    row._cd_mov,
    row._cd,
    raw._cdTransf,
    raw._cdMovErp,
    raw.cdTransferenciaEstoque,
    raw.cdMovEstoqueERP,
    raw.nrTransfEstoqueERP,
    row.documento,
    row.nr_efetivacao,
  ];
  return Array.from(new Set(values.map(cleanText).filter(Boolean) as string[]));
}

function parseTransferenciaRelatorio(html: string): { det: any | null; itens: any[] } {
  const text = htmlToText(html);
  if (!text) return { det: null, itens: [] };
  const det: any = {};
  const grab = (patterns: RegExp[]) => {
    for (const re of patterns) {
      const m = text.match(re);
      const value = cleanText(m?.[1]);
      if (value) return value;
    }
    return null;
  };
  det.cdDepositoOrigem = grab([/Dep[oó]sito\s+Origem\s*[:|-]\s*([0-9]{1,3})\b/i, /Origem\s*[:|-]\s*([0-9]{1,3})\s*[-–]/i]);
  det.cdDepositoDestino = grab([/Dep[oó]sito\s+Destino\s*[:|-]\s*([0-9]{1,3})\b/i, /Destino\s*[:|-]\s*([0-9]{1,3})\s*[-–]/i]);
  det.cdItem = grab([/\b(\d+(?:\.\d+){2,})\b/]);
  det.qtdTransferencia = grab([/Quantidade\s*[:|-]\s*([0-9.,]+)/i, /Qtd\.?\s*[:|-]\s*([0-9.,]+)/i]);
  det.dsObservacao = grab([/Observa[cç][aã]o\s*[:|-]\s*(.{1,240}?)(?:\s+Item\b|\s+Produto\b|\s+Total\b|$)/i]);
  const hasData = det.cdDepositoOrigem || det.cdDepositoDestino || det.cdItem || det.qtdTransferencia || det.dsObservacao;
  return { det: hasData ? det : null, itens: hasData ? [det] : [] };
}

async function fetchTransferenciaRelatorio(
  auth: { jar: Jar; csrf: string; apiToken: string | null },
  cd: string,
  tipoDoc: string | null,
  tipoMov: string | null,
): Promise<{ det: any | null; itens: any[]; status: number }> {
  const qs = new URLSearchParams({
    cdTransferenciaEstoque: cd,
    idTipoDoc: tipoDoc || 'PORTAL',
    idTipoMovimentacao: tipoMov || 'T',
  });
  const path = `/l.unilux/modInventario/estoque/relatorioTransferenciaEstoque.php?${qs}`;
  const headers: Record<string, string> = {
    'Cookie': auth.jar.header(),
    'X-CSRF-TOKEN': auth.csrf,
    'Referer': `${AUGE_BASE_URL}/l.unilux/modInventario/estoque/gerirTransferenciaEstoque.php`,
    'User-Agent': UA,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  };
  if (auth.apiToken) headers['Authorization'] = `Bearer ${auth.apiToken}`;
  const res = await fetch(`${AUGE_BASE_URL}${path}`, { method: 'GET', headers });
  auth.jar.ingest(res);
  if (!res.ok) return { det: null, itens: [], status: res.status };
  const html = await res.text();
  return { ...parseTransferenciaRelatorio(html), status: res.status };
}

async function fetchTransferenciaHTML(
  auth: { jar: Jar; csrf: string; apiToken: string | null },
  ids: string[],
  tipoDoc: string | null,
  tipoMov: string | null,
): Promise<{ det: any | null; itens: any[]; debug: { status: number; path: string }[] }> {
  const debug: { status: number; path: string }[] = [];
  const cleanIds = Array.from(new Set(ids.map(cleanText).filter(Boolean) as string[]));
  const base = '/l.unilux/modInventario/estoque/manterTransferenciaEstoque.php';
  for (const cd of cleanIds) {
    const candidates = [
      new URLSearchParams({ cdTransferenciaEstoque: cd, idTipoDocumento: tipoDoc || 'PORTAL', idTipoMovimentacao: tipoMov || 'T' }),
      new URLSearchParams({ cdMovimentacao: cd, idTipoDocumento: tipoDoc || 'PORTAL', idTipoMovimentacao: tipoMov || 'T' }),
      new URLSearchParams({ cdMov: cd, idTipoDocumento: tipoDoc || 'PORTAL', idTipoMovimentacao: tipoMov || 'T' }),
      new URLSearchParams({ cdMovEstoqueERP: cd, idTipoDocumento: tipoDoc || 'PORTAL', idTipoMovimentacao: tipoMov || 'T' }),
    ];
    for (const qs of candidates) {
      const path = `${base}?${qs}`;
      try {
        const headers: Record<string, string> = {
          'Cookie': auth.jar.header(),
          'X-CSRF-TOKEN': auth.csrf,
          'Referer': `${AUGE_BASE_URL}/l.unilux/modInventario/estoque/gerirTransferenciaEstoque.php`,
          'User-Agent': UA,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        };
        if (auth.apiToken) headers['Authorization'] = `Bearer ${auth.apiToken}`;
        const res = await fetch(`${AUGE_BASE_URL}${path}`, { method: 'GET', headers });
        auth.jar.ingest(res);
        debug.push({ status: res.status, path });
        if (!res.ok) continue;
        const parsed = parseTransferenciaHTML(await res.text());
        if (parsed) {
          const itens = Array.isArray(parsed._itens) ? parsed._itens : [];
          return { det: parsed, itens, debug };
        }
      } catch {
        debug.push({ status: -1, path });
      }
    }
  }
  return { det: null, itens: [], debug };
}

// Busca itens da transferência via getMovItensAndControle.php.
// Endpoint confirmado no HAR: POST cdMov=<chave do botão imprimir/editar> -> {data:[{cdItem, cdDepositoOrigem, cdDepositoDestino, qtdTransferencia, ...}]}
async function fetchTransferenciaDetalhe(
  auth: { jar: Jar; csrf: string; apiToken: string | null },
  ids: string[],
  tipoDoc: string | null = null,
  tipoMov: string | null = 'T',
): Promise<{ det: any | null; itens: any[]; debug: { status: number; path: string }[] }> {
  const debug: { status: number; path: string }[] = [];
  const cleanIds = Array.from(new Set(ids.map(cleanText).filter(Boolean) as string[]));
  if (!cleanIds.length) return { det: null, itens: [], debug };
  const base = '/l.unilux/modInventario/estoque/ajax';
  let bestDet: any | null = null;
  let bestItens: any[] = [];
  for (const cd of cleanIds) {
    try {
      const path = `${base}/getMovItensAndControle.php`;
      const headers: Record<string, string> = {
        'Cookie': auth.jar.header(),
        'X-Requested-With': 'XMLHttpRequest',
        'X-CSRF-TOKEN': auth.csrf,
        'Referer': `${AUGE_BASE_URL}/l.unilux/modInventario/estoque/gerirTransferenciaEstoque.php`,
        'User-Agent': UA,
        'Accept': 'application/json, text/javascript, */*; q=0.01',
      };
      if (auth.apiToken) headers['Authorization'] = `Bearer ${auth.apiToken}`;
      headers['Content-Type'] = 'application/x-www-form-urlencoded';
      const res = await fetch(`${AUGE_BASE_URL}${path}`, {
        method: 'POST',
        headers,
        body: new URLSearchParams({ cdMov: cd }).toString(),
      });
      auth.jar.ingest(res);
      debug.push({ status: res.status, path: `${path}?cdMov=${cd}` });
      if (!res.ok) continue;
      const text = await res.text();
      let j: any;
      try { j = JSON.parse(text); } catch { continue; }
      const arr: any[] = Array.isArray(j?.data) ? j.data : [];
      if (arr.length > 0) {
        bestDet = mergeDetailPayload(bestDet, arr[0]);
        if (bestItens.length === 0) bestItens = arr;
        const primary = bestDet ?? arr[0];
        if (hasValue(primary.cdDepositoOrigem ?? primary.nmDepositoOrigem) &&
            hasValue(primary.cdDepositoDestino ?? primary.nmDepositoDestino) &&
            hasValue(primary.cdItem)) {
          return { det: primary, itens: bestItens, debug };
        }
      }
    } catch {
      debug.push({ status: -1, path: `${base}/getMovItensAndControle.php?cdMov=${cd}` });
    }
  }

  try {
    const html = await fetchTransferenciaHTML(auth, cleanIds, tipoDoc, tipoMov);
    debug.push(...html.debug);
    if (html.det) {
      bestDet = mergeDetailPayload(bestDet, html.det);
      if (html.itens.length > 0) bestItens = html.itens;
      if (bestDet) return { det: bestDet, itens: bestItens, debug };
    }
  } catch {
    debug.push({ status: -1, path: 'manterTransferenciaEstoque.php' });
  }

  for (const cd of cleanIds) {
    try {
      const report = await fetchTransferenciaRelatorio(auth, cd, tipoDoc, tipoMov);
      debug.push({ status: report.status, path: `relatorioTransferenciaEstoque.php?cdTransferenciaEstoque=${cd}` });
      if (report.det) {
        bestDet = mergeDetailPayload(bestDet, report.det);
        if (bestItens.length === 0) bestItens = report.itens;
        if (bestDet) return { det: bestDet, itens: bestItens, debug };
      }
    } catch {
      debug.push({ status: -1, path: `relatorioTransferenciaEstoque.php?cdTransferenciaEstoque=${cd}` });
    }
  }
  if (bestDet) return { det: bestDet, itens: bestItens, debug };
  return { det: null, itens: [], debug };
}


// Enriquece linhas cujos campos-chave (origem/destino/item) estão faltando.
async function enrichTransferencias(
  auth: { jar: Jar; csrf: string; apiToken: string | null },
  rows: any[],
  concurrency = 4,
  maxToEnrich = 300,
): Promise<{ enriched: number; failed: number; attempted: number; sample_debug?: any }> {
  const pending = rows.filter(r => {
    if (!(r._cd_mov || r._cd_transf || r._cd)) return false;
    const rawObs = firstText(r.raw?.dsObservacao, r.raw?.dsObs, r.raw?._detalhe?.dsObservacao, r.raw?._item?.dsObservacao);
    return !hasValue(r.deposito_origem) ||
      !hasValue(r.deposito_destino) ||
      !hasValue(r.codigo_produto) ||
      !hasValue(r.descricao_produto) ||
      (!!rawObs && !hasValue(r.observacao));
  }).slice(0, maxToEnrich);

  let enriched = 0;
  let failed = 0;
  let idx = 0;
  let sampleDebug: any = null;

  async function worker() {
    while (idx < pending.length) {
      const i = idx++;
      const row = pending[i];
      const tipoDoc = firstText(row.raw?.idTipoDocumento, row.raw?.tipoDocumento);
      const tipoMov = firstText(row.raw?.idTipoMovimentacao) ?? 'T';
      const { det, itens, debug } = await fetchTransferenciaDetalhe(auth, transferenciaDetailIds(row), tipoDoc, tipoMov);
      if (!det) {
        failed++;
        if (!sampleDebug) sampleDebug = { ids: transferenciaDetailIds(row), tipoDoc, debug };
        continue;
      }
      mergeTransferenciaDetalhe(row, det, itens);
      enriched++;
    }
  }


  await Promise.all(Array.from({ length: Math.min(concurrency, pending.length) }, worker));
  return { enriched, failed, attempted: pending.length, sample_debug: sampleDebug };
}

function transferenciaPatch(row: any): Record<string, any> {
  const raw = row.raw ?? {};
  const tipoDoc = firstText(raw.idTipoDocumento, raw.tipoDocumento);
  const isSap = /sap/i.test(String(tipoDoc ?? ''));
  const cdTransf = firstText(raw.cdTransferenciaEstoque, raw.cdTransferencia, raw._cdTransf);
  const cdMov = firstText(raw.cdMovEstoqueERP, raw.cdMov, raw._cdMovErp);
  const nrErp = firstText(raw.nrTransfEstoqueERP, raw.nrDocumentoERP, raw.nrMovEstoqueERP);
  return {
    deposito_origem: row.deposito_origem ?? null,
    deposito_destino: row.deposito_destino ?? null,
    codigo_produto: row.codigo_produto ?? null,
    descricao_produto: row.descricao_produto ?? null,
    quantidade: Number(row.quantidade ?? 0),
    documento: firstText(row.documento, isSap ? cdTransf : null, raw.nrTransferencia, isSap ? nrErp : null, !isSap ? cdTransf : null, cdMov),
    nr_efetivacao: firstText(row.nr_efetivacao, nrErp, isSap ? cdMov : null),
    observacao: firstText(row.observacao, raw.dsObservacao, raw.dsObs),
    raw: row.raw,
    detalhe_sincronizado_em: row.detalhe_sincronizado_em ?? null,
    synced_at: new Date().toISOString(),
  };
}

async function fillTransferenciaProductDescriptions(admin: any, rows: any[]) {
  const missingCodes = Array.from(new Set(
    rows
      .filter((row: any) => !hasValue(row.descricao_produto) && hasValue(row.codigo_produto))
      .map((row: any) => String(row.codigo_produto))
  ));
  if (missingCodes.length === 0) return rows;

  const descricoes = new Map<string, string>();
  for (let i = 0; i < missingCodes.length; i += 500) {
    const chunk = missingCodes.slice(i, i + 500);
    const { data, error } = await admin
      .from('auge_produtos')
      .select('codigo,descricao')
      .in('codigo', chunk);
    if (error) throw error;
    for (const produto of data ?? []) {
      const codigo = cleanText(produto.codigo);
      const descricao = cleanText(produto.descricao);
      if (codigo && descricao) descricoes.set(codigo, descricao);
    }
  }

  return rows.map((row: any) => ({
    ...row,
    descricao_produto: row.descricao_produto ?? descricoes.get(String(row.codigo_produto)) ?? null,
  }));
}

function hasValue(v: any): boolean {
  if (v === null || v === undefined) return false;
  if (typeof v === 'string') return v.trim() !== '';
  if (typeof v === 'number') return Number.isFinite(v) && v !== 0;
  return true;
}

function transferenciaNeedsBackfill(row: any): boolean {
  const raw = row.raw ?? {};
  const rawObs = firstText(raw.dsObservacao, raw.dsObs, raw._detalhe?.dsObservacao, raw._item?.dsObservacao);
  return !hasValue(row.deposito_origem) ||
    !hasValue(row.deposito_destino) ||
    !hasValue(row.codigo_produto) ||
    !hasValue(row.descricao_produto) ||
    !hasValue(row.documento) ||
    !hasValue(row.nr_efetivacao) ||
    (!!rawObs && !hasValue(row.observacao));
}

function preserveTransferenciaDetalhes(row: any, existing?: any): any {
  if (!existing) return row;
  const merged = { ...row };
  for (const field of [
    'deposito_origem',
    'deposito_destino',
    'codigo_produto',
    'descricao_produto',
    'nr_efetivacao',
    'observacao',
    'usuario_criacao',
    'usuario_efetivacao',
    'usuario_enviou_logistica',
    'usuario_recebido_logistica',
    'ds_efetivacao',
    'detalhe_sincronizado_em',
  ]) {
    if (!hasValue(merged[field]) && hasValue(existing[field])) merged[field] = existing[field];
  }
  if (!hasValue(merged.quantidade) && hasValue(existing.quantidade)) merged.quantidade = existing.quantidade;
  merged.raw = { ...(existing.raw ?? {}), ...(row.raw ?? {}) };
  return merged;
}

async function fetchExistingTransferencias(admin: any, rows: any[]) {
  const out = new Map<string, any>();
  const ids = Array.from(new Set(rows.map((r: any) => r.id_externo).filter(Boolean)));
  // IDs de transferências item-a-item podem ser longos; usamos chunks pequenos
  // para não estourar o limite de URL do PostgREST (erro "error sending request").
  for (let i = 0; i < ids.length; i += 60) {
    const chunk = ids.slice(i, i + 60);
    const { data, error } = await admin
      .from('auge_transferencias')
      .select('id_externo,deposito_origem,deposito_destino,codigo_produto,descricao_produto,quantidade,nr_efetivacao,observacao,usuario_criacao,usuario_efetivacao,usuario_enviou_logistica,usuario_recebido_logistica,ds_efetivacao,detalhe_sincronizado_em,raw')
      .in('id_externo', chunk);
    if (error) throw error;
    for (const row of data ?? []) out.set(row.id_externo, row);
  }
  return out;
}

function transferenciaItemId(baseId: string, item: any, index: number): string {
  const line = cleanText(item?.idLinha) ?? String(index);
  const code = cleanText(item?.cdItem) ?? 'sem-item';
  return `${baseId}:item:${line}:${code}`;
}

function expandTransferenciaItens(row: any): any[] {
  const itens = Array.isArray(row.raw?._itens) ? row.raw._itens : [];
  if (itens.length === 0) return [row];
  return itens.map((item: any, index: number) => ({
    ...row,
    id_externo: transferenciaItemId(row.id_externo, item, index),
    deposito_origem: cleanText(item.cdDepositoOrigem ?? item.nmDepositoOrigem) ?? row.deposito_origem,
    deposito_destino: cleanText(item.cdDepositoDestino ?? item.nmDepositoDestino) ?? row.deposito_destino,
    codigo_produto: cleanText(item.cdItem) ?? row.codigo_produto,
    descricao_produto: normalizeDescricaoProduto(item.nmItem ?? item.dsItem ?? item.textAbrev, item.cdItem) ?? row.descricao_produto,
    quantidade: parseNum(item.qtdTransferencia ?? item.quantidade ?? item.qtItem) || row.quantidade,
    raw: { ...(row.raw ?? {}), _item: item, _item_index: index },
  }));
}

async function backfillTransferenciasChunk(admin: any, auth: { jar: Jar; csrf: string; apiToken: string | null }, runId: string) {
  const state = await loadTecidosState(admin, runId);
  const lastId = cleanText(state.last_id);
  let q = admin
    .from('auge_transferencias')
    .select('*')
      .or('deposito_origem.is.null,deposito_destino.is.null,codigo_produto.is.null,descricao_produto.is.null,observacao.is.null,documento.is.null,nr_efetivacao.is.null')
    .order('id', { ascending: true })
    .limit(TRANSFERENCIA_BACKFILL_BATCH);
  if (lastId) q = q.gt('id', lastId);

  const { data: rows, error } = await q;
  if (error) throw error;
  if (!rows?.length) {
    await admin.from('auge_sync_runs').update({
      status: 'success',
      finished_at: new Date().toISOString(),
      rows_processed: state.processed ?? 0,
      rows_upserted: state.enriched ?? 0,
      detalhes: { ...state, phase: 'done', finished_at: new Date().toISOString() },
    }).eq('id', runId);
    return;
  }

  let enriched = 0;
  let failed = 0;
  let sampleDebug = state.sample_debug ?? null;
  const pendingRows = rows.filter(transferenciaNeedsBackfill);
  for (const row of pendingRows) {
    try {
      const tipoDoc = firstText(row.raw?.idTipoDocumento, row.raw?.tipoDocumento);
      const tipoMov = firstText(row.raw?.idTipoMovimentacao) ?? 'T';
      const mutable = { ...row };
      const { det, itens, debug } = await fetchTransferenciaDetalhe(auth, transferenciaDetailIds(mutable), tipoDoc, tipoMov);
      if (det) {
        mergeTransferenciaDetalhe(mutable, det, itens);
        const { id: _oldId, created_at: _createdAt, updated_at: _updatedAt, ...baseRow } = row;
        const expanded = expandTransferenciaItens(mutable).map((expandedRow: any) => ({
          ...baseRow,
          ...transferenciaPatch(expandedRow),
          id_externo: expandedRow.id_externo,
          situacao: row.situacao,
          ds_situacao: row.ds_situacao,
          data_movimento: row.data_movimento,
          usuario_criacao: row.usuario_criacao,
          usuario_efetivacao: row.usuario_efetivacao,
          usuario_enviou_logistica: row.usuario_enviou_logistica,
          usuario_recebido_logistica: row.usuario_recebido_logistica,
          valor: row.valor,
        }));
        const existing = await fetchExistingTransferencias(admin, expanded);
        const rowsToUpsert = await fillTransferenciaProductDescriptions(
          admin,
          expanded.map((expandedRow: any) => preserveTransferenciaDetalhes(expandedRow, existing.get(expandedRow.id_externo)))
        );
        const { error: updError } = await admin.from('auge_transferencias').upsert(rowsToUpsert, { onConflict: 'id_externo' });
        if (updError) throw updError;
        if (expanded.some((expandedRow: any) => expandedRow.id_externo !== row.id_externo)) {
          await admin.from('auge_transferencias').delete().eq('id', row.id);
        }
        enriched++;
      } else {
        failed++;
        if (!sampleDebug) sampleDebug = { id: row.id, ids: transferenciaDetailIds(row), tipoDoc, debug };
      }
    } catch (e) {
      failed++;
      if (!sampleDebug) sampleDebug = { id: row.id, error: String((e as any)?.message ?? e) };
    }
  }

  const nextState = {
    ...state,
    phase: 'backfill',
    last_id: rows[rows.length - 1].id,
    processed: (state.processed ?? 0) + rows.length,
    attempted: (state.attempted ?? 0) + pendingRows.length,
    enriched: (state.enriched ?? 0) + enriched,
    failed: (state.failed ?? 0) + failed,
    sample_debug: sampleDebug,
  };
  await saveTecidosState(admin, runId, nextState);
  selfInvoke('transferencias_backfill_chunk', runId);
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

async function syncEntity(
  admin: any,
  auth: { jar: Jar; csrf: string; apiToken: string | null },
  entity: Entity,
  triggeredBy: string | null,
  options: { dateFrom?: string | null; dateTo?: string | null } = {},
) {
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
      const days = daysSince(lastMax, 7, 120);
      const { data: items, path } = await fetchTransferenciasPHP(auth, days, options.dateFrom, options.dateTo);
      processed = items.length;
      const mapped = items.map(mapTransferencia).filter(r => r.id_externo);
      // Enriquece com endpoint de detalhe (origem/destino/item)
      const enrichStats = await enrichTransferencias(auth, mapped, 4, 800);
      // Remove campo interno antes do upsert
      const rows = mapped
        .flatMap((row: any) => expandTransferenciaItens(row))
        .map(({ _cd, _cd_mov, _cd_transf, _detail_ids, ...rest }: any) => rest);
      const existing = await fetchExistingTransferencias(admin, rows);
      const rowsToUpsert = await fillTransferenciaProductDescriptions(
        admin,
        rows.map((row: any) => preserveTransferenciaDetalhes(row, existing.get(row.id_externo)))
      );
      newMaxDt = maxDateISO(rowsToUpsert);
      const { error, count } = await admin.from('auge_transferencias')
        .upsert(rowsToUpsert, { onConflict: 'id_externo', count: 'exact' });
      if (error) throw error;
      const aggregateIdsToRemove = mapped
        .filter((row: any) => Array.isArray(row.raw?._itens) && row.raw._itens.length > 0)
        .map((row: any) => row.id_externo)
        .filter(Boolean);
      if (aggregateIdsToRemove.length > 0) {
        await admin.from('auge_transferencias').delete().in('id_externo', aggregateIdsToRemove);
      }
      upserted = count ?? rowsToUpsert.length;
      await admin.from('auge_sync_runs').update({
        detalhes: { path, days_back: days, date_from: options.dateFrom, date_to: options.dateTo, last_max_dt: lastMax, enrich: enrichStats },
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
    const info = serializeError(e);
    const nowIso = new Date().toISOString();
    await admin.from('auge_sync_runs').update({
      status: 'error',
      finished_at: nowIso,
      error_message: info.message,
      detalhes: { entity, stack: info.stack ?? null, details: info.details ?? null },
    }).eq('id', runId);
    await admin.from('auge_sync_state').upsert({
      entidade: entity,
      last_synced_at: nowIso,
      last_status: 'error',
      last_error: info.message,
    }, { onConflict: 'entidade' });
    return { entity, error: info.message };
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
  const s = String(v).trim().replace(/\s/g, '');
  if (!s) return 0;

  let normalized = s;
  if (normalized.includes(',')) {
    normalized = normalized.replace(/\./g, '').replace(',', '.');
  } else {
    const dotCount = (normalized.match(/\./g) ?? []).length;
    if (dotCount > 1) {
      const parts = normalized.split('.');
      const last = parts[parts.length - 1];
      normalized = last.length === 3
        ? parts.join('')
        : `${parts.slice(0, -1).join('')}.${last}`;
    }
  }

  const n = Number(normalized);
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
// Aceita separador `\s+` OU `-` entre PROC/NF e a metragem
// (ex.: "NF173523-30m" além de "PROC25/01253 30m").
const TEC_ADDR_RE = /^TEC(\d{1,2})\.([A-Z])\.N(\d{1,2})\s+(.+?)[\s-]+(\d+(?:[.,]\d+)?)\s*M\s*(-\d+)?\s*$/i;
// CHÃO / CHAO / chao / Chão (com ou sem acento, qualquer case)
const CHAO_ADDR_RE = /^CH[ÃA]O\s+(.+?)[\s-]+(\d+(?:[.,]\d+)?)\s*M\s*(-\d+)?\s*$/i;
const DEP_CENTRAL = '01';     // Central
const DEP_PROVISORIO = '11';  // Central Provisório

// Exceções manuais: lotes com endereço mal formatado no Auge que devem ser
// realocados para um endereço fixo conhecido.
const LOTE_ALIASES: Record<string, string> = {
  'TEC0.B1 NF169972 29,5m': 'TEC01.B.N01 NF169972 29,5m',
};

function parseLoteTecido(dsDeposito: string): {
  estrutura: string; coluna: string; nivel: number;
  proc: string; m_linear: number; sufixo: string; endereco: string;
} | null {
  if (!dsDeposito) return null;
  const aliased = LOTE_ALIASES[dsDeposito.trim()] ?? dsDeposito;
  const s = aliased.replace(/\s+/g, ' ').trim();


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

// ============================================================
// Sync de tecidos em chunks (evita CPU-time exceeded no edge runtime).
// Estado persistido em auge_sync_runs.detalhes; auto-encadeado por HTTP self-invoke.
// ============================================================

const TECIDOS_CHUNK_SIZE = 350;          // itens Auge por chunk (350 × 2 HTTPs = 700)
const TECIDOS_AUSENTES_CHUNK_SIZE = 40;  // itens ausentes por chunk (varre depósitos)
const TECIDOS_BATCH = 15;                // concorrência dentro de um chunk

type CompactLote = [string, string, number, string, number]; // [cdItem, descricao, largura, lote, qtd]

function selfInvoke(action: string, runId: string) {
  const url = `${SUPABASE_URL}/functions/v1/auge-sync?action=${action}&run_id=${encodeURIComponent(runId)}`;
  const req = fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SERVICE_ROLE}`,
      'Content-Type': 'application/json',
      'apikey': SERVICE_ROLE,
    },
  }).catch((e) => console.error('selfInvoke error:', e));
  // @ts-ignore EdgeRuntime existe no Deno Deploy
  if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime?.waitUntil) EdgeRuntime.waitUntil(req);
}

async function loadTecidosState(admin: any, runId: string) {
  const { data } = await admin.from('auge_sync_runs').select('detalhes').eq('id', runId).maybeSingle();
  return (data?.detalhes ?? {}) as any;
}

async function saveTecidosState(admin: any, runId: string, patch: any, extra?: any) {
  await admin.from('auge_sync_runs').update({ detalhes: patch, ...(extra ?? {}) }).eq('id', runId);
}

async function tecidosInit(admin: any, runId: string) {
  // Conta total de produtos Auge (não carrega — cada chunk pagina sob demanda)
  const { count } = await admin.from('auge_produtos').select('*', { count: 'exact', head: true });
  const total = count ?? 0;

  const state = {
    phase: 'fetch',
    cursor: 0,
    total,
    brutos01: [] as CompactLote[],
    brutos11: [] as CompactLote[],
    started_at: new Date().toISOString(),
    chunk_count: 0,
  };
  await saveTecidosState(admin, runId, state);
  selfInvoke('sync_tecidos_map_chunk', runId);
  return { runId, total };
}

async function tecidosChunkFetch(admin: any, auth: any, runId: string) {
  const state = await loadTecidosState(admin, runId);
  const cursor = state.cursor ?? 0;
  const total = state.total ?? 0;

  // Página do Auge produtos por range
  const { data: items, error } = await admin
    .from('auge_produtos')
    .select('codigo, descricao')
    .order('codigo', { ascending: true })
    .range(cursor, cursor + TECIDOS_CHUNK_SIZE - 1);
  if (error) throw error;

  const brutos01: CompactLote[] = state.brutos01 ?? [];
  const brutos11: CompactLote[] = state.brutos11 ?? [];

  const list = (items ?? []).filter((p: any) => p.codigo);
  for (let i = 0; i < list.length; i += TECIDOS_BATCH) {
    const chunk = list.slice(i, i + TECIDOS_BATCH);
    const results = await Promise.allSettled(
      chunk.map(async (p: any) => {
        const largura = extractLargura(p.descricao ?? '');
        const [r01, r11] = await Promise.all([
          fetchLotesLive(auth, p.codigo, DEP_CENTRAL).catch(() => []),
          fetchLotesLive(auth, p.codigo, DEP_PROVISORIO).catch(() => []),
        ]);
        return {
          d01: r01.map((r: any) => [p.codigo, p.descricao ?? '', largura, r.lote, r.quantidade] as CompactLote),
          d11: r11.map((r: any) => [p.codigo, p.descricao ?? '', largura, r.lote, r.quantidade] as CompactLote),
        };
      })
    );
    for (const r of results) {
      if (r.status === 'fulfilled') {
        brutos01.push(...r.value.d01);
        brutos11.push(...r.value.d11);
      }
    }
  }

  const newCursor = cursor + TECIDOS_CHUNK_SIZE;
  const done = newCursor >= total || list.length === 0;
  const nextPhase = done ? 'ausentes_init' : 'fetch';
  const newState = {
    ...state,
    phase: nextPhase,
    cursor: done ? 0 : newCursor,
    brutos01,
    brutos11,
    chunk_count: (state.chunk_count ?? 0) + 1,
    last_progress: { cursor: newCursor, total, dep01: brutos01.length, dep11: brutos11.length },
  };
  await saveTecidosState(admin, runId, newState);
  selfInvoke('sync_tecidos_map_chunk', runId);
}

async function tecidosAusentesInit(admin: any, runId: string) {
  const state = await loadTecidosState(admin, runId);

  // Constrói mapa lote_sistema → registro atual (01 prevalece)
  const mapAtual = new Map<string, { raw: CompactLote; cdDep: string }>();
  const semPadrao: { raw: CompactLote; cdDep: string }[] = [];
  const push = (l: CompactLote, cdDep: string) => {
    const addr = parseLoteTecido(l[3]);
    if (!addr) { semPadrao.push({ raw: l, cdDep }); return; }
    mapAtual.set(l[3], { raw: l, cdDep });
  };
  for (const l of (state.brutos11 ?? []) as CompactLote[]) push(l, DEP_PROVISORIO);
  for (const l of (state.brutos01 ?? []) as CompactLote[]) push(l, DEP_CENTRAL);

  // Carrega posições existentes
  const posicoesExist: any[] = [];
  const PAGE = 1000;
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

  // Ausentes agrupados por cdItem
  const ausentes = posicoesExist.filter(p => !mapAtual.has(p.lote_sistema) && p.status !== 'saida');
  const porItem: Record<string, any[]> = {};
  const semItem: string[] = [];
  for (const p of ausentes) {
    const k = p.auge_cd_item || '';
    if (!k) { semItem.push(p.id); continue; }
    (porItem[k] ??= []).push(p);
  }
  const itensAusentes = Object.keys(porItem);

  // Depósitos ativos
  const { data: depsData } = await admin.from('auge_depositos').select('codigo').order('codigo');
  const depsAtivos: string[] = (depsData ?? [])
    .map((d: any) => String(d.codigo).padStart(2, '0'))
    .filter((c: string) => c !== DEP_CENTRAL && c !== DEP_PROVISORIO);

  // Serializa "mapAtual" e mapExist para próximas fases (evita reprocessar)
  const mapAtualArr = Array.from(mapAtual.entries()).map(([k, v]) => [k, v.raw, v.cdDep]);
  const semPadraoArr = semPadrao.map(x => [x.raw, x.cdDep]);

  const newState = {
    ...state,
    phase: 'ausentes',
    ausentes_cursor: 0,
    ausentes_items: itensAusentes,
    por_item: porItem,
    sem_item_ids: semItem,
    map_atual: mapAtualArr,
    sem_padrao: semPadraoArr,
    posicoes_exist_ids: posicoesExist.map(p => ({
      id: p.id, estrutura: p.estrutura, coluna: p.coluna, nivel: p.nivel, posicao: p.posicao,
      lote_sistema: p.lote_sistema, largura: p.largura, m_linear: p.m_linear, m_linear_atual: p.m_linear_atual,
      status: p.status, item: p.item,
    })),
    deps_ativos: depsAtivos,
    transfer_updates: [] as any[],
    saidas_rows: [] as any[],
    delete_ids: [...semItem] as string[],
    // brutos não são mais necessários daqui pra frente — libera espaço
    brutos01: undefined,
    brutos11: undefined,
  };
  await saveTecidosState(admin, runId, newState);
  selfInvoke('sync_tecidos_map_chunk', runId);
}

async function tecidosChunkAusentes(admin: any, auth: any, runId: string) {
  const state = await loadTecidosState(admin, runId);
  const cursor = state.ausentes_cursor ?? 0;
  const itens: string[] = state.ausentes_items ?? [];
  const porItem: Record<string, any[]> = state.por_item ?? {};
  const depsAtivos: string[] = state.deps_ativos ?? [];
  const transferUpdates: any[] = state.transfer_updates ?? [];
  const saidasRows: any[] = state.saidas_rows ?? [];
  const deleteIds: string[] = state.delete_ids ?? [];

  const nowIso = new Date().toISOString();
  const chunk = itens.slice(cursor, cursor + TECIDOS_AUSENTES_CHUNK_SIZE);

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
    for (const p of (porItem[cdItem] ?? [])) {
      const hit = found[p.lote_sistema];
      if (hit) {
        const largura = p.largura || 0;
        transferUpdates.push({
          id: p.id,
          patch: {
            status: 'transferido',
            deposito_atual: hit.cdDeposito,
            m_linear_atual: hit.quantidade,
            m2_atual: largura > 0 ? +(hit.quantidade * largura).toFixed(2) : 0,
          },
        });
      } else {
        // Só registra saída se ainda não estava marcada como saida (evita duplicar audit)
        if (p.status !== 'saida') {
          saidasRows.push({
            estrutura: p.estrutura, coluna: p.coluna, nivel: p.nivel, posicao: p.posicao,
            item: p.item, lote_sistema: p.lote_sistema,
            m_linear: p.m_linear_atual ?? p.m_linear ?? 0,
            largura: p.largura ?? 0,
            m2: (p.m_linear_atual ?? p.m_linear ?? 0) * (p.largura ?? 0),
            conferente_saida: 'Auge Sync', observacoes: 'AUGE_SAIDA', data_saida: nowIso,
          });
        }
        // SOFT-SAIDA: preserva a posição e o lote_sistema para reabrir se o lote retornar.
        transferUpdates.push({
          id: p.id,
          patch: { status: 'saida', deposito_atual: null, m_linear_atual: 0, m2_atual: 0 },
        });
      }
    }
  }

  const newCursor = cursor + TECIDOS_AUSENTES_CHUNK_SIZE;
  const done = newCursor >= itens.length;
  const newState = {
    ...state,
    phase: done ? 'apply' : 'ausentes',
    ausentes_cursor: newCursor,
    transfer_updates: transferUpdates,
    saidas_rows: saidasRows,
    delete_ids: deleteIds,
    last_progress: { ausentes_cursor: newCursor, ausentes_total: itens.length, transferidos: transferUpdates.length, saidas: saidasRows.length },
  };
  await saveTecidosState(admin, runId, newState);
  selfInvoke('sync_tecidos_map_chunk', runId);
}

async function tecidosApply(admin: any, runId: string) {
  const state = await loadTecidosState(admin, runId);
  const mapAtualArr: any[][] = state.map_atual ?? [];
  const semPadraoArr: any[][] = state.sem_padrao ?? [];
  const posicoesExist: any[] = state.posicoes_exist_ids ?? [];
  const transferUpdates: any[] = state.transfer_updates ?? [];
  const saidasRows: any[] = state.saidas_rows ?? [];
  const deleteIds: string[] = state.delete_ids ?? [];

  const mapExist = new Map<string, any>();
  for (const p of posicoesExist) if (p.lote_sistema) mapExist.set(p.lote_sistema, p);

  const nowIso = new Date().toISOString();
  const toInsert: any[] = [];
  const toUpdate: { id: string; patch: any }[] = [...transferUpdates];
  const overflowRows: any[] = [];
  const novosPorCelula = new Map<string, any[]>();
  let retornosCount = 0;

  for (const [loteSistema, raw, cdDep] of mapAtualArr) {
    const [cdItem, descricao, largura, _lote, quantidade] = raw as CompactLote;
    const addr = parseLoteTecido(loteSistema);
    if (!addr) continue;
    const existente = mapExist.get(loteSistema);
    const targetStatus = cdDep === DEP_CENTRAL ? 'ocupado' : 'bloqueado';
    const m2atual = largura > 0 ? +(quantidade * largura).toFixed(2) : 0;
    if (!existente) {
      const key = `${addr.estrutura}.${addr.coluna}.${addr.nivel}`;
      if (!novosPorCelula.has(key)) novosPorCelula.set(key, []);
      novosPorCelula.get(key)!.push({ addr, cdItem, descricao, largura, quantidade, cdDep, loteSistema, targetStatus, m2atual });
    } else {
      if (existente.status === 'transferido' || existente.status === 'saida') retornosCount++;
      toUpdate.push({
        id: existente.id,
        patch: {
          status: targetStatus, deposito_atual: cdDep,
          m_linear_atual: quantidade, m2_atual: m2atual, auge_cd_item: cdItem,
        },
      });
    }
  }

  for (const [_key, list] of novosPorCelula.entries()) {
    list.sort((a: any, b: any) => a.loteSistema.localeCompare(b.loteSistema));
    const cellRef = list[0].addr;
    const ocupadas = new Set<number>();
    for (const p of posicoesExist) {
      // Slots com status 'saida' ou 'transferido' NÃO ocupam espaço físico —
      // podem ser reutilizados por novos lotes na mesma célula.
      if (p.status === 'saida' || p.status === 'transferido') continue;
      if (p.estrutura === cellRef.estrutura && p.coluna === cellRef.coluna && p.nivel === cellRef.nivel) {
        ocupadas.add(p.posicao);
      }
    }
    for (const item of list) {
      const { addr, cdItem, descricao, largura, quantidade, cdDep, loteSistema, targetStatus, m2atual } = item;
      const isChao = addr.estrutura === 'CHÃO';
      let pos = 1;
      if (isChao) {
        // CHÃO não tem limite — pega o próximo número disponível a partir de 1.
        while (ocupadas.has(pos)) pos++;
      } else {
        while (pos <= 30 && ocupadas.has(pos)) pos++;
      }
      const base = {
        estrutura: addr.estrutura, coluna: addr.coluna, nivel: addr.nivel,
        item: descricao || cdItem,
        m2: m2atual, largura, m_linear: quantidade,
        m_linear_atual: quantidade, m2_atual: m2atual,
        deposito_atual: cdDep, auge_cd_item: cdItem,
        lote: `${quantidade}M`, endereco: addr.endereco,
        lote_sistema: loteSistema, conferente_entrada: 'Importado Auge',
        data_registro: nowIso, proc: addr.proc,
      };
      if (isChao || pos <= 30) {
        toInsert.push({ ...base, posicao: pos, status: targetStatus });
        ocupadas.add(pos);
      } else {
        overflowRows.push({
          item: base.item, endereco_desejado: addr.endereco,
          estrutura: addr.estrutura, coluna: addr.coluna, nivel: addr.nivel,
          proc: addr.proc, m_linear: quantidade, largura, m2: m2atual,
          lote: `${quantidade}M`, lote_sistema: loteSistema,
          auge_cd_item: cdItem, auge_cd_deposito: cdDep, synced_at: nowIso,
        });
      }
    }
  }

  // Itens sem padrão de endereço são ignorados — não entram em "tecidos sem espaço".


  const CH = 500;
  const applyInsert = async (table: string, rows: any[]) => {
    for (let i = 0; i < rows.length; i += CH) {
      const { error } = await admin.from(table).insert(rows.slice(i, i + CH));
      if (error) throw new Error(`${table}: ${error.message}`);
    }
  };
  if (toInsert.length) await applyInsert('estoque_posicoes', toInsert);
  if (saidasRows.length) {
    try { await applyInsert('estoque_saidas', saidasRows); } catch (e) { console.error('estoque_saidas:', e); }
  }
  for (const u of toUpdate) {
    await admin.from('estoque_posicoes').update(u.patch).eq('id', u.id);
  }
  if (deleteIds.length) {
    for (let i = 0; i < deleteIds.length; i += CH) {
      await admin.from('estoque_posicoes').delete().in('id', deleteIds.slice(i, i + CH));
    }
  }
  await admin.from('tecidos_sem_espaco').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (overflowRows.length) await applyInsert('tecidos_sem_espaco', overflowRows);

  const summary = {
    phase: 'done',
    itens_consultados: state.total ?? 0,
    novos_alocados: toInsert.length,
    atualizados: toUpdate.length,
    transferidos: transferUpdates.length,
    retornos: retornosCount,
    saidas: saidasRows.length,
    sem_espaco: overflowRows.length,
    lotes_sem_padrao: semPadraoArr.length,
    started_at: state.started_at,
    finished_at: new Date().toISOString(),
  };
  await admin.from('auge_sync_runs').update({
    status: 'success',
    finished_at: summary.finished_at,
    rows_processed: summary.itens_consultados,
    rows_upserted: summary.novos_alocados + summary.atualizados,
    detalhes: summary,
  }).eq('id', runId);
}

async function tecidosDispatch(admin: any, auth: any, runId: string) {
  const state = await loadTecidosState(admin, runId);
  const phase = state.phase ?? 'fetch';
  try {
    if (phase === 'fetch') await tecidosChunkFetch(admin, auth, runId);
    else if (phase === 'ausentes_init') await tecidosAusentesInit(admin, runId);
    else if (phase === 'ausentes') await tecidosChunkAusentes(admin, auth, runId);
    else if (phase === 'apply') await tecidosApply(admin, runId);
  } catch (e) {
    await admin.from('auge_sync_runs').update({
      status: 'error',
      finished_at: new Date().toISOString(),
      error_message: (getErrorMessage(e)) + ` (phase=${phase})`,
    }).eq('id', runId);
  }
}


// ============================================================
// ACABAMENTOS (modInventario)
// ============================================================

async function postAugePhp(
  auth: { jar: Jar; csrf: string; apiToken: string | null },
  path: string,
  body: URLSearchParams,
  referer: string,
): Promise<string> {
  const headers: Record<string, string> = {
    'Cookie': auth.jar.header(),
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    'X-Requested-With': 'XMLHttpRequest',
    'X-CSRF-TOKEN': auth.csrf,
    'Origin': AUGE_BASE_URL,
    'Referer': `${AUGE_BASE_URL}${referer}`,
    'User-Agent': UA,
    'Accept': 'application/json, text/javascript, */*; q=0.01',
    'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
  };
  if (auth.apiToken) headers['Authorization'] = `Bearer ${auth.apiToken}`;
  const res = await fetch(`${AUGE_BASE_URL}${path}`, { method: 'POST', headers, body });
  auth.jar.ingest(res);
  const text = await res.text();
  if (!res.ok) throw new Error(`POST ${path} HTTP ${res.status} body=${text.slice(0, 200)}`);
  return text;
}

async function fetchListaAcabamentos(auth: any): Promise<any[]> {
  const txt = await postAugePhp(
    auth,
    '/l.unilux/modInventario/Ajax/getListaAcabamento.php',
    new URLSearchParams(),
    '/l.unilux/modInventario/manterAcabamento.php',
  );
  let j: any;
  try { j = JSON.parse(txt); } catch { throw new Error(`getListaAcabamento não-JSON: ${txt.slice(0, 120)}`); }
  return Array.isArray(j?.data) ? j.data : [];
}

async function fetchItensAcabamento(auth: any, cdAcabamento: string): Promise<any[]> {
  const body = new URLSearchParams({ cdAcabamento });
  const txt = await postAugePhp(
    auth,
    '/l.unilux/modInventario/Ajax/getListaItensAcabamento.php',
    body,
    `/l.unilux/modInventario/manterAcabamentoItem.php?cdAcabamento=${cdAcabamento}`,
  );
  let j: any;
  try { j = JSON.parse(txt); } catch { throw new Error(`getListaItensAcabamento não-JSON: ${txt.slice(0, 120)}`); }
  return Array.isArray(j?.data) ? j.data : [];
}

async function updateAcabamentoItem(auth: any, payload: Record<string, string>): Promise<any> {
  const body = new URLSearchParams({
    idAcao: '2',
    cdAcabamentoItem: payload.cdAcabamentoItem ?? '',
    cdItemAcabamento: payload.cdItemAcabamento ?? '',
    dsItemAcabamento: payload.dsItemAcabamento ?? '',
    dsItemAcabamentoReduzida: payload.dsItemAcabamentoReduzida ?? '',
    dsItemAcabamentoOriginal: payload.dsItemAcabamentoOriginal ?? '',
    cdKitComplementar1: payload.cdKitComplementar1 ?? '',
    cdKitComplementar2: payload.cdKitComplementar2 ?? '',
    cdKitComplementar3: payload.cdKitComplementar3 ?? '',
    cdKitComplementar4: payload.cdKitComplementar4 ?? '',
    cdKitComplementar5: payload.cdKitComplementar5 ?? '',
  });
  const txt = await postAugePhp(
    auth,
    '/l.unilux/modInventario/Controle/ctlAcabamentoItem.php',
    body,
    `/l.unilux/modInventario/manterAcabamentoItem.php?cdAcabamento=${payload.cdAcabamento ?? ''}`,
  );
  let j: any = { message: txt };
  try { j = JSON.parse(txt); } catch { /* keep raw */ }
  if (typeof j?.message === 'string' && !/sucesso/i.test(j.message)) {
    throw new Error(`Auge rejeitou edição: ${j.message}`);
  }
  return j;
}

async function insertAcabamentoItem(auth: any, cdAcabamento: string, payload: Record<string, string>): Promise<any> {
  const body = new URLSearchParams({
    idAcao: '1',
    cdAcabamento: cdAcabamento,
    cdAcabamentoItem: '',
    cdItemAcabamento: payload.cdItemAcabamento ?? '',
    dsItemAcabamento: payload.dsItemAcabamento ?? '',
    dsItemAcabamentoReduzida: payload.dsItemAcabamentoReduzida ?? '',
    dsItemAcabamentoOriginal: payload.dsItemAcabamentoOriginal ?? '',
    cdKitComplementar1: payload.cdKitComplementar1 ?? '',
    cdKitComplementar2: payload.cdKitComplementar2 ?? '',
    cdKitComplementar3: payload.cdKitComplementar3 ?? '',
    cdKitComplementar4: payload.cdKitComplementar4 ?? '',
    cdKitComplementar5: payload.cdKitComplementar5 ?? '',
  });
  const txt = await postAugePhp(
    auth,
    '/l.unilux/modInventario/Controle/ctlAcabamentoItem.php',
    body,
    `/l.unilux/modInventario/manterAcabamentoItem.php?cdAcabamento=${cdAcabamento}`,
  );
  let j: any = { message: txt };
  try { j = JSON.parse(txt); } catch { /* keep raw */ }
  if (typeof j?.message === 'string' && !/sucesso/i.test(j.message)) {
    throw new Error(j.message);
  }
  return j;
}

async function deleteAcabamentoItem(auth: any, cdAcabamento: string, cdAcabamentoItem: string): Promise<any> {
  const body = new URLSearchParams({
    idAcao: '3',
    cdAcabamento,
    cdAcabamentoItem,
  });
  const txt = await postAugePhp(
    auth,
    '/l.unilux/modInventario/Controle/ctlAcabamentoItem.php',
    body,
    `/l.unilux/modInventario/manterAcabamentoItem.php?cdAcabamento=${cdAcabamento}`,
  );
  let j: any = { message: txt };
  try { j = JSON.parse(txt); } catch { /* keep raw */ }
  if (typeof j?.message === 'string' && !/sucesso/i.test(j.message)) {
    throw new Error(j.message || 'Auge rejeitou exclusão do item.');
  }
  return j;
}

/**
 * Grava (inclui/altera) uma linha de TAG Customizada no Auge.
 * Espelha o formulário de /modInventario/tag/manterTagCustomizada.php.
 * idAcao: 1 = incluir, 2 = alterar.
 */
async function saveTagCustomizada(
  auth: any,
  row: {
    cdConfiguracao?: string;
    cdTagCustomizada?: string;
    dsTagCustomizada: string;
    dsTagCalculada?: string;
    dsTagTexto?: string;
  },
): Promise<any> {
  const body = new URLSearchParams({
    idAcao: row.cdTagCustomizada ? '2' : '1',
    cdConfiguracao: row.cdConfiguracao ?? '',
    cdTagCustomizada: row.cdTagCustomizada ?? '',
    dsTagCustomizada: row.dsTagCustomizada ?? '',
    dsTagCalculada: row.dsTagCalculada ?? '',
    dsTagTexto: row.dsTagTexto ?? '',
  });
  const txt = await postAugePhp(
    auth,
    '/l.unilux/modInventario/Controle/ctlTagCustomizada.php',
    body,
    '/l.unilux/modInventario/tag/manterTagCustomizada.php',
  );
  let j: any = { message: txt };
  try { j = JSON.parse(txt); } catch { /* mantém texto cru */ }
  const msg = typeof j?.message === 'string' ? j.message : '';
  if (msg && !/sucesso/i.test(msg)) throw new Error(msg);
  return j;
}



function mapAcabamentoRow(r: any) {
  return {
    cd_acabamento: String(r.cdAcabamento),
    nr_acabamento: r.nrAcabamento ?? null,
    chave_acabamento: r.chaveAcabamento ?? null,
    cd_empresa: r.cdEmpresa ?? null,
    nm_acabamento: r.nmAcabamento ?? '',
    id_cancelado: r.idCancelado ?? 'N',
    cd_classe1: r.cdClasse1 ?? null, cd_sub_classe1: r.cdSubClasse1 ?? null, cd_combinacao1: r.cdCombinacao1 ?? null,
    nm_classe1: r.nmClasse1 ?? null, nm_sub_classe1: r.nmSubClasse1 ?? null, nm_combinacao1: r.nmCombinacao1 ?? null, chave_combinacao1: r.chaveCombinacao1 ?? null,
    cd_classe2: r.cdClasse2 ?? null, cd_sub_classe2: r.cdSubClasse2 ?? null, cd_combinacao2: r.cdCombinacao2 ?? null,
    nm_classe2: r.nmClasse2 ?? null, nm_sub_classe2: r.nmSubClasse2 ?? null, nm_combinacao2: r.nmCombinacao2 ?? null, chave_combinacao2: r.chaveCombinacao2 ?? null,
    cd_classe3: r.cdClasse3 ?? null, cd_sub_classe3: r.cdSubClasse3 ?? null, cd_combinacao3: r.cdCombinacao3 ?? null,
    nm_classe3: r.nmClasse3 ?? null, nm_sub_classe3: r.nmSubClasse3 ?? null, nm_combinacao3: r.nmCombinacao3 ?? null, chave_combinacao3: r.chaveCombinacao3 ?? null,
    cd_seq_tag_calculada: r.cdSeqTagCalculada ?? null,
    ds_tag_calculada: r.dsTagCalculada ?? null,
    ds_descricao_tag_calculada: r.dsDescricaoTagCalculada ?? null,
    id_herdar_colecao: r.idHerdarColecao ?? null,
    id_limitar_tamanho: r.idLimitarTamanho ?? null,
    tem_item_associado: r.temItemAssociado ?? null,
    raw: r,
    synced_at: new Date().toISOString(),
  };
}

function mapAcabamentoItemRow(cdAcabamento: string, r: any) {
  return {
    cd_acabamento_item: String(r.cdAcabamentoItem),
    cd_acabamento: cdAcabamento,
    cd_linha: r.cdLinha ?? null,
    cd_item_acabamento: String(r.cdItemAcabamento ?? '').trim(),
    ds_item_acabamento: r.dsItemAcabamento ?? null,
    ds_item_acabamento_original: r.dsItemAcabamentoOriginal ?? null,
    ds_item_acabamento_reduzida: r.dsItemAcabamentoReduzida ?? null,
    cd_kit_complementar_1: r.cdKitComplementar1 ?? null, nm_kit_complementar_1: r.nmKitComplementar1 ?? null,
    cd_kit_complementar_2: r.cdKitComplementar2 ?? null, nm_kit_complementar_2: r.nmKitComplementar2 ?? null,
    cd_kit_complementar_3: r.cdKitComplementar3 ?? null, nm_kit_complementar_3: r.nmKitComplementar3 ?? null,
    cd_kit_complementar_4: r.cdKitComplementar4 ?? null, nm_kit_complementar_4: r.nmKitComplementar4 ?? null,
    cd_kit_complementar_5: r.cdKitComplementar5 ?? null, nm_kit_complementar_5: r.nmKitComplementar5 ?? null,
    raw: r,
    synced_at: new Date().toISOString(),
  };
}

async function syncAcabamentosFull(admin: any, auth: any, triggeredBy: string | null, existingRunId?: string) {
  const started = new Date().toISOString();
  let runId = existingRunId;
  if (!runId) {
    const runIns = await admin.from('auge_sync_runs').insert({
      entidade: 'acabamentos', status: 'running', started_at: started,
      triggered_by: triggeredBy, detalhes: { phase: 'lista' },
    }).select('id').single();
    runId = runIns.data?.id;
  }

  try {
    await admin.from('auge_sync_runs').update({
      detalhes: { phase: 'lista', current: 0, total: 0, itens: 0, errors: [] },
    }).eq('id', runId);

    const acabs = await fetchListaAcabamentos(auth);
    if (acabs.length) {
      const rows = acabs.map(mapAcabamentoRow);
      for (let i = 0; i < rows.length; i += 500) {
        await admin.from('auge_acabamentos').upsert(rows.slice(i, i + 500), { onConflict: 'cd_acabamento' });
      }
    }

    let totalItens = 0;
    let current = 0;
    const errors: Array<{ cd: string; nm?: string; erro: string }> = [];
    const total = acabs.length;
    let lastFlush = 0;

    const flushProgress = async (force = false) => {
      const now = Date.now();
      if (!force && now - lastFlush < 800) return;
      lastFlush = now;
      await admin.from('auge_sync_runs').update({
        rows_processed: current,
        rows_upserted: totalItens,
        detalhes: { phase: 'itens', current, total, itens: totalItens, errors: errors.slice(-50) },
      }).eq('id', runId);
    };

    const concurrency = 4;
    let idx = 0;
    const worker = async () => {
      while (idx < acabs.length) {
        const my = idx++;
        const a = acabs[my];
        const cd = String(a.cdAcabamento);
        try {
          const itens = await fetchItensAcabamento(auth, cd);
          if (itens.length) {
            const rows = itens.map((r) => mapAcabamentoItemRow(cd, r));
            for (let i = 0; i < rows.length; i += 500) {
              await admin.from('auge_acabamento_itens').upsert(rows.slice(i, i + 500), { onConflict: 'cd_acabamento_item' });
            }
            totalItens += rows.length;
          }
        } catch (e) {
          const msg = getErrorMessage(e);
          console.warn(`[acabamento ${cd}] erro:`, msg);
          errors.push({ cd, nm: a?.nmAcabamento ?? undefined, erro: msg });
        } finally {
          current++;
          flushProgress().catch(() => {});
        }
      }
    };
    await Promise.all(Array.from({ length: concurrency }, worker));
    await flushProgress(true);

    await admin.from('auge_sync_runs').update({
      status: errors.length && totalItens === 0 ? 'error' : 'success',
      finished_at: new Date().toISOString(),
      rows_processed: acabs.length, rows_upserted: totalItens,
      error_message: errors.length ? `${errors.length} acabamento(s) com erro` : null,
      detalhes: { phase: 'done', current: acabs.length, total: acabs.length, acabamentos: acabs.length, itens: totalItens, errors },
    }).eq('id', runId);

    return { ok: true, acabamentos: acabs.length, itens: totalItens, run_id: runId, errors };
  } catch (e) {
    await admin.from('auge_sync_runs').update({
      status: 'error', finished_at: new Date().toISOString(),
      error_message: getErrorMessage(e),
    }).eq('id', runId);
    throw e;
  }
}


// ============================================================
// ABREVIAÇÕES + DICIONÁRIOS + CONSULTAS PARAMETRIZADAS
// ============================================================

async function fetchListaAbreviacoes(auth: any): Promise<any[]> {
  const txt = await postAugePhp(
    auth,
    '/l.unilux/modInventario/Ajax/getListaAbreviacao.php',
    new URLSearchParams(),
    '/l.unilux/modInventario/manterAbreviacao.php',
  );
  let j: any;
  try { j = JSON.parse(txt); } catch { throw new Error(`getListaAbreviacao não-JSON: ${txt.slice(0, 120)}`); }
  return Array.isArray(j?.data) ? j.data : [];
}

function mapAbreviacaoRow(r: any) {
  return {
    cd_abreviacao: String(r.cdAbreviacao),
    cd_empresa: r.cdEmpresa ?? null,
    id_tipo_abreviacao: String(r.idTipoAbreviacao ?? 'Descrição do Item'),
    ds_atual: String(r.dsAtual ?? ''),
    ds_abreviada: String(r.dsAbreviada ?? ''),
    raw: r,
    synced_at: new Date().toISOString(),
  };
}

async function syncAbreviacoesFull(admin: any, auth: any, triggeredBy: string | null) {
  const started = new Date().toISOString();
  const runIns = await admin.from('auge_sync_runs').insert({
    entidade: 'abreviacoes', status: 'running', started_at: started, triggered_by: triggeredBy,
  }).select('id').single();
  const runId = runIns.data?.id;
  try {
    const list = await fetchListaAbreviacoes(auth);
    const rows = list.map(mapAbreviacaoRow);
    for (let i = 0; i < rows.length; i += 500) {
      await admin.from('auge_abreviacoes').upsert(rows.slice(i, i + 500), { onConflict: 'cd_abreviacao' });
    }
    // remove os que sumiram no Auge
    if (rows.length > 0) {
      const keep = rows.map((r) => `"${r.cd_abreviacao}"`).join(',');
      await admin.from('auge_abreviacoes').delete().not('cd_abreviacao', 'in', `(${keep})`);
    }
    await admin.from('auge_sync_runs').update({
      status: 'success', finished_at: new Date().toISOString(),
      rows_processed: rows.length, rows_upserted: rows.length,
      detalhes: { total: rows.length },
    }).eq('id', runId);
    return { ok: true, total: rows.length, run_id: runId };
  } catch (e) {
    await admin.from('auge_sync_runs').update({
      status: 'error', finished_at: new Date().toISOString(), error_message: getErrorMessage(e),
    }).eq('id', runId);
    throw e;
  }
}

async function fetchDicionarioEndpoint(auth: any, endpoint: string, referer: string): Promise<any[]> {
  const txt = await postAugePhp(auth, endpoint, new URLSearchParams(), referer);
  let j: any;
  try { j = JSON.parse(txt); } catch { throw new Error(`${endpoint} não-JSON: ${txt.slice(0, 120)}`); }
  return Array.isArray(j?.data) ? j.data : (Array.isArray(j) ? j : []);
}

function mapDicionarioRow(tipo: string, r: any) {
  const cd = String(
    r.cdClasse ?? r.cdSubClasse ?? r.cdCombinacao ?? r.cdTag ?? r.cd ?? r.id ?? '',
  ).trim();
  const nm = String(
    r.nmClasse ?? r.nmSubClasse ?? r.nmCombinacao ?? r.nmTag ?? r.nm ?? r.descricao ?? r.dsDescricao ?? r.text ?? '',
  ).trim();
  const cd_pai = String(r.cdClassePai ?? r.cdClasse ?? r.cdPai ?? '').trim() || null;
  const nm_pai = String(r.nmClassePai ?? r.nmClasse ?? r.nmPai ?? '').trim() || null;
  return { tipo, cd, nm, cd_pai, nm_pai, raw: r, synced_at: new Date().toISOString() };
}

async function salvarAbreviacaoAuge(auth: any, params: {
  cdAbreviacao?: string | null;
  dsAtual: string;
  dsAbreviada: string;
  idTipoAbreviacao?: string | number;
}): Promise<any> {
  const body = new URLSearchParams();
  body.set('idAcao', '1');
  body.set('cdAbreviacao', params.cdAbreviacao ? String(params.cdAbreviacao) : '');
  body.set('dsAtual', params.dsAtual);
  body.set('dsAbreviada', params.dsAbreviada);
  body.set('idTipoAbreviacao', String(params.idTipoAbreviacao ?? 1));
  const txt = await postAugePhp(
    auth,
    '/l.unilux/modInventario/Controle/ctlAbreviacao.php',
    body,
    '/l.unilux/modInventario/manterAbreviacao.php',
  );
  let j: any = null;
  try { j = JSON.parse(txt); } catch { j = { raw: txt.slice(0, 400) }; }
  return j;
}

async function excluirAbreviacaoAuge(auth: any, cdAbreviacao: string): Promise<any> {
  const body = new URLSearchParams();
  body.set('idAcao', '3');
  body.set('cdAbreviacao', String(cdAbreviacao));
  const txt = await postAugePhp(
    auth,
    '/l.unilux/modInventario/Controle/ctlAbreviacao.php',
    body,
    '/l.unilux/modInventario/manterAbreviacao.php',
  );
  let j: any = null;
  try { j = JSON.parse(txt); } catch { j = { raw: txt.slice(0, 400) }; }
  return j;
}

async function syncDicionariosFull(admin: any, auth: any, triggeredBy: string | null) {
  const started = new Date().toISOString();
  const runIns = await admin.from('auge_sync_runs').insert({
    entidade: 'dicionarios', status: 'running', started_at: started, triggered_by: triggeredBy,
  }).select('id').single();
  const runId = runIns.data?.id;

  const REF = '/l.unilux/modInventario/manterAcabamento.php';
  const jobs: Array<{ tipo: string; endpoint: string }> = [
    { tipo: 'classe',      endpoint: '/l.unilux/modInventario/Ajax/getClasses.php' },
    { tipo: 'sub_classe',  endpoint: '/l.unilux/modInventario/Ajax/getSubClasses.php' },
    { tipo: 'combinacao',  endpoint: '/l.unilux/modInventario/Ajax/getCombinacoes.php' },
    { tipo: 'tag',         endpoint: '/l.unilux/modInventario/Ajax/getTags.php' },
  ];

  const totals: Record<string, number> = {};
  try {
    for (const { tipo, endpoint } of jobs) {
      try {
        const list = await fetchDicionarioEndpoint(auth, endpoint, REF);
        const rows = list.map((r) => mapDicionarioRow(tipo, r)).filter((r) => r.cd && r.nm);
        totals[tipo] = rows.length;
        for (let i = 0; i < rows.length; i += 500) {
          await admin.from('auge_dicionarios').upsert(rows.slice(i, i + 500), { onConflict: 'tipo,cd' });
        }
      } catch (e) {
        totals[`${tipo}_erro`] = 0;
        console.warn(`[dicionario ${tipo}]`, getErrorMessage(e));
      }
    }
    await admin.from('auge_sync_runs').update({
      status: 'success', finished_at: new Date().toISOString(),
      rows_upserted: Object.values(totals).reduce((a, b) => a + (b || 0), 0),
      detalhes: totals,
    }).eq('id', runId);
    return { ok: true, totais: totals, run_id: runId };
  } catch (e) {
    await admin.from('auge_sync_runs').update({
      status: 'error', finished_at: new Date().toISOString(), error_message: getErrorMessage(e),
    }).eq('id', runId);
    throw e;
  }
}

async function runConsultaAuge(auth: any, idConsulta: string): Promise<any> {
  const filtroTxt = await postAugePhp(
    auth,
    '/l.unilux/modTI/Ajax/getFiltroConsulta.php',
    new URLSearchParams({ idConsulta }),
    '/l.unilux/modTI/gerirConsulta.php',
  );
  let filtros: any = null;
  try { filtros = JSON.parse(filtroTxt); } catch { filtros = { html: filtroTxt.slice(0, 2000) }; }

  // Resultado: GET com querystring
  const headers: Record<string, string> = {
    'Cookie': auth.jar.header(),
    'X-Requested-With': 'XMLHttpRequest',
    'X-CSRF-TOKEN': auth.csrf,
    'Referer': `${AUGE_BASE_URL}/l.unilux/modTI/gerirConsulta.php`,
    'User-Agent': UA,
    'Accept': 'application/json, text/javascript, */*; q=0.01',
  };
  if (auth.apiToken) headers['Authorization'] = `Bearer ${auth.apiToken}`;
  const res = await fetch(
    `${AUGE_BASE_URL}/l.unilux/modTI/Ajax/getResultadoConsulta.php?idConsulta=${encodeURIComponent(idConsulta)}`,
    { method: 'GET', headers },
  );
  auth.jar.ingest(res);
  const text = await res.text();
  let resultado: any = null;
  try { resultado = JSON.parse(text); } catch { resultado = { raw: text.slice(0, 20000) }; }
  return { idConsulta, filtros, resultado };
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
    try {
      await loadAugeCredentials(admin, triggeredBy);
    } catch (err: any) {
      if (err?.code === 'AUGE_CREDENTIALS_MISSING') {
        return new Response(JSON.stringify({
          ok: false,
          code: 'AUGE_CREDENTIALS_MISSING',
          error: 'Configure suas credenciais do Auge para executar ações. Acesse Configurações → Minha conta Auge.',
        }), { status: 428, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      throw err;
    }

    if (!AUGE_USERNAME || !AUGE_PASSWORD) {
      throw new Error('Credenciais do Auge não configuradas para esta execução.');
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
        detalhes: { phase: 'init' },
      }).select('id').single();
      const runId = runIns.data?.id as string | undefined;
      if (!runId) throw new Error('Falha ao criar run.');

      const task = (async () => {
        try { await tecidosInit(admin, runId); }
        catch (e) {
          await admin.from('auge_sync_runs').update({
            status: 'error', finished_at: new Date().toISOString(),
            error_message: getErrorMessage(e),
          }).eq('id', runId);
        }
      })();
      // @ts-ignore
      if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime?.waitUntil) EdgeRuntime.waitUntil(task);

      return new Response(JSON.stringify({
        ok: true, background: true, run_id: runId, chunked: true,
        message: 'Sync iniciado em chunks encadeados. Acompanhe em /admin.',
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'sync_tecidos_map_chunk') {
      const runId = url.searchParams.get('run_id') ?? '';
      if (!runId) throw new Error('run_id é obrigatório.');
      const task = tecidosDispatch(admin, auth, runId);
      // @ts-ignore
      if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime?.waitUntil) EdgeRuntime.waitUntil(task);
      return new Response(JSON.stringify({ ok: true, chunk: true, run_id: runId }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'transferencias_backfill') {
      const nowIso = new Date().toISOString();
      const runIns = await admin.from('auge_sync_runs').insert({
        entidade: 'transferencias',
        status: 'running',
        started_at: nowIso,
        triggered_by: triggeredBy,
        detalhes: { phase: 'backfill', started_at: nowIso },
      }).select('id').single();
      const runId = runIns.data?.id as string | undefined;
      if (!runId) throw new Error('Falha ao criar run de backfill de transferências.');
      const task = backfillTransferenciasChunk(admin, auth, runId).catch(async (e) => {
        await admin.from('auge_sync_runs').update({
          status: 'error',
          finished_at: new Date().toISOString(),
          error_message: getErrorMessage(e),
        }).eq('id', runId);
      });
      // @ts-ignore
      if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime?.waitUntil) EdgeRuntime.waitUntil(task);
      return new Response(JSON.stringify({ ok: true, background: true, run_id: runId, chunked: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'transferencias_backfill_chunk') {
      const runId = url.searchParams.get('run_id') ?? '';
      if (!runId) throw new Error('run_id é obrigatório.');
      await backfillTransferenciasChunk(admin, auth, runId);
      return new Response(JSON.stringify({ ok: true, chunk: true, run_id: runId }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // -------------- ACABAMENTOS --------------
    if (action === 'sync_acabamentos') {
      const runIns = await admin.from('auge_sync_runs').insert({
        entidade: 'acabamentos', status: 'running', started_at: new Date().toISOString(),
        triggered_by: triggeredBy, detalhes: { phase: 'iniciando', current: 0, total: 0, itens: 0, errors: [] },
      }).select('id').single();
      const runId = runIns.data?.id;
      const task = syncAcabamentosFull(admin, auth, triggeredBy, runId).catch((e) =>
        console.error('sync_acabamentos error', getErrorMessage(e))
      );
      // @ts-ignore
      if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime?.waitUntil) EdgeRuntime.waitUntil(task);
      return new Response(JSON.stringify({ ok: true, background: true, run_id: runId }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'sync_acabamento_one') {
      let payload: any = {};
      try { payload = await req.json(); } catch { /* ignore */ }
      const cd = String(payload?.cdAcabamento ?? '').trim();
      if (!cd) throw new Error('cdAcabamento é obrigatório.');
      const itens = await fetchItensAcabamento(auth, cd);
      if (itens.length) {
        const rows = itens.map((r) => mapAcabamentoItemRow(cd, r));
        // remove itens que não vieram mais (para refletir exclusões no Auge)
        const keepIds = rows.map((r) => r.cd_acabamento_item);
        await admin.from('auge_acabamento_itens')
          .delete()
          .eq('cd_acabamento', cd)
          .not('cd_acabamento_item', 'in', `(${keepIds.map((v) => `"${v}"`).join(',')})`);
        for (let i = 0; i < rows.length; i += 500) {
          await admin.from('auge_acabamento_itens').upsert(rows.slice(i, i + 500), { onConflict: 'cd_acabamento_item' });
        }
      }
      return new Response(JSON.stringify({ ok: true, cdAcabamento: cd, itens: itens.length }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'update_acabamento_item') {
      let payload: any = {};
      try { payload = await req.json(); } catch { /* ignore */ }
      if (!payload?.cdAcabamentoItem) throw new Error('cdAcabamentoItem é obrigatório.');
      if (!payload?.cdItemAcabamento) throw new Error('cdItemAcabamento é obrigatório.');
      const resp = await updateAcabamentoItem(auth, payload);
      // re-sincroniza o acabamento afetado para refletir mudança local
      if (payload?.cdAcabamento) {
        try {
          const itens = await fetchItensAcabamento(auth, String(payload.cdAcabamento));
          const rows = itens.map((r) => mapAcabamentoItemRow(String(payload.cdAcabamento), r));
          for (let i = 0; i < rows.length; i += 500) {
            await admin.from('auge_acabamento_itens').upsert(rows.slice(i, i + 500), { onConflict: 'cd_acabamento_item' });
          }
        } catch (e) {
          await admin.from('auge_sync_runs').insert({
            entidade: 'acabamento_item_refresh',
            status: 'error',
            error_message: getErrorMessage(e),
            detalhes: { cdAcabamento: String(payload.cdAcabamento), context: 'update_acabamento_item' },
          }).then(() => {}, () => {});
        }
      }
      return new Response(JSON.stringify({ ok: true, auge: resp }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // -------------- TAGS CUSTOMIZADAS (manterTagCustomizada.php) --------------
    if (action === 'tag_custom_por_config') {
      let payload: any = {};
      try { payload = await req.json(); } catch { /* ignore */ }
      const cd = String(payload?.cdConfiguracao ?? '').trim();
      const ds = String(payload?.dsTagCustomizada ?? '').trim();
      const nm = String(payload?.nmConfiguracao ?? '').trim();
      if (!cd && !ds) throw new Error('Informe cdConfiguracao ou dsTagCustomizada.');
      const rows = await fetchListaTagsCustomizadas(auth, cd, ds);

      // Persiste o que veio ao vivo para que a próxima busca já encontre local.
      try {
        const mapped = rows.map((r: any) => ({
          cd_configuracao: String(r.cdConfiguracao ?? cd ?? '').trim(),
          nm_configuracao: r.nmConfiguracao ?? nm ?? null,
          cd_tag_customizada: String(r.cdTagCustomizada ?? ''),
          nm_tag_customizada: r.nmTagCustomizada ?? null,
          ds_tag_customizada: r.dsTagCustomizada ?? null,
          cd_tag_calculada: r.cdTagCalculada ?? null,
          ds_tag_calculada: r.dsTagCalculada ?? null,
          ds_tag_texto: r.dsTagTexto ?? null,
          raw: r,
          synced_at: new Date().toISOString(),
        })).filter((r) => r.cd_configuracao && r.cd_tag_customizada);

        const deduped = Array.from(
          mapped.reduce((acc, row) => {
            acc.set(`${row.cd_configuracao}::${row.cd_tag_customizada}`, row);
            return acc;
          }, new Map<string, any>()).values(),
        );
        if (deduped.length) {
          await admin.from('auge_tag_custom').upsert(deduped, { onConflict: 'cd_configuracao,cd_tag_customizada' });
        }
        if (cd) {
          await admin.from('auge_tag_custom_scan').upsert({
            cd_configuracao: cd,
            nm_configuracao: nm || (rows[0]?.nmConfiguracao ?? null),
            qtd_tags: rows.length,
            last_scanned_at: new Date().toISOString(),
            erro: null,
          }, { onConflict: 'cd_configuracao' });
        }
      } catch { /* persistência é best-effort */ }

      return new Response(JSON.stringify({ ok: true, rows }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }


    // Cria/atualiza uma TAG Custom (conjunto de linhas de TAG Customizada) no Auge
    // e devolve o status de cada linha + como a configuração ficou no Auge.
    if (action === 'criar_tag_custom') {
      let payload: any = {};
      try { payload = await req.json(); } catch { /* ignore */ }
      const cdConfiguracao = String(payload?.cdConfiguracao ?? '').trim();
      const descricao = String(payload?.descricao ?? '').trim();
      const itens: any[] = Array.isArray(payload?.itens) ? payload.itens : [];
      if (!descricao) throw new Error('Descrição da TAG Custom é obrigatória.');
      if (!itens.length) throw new Error('Inclua ao menos 1 TAG customizada.');

      const results: Array<{ tag: string; calculada: string; ok: boolean; erro?: string; auge?: any }> = [];
      for (const it of itens) {
        // Mapa de campos: Configuração -> cdConfiguracao | TAG -> dsTagCustomizada | TAG Calculada -> dsTagCalculada
        const dsTagCustomizada = String(it?.dsTagCustomizada ?? '').trim();
        const dsTagCalculada = String(it?.dsTagCalculada ?? '').trim();
        // No Auge "Tag Calculada" e "Texto Livre" são mutuamente exclusivos.
        const dsTagTexto = dsTagCalculada ? '' : String(it?.dsTagTexto ?? dsTagCustomizada).trim();
        if (!dsTagCustomizada) continue;
        try {
          const auge = await saveTagCustomizada(auth, {
            cdConfiguracao,
            cdTagCustomizada: String(it?.cdTagCustomizada ?? '').trim(),
            dsTagCustomizada,
            dsTagCalculada,
            dsTagTexto,
          });
          results.push({ tag: dsTagCustomizada, calculada: dsTagCalculada, ok: true, auge });
        } catch (e) {
          results.push({ tag: dsTagCustomizada, calculada: dsTagCalculada, ok: false, erro: getErrorMessage(e) });
        }
      }

      // Estado final no Auge (o que o usuário vê na tela manterTagCustomizada).
      let augeRows: any[] = [];
      try {
        augeRows = await fetchListaTagsCustomizadas(auth, cdConfiguracao, cdConfiguracao ? '' : descricao);
      } catch { /* consulta de conferência é best-effort */ }

      const okCount = results.filter((r) => r.ok).length;
      return new Response(JSON.stringify({
        ok: okCount > 0,
        descricao,
        cdConfiguracao,
        total: results.length,
        gravadas: okCount,
        falhas: results.length - okCount,
        results,
        augeRows,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'tag_config_select') {
      let payload: any = {};
      try { payload = await req.json(); } catch { /* ignore */ }
      const term = String(payload?.term ?? '').trim();
      if (!term) throw new Error('Informe term para consultar configurações.');
      const page = Number(payload?.nrPagina ?? 1);
      const size = Number(payload?.qtdItens ?? TAG_DISCOVERY_PAGE_SIZE);
      const rows = await fetchSelectConfiguracoes(auth, term, page, size);
      return new Response(JSON.stringify({ ok: true, term, page, size, rows }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Sincroniza TODAS as TAGs calculadas listadas em /modInventario/tag/tag.php
    // (select tagSelectTag.php devolve a lista completa: [{value, text}]).
    if (action === 'sync_tags_calculadas') {
      const nowIso = new Date().toISOString();
      const byKey = new Map<string, Record<string, unknown>>();
      let fonte = 'grid';

      // 1) Fonte preferencial: grade de /modInventario/tag/tag.php (Nome real).
      const gridRows = await fetchTagsCalculadasGrid(auth);
      for (const r of gridRows) {
        if (!r.nome) continue;
        byKey.set(r.cd_tag, {
          cd_tag: r.cd_tag,
          nm_tag: r.descricao || r.nome,
          nome: r.nome,
          descricao: r.descricao,
          formula: r.formula,
          synced_at: nowIso,
        });
      }

      // 2) Fallback/complemento: select2 (rótulo "FORMULA\NOME").
      //    Nunca sobrescreve um nome vindo da grade.
      const selectRows = await fetchSelectTagsCalculadas(auth, '', 1, 100000);
      if (!byKey.size) fonte = 'select';
      const parseTag = (text: string) => {
        const raw = String(text ?? '').trim();
        const idx = raw.lastIndexOf('\\');
        if (idx >= 0) {
          const formula = raw.slice(0, idx).trim();
          const nome = raw.slice(idx + 1).trim();
          return { nome: nome || raw, formula: formula || null };
        }
        return { nome: raw, formula: null as string | null };
      };
      for (const r of selectRows) {
        if (!r.text || !r.id) continue;
        const key = String(r.id);
        if (byKey.has(key)) continue;
        const { nome, formula } = parseTag(r.text);
        byKey.set(key, {
          cd_tag: key,
          nm_tag: r.text,
          nome,
          descricao: r.text,
          formula,
          synced_at: nowIso,
        });
      }

      const mapped = Array.from(byKey.values());


      let salvos = 0;
      for (let i = 0; i < mapped.length; i += 500) {
        const chunk = mapped.slice(i, i + 500);
        const { error } = await admin
          .from('auge_tags_calculadas')
          .upsert(chunk, { onConflict: 'cd_tag' });
        if (error) throw new Error(`Falha ao salvar TAGs calculadas: ${error.message}`);
        salvos += chunk.length;
      }

      await admin.from('auge_sync_runs').insert({
        entidade: 'tags_calculadas',
        status: 'success',
        started_at: nowIso,
        finished_at: new Date().toISOString(),
        triggered_by: triggeredBy,
        detalhes: { total: mapped.length, salvos, fonte, grid: gridRows.length, select: selectRows.length },
      }).then(() => {}, () => {});

      return new Response(JSON.stringify({ ok: true, total: mapped.length, salvos, fonte, grid: gridRows.length, select: selectRows.length }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    }







    // Lookup ao vivo das TAGs Calculadas (select2 do formulário do Auge).
    if (action === 'tag_calculada_select') {
      let payload: any = {};
      try { payload = await req.json(); } catch { /* ignore */ }
      const term = String(payload?.term ?? '').trim();
      const page = Number(payload?.nrPagina ?? 1);
      const size = Number(payload?.qtdItens ?? 500);
      const rows = await fetchSelectTagsCalculadas(auth, term, page, size);
      return new Response(JSON.stringify({ ok: true, term, rows }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }



    if (action === 'sync_tag_custom_chunk') {
      const runId = url.searchParams.get('run_id') ?? '';
      if (!runId) throw new Error('run_id obrigatório para continuar a varredura de TAGs.');
      let result: any;
      try {
        result = await syncTagCustomChunk(admin, auth, runId);
      } catch (e) {
        const msg = getErrorMessage(e);
        await admin.from('auge_sync_runs').update({
          status: 'error',
          finished_at: new Date().toISOString(),
          error_message: msg,
        }).eq('id', runId);
        return new Response(JSON.stringify({ ok: false, error: msg }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'audit_tag_namespace') {
      const runIns = await admin.from('auge_sync_runs').insert({
        entidade: 'tag_audit', status: 'running', started_at: new Date().toISOString(),
        triggered_by: triggeredBy,
        detalhes: {
          stage: 'audit_discover',
          phase: 'auditando configurações',
          prefix_index: 0,
          extra_prefixes: [],
          extra_index: 0,
          errors: 0,
          hits: 0,
          saturated: 0,
          current: 0,
          total: TAG_CONFIG_PREFIXES.length,
        },
      }).select('id').single();
      const runId = runIns.data?.id;
      if (!runId) throw new Error('Não foi possível iniciar a auditoria.');
      selfInvoke('audit_tag_namespace_chunk', runId);
      return new Response(JSON.stringify({ ok: true, run_id: runId, background: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'audit_tag_namespace_chunk') {
      const runId = url.searchParams.get('run_id') ?? '';
      if (!runId) throw new Error('run_id obrigatório.');
      try {
        const result = await auditTagNamespaceChunk(admin, auth, runId);
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (e) {
        const msg = getErrorMessage(e);
        await admin.from('auge_sync_runs').update({
          status: 'error', finished_at: new Date().toISOString(), error_message: msg,
        }).eq('id', runId);
        return new Response(JSON.stringify({ ok: false, error: msg }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
        });
      }
    }

    if (action === 'sync_tag_custom') {
      let tagPayload: any = {};
      try { tagPayload = await req.json(); } catch { /* ignore */ }
      const full = tagPayload?.full === true || url.searchParams.get('full') === '1';

      const runIns = await admin.from('auge_sync_runs').insert({
        entidade: 'tag_custom', status: 'running', started_at: new Date().toISOString(),
        triggered_by: triggeredBy,
        detalhes: {
          stage: 'discover_prefix',
          phase: full ? 'limpando tabelas' : 'retomando varredura (incremental)',
          prefix_index: 0,
          term_index: 0,
          pair_index: 0,
          cfg_offset: 0,
          current: 0,
          total: 1,
          cfg_count: 0,
          com_tag: 0,
          sem_tag: 0,
          errors: 0,
          saturated_terms: [],
          incremental: !full,
        },
      }).select('id').single();
      const runId = runIns.data?.id;
      if (!runId) throw new Error('Não foi possível iniciar a varredura de TAGs.');

      // Só limpa tabelas quando o usuário pediu varredura completa.
      // No modo incremental (padrão), preservamos o progresso anterior e
      // pulamos configurações já escaneadas.
      if (full) {
        await admin.from('auge_tag_custom').delete().gte('id', '00000000-0000-0000-0000-000000000000');
        await admin.from('auge_tag_custom_scan').delete().gte('cd_configuracao', '');
      }

      const existing = await countTagConfigs(admin);
      const pending = await countTagConfigsPending(admin);
      // Incremental: se já temos configurações descobertas, pula direto para
      // scan_tags. A fase de descoberta com drill-down é lentíssima e trava
      // a barra de progresso — só faz sentido no modo `full`.
      const skipDiscovery = !full && existing > 0;
      await admin.from('auge_sync_runs').update({
        detalhes: {
          stage: skipDiscovery ? 'scan_tags' : 'discover_prefix',
          phase: skipDiscovery
            ? `varrendo TAGs — ${pending} pendente(s) de ${existing}`
            : (full ? 'descobrindo configurações' : `retomando — ${existing} já conhecidas, descobrindo novas`),
          prefix_index: 0,
          term_index: 0,
          pair_index: 0,
          cfg_offset: skipDiscovery ? Math.max(0, existing - pending) : 0,
          current: skipDiscovery ? Math.max(0, existing - pending) : 0,
          total: skipDiscovery ? existing : 1,
          cfg_count: existing,
          com_tag: 0,
          sem_tag: 0,
          errors: 0,
          saturated_terms: [],
          incremental: !full,
        },
      }).eq('id', runId);

      selfInvoke('sync_tag_custom_chunk', runId);
      return new Response(JSON.stringify({ ok: true, run_id: runId, background: true, incremental: !full, skipDiscovery }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }


    if (action === 'incluir_item_massa') {
      let payload: any = {};
      try { payload = await req.json(); } catch { /* ignore */ }
      const item = payload?.item ?? {};
      const cdAcabamentos: string[] = Array.isArray(payload?.cdAcabamentos) ? payload.cdAcabamentos.map(String) : [];
      if (!item?.cdItemAcabamento) throw new Error('cdItemAcabamento é obrigatório.');
      if (!cdAcabamentos.length) throw new Error('Selecione ao menos 1 acabamento.');

      // Fallback: se descrições vieram vazias, buscar em itens_cadastro / auge_produtos
      // para não gravar itens sem descrição no Auge.
      const codigo = String(item.cdItemAcabamento).trim().toUpperCase();
      const dsAtual = String(item.dsItemAcabamento ?? '').trim();
      const dsOrigAtual = String(item.dsItemAcabamentoOriginal ?? '').trim();
      const dsRedAtual = String(item.dsItemAcabamentoReduzida ?? '').trim();
      if (!dsAtual || !dsOrigAtual || !dsRedAtual) {
        let descricao = '';
        try {
          const { data: ic } = await admin
            .from('itens_cadastro')
            .select('descricao')
            .eq('codigo_interno', codigo)
            .maybeSingle();
          descricao = String(ic?.descricao ?? '').trim();
        } catch { /* ignore */ }
        if (!descricao) {
          try {
            const { data: ap } = await admin
              .from('auge_produtos')
              .select('descricao')
              .eq('codigo', codigo)
              .maybeSingle();
            descricao = String(ap?.descricao ?? '').trim();
          } catch { /* ignore */ }
        }
        if (descricao) {
          if (!dsAtual) item.dsItemAcabamento = descricao;
          if (!dsOrigAtual) item.dsItemAcabamentoOriginal = descricao;
          if (!dsRedAtual) {
            // Reduzida = concatena as 4 primeiras letras das 2 primeiras palavras (fallback aceitável).
            const words = descricao.split(/\s+/).filter(Boolean);
            const short = words.slice(0, 2).map(w => w.replace(/[^A-Za-z0-9]/g, '').slice(0, 4)).join('') || descricao.replace(/\s+/g, '').slice(0, 8);
            item.dsItemAcabamentoReduzida = short;
          }
        }
      }

      const runIns = await admin.from('auge_sync_runs').insert({
        entidade: 'incluir_item_massa', status: 'running', started_at: new Date().toISOString(),
        triggered_by: triggeredBy, detalhes: { phase: 'inserindo', current: 0, total: cdAcabamentos.length, item: item.cdItemAcabamento, results: [] },
      }).select('id').single();
      const runId = runIns.data?.id;


      const task = (async () => {
        const results: Array<{ cd: string; ok: boolean; erro?: string }> = [];
        let flushed = 0;
        const flush = async (force = false) => {
          const now = Date.now();
          if (!force && now - flushed < 600) return;
          flushed = now;
          await admin.from('auge_sync_runs').update({
            rows_processed: results.length,
            rows_upserted: results.filter(r => r.ok).length,
            detalhes: { phase: 'inserindo', current: results.length, total: cdAcabamentos.length, item: item.cdItemAcabamento, results: results.slice(-200) },
          }).eq('id', runId);
        };
        for (const cd of cdAcabamentos) {
          try {
            await insertAcabamentoItem(auth, cd, item);
            results.push({ cd, ok: true });
            // refresh local do acabamento afetado
            try {
              const itens = await fetchItensAcabamento(auth, cd);
              const rows = itens.map((r) => mapAcabamentoItemRow(cd, r));
              for (let i = 0; i < rows.length; i += 500) {
                await admin.from('auge_acabamento_itens').upsert(rows.slice(i, i + 500), { onConflict: 'cd_acabamento_item' });
              }
            } catch (e: any) {
              const idx = results.length - 1;
              if (idx >= 0) results[idx].refreshError = getErrorMessage(e);
            }
          } catch (e: any) {
            results.push({ cd, ok: false, erro: getErrorMessage(e) });
          }
          await flush();
        }
        const okCount = results.filter(r => r.ok).length;
        const errCount = results.length - okCount;
        await admin.from('auge_sync_runs').update({
          status: errCount === results.length ? 'error' : 'success',
          finished_at: new Date().toISOString(),
          rows_processed: results.length,
          rows_upserted: okCount,
          error_message: errCount ? `${errCount} acabamento(s) falharam` : null,
          detalhes: { phase: 'concluido', current: results.length, total: cdAcabamentos.length, item: item.cdItemAcabamento, results },
        }).eq('id', runId);
      })().catch(async (e) => {
        await admin.from('auge_sync_runs').update({
          status: 'error', finished_at: new Date().toISOString(), error_message: getErrorMessage(e),
        }).eq('id', runId);
      });
      // @ts-ignore
      if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime?.waitUntil) EdgeRuntime.waitUntil(task);

      return new Response(JSON.stringify({ ok: true, run_id: runId, background: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'excluir_item_massa') {
      let payload: any = {};
      try { payload = await req.json(); } catch { /* ignore */ }
      // targets: Array<{ cdAcabamento: string; cdAcabamentoItem: string }>
      const targets: Array<{ cdAcabamento: string; cdAcabamentoItem: string }> =
        Array.isArray(payload?.targets) ? payload.targets.map((t: any) => ({
          cdAcabamento: String(t?.cdAcabamento ?? ''),
          cdAcabamentoItem: String(t?.cdAcabamentoItem ?? ''),
        })).filter((t: any) => t.cdAcabamento && t.cdAcabamentoItem) : [];
      const cdItemAcabamento = String(payload?.cdItemAcabamento ?? '').trim();
      if (!targets.length) throw new Error('Selecione ao menos 1 acabamento para excluir.');

      const runIns = await admin.from('auge_sync_runs').insert({
        entidade: 'excluir_item_massa', status: 'running', started_at: new Date().toISOString(),
        triggered_by: triggeredBy, detalhes: { phase: 'excluindo', current: 0, total: targets.length, item: cdItemAcabamento, results: [] },
      }).select('id').single();
      const runId = runIns.data?.id;

      const task = (async () => {
        const results: Array<{ cd: string; cdItem: string; ok: boolean; erro?: string }> = [];
        let flushed = 0;
        const flush = async (force = false) => {
          const now = Date.now();
          if (!force && now - flushed < 600) return;
          flushed = now;
          await admin.from('auge_sync_runs').update({
            rows_processed: results.length,
            rows_upserted: results.filter(r => r.ok).length,
            detalhes: { phase: 'excluindo', current: results.length, total: targets.length, item: cdItemAcabamento, results: results.slice(-200) },
          }).eq('id', runId);
        };
        for (const t of targets) {
          try {
            await deleteAcabamentoItem(auth, t.cdAcabamento, t.cdAcabamentoItem);
            results.push({ cd: t.cdAcabamento, cdItem: t.cdAcabamentoItem, ok: true });
            // remove local
            try {
              await admin.from('auge_acabamento_itens').delete().eq('cd_acabamento_item', t.cdAcabamentoItem);
            } catch { /* ignore */ }
          } catch (e: any) {
            results.push({ cd: t.cdAcabamento, cdItem: t.cdAcabamentoItem, ok: false, erro: getErrorMessage(e) });
          }
          await flush();
        }
        const okCount = results.filter(r => r.ok).length;
        const errCount = results.length - okCount;
        await admin.from('auge_sync_runs').update({
          status: errCount === results.length ? 'error' : 'success',
          finished_at: new Date().toISOString(),
          rows_processed: results.length,
          rows_upserted: okCount,
          error_message: errCount ? `${errCount} exclusão(ões) falharam` : null,
          detalhes: { phase: 'concluido', current: results.length, total: targets.length, item: cdItemAcabamento, results },
        }).eq('id', runId);
      })().catch(async (e) => {
        await admin.from('auge_sync_runs').update({
          status: 'error', finished_at: new Date().toISOString(), error_message: getErrorMessage(e),
        }).eq('id', runId);
      });
      // @ts-ignore
      if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime?.waitUntil) EdgeRuntime.waitUntil(task);

      return new Response(JSON.stringify({ ok: true, run_id: runId, background: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    // -------------- ABREVIAÇÕES --------------
    if (action === 'sync_abreviacoes') {
      const task = syncAbreviacoesFull(admin, auth, triggeredBy).catch((e) =>
        console.error('sync_abreviacoes error', getErrorMessage(e))
      );
      // @ts-ignore
      if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime?.waitUntil) EdgeRuntime.waitUntil(task);
      return new Response(JSON.stringify({ ok: true, background: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // -------------- DICIONÁRIOS (classes/subclasses/combinacoes/tags) --------------
    if (action === 'sync_dicionarios') {
      const task = syncDicionariosFull(admin, auth, triggeredBy).catch((e) =>
        console.error('sync_dicionarios error', getErrorMessage(e))
      );
      // @ts-ignore
      if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime?.waitUntil) EdgeRuntime.waitUntil(task);
      return new Response(JSON.stringify({ ok: true, background: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // -------------- CONSULTA PARAMETRIZADA (modTI/gerirConsulta) --------------
    if (action === 'run_consulta') {
      let payload: any = {};
      try { payload = await req.json(); } catch { /* ignore */ }
      const idConsulta = String(payload?.idConsulta ?? url.searchParams.get('idConsulta') ?? '').trim();
      if (!idConsulta) throw new Error('idConsulta é obrigatório.');
      const data = await runConsultaAuge(auth, idConsulta);
      return new Response(JSON.stringify({ ok: true, ...data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // -------------- SALVAR / EXCLUIR ABREVIAÇÃO DIRETO NO AUGE --------------
    if (action === 'salvar_abreviacao' || action === 'excluir_abreviacao') {
      let payload: any = {};
      try { payload = await req.json(); } catch { /* ignore */ }

      if (action === 'excluir_abreviacao') {
        const cdAbreviacao = String(payload?.cdAbreviacao ?? '').trim();
        if (!cdAbreviacao) throw new Error('cdAbreviacao é obrigatório.');
        const resp = await excluirAbreviacaoAuge(auth, cdAbreviacao);
        await admin.from('auge_abreviacoes').delete().eq('cd_abreviacao', cdAbreviacao);
        return new Response(JSON.stringify({ ok: true, auge: resp }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const dsAtual = String(payload?.dsAtual ?? '').trim();
      const dsAbreviada = String(payload?.dsAbreviada ?? '').trim();
      const idTipoAbreviacao = payload?.idTipoAbreviacao ?? 1;
      const cdAbreviacao = payload?.cdAbreviacao ? String(payload.cdAbreviacao) : null;
      const solicitacaoId = payload?.solicitacaoId ? String(payload.solicitacaoId) : null;

      if (!dsAtual || !dsAbreviada) throw new Error('dsAtual e dsAbreviada são obrigatórios.');

      const resp = await salvarAbreviacaoAuge(auth, { cdAbreviacao, dsAtual, dsAbreviada, idTipoAbreviacao });

      // Reaproveita o retorno: PHP costuma responder com o novo cdAbreviacao ou lista atualizada.
      let novoCd: string | null = null;
      if (resp && typeof resp === 'object') {
        novoCd = resp?.cdAbreviacao ?? resp?.data?.cdAbreviacao ?? resp?.data?.[0]?.cdAbreviacao ?? null;
      }

      // Ressincroniza para pegar o registro real (independente do formato do retorno).
      try { await syncAbreviacoesFull(admin, auth, triggeredBy); } catch { /* melhor esforço */ }

      // Se veio de uma solicitação, marca como efetivada.
      if (solicitacaoId) {
        // procura o registro pelos textos (mais confiável que o cd retornado)
        if (!novoCd) {
          const { data } = await admin
            .from('auge_abreviacoes')
            .select('cd_abreviacao')
            .eq('ds_atual', dsAtual)
            .eq('ds_abreviada', dsAbreviada)
            .limit(1);
          novoCd = data?.[0]?.cd_abreviacao ?? null;
        }
        await admin.from('abreviacoes_solicitadas').update({
          status: 'efetivada',
          cd_abreviacao_efetivada: novoCd,
          revisado_em: new Date().toISOString(),
        }).eq('id', solicitacaoId);
      }

      return new Response(JSON.stringify({ ok: true, auge: resp, cdAbreviacao: novoCd }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }


    // -------------- AUTOMAÇÃO ENTREGA APÓS --------------
    // Consulta todos os acabamentos que contêm o item e aplica a mutação
    // solicitada (preview | atualizar | adicionar | remover) na descrição
    // e na descrição reduzida, além de manter a abreviação Ent_Ap_ ↔ E dd/m.
    if (action === 'entrega_apos') {
      let payload: any = {};
      try { payload = await req.json(); } catch { /* ignore */ }

      const codigoItem = String(payload?.codigo_item ?? '').trim().toUpperCase();
      const rawAcao = String(payload?.acao ?? 'preview').toLowerCase().trim();
      const acao =
        rawAcao === 'preview' || rawAcao === 'atualizar' ||
        rawAcao === 'adicionar' || rawAcao === 'remover'
          ? rawAcao as 'preview' | 'atualizar' | 'adicionar' | 'remover'
          : null;
      if (!codigoItem) throw new Error('codigo_item é obrigatório.');
      if (!acao) throw new Error('acao inválida (use preview | atualizar | adicionar | remover).');

      // Normaliza a nova data para o formato DD/MM/AA.
      const normalizarData = (s: string | undefined | null): string | null => {
        if (!s) return null;
        const m = String(s).trim().match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/);
        if (!m) return null;
        const dd = m[1].padStart(2, '0');
        const mm = m[2].padStart(2, '0');
        const yy = m[3].length === 4 ? m[3].slice(-2) : m[3].padStart(2, '0');
        return `${dd}/${mm}/${yy}`;
      };
      const novaData = acao !== 'remover' ? normalizarData(payload?.nova_data) : null;
      if ((acao === 'atualizar' || acao === 'adicionar') && !novaData) {
        throw new Error('nova_data é obrigatória e deve estar no formato DD/MM/AA.');
      }

      const longToken = (d: string) => `(Ent_Ap_${d})`;
      const shortToken = (d: string) => {
        const [dd, mm] = d.split('/');
        return `E${dd}/${parseInt(mm, 10)}`;
      };
      const stripLong = (s: string) =>
        (s ?? '').replace(/\s*\(\s*Ent[_\s]?Ap[_\s]?\d{1,2}\/\d{1,2}\/\d{2,4}\s*\)/gi, '').trim();
      const stripShort = (s: string) =>
        (s ?? '').replace(/\s*E\d{1,2}\/\d{1,2}\s*$/i, '').trim();

      // Constrói o conjunto de variantes do código informado.
      // Aceita qualquer tipo de código (interno, fornecedor, cd_item_acabamento etc).
      const normCode = (s: string) => (s ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');
      const alphaNum = normCode(codigoItem);
      const variantsSet = new Set<string>();
      variantsSet.add(codigoItem);
      variantsSet.add(codigoItem.replace(/\./g, ''));
      variantsSet.add(codigoItem.toUpperCase());
      variantsSet.add(codigoItem.toLowerCase());
      if (alphaNum) variantsSet.add(alphaNum);

      // Consulta itens_cadastro para vincular códigos equivalentes (interno + fornecedores).
      try {
        const orParts: string[] = [];
        if (alphaNum) orParts.push(`codigo_interno_normalizado.eq.${alphaNum}`);
        if (alphaNum) orParts.push(`codigos_fornecedor_normalizado.cs.{${alphaNum}}`);
        orParts.push(`codigo_interno.eq.${codigoItem}`);
        const { data: cad } = await admin
          .from('itens_cadastro')
          .select('codigo_interno, codigo_interno_normalizado, codigos_fornecedor_normalizado')
          .or(orParts.join(','))
          .limit(20);
        for (const it of (cad ?? []) as any[]) {
          if (it.codigo_interno) {
            variantsSet.add(String(it.codigo_interno));
            variantsSet.add(String(it.codigo_interno).replace(/\./g, ''));
          }
          if (it.codigo_interno_normalizado) variantsSet.add(String(it.codigo_interno_normalizado));
          for (const cf of (it.codigos_fornecedor_normalizado ?? []) as string[]) {
            if (cf) variantsSet.add(String(cf));
          }
        }
      } catch { /* segue com variantes básicas */ }

      const variantes = Array.from(variantsSet).filter(Boolean);
      const { data: linhas, error: errLinhas } = await admin
        .from('auge_acabamento_itens')
        .select(`cd_acabamento_item, cd_acabamento, cd_item_acabamento,
                 ds_item_acabamento, ds_item_acabamento_reduzida, ds_item_acabamento_original,
                 cd_kit_complementar_1, cd_kit_complementar_2, cd_kit_complementar_3,
                 cd_kit_complementar_4, cd_kit_complementar_5,
                 auge_acabamentos ( cd_acabamento, chave_acabamento, nm_acabamento, id_cancelado )`)
        .in('cd_item_acabamento', variantes)
        .limit(500);
      if (errLinhas) throw new Error(errLinhas.message);

      const rows = (linhas ?? []) as any[];
      if (rows.length === 0) {
        return new Response(JSON.stringify({
          ok: true, acao, codigo_item: codigoItem, total: 0, rows: [],
          message: `Nenhum acabamento vinculado ao item ${codigoItem}.`,
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // Preview: apenas devolve a tabela.
      if (acao === 'preview') {
        const preview = rows.map((r) => {
          const desc = r.ds_item_acabamento ?? r.ds_item_acabamento_original ?? '';
          const m = desc.match(/\(\s*Ent[_ ]?Ap[_ ]?(\d{1,2}\/\d{1,2}\/\d{2,4})\s*\)/i);
          return {
            cd_acabamento_item: r.cd_acabamento_item,
            cd_acabamento: r.cd_acabamento,
            cd_item_acabamento: r.cd_item_acabamento,
            chave_acabamento: r.auge_acabamentos?.chave_acabamento ?? r.cd_acabamento,
            nm_acabamento: r.auge_acabamentos?.nm_acabamento ?? null,
            cancelado: r.auge_acabamentos?.id_cancelado === 'S',
            descricao_atual: desc,
            descricao_reduzida: r.ds_item_acabamento_reduzida ?? '',
            entrega_apos_atual: m ? m[1] : null,
          };
        });
        return new Response(JSON.stringify({
          ok: true, acao, codigo_item: codigoItem, total: preview.length, rows: preview,
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // Execução: aplica linha a linha (writes no Auge).
      const results: any[] = [];
      let sucesso = 0, falha = 0, ignoradas = 0;
      for (const r of rows) {
        const chave = r.auge_acabamentos?.chave_acabamento ?? r.cd_acabamento;
        try {
          if (r.auge_acabamentos?.id_cancelado === 'S') {
            ignoradas++;
            results.push({ chave_acabamento: chave, status: 'ignorada', motivo: 'acabamento cancelado' });
            continue;
          }
          const baseLong = stripLong(r.ds_item_acabamento_original ?? r.ds_item_acabamento ?? '');
          const baseLongCurr = stripLong(r.ds_item_acabamento ?? r.ds_item_acabamento_original ?? '');
          const baseShort = stripShort(r.ds_item_acabamento_reduzida ?? '');

          let newLongOrig = baseLong;
          let newLong = baseLongCurr;
          let newShort = baseShort;
          if (acao !== 'remover' && novaData) {
            newLongOrig = `${baseLong} ${longToken(novaData)}`.trim();
            newLong = `${baseLongCurr} ${longToken(novaData)}`.trim();
            newShort = `${baseShort}${shortToken(novaData)}`;
          }

          // Se nada mudou, pula (evita hit inútil no Auge).
          if (
            newLong === (r.ds_item_acabamento ?? '') &&
            newLongOrig === (r.ds_item_acabamento_original ?? '') &&
            newShort === (r.ds_item_acabamento_reduzida ?? '')
          ) {
            ignoradas++;
            results.push({ chave_acabamento: chave, status: 'ignorada', motivo: 'sem mudanças' });
            continue;
          }

          const resp = await updateAcabamentoItem(auth, {
            cdAcabamento: String(r.cd_acabamento),
            cdAcabamentoItem: String(r.cd_acabamento_item),
            cdItemAcabamento: String(r.cd_item_acabamento),
            dsItemAcabamento: newLong,
            dsItemAcabamentoReduzida: newShort,
            dsItemAcabamentoOriginal: newLongOrig,
            cdKitComplementar1: String(r.cd_kit_complementar_1 ?? ''),
            cdKitComplementar2: String(r.cd_kit_complementar_2 ?? ''),
            cdKitComplementar3: String(r.cd_kit_complementar_3 ?? ''),
            cdKitComplementar4: String(r.cd_kit_complementar_4 ?? ''),
            cdKitComplementar5: String(r.cd_kit_complementar_5 ?? ''),
          });

          // Reflete localmente.
          await admin.from('auge_acabamento_itens').update({
            ds_item_acabamento: newLong,
            ds_item_acabamento_reduzida: newShort,
            ds_item_acabamento_original: newLongOrig,
          }).eq('cd_acabamento_item', r.cd_acabamento_item);

          sucesso++;
          results.push({
            chave_acabamento: chave, status: 'ok',
            de: r.ds_item_acabamento, para: newLong, auge: resp?.message ?? null,
          });
        } catch (err) {
          falha++;
          results.push({ chave_acabamento: chave, status: 'erro', campo: 'descricao', erro: getErrorMessage(err) });
        }
      }

      // Cria/atualiza abreviação Ent_Ap_DD/MM/AA → E{dd}/{m} (apenas em atualizar/adicionar)
      let abreviacao: any = null;
      if ((acao === 'atualizar' || acao === 'adicionar') && novaData) {
        try {
          const dsAtual = `(Ent_Ap_${novaData})`;
          const dsAbreviada = shortToken(novaData);
          const { data: existente } = await admin
            .from('auge_abreviacoes')
            .select('cd_abreviacao, ds_abreviada')
            .eq('ds_atual', dsAtual)
            .maybeSingle();
          if (!existente) {
            const resp = await salvarAbreviacaoAuge(auth, { dsAtual, dsAbreviada, idTipoAbreviacao: 1 });
            abreviacao = { status: 'criada', dsAtual, dsAbreviada, auge: resp?.message ?? resp };
          } else if (existente.ds_abreviada !== dsAbreviada) {
            const resp = await salvarAbreviacaoAuge(auth, {
              cdAbreviacao: existente.cd_abreviacao, dsAtual, dsAbreviada, idTipoAbreviacao: 1,
            });
            abreviacao = { status: 'atualizada', dsAtual, dsAbreviada, auge: resp?.message ?? resp };
          } else {
            abreviacao = { status: 'ja_existia', dsAtual, dsAbreviada };
          }
        } catch (err) {
          abreviacao = { status: 'erro', campo: 'abreviacao', erro: getErrorMessage(err) };
        }
      }

      return new Response(JSON.stringify({
        ok: falha === 0, acao, codigo_item: codigoItem, nova_data: novaData,
        total: rows.length, sucesso, falha, ignoradas, results, abreviacao,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }


    // ==============================================================
    // Necessidade de Transferências
    //   necessidade_listar     -> chama getNecessidade.php do Auge
    //   necessidade_criar      -> monta rascunho no Auge (FIFO para
    //                             itens com controle de lote/série)
    // ==============================================================
    if (action === 'necessidade_listar') {
      let payload: any = {};
      try { payload = await req.json(); } catch { /* ignore */ }
      const cdDepositoDestino = String(payload?.cdDepositoDestino ?? '').trim();
      const cdDepositoOrigem = String(payload?.cdDepositoOrigem ?? '').trim();
      if (!cdDepositoDestino) throw new Error('cdDepositoDestino é obrigatório.');

      const origemConsulta = cdDepositoOrigem || '01';
      const body = new URLSearchParams({ cdDepositoDestino: origemConsulta });
      const j = await postAjaxJson(
        auth,
        '/l.unilux/modInventario/estoque/ajax/getNecessidade.php',
        body,
      );
      const raw = Array.isArray(j?.data) ? j.data : [];
      const rows = raw
        .filter((r: any) => String(r.cdDeposito ?? '').trim().toUpperCase() === cdDepositoDestino.toUpperCase())
        .map((r: any) => ({
        cdItem: String(r.cdItem ?? ''),
        nmItem: String(r.nmItem ?? ''),
        cdDepositoOrigem: origemConsulta,
        nmDepositoOrigem: origemConsulta === '01' ? 'Central [01]' : '',
        cdDepositoNecessidade: String(r.cdDeposito ?? ''),
        nmDepositoNecessidade: String(r.nmDeposito ?? ''),
        unidade: String(r.idUnidadeMedida ?? ''),
        qtEstoqueGeral: parseBRNumber(r.qtdEstoqueGeral),
        qtEstoque: parseBRNumber(r.qtdEstoque),
        qtSaida: parseBRNumber(r.qtdSaida),
        qtDisponivel: parseBRNumber(r.qtdDisponivel),
        qtMinimo: parseBRNumber(r.qtEstoqueMinimo),
        qtRecomendacao: parseBRNumber(r.qtdRecomendacao),
        dsAviso: String(r.dsAviso ?? ''),
        idControleLote: String(r.idControleLote ?? 'N').toUpperCase() === 'Y',
        idControleSerie: String(r.idControleSerie ?? 'N').toUpperCase() === 'Y',
        qtConsumo30d: parseBRNumber(r.qtdConsumoUlt30dias),
        idRnpPadrao: String(r.idRnpPadrao ?? ''),
      }));
      return new Response(JSON.stringify({
        ok: true, cdDepositoDestino, cdDepositoOrigem: origemConsulta, total: rows.length, data: rows,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'necessidade_criar') {
      let payload: any = {};
      try { payload = await req.json(); } catch { /* ignore */ }
      const cdDepositoDestino = String(payload?.cdDepositoDestino ?? '').trim();
      const itensIn = Array.isArray(payload?.itens) ? payload.itens : [];
      if (!cdDepositoDestino) throw new Error('cdDepositoDestino é obrigatório.');
      if (!itensIn.length) throw new Error('Envie ao menos 1 item em "itens".');

      // Expande cada linha: FIFO em lote/série; motores nunca são fracionados.
      const itensFinais: TransferenciaItem[] = [];
      const relatorio: any[] = [];
      for (const it of itensIn) {
        const cdItem = String(it?.cdItem ?? '').trim();
        const cdDepositoOrigem = String(it?.cdDepositoOrigem ?? '').trim();
        const qtdAlvo = Number(it?.qtd);
        const controleLote = !!it?.idControleLote;
        const controleSerie = !!it?.idControleSerie;
        if (!cdItem || !cdDepositoOrigem || !Number.isFinite(qtdAlvo) || qtdAlvo <= 0) {
          relatorio.push({ cdItem, status: 'ignorada', motivo: 'dados inválidos' });
          continue;
        }
        if (controleLote || controleSerie) {
          try {
            const rows = controleSerie
              ? await fetchSeriesLive(auth, cdItem, cdDepositoOrigem)
              : await fetchLotesLive(auth, cdItem, cdDepositoOrigem);
            let restante = qtdAlvo;
            const usados: any[] = [];
            for (const r of rows) {
              if (restante <= 0) break;
              const disp = Math.max(0, r.quantidade - (r.selecionado || 0));
              if (disp <= 0) continue;
              if (controleSerie) {
                // Motores não fracionam: só entra se couber inteiro.
                if (disp <= restante) {
                  itensFinais.push({ cdItem, cdDepositoOrigem, cdDepositoDestino, qtd: disp, nrLote: r.lote });
                  usados.push({ lote: r.lote, qtd: disp });
                  restante -= disp;
                }
              } else {
                const usar = Math.min(disp, restante);
                itensFinais.push({ cdItem, cdDepositoOrigem, cdDepositoDestino, qtd: usar, nrLote: r.lote });
                usados.push({ lote: r.lote, qtd: usar });
                restante -= usar;
              }
            }
            relatorio.push({
              cdItem, alvo: qtdAlvo, atendido: qtdAlvo - restante,
              faltou: restante > 0 ? restante : 0, lotes: usados,
              status: restante > 0 ? (usados.length ? 'parcial' : 'sem_estoque') : 'ok',
            });
            if (!usados.length) continue;
          } catch (err) {
            relatorio.push({ cdItem, status: 'erro', erro: getErrorMessage(err) });
            continue;
          }
        } else {
          itensFinais.push({ cdItem, cdDepositoOrigem, cdDepositoDestino, qtd: qtdAlvo });
          relatorio.push({ cdItem, alvo: qtdAlvo, atendido: qtdAlvo, status: 'ok' });
        }
      }

      if (!itensFinais.length) {
        return new Response(JSON.stringify({
          ok: false, error: 'Nenhum item pôde ser incluído no rascunho.', relatorio,
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const observacao = String(payload?.observacao ?? 'Necessidade (Pente Fino)');
      const cd = await criarTransferencia(auth, itensFinais, observacao);
      let efetivado = false;
      if (payload?.efetivar === true) {
        await efetivarTransferencia(auth, cd);
        efetivado = true;
      }
      await admin.from('auge_sync_runs').insert({
        status: 'success', triggered_by: triggeredBy, entidade: 'transferencias',
        finished_at: new Date().toISOString(),
        detalhes: { action: 'necessidade_criar', cdMovimentacao: cd, itens: itensFinais.length, efetivado },
      });
      return new Response(JSON.stringify({
        ok: true, cdMovimentacao: cd, efetivado, itens_criados: itensFinais.length, relatorio,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ==============================================================
    // necessidade_cron_run
    //   Executa o fluxo Necessidade automaticamente para uma lista
    //   de depósitos destino (origem sempre "01" — Central).
    //   Para "PVT", divide em 2 rascunhos: tecidos (TC.*) e demais.
    //   Filtra: saldo em 01 > 0 e qtRecomendacao > 0.
    // ==============================================================
    if (action === 'necessidade_cron_run') {
      let payload: any = {};
      try { payload = await req.json(); } catch { /* ignore */ }
      const destinosDefault = ['18', '20', 'EMBALAGE', 'ESPE.1', 'ESPE.2', 'PH', 'PVT'];
      const destinos: string[] = Array.isArray(payload?.destinos) && payload.destinos.length
        ? payload.destinos.map((s: any) => String(s).trim()).filter(Boolean)
        : destinosDefault;
      const efetivar = payload?.efetivar === true;
      const skipLog = payload?.skip_log === true;

      const resultados: any[] = [];

      const listar = async (destino: string) => {
        // No fluxo original do Auge, o campo enviado a getNecessidade.php é o
        // depósito de ORIGEM selecionado no modal; já o campo retornado como
        // `cdDeposito` é o depósito que possui a necessidade (destino da linha).
        // Portanto, consultamos a origem fixa 01 e depois mantemos somente as
        // linhas cujo destino da necessidade corresponde ao destino processado.
        const body = new URLSearchParams({ cdDepositoDestino: '01' });
        const j = await postAjaxJson(
          auth,
          '/l.unilux/modInventario/estoque/ajax/getNecessidade.php',
          body,
        );
        const raw = Array.isArray(j?.data) ? j.data : [];
        return raw.map((r: any) => ({
          cdItem: String(r.cdItem ?? ''),
          nmItem: String(r.nmItem ?? ''),
          cdDepositoNecessidade: String(r.cdDeposito ?? '').trim(),
          qtRecomendacao: parseBRNumber(r.qtdRecomendacao),
          idControleLote: String(r.idControleLote ?? 'N').toUpperCase() === 'Y',
          idControleSerie: String(r.idControleSerie ?? 'N').toUpperCase() === 'Y',
        })).filter((r: any) => r.cdDepositoNecessidade.toUpperCase() === destino.toUpperCase());
      };

      const criarRascunho = async (destino: string, rows: any[], tag: string) => {
        // Dedup por cdItem (Auge devolve 1 linha por depósito sugerido).
        const seen = new Set<string>();
        const elegiveis = rows.filter(r => {
          if (!(r.qtRecomendacao > 0)) return false;
          if (seen.has(r.cdItem)) return false;
          seen.add(r.cdItem);
          return true;
        });
        if (!elegiveis.length) {
          return { destino, tag, status: 'sem_itens', itens: 0 };
        }
        const itensFinais: TransferenciaItem[] = [];
        const relatorio: any[] = [];
        for (const it of elegiveis) {
          const qtdAlvo = it.qtRecomendacao;
          if (qtdAlvo <= 0) continue;
          if (it.idControleLote || it.idControleSerie) {
            try {
              const lotes = it.idControleSerie
                ? await fetchSeriesLive(auth, it.cdItem, '01')
                : await fetchLotesLive(auth, it.cdItem, '01');
              let restante = qtdAlvo;
              const usados: any[] = [];
              for (const r of lotes) {
                if (restante <= 0) break;
                const disp = Math.max(0, r.quantidade - (r.selecionado || 0));
                if (disp <= 0) continue;
                if (it.idControleSerie) {
                  if (disp <= restante) {
                    itensFinais.push({ cdItem: it.cdItem, cdDepositoOrigem: '01', cdDepositoDestino: destino, qtd: disp, nrLote: r.lote });
                    usados.push(r.lote); restante -= disp;
                  }
                } else {
                  const usar = Math.min(disp, restante);
                  itensFinais.push({ cdItem: it.cdItem, cdDepositoOrigem: '01', cdDepositoDestino: destino, qtd: usar, nrLote: r.lote });
                  usados.push(r.lote); restante -= usar;
                }
              }
              relatorio.push({ cdItem: it.cdItem, alvo: qtdAlvo, faltou: restante > 0 ? restante : 0 });
            } catch (err) {
              relatorio.push({ cdItem: it.cdItem, erro: getErrorMessage(err) });
            }
          } else {
            itensFinais.push({ cdItem: it.cdItem, cdDepositoOrigem: '01', cdDepositoDestino: destino, qtd: qtdAlvo });
          }
        }
        if (!itensFinais.length) return { destino, tag, status: 'sem_itens', itens: 0, relatorio };
        try {
          const nomeDestinoMap: Record<string, string> = {
            '18': '18',
            '20': '20',
            'EMBALAGE': 'Embalagem',
            'ESPE.1': 'Espe.01',
            'ESPE.2': 'Espe.02',
            'PH': 'PH',
            'PVT': 'PVT',
          };
          const nomeDestino = nomeDestinoMap[destino.toUpperCase()] ?? destino;
          // Data em BRT (UTC-3) no formato DD/MM/AA
          const nowBrt = new Date(Date.now() - 3 * 60 * 60 * 1000);
          const dd = String(nowBrt.getUTCDate()).padStart(2, '0');
          const mm = String(nowBrt.getUTCMonth() + 1).padStart(2, '0');
          const yy = String(nowBrt.getUTCFullYear()).slice(-2);
          const observacao = `${nomeDestino} Nec ${dd}/${mm}/${yy}`;
          const cd = await criarTransferencia(auth, itensFinais, observacao);
          if (efetivar) await efetivarTransferencia(auth, cd);
          return { destino, tag, status: 'ok', cdMovimentacao: cd, itens: itensFinais.length, efetivado: efetivar };
        } catch (err) {
          return { destino, tag, status: 'erro', itens: itensFinais.length, erro: getErrorMessage(err) };
        }
      };

      for (const destino of destinos) {
        try {
          const rows = await listar(destino);
          resultados.push(await criarRascunho(destino, rows, destino));
        } catch (err) {
          resultados.push({ destino, status: 'erro_listar', erro: getErrorMessage(err) });
        }
      }


      if (!skipLog) {
        await admin.from('auge_sync_runs').insert({
          status: 'success', triggered_by: triggeredBy, entidade: 'transferencias',
          finished_at: new Date().toISOString(),
          detalhes: { action: 'necessidade_cron_run', destinos, resultados },
        });
      }

      return new Response(JSON.stringify({ ok: true, destinos, resultados }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'necessidade_cron_log') {
      let payload: any = {};
      try { payload = await req.json(); } catch { /* ignore */ }
      const resultados = Array.isArray(payload?.resultados) ? payload.resultados : [];
      const destinos = Array.isArray(payload?.destinos) ? payload.destinos : [];
      await admin.from('auge_sync_runs').insert({
        status: 'success', triggered_by: triggeredBy, entidade: 'transferencias',
        finished_at: new Date().toISOString(),
        detalhes: { action: 'necessidade_cron_run', destinos, resultados },
      });
      return new Response(JSON.stringify({ ok: true }), {
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

    let syncPayload: any = {};
    try { syncPayload = await req.clone().json(); } catch { /* GET ou body ausente */ }
    const syncOptions = {
      dateFrom: cleanText(url.searchParams.get('dateFrom')) ?? cleanText(syncPayload?.dateFrom) ?? cleanText(syncPayload?.dataDe),
      dateTo: cleanText(url.searchParams.get('dateTo')) ?? cleanText(syncPayload?.dateTo) ?? cleanText(syncPayload?.dataAte),
    };
    const results = [];

    for (const e of entities) {
      results.push(await syncEntity(admin, auth, e, triggeredBy, syncOptions));
    }

    const totalUpserted = results.reduce((s, r: any) => s + (r.upserted ?? 0), 0);
    return new Response(JSON.stringify({ ok: true, upserted: totalUpserted, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    const msg = getErrorMessage(e);
    return new Response(JSON.stringify({ ok: false, error: msg, fallback: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
