import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Upload, Download, FileSpreadsheet, AlertTriangle, CheckCircle2, X, Info, TreePine } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAppStore } from '@/store/useAppStore';
import { lotesMestresService, type LoteMestre } from '@/services/lotesMestresService';
import { generateLoteSistemaCaixa } from '@/lib/app-utils';

interface MadeiraImportRow {
  item: string;
  quantidade: number;
  lote: string;
  endereco: string;
  processo: string;
  tonalidade_id: string | null;
  tonalidade_nome: string;
  tipo: 'Lâmina' | 'Base' | 'Bandô';
  largura: number;
  m_linear: number;
  valid: boolean;
  error?: string;
  lote_sistema?: string;
}

interface MadeiraImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: () => void;
}

const MADEIRA_COLUMN_MAP: Record<string, string> = {
  'item': 'item', 'código': 'item', 'codigo': 'item', 'ref': 'item',
  'quantidade': 'quantidade', 'qtd': 'quantidade', 'qty': 'quantidade',
  'lote': 'lote', 'batch': 'lote',
  'endereço': 'endereco', 'endereco': 'endereco', 'end': 'endereco',
  'processo': 'processo', 'proc': 'processo',
  'tonalidade': 'tonalidade', 'cor': 'tonalidade', 'lote mestre': 'tonalidade',
  'tipo': 'tipo', 'categoria': 'tipo',
  'largura': 'largura', 'width': 'largura',
  'm linear': 'm_linear', 'mlinear': 'm_linear', 'ml': 'm_linear',
};

function normalizeHeader(h: string): string | null {
  const clean = h.trim().toLowerCase().replace(/[_\-\.]/g, ' ').replace(/\s+/g, ' ');
  return MADEIRA_COLUMN_MAP[clean] || null;
}

export default function MadeiraImportDialog({ open, onOpenChange, onImportComplete }: MadeiraImportDialogProps) {
  const conferente = useAppStore(s => s.conferente);
  const [step, setStep] = useState<'upload' | 'preview'>('upload');
  const [parsedRows, setParsedRows] = useState<MadeiraImportRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [importing, setImporting] = useState(false);
  const [lotesMestres, setLotesMestres] = useState<LoteMestre[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      lotesMestresService.list().then(setLotesMestres).catch(console.error);
    }
  }, [open]);

  const validRows = useMemo(() => parsedRows.filter(r => r.valid), [parsedRows]);
  const invalidRows = useMemo(() => parsedRows.filter(r => !r.valid), [parsedRows]);

  const resetState = useCallback(() => {
    setStep('upload');
    setParsedRows([]);
    setFileName('');
    setImporting(false);
  }, []);

  const parseFileRows = useCallback((rawRows: any[][], headers: string[]): MadeiraImportRow[] => {
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
      const quantidade = getNum('quantidade') || 0;
      const lote = get('lote');
      const endereco = get('endereco').toUpperCase();
      const processo = get('processo');
      const tonalidade_nome = get('tonalidade');
      const tipoRaw = get('tipo');
      const largura = getNum('largura');
      const m_linear = getNum('m_linear');

      let tipo: 'Lâmina' | 'Base' | 'Bandô' = 'Lâmina';
      const tLow = tipoRaw.toLowerCase();
      if (tLow.includes('base')) tipo = 'Base';
      else if (tLow.includes('band')) tipo = 'Bandô';

      // Find tonalidade ID
      const lotMestre = lotesMestres.find(l => 
        l.nome.toLowerCase() === tonalidade_nome.toLowerCase()
      );

      let error: string | undefined;
      if (!item) error = 'Item obrigatório';
      else if (!endereco) error = 'Endereço obrigatório';

      return {
        item, quantidade, lote, endereco, processo,
        tonalidade_id: lotMestre?.id || null,
        tonalidade_nome,
        tipo, largura, m_linear,
        valid: !error, error,
      };
    }).filter(r => r.item || r.lote);
  }, [lotesMestres]);

  const handleFile = useCallback(async (file: File) => {
    const name = file.name.toLowerCase();
    setFileName(file.name);

    try {
      let result: { headers: string[]; rows: any[][] };

      if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
        const XLSX = await import('xlsx');
        const buf = await file.arrayBuffer();
        const wb = XLSX.read(buf, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
        result = data.length < 2 ? { headers: [], rows: [] } : { headers: data[0].map(String), rows: data.slice(1) };
      } else if (name.endsWith('.csv') || name.endsWith('.txt')) {
        const text = await file.text();
        const lines = text.split(/\r?\n/).filter(l => l.trim());
        if (lines.length < 2) result = { headers: [], rows: [] };
        else {
          const sep = lines[0].includes('\t') ? '\t' : lines[0].includes(';') ? ';' : ',';
          const headers = lines[0].split(sep);
          const rows = lines.slice(1).map(l => l.split(sep));
          result = { headers, rows };
        }
      } else {
        toast.error('Formato não suportado. Use XLSX, XLS, CSV ou TXT.');
        return;
      }

      if (!result.headers.length) {
        toast.error('Arquivo vazio ou sem cabeçalhos reconhecidos.');
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
      toast.error('Erro ao ler o arquivo: ' + (e.message || 'formato inválido'));
    }
  }, [parseFileRows]);

  const downloadTemplate = async () => {
    try {
      const XLSX = await import('xlsx');
      const headers = ['ITEM', 'PROCESSO', 'QUANTIDADE', 'LOTE', 'ENDEREÇO', 'TONALIDADE', 'TIPO', 'LARGURA', 'M LINEAR'];
      const example = [
        ['MAD-LAM-01', '12345', 100, 'LOTE-A', 'MAD01.A.N01', lotesMestres[0]?.nome || 'Tonalidade 1', 'Lâmina', 0, 0],
        ['MAD-BAS-02', '12346', 24, 'LOTE-B', 'MAD01.B.N02', lotesMestres[1]?.nome || 'Tonalidade 2', 'Base', 0, 0],
      ];
      const ws = XLSX.utils.aoa_to_sheet([headers, ...example]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Template Madeira');
      XLSX.writeFile(wb, 'template_importacao_madeira.xlsx');
      toast.success('Template baixado!');
    } catch {
      toast.error('Erro ao gerar template.');
    }
  };

  const handleImport = async () => {
    if (!validRows.length) return;
    if (!conferente) {
      toast.warning('Defina o conferente antes de importar.');
      return;
    }

    setImporting(true);
    try {
      // For system lotes, we need existing records to avoid collisions
      const { data: existingRegs } = await supabase
        .from('registros')
        .select('id, item, nf, lote_sistema, modo_origem')
        .eq('modo_origem', 'madeira');

      const mappedExisting = (existingRegs || []).map(r => ({
        id: r.id,
        item: r.item,
        processo: r.nf, // nf is used as processo for madeira
        loteSistema: r.lote_sistema,
      })) as any[];

      const rowsToInsert = validRows.map(row => {
        const loteSistema = generateLoteSistemaCaixa(row.processo, row.item, 0, mappedExisting);
        
        // Add current row to local "existing" to avoid same-batch collisions
        mappedExisting.push({
          item: row.item,
          processo: row.processo,
          loteSistema
        });

        return {
          item: row.item,
          nf: row.processo, // Mapping processo to nf column
          endereco: row.endereco,
          lote: row.lote,
          lote_sistema: loteSistema,
          quantidade: row.quantidade,
          tipo_tecido: row.tipo,
          lote_mestre_id: row.tonalidade_id,
          largura: row.largura,
          m_linear: row.m_linear,
          modo_origem: 'madeira',
          edited_by: conferente,
          created_at: new Date().toISOString(),
        };
      });

      const { error } = await supabase.from('registros').insert(rowsToInsert);
      if (error) throw error;

      toast.success(`${rowsToInsert.length} itens de madeira importados!`);
      onImportComplete();
      onOpenChange(false);
      resetState();
    } catch (e: any) {
      console.error(e);
      toast.error('Erro ao importar: ' + e.message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetState(); onOpenChange(v); }}>
      <DialogContent className="max-w-[95vw] sm:max-w-4xl p-0 gap-0 border-border/40 bg-card overflow-hidden rounded-2xl max-h-[90vh] flex flex-col">
        <div className="px-5 sm:px-8 pt-6 pb-4 border-b border-border/20 bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary">
              <TreePine className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg sm:text-xl font-black tracking-tight">Importar Madeira</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground font-medium mt-0.5">
                {step === 'upload' ? 'Selecione um arquivo para o estoque de madeira' : `${parsedRows.length} itens encontrados em ${fileName}`}
              </DialogDescription>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-8 flex-1 overflow-y-auto min-h-0">
          {step === 'upload' && (
            <div className="space-y-5">
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-primary font-bold text-sm">
                  <Info className="w-4 h-4" /> Formato Esperado
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Colunas obrigatórias: <span className="font-bold text-foreground">ITEM</span>, <span className="font-bold text-foreground">ENDEREÇO</span>.
                  <br />Opcionais: <span className="font-bold text-foreground">PROCESSO</span>, <span className="font-bold text-foreground">QUANTIDADE</span>, <span className="font-bold text-foreground">LOTE</span>, <span className="font-bold text-foreground">TONALIDADE</span>, <span className="font-bold text-foreground">TIPO</span>.
                </p>
                <Button variant="outline" size="sm" className="h-8 text-xs font-bold rounded-lg mt-2" onClick={downloadTemplate}>
                  <Download className="w-3.5 h-3.5 mr-1.5" /> Template .xlsx
                </Button>
              </div>

              <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-border/40 rounded-2xl p-8 sm:p-12 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all"
              >
                <FileSpreadsheet className="w-10 h-10 text-muted-foreground/40" />
                <div className="text-center">
                  <p className="text-sm font-bold text-foreground">Clique ou arraste um arquivo aqui</p>
                  <p className="text-[10px] text-muted-foreground font-medium mt-1">XLSX, XLS, CSV, TXT</p>
                </div>
              </div>

              <input ref={fileRef} type="file" className="hidden" accept=".xlsx,.xls,.csv,.txt" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }} />
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg px-3 py-2 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4" /> {validRows.length} Válidos
                </div>
                {invalidRows.length > 0 && (
                  <div className="flex items-center gap-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg px-3 py-2 text-xs font-bold">
                    <AlertTriangle className="w-4 h-4" /> {invalidRows.length} Com erro
                  </div>
                )}
              </div>

              <div className="overflow-x-auto rounded-xl border border-border/30">
                <table className="w-full text-xs">
                  <thead className="bg-muted/30 border-b border-border/20 text-muted-foreground/70 uppercase font-black text-[10px] tracking-wider">
                    <tr>
                      <th className="px-3 py-2.5 text-left">Status</th>
                      <th className="px-3 py-2.5 text-left">Item</th>
                      <th className="px-3 py-2.5 text-left">Processo</th>
                      <th className="px-3 py-2.5 text-left">Endereço</th>
                      <th className="px-3 py-2.5 text-left">Tipo</th>
                      <th className="px-3 py-2.5 text-right">Qtd</th>
                      <th className="px-3 py-2.5 text-left">Tonalidade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/10">
                    {parsedRows.slice(0, 50).map((row, i) => (
                      <tr key={i} className={!row.valid ? 'bg-red-500/5' : ''}>
                        <td className="px-3 py-2 text-left">
                          {row.valid ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <X className="w-3.5 h-3.5 text-red-500" />}
                        </td>
                        <td className="px-3 py-2 font-medium">{row.item}</td>
                        <td className="px-3 py-2">{row.processo}</td>
                        <td className="px-3 py-2 font-mono">{row.endereco}</td>
                        <td className="px-3 py-2">{row.tipo}</td>
                        <td className="px-3 py-2 text-right">{row.quantidade}</td>
                        <td className="px-3 py-2 text-muted-foreground">{row.tonalidade_nome}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {parsedRows.length > 50 && (
                <p className="text-[10px] text-muted-foreground text-center">Mostrando apenas os primeiros 50 itens...</p>
              )}
            </div>
          )}
        </div>

        <div className="px-5 sm:px-8 py-4 border-t border-border/20 bg-muted/20 flex items-center justify-between">
          <Button variant="ghost" onClick={() => step === 'preview' ? setStep('upload') : onOpenChange(false)} className="rounded-xl font-bold">
            {step === 'preview' ? 'Voltar' : 'Cancelar'}
          </Button>
          {step === 'preview' && (
            <Button onClick={handleImport} disabled={importing || validRows.length === 0} className="rounded-xl font-black gap-2 shadow-lg shadow-primary/20">
              {importing && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              Importar {validRows.length} itens
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
