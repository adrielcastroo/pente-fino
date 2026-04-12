import { useState } from 'react';
import { useAppStore, formatML } from '@/store/useAppStore';
import { useToastStore } from '@/hooks/useToast';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';
import { Search, Download, Trash2, Undo2, Copy, X, Package } from 'lucide-react';
import { getRegistroColumns } from '@/lib/registroColumns';

function highlight(text: string, q: string) {
  if (!q) return text;
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i === -1) return text;
  return (
    <>
      {text.slice(0, i)}
      <mark className="bg-accent/30 rounded-sm">{text.slice(i, i + q.length)}</mark>
      {text.slice(i + q.length)}
    </>
  );
}

export default function RightPanel() {
  const { registros, currentMode, searchQuery, setSearchQuery, sortBy, setSortBy, deleteRegistro, undo, undoStack, archiveAndClear, updateRegistro } = useAppStore();
  const addToast = useToastStore(s => s.addToast);
  const [editingCell, setEditingCell] = useState<{ rowId: string; key: string } | null>(null);
  const [editValue, setEditValue] = useState('');

  let rows = [...registros];
  const q = searchQuery.toLowerCase().trim();
  if (q) rows = rows.filter(r =>
    r.item.toLowerCase().includes(q) ||
    r.endereco.toLowerCase().includes(q) ||
    r.lote.toLowerCase().includes(q) ||
    r.loteSistema.toLowerCase().includes(q)
  );

  const sortMap: Record<string, (a: any, b: any) => number> = {
    'item': (a, b) => a.item.localeCompare(b.item),
    'ml-d': (a, b) => b.mLinear - a.mLinear,
    'ml-a': (a, b) => a.mLinear - b.mLinear,
    'end': (a, b) => a.endereco.localeCompare(b.endereco),
  };
  if (sortBy && sortMap[sortBy]) rows.sort(sortMap[sortBy]);

  const totalML = rows.reduce((a, r) => a + r.mLinear, 0);
  const totalM2 = rows.reduce((a, r) => a + r.m2, 0);
  const columns = getRegistroColumns(rows, currentMode);

  const copyText = (t: string) => {
    navigator.clipboard.writeText(t).then(() => addToast('Copiado: ' + t, 'ok'));
  };

  const startEdit = (rowId: string, key: string, currentValue: string) => {
    setEditingCell({ rowId, key });
    setEditValue(currentValue);
  };

  const commitEdit = () => {
    if (!editingCell) return;
    const { rowId, key } = editingCell;
    updateRegistro(rowId, { [key]: key === 'm2' || key === 'mLinear' || key === 'largura' || key === 'quantidade'
      ? parseFloat(editValue) || 0
      : editValue });
    setEditingCell(null);
    addToast('Célula atualizada', 'ok');
  };

  const renderCell = (r: any, column: any) => {
    const isEditing = editingCell?.rowId === r.id && editingCell?.key === column.key;
    if (isEditing) {
      return (
        <input
          autoFocus
          value={editValue}
          onChange={e => setEditValue(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditingCell(null); }}
          className="w-full bg-background border border-primary rounded px-1 py-0.5 text-sm outline-none"
        />
      );
    }

    const val = (r as any)[column.key];
    const displayVal = column.key === 'm2' ? (r.m2 > 0 ? r.m2.toFixed(1) : '—')
      : column.key === 'largura' ? (r.largura > 0 ? `${r.largura.toFixed(2)}m` : '—')
      : column.key === 'mLinear' ? formatML(r.mLinear)
      : column.key === 'loteSistema' ? null
      : column.key === 'item' ? null
      : column.key === 'endereco' ? null
      : (val || '—');

    if (column.key === 'loteSistema') {
      return <span className="cursor-pointer text-primary hover:underline" onClick={() => copyText(r.loteSistema)}>{r.loteSistema || '—'}</span>;
    }
    if (column.key === 'item') return highlight(r.item || '—', q);
    if (column.key === 'endereco') return highlight(r.endereco || '—', q);
    return displayVal;
  };

  const exportExcel = async () => {
    if (!registros.length) { addToast('Nenhum rolo para exportar.', 'warn'); return; }
    const proc = useAppStore.getState().processo || 'sem_proc';
    const exportColumns = getRegistroColumns(registros, currentMode);
    const headers = exportColumns.map(column => column.label);
    const data = registros.map(r => exportColumns.map(column => (r as any)[column.key] ?? ''));
    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
    ws['!cols'] = exportColumns.map(column => ({ wch: column.width }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Conferência');
    XLSX.writeFile(wb, `conferencia_PROC_${proc.replace(/[/\\]/g, '_')}.xlsx`);
    const count = registros.length;
    await archiveAndClear(`PROC ${proc}`);
    addToast(`Excel exportado — ${count} rolos arquivados`, 'ok');
  };

  const handleClearAll = () => {
    if (!registros.length) return;
    if (confirm(`Limpar todos os ${registros.length} registros?`)) {
      useAppStore.getState().clearAll();
      addToast('Tabela limpa', 'warn');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex flex-col h-full overflow-hidden bg-background"
    >
      {/* Undo bar */}
      <AnimatePresence>
        {undoStack.length > 0 && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }} 
            animate={{ height: 'auto', opacity: 1 }} 
            exit={{ height: 0, opacity: 0 }}
            className="bg-primary px-4 py-2 text-sm flex items-center justify-between gap-2.5 flex-shrink-0 shadow-lg z-20"
          >
            <div className="flex items-center gap-2 text-primary-foreground font-medium">
              <Undo2 className="w-4 h-4" />
              <span>Registro removido recentemente</span>
            </div>
            <button 
              onClick={() => { const r = undo(); if (r) addToast('Registro restaurado', 'ok'); }}
              className="bg-white/20 hover:bg-white/30 text-white rounded-full px-4 py-1.5 text-xs font-bold transition-colors backdrop-blur-sm"
            >
              DESFAZER
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toolbar */}
      <div className="px-4 py-3 bg-card border-b border-border/50 flex flex-wrap items-center gap-3 flex-shrink-0">
        <div className="flex items-center gap-2.5 bg-muted/50 border border-border/50 rounded-full px-4 flex-1 min-w-[200px] focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50 transition-all duration-200">
          <Search className="w-4 h-4 text-muted-foreground/50 flex-shrink-0" />
          <input 
            value={searchQuery} 
            onChange={e => setSearchQuery(e.target.value)}
            className="border-none bg-transparent outline-none text-sm py-2.5 w-full placeholder:text-muted-foreground/60" 
            placeholder="Filtrar por item, endereço ou lote..." 
            autoComplete="off" 
          />
        </div>
        
        <div className="flex gap-2 items-center">
          <select 
            value={sortBy} 
            onChange={e => setSortBy(e.target.value)}
            className="h-10 border border-border/50 rounded-full px-4 text-xs font-semibold text-muted-foreground bg-background outline-none cursor-pointer hover:bg-muted/50 transition-colors appearance-none pr-8 relative bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGZpbGw9Im5vbmUiIHZpZXdCb3g9IjAgMCAyNCAyNCIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJtNiA5IDYgNiA2LTYiLz48L3N2Zz4=')] bg-[length:16px] bg-[right_8px_center] bg-no-repeat"
          >
            <option value="">Ordenar por</option>
            <option value="item">Item A→Z</option>
            <option value="ml-d">M Linear ↓</option>
            <option value="ml-a">M Linear ↑</option>
            <option value="end">Endereço</option>
          </select>
          
          <button 
            onClick={exportExcel} 
            className="h-10 w-10 flex items-center justify-center rounded-full border border-border/50 bg-background hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-all duration-200 group" 
            title="Exportar Excel"
          >
            <Download className="w-4 h-4 group-hover:scale-110 transition-transform" />
          </button>
          
          {registros.length > 0 && (
            <button 
              onClick={handleClearAll} 
              className="h-10 w-10 flex items-center justify-center rounded-full border border-border/50 bg-background hover:bg-destructive/10 hover:border-destructive/30 hover:text-destructive transition-all duration-200 group" 
              title="Limpar tudo"
            >
              <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto bg-background custom-scrollbar">
        <div className="min-w-full inline-block align-middle">
          <table className="w-full border-separate border-spacing-0">
            <thead>
              <tr className="bg-muted/30">
                <th className="sticky top-0 z-10 px-4 py-3 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border/50 bg-background/95 backdrop-blur backdrop-filter:bg-background/60 w-[45px]">#</th>
                {columns.map(column => (
                  <th 
                    key={column.key} 
                    className="sticky top-0 z-10 px-4 py-3 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border/50 bg-background/95 backdrop-blur backdrop-filter:bg-background/60"
                  >
                    {column.shortLabel || column.label}
                  </th>
                ))}
                <th className="sticky top-0 z-10 px-4 py-3 text-right text-[11px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border/50 bg-background/95 backdrop-blur backdrop-filter:bg-background/60 w-[80px]"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              <AnimatePresence initial={false}>
                {rows.map((r, i) => (
                  <motion.tr 
                    key={r.id}
                    initial={r.isNew ? { opacity: 0, scale: 0.98, backgroundColor: 'hsl(var(--primary) / 0.05)' } : false}
                    animate={{ opacity: 1, scale: 1, backgroundColor: 'transparent' }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.35 }}
                    className="group hover:bg-muted/30 transition-all duration-200"
                  >
                    <td className="px-4 py-3 text-sm text-muted-foreground/60 font-medium tabular-nums">{i + 1}</td>
                    {columns.map(column => (
                      <td 
                        key={column.key}
                        onDoubleClick={() => column.key !== 'loteSistema' ? startEdit(r.id, column.key, String((r as any)[column.key] ?? '')) : undefined}
                        className={`px-4 py-3 text-sm transition-colors ${column.key === 'item' ? 'font-bold text-foreground' : 'font-mono text-muted-foreground/90'} ${column.key === 'loteSistema' ? 'max-w-[160px] overflow-hidden text-ellipsis whitespace-nowrap' : ''}`}
                      >
                        {renderCell(r, column)}
                      </td>
                    ))}
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button 
                          onClick={() => copyText(r.loteSistema)} 
                          className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-primary/10 hover:text-primary transition-colors" 
                          title="Copiar lote sistema"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => deleteRegistro(r.id)} 
                          className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors" 
                          title="Remover"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
            {rows.length > 0 && (
              <tfoot className="sticky bottom-0 z-10">
                <tr className="bg-primary shadow-[0_-4px_10px_rgba(0,0,0,0.05)] text-primary-foreground font-bold font-mono text-xs backdrop-blur-sm">
                  <td className="px-4 py-3.5 border-t border-primary/20">TOTAL</td>
                  {columns.map(column => (
                    <td key={column.key} className="px-4 py-3.5 border-t border-primary/20">
                      {column.key === 'item' ? `${rows.length} ${rows.length !== 1 ? 'ITENS' : 'ITEM'}` : ''}
                      {column.key === 'mLinear' ? formatML(totalML) : ''}
                      {column.key === 'm2' ? (totalM2 > 0 ? totalM2.toFixed(1) : '—') : ''}
                    </td>
                  ))}
                  <td className="px-4 py-3.5 border-t border-primary/20"></td>
                </tr>
              </tfoot>
            )}
          </table>

          {rows.length === 0 && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-24 text-muted-foreground/50 text-center"
            >
              <div className="h-20 w-20 bg-muted/30 rounded-full flex items-center justify-center mb-6">
                <Package className="w-10 h-10 text-muted-foreground/20" />
              </div>
              <div className="text-base font-bold text-foreground/40 mb-1">Tabela vazia</div>
              <p className="text-sm max-w-[240px] leading-relaxed">
                Os itens bipados aparecerão aqui. <br /> Comece a conferência no painel lateral.
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
