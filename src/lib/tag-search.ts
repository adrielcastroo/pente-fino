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
  if (escaped.includes('*')) {
    // Se o usuário digitou "*" no final, como "CORTINA*", tratamos como prefixo.
    // Se digitou no meio, como "CORTINA*CM", tratamos como "CORTINA%CM%".
    return escaped.replace(/\*/g, '%');
  }
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
    .filter((t) => t.length >= 1) // Mantém tokens de 1 caractere (ex: T, A, 1)
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
    // Se temos tokens, o filtro deve ser AND estrito entre ELES.
    // O 'padrao' é apenas uma forma diferente de expressar a mesma busca,
    // então se temos tokens (AND), ignoramos o 'padrao' (OR/Seq) para não trazer lixo.
    if (tokens.length > 0) {
      return tokens.every((t) => matchesIlike(nm, t));
    }
    // Fallback apenas para padrão único
    return padrao ? matchesIlike(nm, padrao) : true;
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
  // Se houver tokens, aplicamos AND (cada token precisa estar na coluna)
  if (tokens.length > 0) {
    for (const t of tokens) {
      if (t && t !== '%%') {
        q = q.ilike(col, t) as T;
      }
    }
    return q;
  }
  // Fallback para padrao único se não houver tokens
  if (padrao) q = q.ilike(col, padrao) as T;
  return q;
}

/** Combina `padrao` + `tokens` em uma única cláusula `or(...)` do PostgREST. */
export function ilikeOr(cols: string[], padrao: string, tokens: string[]): string {
  const parts: string[] = [];
  
  // Se houver tokens, a regra principal é AND entre eles, mas OR entre colunas para cada token.
  // PostgREST: (col1.ilike.%A%,col2.ilike.%A%),(col1.ilike.%B%,col2.ilike.%B%)
  if (tokens.length > 0) {
    return tokens.map(t => {
      const escapedToken = JSON.stringify(t);
      return `or(${cols.map(c => `${c}.ilike.${escapedToken}`).join(',')})`;
    }).join(',');
  }

  // Se não houver tokens, apenas o padrão simples em qualquer uma das colunas
  if (padrao) {
    const escapedPattern = JSON.stringify(padrao);
    return cols.map(c => `${c}.ilike.${escapedPattern}`).join(',');
  }
  
  return '';
}

/**
 * PROMPT PARA DESENVOLVIMENTO - CORREÇÃO DE FILTRAGEM NO BLOCO RESUMO
 * 
 * === INTRODUÇÃO ===
 * O módulo de busca do catálogo de configurações reproduz a experiência de filtros do 
 * SAP B1 usando o curinga “*” como coringa do usuário. O input é convertido em 
 * padrão ILIKE e em lista de tokens para busca AND (todas as palavras devem existir 
 * na descrição, em qualquer ordem). Atualmente, a interface está retornando registros 
 * que não contêm todas as palavras pesquisadas, indicando que a lógica de combinação 
 * entre padrão e tokens ou entre os próprios tokens está incorreta na consulta ou na 
 * renderização do resumo.
 *
 * === LÓGICA ===
 * 1. Entrada do usuário (ex: cortina*cm*35*liso*10*balance) é sanitizada e normalizada 
 *    (sem acentos, case-insensitive).
 * 2. Duas representações são geradas:
 *    - Padrão único via toIlikePattern: cortina%cm%35%liso%10%balance (ordem exata, opcional).
 *    - Lista de tokens via toIlikeTokens: [%cortina%, %cm%, %35%, %liso%, %10%, %balance%], 
 *      com corte em 12 itens e filtro de tokens vazios/inválidos (<2 chars).
 *
 * A consulta deve aplicar AND estrito entre tokens (cada token deve existir na coluna).
 * Não deve haver mistura com OR entre tokens, nem união (OR) entre resultados de padrão 
 * e tokens que viole a regra AND.
 *
 * === OBJETIVO ===
 * Corrigir o fluxo de busca para que o Resumo exiba exclusivamente configurações que 
 * contenham todas as palavras pesquisadas (cortina, cm, 35, liso, 10, balance), 
 * independentemente de ordem, respeitando o comportamento SAP B1 do curinga “*”.
 * 
 * === RESULTADO ESPERADO ===
 * - Busca por cortina*cm*35*liso*10*balance retorna apenas configurações contendo 
 *   todas essas palavras.
 * - Buscas com menos termos ou com curingas em posições variadas (*motor, t*42, cm35) 
 *   continuam funcionando com AND estrito quando múltiplos tokens estão presentes.
 * - O Resumo não exibe mais registros que faltem qualquer uma das palavras pesquisadas.
 */
