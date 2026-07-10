// Exportação XLSX de Romaneios Starcolor.
// Replica o template do usuário: cabeçalho "ROMANEIO DE ENTREGA - UNILUX",
// bloco de metadados (NF / Data / Peso total / Metragem total / Serviço Adicional / Cor)
// e tabela de itens com colunas: Item, Código, Cor, Qtd. Peças, Tam. Barras,
// Peso Liq., Metro, Fator (M/KG), OP.
import * as XLSX from 'xlsx';

export interface RomaneioExportItem {
  codigo?: string | null;
  qtd_pecas?: number | null;
  tam_barras?: number | null;
  peso_liq?: number | null;
  op?: string | null;
}

export interface RomaneioExportInput {
  numero: string;
  numero_nf: string;
  cor: string;
  data_emissao: string; // ISO date (YYYY-MM-DD)
  servico_adicional?: string | null;
  acabamento?: string | null;
  observacoes?: string | null;
  itens: RomaneioExportItem[];
}

const num = (v: unknown): number => {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
};

const fmtDate = (iso: string): string => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return y && m && d ? `${d}/${m}/${y}` : iso;
};

export function buildRomaneioWorkbook(r: RomaneioExportInput): XLSX.WorkBook {
  const totalPeso = r.itens.reduce((s, i) => s + num(i.peso_liq), 0);
  const totalMetro = r.itens.reduce(
    (s, i) => s + num(i.qtd_pecas) * num(i.tam_barras),
    0,
  );

  const header: (string | number)[][] = [
    ['ROMANEIO DE ENTREGA - UNILUX'],
    ['Nº NFe:', r.numero_nf, '', '', '', 'Data de emissão:', fmtDate(r.data_emissao)],
    ['Peso Líquido:', `${totalPeso.toFixed(2)} Kg`, '', '', '', 'Metragem total:', `${totalMetro.toFixed(2)} M`],
    ['Cor:', r.cor],
    ['Serviço Adicional:', r.servico_adicional ?? ''],
    ['Acabamento:', r.acabamento ?? ''],
    ['Observações:', r.observacoes ?? ''],
    [],
    ['Item', 'Código', 'Cor', 'Qtd. Peças', 'Tam. Barras', 'Peso Liq.', 'Metro', 'Fator (M/KG)', 'OP'],
  ];

  const body = r.itens.map((it, idx) => {
    const qtd = num(it.qtd_pecas);
    const tam = num(it.tam_barras);
    const peso = num(it.peso_liq);
    const metro = qtd * tam;
    const fator = peso > 0 ? metro / peso : '';
    return [
      idx + 1,
      it.codigo ?? '',
      r.cor,
      qtd || '',
      tam || '',
      peso || '',
      metro || '',
      fator === '' ? '' : Number(fator.toFixed(3)),
      it.op ?? '',
    ];
  });

  const totalsRow = ['', '', '', '', 'TOTAL', totalPeso || '', totalMetro || '', '', ''];

  const aoa = [...header, ...body, [], totalsRow];
  const ws = XLSX.utils.aoa_to_sheet(aoa);

  ws['!cols'] = [
    { wch: 6 },   // Item
    { wch: 18 },  // Código
    { wch: 22 },  // Cor
    { wch: 12 },  // Qtd
    { wch: 12 },  // Tam
    { wch: 14 },  // Peso
    { wch: 12 },  // Metro
    { wch: 14 },  // Fator
    { wch: 14 },  // OP
  ];

  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } }, // title row A1:I1
  ];

  const wb = XLSX.utils.book_new();
  const sheetName = `Romaneio ${r.cor}`.slice(0, 31).replace(/[\\/?*[\]:]/g, '-');
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  return wb;
}

export function exportRomaneioXLSX(r: RomaneioExportInput): void {
  const wb = buildRomaneioWorkbook(r);
  const safeCor = r.cor.replace(/[^a-zA-Z0-9\-_ ]/g, '').trim().replace(/\s+/g, '_');
  const filename = `romaneio-${r.numero || r.numero_nf}-${safeCor || 'cor'}.xlsx`;
  XLSX.writeFile(wb, filename);
}
