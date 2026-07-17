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
  unidade: [
    'unidade', 'un', 'um', 'unid', 'unidade_medida', 'unidade de medida',
    'medida', 'u.m.',
  ],
  pacote_fornecedor: [
    'pacote_fornecedor', 'pacote fornecedor', 'qtd_fornecedor', 'qtd fornecedor',
    'emb_fornecedor', 'embalagem fornecedor', 'embalagem_fornecedor',
    'qtd por pacote fornecedor', 'pacote padrao', 'pacote padrão',
  ],
  pacote_estocagem: [
    'pacote_estocagem', 'pacote estocagem', 'qtd_estocagem', 'qtd estocagem',
    'emb_estoque', 'embalagem estoque', 'embalagem_estoque',
    'qtd por pacote estoque', 'pacote interno', 'estoque',
  ],
};

function parseNumeric(raw: unknown): number | null {
  if (raw == null || raw === '') return null;
  const s = String(raw).trim().replace(/\./g, '').replace(',', '.');
  const n = Number(s);
  return Number.isFinite(n) && n > 0 ? n : null;
}

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
    const kUnidade = findKey(headers, HEADER_ALIASES.unidade);
    const kPacoteForn = findKey(headers, HEADER_ALIASES.pacote_fornecedor);
    const kPacoteEst = findKey(headers, HEADER_ALIASES.pacote_estocagem);

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
      const unidade = kUnidade
        ? String(r[kUnidade] ?? '').trim().toUpperCase() || null
        : null;
      const pacote_fornecedor = kPacoteForn ? parseNumeric(r[kPacoteForn]) : null;
      const pacote_estocagem = kPacoteEst ? parseNumeric(r[kPacoteEst]) : null;
      const existing = byInterno.get(codigo_interno);
      if (existing) {
        existing.codigos_fornecedor = dedupeCodes([...existing.codigos_fornecedor, ...codigos]);
        if (!existing.descricao && descricao) existing.descricao = descricao;
        if (!existing.unidade && unidade) existing.unidade = unidade;
        if (existing.pacote_fornecedor == null && pacote_fornecedor != null) existing.pacote_fornecedor = pacote_fornecedor;
        if (existing.pacote_estocagem == null && pacote_estocagem != null) existing.pacote_estocagem = pacote_estocagem;
      } else {
        byInterno.set(codigo_interno, {
          codigo_interno,
          descricao,
          codigos_fornecedor: dedupeCodes(codigos),
          unidade,
          pacote_fornecedor,
          pacote_estocagem,
          detectado: false,
        });
      }
    }
    (self as any).postMessage({ ok: true, rows: Array.from(byInterno.values()), ignoradas });
  } catch (e: any) {
    (self as any).postMessage({ ok: false, error: e?.message || String(e) });
  }
};
