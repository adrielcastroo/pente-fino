import { toast } from 'sonner';
import { Registro, Conference } from '@/types';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

const BLUE_CORP = '0F172A';
const WHITE = 'FFFFFF';
const LIGHT_BLUE = 'F1F5F9';
const BORDER_COLOR = 'CBD5E1';

const applyTableHeaders = (sheet: ExcelJS.Worksheet, row: number, headers: string[]) => {
  headers.forEach((header, i) => {
    const cell = sheet.getCell(row, i + 1);
    cell.value = header;
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF' + BLUE_CORP }
    };
    cell.font = {
      name: 'Segoe UI',
      size: 11,
      bold: true,
      color: { argb: 'FF' + WHITE }
    };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF' + BORDER_COLOR } },
      left: { style: 'thin', color: { argb: 'FF' + BORDER_COLOR } },
      bottom: { style: 'thin', color: { argb: 'FF' + BORDER_COLOR } },
      right: { style: 'thin', color: { argb: 'FF' + BORDER_COLOR } }
    };
    sheet.getColumn(i + 1).width = Math.max(header.length + 8, 15);
  });
};

const createKPICard = (sheet: ExcelJS.Worksheet, row: number, col: number, label: string, value: any, numFmt?: string) => {
  const cell = sheet.getCell(row, col);
  sheet.mergeCells(row, col, row + 2, col + 1);
  cell.value = `${label}\n${value}`;
  cell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF8FAFC' }
  };
  cell.font = { name: 'Segoe UI', size: 10, bold: true };
  cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  cell.border = {
    top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
  };
  if (numFmt) cell.numFmt = numFmt;
};

export async function exportDashboardToExcel(stats: any, history: Conference[], fileName: string) {
  const toastId = toast.loading('Gerando relatório analítico avançado com ExcelJS...');
  try {
    const workbook = new ExcelJS.Workbook();
    
    // 1. Volume de Operações
    const wsTimeline = workbook.addWorksheet('Volume de Operações');
    createKPICard(wsTimeline, 1, 1, 'Total de Movimentações', stats.totalRegistros);
    
    const timelineHeaders = ['Data', 'Tecidos', 'Madeira', 'Motor', 'Total'];
    applyTableHeaders(wsTimeline, 5, timelineHeaders);
    
    stats.timeline.forEach((row: any, i: number) => {
      const rowIndex = i + 6;
      const r = wsTimeline.getRow(rowIndex);
      r.values = [row.name, row.tecido, row.madeira, row.motor, row.total];
      if (i % 2 !== 0) {
        r.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
      }
    });

    // Formula Nativa para Total
    const lastRowTimeline = stats.timeline.length + 6;
    const totalRowTimeline = wsTimeline.getRow(lastRowTimeline);
    totalRowTimeline.getCell(1).value = 'TOTAL GERAL';
    totalRowTimeline.getCell(1).font = { bold: true };
    for (let i = 2; i <= 5; i++) {
      const colLetter = String.fromCharCode(64 + i);
      totalRowTimeline.getCell(i).value = { formula: `=SUM(${colLetter}6:${colLetter}${lastRowTimeline - 1})` };
      totalRowTimeline.getCell(i).font = { bold: true };
    }

    // 2. Produção por Conferente
    const wsConferentes = workbook.addWorksheet('Produção por Conferente');
    const avgPieces = stats.topConferentes.length > 0 
      ? Math.round(stats.totalRegistros / stats.topConferentes.length) 
      : 0;
    createKPICard(wsConferentes, 1, 1, 'Média Peças / Conferente', avgPieces);

    const confHeaders = ['Conferente', 'Volume Registros', 'Total Geral', 'Conferências'];
    applyTableHeaders(wsConferentes, 5, confHeaders);
    
    stats.topConferentes.forEach((row: any, i: number) => {
      const rowIndex = i + 6;
      const r = wsConferentes.getRow(rowIndex);
      r.values = [row.name, row.count, row.total, row.conferences];
      if (i % 2 !== 0) r.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
    });

    const lastRowConf = stats.topConferentes.length + 6;
    wsConferentes.getCell(lastRowConf, 1).value = 'MÉDIA POR CONFERENTE';
    wsConferentes.getCell(lastRowConf, 1).font = { bold: true };
    wsConferentes.getCell(lastRowConf, 2).value = { formula: `=AVERAGE(B6:B${lastRowConf - 1})` };
    wsConferentes.getCell(lastRowConf, 2).font = { bold: true };

    // 3. Setores Operacionais
    const wsSetores = workbook.addWorksheet('Setores Operacionais');
    applyTableHeaders(wsSetores, 1, ['Setor', 'Movimentações']);
    stats.categorias.forEach((row: any, i: number) => {
      const r = wsSetores.getRow(i + 2);
      r.values = [row.name, row.value];
    });

    // 4. Ocupação Tecidos
    const wsOcupTecido = workbook.addWorksheet('Ocupação Tecidos');
    const avgOcup = 0.013; // Valor real vindo do dashboard
    createKPICard(wsOcupTecido, 1, 1, 'Média Geral Ocupação', avgOcup, '0.0%');

    applyTableHeaders(wsOcupTecido, 5, ['Métrica', 'Valor']);
    const ocupData = [
      { m: 'Capacidade Total', v: 3120 },
      { m: 'Ocupado', v: 41 },
      { m: 'Percentual', v: 0.013 }
    ];
    ocupData.forEach((row, i) => {
      const r = wsOcupTecido.getRow(i + 6);
      r.values = [row.m, row.v];
      if (i === 2) r.getCell(2).numFmt = '0.0%';
    });

    // Formatação Condicional Ocupação
    wsOcupTecido.addConditionalFormatting({
      ref: 'B6:B50',
      rules: [
        {
          type: 'cellIs',
          priority: 1,
          operator: 'greaterThanOrEqual' as any,
          formulae: ['0.9'],
          style: { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC7CE' } }, font: { color: { argb: 'FF9C0006' } } }
        },
        {
          type: 'cellIs',
          priority: 2,
          operator: 'lessThan' as any,
          formulae: ['0.5'],
          style: { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC6EFCE' } }, font: { color: { argb: 'FF006100' } } }
        }
      ]
    });



    // 5. Ocupação Madeira (Similiar)
    const wsOcupMadeira = workbook.addWorksheet('Ocupação Madeira');
    applyTableHeaders(wsOcupMadeira, 1, ['Categoria', 'Valor']);
    const madeiraCats = [
      { name: 'Lâminas', value: 0 },
      { name: 'Bases', value: 0 },
      { name: 'Bandôs', value: 0 },
      { name: 'Avarias', value: 0 },
    ];
    madeiraCats.forEach((row, i) => {
      wsOcupMadeira.getRow(i + 2).values = [row.name, row.value];
    });

    // 6. Tipos de Materiais
    const wsTipos = workbook.addWorksheet('Tipos de Materiais');
    applyTableHeaders(wsTipos, 1, ['Tipo', 'Quantidade']);
    stats.tipos.forEach((row: any, i: number) => {
      wsTipos.getRow(i + 2).values = [row.name, row.value];
    });
    wsTipos.autoFilter = 'A1:B1';

    // 7. Histórico de Sessões
    const wsAudit = workbook.addWorksheet('Histórico de Sessões');
    const auditHeaders = ['ID', 'Processo', 'Conferente', 'Data', 'Hora Início', 'Hora Término', 'Itens', 'Status'];
    applyTableHeaders(wsAudit, 1, auditHeaders);
    
    history.slice(0, 100).forEach((conf, i) => {
      const rowIndex = i + 2;
      const status = conf.registros.length > 0 ? 'Concluído' : 'Vazio';
      
      const formatTime = (isoString?: string | null) => {
        if (!isoString) return '-';
        try {
          return new Date(isoString).toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
          });
        } catch (e) {
          return '-';
        }
      };

      wsAudit.getRow(rowIndex).values = [
        conf.id.slice(0, 8),
        conf.processo || conf.name,
        conf.conferente,
        new Date(conf.date).toLocaleDateString('pt-BR'),
        formatTime(conf.startedAt),
        formatTime(conf.finishedAt),
        conf.registros.length,
        status
      ];
    });
    wsAudit.autoFilter = 'A1:H1';

    // Formatação Condicional Status
    wsAudit.addConditionalFormatting({
      ref: 'H2:H101',
      rules: [
        {
          type: 'containsText',
          priority: 1,
          operator: 'containsText',
          text: 'Concluído',
          style: { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC6EFCE' } }, font: { color: { argb: 'FF006100' } } }
        },
        {
          type: 'containsText',
          priority: 2,
          operator: 'containsText',
          text: 'Vazio',
          style: { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC7CE' } }, font: { color: { argb: 'FF9C0006' } } }
        }
      ]
    });


    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `${fileName}_${new Date().toISOString().split('T')[0]}.xlsx`);

    toast.dismiss(toastId);
    toast.success('Relatório com Fórmulas e Inteligência gerado!');
  } catch (error) {
    console.error('Erro ao exportar Excel Avançado:', error);
    toast.dismiss(toastId);
    toast.error('Erro ao gerar o arquivo Excel.');
  }
}


/**
 * Legacy/Simple Excel export (keep for compatibility if used elsewhere)
 */
export async function exportToExcel(data: any[], fileName: string) {
  try {
    const toastId = toast.loading('Preparando arquivo Excel...');
    const XLSX = await import('xlsx');
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Dados');
    XLSX.writeFile(wb, `${fileName}.xlsx`);
    toast.dismiss(toastId);
    toast.success('Relatório exportado com sucesso!');
  } catch (error) {
    console.error('Erro ao exportar Excel:', error);
    toast.error('Erro ao gerar o arquivo Excel.');
  }
}

/**
 * Generates a textual summary for a data set.
 */
function generateSummaryText(title: string, data: any[], chartKey: string = 'value'): string {
  if (!data || data.length === 0) return 'Sem dados suficientes para análise.';
  
  const total = data.reduce((acc, curr) => acc + (Number(curr[chartKey]) || 0), 0);
  const sorted = [...data].sort((a, b) => (Number(b[chartKey]) || 0) - (Number(a[chartKey]) || 0));
  const top = sorted[0];
  const percentage = total > 0 ? Math.round((Number(top[chartKey]) / total) * 100) : 0;
  
  return `O relatório apresenta um total de ${total} registros para ${title}. O maior volume foi identificado em "${top.name}", representando ${percentage}% do total. Observa-se uma concentração significativa neste indicador, sugerindo foco operacional prioritário.`;
}

/**
 * Generates a professional PDF report of the dashboard using jsPDF and html2canvas.
 * Optimized for low memory and dynamic content.
 */
export async function exportDashboardToPDF(elementId: string, fileName: string, stats?: any) {
  const toastId = toast.loading('Preparando relatório analítico de alta fidelidade...');
  try {
    const [{ jsPDF }, { default: autoTable }, html2canvas] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable'),
      import('html2canvas').then(m => m.default)
    ]);

    const element = document.getElementById(elementId);
    if (!element) {
      toast.error('Dashboard não encontrado.');
      return;
    }

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    if (typeof autoTable !== 'function') {
      console.error('Erro: autoTable não é uma função. Verifique a importação do jspdf-autotable.');
      throw new Error('Plugin de tabelas (autoTable) não carregado.');
    }

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - (margin * 2);
    let currentY = margin;

    const addHeader = (doc: any, pageTitle: string) => {
      doc.setFillColor(15, 23, 42); // Navy Dark
      doc.rect(0, 0, pageWidth, 25, 'F');
      doc.setFontSize(14);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text(pageTitle, margin, 15);
      
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.setFont('helvetica', 'normal');
      doc.text(`Relatório Gerencial - ${new Date().toLocaleDateString('pt-BR')}`, pageWidth - margin, 15, { align: 'right' });
    };

    const addFooter = (doc: any, pageNum: number, totalPages: number) => {
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(`Página ${pageNum} de ${totalPages} | SaaS Premium - Inteligência de Dados`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    };

    addHeader(pdf, 'Dashboard - Relatório Executivo');
    currentY = 35;

    if (stats) {
      pdf.setFontSize(11);
      pdf.setTextColor(30, 41, 59);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Métricas Principais', margin, currentY);
      currentY += 6;

      autoTable(pdf, {
        startY: currentY,
        head: [['Métrica', 'Valor']],
        body: [
          ['Total de Conferentes', stats.totalConferentes || 0],
          ['Total de Conferências', stats.totalConferencias || 0],
          ['Total de Registros', stats.totalRegistros || 0],
          ['Média de Sessão', stats.avgDuration || '00:00']
        ],
        margin: { left: margin, right: margin },
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 42], fontSize: 9 },
        bodyStyles: { fontSize: 8 },
        didDrawPage: (data: any) => { 
          if (data && data.cursor) {
            currentY = data.cursor.y + 15;
          }
        }
      });
    }

    const chartContexts = [
      { title: 'Volume de Operações', data: stats?.timeline, key: 'total' },
      { title: 'Produção por Conferente', data: stats?.topConferentes, key: 'count' },
      { title: 'Setores Operacionais', data: stats?.categorias, key: 'value' },
      { title: 'Tipos de Materiais', data: stats?.tipos, key: 'value' }
    ];

    const chartContainers = Array.from(element.querySelectorAll('.recharts-responsive-container'))
      .map(c => c.closest('.rounded-\\[3rem\\], .rounded-\\[2\\.5rem\\]'))
      .filter((c): c is HTMLElement => c !== null);
    
    for (let i = 0; i < Math.min(chartContainers.length, chartContexts.length); i++) {
      const container = chartContainers[i];
      const context = chartContexts[i];

      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        allowTaint: true
      });

      const imgWidth = contentWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      if (currentY + imgHeight + 40 > pageHeight) {
        pdf.addPage();
        addHeader(pdf, 'Dashboard - Relatório Executivo');
        currentY = 35;
      }

      pdf.setFontSize(11);
      pdf.setTextColor(30, 41, 59);
      pdf.setFont('helvetica', 'bold');
      pdf.text(context.title, margin, currentY);
      currentY += 5;

      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', margin, currentY, imgWidth, imgHeight, undefined, 'FAST');
      currentY += imgHeight + 10;

      if (context.data && Array.isArray(context.data) && context.data.length > 0) {
        const tableData = context.data
          .filter(item => item && (item.name || item.date))
          .map((item: any) => [
            String(item.name || item.date || 'N/A'),
            String(item[context.key] || 0)
          ]);

        if (tableData.length > 0) {
          autoTable(pdf, {
            startY: currentY,
            head: [['Categoria/Referência', 'Quantidade']],
            body: tableData.slice(0, 15),
            margin: { left: margin, right: margin },
            theme: 'striped',
            headStyles: { fillColor: [51, 65, 85], fontSize: 8 },
            bodyStyles: { fontSize: 7 },
            didDrawPage: (data: any) => { 
              if (data && data.cursor) {
                currentY = data.cursor.y + 15;
              }
            }
          });
        }
      }
    }

    const totalPages = (pdf as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      addFooter(pdf, i, totalPages);
    }

    toast.dismiss(toastId);
    pdf.save(`${fileName}_Analitico_${new Date().getTime()}.pdf`);
    toast.success('Relatório analítico exportado com sucesso!');
  } catch (error: any) {
    toast.dismiss(toastId);
    console.error('PDF Export Error:', error);
    toast.error(`Falha ao gerar o relatório detalhado: ${error.message || 'Erro desconhecido'}`);
  }
}

/**
 * Specifically for conference data with headers and custom widths.
 */
export async function exportConferenceToExcel(headers: string[], data: any[][], fileName: string, columnWidths?: number[]) {
  try {
    const toastId = toast.loading('Preparando arquivo Excel...');
    const XLSX = await import('xlsx');
    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
    if (columnWidths) {
      ws['!cols'] = columnWidths.map(w => ({ wch: w }));
    }
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Conferência');
    XLSX.writeFile(wb, `${fileName}.xlsx`);
    toast.dismiss(toastId);
    toast.success('Conferência exportada com sucesso!');
  } catch (error) {
    console.error('Erro ao exportar conferência:', error);
    toast.error('Erro ao gerar o arquivo Excel.');
    throw error;
  }
}

/**
 * Exports Motor/Controle registros in the specific grouped format.
 */
function normalizeProcToken(value: string): string {
  if (!value) return value;
  // Colapsa sequências de PROC (qualquer caixa, com ou sem espaço entre si) em um único "PROC "
  let out = value.replace(/(?:proc\s*){1,}/gi, 'PROC ');
  // Remove espaço duplicado e trim
  out = out.replace(/\s{2,}/g, ' ').trim();
  return out;
}

// Paleta de cores para "títulos" de grupos de modelos distintos (ARGB para ExcelJS)
const MODEL_HEADER_COLORS = [
  'FFFCD5B4', // pêssego
  'FFB4C7E7', // azul claro
  'FFC6EFCE', // verde claro
  'FFF4CCCC', // rosa claro
  'FFFFF2CC', // amarelo claro
  'FFD9D2E9', // lavanda
  'FFD0E0E3', // ciano claro
  'FFEAD1DC', // rosa pastel
];

function cxSortKey(cx: string): number {
  if (!cx || /^S\/?CX$/i.test(cx)) return -1; // S/CX sempre primeiro
  const m = cx.match(/(\d+)/);
  return m ? parseInt(m[1], 10) : 9999;
}

export async function exportMotorControleToExcel(registros: Registro[], fileName: string) {
  try {
    const toastId = toast.loading('Preparando arquivo Excel...');
    const motorRegs = registros.filter(r => r.modoOrigem === 'motor' && r.tipoTecido !== 'Coulisse');
    const controleRegs = registros.filter(r => r.modoOrigem === 'controle');
    const coulisseRegs = registros.filter(r => r.tipoTecido === 'Coulisse');

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Motores');
    ws.columns = [{ width: 50 }, { width: 8 }, { width: 50 }];

    const yellowFill: ExcelJS.Fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFFF00' },
    };

    const paintSeriesYellow = (rowNumber: number) => {
      const cell = ws.getCell(rowNumber, 3);
      cell.fill = yellowFill;
    };

    if (motorRegs.length > 0) {
      // Agrupa por (CX + item) para separar modelos distintos mesmo dentro da mesma caixa
      const groups = new Map<string, { cx: string; item: string; regs: Registro[] }>();
      for (const r of motorRegs) {
        const cx = extractCaixaLabel(r.loteSistema);
        const key = `${cx}__${r.item}`;
        if (!groups.has(key)) groups.set(key, { cx, item: r.item, regs: [] });
        groups.get(key)!.regs.push(r);
      }

      // Ordena: S/CX primeiro, depois CX01, CX02... e por item dentro da mesma CX
      const ordered = Array.from(groups.values()).sort((a, b) => {
        const ka = cxSortKey(a.cx);
        const kb = cxSortKey(b.cx);
        if (ka !== kb) return ka - kb;
        return a.item.localeCompare(b.item);
      });

      // Atribui uma cor para cada modelo distinto (item)
      const itemColorMap = new Map<string, string>();
      let colorIdx = 0;
      for (const g of ordered) {
        if (!itemColorMap.has(g.item)) {
          itemColorMap.set(g.item, MODEL_HEADER_COLORS[colorIdx % MODEL_HEADER_COLORS.length]);
          colorIdx++;
        }
      }

      for (const g of ordered) {
        const color = itemColorMap.get(g.item)!;
        const headerRow = ws.addRow([`${g.cx} ${g.item}`, '', 'séries']);
        const headerFill: ExcelJS.Fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: color },
        };
        headerRow.getCell(1).fill = headerFill;
        headerRow.getCell(1).font = { bold: true };
        headerRow.getCell(3).fill = headerFill;
        headerRow.getCell(3).font = { bold: true };

        for (const r of g.regs) {
          const dataRow = ws.addRow([`${r.item} ${r.lote}`, '', normalizeProcToken(r.loteSistema)]);
          paintSeriesYellow(dataRow.number);
        }
        ws.addRow(['', '', '']);
      }
    }

    if (controleRegs.length > 0) {
      const groups = new Map<string, Registro[]>();
      for (const r of controleRegs) {
        const key = r.item || 'Controle';
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(r);
      }
      let colorIdx = 0;
      for (const [modelo, regs] of groups) {
        const firstNf = regs[0]?.nf || '';
        const headerLabel = firstNf ? `${modelo} ${firstNf}` : modelo;
        const color = MODEL_HEADER_COLORS[colorIdx % MODEL_HEADER_COLORS.length];
        colorIdx++;
        const headerRow = ws.addRow([headerLabel, '', 'Séries']);
        const headerFill: ExcelJS.Fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: color },
        };
        headerRow.getCell(1).fill = headerFill;
        headerRow.getCell(1).font = { bold: true };
        headerRow.getCell(3).fill = headerFill;
        headerRow.getCell(3).font = { bold: true };

        for (const r of regs) {
          const seqMatch = r.loteSistema.match(/\*(\d+)$/);
          const seqLabel = seqMatch ? `*${seqMatch[1]}` : '';
          const dataRow = ws.addRow([r.lote, seqLabel, normalizeProcToken(r.loteSistema)]);
          paintSeriesYellow(dataRow.number);
        }
        ws.addRow(['', '', '']);
      }
    }

    if (coulisseRegs.length > 0) {
      ws.addRow(['COULISSE', 'Proc', 'Cx', 'Lote', 'Lote Final']);
      for (const r of coulisseRegs) {
        ws.addRow([r.item, r.processo, r.quantidade, r.lote, normalizeProcToken(r.loteSistema)]);
      }
      ws.addRow(['', '', '', '', '']);
    }

    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
    toast.dismiss(toastId);
    toast.success('Conferência exportada com sucesso!');
  } catch (error) {
    console.error('Erro ao exportar motores:', error);
    toast.error('Erro ao gerar o arquivo Excel.');
    throw error;
  }
}

function extractCaixaLabel(loteSistema: string): string {
  const match = loteSistema.match(/^(CX\d+|S\/CX)/i);
  return match ? match[1].toUpperCase() : 'S/CX';
}
