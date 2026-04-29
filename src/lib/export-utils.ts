import { toast } from 'sonner';
import { Registro } from '@/types';

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
    toast.dismiss(toastId);
    toast.success('Relatório exportado com sucesso!');
  } catch (error) {
    console.error('Erro ao exportar Excel:', error);
    toast.error('Erro ao gerar o arquivo Excel.');
  }
}

/**
 * Generates a professional PDF report of the dashboard using jsPDF and html2canvas.
 */
export async function exportDashboardToPDF(elementId: string, fileName: string) {
  try {
    const toastId = toast.loading('Gerando relatório PDF de alta qualidade...');
    
    const [jsPDF, html2canvas] = await Promise.all([
      import('jspdf').then(m => m.default),
      import('html2canvas').then(m => m.default)
    ]);

    const element = document.getElementById(elementId);
    if (!element) {
      toast.error('Dashboard não encontrado para exportação.');
      return;
    }

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - (margin * 2);
    let currentY = 20;

    // 1. Professional Header
    pdf.setFillColor(249, 250, 251); // Light gray background for header
    pdf.rect(0, 0, pageWidth, 45, 'F');
    
    pdf.setFontSize(22);
    pdf.setTextColor(17, 24, 39); // Slate 900
    pdf.setFont('helvetica', 'bold');
    pdf.text('Relatório Executivo de Performance', margin, 25);
    
    pdf.setFontSize(10);
    pdf.setTextColor(107, 114, 128); // Slate 500
    pdf.setFont('helvetica', 'normal');
    const now = new Date().toLocaleString('pt-BR');
    pdf.text(`Data de Emissão: ${now} | Documento Oficial de Gestão`, margin, 32);
    
    pdf.setDrawColor(229, 231, 235);
    pdf.line(margin, 38, pageWidth - margin, 38);

    currentY = 55;

    // Helper to capture and add elements safely
    const addElementToPdf = async (el: HTMLElement, title?: string, forceNewPage = false) => {
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        onclone: (clonedDoc) => {
          const clonedEl = clonedDoc.getElementById(el.id) || (clonedDoc.body.querySelector(`[data-pdf-id="${el.getAttribute('data-pdf-id')}"]`) as HTMLElement);
          if (clonedEl) {
            clonedEl.style.padding = '20px';
            clonedEl.style.margin = '0';
            clonedEl.querySelectorAll('button, .no-print').forEach(btn => (btn as HTMLElement).style.display = 'none');
          }
        }
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const imgWidth = contentWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      if (forceNewPage || (currentY + imgHeight > pageHeight - 30)) {
        pdf.addPage();
        currentY = 20;
      }

      if (title) {
        pdf.setFontSize(14);
        pdf.setTextColor(31, 41, 55);
        pdf.setFont('helvetica', 'bold');
        pdf.text(title, margin, currentY);
        currentY += 8;
      }

      pdf.addImage(imgData, 'JPEG', margin, currentY, imgWidth, imgHeight);
      currentY += imgHeight + 15;
    };

    // 2. Summary Section (Stats)
    const statsContainer = element.querySelector('.grid-cols-1.md\\:grid-cols-3') as HTMLElement;
    if (statsContainer) {
      await addElementToPdf(statsContainer, 'Indicadores Chave de Desempenho (KPIs)');
    }

    // 3. Charts Section
    const charts = Array.from(element.querySelectorAll('.recharts-responsive-container')).map(c => c.closest('.rounded-\\[3rem\\], .rounded-\\[2\\.5rem\\]')) as HTMLElement[];
    
    for (let i = 0; i < charts.length; i++) {
      const chart = charts[i];
      const titles = ['Tendência de Operações', 'Distribuição por Conferente', 'Sectores Operacionais', 'Tipos de Materiais', 'Histórico de Sessões'];
      await addElementToPdf(chart, titles[i] || 'Análise de Dados');
    }

    // 4. Page Numbering & Footer
    const totalPages = (pdf as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setDrawColor(243, 244, 246);
      pdf.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
      
      pdf.setFontSize(8);
      pdf.setTextColor(156, 163, 175);
      pdf.text(`Relatório de Dashboard - Confidencial`, margin, pageHeight - 10);
      pdf.text(`Página ${i} de ${totalPages}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
    }

    pdf.save(`${fileName}_${new Date().toISOString().split('T')[0]}.pdf`);
    
    toast.dismiss(toastId);
    toast.success('Relatório PDF profissional gerado!');
  } catch (error) {
    console.error('Erro ao exportar PDF:', error);
    toast.error('Falha ao gerar o relatório PDF executivo.');
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

    toast.dismiss(toastId);
    toast.success('Conferência exportada com sucesso!');
  } catch (error) {
    console.error('Erro ao exportar motores:', error);
    toast.error('Erro ao gerar o arquivo Excel.');
  }
}
