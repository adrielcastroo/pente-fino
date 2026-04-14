import { useMemo, memo, useCallback } from 'react';
import { usePerformance } from '@/hooks/use-performance';
import { Undo2, CheckCircle2 } from 'lucide-react';
import { getRegistroColumns } from '@/lib/registroColumns';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// Custom Hooks
import { useRightPanelTable } from '@/hooks/useRightPanelTable';

// Sub-components
import { TableHeader } from './dashboard/table/TableHeader';
import { TableRow } from './dashboard/table/TableRow';
import { MotorGroupedView } from './dashboard/table/MotorGroupedView';

const RightPanel = memo(function RightPanel() {
  const {
    registros, currentMode, searchQuery, setSearchQuery, sortBy, setSortBy,
    sortedRows, totals, deleteRegistro, undo, undoStack, editingCell,
    editValue, setEditValue, startEdit, commitEdit, cancelEdit, handleClearAll
  } = useRightPanelTable();

  const { isLow } = usePerformance();
  const columns = useMemo(() => getRegistroColumns(registros.length > 0 ? [registros[0]] : [], currentMode), [currentMode, registros.length]);

  const copyText = useCallback((t: string) => {
    navigator.clipboard.writeText(t).then(() => toast.success(`Lote "${t}" copiado.`));
  }, []);

  const isMotorControle = currentMode === 'motor' || currentMode === 'controle';

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      {undoStack.length > 0 && (
        <div className="bg-primary px-6 py-3 text-sm flex items-center justify-between gap-4 flex-shrink-0 shadow-sm z-20 border-b border-white/10">
          <div className="flex items-center gap-3 text-white font-bold">
            <Undo2 className="w-5 h-5" />
            <span>Registro removido. Restaurar?</span>
          </div>
          <Button 
            size="sm"
            variant="secondary"
            onClick={() => { if (undo()) toast.success('Restaurado!'); }}
            className="rounded-full px-6 font-black uppercase tracking-wider text-[10px] bg-white text-primary hover:bg-white/90"
          >
            Desfazer
          </Button>
        </div>
      )}

      <TableHeader 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        onClearAll={handleClearAll}
        registrosCount={registros.length}
      />

      <div className="flex-1 overflow-auto bg-background/20 custom-scrollbar relative">
        <div className="min-w-full inline-block align-middle">
          {isMotorControle ? (
            <MotorGroupedView 
              sortedRows={sortedRows} 
              onCopy={copyText}
              onDelete={deleteRegistro}
            />
          ) : (
            <table className="w-full border-separate border-spacing-0 table-auto">
              <thead>
                <tr className="bg-muted/30">
                  <th className="sticky top-0 z-10 px-2 sm:px-4 py-3 sm:py-4 text-left text-[8px] sm:text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em] border-b border-border/40 bg-background w-[40px] sm:w-[60px]">#</th>
                  {columns.map((column: any) => (
                    <th key={column.key} className="sticky top-0 z-10 px-2 sm:px-4 py-3 sm:py-4 text-left text-[8px] sm:text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em] border-b border-border/40 bg-background">
                      {column.label}
                    </th>
                  ))}
                  <th className="sticky top-0 z-10 px-2 sm:px-4 py-3 sm:py-4 text-right border-b border-border/40 bg-background w-[60px] sm:w-[80px]"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {sortedRows.map((r, i) => (
                  <TableRow
                    key={r.id}
                    r={r}
                    i={i}
                    columns={columns}
                    searchQuery={searchQuery}
                    onStartEdit={startEdit}
                    onDelete={deleteRegistro}
                    onCopy={copyText}
                    isLow={isLow}
                    editingCell={editingCell}
                    editValue={editValue}
                    onEditValueChange={setEditValue}
                    onCommitEdit={commitEdit}
                    onCancelEdit={cancelEdit}
                  />
                ))}
              </tbody>
            </table>
          )}

          {sortedRows.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground/40">
              <div className="w-16 h-16 rounded-3xl bg-muted/20 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 opacity-20" />
              </div>
              <p className="text-xs font-black uppercase tracking-widest">Nenhum registro encontrado</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer Totals */}
      {sortedRows.length > 0 && !isMotorControle && (
        <div className="px-3 sm:px-6 py-4 bg-muted/30 border-t border-border/40 flex items-center justify-end gap-6 sm:gap-12 flex-shrink-0">
          <div className="flex flex-col items-end">
            <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Total Linear</span>
            <span className="text-sm sm:text-base font-black tabular-nums">{totals.ml.toFixed(2)}m</span>
          </div>
          <div className="flex flex-col items-end border-l border-border/40 pl-6 sm:pl-12">
            <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Total M²</span>
            <span className="text-sm sm:text-base font-black tabular-nums">{totals.m2.toFixed(1)}m²</span>
          </div>
          <div className="flex flex-col items-end border-l border-border/40 pl-6 sm:pl-12">
            <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Qtd Itens</span>
            <span className="text-sm sm:text-base font-black tabular-nums">{sortedRows.length}</span>
          </div>
        </div>
      )}
    </div>
  );
});

export default RightPanel;
