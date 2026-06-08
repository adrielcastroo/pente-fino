import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

interface ExportCyclicInventoryParams {
  itemCode: string;
  referenceDate: string;
  scans: {
    timestamp: string;
    itemCode: string;
    inspectorName: string;
  }[];
}

export const exportCyclicInventoryXLSX = ({ itemCode, referenceDate, scans }: ExportCyclicInventoryParams) => {
  // Create workbook
  const wb = XLSX.utils.book_new();
  
  // Prepare data rows
  // Top of the table according to request
  const headerData = [
    ['CÓDIGO DO ITEM', itemCode],
    ['DATA DA CONTAGEM', referenceDate],
    [], // Empty row
    ['DATA/HORA BIPAGEM', 'CÓDIGO DO ITEM', 'CONFERENTE']
  ];
  
  // Below the top of the table according to request
  const scanRows = scans.map(scan => [
    scan.timestamp,
    scan.itemCode,
    scan.inspectorName
  ]);
  
  const allData = [...headerData, ...scanRows];
  
  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(allData);
  
  // Apply some basic styling (widths)
  const wscols = [
    { wch: 25 }, // Date/Time
    { wch: 20 }, // Item Code
    { wch: 20 }, // Inspector
  ];
  ws['!cols'] = wscols;
  
  // Add to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Conferência');
  
  // Generate buffer
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  
  // Save file
  const fileName = `conferencia_${itemCode}_${referenceDate.replace(/\//g, '-')}.xlsx`;
  saveAs(data, fileName);
};
