/**
 * Helpers de busca de TAGs / Configurações.
 *
 * Concentram a tokenização, normalização e construção de cláusulas ILIKE usadas
 * por ConfiguracaoSelect e pela busca por palavras-chave do GerarTagTab.
 *
 * O comportamento visa reproduzir o curinga do SAP B1:
 *   - "TERMO"         → %TERMO%   (substring, ignorando acentos/case)
 *   - "T*42"          → T%42      (coringa literal à esquerda)
 *   - "*MOTOR"        → %MOTOR
 *   - "Cortina*CM*35" → Cortina%CM%35
 *
 * Em paralelo, o termo é quebrado em TOKENS para busca por AND (ordem livre):
 *   - "Cortina CM 35"        → ["%cortina%", "%cm%", "%35%"]
 *   - "Cortina*CM*35*Liso*10"→ ["%cortina%", "%cm%", "%35%", "%liso%", "%10%"]
 */

export interface WeightedToken {
  token: string;
  weight: number;
  structural: boolean;
}

const STRUCTURAL_PATTERNS: Array<{ re: RegExp; weight: number; label: string }> = [
  { re: /^(rollo|shadow|diamond|romana|celular|wanza|b2h|rollo_light|shadow_light|cortina|persiana)$/i, weight: 8, label: 'tipo' },
  { re: /^t\d{2,3}$/i, weight: 6, label: 'tubo' },
  { re: /^(cm[-_]?\d+|st\d+|lsn\d+|alt\d+)$/i, weight: 5, label: 'motor' },
  { re: /^(110v|220v|bateria|pilha)$/i, weight: 3, label: 'tensão' },
  { re: /^(rf|auto|manual|monocontrole|basic|wifi|zigbee)$/i, weight: 2, label: 'controle' },
  { re: /^(abs2|abs20|absolute|basic|sky|day|night|semi|open|standard|nivelador|square|round|fascia|blackout|translúcido|dimout|balance)$/i, weight: 2, label: 'opção' },
  { re: /^(branco|branca|preto|preta|bege|bronze|cinza|grafite|marrom|azul|verde|offwhite)$/i, weight: 2, label: 'cor' },
];

const SEPARATORS = /[\s_\-/.,;:()[\]]+/;

/** Normalização usada nas comparações por palavra-chave. */
export function normKey(s: string): string {
  return (s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** Quebra o input em tokens (sem acentos, sem símbolos). */
export function tokenize(input: string): string[] {
  if (!input) return [];
  return normKey(input)
    .split(SEPARATORS)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2);
}

export function uniqTokens(list: string[]): string[] {
  return Array.from(new Set(list));
}

/** Atribui peso estrutural a cada token (tubo, motor, cor...). */
export function weightTokens(tokens: string[]): WeightedToken[] {
  return tokens.map((t) => {
    const norm = t.replace(/\./g, '');
    for (const p of STRUCTURAL_PATTERNS) {
      if (p.re.test(norm)) return { token: norm, weight: p.weight, structural: true };
    }
    return { token: norm, weight: 1, structural: false };
  });
}

/** Palavras-chave ordenadas da mais para a menos relevante. */
export function extrairPalavras(input: string): WeightedToken[] {
  const raw = uniqTokens(tokenize(input));
  return weightTokens(raw).sort((a, b) => b.weight - a.weight || a.token.localeCompare(b.token));
}

/** Remove caracteres perigosos para a cláusula PostgREST. */
export function sanitizeTerm(raw: string): string {
  return (raw ?? '').replace(/[,()"'\\]/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Constrói o padrão ILIKE único usado para a busca "ordenada" (SAP B1 clássico).
 *
 *   "TUB*"        → "TUB%"
 *   "*MOTOR"      → "%MOTOR"
 *   "T*42"        → "T%42"
 *   "MOTOR"       → "%MOTOR%"
 */
export function toIlikePattern(raw: string): string {
  const clean = sanitizeTerm(raw);
  if (!clean) return '';
  const escaped = clean.replace(/%/g, ' ').replace(/\s+/g, ' ').trim();
  if (escaped.includes('*')) return escaped.replace(/\*/g, '%');
  return `%${escaped}%`;
}

/**
 * Quebra o termo em TOKENS para busca AND (cada token precisa existir na
 * configuração, em qualquer ordem). Evita falhas quando o usuário digita a
 * descrição com espaçamento/ordem diferente do cadastro no Auge.
 *
 *   "Cortina*CM*35*Liso*10*" → ["%cortina%", "%cm%", "%35%", "%liso%", "%10%"]
 */
export function toIlikeTokens(raw: string): string[] {
  const clean = sanitizeTerm(raw).replace(/%/g, ' ');
  return clean
    .split(/[\s*]+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 1)
    .slice(0, 12)
    .map((t) => `%${t}%`);
}

/** Junta `padrao` + `tokens` em uma string estável (chave de cache do React Query). */
export function ilikeCacheKey(padrao: string, tokens: string[]): string {
  return `${padrao}|${tokens.join('~')}`;
}

/**
 * Valida se `text` casa com `padrao` ILIKE do Postgres no lado do cliente.
 *
 * Útil quando a fonte de dados já está em memória (catálogo local de
 * configurações) e queremos evitar um round-trip ao banco. Converte `%termo%`
 * para regex com `.*` e escapa os demais metacaracteres. Normaliza acentos.
 */
export function matchesIlike(text: string, pattern: string): boolean {
  if (!pattern) return true;
  const normText = (text || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const normPattern = (pattern || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const escaped = normPattern
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
    .replace(/[%*]/g, '.*');
  const regex = new RegExp(`^${escaped}$`, 'i');
  return regex.test(normText);
}

/** Filtra uma lista em memória aplicando a mesma lógica do ConfiguracaoSelect. */
export function filtrarPorIlike<T extends { nm_configuracao?: string | null }>(
  rows: T[],
  padrao: string,
  tokens: string[],
): T[] {
  if (!padrao && tokens.length === 0) return rows;
  return rows.filter((r) => {
    const nm = r.nm_configuracao ?? '';
    if (padrao && matchesIlike(nm, padrao)) return true;
    if (tokens.length > 0 && tokens.every((t) => matchesIlike(nm, t))) return true;
    return false;
  });
}

/** Ranking simples por relevância para ordenar os resultados no cliente. */
export function rankByRelevance<T extends { nm_configuracao?: string | null }>(
  rows: T[],
  termo: string,
): Array<{ cfg: T; score: number }> {
  const nm = termo.toLowerCase();
  const tokens = nm.split(/[\s*]+/).filter((t) => t.length > 0);
  return rows
    .map((cfg) => {
      const text = (cfg.nm_configuracao ?? '').toLowerCase();
      let score = 0;
      for (const t of tokens) {
        if (text === t) score += 10;
        else if (text.startsWith(t)) score += 5;
        else if (text.includes(t)) score += 2;
      }
      return { cfg, score };
    })
    .sort((a, b) => b.score - a.score || (a.cfg.nm_configuracao ?? '').localeCompare(b.cfg.nm_configuracao ?? '', 'pt-BR'));
}

/** Builder chainable mínimo aceito pelos helpers (Supabase JS e similares). */
export interface IlikeBuilder {
  ilike(col: string, val: string): IlikeBuilder;
  limit(n: number): IlikeBuilder;
  order(col: string, opts?: { ascending?: boolean }): IlikeBuilder;
  range(from: number, to: number): IlikeBuilder;
  in(col: string, vals: readonly unknown[]): IlikeBuilder;
  or(clause: string): IlikeBuilder;
  eq(col: string, val: unknown): IlikeBuilder;
  neq(col: string, val: unknown): IlikeBuilder;
  select(cols?: string): IlikeBuilder;
  [k: string]: unknown;
}

/**
 * Aplica `padrao` + `tokens` sobre uma coluna usando ILIKE do Postgres
 * (`.ilike`) e retorna o builder pronto para `await`.
 *
 *   const { data } = await ilikeAnd(query, 'nm_configuracao', padrao, tokens);
 */
export function ilikeAnd<T extends IlikeBuilder>(query: T, col: string, padrao: string, tokens: string[]): T {
  let q: T = query;
  if (padrao) q = q.ilike(col, padrao) as T;
  for (const t of tokens) q = q.ilike(col, t) as T;
  return q;
}

/** Combina `padrao` + `tokens` em uma única cláusula `or(...)` do PostgREST. */
export function ilikeOr(cols: string[], padrao: string, tokens: string[]): string {
  const parts: string[] = [];
  for (const c of cols) {
    if (padrao) parts.push(`${c}.ilike.${JSON.stringify(padrao)}`);
    for (const t of tokens) parts.push(`${c}.ilike.${JSON.stringify(t)}`);
  }
  return parts.join(',');
}
