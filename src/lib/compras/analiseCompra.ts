import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

/**
 * Análise de Compra (Gerador de Consultas do Auge).
 *
 * O Auge expõe a consulta "Análise de compra V5 - HANA" através de
 * `modTI/gerirConsulta.php`. O resultado vem como uma matriz genérica (pode ser
 * array de objetos ou array de arrays), então normalizamos tudo para
 * `{ columns, rows }` antes de aplicar qualquer regra de negócio.
 *
 * Os filtros são descritos pelo usuário por POSIÇÃO de coluna (02, 08, 12, 16,
 * 23), exatamente como aparecem no painel "Filtrar" do Auge. Por isso o motor
 * de filtro trabalha com índice 1-based.
 */

export type FilterOp = 'contains' | 'not_contains' | 'gt' | 'lt' | 'gte' | 'lte' | 'eq';

export interface ColumnFilter {
  /** Posição da coluna no Auge (1-based), ex.: 2, 8, 12, 16, 23. */
  col: number;
  op: FilterOp;
  value: string;
}

export interface FilterPreset {
  key: string;
  label: string;
  descricao: string;
  filtros: ColumnFilter[];
}

/** Presets exatamente como configurados no Auge pelo time de Compras. */
export const ANALISE_COMPRA_PRESETS: FilterPreset[] = [
  {
    key: 'geral',
    label: 'Geral',
    descricao: '02 contém "F" · 08 não contém "ml}a" · 16 > 0 · 23 < 15',
    filtros: [
      { col: 2, op: 'contains', value: 'F' },
      { col: 8, op: 'not_contains', value: 'ml}a' },
      { col: 16, op: 'gt', value: '0' },
      { col: 23, op: 'lt', value: '15' },
    ],
  },
  {
    key: 'tecido',
    label: 'Tecido',
    descricao: '02 contém "F" · 08 contém "tecido" · 12 < 30',
    filtros: [
      { col: 2, op: 'contains', value: 'F' },
      { col: 8, op: 'contains', value: 'tecido' },
      { col: 12, op: 'lt', value: '30' },
    ],
  },
  {
    key: 'siplan',
    label: 'Siplan',
    descricao: '02 contém "F1286" · 08 não contém "Pergola" · 23 < 120',
    filtros: [
      { col: 2, op: 'contains', value: 'F1286' },
      { col: 8, op: 'not_contains', value: 'Pergola' },
      { col: 23, op: 'lt', value: '120' },
    ],
  },
  {
    key: 'lamina',
    label: 'Lâmina',
    descricao: '02 contém "F" · 08 contém "Lam." · 12 < 300 · 16 > 0',
    filtros: [
      { col: 2, op: 'contains', value: 'F' },
      { col: 8, op: 'contains', value: 'Lam.' },
      { col: 12, op: 'lt', value: '300' },
      { col: 16, op: 'gt', value: '0' },
    ],
  },
];

export interface NormalizedResult {
  columns: string[];
  rows: string[][];
}

const asArray = (v: unknown): any[] => (Array.isArray(v) ? v : []);

/**
 * Extrai `{ columns, rows }` de qualquer um dos formatos que o Auge devolve.
 * Nunca lança: em caso de formato desconhecido retorna listas vazias para que a
 * UI possa exibir o payload bruto e permitir diagnóstico.
 */
export function normalizeConsulta(payload: any): NormalizedResult {
  const resultado = payload?.resultado ?? payload;
  if (!resultado) return { columns: [], rows: [] };

  // 1) Colunas declaradas explicitamente pelo backend, quando existirem.
  const declared: string[] = asArray(
    resultado.columns ?? resultado.colunas ?? resultado.header ?? resultado.campos,
  ).map((c: any) =>
    typeof c === 'string' ? c : String(c?.title ?? c?.nome ?? c?.label ?? c?.campo ?? ''),
  ).filter(Boolean);

  const data = asArray(
    resultado.data ?? resultado.aaData ?? resultado.rows ?? resultado.registros ?? resultado,
  );
  if (!data.length) return { columns: declared, rows: [] };

  const first = data[0];

  // 2) Array de arrays.
  if (Array.isArray(first)) {
    const width = data.reduce((m: number, r: any[]) => Math.max(m, r.length), 0);
    const columns = declared.length >= width
      ? declared.slice(0, width)
      : Array.from({ length: width }, (_, i) => declared[i] ?? `Coluna ${String(i + 1).padStart(2, '0')}`);
    return {
      columns,
      rows: data.map((r: any[]) =>
        Array.from({ length: width }, (_, i) => (r[i] == null ? '' : String(r[i]))),
      ),
    };
  }

  // 3) Array de objetos — preserva a ordem das chaves do primeiro registro.
  if (first && typeof first === 'object') {
    const keys: string[] = [];
    for (const row of data.slice(0, 50)) {
      for (const k of Object.keys(row ?? {})) if (!keys.includes(k)) keys.push(k);
    }
    return {
      columns: keys,
      rows: data.map((r: any) => keys.map((k) => (r?.[k] == null ? '' : String(r[k])))),
    };
  }

  return { columns: declared, rows: [] };
}

const stripAccents = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const norm = (s: string) => stripAccents(String(s ?? '')).toLowerCase().trim();

/**
 * Converte texto no padrão BR ("1.234,56") ou US ("1234.56") para número.
 * Retorna `null` quando não há número reconhecível.
 */
export function parseNumberBR(raw: string): number | null {
  if (raw == null) return null;
  let s = String(raw).replace(/[^\d.,\-]/g, '').trim();
  if (!s) return null;
  const lastComma = s.lastIndexOf(',');
  const lastDot = s.lastIndexOf('.');
  if (lastComma > -1 && lastComma > lastDot) {
    s = s.replace(/\./g, '').replace(',', '.');
  } else if (lastComma > -1 && lastDot === -1) {
    s = s.replace(',', '.');
  } else {
    s = s.replace(/,/g, '');
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function matchFilter(cell: string, f: ColumnFilter): boolean {
  switch (f.op) {
    case 'contains':
      return norm(cell).includes(norm(f.value));
    case 'not_contains':
      return !norm(cell).includes(norm(f.value));
    default: {
      const a = parseNumberBR(cell);
      const b = parseNumberBR(f.value);
      if (a == null || b == null) return false;
      if (f.op === 'gt') return a > b;
      if (f.op === 'lt') return a < b;
      if (f.op === 'gte') return a >= b;
      if (f.op === 'lte') return a <= b;
      return a === b;
    }
  }
}

/** Aplica todos os filtros em AND, ignorando colunas fora do intervalo. */
export function applyFilters(rows: string[][], filtros: ColumnFilter[]): string[][] {
  if (!filtros.length) return rows;
  return rows.filter((row) =>
    filtros.every((f) => {
      const idx = f.col - 1;
      if (idx < 0 || idx >= row.length) return false;
      return matchFilter(row[idx] ?? '', f);
    }),
  );
}

export const OP_LABELS: Record<FilterOp, string> = {
  contains: 'contém',
  not_contains: 'não contém',
  gt: 'maior que',
  lt: 'menor que',
  gte: 'maior ou igual',
  lte: 'menor ou igual',
  eq: 'igual a',
};

export interface ExportBlock {
  label: string;
  columns: string[];
  rows: string[][];
}

/** Exporta um XLSX com um bloco por preset, separados por linha em branco. */
export function exportAnaliseCompraXLSX(blocks: ExportBlock[], fileName?: string) {
  const aoa: (string | number)[][] = [];
  for (const b of blocks) {
    aoa.push([b.label]);
    aoa.push(b.columns);
    for (const r of b.rows) aoa.push(r);
    aoa.push([]);
  }
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const width = blocks.reduce((m, b) => Math.max(m, b.columns.length), 0);
  ws['!cols'] = Array.from({ length: width }, (_, i) => ({ wch: i === 2 ? 60 : 18 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Analise de Compra');
  const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const stamp = new Date().toISOString().slice(0, 10);
  saveAs(
    new Blob([out], { type: 'application/octet-stream' }),
    fileName ?? `analise-compra-${stamp}.xlsx`,
  );
}
