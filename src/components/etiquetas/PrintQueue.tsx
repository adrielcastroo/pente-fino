/**
 * Fila de impressão em lote a partir dos XMLs importados.
 * Cada item respeita `volumes` (N cópias) e usa o template ativo selecionado.
 */
import { useState } from 'react';
import { Printer, Trash2, Play, AlertCircle, CheckCircle2, Loader2, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { PrintQueueItem } from '@/hooks/usePrintQueue';
import { useImprimirEtiqueta } from '@/hooks/useEtiquetas';
import { toast } from 'sonner';

interface Props {
  items: PrintQueueItem[];
  activeTemplateId: string | null;
  onRemove: (id: string) => void;
  onClear: () => void;
  onPatch: (id: string, p: Partial<PrintQueueItem>) => void;
}

export function PrintQueue({ items, activeTemplateId, onRemove, onClear, onPatch }: Props) {
  const imprimir = useImprimirEtiqueta();
  const [batchRunning, setBatchRunning] = useState(false);

  const printOne = async (item: PrintQueueItem) => {
    if (!activeTemplateId) {
      toast.error('Selecione um modelo ativo antes de imprimir.');
      return;
    }
    if (!item.volumes || item.volumes <= 0) {
      toast.error(`NF ${item.nfNumero}: sem volumes informados — impressão desabilitada.`);
      onPatch(item.id, { status: 'error', errorMsg: 'NF sem volumes — nada a imprimir.' });
      return;
    }
    onPatch(item.id, { status: 'printing', errorMsg: undefined });
    try {
      const total = Math.max(1, item.volumes);
      // Uma impressão por volume — garante enumeração correta (1/N, 2/N, ...)
      // e registra cada NF individualmente no histórico com o número da NF.
      for (let i = 1; i <= total; i++) {
        // eslint-disable-next-line no-await-in-loop
        await imprimir.mutateAsync({
          templateId: activeTemplateId,
          variaveis: {
            nf: item.nfNumero,
            cliente: item.destinatario,
            transportadora: item.transportadora,
            volume_atual: String(i),
            volumeAtual: String(i),
            volume: String(i),
            volume_total: String(total),
            volumeTotal: String(total),
            total: String(total),
            TOTAL: String(total),
            codigo_barras: item.chaveAcesso,
            peso: String(item.pesoBruto || ''),
            romaneio: item.nfNumero,
          },
          quantidade: 1,
          historyLabel: `NF ${item.nfNumero}`,
        });
      }
      onPatch(item.id, { status: 'done' });
    } catch (e) {
      onPatch(item.id, { status: 'error', errorMsg: e instanceof Error ? e.message : 'Falha' });
    }
  };

  const printAll = async () => {
    if (!activeTemplateId) {
      toast.error('Selecione um modelo ativo antes de imprimir.');
      return;
    }
    setBatchRunning(true);
    for (const item of items) {
      if (item.status === 'done') continue;
      if (!item.volumes || item.volumes <= 0) continue;
      // eslint-disable-next-line no-await-in-loop
      await printOne(item);
    }
    setBatchRunning(false);
  };

  const pendingCount = items.filter((i) => i.status !== 'done' && (i.volumes ?? 0) > 0).length;

  if (items.length === 0) {
    return (
      <div className="border border-dashed border-border/60 rounded-xl p-8 text-center bg-card/50">
        <Package className="mx-auto h-8 w-8 text-muted-foreground/60 mb-2" />
        <p className="text-sm text-muted-foreground">
          A fila está vazia. Importe XMLs para começar.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-border/60 rounded-xl bg-card overflow-hidden">
      <div className="flex items-center justify-between p-3 border-b border-border/60 gap-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <span>Fila de impressão</span>
          <Badge variant="secondary">{items.length}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            disabled={batchRunning}
            className="text-muted-foreground hover:text-destructive gap-1.5 h-8"
          >
            <Trash2 className="h-3.5 w-3.5" /> Limpar
          </Button>
          <Button
            size="sm"
            onClick={printAll}
            disabled={batchRunning || pendingCount === 0 || !activeTemplateId}
            className="gap-1.5 h-8"
          >
            {batchRunning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
            Imprimir tudo ({pendingCount})
          </Button>
        </div>
      </div>

      <ul className="divide-y divide-border/60 max-h-[420px] overflow-y-auto" role="list">
        {items.map((item) => (
          <li key={item.id} className="p-3 flex items-center gap-3 hover:bg-muted/30">
            <StatusIcon status={item.status} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-medium">NF {item.nfNumero}</span>
                <Badge variant="outline" className="text-[10px] font-mono">
                  {item.volumes} vol
                </Badge>
                {item.transportadora && (
                  <span className="text-xs text-muted-foreground truncate">· {item.transportadora}</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate">{item.destinatario}</p>
              {item.errorMsg && (
                <p className="text-xs text-destructive mt-0.5">{item.errorMsg}</p>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => printOne(item)}
                disabled={item.status === 'printing' || !activeTemplateId}
                aria-label={`Imprimir NF ${item.nfNumero}`}
              >
                <Printer className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={() => onRemove(item.id)}
                aria-label={`Remover NF ${item.nfNumero}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StatusIcon({ status }: { status: PrintQueueItem['status'] }) {
  const base = 'h-4 w-4 shrink-0';
  if (status === 'done') return <CheckCircle2 className={cn(base, 'text-emerald-500')} />;
  if (status === 'error') return <AlertCircle className={cn(base, 'text-destructive')} />;
  if (status === 'printing') return <Loader2 className={cn(base, 'animate-spin text-primary')} />;
  return <div className={cn(base, 'rounded-full border border-muted-foreground/40')} />;
}
