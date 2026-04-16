import { useState, useMemo, memo, useCallback, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { useAppStore } from '@/store/useAppStore';
import { formatML } from '@/lib/app-utils';
import { toast } from 'sonner';
import { usePerformance } from '@/hooks/use-performance';
import { Search, Trash2, Undo2, Copy, X, Package, ArrowUpDown, CheckCircle2 } from 'lucide-react';
import { getRegistroColumns } from '@/lib/registroColumns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { Registro } from '@/types';
import { useAuth } from '@/hooks/use-auth';


const HighlightedText = memo(({ text, q }: { text: string; q: string }) => {
  if (!q) return <>{text}</>;
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark className="bg-primary/20 text-primary rounded-sm px-0.5 font-bold">{text.slice(i, i + q.length)}</mark>
      {text.slice(i + q.length)}
    </>
  );
});

HighlightedText.displayName = 'HighlightedText';

const SORT_MAP: Record<string, (a: any, b: any) => number> = {
  'item': (a, b) => (a.item || '').localeCompare(b.item || ''),
  'ml-d': (a, b) => (b.mLinear || 0) - (a.mLinear || 0),
  'ml-a': (a, b) => (a.mLinear || 0) - (b.mLinear || 0),
  'end': (a, b) => (a.endereco || '').localeCompare(b.endereco || ''),
};

interface TableCellProps {
  id: string;
  columnKey: string;
  value: any;
  searchQuery: string;
  isEditing: boolean;
  editValue: string;
  onEditValueChange: (val: string) => void;
  onCommitEdit: () => void;
  onCancelEdit: () => void;
  onStartEdit: (rowId: string, key: string, val: string) => void;
  onCopy: (t: string) => void;
  loteSistema?: string;
}

const TableCell = memo(({ id, columnKey, value, searchQuery, isEditing, editValue, onEditValueChange, onCommitEdit, onCancelEdit, onStartEdit, onCopy, loteSistema }: TableCellProps) => {
  if (isEditing) {
    return (
      <td className="px-2 sm:px-4 py-2 sm:py-3.5">
        <input
          autoFocus
          value={editValue}
          onChange={e => onEditValueChange(e.target.value)}
          onBlur={onCommitEdit}
          onKeyDown={e => { if (e.key === 'Enter') onCommitEdit(); if (e.key === 'Escape') onCancelEdit(); }}
          className="w-full bg-background border-2 border-primary rounded-lg px-2 py-1 text-sm outline-none shadow-lg shadow-primary/10"
        />
      </td>
    );
  }

  const displayVal = columnKey === 'm2' ? (Number(value) > 0 ? Number(value).toFixed(1) : '—')
    : columnKey === 'largura' ? (Number(value) > 0 ? `${Number(value).toFixed(2)}m` : '—')
    : columnKey === 'mLinear' ? formatML(Number(value))
    : columnKey === 'loteSistema' ? null
    : columnKey === 'item' ? null
    : columnKey === 'endereco' ? null
    : (value || '—');

  let content: React.ReactNode = displayVal;

  if (columnKey === 'loteSistema') {
    content = (
      <Badge 
        variant="outline" 
        className="cursor-pointer border-primary/20 bg-primary/5 text-primary hover:bg-primary hover:text-white transition-all font-mono py-1 px-2.5 rounded-lg border-dashed" 
        onClick={() => onCopy(loteSistema || '')}
      >
        {loteSistema || '—'}
      </Badge>
    );
  } else if (columnKey === 'item' || columnKey === 'endereco') {
    content = <HighlightedText text={String(value || '—')} q={searchQuery} />;
  }

  return (
    <td 
      onDoubleClick={() => columnKey !== 'loteSistema' ? onStartEdit(id, columnKey, String(value ?? '')) : undefined}
      className={`px-2 sm:px-4 py-2 sm:py-3.5 text-xs sm:text-sm transition-colors ${columnKey === 'item' ? 'font-extrabold text-foreground' : 'font-mono text-muted-foreground/90'} ${columnKey === 'loteSistema' ? 'max-w-[120px] sm:max-w-[180px] overflow-hidden text-ellipsis whitespace-nowrap' : ''}`}
    >
      {content}
    </td>
  );
});

TableCell.displayName = 'TableCell';

interface TableRowProps {
  r: any;
  i: number;
  columns: any[];
  searchQuery: string;
  onStartEdit: (rowId: string, key: string, val: string) => void;
  onDelete: (id: string) => void;
  onCopy: (t: string) => void;
  isLow: boolean;
  editingCell: { rowId: string; key: string } | null;
  editValue: string;
  onEditValueChange: (val: string) => void;
  onCommitEdit: () => void;
  onCancelEdit: () => void;
  isGuest?: boolean;
}

const TableRow = memo(({ r, i, columns, searchQuery, onStartEdit, onDelete, onCopy, isLow, editingCell, editValue, onEditValueChange, onCommitEdit, onCancelEdit, isGuest }: TableRowProps) => {

  return (
    <tr className={`group hover:bg-muted/40 border-b border-border/40 ${r.isNew ? 'bg-primary/5' : ''}`}>
      <td className="px-2 sm:px-4 py-2 sm:py-3.5 text-[10px] sm:text-xs text-muted-foreground/50 font-black tabular-nums">{i + 1}</td>
      {columns.map((column: any) => (
        <TableCell
          key={column.key}
          id={r.id}
          columnKey={column.key}
          value={(r as any)[column.key]}
          searchQuery={searchQuery}
          isEditing={editingCell?.rowId === r.id && editingCell?.key === column.key}
          editValue={editValue}
          onEditValueChange={onEditValueChange}
          onCommitEdit={onCommitEdit}
          onCancelEdit={onCancelEdit}
          onStartEdit={onStartEdit}
          onCopy={onCopy}
          loteSistema={r.loteSistema}
        />
      ))}
      <td className="px-2 sm:px-4 py-2 sm:py-3.5">
        <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => onCopy(r.loteSistema)} 
                className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors" 
              >
                <Copy className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger>
             <TooltipContent>Copiar Lote Sistema</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => onDelete(r.id)} 
                className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors" 
              >
                <X className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Remover Registro</TooltipContent>
          </Tooltip>
        </div>
      </td>
    </tr>
  );
});

TableRow.displayName = 'TableRow';

export default function RightPanel() {
  const { isGuest } = useAuth();
  const {
    registros, currentMode, searchQuery, setSearchQuery, sortBy, setSortBy,
    deleteRegistro, undo, undoStack, updateRegistro
  } = useAppStore(useShallow(s => ({

    registros: s.registros,
    currentMode: s.currentMode,
    searchQuery: s.searchQuery,
    setSearchQuery: s.setSearchQuery,
    sortBy: s.sortBy,
    setSortBy: s.setSortBy,
    deleteRegistro: s.deleteRegistro,
    undo: s.undo,
    undoStack: s.undoStack,
    updateRegistro: s.updateRegistro
  })));


  const { isLow } = usePerformance();
  
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [editingCell, setEditingCell] = useState<{ rowId: string; key: string } | null>(null);
  const [editValue, setEditValue] = useState('');

  // Sync local search with store if needed (e.g. on external reset)
  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  // Debounced store update for search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== searchQuery) {
        setSearchQuery(localSearch);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearch, searchQuery, setSearchQuery]);

  const sortedRows = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    let result: Registro[];
    if (q) {
      result = [];
      for (let i = 0, len = registros.length; i < len; i++) {
        const r = registros[i];
        // Lowercase once per field per row (cheaper than 4 lowercases + 4 includes when miss is early)
        const item = r.item ? r.item.toLowerCase() : '';
        if (item.includes(q)) { result.push(r); continue; }
        const end = r.endereco ? r.endereco.toLowerCase() : '';
        if (end.includes(q)) { result.push(r); continue; }
        const lote = r.lote ? r.lote.toLowerCase() : '';
        if (lote.includes(q)) { result.push(r); continue; }
        const ls = r.loteSistema ? r.loteSistema.toLowerCase() : '';
        if (ls.includes(q)) { result.push(r); continue; }
      }
    } else {
      result = sortBy && SORT_MAP[sortBy] ? registros.slice() : registros;
    }
    if (sortBy && SORT_MAP[sortBy]) {
      // Avoid mutating the store's array reference
      if (result === registros) result = registros.slice();
      result.sort(SORT_MAP[sortBy]);
    }
    return result;
  }, [registros, searchQuery, sortBy]);

  const totals = useMemo(() => {
    let ml = 0, m2 = 0, qtd = 0;
    for (let i = 0, len = sortedRows.length; i < len; i++) {
      const r = sortedRows[i];
      // Faster numeric conversion and summation
      ml += r.mLinear || 0;
      m2 += r.m2 || 0;
      qtd += r.quantidade || 0;
    }
    return { ml, m2, qtd };
  }, [sortedRows]);

  const columns = useMemo(() => getRegistroColumns(registros.length > 0 ? [registros[0]] : [], currentMode), [currentMode, registros.length]);

  const copyText = useCallback((t: string) => {
    navigator.clipboard.writeText(t).then(() => toast.success(`Lote "${t}" copiado para a área de transferência.`));
  }, []);

  const startEdit = useCallback((rowId: string, key: string, currentValue: string) => {
    setEditingCell({ rowId, key });
    setEditValue(currentValue);
  }, []);

  const commitEdit = useCallback(() => {
    if (!editingCell) return;
    const { rowId, key } = editingCell;
    const numericKeys = ['m2', 'mLinear', 'largura'];
    const intKeys = ['quantidade'];
    const parsedValue = numericKeys.includes(key)
      ? parseFloat(editValue) || 0
      : intKeys.includes(key)
        ? parseInt(editValue, 10) || 0
        : editValue;
    updateRegistro(rowId, { [key]: parsedValue });
    setEditingCell(null);
    toast.success('Registro atualizado com sucesso.');
  }, [editingCell, editValue, updateRegistro]);

  const cancelEdit = useCallback(() => {
    setEditingCell(null);
  }, []);

  const trimmedQuery = useMemo(() => searchQuery.toLowerCase().trim(), [searchQuery]);

  const isMotorControle = currentMode === 'motor' || currentMode === 'controle';

  // Group rows by CX label for motor/controle view
  const motorGroups = useMemo(() => {
    if (!isMotorControle) return [];
    const groups: { cxLabel: string; item: string; rows: Registro[] }[] = [];
    let currentGroup: { cxLabel: string; item: string; rows: Registro[] } | null = null;

    for (const r of sortedRows) {
      // Extract CX label from loteSistema (e.g. "CX01 NF ..." or "CX01 NFe ...")
      const cxMatch = r.loteSistema?.match(/^(CX\d+|S\/CX)/i);
      const cxLabel = cxMatch ? cxMatch[1].toUpperCase() : 'S/CX';

      if (!currentGroup || currentGroup.cxLabel !== cxLabel || currentGroup.item !== r.item) {
        currentGroup = { cxLabel, item: r.item, rows: [] };
        groups.push(currentGroup);
      }
      currentGroup.rows.push(r);
    }
    return groups;
  }, [isMotorControle, sortedRows]);

  const handleClearAll = () => {
    if (!registros.length) return;
    toast.error('Limpar todos os registros?', {
      action: {
        label: 'Limpar Agora',
        onClick: () => {
          useAppStore.getState().clearAll();
          toast.success('A tabela foi limpa com sucesso.');
        }
      },
      duration: 5000,
    });
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background rounded-2xl border border-border/50">
      {undoStack.length > 0 && (
        <div className="bg-primary/95 px-6 py-3 text-sm flex items-center justify-between gap-4 flex-shrink-0 shadow-sm z-20 border-b border-white/10">
          <div className="flex items-center gap-3 text-white font-bold">
            <Undo2 className="w-5 h-5" />
            <span>Você removeu um registro. Deseja restaurar?</span>
          </div>
          <Button 
            size="sm"
            variant="secondary"
            onClick={() => { const r = undo(); if (r) toast.success('Registro restaurado com sucesso.', { icon: <CheckCircle2 className="w-4 h-4 text-primary" /> }); }}
            className="rounded-full px-6 font-black uppercase tracking-wider text-[10px] bg-white text-primary hover:bg-white/90"
          >
            Desfazer Ação
          </Button>
        </div>
      )}

      <div className="px-3 sm:px-5 py-3.5 bg-card/60 border-b border-border/40 flex flex-col gap-3 flex-shrink-0">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
            <input 
              value={localSearch} 
              onChange={e => setLocalSearch(e.target.value)}
              className="w-full h-11 pl-10 pr-4 rounded-xl border border-border/50 bg-muted/40 text-sm font-bold tracking-tight focus:bg-background focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all duration-300 placeholder:text-muted-foreground/40" 
              placeholder="Buscar material, lote ou endereço..." 
              autoComplete="off" 
            />
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex-1 sm:flex-none h-11 px-4 rounded-xl border border-border/50 bg-muted/30 flex items-center gap-2 transition-all hover:bg-muted/50 group">
              <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground/60 group-hover:text-primary" />
              <select 
                value={sortBy} 
                onChange={e => setSortBy(e.target.value)}
                className="flex-1 sm:flex-none bg-transparent border-none outline-none text-[10px] sm:text-xs font-black uppercase tracking-widest text-muted-foreground cursor-pointer group-hover:text-foreground"
              >
                <option value="">Ordenar</option>
                <option value="item">A-Z</option>
                <option value="ml-d">Linear ↓</option>
                <option value="ml-a">Linear ↑</option>
                <option value="end">Endereço</option>
              </select>
            </div>
            
            {registros.length > 0 && !isGuest && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={handleClearAll} 
                    className="h-11 w-11 rounded-xl border-border/50 hover:bg-destructive/10 hover:text-destructive transition-all active:scale-95"
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Limpar Tabela</TooltipContent>
              </Tooltip>
            )}

          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-background/20 custom-scrollbar relative">
        <div className="min-w-full inline-block align-middle">
          {isMotorControle ? (
            /* ===== MOTOR/CONTROLE GROUPED VIEW ===== */
            <table className="w-full border-separate border-spacing-0 table-auto">
              <thead>
                <tr className="bg-muted/30">
                  <th className="sticky top-0 z-10 px-2 sm:px-4 py-3 sm:py-4 text-left text-[8px] sm:text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em] border-b border-border/40 bg-background">
                    Séries Bipadas
                  </th>
                  <th className="sticky top-0 z-10 px-2 sm:px-4 py-3 sm:py-4 text-left text-[8px] sm:text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em] border-b border-border/40 bg-background">
                    Séries Sistema
                  </th>
                  <th className="sticky top-0 z-10 px-2 sm:px-4 py-3 sm:py-4 text-right border-b border-border/40 bg-background w-[60px] sm:w-[80px] text-[8px] sm:text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em]">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {motorGroups.map((group, gi) => (
                  <>
                    {/* Spacer between groups */}
                    {gi > 0 && (
                      <>
                        <tr key={`spacer1-${gi}`}><td colSpan={3} className="h-4 bg-background"></td></tr>
                        <tr key={`spacer2-${gi}`}><td colSpan={3} className="h-4 bg-background"></td></tr>
                      </>
                    )}
                    {/* Group header */}
                    <tr key={`header-${gi}`} className="bg-primary/10">
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-black text-foreground">
                        {group.cxLabel} {group.item}
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-black text-primary">
                        séries
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-right text-[10px] text-muted-foreground font-bold">
                        {group.rows.length} itens
                      </td>
                    </tr>
                    {/* Group rows */}
                    {group.rows.map((r) => (
                      <tr key={r.id} className={`group hover:bg-muted/40 border-b border-border/20 ${r.isNew ? 'bg-primary/5' : ''}`}>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-mono text-muted-foreground/90">
                          {r.item} {r.lote}
                        </td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-mono text-foreground font-bold">
                          <Badge 
                            variant="outline" 
                            className="cursor-pointer border-primary/20 bg-primary/5 text-primary hover:bg-primary hover:text-white transition-all font-mono py-1 px-2.5 rounded-lg border-dashed"
                            onClick={() => copyText(r.loteSistema)}
                          >
                            {r.loteSistema || '—'}
                          </Badge>
                        </td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3">
                          <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={() => copyText(r.loteSistema)} className="h-7 w-7 rounded-lg hover:bg-primary/10 hover:text-primary">
                                  <Copy className="w-3 h-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Copiar</TooltipContent>
                            </Tooltip>
                            {!isGuest && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" onClick={() => deleteRegistro(r.id)} className="h-7 w-7 rounded-lg hover:bg-destructive/10 hover:text-destructive">
                                    <X className="w-3.5 h-3.5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Remover</TooltipContent>
                              </Tooltip>
                            )}

                          </div>
                        </td>
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
              {sortedRows.length > 0 && (
                <tfoot className="sticky bottom-0 z-10">
                  <tr className="bg-primary/95 text-white font-black font-mono text-[11px] shadow-[0_-10px_20px_rgba(0,0,0,0.1)] border-t border-white/10 uppercase tracking-widest">
                    <td className="px-4 py-4">{sortedRows.length} {sortedRows.length !== 1 ? 'ITENS' : 'ITEM'}</td>
                    <td className="px-4 py-4">{motorGroups.length} {motorGroups.length !== 1 ? 'CAIXAS' : 'CAIXA'}</td>
                    <td className="px-4 py-4"></td>
                  </tr>
                </tfoot>
              )}
            </table>
          ) : (
            /* ===== DEFAULT TABLE VIEW ===== */
            <table className="w-full border-separate border-spacing-0 table-auto">
              <thead>
                <tr className="bg-muted/30">
                  <th className="sticky top-0 z-10 px-2 sm:px-4 py-3 sm:py-4 text-left text-[8px] sm:text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em] border-b border-border/40 bg-background/80  w-[40px] sm:w-[50px]">#</th>
                  {columns.map(column => (
                    <th 
                      key={column.key} 
                      className="sticky top-0 z-10 px-2 sm:px-4 py-3 sm:py-4 text-left text-[8px] sm:text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em] border-b border-border/40 bg-background"
                    >
                      {column.shortLabel || column.label}
                    </th>
                  ))}
                  <th className="sticky top-0 z-10 px-2 sm:px-4 py-3 sm:py-4 text-right border-b border-border/40 bg-background w-[80px] sm:w-[100px] text-[8px] sm:text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em]">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {sortedRows.map((r, i) => (
                  <TableRow
                    key={r.id}
                    r={r}
                    i={i}
                    columns={columns}
                    searchQuery={trimmedQuery}
                    onStartEdit={startEdit}
                    onDelete={deleteRegistro}
                    onCopy={copyText}
                    isLow={isLow}
                    editingCell={editingCell}
                    editValue={editValue}
                    onEditValueChange={setEditValue}
                    onCommitEdit={commitEdit}
                    onCancelEdit={cancelEdit}
                    isGuest={isGuest}
                  />

                ))}
              </tbody>
              {sortedRows.length > 0 && (
                <tfoot className="sticky bottom-0 z-10">
                  <tr className="bg-primary/95 text-white font-black font-mono text-[11px]  shadow-[0_-10px_20px_rgba(0,0,0,0.1)] border-t border-white/10 uppercase tracking-widest">
                    <td className="px-4 py-4">FIM</td>
                    {columns.map(column => (
                      <td key={column.key} className="px-4 py-4">
                        {column.key === 'item' ? `${sortedRows.length} ${sortedRows.length !== 1 ? 'ITENS' : 'ITEM'}` : ''}
                        {column.key === 'mLinear' ? formatML(totals.ml) : ''}
                        {column.key === 'm2' ? (totals.m2 > 0 ? totals.m2.toFixed(1) + ' m²' : '') : ''}
                        {column.key === 'quantidade' ? (totals.qtd > 0 ? `${totals.qtd} UND` : '') : ''}
                      </td>
                    ))}
                    <td className="px-4 py-4"></td>
                  </tr>
                </tfoot>
              )}
            </table>
          )}

          {sortedRows.length === 0 && (
            <div className="flex flex-col items-center justify-center py-32 text-center px-6">
              <div className="h-24 w-24 bg-primary/5 rounded-[2.5rem] flex items-center justify-center mb-8 rotate-12 transition-transform hover:rotate-0 duration-500">
                <Package className="w-12 h-12 text-primary/30" />
              </div>
              <h3 className="text-xl font-black tracking-tight text-foreground mb-2">Sua conferência está vazia</h3>
              <p className="text-muted-foreground text-sm max-w-[320px] leading-relaxed font-medium">
                Os materiais bipados ou registrados manualmente aparecerão nesta lista detalhada para conferência.
              </p>
              <Button 
                variant="outline" 
                className="mt-8 rounded-2xl px-8 font-bold border-primary/20 hover:bg-primary/5 text-primary"
                onClick={() => useAppStore.getState().setFormData({ activeTab: 'tecido' })}
              >
                Começar agora
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
