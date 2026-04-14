import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Copy, X } from 'lucide-react';
import { memo, useMemo } from 'react';
import { Registro } from '@/types';

interface MotorGroupedViewProps {
  sortedRows: Registro[];
  onCopy: (t: string) => void;
  onDelete: (id: string) => void;
}

export const MotorGroupedView = memo(({ sortedRows, onCopy, onDelete }: MotorGroupedViewProps) => {
  const motorGroups = useMemo(() => {
    const groups: { cxLabel: string; item: string; rows: Registro[] }[] = [];
    let currentGroup: { cxLabel: string; item: string; rows: Registro[] } | null = null;

    for (const r of sortedRows) {
      const cxMatch = r.loteSistema?.match(/^(CX\d+|S\/CX)/i);
      const cxLabel = cxMatch ? cxMatch[1].toUpperCase() : 'S/CX';

      if (!currentGroup || currentGroup.cxLabel !== cxLabel || currentGroup.item !== r.item) {
        currentGroup = { cxLabel, item: r.item, rows: [] };
        groups.push(currentGroup);
      }
      currentGroup.rows.push(r);
    }
    return groups;
  }, [sortedRows]);

  return (
    <table className="w-full border-separate border-spacing-0 table-auto">
      <thead>
        <tr className="bg-muted/30">
          <th className="sticky top-0 z-10 px-2 sm:px-4 py-3 sm:py-4 text-left text-[8px] sm:text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em] border-b border-border/40 bg-background">Séries Bipadas</th>
          <th className="sticky top-0 z-10 px-2 sm:px-4 py-3 sm:py-4 text-left text-[8px] sm:text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em] border-b border-border/40 bg-background">Séries Sistema</th>
          <th className="sticky top-0 z-10 px-2 sm:px-4 py-3 sm:py-4 text-right border-b border-border/40 bg-background w-[60px] sm:w-[80px] text-[8px] sm:text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em]">Ações</th>
        </tr>
      </thead>
      <tbody>
        {motorGroups.map((group, gi) => (
          <React.Fragment key={`group-${gi}`}>
            {gi > 0 && <tr key={`spacer-${gi}`}><td colSpan={3} className="h-8 bg-background"></td></tr>}
            <tr key={`header-${gi}`} className="bg-primary/10">
              <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-black text-foreground">
                {group.cxLabel} {group.item}
              </td>
              <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-black text-primary">séries</td>
              <td className="px-2 sm:px-4 py-2 sm:py-3 text-right text-[10px] text-muted-foreground font-bold">
                {group.rows.length} itens
              </td>
            </tr>
            {group.rows.map((r) => (
              <tr key={r.id} className={`group hover:bg-muted/40 border-b border-border/20 ${r.isNew ? 'bg-primary/5' : ''}`}>
                <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-mono text-muted-foreground/90">{r.item} {r.lote}</td>
                <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-mono text-foreground font-bold">
                  <Badge 
                    variant="outline" 
                    className="cursor-pointer border-primary/20 bg-primary/5 text-primary hover:bg-primary hover:text-white transition-all font-mono py-1 px-2.5 rounded-lg border-dashed"
                    onClick={() => onCopy(r.loteSistema)}
                  >
                    {r.loteSistema || '—'}
                  </Badge>
                </td>
                <td className="px-2 sm:px-4 py-2 sm:py-3">
                  <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>
                          <Button variant="ghost" size="icon" onClick={() => onCopy(r.loteSistema)} className="h-7 w-7 rounded-md hover:bg-primary/10 hover:text-primary transition-colors">
                            <Copy className="w-3.5 h-3.5" />
                          </Button>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>Copiar Lote Sistema</TooltipContent>
                    </Tooltip>
                    <Button variant="ghost" size="icon" onClick={() => onDelete(r.id)} className="h-7 w-7 rounded-md hover:bg-destructive/10 hover:text-destructive transition-colors">
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </React.Fragment>
        ))}
      </tbody>
    </table>
  );
});

MotorGroupedView.displayName = 'MotorGroupedView';
