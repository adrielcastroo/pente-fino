// ============================================================================
// HistoryDrawer — slide-over com histórico + reimpressão.
// ============================================================================
import { useMemo, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RotateCw, Trash2 } from 'lucide-react';
import { loadHistory, clearHistory, type PrintHistoryEntry } from '../utils/etiquetaHistory';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onClose: () => void;
  onReprint?: (entry: PrintHistoryEntry) => void;
}

export function HistoryDrawer({ open, onClose, onReprint }: Props) {
  const [rev, setRev] = useState(0);
  const history = useMemo(() => loadHistory(), [rev, open]);

  const groups = useMemo(() => {
    const byTemplate = new Map<string, PrintHistoryEntry[]>();
    const failures: PrintHistoryEntry[] = [];
    for (const h of history) {
      const arr = byTemplate.get(h.templateId) ?? [];
      arr.push(h);
      byTemplate.set(h.templateId, arr);
    }
    return { byTemplate, failures };
  }, [history]);

  const doClear = () => {
    if (!confirm('Limpar todo o histórico de impressões?')) return;
    clearHistory();
    setRev((r) => r + 1);
    toast.success('Histórico limpo.');
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Histórico de impressões</SheetTitle>
          <SheetDescription>{history.length} entradas · últimas 100 impressões</SheetDescription>
        </SheetHeader>
        <div className="flex justify-end mt-2">
          <Button variant="ghost" size="sm" className="gap-1 text-destructive" onClick={doClear}>
            <Trash2 className="size-3.5" /> Limpar
          </Button>
        </div>
        <Tabs defaultValue="recentes" className="mt-2">
          <TabsList>
            <TabsTrigger value="recentes">Recentes</TabsTrigger>
            <TabsTrigger value="por-modelo">Por modelo</TabsTrigger>
          </TabsList>
          <TabsContent value="recentes">
            <ScrollArea className="h-[calc(100vh-220px)]">
              <HistoryList items={history} onReprint={onReprint} />
            </ScrollArea>
          </TabsContent>
          <TabsContent value="por-modelo">
            <ScrollArea className="h-[calc(100vh-220px)]">
              {Array.from(groups.byTemplate.entries()).map(([id, arr]) => (
                <div key={id} className="mb-3">
                  <div className="text-[11px] font-medium text-muted-foreground px-1 py-1">{arr[0].templateName} · {arr.length}</div>
                  <HistoryList items={arr} onReprint={onReprint} />
                </div>
              ))}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

function HistoryList({ items, onReprint }: { items: PrintHistoryEntry[]; onReprint?: (e: PrintHistoryEntry) => void }) {
  if (!items.length) {
    return <p className="text-xs text-muted-foreground italic p-3">Nenhuma impressão registrada.</p>;
  }
  return (
    <ul className="space-y-1.5">
      {items.map((h) => (
        <li key={h.id} className="flex items-center gap-2 border border-border/50 rounded-md p-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-medium truncate">{h.templateName}</span>
              <Badge variant="outline" className="text-[9px] h-4">{h.method}</Badge>
              {h.copies > 1 && <Badge variant="secondary" className="text-[9px] h-4">×{h.copies}</Badge>}
            </div>
            <p className="text-[10px] text-muted-foreground font-mono truncate">{h.payload}</p>
            <p className="text-[10px] text-muted-foreground">{new Date(h.printedAt).toLocaleString('pt-BR')}</p>
          </div>
          {onReprint && (
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onReprint(h)} title="Reimprimir">
              <RotateCw className="size-3.5" />
            </Button>
          )}
        </li>
      ))}
    </ul>
  );
}

export default HistoryDrawer;
