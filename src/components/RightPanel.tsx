import React, { useState, useMemo, memo, useCallback, useEffect } from 'react';

import { useShallow } from 'zustand/react/shallow';

import { useAppStore } from '@/store/useAppStore';
import { formatML } from '@/lib/app-utils';
import { toast } from 'sonner';
import { usePerformance } from '@/hooks/use-performance';
import { Search, Trash2, Undo2, Copy, X, Package, ArrowUpDown, CheckCircle2, FileText, Layers3, Clock, Info, Tag } from 'lucide-react';
import { getRegistroColumns } from '@/lib/registroColumns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  className?: string;
}

const TableCell = memo(({ id, columnKey, value, searchQuery, isEditing, editValue, onEditValueChange, onCommitEdit, onCancelEdit, onStartEdit, onCopy, loteSistema, className }: TableCellProps) => {
  if (isEditing) {
    return (
      <td className={`px-2 sm:px-4 py-2 sm:py-3.5 ${className || ''}`}>
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
        className="cursor-pointer border-primary/30 bg-primary/5 text-primary hover:bg-primary hover:text-white hover:scale-105 active:scale-95 transition-all font-mono py-1.5 px-3 rounded-md border-dashed shadow-sm" 
        onClick={() => onCopy(loteSistema || '')}
      >
        {loteSistema || '—'}
      </Badge>
    );
  } else if (columnKey === 'item' || columnKey === 'endereco') {
    content = <HighlightedText text={String(value || '—')} q={searchQuery} />;
  }

  const isNumericLike = ['mLinear', 'm2', 'largura', 'quantidade', 'lote', 'nf', 'processo'].includes(columnKey);
  const isSecondary = ['largura', 'nf', 'processo', 'lote'].includes(columnKey);

  return (
    <td 
      onDoubleClick={() => columnKey !== 'loteSistema' ? onStartEdit(id, columnKey, String(value ?? '')) : undefined}
      className={`px-3 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm transition-colors whitespace-nowrap border-r border-border/20 ${columnKey === 'item' ? 'font-bold text-foreground text-sm sm:text-base tracking-tight' : isSecondary ? 'font-mono text-muted-foreground/60 text-[11px] sm:text-xs group-hover:text-muted-foreground' : 'font-mono text-foreground/80 group-hover:text-foreground'} ${isNumericLike ? 'tabular-nums' : ''} ${columnKey === 'loteSistema' ? 'min-w-[180px]' : ''} ${columnKey === 'mLinear' || columnKey === 'quantidade' ? 'font-semibold' : ''} ${className || ''}`}
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

const TableRow = memo(({ r, i, columns, searchQuery, onStartEdit, onDelete, onCopy, isLow, editingCell, editValue, onEditValueChange, onCommitEdit, onCancelEdit, isGuest, showActions }: TableRowProps & { showActions?: boolean }) => {

  return (
    <tr className={`group hover:bg-primary/[0.03] border-b border-border/30 ${r.isNew ? 'bg-primary/[0.08] animate-pulse-subtle' : ''} transition-all duration-300`}>
      <td className="px-3 sm:px-5 py-3 sm:py-4 text-[10px] sm:text-xs text-muted-foreground/40 font-semibold tabular-nums border-r border-border/20">{i + 1}</td>
      {columns.map((column: any) => {


        return (
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
        );
      })}
      {showActions && (
        <td className="px-3 sm:px-5 py-3 sm:py-4">
          <div className="flex justify-end gap-2 opacity-100 transition-all duration-200">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => onCopy(r.loteSistema)} 
                  className="h-9 w-9 rounded-md hover:bg-primary/10 hover:text-primary transition-all active:scale-90 shadow-none hover:shadow-sm" 
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
               <TooltipContent className="rounded-lg shadow-xl border-border/40">Copiar Lote Sistema</TooltipContent>
            </Tooltip>
            
            <AlertDialog>
              <Tooltip>
                <TooltipTrigger asChild>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Remover registro"
                      className="h-9 w-9 rounded-md hover:bg-destructive/10 hover:text-destructive transition-all active:scale-90 shadow-none hover:shadow-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                </TooltipTrigger>
                <TooltipContent className="rounded-lg shadow-xl border-border/40">Remover Registro</TooltipContent>
              </Tooltip>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remover registro?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação remove o registro <span className="font-mono font-bold">{r.item || '(sem item)'}</span> desta sessão. Você pode desfazer com Ctrl+Z.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDelete(r.id)} className="bg-destructive hover:bg-destructive/90">Remover</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </td>
      )}
    </tr>
  );
});

TableRow.displayName = 'TableRow';

export default function RightPanel() {
  const { isGuest } = useAuth();
  const {
    registros, currentMode, searchQuery, setSearchQuery, sortBy, setSortBy,
    deleteRegistro, undo, undoStack, updateRegistro, activeTab
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
    updateRegistro: s.updateRegistro,
    activeTab: s.formData.activeTab
  })));

  const { isLow } = usePerformance();

  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [editingCell, setEditingCell] = useState<{ rowId: string; key: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [visibleCount, setVisibleCount] = useState(isLow ? 50 : 200);
  const [tecidoPage, setTecidoPage] = useState(0);
  const TECIDO_PAGE_SIZE = 10;

  // Sync local search with store if needed
  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  // Debounced store update for search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== searchQuery) {
        setSearchQuery(localSearch);
        setVisibleCount(isLow ? 50 : 200);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearch, searchQuery, setSearchQuery, isLow]);

  const trimmedQuery = useMemo(() => searchQuery.toLowerCase().trim(), [searchQuery]);

  const isMotorControleMode = currentMode === 'motor' || currentMode === 'controle';
  const isTecidoTable = activeTab === 'tecido' && !isMotorControleMode;

  const sortedRows = useMemo(() => {
    if (!trimmedQuery && (!sortBy || !SORT_MAP[sortBy]) && !isTecidoTable) {
      return registros;
    }

    let result: Registro[];
    if (trimmedQuery) {
      result = [];
      const q = trimmedQuery;
      for (let i = 0, len = registros.length; i < len; i++) {
        const r = registros[i];
        if (
          (r.item && r.item.toLowerCase().includes(q)) ||
          (r.endereco && r.endereco.toLowerCase().includes(q)) ||
          (r.lote && r.lote.toLowerCase().includes(q)) ||
          (r.loteSistema && r.loteSistema.toLowerCase().includes(q))
        ) {
          result.push(r);
        }
      }
    } else {
      result = [...registros];
    }

    if (sortBy && SORT_MAP[sortBy]) {
      result.sort(SORT_MAP[sortBy]);
    } else if (isTecidoTable) {
      // Tecido: mais recentes primeiro (novos são appended no store)
      result.reverse();
    }
    return result;
  }, [registros, trimmedQuery, sortBy, isTecidoTable]);

  // Reset paginação do tecido quando dataset muda
  useEffect(() => {
    setTecidoPage(0);
  }, [trimmedQuery, sortBy, isTecidoTable]);

  const tecidoPageCount = isTecidoTable
    ? Math.max(1, Math.ceil(sortedRows.length / TECIDO_PAGE_SIZE))
    : 1;

  const pagedRows = useMemo(() => {
    if (isTecidoTable) {
      const start = tecidoPage * TECIDO_PAGE_SIZE;
      return sortedRows.slice(start, start + TECIDO_PAGE_SIZE);
    }
    return sortedRows.length > visibleCount ? sortedRows.slice(0, visibleCount) : sortedRows;
  }, [sortedRows, visibleCount, isTecidoTable, tecidoPage]);

  const totals = useMemo(() => {
    let ml = 0, m2 = 0, qtd = 0;
    for (let i = 0, len = sortedRows.length; i < len; i++) {
      const r = sortedRows[i];
      ml += r.mLinear || 0;
      m2 += r.m2 || 0;
      qtd += r.quantidade || 0;
    }
    return { ml, m2, qtd };
  }, [sortedRows]);

  const columns = useMemo(() => {
    // Optimization: only use all rows if they have multiple modes
    // Passing all rows to getRegistroColumns is now faster due to the optimization I made there
    return getRegistroColumns(registros, currentMode);
  }, [currentMode, registros]);

  // KPIs derived from current registros
  const kpis = useMemo(() => {
    const lotesSet = new Set<string>();
    let lastTs = 0;
    for (const r of registros) {
      const k = (r.lote || r.loteSistema || '').trim();
      if (k) lotesSet.add(k.toLowerCase());
      const t = new Date((r as any).updatedAt || (r as any).createdAt || 0).getTime();
      if (!isNaN(t) && t > lastTs) lastTs = t;
    }
    const lastDate = lastTs ? new Date(lastTs) : null;
    return {
      total: registros.length,
      m2: totals.m2,
      ml: totals.ml,
      lotes: lotesSet.size,
      lastTime: lastDate ? lastDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '—',
      lastDate: lastDate ? `Hoje, ${lastDate.toLocaleDateString('pt-BR')}` : 'Sem registros',
    };
  }, [registros, totals]);

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


  const isMotorControle = currentMode === 'motor' || currentMode === 'controle';

  // Group rows by CX label for motor/controle view
  const motorGroups = useMemo(() => {
    if (!isMotorControle) return [];
    const groups: { cxLabel: string; item: string; rows: Registro[] }[] = [];
    let currentGroup: { cxLabel: string; item: string; rows: Registro[] } | null = null;

    for (const r of pagedRows) {
      if (!r) continue;
      // Extract CX label from loteSistema
      const ls = String(r.loteSistema || '');
      const cxMatch = ls.match(/^(CX\d+|S\/CX)/i);
      const cxLabel = (cxMatch && cxMatch[1]) ? cxMatch[1].toUpperCase() : 'S/CX';

      if (!currentGroup || currentGroup.cxLabel !== cxLabel || currentGroup.item !== r.item) {
        currentGroup = { cxLabel, item: r.item || '', rows: [] };
        groups.push(currentGroup);
      }
      currentGroup.rows.push(r);
    }
    return groups;
  }, [isMotorControle, pagedRows]);

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

  const loadMore = useCallback(() => {
    setVisibleCount(prev => prev + (isLow ? 50 : 200));
  }, [isLow]);

  const showActions = true;

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background rounded-md border border-border/50 shadow-2xl transition-all duration-500 min-h-0">

      <div className="px-3 xs:px-4 sm:px-6 py-3 sm:py-5 bg-card/60 border-b border-border/40 flex flex-col gap-4 flex-shrink-0 min-w-0">
        <div className="flex flex-row flex-wrap items-center gap-2 sm:gap-4 min-w-0">
          <div className="relative flex-1 min-w-[160px] group">
            <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within:text-primary group-focus-within:scale-110 transition-all duration-300" />
            <input
              value={localSearch}
              onChange={e => setLocalSearch(e.target.value)}
              className="w-full h-11 sm:h-12 pl-10 sm:pl-12 pr-3 sm:pr-4 rounded-md border border-border/50 bg-muted/40 text-xs sm:text-sm font-bold tracking-tight focus:bg-background focus:border-primary/50 focus:ring-8 focus:ring-primary/5 transition-all duration-300 placeholder:text-muted-foreground/30 shadow-inner"
              placeholder="Buscar material, lote ou endereço..."
              autoComplete="off"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Select value={sortBy || 'none'} onValueChange={(v) => setSortBy(v === 'none' ? '' : v)}>
              <SelectTrigger
                className="h-11 sm:h-12 w-[110px] sm:w-[140px] rounded-md border-border/50 bg-background/60 hover:bg-muted/40 text-[11px] sm:text-xs font-medium text-muted-foreground focus:ring-1 focus:ring-primary/40 transition-colors"
                aria-label="Ordenar registros"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <ArrowUpDown className="w-3.5 h-3.5 shrink-0 text-muted-foreground/70" />
                  <SelectValue placeholder="Ordenar" />
                </div>
              </SelectTrigger>
              <SelectContent align="end" className="min-w-[160px]">
                <SelectItem value="none" className="text-xs">Padrão</SelectItem>
                <SelectItem value="item" className="text-xs">Item (A-Z)</SelectItem>
                <SelectItem value="ml-d" className="text-xs">Metros lin. ↓</SelectItem>
                <SelectItem value="ml-a" className="text-xs">Metros lin. ↑</SelectItem>
                <SelectItem value="end" className="text-xs">Endereço</SelectItem>
              </SelectContent>
            </Select>

            {registros.length > 0 && !isGuest && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleClearAll}
                    className="h-11 w-11 sm:h-12 sm:w-12 rounded-md border-border/50 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 hover:rotate-12 transition-all active:scale-95 shadow-sm"
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

      {/* KPI strip — compact */}
      {registros.length > 0 && (
        <div className="flex-shrink-0 px-3 xs:px-4 py-2 bg-card/40 border-b border-border/40 min-w-0">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            {[
              { icon: FileText, color: 'text-primary', bg: 'bg-primary/10', label: 'Registros', value: kpis.total.toString() },
              { icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10', label: kpis.m2 > 0 ? 'Total m²' : 'Total m Lin', value: kpis.m2 > 0 ? kpis.m2.toFixed(2).replace('.', ',') : formatML(kpis.ml) },
              { icon: Layers3, color: 'text-purple-500', bg: 'bg-purple-500/10', label: 'Lotes', value: kpis.lotes.toString() },
              { icon: Clock, color: 'text-orange-500', bg: 'bg-orange-500/10', label: kpis.lastDate || 'Atualizado', value: kpis.lastTime },
            ].map((k, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 rounded-md border border-border/50 bg-background px-2.5 py-1.5 min-w-0 hover:border-primary/40 transition-colors group"
              >
                <div className={`flex-shrink-0 w-7 h-7 rounded-md ${k.bg} ${k.color} flex items-center justify-center`}>
                  <k.icon className="w-3.5 h-3.5" strokeWidth={2.5} />
                </div>
                <div className="flex flex-col min-w-0 leading-tight">
                  <span className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground/60 truncate">{k.label}</span>
                  <span className="text-sm sm:text-base font-semibold text-foreground font-mono truncate">{k.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      )}

      <div className="flex-1 overflow-y-auto overflow-x-auto bg-background/20 custom-scrollbar relative min-h-0">
        <div className="min-w-full inline-block align-middle">
          {isMotorControle ? (
            <table className="w-full border-separate border-spacing-0 table-auto min-w-[560px]">
              <thead>
                <tr className="bg-muted/30">
                  <th className="sticky top-0 z-10 px-2 sm:px-4 py-3 sm:py-4 text-left text-[8px] sm:text-[10px] font-semibold text-muted-foreground border-b border-r border-border/40 bg-background/80 whitespace-nowrap">
                    Séries Bipadas
                  </th>
                  <th className="sticky top-0 z-10 px-2 sm:px-4 py-3 sm:py-4 text-left text-[8px] sm:text-[10px] font-semibold text-muted-foreground border-b border-r border-border/40 bg-background whitespace-nowrap">
                    Séries Sistema
                  </th>
                  {showActions && (
                    <th className="sticky top-0 z-10 px-2 sm:px-4 py-3 sm:py-4 text-right border-b border-border/40 bg-background w-[80px] sm:w-[100px] text-[8px] sm:text-[10px] font-semibold text-muted-foreground">
                      Ações
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {motorGroups.map((group, gi) => (
                  <React.Fragment key={`grp-${gi}-${group.cxLabel}-${group.item}`}>
                    {gi > 0 && (
                      <tr aria-hidden="true"><td colSpan={showActions ? 3 : 2} className="h-3 bg-background"></td></tr>
                    )}
                    <tr className="bg-muted/40 border-b border-border/40">
                      <td className="px-3 sm:px-5 py-2 sm:py-2.5 text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-foreground border-r border-border/20">
                        {group.cxLabel} {group.item}
                      </td>
                      <td className="px-3 sm:px-5 py-2 sm:py-2.5 text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-primary border-r border-border/20">
                        séries
                      </td>
                      {showActions && (
                        <td className="px-3 sm:px-5 py-2 sm:py-2.5 text-right text-[10px] text-muted-foreground font-semibold tabular-nums">
                          {group.rows.length} {group.rows.length === 1 ? 'item' : 'itens'}
                        </td>
                      )}
                    </tr>
                    {group.rows.map((r) => {
                      if (!r) return null;
                      return (
                        <tr key={r.id} className={`group hover:bg-primary/[0.03] border-b border-border/30 ${r.isNew ? 'bg-primary/[0.08] animate-pulse-subtle' : ''} transition-all duration-300`}>
                          <td className="px-3 sm:px-5 py-3 sm:py-4 text-xs sm:text-sm font-mono text-muted-foreground/90 border-r border-border/20">
                            {r.item} {r.lote}
                          </td>
                          <td className="px-3 sm:px-5 py-3 sm:py-4 text-xs sm:text-sm font-mono text-foreground font-bold border-r border-border/20">
                            <Badge
                              variant="outline"
                              className="cursor-pointer border-primary/30 bg-primary/5 text-primary hover:bg-primary hover:text-white hover:scale-105 active:scale-95 transition-all font-mono py-1.5 px-3 rounded-md border-dashed shadow-sm"
                              onClick={() => copyText(r.loteSistema)}
                            >
                              {r.loteSistema || '—'}
                            </Badge>
                          </td>
                          {showActions && (
                            <td className="px-3 sm:px-5 py-3 sm:py-4">
                              <div className="flex justify-end gap-2 opacity-100 transition-all duration-200">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" onClick={() => copyText(r.loteSistema)} className="h-9 w-9 rounded-md hover:bg-primary/10 hover:text-primary transition-all active:scale-90 shadow-none hover:shadow-sm">
                                      <Copy className="w-4 h-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent className="rounded-lg shadow-xl border-border/40">Copiar Lote Sistema</TooltipContent>
                                </Tooltip>
                                {!isGuest && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button variant="ghost" size="icon" onClick={() => deleteRegistro(r.id)} className="h-9 w-9 rounded-md hover:bg-destructive/10 hover:text-destructive transition-all active:scale-90 shadow-none hover:shadow-sm">
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent className="rounded-lg shadow-xl border-border/40">Remover Registro</TooltipContent>
                                  </Tooltip>
                                )}
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full border-separate border-spacing-0 table-auto min-w-[720px]">
              <thead>
                <tr className="bg-muted/30">
                  <th className="sticky top-0 z-10 px-2 sm:px-4 py-3 sm:py-4 text-left text-[8px] sm:text-[10px] font-semibold text-muted-foreground border-b border-r border-border/40 bg-background/80 w-[40px] sm:w-[50px]">#</th>
                  {columns.map(column => {
                    return (
                      <th 
                        key={column.key} 
                        className="sticky top-0 z-10 px-2 sm:px-4 py-3 sm:py-4 text-left text-[8px] sm:text-[10px] font-semibold text-muted-foreground border-b border-r border-border/40 bg-background whitespace-nowrap"
                      >
                        {column.shortLabel || column.label}
                      </th>
                    );
                  })}
                  {showActions && <th className="sticky top-0 z-10 px-2 sm:px-4 py-3 sm:py-4 text-right border-b border-border/40 bg-background w-[80px] sm:w-[100px] text-[8px] sm:text-[10px] font-semibold text-muted-foreground ">Ações</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {pagedRows.map((r, i) => (
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
                    showActions={showActions}
                  />
                ))}
              </tbody>
            </table>
          )}

          {isTecidoTable && sortedRows.length > TECIDO_PAGE_SIZE && (
            <div className="p-3 flex items-center justify-between gap-3 border-t border-border/40 bg-card/40">
              <span className="text-[11px] text-muted-foreground tabular-nums">
                Página <span className="font-semibold text-foreground">{tecidoPage + 1}</span> de{' '}
                <span className="font-semibold text-foreground">{tecidoPageCount}</span>
                <span className="mx-2 text-muted-foreground/40">·</span>
                <span className="font-mono">{sortedRows.length}</span> registros
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTecidoPage(0)}
                  disabled={tecidoPage === 0}
                  className="h-8 px-2 text-[11px] rounded-md"
                  aria-label="Primeira página"
                >
                  «
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTecidoPage(p => Math.max(0, p - 1))}
                  disabled={tecidoPage === 0}
                  className="h-8 px-2.5 text-[11px] rounded-md"
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTecidoPage(p => Math.min(tecidoPageCount - 1, p + 1))}
                  disabled={tecidoPage >= tecidoPageCount - 1}
                  className="h-8 px-2.5 text-[11px] rounded-md"
                >
                  Próxima
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTecidoPage(tecidoPageCount - 1)}
                  disabled={tecidoPage >= tecidoPageCount - 1}
                  className="h-8 px-2 text-[11px] rounded-md"
                  aria-label="Última página"
                >
                  »
                </Button>
              </div>
            </div>
          )}

          {!isTecidoTable && sortedRows.length > visibleCount && (
            <div className="p-4 flex justify-center border-t border-border/10 bg-muted/5">
              <Button variant="ghost" size="sm" onClick={loadMore} className="text-primary font-bold hover:bg-primary/5 rounded-md px-6">
                Carregar mais registros ({sortedRows.length - visibleCount} restantes)
              </Button>
            </div>
          )}

        </div>
      </div>

    </div>
  );
}
