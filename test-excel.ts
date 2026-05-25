import { Workbook, ChartFactory } from 'xml-xlsx-lite';

async function test() {
  const wb = new Workbook();
  const ws = wb.getWorksheet('Sheet1');
  ws.setCell('A1', 'Label');
  ws.setCell('B1', 'Value');
  ws.setCell('A2', 'A');
  ws.setCell('B2', 10);
  ws.setCell('A3', 'B');
  ws.setCell('B3', 20);
  
  const chart = ChartFactory.createColumnChart('Test Chart', [
    {
      series: 'Series 1',
      categories: 'Sheet1!$A$2:$A$3',
      values: 'Sheet1!$B$2:$B$3'
    }
  ], { title: 'Test' }, { row: 5, col: 1 });
  
  ws.addChart(chart);
  const buffer = await wb.writeBuffer();
  console.log('Buffer generated:', buffer.byteLength);
}

test().catch(console.error);
