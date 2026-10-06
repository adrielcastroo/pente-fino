// Utilitários de exportação client-side (PDF/Excel/CSV) para Expedição.
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { PreviewRow } from '@/components/expedicao/RomaneioImportDialog';

/* ─────────── PDF: Romaneio ─────────── */

export type RomaneioPdfInput = {
  numero: string;
  criado_em: string;
  transportadora?: string | null;
  status: string;
  pecas: Array<{
    codigo_etiqueta: string;
    carrinho?: string | null;
    item?: string | null;
    largura?: number | null;
  }>;
};

export function exportRomaneioPDF(r: RomaneioPdfInput) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const w = doc.internal.pageSize.getWidth();

  doc.setFontSize(16);
  doc.text('Romaneio de Expedição', 14, 15);

  doc.setFontSize(10);
  doc.text(`Nº: ${r.numero}`, 14, 24);
  doc.text(`Emitido em: ${new Date(r.criado_em).toLocaleString('pt-BR')}`, 14, 30);
  doc.text(`Status: ${r.status}`, w - 14, 24, { align: 'right' });
  if (r.transportadora) doc.text(`Transportadora: ${r.transportadora}`, w - 14, 30, { align: 'right' });

  autoTable(doc, {
    startY: 38,
    head: [['#', 'Etiqueta', 'Carrinho', 'Item', 'Largura']],
    body: r.pecas.map((p, i) => [
      String(i + 1),
      p.codigo_etiqueta,
      p.carrinho ?? '—',
      p.item ?? '—',
      p.largura != null ? String(p.largura) : '—',
    ]),
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [30, 41, 59] },
  });

  const finalY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 40;
  doc.setFontSize(9);
  doc.text(`Total de peças: ${r.pecas.length}`, 14, finalY + 8);

  doc.text('_____________________________________', 14, finalY + 30);
  doc.text('Assinatura do responsável', 14, finalY + 35);
  doc.text('_____________________________________', w - 14, finalY + 30, { align: 'right' });
  doc.text('Assinatura da transportadora', w - 14, finalY + 35, { align: 'right' });

  doc.save(`romaneio-${r.numero}.pdf`);
}

/* ─────────── Excel: genérico ─────────── */

export function exportExcel<T extends Record<string, unknown>>(
  rows: T[],
  filename: string,
  sheet = 'Dados',
) {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheet.slice(0, 30));
  XLSX.writeFile(wb, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`);
}

export function exportCSV<T extends Record<string, unknown>>(rows: T[], filename: string) {
  const ws = XLSX.utils.json_to_sheet(rows);
  const csv = XLSX.utils.sheet_to_csv(ws);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ─────────── Excel: Romaneio Profissional ─────────── */

export function exportRomaneioExcel(linhas: PreviewRow[]) {
  const data = new Date();

  const wsData = linhas.map((l, i) => ({
    '#': i + 1,
    Código: l.codigo_cliente,
    Nome: l.nome_cliente,
    NF: l.nf || '-',
    Data: l.data || '-',
    Transportador: l.transportador || '-',
    Volume: l.volume || 0,
    Observações: l.observacoes || '-',
  }));

  const ws = XLSX.utils.json_to_sheet(wsData);

  // Set column widths for professional look
  ws['!cols'] = [
    { wch: 5 },   // #
    { wch: 15 },  // Código
    { wch: 40 },  // Nome
    { wch: 15 },  // NF
    { wch: 15 },  // Data
    { wch: 25 },  // Transportador
    { wch: 10 },  // Volume
    { wch: 40 },  // Observações
  ];

  // Apply header styling directly on the sheet
  const range = XLSX.utils.decode_range(ws);
  for (let row = range.s.r; row <= range.e.r; row++) {
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cell = ws[XLSX.utils.encode_cell({ r: row, c: col })];
      if (cell && row === 0) {
        cell.s = {
          font: { bold: true, color: { rgb: 'FFFFFF' } },
          fill: { fgColor: { rgb: '1E293B' } },
          alignment: { horizontal: 'center' },
          border: {
            top: { style: 'thin' },
            bottom: { style: 'thin' },
            left: { style: 'thin' },
            right: { style: 'thin' },
          },
        };
      }
    }
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Romaneio');

  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([buf], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `romaneio-${format(data, 'yyyy-MM-dd', { locale: ptBR })}.xlsx`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
}

/* ─────────── PDF: Romaneio Importado (dados do PreviewRow) ─────────── */

export type RomaneioImportadoPdfInput = {
  dataRomaneio: string;
  linhas: PreviewRow[];
};

export function exportRomaneioImportadoPDF({ dataRomaneio, linhas }: RomaneioImportadoPdfInput) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  const dataFormatada = dataRomaneio
    ? new Date(dataRomaneio + 'T00:00:00').toLocaleDateString('pt-BR')
    : format(new Date(), 'dd/MM/yyyy', { locale: ptBR });

  // Cabeçalho
  doc.setFontSize(18);
  doc.text('Romaneio de Expedição', 14, 20);

  doc.setFontSize(10);
  doc.text(`Data do Romaneio: ${dataFormatada}`, 14, 30);
  doc.text(`Total de linhas: ${linhas.length}`, w - 14, 30, { align: 'right' });

  // Linha separadora
  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.5);
  doc.line(14, 35, w - 14, 35);

  // Tabela de dados
  const body = linhas.map((l, i) => {
    const trans = l.decisao?.transportadora || l.transportador || '-';
    const obs = l.observacoes || '-';
    return [
      String(i + 1),
      l.codigo_cliente,
      l.nome_cliente,
      l.nf || '-',
      l.data || '-',
      trans,
      String(typeof l.volume === 'number' ? l.volume : '-'),
      obs,
    ];
  });

  autoTable(doc, {
    startY: 40,
    head: [['#', 'Código', 'Nome do Cliente', 'NF', 'Data', 'Transportador', 'Vol.', 'Observações']],
    body,
    styles: { fontSize: 7, cellPadding: 1.5 },
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontSize: 7, halign: 'center' },
    columnStyles: {
      0: { halign: 'center', cellWidth: 6 },
      1: { cellWidth: 16 },
      2: { cellWidth: 38 },
      3: { cellWidth: 14, halign: 'center' },
      4: { cellWidth: 16, halign: 'center' },
      5: { cellWidth: 22 },
      6: { cellWidth: 8, halign: 'center' },
      7: { cellWidth: 32 },
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    tableLineWidth: 0.1,
    headLineWidth: 0.5,
    bodyLineWidth: 0.1,
  });

  const finalY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 40;
  const sigY = Math.min(finalY + 18, h - 25);

  // Linha separadora antes das assinaturas
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(14, sigY - 4, w - 14, sigY - 4);

  // Campos de assinatura e data
  doc.setFontSize(9);
  const colW = (w - 28) / 3;

  // Data
  doc.text('Data:', 14, sigY + 6);
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.4);
  doc.line(24, sigY + 8, 24 + colW, sigY + 8);

  // Assinatura do responsável
  doc.text('Assinatura do Responsável', 14, sigY + 20);
  doc.line(14, sigY + 22, 14 + colW, sigY + 22);

  // Assinatura do coletador / transportadora
  doc.text('Assinatura do Coletador', 14 + colW + 8, sigY + 20);
  doc.line(14 + colW + 8, sigY + 22, 14 + 2 * colW + 8, sigY + 22);

  // Rodapé
  doc.setFontSize(8);
  doc.text('Pente Fino — Gestão de Estoque Têxtil', 14, h - 10);
  doc.text(`Página 1 de 1`, w - 14, h - 10, { align: 'right' });

  doc.save(`romaneio-${dataFormatada}.pdf`);
}
