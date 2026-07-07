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
 * Verifica se um código bipado corresponde ao código de fornecedor cadastrado.
 * Comparação é **estrita**: só casa se, após normalizar (uppercase + remover
 * pontuação/espaços + zeros à esquerda em códigos numéricos), os valores forem
 * IDÊNTICOS. Nenhum match parcial, contains ou sufixo é aceito — isso evitava
 * que "5969" (tecido) fosse confundido com "12485969" (motor).
 */
export function codigoBate(bipado: string | null | undefined, fornecedor: string | null | undefined): boolean {
  const a = normalizarCodigo(bipado);
  const b = normalizarCodigo(fornecedor);
  if (!a || !b) return false;
  return a === b;
}


