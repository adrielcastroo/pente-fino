import React, { memo, useMemo, Fragment } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Copy, X } from 'lucide-react';
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
          <Fragment key={`group-${gi}`}>
            {gi > 0 && <tr key={`spacer-${gi}`}><td colSpan={3} className="h-8 bg-background"></td></tr>}
...
              </tr>
            ))}
          </Fragment>
        ))}
      </tbody>
    </table>
  );
});

MotorGroupedView.displayName = 'MotorGroupedView';
