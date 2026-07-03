/**
 * Extração e normalização do "código do fornecedor" embutido em descrições de itens.
 *
 * O código pode aparecer de várias formas:
 *  - Entre parênteses: "(RF-BASIC-BO-03-0)", "(3001-05-250)", "(1800492)"
 *  - Token alfanumérico colado: "YM4202", "RF-MOMBASSA5600"
 *  - Sequência numérica longa ao final
 */

const BLACKLIST = new Set([
  'PCT', 'PCT1', 'PCT2', 'NF', 'NFE', 'RR', 'M2', 'ML', 'CX', 'CX01', 'CX02',
  'TV', 'T.V.', 'RNP', 'SKU', 'LOTE', 'SERIE', 'DATA', 'QTD', 'COD',
  'A', 'B', 'C', 'D', 'E',
]);

/**
 * Normaliza um código para comparação: uppercase + remove tudo que não é alfanumérico.
 */
export function normalizarCodigo(value: string | null | undefined): string {
  if (!value) return '';
  const clean = String(value).toUpperCase().replace(/[^A-Z0-9]/g, '');
  // Códigos puramente numéricos (ex.: "002.001.004.001.119" e "2.001.004.001.119")
  // são equivalentes ignorando zeros à esquerda.
  if (/^\d+$/.test(clean)) return clean.replace(/^0+/, '') || '0';
  return clean;
}

function isValidCandidate(candidate: string): boolean {
  if (!candidate) return false;
  const norm = candidate.toUpperCase().trim();
  if (norm.length < 3) return false;
  if (BLACKLIST.has(norm)) return false;
  // Deve conter ao menos um dígito ou ter pelo menos 4 caracteres alfa
  const hasDigit = /\d/.test(norm);
  const hasLetter = /[A-Z]/.test(norm);
  if (!hasDigit && !hasLetter) return false;
  // Códigos puramente numéricos: precisam ter >= 3 dígitos
  if (!hasLetter && norm.length < 3) return false;
  return true;
}

/**
 * Tenta extrair o código do fornecedor de uma descrição livre.
 * Retorna { codigo, normalizado } ou null se nada plausível foi encontrado.
 */
export function extractCodigoFornecedor(descricao: string | null | undefined): {
  codigo: string;
  normalizado: string;
} | null {
  if (!descricao) return null;
  const text = String(descricao).toUpperCase();

  // 1. Entre parênteses (primeiro match razoável)
  const parenMatches = text.matchAll(/\(([A-Z0-9][A-Z0-9\-\/\.\s]{2,})\)/g);
  for (const m of parenMatches) {
    const raw = m[1].trim().replace(/\s+/g, '');
    if (isValidCandidate(raw)) {
      return { codigo: raw, normalizado: normalizarCodigo(raw) };
    }
  }

  // 2. Token alfanumérico com letras + dígitos colados (com hífens opcionais)
  const tokenMatches = text.matchAll(/\b([A-Z]{2,}[A-Z0-9\-]*\d+[A-Z0-9\-]*)\b/g);
  for (const m of tokenMatches) {
    const raw = m[1].trim();
    if (isValidCandidate(raw)) {
      return { codigo: raw, normalizado: normalizarCodigo(raw) };
    }
  }

  // 3. Última sequência numérica longa (>= 6 dígitos)
  const numMatches = [...text.matchAll(/\b(\d{6,})\b/g)];
  if (numMatches.length > 0) {
    const raw = numMatches[numMatches.length - 1][1];
    return { codigo: raw, normalizado: normalizarCodigo(raw) };
  }

  return null;
}

/**
 * Verifica se um código bipado corresponde ao código fornecedor cadastrado.
 * Comparação é case-insensitive e ignora pontuação/espaços.
 * Também aceita:
 *  - match parcial (um contém o outro) para tolerar prefixos/sufixos.
 *  - sufixo numérico curto (2–4 dígitos) no bipado representando largura embutida
 *    pelo fornecedor (ex.: "RF-MOMBASSA-5600-200" casa com "RF-MOMBASSA-5600").
 *    O sufixo é descartado apenas para fins de match — não é usado em cálculo.
 */
export function codigoBate(bipado: string | null | undefined, fornecedor: string | null | undefined): boolean {
  const a = normalizarCodigo(bipado);
  const b = normalizarCodigo(fornecedor);
  if (!a || !b) return false;
  if (a === b) return true;
  // Tolerância: um contém o outro (útil quando bipam o código + sufixo)
  if (a.length >= 4 && b.length >= 4) {
    if (a.includes(b) || b.includes(a)) return true;
  }
  // Tolerância: bipado tem sufixo numérico curto (2-4 dígitos) que pode ser largura.
  // Remove esse sufixo e tenta novamente contains.
  const stripped = a.replace(/\d{2,4}$/, '');
  if (stripped && stripped !== a && stripped.length >= 4 && b.length >= 4) {
    if (stripped === b) return true;
    if (stripped.includes(b) || b.includes(stripped)) return true;
  }
  return false;
}

