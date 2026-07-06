/**
 * Cliente para a API REST do n8n local.
 *
 * Como o app roda em localhost junto com o n8n, as chamadas são feitas
 * diretamente ao `http://localhost:5678/api/v1/...` sem passar por proxy.
 *
 * Requer:
 *  - n8n rodando (default `http://localhost:5678`)
 *  - API key gerada em: n8n → Settings → n8n API → Create API Key
 *    (armazenada em localStorage: `n8n_api_key`)
 */

export interface N8nExecution {
  id: string;
  finished: boolean;
  mode: string;
  startedAt: string;
  stoppedAt?: string;
  status: 'success' | 'error' | 'running' | 'waiting' | 'canceled' | 'crashed' | 'new' | 'unknown';
  workflowId: string;
  workflowName?: string;
  retryOf?: string | null;
  errorMessage?: string;
  errorNode?: string;
}

export interface N8nHealth {
  online: boolean;
  authenticated: boolean;
  version?: string;
  latencyMs: number;
  error?: string;
}

const LS_URL = 'n8n_api_url';
const LS_KEY = 'n8n_api_key';
const LS_LAST_PAYLOADS = 'n8n_last_payloads';

export function getN8nBaseUrl(): string {
  return (localStorage.getItem(LS_URL) || 'http://localhost:5678').replace(/\/+$/, '');
}
export function setN8nBaseUrl(url: string) {
  localStorage.setItem(LS_URL, url.trim());
}
export function getN8nApiKey(): string {
  return localStorage.getItem(LS_KEY) || '';
}
export function setN8nApiKey(key: string) {
  localStorage.setItem(LS_KEY, key.trim());
}

function apiHeaders(): HeadersInit {
  const key = getN8nApiKey();
  const h: Record<string, string> = { 'Accept': 'application/json' };
  if (key) h['X-N8N-API-KEY'] = key;
  return h;
}

/** Verifica se o n8n está online e se a API key funciona. */
export async function checkHealth(): Promise<N8nHealth> {
  const base = getN8nBaseUrl();
  const t0 = performance.now();
  try {
    // /healthz é público (não requer API key)
    const res = await fetch(`${base}/healthz`, { method: 'GET', cache: 'no-store' });
    const latencyMs = Math.round(performance.now() - t0);
    if (!res.ok) {
      return { online: false, authenticated: false, latencyMs, error: `HTTP ${res.status}` };
    }
    // Testa autenticação via endpoint da API v1
    let authenticated = false;
    let version: string | undefined;
    if (getN8nApiKey()) {
      try {
        const authRes = await fetch(`${base}/api/v1/workflows?limit=1`, { headers: apiHeaders() });
        authenticated = authRes.ok;
        version = authRes.headers.get('x-n8n-version') || undefined;
      } catch { /* noop */ }
    }
    return { online: true, authenticated, version, latencyMs };
  } catch (e: any) {
    const latencyMs = Math.round(performance.now() - t0);
    return {
      online: false,
      authenticated: false,
      latencyMs,
      error: e?.message?.includes('Failed to fetch')
        ? 'n8n não responde em ' + base + ' (offline, porta bloqueada ou URL errada)'
        : (e?.message || String(e)),
    };
  }
}

/** Lista as últimas execuções. */
export async function listExecutions(opts: {
  limit?: number;
  status?: 'success' | 'error' | 'waiting';
  workflowId?: string;
} = {}): Promise<N8nExecution[]> {
  const base = getN8nBaseUrl();
  const params = new URLSearchParams();
  params.set('limit', String(opts.limit ?? 20));
  params.set('includeData', 'false');
  if (opts.status) params.set('status', opts.status);
  if (opts.workflowId) params.set('workflowId', opts.workflowId);

  const res = await fetch(`${base}/api/v1/executions?${params}`, { headers: apiHeaders() });
  if (!res.ok) {
    throw new Error(`API n8n retornou ${res.status} — ` + (res.status === 401 ? 'API key inválida' : await res.text()));
  }
  const json = await res.json();
  const raw: any[] = json.data ?? json ?? [];
  return raw.map((e) => ({
    id: String(e.id),
    finished: !!e.finished,
    mode: e.mode || 'unknown',
    startedAt: e.startedAt,
    stoppedAt: e.stoppedAt,
    status: (e.status || (e.finished ? (e.stoppedAt ? 'success' : 'unknown') : 'running')) as N8nExecution['status'],
    workflowId: String(e.workflowId ?? ''),
    workflowName: e.workflowData?.name,
    retryOf: e.retryOf ?? null,
  }));
}

/** Busca detalhes de uma execução (incluindo erro). */
export async function getExecutionDetail(id: string): Promise<N8nExecution & { raw: any }> {
  const base = getN8nBaseUrl();
  const res = await fetch(`${base}/api/v1/executions/${id}?includeData=true`, { headers: apiHeaders() });
  if (!res.ok) throw new Error(`API n8n retornou ${res.status}`);
  const raw = await res.json();
  const runData = raw?.data?.resultData?.runData || {};
  let errorNode: string | undefined;
  let errorMessage: string | undefined;
  for (const nodeName of Object.keys(runData)) {
    const runs = runData[nodeName];
    if (Array.isArray(runs)) {
      for (const r of runs) {
        if (r?.error) {
          errorNode = nodeName;
          errorMessage = r.error.message || r.error.description || 'Erro desconhecido';
          break;
        }
      }
    }
    if (errorMessage) break;
  }
  return {
    id: String(raw.id),
    finished: !!raw.finished,
    mode: raw.mode,
    startedAt: raw.startedAt,
    stoppedAt: raw.stoppedAt,
    status: raw.status,
    workflowId: String(raw.workflowId ?? ''),
    workflowName: raw.workflowData?.name,
    retryOf: raw.retryOf ?? null,
    errorMessage,
    errorNode,
    raw,
  };
}

// ============ RETRY: histórico local dos últimos payloads enviados ============

export interface LastPayload {
  id: string;               // uuid gerado no cliente
  sentAt: string;           // ISO
  webhookUrl: string;
  status: 'ok' | 'fail';
  errorMessage?: string;
  payload: any;             // corpo enviado
  title?: string;
}

const MAX_HISTORY = 30;

export function recordPayload(entry: Omit<LastPayload, 'id'>): LastPayload {
  const full: LastPayload = { ...entry, id: crypto.randomUUID() };
  const list = getRecordedPayloads();
  list.unshift(full);
  localStorage.setItem(LS_LAST_PAYLOADS, JSON.stringify(list.slice(0, MAX_HISTORY)));
  return full;
}

export function getRecordedPayloads(): LastPayload[] {
  try {
    return JSON.parse(localStorage.getItem(LS_LAST_PAYLOADS) || '[]');
  } catch { return []; }
}

export function clearRecordedPayloads() {
  localStorage.removeItem(LS_LAST_PAYLOADS);
}

/** Reenvia um payload previamente gravado. */
export async function retryPayload(id: string): Promise<{ ok: boolean; status?: number; error?: string }> {
  const item = getRecordedPayloads().find((p) => p.id === id);
  if (!item) return { ok: false, error: 'Payload não encontrado no histórico local' };
  try {
    const res = await fetch(item.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(item.payload),
    });
    // Atualiza status no histórico
    const list = getRecordedPayloads();
    const idx = list.findIndex((p) => p.id === id);
    if (idx >= 0) {
      list[idx] = {
        ...list[idx],
        status: res.ok ? 'ok' : 'fail',
        errorMessage: res.ok ? undefined : `HTTP ${res.status}`,
        sentAt: new Date().toISOString(),
      };
      localStorage.setItem(LS_LAST_PAYLOADS, JSON.stringify(list));
    }
    return { ok: res.ok, status: res.status };
  } catch (e: any) {
    return { ok: false, error: e?.message || String(e) };
  }
}

// ============ DIAGNÓSTICO ============

export interface Diagnosis {
  level: 'ok' | 'warn' | 'error';
  title: string;
  detail: string;
  suggestion: string;
}

/** Aplica heurísticas sobre execuções + health para sugerir causas e soluções. */
export function diagnose(health: N8nHealth, executions: N8nExecution[]): Diagnosis[] {
  const out: Diagnosis[] = [];

  if (!health.online) {
    out.push({
      level: 'error',
      title: 'n8n offline',
      detail: health.error || 'Sem resposta em ' + getN8nBaseUrl(),
      suggestion: 'Verifique se o n8n está rodando (`n8n start` ou `docker start n8n`) e se a URL em Configurações → n8n aponta para o endereço correto.',
    });
    return out; // Sem sentido diagnosticar mais
  }

  if (!getN8nApiKey()) {
    out.push({
      level: 'warn',
      title: 'API key não configurada',
      detail: 'Sem API key, o painel só consegue verificar se o n8n está online — não consegue listar execuções.',
      suggestion: 'Em n8n → Settings → n8n API → Create API Key. Cole a chave em Configurações → n8n neste app.',
    });
    return out;
  }

  if (!health.authenticated) {
    out.push({
      level: 'error',
      title: 'API key inválida',
      detail: 'A chave foi rejeitada pelo n8n.',
      suggestion: 'Gere uma nova chave em n8n → Settings → n8n API e atualize em Configurações.',
    });
    return out;
  }

  // Análise de falhas
  const errors = executions.filter((e) => e.status === 'error' || e.status === 'crashed');
  const total = executions.length;
  const rate = total > 0 ? errors.length / total : 0;

  if (rate >= 0.5 && total >= 4) {
    out.push({
      level: 'error',
      title: `Taxa de erro alta: ${Math.round(rate * 100)}%`,
      detail: `${errors.length} de ${total} últimas execuções falharam.`,
      suggestion: 'Abra as execuções com erro para ver o nó que quebrou. Causas comuns: impressora offline, credencial expirada, campo obrigatório faltando no payload.',
    });
  } else if (rate > 0) {
    out.push({
      level: 'warn',
      title: `${errors.length} falha${errors.length > 1 ? 's' : ''} recente${errors.length > 1 ? 's' : ''}`,
      detail: `${errors.length}/${total} execuções com erro.`,
      suggestion: 'Clique em uma execução para ver detalhes. Use "Reenviar" para tentar novamente.',
    });
  }

  // Agrupamento por nó de erro (se disponível)
  const nodeCounts = new Map<string, number>();
  for (const e of errors) {
    if (e.errorNode) nodeCounts.set(e.errorNode, (nodeCounts.get(e.errorNode) || 0) + 1);
  }
  for (const [node, count] of nodeCounts) {
    if (count >= 2) {
      out.push({
        level: 'warn',
        title: `Nó "${node}" falhou ${count}x`,
        detail: 'Mesmo nó quebrando repetidamente sugere problema estrutural, não erro pontual.',
        suggestion: `Abra o workflow no n8n, revise o nó "${node}" — conexão, credencial, ou parâmetro inválido.`,
      });
    }
  }

  if (out.length === 0) {
    out.push({
      level: 'ok',
      title: 'Tudo funcionando',
      detail: `n8n online, API autenticada${total > 0 ? `, ${total} execuções recentes sem falhas` : ''}.`,
      suggestion: 'Nenhuma ação necessária.',
    });
  }

  return out;
}
