import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { formatDateBR } from './app-utils';

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

interface ExportAllocationParams {
  data: {
    timestamp: string;
    conferente: string;
    item: string;
    lote: string;
    origem: string;
    destino: string;
  } | {
    timestamp: string;
    conferente: string;
    item: string;
    lote: string;
    origem: string;
    destino: string;
  }[];
}

export const exportAllocationXLSX = ({ data }: ExportAllocationParams) => {
  const wb = XLSX.utils.book_new();
  
  const headers = ['DATA/HORA', 'CONFERENTE', 'ITEM/DESCRIÇÃO', 'LOTE', 'ENDEREÇO ORIGEM', 'ENDEREÇO DESTINO'];
  
  const dataArray = Array.isArray(data) ? data : [data];
  
  const rows = dataArray.map(item => [
    item.timestamp,
    item.conferente,
    item.item,
    item.lote,
    item.origem,
    item.destino
  ]);
  
  const wsData = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  
  const wscols = [
    { wch: 20 }, // Data/Hora
    { wch: 20 }, // Conferente
    { wch: 30 }, // Item
    { wch: 20 }, // Lote
    { wch: 20 }, // Origem
    { wch: 20 }, // Destino
  ];
  ws['!cols'] = wscols;
  
  XLSX.utils.book_append_sheet(wb, ws, 'Alocações');
  
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  
  const fileName = `alocacoes_wms_${new Date().getTime()}.xlsx`;
  saveAs(blob, fileName);
};
