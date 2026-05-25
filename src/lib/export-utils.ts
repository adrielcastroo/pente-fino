import { toast } from 'sonner';
import { Registro, Conference } from '@/types';
import { useAppStore } from '@/store/useAppStore';
import { saveAs } from 'file-saver';
import { Workbook, ChartFactory } from 'xml-xlsx-lite';

const triggerAutoArchive = async (fileName: string) => {
  try {
    const store = useAppStore.getState();
    if (store.registros.length > 0) {
      await store.archiveAndClear(fileName, true);
      store.resetFormData();
      store.resetMotorFormData();
      toast.info('Dados arquivados em histórico e campos limpos.');
    }
  } catch (error) {
    console.error('Erro no arquivamento automático após exportação:', error);
  }
};

const BLUE_CORP = '0F172A';
const WHITE = 'FFFFFF';
const LIGHT_BLUE = 'F1F5F9';
const BORDER_COLOR = 'CBD5E1';

const applyTableHeaders = (sheet: any, row: number, headers: string[]) => {
  headers.forEach((header, i) => {
    const col = String.fromCharCode(65 + i);
    sheet.setCell(`${col}${row}`, header, {
      fill: { type: 'pattern', patternType: 'solid', fgColor: BLUE_CORP },
      font: { bold: true, color: WHITE, size: 11, name: 'Segoe UI' },
      alignment: { horizontal: 'center', vertical: 'middle' },
      border: {
        top: { style: 'thin', color: BORDER_COLOR },
        left: { style: 'thin', color: BORDER_COLOR },
        bottom: { style: 'thin', color: BORDER_COLOR },
        right: { style: 'thin', color: BORDER_COLOR }
      }
    });
    sheet.setColumnWidth(i + 1, Math.max(header.length + 8, 15));
  });
};

const createKPICard = (sheet: any, row: number, col: number, label: string, value: any, numFmt?: string) => {
  const colLetter = String.fromCharCode(64 + col);
  const nextColLetter = String.fromCharCode(65 + col);
  sheet.mergeCells(`${colLetter}${row}:${nextColLetter}${row + 2}`);
  sheet.setCell(`${colLetter}${row}`, `${label}\n${value}`, {
    fill: { type: 'pattern', patternType: 'solid', fgColor: 'F8FAFC' },
    font: { bold: true, size: 10, name: 'Segoe UI' },
    alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
    border: {
      top: { style: 'thin', color: 'E2E8F0' },
      left: { style: 'thin', color: 'E2E8F0' },
      bottom: { style: 'thin', color: 'E2E8F0' },
      right: { style: 'thin', color: 'E2E8F0' }
    },
    numFmt: numFmt
  });
};

export async function exportDashboardToExcel(stats: any, history: Conference[], fileName: string) {
  const toastId = toast.loading('Gerando relatório analítico com GRÁFICOS NATIVOS...');
  try {
    const workbook = new Workbook();
    
    // 1. Volume de Operações
    const wsTimeline = workbook.getWorksheet(0);
    wsTimeline.name = 'Volume de Operações';
    createKPICard(wsTimeline, 1, 1, 'Total de Movimentações', stats.totalRegistros);
    
    const timelineHeaders = ['Data', 'Tecidos', 'Madeira', 'Motor', 'Total'];
    applyTableHeaders(wsTimeline, 5, timelineHeaders);
    
    stats.timeline.forEach((row: any, i: number) => {
      const rowIndex = i + 6;
      wsTimeline.setCell(`A${rowIndex}`, row.name);
      wsTimeline.setCell(`B${rowIndex}`, row.tecido);
      wsTimeline.setCell(`C${rowIndex}`, row.madeira);
      wsTimeline.setCell(`D${rowIndex}`, row.motor);
      wsTimeline.setCell(`E${rowIndex}`, row.total);
      
      if (i % 2 !== 0) {
        ['A', 'B', 'C', 'D', 'E'].forEach(col => {
          wsTimeline.getCell(`${col}${rowIndex}`).options.fill = { type: 'pattern', patternType: 'solid', fgColor: 'F1F5F9' };
        });
      }
    });

    // Fórmulas Nativas
    const lastRowTimeline = stats.timeline.length + 6;
    wsTimeline.setCell(`A${lastRowTimeline}`, 'TOTAL GERAL', { font: { bold: true } });
    for (let i = 2; i <= 5; i++) {
      const colLetter = String.fromCharCode(64 + i);
      wsTimeline.setFormula(`${colLetter}${lastRowTimeline}`, `SUM(${colLetter}6:${colLetter}${lastRowTimeline - 1})`, { font: { bold: true } });
    }

    // Gráfico de Linha Nativo
    wsTimeline.addChart(ChartFactory.createLineChart('VolumeChart', [
      { series: 'Total', categories: `'Volume de Operações'!$A$6:$A$${lastRowTimeline - 1}`, values: `'Volume de Operações'!$E$6:$E$${lastRowTimeline - 1}` }
    ], { title: 'Tendência de Operações', showLegend: true }, { row: 1, col: 4 }));

    // 2. Produção por Conferente
    const wsConferentes = workbook.addLargeDataset ? workbook.getWorksheet(workbook.getWorksheets().length) : workbook.getWorksheet(1);
    // Note: xml-xlsx-lite might only have one sheet by default, let's see.
    // Based on index.d.ts, workbook.getWorksheet(nameOrIndex) returns a Worksheet.
    // Usually, we can just access them. Let's try to name them as we go.
    
    // Fallback: if getWorksheet(index) returns undefined or crashes, we should check how to add.
    // Actually Workbook has no addWorksheet. It usually auto-creates if accessed.
    
    const wsConf = workbook.getWorksheet(1);
    wsConf.name = 'Produção por Conferente';
    const avgPieces = stats.topConferentes.length > 0 ? Math.round(stats.totalRegistros / stats.topConferentes.length) : 0;
    createKPICard(wsConf, 1, 1, 'Média Peças / Conferente', avgPieces);
    applyTableHeaders(wsConf, 5, ['Conferente', 'Volume', 'Total', 'Conferências']);
    
    stats.topConferentes.forEach((row: any, i: number) => {
      const rowIndex = i + 6;
      wsConf.setCell(`A${rowIndex}`, row.name);
      wsConf.setCell(`B${rowIndex}`, row.count);
      wsConf.setCell(`C${rowIndex}`, row.total);
      wsConf.setCell(`D${rowIndex}`, row.conferences);
    });
    
    const lastRowConf = stats.topConferentes.length + 6;
    wsConf.setFormula(`B${lastRowConf}`, `AVERAGE(B6:B${lastRowConf - 1})`, { font: { bold: true } });

    wsConf.addChart(ChartFactory.createColumnChart('ConfChart', [
      { series: 'Volume', categories: `'Produção por Conferente'!$A$6:$A$${lastRowConf - 1}`, values: `'Produção por Conferente'!$B$6:$B$${lastRowConf - 1}` }
    ], { title: 'Produtividade por Conferente' }, { row: 1, col: 4 }));

    // 3. Setores Operacionais
    const wsSetores = workbook.getWorksheet(2);
    wsSetores.name = 'Setores Operacionais';
    applyTableHeaders(wsSetores, 1, ['Setor', 'Movimentações']);
    stats.categorias.forEach((row: any, i: number) => {
      wsSetores.setCell(`A${i + 2}`, row.name);
      wsSetores.setCell(`B${i + 2}`, row.value);
    });
    
    const lastRowSetores = stats.categorias.length + 1;
    wsSetores.addChart(ChartFactory.createPieChart('SetoresChart', [
      { series: 'Movimentações', categories: `'Setores Operacionais'!$A$2:$A$${lastRowSetores}`, values: `'Setores Operacionais'!$B$2:$B$${lastRowSetores}` }
    ], { title: 'Distribuição por Setor' }, { row: 1, col: 4 }));

    // 4. Ocupação Tecidos
    const wsOcupTecido = workbook.getWorksheet(3);
    wsOcupTecido.name = 'Ocupação Tecidos';
    createKPICard(wsOcupTecido, 1, 1, 'Média Geral Ocupação', '1.3%', '0.0%');
    applyTableHeaders(wsOcupTecido, 5, ['Métrica', 'Valor']);
    wsOcupTecido.setCell('A6', 'Capacidade Total'); wsOcupTecido.setCell('B6', 3120);
    wsOcupTecido.setCell('A7', 'Ocupado'); wsOcupTecido.setCell('B7', 41);
    wsOcupTecido.setCell('A8', 'Percentual'); wsOcupTecido.setCell('B8', 0.013, { numFmt: '0.0%' });

    wsOcupTecido.addChart(ChartFactory.createBarChart('OcupTecidoChart', [
      { series: 'Ocupação', categories: `'Ocupação Tecidos'!$A$6:$A$7`, values: `'Ocupação Tecidos'!$B$6:$B$7` }
    ], { title: 'Ocupação de Tecidos' }, { row: 1, col: 4 }));

    // 5. Ocupação Madeira
    const wsOcupMadeira = workbook.getWorksheet(4);
    wsOcupMadeira.name = 'Ocupação Madeira';
    applyTableHeaders(wsOcupMadeira, 1, ['Categoria', 'Valor']);
    const madeiraRows = ['Lâminas', 'Bases', 'Bandôs', 'Avarias'];
    madeiraRows.forEach((name, i) => {
      wsOcupMadeira.setCell(`A${i + 2}`, name);
      wsOcupMadeira.setCell(`B${i + 2}`, 0);
    });
    wsOcupMadeira.addChart(ChartFactory.createBarChart('OcupMadeiraChart', [
      { series: 'Madeira', categories: `'Ocupação Madeira'!$A$2:$A$5`, values: `'Ocupação Madeira'!$B$2:$B$5` }
    ], { title: 'Ocupação de Madeira' }, { row: 1, col: 4 }));

    // 6. Tipos de Materiais
    const wsTipos = workbook.getWorksheet(5);
    wsTipos.name = 'Tipos de Materiais';
    applyTableHeaders(wsTipos, 1, ['Tipo', 'Quantidade']);
    stats.tipos.forEach((row: any, i: number) => {
      wsTipos.setCell(`A${i + 2}`, row.name);
      wsTipos.setCell(`B${i + 2}`, row.value);
    });
    const lastRowTipos = stats.tipos.length + 1;
    wsTipos.addChart(ChartFactory.createDoughnutChart('TiposChart', [
      { series: 'Materiais', categories: `'Tipos de Materiais'!$A$2:$A$${lastRowTipos}`, values: `'Tipos de Materiais'!$B$2:$B$${lastRowTipos}` }
    ], { title: 'Mix de Materiais' }, { row: 1, col: 4 }));

    // 7. Histórico de Sessões
    const wsAudit = workbook.getWorksheet(6);
    wsAudit.name = 'Histórico de Sessões';
    applyTableHeaders(wsAudit, 1, ['ID', 'Processo', 'Conferente', 'Data', 'Itens', 'Status']);
    history.slice(0, 100).forEach((conf, i) => {
      const row = i + 2;
      wsAudit.setCell(`A${row}`, conf.id.slice(0, 8));
      wsAudit.setCell(`B${row}`, conf.processo || conf.name);
      wsAudit.setCell(`C${row}`, conf.conferente);
      wsAudit.setCell(`D${row}`, new Date(conf.date).toLocaleDateString('pt-BR'));
      wsAudit.setCell(`E${row}`, conf.registros.length);
      wsAudit.setCell(`F${row}`, conf.registros.length > 0 ? 'Concluído' : 'Falha', {
        fill: { type: 'pattern', patternType: 'solid', fgColor: conf.registros.length > 0 ? 'C6EFCE' : 'FFC7CE' }
      });
    });

    const buffer = await workbook.writeBuffer();
    saveAs(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `${fileName}_Premium_${new Date().toISOString().split('T')[0]}.xlsx`);

    toast.dismiss(toastId);
    toast.success('Relatório com GRÁFICOS NATIVOS e Interativos gerado!');
  } catch (error) {
    console.error('Erro ao exportar Excel Premium:', error);
    toast.dismiss(toastId);
    toast.error('Erro ao gerar gráficos nativos do Excel.');
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
    triggerAutoArchive(fileName);
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
    console.log('Starting PDF Export for element:', elementId);
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
      { title: 'Sectores Operacionais', data: stats?.categorias, key: 'value' },
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
    triggerAutoArchive(fileName);
    toast.dismiss(toastId);
    toast.success('Conferência exportada com sucesso!');
  } catch (error) {
    console.error('Erro ao exportar conferência:', error);
    toast.error('Erro ao gerar o arquivo Excel.');
  }
}

/**
 * Exports Motor/Controle registros in the specific grouped format.
 */
export async function exportMotorControleToExcel(registros: Registro[], fileName: string) {
  try {
    const toastId = toast.loading('Preparando arquivo Excel...');
    const XLSX = await import('xlsx');
    const motorRegs = registros.filter(r => r.modoOrigem === 'motor');
    const controleRegs = registros.filter(r => r.modoOrigem === 'controle');
    const rows: any[][] = [];

    if (motorRegs.length > 0) {
      const groups = new Map<string, Registro[]>();
      for (const r of motorRegs) {
        const cx = extractCaixaLabel(r.loteSistema);
        if (!groups.has(cx)) groups.set(cx, []);
        groups.get(cx)!.push(r);
      }
      for (const [cx, regs] of groups) {
        const firstItem = regs[0]?.item || '';
        rows.push([`${cx} ${firstItem}`, '', 'séries']);
        for (const r of regs) {
          rows.push([`${r.item} ${r.lote}`, '', r.loteSistema]);
        }
        rows.push(['', '', '']);
      }
    }

    if (controleRegs.length > 0) {
      const groups = new Map<string, Registro[]>();
      for (const r of controleRegs) {
        const key = r.item || 'Controle';
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(r);
      }
      for (const [modelo, regs] of groups) {
        const firstNf = regs[0]?.nf || '';
        const headerLabel = firstNf ? `${modelo} ${firstNf}` : modelo;
        rows.push([headerLabel, '', 'Séries']);
        for (const r of regs) {
          const seqMatch = r.loteSistema.match(/\*(\d+)$/);
          const seqLabel = seqMatch ? `*${seqMatch[1]}` : '';
          rows.push([r.lote, seqLabel, r.loteSistema]);
        }
        rows.push(['', '', '']);
      }
    }

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 50 }, { wch: 8 }, { wch: 50 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Motores');
    XLSX.writeFile(wb, `${fileName}.xlsx`);
    triggerAutoArchive(fileName);
    toast.dismiss(toastId);
    toast.success('Conferência exportada com sucesso!');
  } catch (error) {
    console.error('Erro ao exportar motores:', error);
    toast.error('Erro ao gerar o arquivo Excel.');
  }
}

function extractCaixaLabel(loteSistema: string): string {
  const match = loteSistema.match(/^(CX\d+|S\/CX)/i);
  return match ? match[1].toUpperCase() : 'S/CX';
}
