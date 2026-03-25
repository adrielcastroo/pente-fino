import { useAppStore, formatML } from '@/store/useAppStore';
import { useToastStore } from '@/hooks/useToast';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';
import { Search, Download, Trash2, Undo2, Copy, X, Package } from 'lucide-react';

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
  const { registros, searchQuery, setSearchQuery, sortBy, setSortBy, deleteRegistro, undo, undoStack, archiveAndClear } = useAppStore();
  const addToast = useToastStore(s => s.addToast);

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

  const copyText = (t: string) => {
    navigator.clipboard.writeText(t).then(() => addToast('Copiado: ' + t, 'ok'));
  };

  const exportExcel = async () => {
    if (!registros.length) { addToast('Nenhum rolo para exportar.', 'warn'); return; }
    const proc = useAppStore.getState().processo || 'sem_proc';
    const headers = ['Item/Referência', 'Largura', 'Endereço', 'M Linear', 'M²', 'Lote/Batch', 'Lote Final (Sistema)'];
    const data = registros.map(r => [r.item, r.largura, r.endereco, r.mLinear, r.m2, r.lote, r.loteSistema]);
    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
    ws['!cols'] = [{ wch: 28 }, { wch: 10 }, { wch: 18 }, { wch: 12 }, { wch: 10 }, { wch: 24 }, { wch: 36 }];
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
      initial={{ x: 40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col overflow-hidden bg-background"
    >
      {/* Undo bar */}
      <AnimatePresence>
        {undoStack.length > 0 && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="navy-2-bg text-primary-foreground px-4 py-2 text-sm flex items-center gap-2.5 flex-shrink-0"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <span>Rolo removido</span>
            <button onClick={() => { const r = undo(); if (r) addToast('Rolo restaurado', 'ok'); }}
              className="bg-primary text-primary-foreground rounded-lg px-3 py-1.5 text-xs font-medium flex items-center gap-1.5">
              <Undo2 className="w-3 h-3" /> Desfazer
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toolbar */}
      <div className="px-3 sm:px-4 py-2 surface-bg border-b border-border flex flex-wrap items-center gap-2 flex-shrink-0">
        <div className="flex items-center gap-2 surface-2-bg border border-border rounded-lg px-3 flex-1 min-w-0">
          <Search className="w-4 h-4 text-muted-foreground/40 flex-shrink-0" />
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="border-none bg-transparent outline-none text-sm py-2 w-full" placeholder="Filtrar…" autoComplete="off" />
        </div>
        <div className="flex gap-1.5 items-center">
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            className="border border-border rounded-lg px-2.5 py-2 text-xs text-muted-foreground bg-card outline-none cursor-pointer">
            <option value="">Ordenar</option>
            <option value="item">Item A→Z</option>
            <option value="ml-d">M Lin ↓</option>
            <option value="ml-a">M Lin ↑</option>
            <option value="end">Endereço</option>
          </select>
          <button onClick={exportExcel} className="p-2 rounded-lg border border-border hover:bg-muted transition-colors" title="Exportar Excel">
            <Download className="w-4 h-4 text-muted-foreground" />
          </button>
          {registros.length > 0 && (
            <button onClick={handleClearAll} className="p-2 rounded-lg border border-border hover:bg-muted transition-colors" title="Limpar tudo">
              <Trash2 className="w-4 h-4 text-destructive" />
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <div className="min-w-[600px]">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="sticky top-0 z-10 surface-bg border-b-2 border-border px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider w-[38px]">#</th>
                <th className="sticky top-0 z-10 surface-bg border-b-2 border-border px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Item</th>
                <th className="sticky top-0 z-10 surface-bg border-b-2 border-border px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Larg.</th>
                <th className="sticky top-0 z-10 surface-bg border-b-2 border-border px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Endereço</th>
                <th className="sticky top-0 z-10 surface-bg border-b-2 border-border px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">M Lin</th>
                <th className="sticky top-0 z-10 surface-bg border-b-2 border-border px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">M²</th>
                <th className="sticky top-0 z-10 surface-bg border-b-2 border-border px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Lote Final</th>
                <th className="sticky top-0 z-10 surface-bg border-b-2 border-border px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider w-[60px]"></th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {rows.map((r, i) => (
                  <motion.tr key={r.id}
                    initial={r.isNew ? { opacity: 0, y: -4 } : false}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="border-b border-border hover:bg-primary/[0.04] transition-colors">
                    <td className="px-3 py-2.5 text-sm text-muted-foreground">{i + 1}</td>
                    <td className="px-3 py-2.5 text-sm font-semibold">{highlight(r.item, q)}</td>
                    <td className="px-3 py-2.5 text-sm font-mono">{r.largura > 0 ? r.largura.toFixed(2) + 'm' : '—'}</td>
                    <td className="px-3 py-2.5 text-sm font-mono">{highlight(r.endereco, q)}</td>
                    <td className="px-3 py-2.5 text-sm font-mono">{formatML(r.mLinear)}</td>
                    <td className="px-3 py-2.5 text-sm font-mono">{r.m2 > 0 ? r.m2.toFixed(1) : '—'}</td>
                    <td className="px-3 py-2.5 text-sm font-mono max-w-[160px] overflow-hidden text-ellipsis whitespace-nowrap">
                      <span className="cursor-pointer text-primary hover:underline" onClick={() => copyText(r.loteSistema)}>{r.loteSistema || '—'}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="row-acts">
                        <button onClick={() => copyText(r.loteSistema)} className="p-1.5 rounded-md hover:bg-muted transition-colors" title="Copiar lote sistema">
                          <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                        <button onClick={() => deleteRegistro(r.id)} className="p-1.5 rounded-md hover:bg-muted transition-colors" title="Remover">
                          <X className="w-3.5 h-3.5 text-destructive" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
            {rows.length > 0 && (
              <tfoot>
                <tr className="navy-bg text-primary-foreground font-semibold font-mono text-xs sticky bottom-0">
                  <td colSpan={2} className="px-3 py-2.5">TOTAL — {rows.length} rolo{rows.length !== 1 ? 's' : ''}</td>
                  <td className="px-3 py-2.5">—</td>
                  <td className="px-3 py-2.5">—</td>
                  <td className="px-3 py-2.5">{formatML(totalML)}</td>
                  <td className="px-3 py-2.5">{totalM2 > 0 ? totalM2.toFixed(1) : '—'}</td>
                  <td colSpan={2} className="px-3 py-2.5"></td>
                </tr>
              </tfoot>
            )}
          </table>

          {rows.length === 0 && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-16 text-muted-foreground text-center">
              <Package className="w-10 h-10 text-muted-foreground/20 mb-3" />
              <div className="text-sm font-medium text-foreground/60 mb-1">Nenhum rolo conferido</div>
              <div className="text-xs text-muted-foreground">Adicione rolos pelo painel à esquerda</div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
