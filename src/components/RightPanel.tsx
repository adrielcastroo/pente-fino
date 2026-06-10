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
        className="cursor-pointer border-primary/30 bg-primary/5 text-primary hover:bg-primary hover:text-white hover:scale-105 active:scale-95 transition-all font-mono py-1.5 px-3 rounded-xl border-dashed shadow-sm" 
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
      className={`px-3 sm:px-5 py-3 sm:py-4 text-xs sm:text-sm transition-all duration-300 ${columnKey === 'item' ? 'font-black text-foreground scale-100 group-hover:scale-[1.02] origin-left' : 'font-mono text-muted-foreground/80 group-hover:text-foreground'} ${columnKey === 'loteSistema' ? 'max-w-[140px] sm:max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap' : ''} ${className || ''}`}
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
      <td className="px-3 sm:px-5 py-3 sm:py-4 text-[10px] sm:text-xs text-muted-foreground/40 font-black tabular-nums">{i + 1}</td>
      {columns.map((column: any) => {
        // Critical columns that should always show: item, mLinear, quantidade, loteSistema
        // Less critical: nf, processo, m2, largura, lote, endereco
        const isCritical = ['item', 'mLinear', 'quantidade'].includes(column.key);
        const responsiveClass = isCritical ? "" : column.key === 'loteSistema' ? "hidden sm:table-cell" : column.key === 'nf' ? "hidden lg:table-cell" : "hidden md:table-cell";

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
            className={responsiveClass}
          />
        );
      })}
      {showActions && (
        <td className="px-3 sm:px-5 py-3 sm:py-4">
          <div className="flex justify-end gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all duration-300 transform lg:translate-x-2 group-hover:translate-x-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => onCopy(r.loteSistema)} 
                  className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary transition-all active:scale-90 shadow-none hover:shadow-sm" 
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
               <TooltipContent className="rounded-lg shadow-xl border-border/40">Copiar Lote Sistema</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => onDelete(r.id)} 
                  className="h-9 w-9 rounded-xl hover:bg-destructive/10 hover:text-destructive transition-all active:scale-90 shadow-none hover:shadow-sm" 
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="rounded-lg shadow-xl border-border/40">Remover Registro</TooltipContent>
            </Tooltip>
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
  const [visibleCount, setVisibleCount] = useState(isLow ? 50 : 200);

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

  const sortedRows = useMemo(() => {
    if (!trimmedQuery && (!sortBy || !SORT_MAP[sortBy])) {
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
    }
    return result;
  }, [registros, trimmedQuery, sortBy]);

  const pagedRows = useMemo(() => {
    return sortedRows.length > visibleCount ? sortedRows.slice(0, visibleCount) : sortedRows;
  }, [sortedRows, visibleCount]);

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
    <div className="flex flex-col h-full overflow-hidden bg-background rounded-3xl border border-border/50 shadow-2xl transition-all duration-500">
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
            className="rounded-full px-6 font-black uppercase tracking-[0.15em] text-[10px] bg-white text-primary hover:bg-white/90 hover:scale-105 active:scale-95 transition-all shadow-lg"
          >
            Desfazer Ação
          </Button>
        </div>
      )}

      <div className="px-4 xs:px-6 py-4 sm:py-5 bg-card/60 border-b border-border/40 flex flex-col gap-4 flex-shrink-0">
        <div className="flex flex-row items-center gap-3 sm:gap-5">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within:text-primary group-focus-within:scale-110 transition-all duration-300" />
            <input 
              value={localSearch} 
              onChange={e => setLocalSearch(e.target.value)}
              className="w-full h-12 pl-12 pr-4 rounded-2xl border border-border/50 bg-muted/40 text-xs sm:text-sm font-bold tracking-tight focus:bg-background focus:border-primary/50 focus:ring-8 focus:ring-primary/5 transition-all duration-300 placeholder:text-muted-foreground/30 shadow-inner" 
              placeholder="Buscar material, lote ou endereço..." 
              autoComplete="off" 
            />
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex-none h-11 px-2 sm:px-4 rounded-xl border border-border/50 bg-muted/30 flex items-center gap-1.5 sm:gap-2 transition-all hover:bg-muted/50 group">
              <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground/60 group-hover:text-primary" />
              <select 
                value={sortBy} 
                onChange={e => setSortBy(e.target.value)}
                className="bg-transparent border-none outline-none text-[8px] sm:text-xs font-black uppercase tracking-widest text-muted-foreground cursor-pointer group-hover:text-foreground w-16 sm:w-auto"
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
                    className="h-12 w-12 rounded-2xl border-border/50 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 hover:rotate-12 transition-all active:scale-95 shadow-sm"
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

      {/* KPI strip — inspired by mockup */}
      {registros.length > 0 && (
        <div className="flex-shrink-0 px-2 xs:px-4 py-3 bg-card/40 border-b border-border/40 overflow-x-auto custom-scrollbar">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 min-w-max lg:min-w-0">
            {[
              { icon: FileText, color: 'text-primary', bg: 'bg-primary/10', label: 'Total de Registros', value: kpis.total.toString(), sub: 'Registros cadastrados' },
              { icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10', label: 'Metragem Total (m²)', value: kpis.m2 > 0 ? kpis.m2.toFixed(2).replace('.', ',') : formatML(kpis.ml), sub: kpis.m2 > 0 ? 'Soma de m² conferidos' : 'Total em metros lineares' },
              { icon: Layers3, color: 'text-purple-500', bg: 'bg-purple-500/10', label: 'Lotes Distintos', value: kpis.lotes.toString(), sub: 'Lotes únicos' },
              { icon: Clock, color: 'text-orange-500', bg: 'bg-orange-500/10', label: 'Última Atualização', value: kpis.lastTime, sub: kpis.lastDate },
            ].map((k, idx) => (
              <div
                key={idx}
                className="flex items-center gap-4 rounded-2xl border border-border/50 bg-background px-4 py-3.5 min-w-[170px] sm:min-w-[200px] hover:border-primary/40 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
              >
                <div className={`flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-2xl ${k.bg} ${k.color} flex items-center justify-center shadow-inner transition-transform group-hover:scale-110`}>
                  <k.icon className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] font-black text-muted-foreground/50 truncate mb-0.5">{k.label}</span>
                  <span className="text-lg sm:text-xl font-black text-foreground leading-tight font-mono truncate">{k.value}</span>
                  <span className="text-[10px] text-muted-foreground/60 font-bold truncate mt-0.5">{k.sub}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto bg-background/20 custom-scrollbar relative">
        <div className="min-w-full inline-block align-middle">
          {isMotorControle ? (
            <table className="w-full border-separate border-spacing-0 table-auto">
              <thead>
                <tr className="bg-muted/30">
                  <th className="sticky top-0 z-10 px-2 sm:px-4 py-3 sm:py-4 text-left text-[8px] sm:text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em] border-b border-border/40 bg-background">
                    Séries Bipadas
                  </th>
                  <th className="sticky top-0 z-10 px-2 sm:px-4 py-3 sm:py-4 text-left text-[8px] sm:text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em] border-b border-border/40 bg-background">
                    Séries Sistema
                  </th>
                  {showActions && (
                    <th className="sticky top-0 z-10 px-2 sm:px-4 py-3 sm:py-4 text-right border-b border-border/40 bg-background w-[60px] sm:w-[80px] text-[8px] sm:text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em]">
                      Ações
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {motorGroups.map((group, gi) => (
                  <React.Fragment key={`grp-${gi}-${group.cxLabel}-${group.item}`}>
                    {gi > 0 && (
                      <>
                        <tr><td colSpan={3} className="h-4 bg-background"></td></tr>
                        <tr><td colSpan={3} className="h-4 bg-background"></td></tr>
                      </>
                    )}
                    <tr className="bg-primary/10">
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
                    {group.rows.map((r) => {
                      if (!r) return null;
                      return (
                        <tr key={r.id} className={`group hover:bg-muted/40 border-b border-border/20 ${r.isNew ? 'bg-primary/5' : ''}`}>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-mono text-muted-foreground/90">
                            {r.item} {r.lote}
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-mono text-foreground font-bold">
                            <Badge 
                              variant="outline" 
                              className="cursor-pointer border-primary/30 bg-primary/5 text-primary hover:bg-primary hover:text-white hover:scale-105 active:scale-95 transition-all font-mono py-1.5 px-3 rounded-xl border-dashed shadow-sm"
                              onClick={() => copyText(r.loteSistema)}
                            >
                              {r.loteSistema || '—'}
                            </Badge>
                          </td>
                          {showActions && (
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
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Remover</TooltipContent>
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
              {sortedRows.length > 0 && (
                <tfoot className="sticky bottom-0 z-10">
                  <tr className="bg-primary/95 text-white font-black font-mono text-[11px] shadow-[0_-10px_20px_rgba(0,0,0,0.1)] border-t border-white/10 uppercase tracking-widest">
                    <td className="px-4 py-4">{sortedRows.length} {sortedRows.length !== 1 ? 'ITENS' : 'ITEM'}</td>
                    <td className="px-4 py-4">{motorGroups.length} {motorGroups.length !== 1 ? 'CAIXAS' : 'CAIXA'}</td>
                    {showActions && <td className="px-4 py-4"></td>}
                  </tr>
                </tfoot>
              )}
            </table>
          ) : (
            <table className="w-full border-separate border-spacing-0 table-auto">
              <thead>
                <tr className="bg-muted/30">
                  <th className="sticky top-0 z-10 px-2 sm:px-4 py-3 sm:py-4 text-left text-[8px] sm:text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em] border-b border-border/40 bg-background/80  w-[40px] sm:w-[50px]">#</th>
                  {columns.map(column => {
                    const isCritical = ['item', 'mLinear', 'quantidade', 'loteSistema'].includes(column.key);
                    const responsiveClass = isCritical ? "" : "hidden md:table-cell";
                    return (
                      <th 
                        key={column.key} 
                        className={`sticky top-0 z-10 px-2 sm:px-4 py-3 sm:py-4 text-left text-[8px] sm:text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em] border-b border-border/40 bg-background ${responsiveClass}`}
                      >
                        {column.shortLabel || column.label}
                      </th>
                    );
                  })}
                  {showActions && <th className="sticky top-0 z-10 px-2 sm:px-4 py-3 sm:py-4 text-right border-b border-border/40 bg-background w-[80px] sm:w-[100px] text-[8px] sm:text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em]">Ações</th>}
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
              {sortedRows.length > 0 && (
                <tfoot className="sticky bottom-0 z-10">
                  <tr className="bg-primary/95 text-white font-black font-mono text-[11px] shadow-[0_-10px_20px_rgba(0,0,0,0.1)] border-t border-white/10 uppercase tracking-widest">
                    <td className="px-4 py-4">FIM</td>
                    {columns.map(column => {
                      const isCritical = ['item', 'mLinear', 'quantidade'].includes(column.key);
                      const responsiveClass = isCritical ? "" : column.key === 'loteSistema' ? "hidden sm:table-cell" : column.key === 'nf' ? "hidden lg:table-cell" : "hidden md:table-cell";
                      
                      return (
                        <td key={column.key} className={`px-4 py-4 ${responsiveClass}`}>
                          {column.key === 'item' ? `${sortedRows.length} ${sortedRows.length !== 1 ? 'ITENS' : 'ITEM'}` : ''}
                          {column.key === 'mLinear' ? formatML(totals.ml) : ''}
                          {column.key === 'm2' ? (totals.m2 > 0 ? totals.m2.toFixed(1) + ' m²' : '') : ''}
                          {column.key === 'quantidade' ? (totals.qtd > 0 ? `${totals.qtd} UND` : '') : ''}
                        </td>
                      );
                    })}
                    {showActions && <td className="px-4 py-4"></td>}
                  </tr>
                </tfoot>
              )}
            </table>
          )}

          {sortedRows.length > visibleCount && (
            <div className="p-4 flex justify-center border-t border-border/10 bg-muted/5">
              <Button variant="ghost" size="sm" onClick={loadMore} className="text-primary font-bold hover:bg-primary/5 rounded-xl px-6">
                Carregar mais registros ({sortedRows.length - visibleCount} restantes)
              </Button>
            </div>
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

      {/* Legend / Tips footer — inspired by mockup */}
      <div className="flex-shrink-0 border-t border-border/40 bg-card/40 px-3 sm:px-4 py-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
          <div className="flex items-start gap-2.5 min-w-0">
            <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Info className="w-3.5 h-3.5" strokeWidth={2.5} />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-primary mb-0.5">Dica</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground leading-snug">Use a busca e a ordenação acima para refinar e encontrar registros rapidamente.</p>
            </div>
          </div>
          <div className="flex items-start gap-2.5 min-w-0">
            <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-success/10 text-success flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2.5} />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-success mb-0.5">Status</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground leading-snug">
                <span className="font-bold">Novo:</span> recém-bipado · <span className="font-bold">Conferido:</span> arquivado via exportar
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2.5 min-w-0">
            <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <Tag className="w-3.5 h-3.5" strokeWidth={2.5} />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-purple-500 mb-0.5">Legenda</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground leading-snug">
                <span className="font-bold">M²:</span> metragem quadrada · <span className="font-bold">M. Linear:</span> metragem linear
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
