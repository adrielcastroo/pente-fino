/**
 * Dropzone múltiplo de XMLs de NF-e — parseia local (SEFAZ) e alimenta a fila de impressão.
 */
import { useCallback, useRef, useState } from 'react';
import { toast } from 'sonner';
import { FileUp, Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { parseNFeXML } from '@/lib/nfe-parser';
import type { PrintQueueItem } from '@/hooks/usePrintQueue';

interface Props {
  onImport: (items: Array<Omit<PrintQueueItem, 'id' | 'status' | 'addedAt'>>) => void;
}

export function XmlBatchImporter({ onImport }: Props) {
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const arr = Array.from(files).filter((f) => f.name.toLowerCase().endsWith('.xml'));
      if (arr.length === 0) {
        toast.error('Nenhum arquivo .xml válido.');
        return;
      }
      setLoading(true);
      const parsed: Array<Omit<PrintQueueItem, 'id' | 'status' | 'addedAt'>> = [];
      const errors: string[] = [];
      for (const f of arr) {
        try {
          const text = await f.text();
          const nfe = parseNFeXML(text);
          parsed.push({
            nfNumero: nfe.numero,
            chaveAcesso: nfe.chaveAcesso,
            destinatario: nfe.nomeDestinatario,
            transportadora: nfe.transportadora,
            volumes: Math.max(1, nfe.volumes || 1),
            pesoBruto: nfe.pesoBruto,
            valorTotal: nfe.valorTotal,
          });
        } catch (e) {
          errors.push(`${f.name}: ${e instanceof Error ? e.message : 'erro'}`);
        }
      }
      setLoading(false);
      if (parsed.length > 0) {
        onImport(parsed);
        toast.success(`${parsed.length} XML importado(s) para a fila.`);
      }
      if (errors.length > 0) {
        toast.error(`${errors.length} arquivo(s) com erro`, {
          description: errors.slice(0, 3).join(' · '),
        });
      }
    },
    [onImport],
  );

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click();
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
      }}
      className={cn(
        'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors bg-card',
        'hover:border-primary/60 hover:bg-primary/5 focus:outline-none focus:ring-2 focus:ring-primary/40',
        dragging ? 'border-primary bg-primary/10' : 'border-border/60',
      )}
      aria-label="Importar XMLs de NF-e"
    >
      <input
        ref={inputRef}
        type="file"
        accept=".xml,text/xml,application/xml"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) handleFiles(e.target.files);
          e.target.value = '';
        }}
      />
      <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
        {loading ? (
          <Loader2 className="h-6 w-6 text-primary animate-spin" />
        ) : (
          <FileUp className="h-6 w-6 text-primary" />
        )}
      </div>
      <h3 className="text-sm font-medium mb-1">Importar XMLs de NF-e</h3>
      <p className="text-xs text-muted-foreground mb-4">
        Arraste um ou vários arquivos <span className="font-mono">.xml</span> ou clique para selecionar
      </p>
      <Button size="sm" variant="outline" className="gap-1.5" type="button">
        <Upload className="h-3.5 w-3.5" />
        Selecionar arquivos
      </Button>
    </div>
  );
}
