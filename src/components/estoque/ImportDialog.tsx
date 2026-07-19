import { useState, useRef, useCallback, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Upload, Download, FileSpreadsheet, AlertTriangle, CheckCircle2, X, Eye, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAppStore } from '@/store/useAppStore';
import { parseEndereco, ENDERECO_REGEX, fmtML } from '@/lib/app-utils';

interface ImportRow {
  item: string;
  m2: number;
  largura: number;
  m_linear: number;
  lote: string;
  endereco: string;
  lote_sistema: string;
  proc: string;
  valid: boolean;
  error?: string;
}

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: () => void;
}

const COLUMN_MAP: Record<string, string> = {
  'item': 'item', 'código': 'item', 'codigo': 'item', 'cod': 'item', 'ref': 'item',
  'm²': 'm2', 'm2': 'm2', 'metragem': 'm2', 'quantity': 'm2', 'qty': 'm2',
  'largura': 'largura', 'width': 'largura', 'larg': 'largura',
  'm linear': 'm_linear', 'mlinear': 'm_linear', 'm_linear': 'm_linear', 'metro linear': 'm_linear', 'ml': 'm_linear',
  'lote': 'lote', 'lot': 'lote', 'batch': 'lote',
  'endereço': 'endereco', 'endereco': 'endereco', 'address': 'endereco', 'end': 'endereco',
  'lote sistema': 'lote_sistema', 'lote_sistema': 'lote_sistema', 'lote final': 'lote_sistema', 'lotefinal': 'lote_sistema',
  'proc': 'proc', 'processo': 'proc', 'projeto': 'proc',
};

function normalizeHeader(h: string): string | null {
  const clean = h.trim().toLowerCase().replace(/[_\-\.]/g, ' ').replace(/\s+/g, ' ');
  return COLUMN_MAP[clean] || null;
}

/**
 * Generates lote_final for imported items using the same pattern as the app:
 * ENDERECO PROC XXXXX M_LINEAR (e.g. "TEC01.A.N03 PROC 12345 18,2M")
 */
function generateImportLoteFinal(endereco: string, proc: string, mLinear: number): string {
  const parts: string[] = [];
  if (endereco) parts.push(endereco);
  if (proc) parts.push(`PROC ${proc}`);
  parts.push(fmtML(mLinear) || '0M');
  return parts.join(' ');
}

function parseFileRows(rawRows: any[][], headers: string[]): ImportRow[] {
  const colMap: Record<string, number> = {};
  headers.forEach((h, i) => {
    const norm = normalizeHeader(h);
    if (norm && !(norm in colMap)) colMap[norm] = i;
  });

  if (!('item' in colMap)) return [];

  return rawRows.map(row => {
    const get = (key: string) => {
      const idx = colMap[key];
      return idx != null ? String(row[idx] ?? '').trim() : '';
    };
    const getNum = (key: string) => {
      const v = get(key);
      const n = parseFloat(v.replace(',', '.'));
      return isNaN(n) ? 0 : n;
    };

    const item = get('item');
    const m2 = getNum('m2');
    const largura = getNum('largura');
    const mLinear = getNum('m_linear');
    const lote = get('lote');
    const endereco = get('endereco').toUpperCase();
    const proc = get('proc');
    
    let error: string | undefined;
    if (!item) error = 'Item obrigatório';
    else if (!endereco) error = 'Endereço obrigatório (ex: TEC01.A.N03)';
    else if (endereco && !ENDERECO_REGEX.test(endereco)) error = `Endereço inválido: ${endereco}`;

    // Generate lote_final using same pattern as app
    const loteFinal = generateImportLoteFinal(endereco, proc, mLinear);

    return {
      item, m2, largura, m_linear: mLinear, lote, endereco, lote_sistema: loteFinal,
      proc, valid: !error, error,
    };
  }).filter(r => r.item || r.lote);
}

async function parseXlsx(file: File): Promise<{ headers: string[]; rows: any[][] }> {
  const XLSX = await import('xlsx');
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const data: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  if (data.length < 2) return { headers: [], rows: [] };
  return { headers: data[0].map(String), rows: data.slice(1) };
}

async function parseTxt(file: File): Promise<{ headers: string[]; rows: any[][] }> {
  const text = await file.text();
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return { headers: [], rows: [] };
  const sep = lines[0].includes('\t') ? '\t' : lines[0].includes(';') ? ';' : ',';
  const headers = lines[0].split(sep);
  const rows = lines.slice(1).map(l => l.split(sep));
  return { headers, rows };
}

async function downloadTemplate() {
  try {
    const XLSX = await import('xlsx');
    const headers = ['ITEM', 'M²', 'PROC', 'LARGURA', 'M LINEAR', 'LOTE', 'ENDEREÇO'];
    const example = [
      ['RB-45-2201-140', 25.5, '12345', 1.40, 18.2, 'ABC123', 'TEC01.A.N03'],
      ['CL-20-1199-160', 38.4, '67890', 1.60, 24.0, 'XYZ456', 'TEC02.B.N05'],
      ['SF-33-3001-150', 11.1, '', 1.50, 7.4, 'JKL789', 'TEC01.C.N02'],
    ];
    
    const ws = XLSX.utils.aoa_to_sheet([headers, ...example]);
    ws['!cols'] = [
      { wch: 20 }, { wch: 8 }, { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 18 }, { wch: 16 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, 'template_importacao_estoque.xlsx');
    toast.success('Template .xlsx baixado!');
  } catch {
    toast.error('Erro ao gerar template.');
  }
}

export default function ImportDialog({ open, onOpenChange, onImportComplete }: ImportDialogProps) {
  const conferente = useAppStore(s => s.conferente);
  const [step, setStep] = useState<'upload' | 'preview'>('upload');
  const [parsedRows, setParsedRows] = useState<ImportRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [importing, setImporting] = useState(false);
  const [showExample, setShowExample] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const validRows = useMemo(() => parsedRows.filter(r => r.valid), [parsedRows]);
  const invalidRows = useMemo(() => parsedRows.filter(r => !r.valid), [parsedRows]);

  const resetState = useCallback(() => {
    setStep('upload');
    setParsedRows([]);
    setFileName('');
    setImporting(false);
    setShowExample(false);
  }, []);

  const handleFile = useCallback(async (file: File) => {
    const name = file.name.toLowerCase();
    setFileName(file.name);

    try {
      let result: { headers: string[]; rows: any[][] };

      if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
        result = await parseXlsx(file);
      } else if (name.endsWith('.csv') || name.endsWith('.txt')) {
        result = await parseTxt(file);
      } else {
        toast.error('Formato não suportado. Use XLSX, XLS, CSV ou TXT.');
        return;
      }

      if (!result.headers.length) {
        toast.error('Arquivo vazio ou sem cabeçalhos reconhecidos.');
        return;
      }

      const hasItem = result.headers.some(h => normalizeHeader(h) === 'item');
      if (!hasItem) {
        toast.error('Coluna "ITEM" não encontrada. Verifique o formato.');
        return;
      }

      const rows = parseFileRows(result.rows, result.headers);
      if (rows.length === 0) {
        toast.error('Nenhuma linha válida encontrada no arquivo.');
        return;
      }

      setParsedRows(rows);
      setStep('preview');
    } catch (e: any) {
      console.error('Erro ao processar arquivo:', e);
      toast.error('Erro ao ler o arquivo: ' + (e.message || 'formato inválido'));
    }
  }, []);

  const handleImport = useCallback(async () => {
    if (!validRows.length) return;
    if (!conferente) {
      toast.warning('Preencha o campo CONFERENTE no topo antes de importar.');
      return;
    }

    setImporting(true);
    try {
      const structures = [...new Set(
        validRows
          .map(r => {
            const addr = r.endereco;
            const parsed = parseEndereco(addr);
            return parsed?.estrutura;
          })
          .filter(Boolean) as string[]
      )];

      const { data: dbOccupied } = await supabase
        .from('estoque_posicoes')
        .select('estrutura, coluna, nivel, posicao')
        .in('estrutura', structures.length > 0 ? structures : ['__none__']);

      const occupiedMap = new Map<string, Set<number>>();
      (dbOccupied || []).forEach(p => {
        const key = `${p.estrutura}.${p.coluna}.${p.nivel}`;
        if (!occupiedMap.has(key)) occupiedMap.set(key, new Set());
        occupiedMap.get(key)!.add(p.posicao);
      });

      const rowsToInsert: any[] = [];
      const skipped: string[] = [];

      // Track lote_sistema duplicates to add suffixes
      const loteCount = new Map<string, number>();

      for (const row of validRows) {
        const addr = row.endereco;
        const parsed = parseEndereco(addr);
        if (!parsed) {
          skipped.push(row.item);
          continue;
        }

        const { estrutura, coluna, nivel } = parsed;
        const cellKey = `${estrutura}.${coluna}.${nivel}`;
        if (!occupiedMap.has(cellKey)) occupiedMap.set(cellKey, new Set());
        const occupied = occupiedMap.get(cellKey)!;

        let pos = 1;
        while (pos <= 30 && occupied.has(pos)) pos++;
        if (pos > 30) {
          skipped.push(row.item);
          continue;
        }

        // Handle duplicate lote_sistema by appending suffix
        let loteFinal = row.lote_sistema;
        const count = loteCount.get(loteFinal) || 0;
        if (count > 0) {
          loteFinal = `${loteFinal}-${count}`;
        }
        loteCount.set(row.lote_sistema, count + 1);

        occupied.add(pos);
        rowsToInsert.push({
          estrutura, coluna, nivel, posicao: pos,
          status: 'ocupado',
          item: row.item,
          proc: row.proc || '',
          m2: row.m2,
          largura: row.largura,
          m_linear: row.m_linear,
          lote: row.lote,
          endereco: addr,
          lote_sistema: loteFinal,
          conferente_entrada: conferente,
          conferente_saida: '',
          data_registro: new Date().toISOString(),
        });
      }

      if (rowsToInsert.length > 0) {
        for (let i = 0; i < rowsToInsert.length; i += 100) {
          const batch = rowsToInsert.slice(i, i + 100);
          const { error } = await supabase.from('estoque_posicoes').upsert(batch, {
            onConflict: 'estrutura,coluna,nivel,posicao',
          });
          if (error) throw error;
        }
      }

      const msg = `${rowsToInsert.length} tecidos importados com sucesso!`;
      if (skipped.length > 0) {
        toast.warning(`${msg} (${skipped.length} ignorados por endereço cheio/inválido)`);
      } else {
        toast.success(msg);
      }

      onImportComplete();
      onOpenChange(false);
      resetState();
    } catch (e: any) {
      console.error('Erro na importação:', e);
      toast.error('Erro ao importar: ' + (e.message || 'falha desconhecida'));
    } finally {
      setImporting(false);
    }
  }, [validRows, conferente, onImportComplete, onOpenChange, resetState]);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetState(); onOpenChange(v); }}>
      <DialogContent className="max-w-[95vw] sm:max-w-3xl p-0 gap-0 border-border/40 bg-card overflow-hidden rounded-md max-h-[90vh] overflow-y-auto">
        <div className="px-5 sm:px-8 pt-6 pb-4 border-b border-border/20 bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-md bg-primary/10 border border-primary/20 text-primary">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg sm:text-xl font-semibold tracking-tight">
                Importar Tecidos
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground font-medium mt-0.5">
                {step === 'upload' ? 'Selecione um arquivo para importar' : `${parsedRows.length} linhas encontradas em ${fileName}`}
              </DialogDescription>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-8 space-y-5">
          {step === 'upload' && (
            <>
              <div className="bg-primary/5 border border-primary/20 rounded-md p-4 space-y-2">
                <div className="flex items-center gap-2 text-primary font-bold text-sm">
                  <Info className="w-4 h-4" />
                  Formato Esperado
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  O arquivo deve conter as colunas: <span className="font-bold text-foreground">ITEM</span>, <span className="font-bold text-foreground">M²</span>, <span className="font-bold text-foreground">PROC</span>, <span className="font-bold text-foreground">LARGURA</span>, <span className="font-bold text-foreground">M LINEAR</span>, <span className="font-bold text-foreground">LOTE</span> e <span className="font-bold text-foreground">ENDEREÇO</span>.
                  <br />
                  <span className="text-primary font-bold">Lote Final</span> será gerado automaticamente: <code className="bg-muted/50 px-1 rounded text-[10px]">ENDEREÇO + PROC + M LINEAR</code>
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Button variant="outline" size="sm" className="h-8 text-xs font-bold rounded-lg" onClick={downloadTemplate}>
                    <Download className="w-3.5 h-3.5 mr-1.5" />
                    Baixar Template (.xlsx)
                  </Button>
                </div>
              </div>

              <div
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
                className="border-2 border-dashed border-border/40 rounded-md p-8 sm:p-12 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all"
              >
                <FileSpreadsheet className="w-10 h-10 text-muted-foreground/40" />
                <div className="text-center">
                  <p className="text-sm font-bold text-foreground">Clique ou arraste um arquivo aqui</p>
                  <p className="text-[10px] text-muted-foreground font-medium mt-1">
                    Formatos aceitos: XLSX, XLS, CSV, TXT
                  </p>
                </div>
                <div className="flex gap-1.5 mt-1">
                  {['XLSX', 'XLS', 'CSV', 'TXT'].map(ext => (
                    <Badge key={ext} variant="outline" className="text-[8px] font-bold px-1.5 py-0.5 rounded-md border-border/30">
                      .{ext}
                    </Badge>
                  ))}
                </div>
              </div>

              <input
                ref={fileRef}
                type="file"
                className="hidden"
                accept=".xlsx,.xls,.csv,.txt"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
              />
            </>
          )}

          {step === 'preview' && (
            <>
              <div className="flex gap-3">
                <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg px-3 py-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-xs font-bold">{validRows.length} válidos</span>
                </div>
                {invalidRows.length > 0 && (
                  <div className="flex items-center gap-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg px-3 py-2">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-xs font-bold">{invalidRows.length} com erro</span>
                  </div>
                )}
              </div>

              <div className="overflow-x-auto rounded-md border border-border/30">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-muted/30 border-b border-border/20">
                      <th className="px-3 py-2.5 text-left font-semibold text-[10px] uppercase tracking-wider text-muted-foreground/70">Status</th>
                      <th className="px-3 py-2.5 text-left font-semibold text-[10px] uppercase tracking-wider text-muted-foreground/70">Item</th>
                      <th className="px-3 py-2.5 text-right font-semibold text-[10px] uppercase tracking-wider text-muted-foreground/70">M²</th>
                      <th className="px-3 py-2.5 text-left font-semibold text-[10px] uppercase tracking-wider text-muted-foreground/70">PROC</th>
                      <th className="px-3 py-2.5 text-right font-semibold text-[10px] uppercase tracking-wider text-muted-foreground/70">Largura</th>
                      <th className="px-3 py-2.5 text-right font-semibold text-[10px] uppercase tracking-wider text-muted-foreground/70">M Linear</th>
                      <th className="px-3 py-2.5 text-left font-semibold text-[10px] uppercase tracking-wider text-muted-foreground/70">Lote</th>
                      <th className="px-3 py-2.5 text-left font-semibold text-[10px] uppercase tracking-wider text-muted-foreground/70">Endereço</th>
                      <th className="px-3 py-2.5 text-left font-semibold text-[10px] uppercase tracking-wider text-muted-foreground/70">Lote Final</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedRows.slice(0, 50).map((row, i) => (
                      <tr key={i} className={`border-b border-border/10 ${!row.valid ? 'bg-red-500/5' : ''}`}>
                        <td className="px-3 py-2">
                          {row.valid ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <span title={row.error}>
                              <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 font-bold text-foreground">{row.item || '—'}</td>
                        <td className="px-3 py-2 text-right font-mono text-muted-foreground tabular-nums">{row.m2 || '—'}</td>
                        <td className="px-3 py-2 font-mono text-muted-foreground tabular-nums">{row.proc || '—'}</td>
                        <td className="px-3 py-2 text-right font-mono text-muted-foreground tabular-nums">{row.largura || '—'}</td>
                        <td className="px-3 py-2 text-right font-mono text-muted-foreground tabular-nums">{row.m_linear || '—'}</td>
                        <td className="px-3 py-2 font-mono text-muted-foreground truncate max-w-[120px] tabular-nums">{row.lote || '—'}</td>
                        <td className="px-3 py-2 font-mono text-muted-foreground tabular-nums">{row.endereco || '—'}</td>
                        <td className="px-3 py-2 font-mono text-primary font-bold truncate max-w-[160px] tabular-nums">{row.lote_sistema || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsedRows.length > 50 && (
                  <div className="px-3 py-2 text-xs text-muted-foreground bg-muted/10 text-center font-medium">
                    Mostrando 50 de {parsedRows.length} linhas
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={resetState} className="flex-1 h-11 rounded-md font-bold">
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={importing || validRows.length === 0}
                  className="flex-1 h-11 rounded-md font-semibold bg-primary shadow-lg shadow-primary/20"
                >
                  {importing ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Importando...
                    </div>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Importar {validRows.length} tecidos
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
