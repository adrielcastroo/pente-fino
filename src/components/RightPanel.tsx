import { useState, useMemo, memo, useCallback } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { formatML } from '@/lib/app-utils';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { usePerformance } from '@/hooks/use-performance';
import { useShallow } from 'zustand/react/shallow';
import { Search, Download, Trash2, Undo2, Copy, X, Package, Filter, ArrowUpDown, CheckCircle2 } from 'lucide-react';
import { getRegistroColumns } from '@/lib/registroColumns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';


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
}

const TableRow = memo(({ r, i, columns, searchQuery, onStartEdit, onDelete, onCopy, renderCell, isLow }: TableRowProps) => {

  const content = (
    <>
      <td className="px-2 sm:px-4 py-2 sm:py-3.5 text-[10px] sm:text-xs text-muted-foreground/50 font-black tabular-nums">{i + 1}</td>
      {columns.map((column: any) => (
        <td 
          key={column.key}
          onDoubleClick={() => column.key !== 'loteSistema' ? onStartEdit(r.id, column.key, String((r as any)[column.key] ?? '')) : undefined}
          className={`px-2 sm:px-4 py-2 sm:py-3.5 text-xs sm:text-sm transition-colors ${column.key === 'item' ? 'font-extrabold text-foreground' : 'font-mono text-muted-foreground/90'} ${column.key === 'loteSistema' ? 'max-w-[120px] sm:max-w-[180px] overflow-hidden text-ellipsis whitespace-nowrap' : ''}`}
        >
          {renderCell(r, column)}
        </td>
      ))}
      <td className="px-2 sm:px-4 py-2 sm:py-3.5">
        <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-x-2 group-hover:translate-x-0">
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
    </>
  );

  if (isLow) {
    return (
      <tr className={`group hover:bg-muted/40 border-b border-border/40 ${r.isNew ? 'bg-primary/5' : ''}`}>
        {content}
      </tr>
    );
  }

  return (
    <motion.tr 
      key={r.id}
      initial={r.isNew ? { opacity: 0, scale: 0.98, x: 20 } : false}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`group hover:bg-muted/40 transition-all duration-200 border-b border-border/40 ${r.isNew ? 'bg-primary/5' : ''}`}
    >
      {content}
    </motion.tr>
  );
});

export default function RightPanel() {
  const registros = useAppStore(s => s.registros);
  const currentMode = useAppStore(s => s.currentMode);
  const searchQuery = useAppStore(s => s.searchQuery);
  const setSearchQuery = useAppStore(s => s.setSearchQuery);
  const sortBy = useAppStore(s => s.sortBy);
  const setSortBy = useAppStore(s => s.setSortBy);
  const deleteRegistro = useAppStore(s => s.deleteRegistro);
  const undo = useAppStore(s => s.undo);
  const undoStack = useAppStore(s => s.undoStack);
  const updateRegistro = useAppStore(s => s.updateRegistro);


  const { isLow } = usePerformance();
  
  const [editingCell, setEditingCell] = useState<{ rowId: string; key: string } | null>(null);
  const [editValue, setEditValue] = useState('');

  const filteredRows = useMemo(() => {
    let result = [...registros];
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      result = result.filter(r =>
        (r.item || '').toLowerCase().includes(q) ||
        (r.endereco || '').toLowerCase().includes(q) ||
        (r.lote || '').toLowerCase().includes(q) ||
        (r.loteSistema || '').toLowerCase().includes(q)
      );
    }
    return result;
  }, [registros, searchQuery]);

  const sortedRows = useMemo(() => {
    let result = [...filteredRows];
    if (sortBy && SORT_MAP[sortBy]) {
      result.sort(SORT_MAP[sortBy]);
    }
    return result;
  }, [filteredRows, sortBy]);

  const totals = useMemo(() => {
    return filteredRows.reduce((acc, r) => ({
      ml: acc.ml + r.mLinear,
      m2: acc.m2 + r.m2,
      qtd: acc.qtd + (r.quantidade || 0)
    }), { ml: 0, m2: 0, qtd: 0 });
  }, [filteredRows]);

  const rows = sortedRows;
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
    <div className="flex flex-col h-full overflow-hidden bg-background/30 backdrop-blur-sm">
      <AnimatePresence>
        {undoStack.length > 0 && (
          <motion.div 
            initial={isLow ? undefined : { height: 0, opacity: 0, y: -20 }} 
            animate={{ height: 'auto', opacity: 1, y: 0 }} 
            exit={isLow ? undefined : { height: 0, opacity: 0, y: -20 }}
            className="bg-primary/95 backdrop-blur-md px-6 py-3 text-sm flex items-center justify-between gap-4 flex-shrink-0 shadow-xl z-20 border-b border-white/10"
          >
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
          </motion.div>
        )}
      </AnimatePresence>

      <div className="px-3 sm:px-6 py-4 bg-card/60 backdrop-blur-md border-b border-border/40 flex flex-col gap-4 flex-shrink-0">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
            <input 
              value={searchQuery} 
              onChange={e => setSearchQuery(e.target.value)}
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
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={handleClearAll} 
                  className="h-11 w-11 rounded-xl border-border/50 hover:bg-destructive/10 hover:text-destructive transition-all active:scale-95"
                  disabled={registros.length === 0}
                >
                  <Trash2 className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Limpar Tabela</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-background/20 custom-scrollbar relative">
        <div className="min-w-full inline-block align-middle">
          <table className="w-full border-separate border-spacing-0 table-auto">
            <thead>
              <tr className="bg-muted/30">
                <th className="sticky top-0 z-10 px-2 sm:px-4 py-3 sm:py-4 text-left text-[8px] sm:text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em] border-b border-border/40 bg-background/80 backdrop-blur-md w-[40px] sm:w-[50px]">#</th>
                {columns.map(column => (
                  <th 
                    key={column.key} 
                    className="sticky top-0 z-10 px-2 sm:px-4 py-3 sm:py-4 text-left text-[8px] sm:text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em] border-b border-border/40 bg-background/80 backdrop-blur-md"
                  >
                    {column.shortLabel || column.label}
                  </th>
                ))}
                <th className="sticky top-0 z-10 px-2 sm:px-4 py-3 sm:py-4 text-right border-b border-border/40 bg-background/80 backdrop-blur-md w-[80px] sm:w-[100px]"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              <AnimatePresence initial={false}>
                {rows.map((r, i) => (
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
                  />
                ))}

              </AnimatePresence>
            </tbody>
            {rows.length > 0 && (
              <tfoot className="sticky bottom-0 z-10">
                <tr className="bg-primary/95 text-white font-black font-mono text-[11px] backdrop-blur-lg shadow-[0_-10px_20px_rgba(0,0,0,0.1)] border-t border-white/10 uppercase tracking-widest">
                  <td className="px-4 py-4">FIM</td>
                  {columns.map(column => (
                    <td key={column.key} className="px-4 py-4">
                      {column.key === 'item' ? `${rows.length} ${rows.length !== 1 ? 'ITENS' : 'ITEM'}` : ''}
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

          {rows.length === 0 && (
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