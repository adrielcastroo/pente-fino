import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

/**
 * Comparação entre duas planilhas (snapshots) da Análise de Saldo Baixo.
 *
 * A chave de comparação é a coluna 02 (código do item no Auge), que é a única
 * estável entre execuções. Uma linha é considerada "alterada" quando qualquer
 * célula difere da versão anterior — as células divergentes são registradas
 * para destaque na UI e na exportação.
 */

export type DiffStatus = 'novo' | 'alterado' | 'removido' | 'igual';

export interface DiffRow {
  key: string;
  status: DiffStatus;
  /** Linha atual (para "removido" é a linha da planilha anterior). */
  row: string[];
  anterior?: string[];
  /** Índices (0-based) das colunas que mudaram. */
  alteradas: number[];
}

export interface DiffResult {
  columns: string[];
  rows: DiffRow[];
  totais: Record<DiffStatus, number>;
}

/** 
 * Mapeamento das colunas solicitadas para o Módulo Compras:
 * 1. Disponibilidade (Pos 12 no Auge)
 * 2. Duração em dias (Pos 23 no Auge)
 * 3. Consumo Médio (Pos 16 no Auge)
 * 4. Quantidade em Estoque (Pos 10 no Auge)
 * 5. Quantidade de Saída (Pos 15 no Auge)
 */
export const COMPRAS_METRICS_COLS = [10, 12, 15, 16, 23];

/** Coluna usada como chave (1-based, como no painel do Auge). */
export const DIFF_KEY_COL = 2;

const cell = (row: string[], i: number) => String(row?.[i] ?? '').trim();

function buildIndex(rows: string[][], keyIdx: number): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const r of rows) {
    const k = cell(r, keyIdx);
    if (!k) continue;
    if (!map.has(k)) map.set(k, r);
  }
  return map;
}

export function diffSnapshots(
  atual: { columns: string[]; rows: string[][] },
  anterior: { columns: string[]; rows: string[][] } | null,
  keyCol: number = DIFF_KEY_COL,
): DiffResult {
  const columns = atual.columns.length ? atual.columns : (anterior?.columns ?? []);
  const keyIdx = Math.max(0, keyCol - 1);
  const totais: Record<DiffStatus, number> = { novo: 0, alterado: 0, removido: 0, igual: 0 };

  if (!anterior) {
    const rows: DiffRow[] = atual.rows.map((r) => ({
      key: cell(r, keyIdx),
      status: 'novo' as const,
      row: r,
      alteradas: [],
    }));
    totais.novo = rows.length;
    return { columns, rows, totais };
  }

  const prev = buildIndex(anterior.rows, keyIdx);
  const rows: DiffRow[] = [];

  for (const r of atual.rows) {
    const k = cell(r, keyIdx);
    const before = prev.get(k);
    if (!before) {
      rows.push({ key: k, status: 'novo', row: r, alteradas: [] });
      totais.novo += 1;
      continue;
    }
    const width = Math.max(r.length, before.length, columns.length);
    const alteradas: number[] = [];
    for (let i = 0; i < width; i += 1) {
      if (i === keyIdx) continue;
      if (cell(r, i) !== cell(before, i)) alteradas.push(i);
    }
    if (alteradas.length) {
      rows.push({ key: k, status: 'alterado', row: r, anterior: before, alteradas });
      totais.alterado += 1;
    } else {
      rows.push({ key: k, status: 'igual', row: r, anterior: before, alteradas: [] });
      totais.igual += 1;
    }
  }

  const atualKeys = new Set(atual.rows.map((r) => cell(r, keyIdx)));
  for (const [k, r] of prev) {
    if (!atualKeys.has(k)) {
      rows.push({ key: k, status: 'removido', row: r, alteradas: [] });
      totais.removido += 1;
    }
  }

  return { columns, rows, totais };
}

export const DIFF_LABELS: Record<DiffStatus | 'todos', string> = {
  todos: 'Todos',
  novo: 'Novos',
  alterado: 'Alterados',
  removido: 'Removidos',
  igual: 'Sem alteração',
};

const AUTO_WIDTH = (columns: string[], rows: string[][]) =>
  columns.map((c, i) => {
    const max = rows.reduce((m, r) => Math.max(m, String(r?.[i] ?? '').length), c.length);
    return { wch: Math.min(60, Math.max(10, max + 2)) };
  });

/** Exporta uma planilha formatada de um snapshot. */
export function exportSnapshotXLSX(
  snapshot: { columns: string[]; rows: string[][]; referencia?: string },
  fileName?: string,
) {
  const aoa = [snapshot.columns, ...snapshot.rows];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!cols'] = AUTO_WIDTH(snapshot.columns, snapshot.rows);
  ws['!autofilter'] = {
    ref: XLSX.utils.encode_range({
      s: { r: 0, c: 0 },
      e: { r: Math.max(1, snapshot.rows.length), c: Math.max(0, snapshot.columns.length - 1) },
    }),
  };
  ws['!freeze'] = { xSplit: 0, ySplit: 1 };
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Saldo Baixo');
  const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  saveAs(
    new Blob([out], { type: 'application/octet-stream' }),
    fileName ?? `saldo-baixo-${snapshot.referencia ?? new Date().toISOString().slice(0, 10)}.xlsx`,
  );
}

/** Exporta a comparação com a coluna "Situação" na frente. */
export function exportDiffXLSX(diff: DiffResult, fileName?: string) {
  const columns = ['Situação', 'Colunas alteradas', ...diff.columns];
  const rows = diff.rows.map((d) => [
    DIFF_LABELS[d.status],
    d.alteradas.map((i) => diff.columns[i] ?? `Col ${i + 1}`).join(', '),
    ...diff.columns.map((_, i) => d.row?.[i] ?? ''),
  ]);
  exportSnapshotXLSX({ columns, rows }, fileName ?? `saldo-baixo-comparacao-${new Date().toISOString().slice(0, 10)}.xlsx`);
}
