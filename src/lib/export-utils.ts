import { toast } from 'sonner';

/**
 * Dynamically imports the 'xlsx' library and exports data to an Excel file.
 * This reduces the initial bundle size as 'xlsx' is only loaded when needed.
 */
export async function exportToExcel(data: any[], fileName: string) {
  try {
    const toastId = toast.loading('Preparando arquivo Excel...');
    
    // Dynamically import xlsx
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
