import { useRef, useState, type DragEvent } from 'react';
import * as XLSX from 'xlsx';
import { FileSpreadsheet, Loader2, UploadCloud, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { NormalizedResult } from '@/lib/compras/analiseCompra';

export interface PlanilhaImportada extends NormalizedResult {
  arquivoNome: string;
}

export interface PlanilhaDropzoneProps {
  label: string;
  hint?: string;
  value: PlanilhaImportada | null;
  onChange: (value: PlanilhaImportada | null) => void;
  onError?: (message: string) => void;
  className?: string;
}

const ACCEPT = '.xlsx,.xls,.csv,.ods';

/**
 * Lê a primeira aba do arquivo e devolve `{ columns, rows }`.
 * A primeira linha não vazia é tratada como cabeçalho.
 */
async function lerPlanilha(file: File): Promise<NormalizedResult> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array' });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) throw new Error('A planilha não possui abas.');

  const matriz = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[sheetName], {
    header: 1,
    raw: false,
    defval: '',
    blankrows: false,
  });

  const linhas = matriz
    .map((r) => (Array.isArray(r) ? r.map((c) => (c == null ? '' : String(c).trim())) : []))
    .filter((r) => r.some((c) => c !== ''));

  if (!linhas.length) throw new Error('A planilha está vazia.');

  const header = linhas[0];
  const width = linhas.reduce((m, r) => Math.max(m, r.length), 0);
  const columns = Array.from(
    { length: width },
    (_, i) => header[i] || `Coluna ${String(i + 1).padStart(2, '0')}`,
  );
  const rows = linhas
    .slice(1)
    .map((r) => Array.from({ length: width }, (_, i) => r[i] ?? ''));

  return { columns, rows };
}

/**
 * Campo de importação de planilha (clique ou arrastar-e-soltar).
 * Mantido isolado para poder ser usado nos dois lados da comparação.
 */
export default function PlanilhaDropzone({
  label,
  hint,
  value,
  onChange,
  onError,
  className,
}: PlanilhaDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [carregando, setCarregando] = useState(false);
  const [arrastando, setArrastando] = useState(false);

  const processar = async (file?: File | null) => {
    if (!file) return;
    setCarregando(true);
    try {
      const parsed = await lerPlanilha(file);
      onChange({ ...parsed, arquivoNome: file.name });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Não foi possível ler a planilha.';
      onError?.(`${file.name}: ${msg}`);
    } finally {
      setCarregando(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setArrastando(false);
    void processar(e.dataTransfer.files?.[0]);
  };

  return (
    <div className={cn('space-y-1.5', className)}>
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>

      <div
        role="button"
        tabIndex={0}
        onClick={() => !carregando && inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setArrastando(true);
        }}
        onDragLeave={() => setArrastando(false)}
        onDrop={onDrop}
        className={cn(
          'flex min-h-[104px] cursor-pointer flex-col items-center justify-center gap-1.5 rounded-md border border-dashed border-border bg-muted/20 px-3 py-4 text-center transition-colors',
          'hover:border-primary/50 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          arrastando && 'border-primary bg-primary/5',
          value && 'border-solid border-primary/40 bg-primary/5',
        )}
      >
        {carregando ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <span className="text-[11px] text-muted-foreground">Lendo planilha…</span>
          </>
        ) : value ? (
          <>
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            <span className="max-w-full break-all text-xs font-medium">{value.arquivoNome}</span>
            <span className="text-[11px] text-muted-foreground">
              {value.rows.length} linhas · {value.columns.length} colunas
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-[11px]"
              onClick={(e) => {
                e.stopPropagation();
                onChange(null);
              }}
            >
              <X className="mr-1 h-3 w-3" />
              Remover
            </Button>
          </>
        ) : (
          <>
            <UploadCloud className="h-5 w-5 text-muted-foreground" />
            <span className="text-xs">Clique ou arraste o arquivo</span>
            <span className="text-[11px] text-muted-foreground">
              {hint ?? 'XLSX, XLS, CSV ou ODS'}
            </span>
          </>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => void processar(e.target.files?.[0])}
      />
    </div>
  );
}
