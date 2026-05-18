import { toast } from 'sonner';
import { Registro } from '@/types';
import { useAppStore } from '@/store/useAppStore';

const triggerAutoArchive = async (fileName: string) => {
  try {
    const store = useAppStore.getState();
    if (store.registros.length > 0) {
      await store.archiveAndClear(fileName, true);
      // resetFormData already cleans fields based on mode
      store.resetFormData();
      store.resetMotorFormData();
      toast.info('Dados arquivados em histórico e campos limpos.');
    }
  } catch (error) {
    console.error('Erro no arquivamento automático após exportação:', error);
  }
};

/**
 * Dynamically imports the 'xlsx' library and exports data to an Excel file.
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


    // Importante: Em ambientes de módulos (como o Vite/React aqui), 
    // o plugin jspdf-autotable geralmente precisa ser inicializado manualmente 
    // ou acessado via exportação padrão.


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

    // Validamos se a biblioteca autoTable foi carregada corretamente
    if (typeof autoTable !== 'function') {
      console.error('Erro: autoTable não é uma função. Verifique a importação do jspdf-autotable.');
      throw new Error('Plugin de tabelas (autoTable) não carregado.');
    }




    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - (margin * 2);
    let currentY = margin;

    // Helper for Headers
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

    // Helper for Footers
    const addFooter = (doc: any, pageNum: number, totalPages: number) => {
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(`Página ${pageNum} de ${totalPages} | SaaS Premium - Inteligência de Dados`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    };

    // Initial Header
    addHeader(pdf, 'Dashboard - Relatório Executivo');
    currentY = 35;

    // 1. Stats Summary Table
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


    // 2. Charts Sections
    const chartContexts = [
      { title: 'Volume de Operações', data: stats?.timeline, key: 'total' },
      { title: 'Produção por Conferente', data: stats?.topConferentes, key: 'count' },
      { title: 'Sectores Operacionais', data: stats?.categorias, key: 'value' },
      { title: 'Tipos de Materiais', data: stats?.tipos, key: 'value' }
    ];

    const chartContainers = Array.from(element.querySelectorAll('.recharts-responsive-container'))
      .map(c => c.closest('.rounded-\\[3rem\\], .rounded-\\[2\\.5rem\\]'))
      .filter((c): c is HTMLElement => c !== null);
    
    console.log(`Found ${chartContainers.length} chart containers to export.`);


    for (let i = 0; i < Math.min(chartContainers.length, chartContexts.length); i++) {
      const container = chartContainers[i];
      const context = chartContexts[i];

      // Capture Chart
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: true, // Habilitar logging temporariamente para debug
        allowTaint: true
      });


      const imgWidth = contentWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Check for page break (Title + Chart + Table)
      if (currentY + imgHeight + 40 > pageHeight) {
        pdf.addPage();
        addHeader(pdf, 'Dashboard - Relatório Executivo');
        currentY = 35;
      }

      // Title
      pdf.setFontSize(11);
      pdf.setTextColor(30, 41, 59);
      pdf.setFont('helvetica', 'bold');
      pdf.text(context.title, margin, currentY);
      currentY += 5;

      // Chart Image
      const imgData = canvas.toDataURL('image/png'); // Usando PNG para evitar problemas de compressão inicial
      pdf.addImage(imgData, 'PNG', margin, currentY, imgWidth, imgHeight, undefined, 'FAST');

      currentY += imgHeight + 10;

      // Support Table
      if (context.data && Array.isArray(context.data) && context.data.length > 0) {
        const tableData = context.data
          .filter(item => item && (item.name || item.date)) // Validar item
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

    // Add Page Numbers to all pages
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
 * Extract caixa label from loteSistema (e.g. "CX01 NFe 146842 NT..." -> "CX01")
 */
function extractCaixaLabel(loteSistema: string): string {
  const match = loteSistema.match(/^(CX\d+|S\/CX)/i);
  return match ? match[1].toUpperCase() : 'S/CX';
}

/**
 * Exports Motor/Controle registros in the specific grouped format:
 * - Motor: grouped by caixa, Col A = "item lote", Col B (yellow) = loteSistema
 * - Controle: grouped by modelo, Col A = raw lote, Col B = *seq, Col C (yellow) = loteSistema
 */
export async function exportMotorControleToExcel(registros: Registro[], fileName: string) {
  try {
    const toastId = toast.loading('Preparando arquivo Excel...');
    const XLSX = await import('xlsx');

    const motorRegs = registros.filter(r => r.modoOrigem === 'motor');
    const controleRegs = registros.filter(r => r.modoOrigem === 'controle');

    const rows: any[][] = [];

    // ── Motor section ──
    if (motorRegs.length > 0) {
      // Group by caixa
      const groups = new Map<string, Registro[]>();
      for (const r of motorRegs) {
        const cx = extractCaixaLabel(r.loteSistema);
        if (!groups.has(cx)) groups.set(cx, []);
        groups.get(cx)!.push(r);
      }

      for (const [cx, regs] of groups) {
        // Header row: "CX01 itemCode" | "" | "séries"
        const firstItem = regs[0]?.item || '';
        rows.push([`${cx} ${firstItem}`, '', 'séries']);
        
        for (const r of regs) {
          rows.push([
            `${r.item} ${r.lote}`,   // Col A: raw entry
            '',                        // Col B: spacer
            r.loteSistema              // Col C: séries (yellow)
          ]);
        }
        
        // Empty row between groups
        rows.push(['', '', '']);
      }
    }

    // ── Controle section ──
    if (controleRegs.length > 0) {
      // Group by modelo (item)
      const groups = new Map<string, Registro[]>();
      for (const r of controleRegs) {
        const key = r.item || 'Controle';
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(r);
      }

      for (const [modelo, regs] of groups) {
        // Header row: "SI 5 PU 1870421" | "" | "Séries"
        const firstNf = regs[0]?.nf || '';
        const headerLabel = firstNf ? `${modelo} ${firstNf}` : modelo;
        rows.push([headerLabel, '', 'Séries']);
        
        for (const r of regs) {
          // Extract *seq from loteSistema
          const seqMatch = r.loteSistema.match(/\*(\d+)$/);
          const seqLabel = seqMatch ? `*${seqMatch[1]}` : '';
          
          rows.push([
            r.lote,        // Col A: raw barcode/serie
            seqLabel,      // Col B: *seq number
            r.loteSistema  // Col C: séries (yellow)
          ]);
        }
        
        rows.push(['', '', '']);
      }
    }

    const ws = XLSX.utils.aoa_to_sheet(rows);

    // Set column widths
    ws['!cols'] = [
      { wch: 50 },  // Col A: raw data (wide for barcodes)
      { wch: 8 },   // Col B: seq number
      { wch: 50 },  // Col C: séries
    ];

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
