import { Workbook, addrFromRC } from 'xml-xlsx-lite';
const wb = new Workbook();
const ws = wb.getWorksheet('Test');
// Conditional formatting check: looking for common names in dist if possible
// Since I can't easily grep inside the bundle, I'll check the Workbook methods in memory
console.log('Workbook methods:', Object.keys(wb));
console.log('Worksheet methods:', Object.keys(ws));
