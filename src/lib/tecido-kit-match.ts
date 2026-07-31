/**
 * Reconhecimento do tecido base a partir do nome de um "Kit ... - Forro X".
 *
 * Premissa do negócio: cada kit é a versão do MESMO tecido, porém com forro
 * (dupla camada). Portanto o nome do kit contém os tokens significativos do
 * nome do tecido base (linha, composição e cor), acrescido do sufixo do forro.
 *
 * A comparação é feita por cobertura de tokens: quantos tokens relevantes do
 * kit aparecem no nome do tecido. Ruídos comerciais (largura, lote, siglas de
 * embalagem, datas) são descartados para não penalizar o score.
 */

export interface ItemNome {
  codigo: string;
  descricao: string;
}

export interface MatchCandidato {
  codigo: string;
  descricao: string;
  /** 0..1 — proporção dos tokens do kit encontrados no tecido. */
  score: number;
  tokensEncontrados: string[];
  tokensFaltantes: string[];
}

/** Tokens que não agregam identidade ao produto e são removidos dos dois lados. */
const STOPWORDS = new Set([
  'kit', 'tecido', 'tecid', 'tec', 'cort', 'cortina', 'cortinas', 'de', 'do', 'da',
  'para', 'com', 'sem', 'cor', 'tbg', 'excel', 'lote', 'un', 'ml', 'mt', 'mts',
  'largura', 'larg', 'pc', 'cp', 'ac', 'pm', 'pf', 'qass', 'qafl', 'sb',
]);

/** Remove acentos, separadores e pontuação, devolvendo tokens minúsculos. */
export function tokenizar(valor: string): string[] {
  const base = (valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[_/\\.,;:()\[\]{}+]/g, ' ')
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return base
    .split(' ')
    .map((t) => t.trim())
    .filter(Boolean)
    .filter((t) => !STOPWORDS.has(t))
    // larguras e medidas: 2,8l / 3l / 3,00l / 2.80m
    .filter((t) => !/^\d+([,.]\d+)?\s*(l|m|mm|cm)$/.test(t))
    // datas comerciais: 05/25 → já virou "05 25" — descarta números soltos de 2 dígitos
    .filter((t) => !/^\d{1,2}$/.test(t))
    // códigos internos que aparecem no meio da descrição
    .filter((t) => !/^\d{4,}$/.test(t))
    .filter((t) => t.length > 1 || /^\d$/.test(t) === false);
}

/** Separa o nome do kit em "núcleo do tecido" e "forro". */
export function separarKit(descricaoKit: string): { nucleo: string; forro: string | null } {
  const raw = (descricaoKit || '').trim();
  const idx = raw.toLowerCase().search(/-\s*forro/);
  if (idx === -1) return { nucleo: raw.replace(/^kit\s+/i, '').trim(), forro: null };
  return {
    nucleo: raw.slice(0, idx).replace(/^kit\s+/i, '').trim(),
    forro: raw.slice(idx).replace(/^-\s*/, '').trim(),
  };
}

/** Verdadeiro quando a descrição representa um kit com forro / dupla camada. */
export function isKitComForro(item: ItemNome): boolean {
  const cod = (item.codigo || '').toUpperCase();
  const desc = (item.descricao || '').toLowerCase();
  if (cod.startsWith('KTEC')) return true;
  return desc.startsWith('kit') && /forro|dupla camada/.test(desc);
}

/**
 * Pontua um tecido candidato contra o núcleo do kit.
 * Retorna 0..1 (cobertura dos tokens do kit dentro do tecido).
 */
export function pontuar(tokensKit: string[], descricaoTecido: string): MatchCandidato['score'] {
  if (tokensKit.length === 0) return 0;
  const tokensTecido = new Set(tokenizar(descricaoTecido));
  let hits = 0;
  for (const t of tokensKit) if (tokensTecido.has(t)) hits += 1;
  return hits / tokensKit.length;
}

/**
 * Encontra os melhores tecidos base para um kit.
 * Agrupa por código: cada código concorre com a sua melhor descrição.
 */
export function sugerirTecidos(
  kit: ItemNome,
  tecidos: ItemNome[],
  limite = 5,
): MatchCandidato[] {
  const { nucleo } = separarKit(kit.descricao);
  const tokensKit = tokenizar(nucleo);
  if (tokensKit.length === 0) return [];

  const melhorPorCodigo = new Map<string, MatchCandidato>();

  for (const tecido of tecidos) {
    if (!tecido.codigo) continue;
    if (isKitComForro(tecido)) continue;
    const score = pontuar(tokensKit, tecido.descricao);
    if (score <= 0) continue;

    const tokensTecido = new Set(tokenizar(tecido.descricao));
    const candidato: MatchCandidato = {
      codigo: tecido.codigo,
      descricao: tecido.descricao,
      score,
      tokensEncontrados: tokensKit.filter((t) => tokensTecido.has(t)),
      tokensFaltantes: tokensKit.filter((t) => !tokensTecido.has(t)),
    };

    const atual = melhorPorCodigo.get(tecido.codigo);
    if (!atual || candidato.score > atual.score) melhorPorCodigo.set(tecido.codigo, candidato);
  }

  return Array.from(melhorPorCodigo.values())
    .sort((a, b) => b.score - a.score || a.descricao.length - b.descricao.length)
    .slice(0, limite);
}

/** Score mínimo para considerar o vínculo automático confiável. */
export const SCORE_AUTO = 0.85;
