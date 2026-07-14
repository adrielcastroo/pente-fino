// ============================================================================
// BatchPrintDialog — seleção múltipla de pickings + progress + resumo.
// ============================================================================
import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Layers } from 'lucide-react';
import type { PrintMethod, BatchPrintResult, PickingLike } from '../types/etiqueta';
import type { UsePrintReturn } from '../hooks/useEtiquetaPrint';
import { usePickings } from '@/hooks/expedicao/useExpedicaoData';
import { isWebUsbSupported, isWebSerialSupported } from '../utils/etiquetaPrint';

interface Props {
  open: boolean;
  onClose: () => void;
  batchPrint: UsePrintReturn['batchPrint'];
  isPrinting: boolean;
}

const OPEN_STATUSES = new Set(['em_separacao', 'aguardando', 'em_conferencia']);

export function BatchPrintDialog({ open, onClose, batchPrint, isPrinting }: Props) {
  const { data = [] } = usePickings();
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [method, setMethod] = useState<PrintMethod>('browser');
  const [copiesPerVolume, setCopiesPerVolume] = useState(false);
  const [result, setResult] = useState<BatchPrintResult | null>(null);
  const [progress, setProgress] = useState(0);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return data
      .filter((p) => OPEN_STATUSES.has(p.status))
      .filter((p) => !term || p.numero.toLowerCase().includes(term) || p.cliente.toLowerCase().includes(term));
  }, [data, q]);

  const toggle = (id: string) => {
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };
  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((p) => p.id)));
  };

  const run = async () => {
    const picks = filtered.filter((p) => selected.has(p.id));
    if (!picks.length) return;
    setResult(null);
    setProgress(0);
    // Progress simples: batchPrint é sequencial no hook; aqui estimamos.
    const total = picks.length;
    const wrapped: PickingLike[] = picks;
    const r = await batchPrint(wrapped, { method, copiesPerVolume, volumesResolver: (p) => (p as { total_pecas?: number }).total_pecas ?? 1 });
    setProgress(total);
    setResult(r);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Layers className="size-5" /> Impressão em lote</DialogTitle>
          <DialogDescription>Selecione pickings em aberto e gere etiquetas em sequência.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_260px] gap-3">
          <div className="space-y-2 min-w-0">
            <Input placeholder="Buscar picking..." value={q} onChange={(e) => setQ(e.target.value)} className="h-9" />
            <div className="flex items-center justify-between text-xs">
              <Button size="sm" variant="ghost" onClick={toggleAll}>{selected.size === filtered.length ? 'Desmarcar todos' : 'Selecionar todos'}</Button>
              <span className="text-muted-foreground">{selected.size} de {filtered.length}</span>
            </div>
            <ScrollArea className="h-64 border rounded-md">
              {filtered.map((p) => (
                <label key={p.id} className="flex items-center gap-2 p-2 border-b border-border/40 hover:bg-accent cursor-pointer">
                  <Checkbox checked={selected.has(p.id)} onCheckedChange={() => toggle(p.id)} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs">{p.numero}</span>
                      <Badge variant="outline" className="text-[9px] h-4">{p.status}</Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate">{p.cliente}</p>
                  </div>
                </label>
              ))}
              {!filtered.length && <p className="text-xs text-muted-foreground italic p-3">Nenhum picking em aberto.</p>}
            </ScrollArea>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Método</Label>
              <Select value={method} onValueChange={(v) => setMethod(v as PrintMethod)}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="browser">Navegador</SelectItem>
                  {isWebUsbSupported() && <SelectItem value="zpl-usb">ZPL USB</SelectItem>}
                  {isWebSerialSupported() && <SelectItem value="zpl-serial">ZPL Serial</SelectItem>}
                </SelectContent>
              </Select>
            </div>
            <label className="flex items-center gap-2 text-xs">
              <Checkbox checked={copiesPerVolume} onCheckedChange={(v) => setCopiesPerVolume(Boolean(v))} />
              1 etiqueta por volume (usa total_pecas)
            </label>
            {isPrinting && (
              <div className="space-y-1">
                <Progress value={(progress / Math.max(1, selected.size)) * 100} />
                <p className="text-[10px] text-muted-foreground">Imprimindo {progress} de {selected.size}...</p>
              </div>
            )}
            {result && (
              <div className="rounded-md border border-border p-2 space-y-1 text-xs">
                <div className="flex items-center gap-2"><Badge variant="secondary">✓ {result.success}</Badge><Badge variant="destructive">✗ {result.failed}</Badge></div>
                {result.errors.slice(0, 3).map((e, i) => <p key={i} className="text-[10px] text-muted-foreground">{e}</p>)}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={isPrinting}>Fechar</Button>
          <Button onClick={run} disabled={isPrinting || selected.size === 0}>
            Imprimir {selected.size ? `(${selected.size})` : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default BatchPrintDialog;
