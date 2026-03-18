import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useToastStore } from '@/hooks/useToast';
import TopBar from '@/components/TopBar';
import LeftPanel from '@/components/LeftPanel';
import RightPanel from '@/components/RightPanel';
import ToastContainer from '@/components/ToastContainer';
import ConfigModal from '@/components/ConfigModal';
import ShortcutsModal from '@/components/ShortcutsModal';
import * as XLSX from 'xlsx';

export default function Index() {
  const { loadFromStorage, undo } = useAppStore();
  const addToast = useToastStore(s => s.addToast);
  const [configOpen, setConfigOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (document.activeElement as HTMLElement)?.tagName;
      const typing = tag === 'INPUT' || tag === 'TEXTAREA';

      if (shortcutsOpen || configOpen) {
        if (e.key === 'Escape') { setShortcutsOpen(false); setConfigOpen(false); }
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); const r = undo(); if (r) addToast('Rolo restaurado', 'ok'); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        const regs = useAppStore.getState().registros;
        if (!regs.length) { addToast('Nenhum rolo para exportar.', 'warn'); return; }
        const nfe = useAppStore.getState().nfe || 'sem_nfe';
        const headers = ['Item', 'Largura', 'Endereço', 'M Linear', 'Cor', 'Lote'];
        const data = regs.map(r => [r.item, r.largura, r.endereco, r.mLinear, r.obs || '', r.lote]);
        const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
        ws['!cols'] = [{ wch: 22 }, { wch: 10 }, { wch: 18 }, { wch: 12 }, { wch: 24 }, { wch: 32 }];
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Conferência');
        XLSX.writeFile(wb, `conferencia_NFe_${nfe}.xlsx`);
        addToast(`Excel: ${regs.length} rolos exportados`, 'ok');
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'f' && !typing) {
        e.preventDefault();
        document.querySelector<HTMLInputElement>('[placeholder*="Filtrar"]')?.focus();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); setShortcutsOpen(true); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'l' && !typing) {
        e.preventDefault();
        const loteEl = document.querySelector<HTMLSpanElement>('.lote-display span');
        if (loteEl?.textContent && loteEl.textContent !== '—') {
          navigator.clipboard.writeText(loteEl.textContent);
          addToast('Copiado: ' + loteEl.textContent, 'ok');
        }
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [undo, addToast, configOpen, shortcutsOpen]);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <TopBar />
      <div className="flex-1 grid grid-cols-[420px_1fr] overflow-hidden">
        <LeftPanel />
        <RightPanel />
      </div>
      <ToastContainer />
      <ConfigModal open={configOpen} onClose={() => setConfigOpen(false)} />
      <ShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </div>
  );
}
