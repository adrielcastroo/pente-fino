import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDateBR } from '@/lib/app-utils';

interface AugeDetailDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  subtitle?: string;
  fields: Array<{ label: string; value: any; mono?: boolean; span?: 1 | 2 }>;
  raw?: any;
  syncedAt?: string | null;
}

export default function AugeDetailDialog({
  open, onOpenChange, title, subtitle, fields, raw, syncedAt,
}: AugeDetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 flex-wrap">
            <span className="font-mono">{title}</span>
            <Badge variant="outline" className="text-[10px] uppercase">Auge ERP</Badge>
          </DialogTitle>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </DialogHeader>
        <ScrollArea className="flex-1 pr-4">
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 mb-4">
            {fields.map((f, i) => (
              <div key={i} className={f.span === 2 ? 'col-span-2' : ''}>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-0.5">
                  {f.label}
                </p>
                <p className={`text-sm break-words ${f.mono ? 'font-mono' : ''}`}>
                  {f.value == null || f.value === '' ? <span className="text-muted-foreground/40">—</span> : String(f.value)}
                </p>
              </div>
            ))}
          </div>
          {syncedAt && (
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 mb-2">
              Última sinc.: {formatDateBR(syncedAt)}
            </p>
          )}
          {raw && (
            <details className="text-xs">
              <summary className="cursor-pointer text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground">
                Payload bruto (JSON)
              </summary>
              <pre className="mt-2 p-3 bg-muted/40 rounded-md overflow-x-auto text-[11px] font-mono">
                {JSON.stringify(raw, null, 2)}
              </pre>
            </details>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
