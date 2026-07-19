import { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, FileSpreadsheet, Upload, X } from '@/components/icons';
import { toast } from 'sonner';

export interface ImportedComponenteRow {
  codigo: string;
  quantidade: number;
  /** Override opcional — se ausente, virá do cadastro. */
  unidade?: string | null;
  /** Override opcional — se ausente, virá do cadastro. */
  pacoteEstocagem?: number | null;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onConfirm: (rows: ImportedComponenteRow[]) => Promise<void> | void;
}

const ALIASES: Record<string, string[]> = {
  codigo: [
    'codigo', 'código', 'codigo_interno', 'codigo interno', 'cod interno',
    'codigo_fornecedor', 'codigo fornecedor', 'cod fornecedor', 'sku', 'item',
    'referencia', 'referência', 'ref', 'produto', 'cod',
  ],
  quantidade: [
    'quantidade', 'qtd', 'qtde', 'qty', 'quant', 'qtd_pacote', 'qtd pacote',
    'quantidade pacote', 'quantidade (pacote)', 'pecas', 'peças', 'metros',
    'total', 'quantidade total',
  ],
  unidade: ['unidade', 'un', 'um', 'unid', 'medida', 'unidade_medida', 'u.m.'],
  pacote_estocagem: [
    'pacote_estocagem', 'pacote estocagem', 'qtd_estocagem', 'qtd estocagem',
    'emb_estoque', 'embalagem estoque', 'pacote interno',
  ],
};

const norm = (s: string) =>
  (s || '')
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

function findKey(headers: string[], aliases: string[]): string | null {
  const wanted = new Set(aliases.map(norm));
  for (const h of headers) if (wanted.has(norm(h))) return h;
  return null;
}

function parseNumeric(raw: unknown): number | null {
  if (raw == null || raw === '') return null;
  const s = String(raw).trim().replace(/\./g, '').replace(',', '.');
  const n = Number(s);
  return Number.isFinite(n) && n > 0 ? n : null;
}

const MAX_FILE_BYTES = 10 * 1024 * 1024;

export default function ImportComponentesDialog({ open, onOpenChange, onConfirm }: Props) {
  const [rows, setRows] = useState<ImportedComponenteRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [parsing, setParsing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [ignoradas, setIgnoradas] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setRows([]);
    setFileName('');
    setErrorMsg(null);
    setIgnoradas(0);
  };

  const handleFile = async (file: File) => {
    setErrorMsg(null);
    if (file.size > MAX_FILE_BYTES) {
      const msg = `Arquivo excede o limite de ${(MAX_FILE_BYTES / 1024 / 1024).toFixed(0)} MB.`;
      setErrorMsg(msg);
      toast.error(msg);
      return;
    }
    setFileName(file.name);
    setParsing(true);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      if (!ws) throw new Error('Planilha vazia');
      const json: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });
      if (!json.length) {
        setRows([]);
        setIgnoradas(0);
        return;
      }
      const headers = Array.from(new Set(json.slice(0, 20).flatMap((r) => Object.keys(r))));
      const kCod = findKey(headers, ALIASES.codigo);
      const kQtd = findKey(headers, ALIASES.quantidade);
      const kUn = findKey(headers, ALIASES.unidade);
      const kPacEst = findKey(headers, ALIASES.pacote_estocagem);

      if (!kCod || !kQtd) {
        const msg = `Planilha precisa das colunas: código e quantidade. Encontradas: ${headers.join(', ') || '(nenhuma)'}`;
        setErrorMsg(msg);
        return;
      }

      const parsed: ImportedComponenteRow[] = [];
      let skipped = 0;
      for (const r of json) {
        const codigo = String(r[kCod] ?? '').trim().toUpperCase();
        const qtd = parseNumeric(r[kQtd]);
        if (!codigo || qtd == null) { skipped++; continue; }
        let unidade = kUn ? (String(r[kUn] ?? '').trim().toUpperCase() || null) : null;
        if (unidade === 'UN') unidade = 'PÇ';
        const peParsed = kPacEst ? parseNumeric(r[kPacEst]) : null;
        // Se estocagem vier 0 ou vazia, deixa null — o merge com o cadastro
        // fará o fallback para o pacote do fornecedor.
        const pacoteEstocagem = peParsed && peParsed > 0 ? peParsed : null;
        parsed.push({ codigo, quantidade: qtd, unidade, pacoteEstocagem });
      }
      setRows(parsed);
      setIgnoradas(skipped);
    } catch (e: any) {
      setErrorMsg(`Falha ao ler planilha: ${e?.message || e}`);
      toast.error('Não foi possível ler a planilha');
    } finally {
      setParsing(false);
    }
  };

  const handleConfirm = async () => {
    if (!rows.length) {
      toast.warning('Nenhuma linha válida para importar.');
      return;
    }
    setSubmitting(true);
    try {
      await onConfirm(rows);
      reset();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message || 'Falha ao importar');
    } finally {
      setSubmitting(false);
    }
  };

  const totalQtd = rows.reduce((a, r) => a + r.quantidade, 0);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-primary" />
            Importar conferência de componentes
          </DialogTitle>
          <DialogDescription>
            Aceita <code>.xlsx</code> ou <code>.csv</code>. Colunas necessárias:{' '}
            <code>codigo</code> e <code>quantidade</code>. Opcionais:{' '}
            <code>unidade</code>, <code>pacote_estocagem</code> (senão, virão do cadastro).
          </DialogDescription>
        </DialogHeader>

        {errorMsg && (
          <Alert variant="destructive">
            <AlertCircle className="w-4 h-4" />
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription className="text-xs whitespace-pre-wrap">{errorMsg}</AlertDescription>
          </Alert>
        )}

        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const f = e.dataTransfer.files?.[0];
            if (f) handleFile(f);
          }}
          className={`rounded-md border-2 border-dashed p-6 text-center transition-colors ${
            dragOver ? 'border-primary bg-primary/5' : 'border-border/60 bg-muted/20'
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.target.value = '';
            }}
          />
          {fileName ? (
            <div className="flex items-center justify-center gap-2 text-sm">
              <FileSpreadsheet className="w-4 h-4 text-primary" />
              <span className="font-mono">{fileName}</span>
              <button onClick={reset} className="text-muted-foreground hover:text-destructive p-0.5" aria-label="Remover">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <>
              <Upload className="w-6 h-6 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground mb-2">
                Arraste a planilha aqui ou{' '}
                <button
                  onClick={() => inputRef.current?.click()}
                  className="text-primary font-semibold hover:underline"
                >
                  escolha um arquivo
                </button>
              </p>
              <p className="text-[11px] text-muted-foreground/60">até 10 MB</p>
            </>
          )}
        </div>

        {parsing && <p className="text-xs text-muted-foreground text-center">Lendo planilha…</p>}

        {rows.length > 0 && (
          <div className="border border-border/60 rounded-md overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 bg-muted/40 text-[11px]">
              <span className="font-semibold">
                {rows.length} linha(s) válida(s){ignoradas > 0 ? ` · ${ignoradas} ignorada(s)` : ''}
              </span>
              <span className="font-mono text-muted-foreground">Total: {totalQtd}</span>
            </div>
            <div className="max-h-64 overflow-y-auto text-xs divide-y divide-border/30">
              {rows.slice(0, 200).map((r, i) => (
                <div key={i} className="grid grid-cols-[1fr_80px_60px_80px] gap-2 px-3 py-1.5">
                  <span className="font-mono truncate" title={r.codigo}>{r.codigo}</span>
                  <span className="font-mono text-right tabular-nums">{r.quantidade}</span>
                  <span className="font-mono text-muted-foreground uppercase">{r.unidade || '—'}</span>
                  <span className="font-mono text-muted-foreground text-right tabular-nums">
                    {r.pacoteEstocagem ?? '—'}
                  </span>
                </div>
              ))}
              {rows.length > 200 && (
                <div className="px-3 py-1.5 text-muted-foreground text-center">
                  … +{rows.length - 200} outras linhas
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleConfirm} disabled={submitting || !rows.length}>
            {submitting ? 'Importando…' : `Importar ${rows.length || ''}`.trim()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
