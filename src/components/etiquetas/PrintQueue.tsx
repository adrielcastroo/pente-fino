/**
 * Fila de impressão em lote a partir dos XMLs importados.
 * Cada item respeita `volumes` (N cópias) e usa o template ativo selecionado.
 *
 * Confirmação por volume: cada etiqueta (volume) exige confirmação explícita
 * do usuário antes de ser enviada à impressora — mesmo dentro de uma mesma NF.
 * O operador pode marcar "confirmar todos os volumes desta NF" para pular as
 * confirmações restantes de uma NF ou "não perguntar novamente nesta sessão"
 * para desabilitar a confirmação até que a página seja recarregada.
 */
import { useRef, useState } from 'react';
import { Printer, Trash2, Play, AlertCircle, CheckCircle2, Loader2, Package, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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

type ConfirmDecision = 'confirm' | 'skip-nf' | 'cancel';
type PendingConfirm = {
  nf: string;
  volume: number;
  total: number;
  resolve: (d: { decision: ConfirmDecision; confirmAllOfNf: boolean; disableAll: boolean }) => void;
};

export function PrintQueue({ items, activeTemplateId, onRemove, onClear, onPatch }: Props) {
  const imprimir = useImprimirEtiqueta();
  const [batchRunning, setBatchRunning] = useState(false);
  const [pending, setPending] = useState<PendingConfirm | null>(null);
  const [confirmAllOfNf, setConfirmAllOfNf] = useState(false);
  const [disableAllSession, setDisableAllSession] = useState(false);

  // flags mutáveis controlando o fluxo dentro de printOne/printAll
  const skipConfirmForNfRef = useRef<Set<string>>(new Set());
  const disableAllRef = useRef(false);
  const cancelAllRef = useRef(false);

  const askConfirm = (nf: string, volume: number, total: number) => {
    // Skip confirmation for this NF or globally desabilitada nesta sessão.
    if (disableAllRef.current) return Promise.resolve<ConfirmDecision>('confirm');
    if (skipConfirmForNfRef.current.has(nf)) return Promise.resolve<ConfirmDecision>('confirm');

    return new Promise<ConfirmDecision>((resolve) => {
      setConfirmAllOfNf(false);
      setDisableAllSession(false);
      setPending({
        nf,
        volume,
        total,
        resolve: ({ decision, confirmAllOfNf: allNf, disableAll }) => {
          if (decision === 'confirm') {
            if (allNf) skipConfirmForNfRef.current.add(nf);
            if (disableAll) disableAllRef.current = true;
          }
          setPending(null);
          resolve(decision);
        },
      });
    });
  };

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
      for (let i = 1; i <= total; i++) {
        if (cancelAllRef.current) {
          onPatch(item.id, { status: 'error', errorMsg: 'Impressão cancelada pelo operador.' });
          return;
        }
        // eslint-disable-next-line no-await-in-loop
        const decision = await askConfirm(item.nfNumero, i, total);
        if (decision === 'cancel') {
          cancelAllRef.current = true;
          onPatch(item.id, { status: 'error', errorMsg: 'Impressão cancelada pelo operador.' });
          return;
        }
        if (decision === 'skip-nf') {
          onPatch(item.id, { status: 'error', errorMsg: `NF pulada no volume ${i}/${total}.` });
          return;
        }
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
    cancelAllRef.current = false;
    setBatchRunning(true);
    for (const item of items) {
      if (cancelAllRef.current) break;
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
    <>
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
                  {(item.volumes ?? 0) > 0 ? (
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {item.volumes} vol
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="text-[10px]">Sem volumes</Badge>
                  )}
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
                  disabled={item.status === 'printing' || !activeTemplateId || !item.volumes || item.volumes <= 0}
                  aria-label={`Imprimir NF ${item.nfNumero}`}
                  title={!item.volumes || item.volumes <= 0 ? 'NF sem volumes — impressão desabilitada' : undefined}
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

      <AlertDialog open={!!pending}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Printer className="h-5 w-5 text-primary" />
              Confirmar impressão do volume
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 pt-1">
                <p>
                  Prestes a imprimir a etiqueta do volume{' '}
                  <strong className="text-foreground font-mono">
                    {pending?.volume}/{pending?.total}
                  </strong>{' '}
                  da <strong className="text-foreground font-mono">NF {pending?.nf}</strong>.
                </p>
                <div className="space-y-2 rounded-md border border-border/60 bg-muted/30 p-3">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={confirmAllOfNf}
                      onCheckedChange={(v) => setConfirmAllOfNf(v === true)}
                    />
                    <span>Confirmar todos os volumes restantes desta NF</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={disableAllSession}
                      onCheckedChange={(v) => setDisableAllSession(v === true)}
                    />
                    <span>Não perguntar novamente nesta sessão</span>
                  </label>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-2">
            <AlertDialogCancel
              onClick={() =>
                pending?.resolve({ decision: 'cancel', confirmAllOfNf: false, disableAll: false })
              }
            >
              Cancelar fila
            </AlertDialogCancel>
            <Button
              variant="outline"
              onClick={() =>
                pending?.resolve({ decision: 'skip-nf', confirmAllOfNf: false, disableAll: false })
              }
              className="gap-1.5"
            >
              <SkipForward className="h-4 w-4" /> Pular NF
            </Button>
            <AlertDialogAction
              onClick={() =>
                pending?.resolve({
                  decision: 'confirm',
                  confirmAllOfNf,
                  disableAll: disableAllSession,
                })
              }
              className="gap-1.5"
            >
              <Printer className="h-4 w-4" /> Imprimir volume
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function StatusIcon({ status }: { status: PrintQueueItem['status'] }) {
  const base = 'h-4 w-4 shrink-0';
  if (status === 'done') return <CheckCircle2 className={cn(base, 'text-emerald-500')} />;
  if (status === 'error') return <AlertCircle className={cn(base, 'text-destructive')} />;
  if (status === 'printing') return <Loader2 className={cn(base, 'animate-spin text-primary')} />;
  return <div className={cn(base, 'rounded-full border border-muted-foreground/40')} />;
}
