/// <reference lib="webworker" />
import * as XLSX from 'xlsx';

const HEADER_ALIASES: Record<string, string[]> = {
  codigo_interno: [
    'codigo_interno', 'codigo interno', 'cod interno', 'codigo', 'cod', 'sku',
    'n do item', 'no do item', 'numero do item', 'num do item', 'item',
    'n item', 'no item', 'numero item',
  ],
  descricao: [
    'descricao', 'descrição', 'descricao_completa', 'descrição do item',
    'descricao do item', 'descricao completa', 'descricao do produto', 'produto',
  ],
  codigo_fornecedor: [
    'codigo_fornecedor', 'codigo fornecedor', 'cod fornecedor', 'codigo do fornecedor',
    'codigos_fornecedor', 'codigos fornecedor', 'referencia', 'referência', 'ref',
  ],
};

const norm = (s: string) =>
  (s || '')
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

function findKey(headers: string[], aliases: string[]): string | null {
  const wanted = new Set(aliases.map(norm));
  for (const h of headers) if (wanted.has(norm(h))) return h;
  return null;
}

function splitCodes(raw: string): string[] {
  if (!raw) return [];
  return raw.split(/[;|,/]+/).map((s) => s.trim()).filter(Boolean);
}

function normalizarCodigo(c: string): string {
  return (c || '').toString().trim().toUpperCase().replace(/\s+/g, '');
}

function dedupeCodes(list: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const c of list) {
    const n = normalizarCodigo(c);
    if (!n || seen.has(n)) continue;
    seen.add(n);
    out.push(c);
  }
  return out;
}

self.onmessage = async (ev: MessageEvent<{ buffer: ArrayBuffer }>) => {
  try {
    const wb = XLSX.read(ev.data.buffer, { type: 'array' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const json: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

    if (!json.length) {
      (self as any).postMessage({ ok: true, rows: [], ignoradas: 0 });
      return;
    }

    const headers = Array.from(new Set(json.slice(0, 20).flatMap((r) => Object.keys(r))));
    const kInterno = findKey(headers, HEADER_ALIASES.codigo_interno);
    const kDesc = findKey(headers, HEADER_ALIASES.descricao);
    const kForn = findKey(headers, HEADER_ALIASES.codigo_fornecedor);

    if (!kInterno) {
      (self as any).postMessage({ ok: false, error: 'Planilha precisa ter ao menos a coluna: codigo_interno' });
      return;
    }

    const byInterno = new Map<string, any>();
    let ignoradas = 0;
    for (const r of json) {
      const codigo_interno = String(r[kInterno] ?? '').trim();
      if (!codigo_interno) { ignoradas++; continue; }
      const descricao = kDesc ? String(r[kDesc] ?? '').trim() : '';
      const fornRaw = kForn ? String(r[kForn] ?? '').trim() : '';
      const codigos = splitCodes(fornRaw);
      const existing = byInterno.get(codigo_interno);
      if (existing) {
        existing.codigos_fornecedor = dedupeCodes([...existing.codigos_fornecedor, ...codigos]);
        if (!existing.descricao && descricao) existing.descricao = descricao;
      } else {
        byInterno.set(codigo_interno, {
          codigo_interno,
          descricao,
          codigos_fornecedor: dedupeCodes(codigos),
          detectado: false,
        });
      }
    }
    (self as any).postMessage({ ok: true, rows: Array.from(byInterno.values()), ignoradas });
  } catch (e: any) {
    (self as any).postMessage({ ok: false, error: e?.message || String(e) });
  }
};
