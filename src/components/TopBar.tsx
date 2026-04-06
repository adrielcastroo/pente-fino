import { useAppStore, formatML } from '@/store/useAppStore';
import { motion } from 'framer-motion';
import * as XLSX from 'xlsx';
import { useToastStore } from '@/hooks/useToast';
import { Settings, Download, Ruler, User } from 'lucide-react';
import logoImg from '@/assets/logo.ico';
import { getRegistroColumns } from '@/lib/registroColumns';

export default function TopBar({ onOpenConfig }: { onOpenConfig?: () => void }) {
  const { currentMode, processo, conferente, setConferente, registros, archiveAndClear } = useAppStore();
  const addToast = useToastStore(s => s.addToast);
  const totalML = registros.reduce((a, r) => a + r.mLinear, 0);

  const exportExcel = async () => {
    if (!registros.length) { addToast('Nenhum rolo para exportar.', 'warn'); return; }
    const requiresProcesso = registros.some(r => r.modoOrigem !== 'diversos') || currentMode !== 'diversos';
    if (requiresProcesso && !processo.trim()) { addToast('Preencha o campo PROCESSO.', 'warn'); return; }
    if (!conferente) { addToast('Preencha o campo CONFERENTE.', 'warn'); return; }
    const columns = getRegistroColumns(registros, currentMode);
    const headers = columns.map(column => column.label);
    const data = registros.map(r => columns.map(column => (r as any)[column.key] ?? ''));
    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
    ws['!cols'] = columns.map(column => ({ wch: column.width }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Conferência');

    // Determine file name and archive name
    const isDiversosOnly = registros.every(r => r.modoOrigem === 'diversos');
    let fileLabel: string;
    let archiveName: string;
    if (isDiversosOnly) {
      const nfs = Array.from(new Set(registros.map(r => (r.nf || '').trim()).filter(Boolean)));
      fileLabel = nfs.length > 0 ? `NF_${nfs.join('_')}` : (processo.trim() || 'diversos');
      archiveName = nfs.length > 0 ? `NF ${nfs.join(', ')}` : (processo.trim() || 'Diversos');
    } else {
      fileLabel = processo.trim() || 'conferencia';
      archiveName = processo.trim() ? `PROC ${processo.trim()}` : 'Conferência';
    }

    XLSX.writeFile(wb, `conferencia_${fileLabel.replace(/[/\\,\s]+/g, '_')}.xlsx`);
    const count = registros.length;
    await archiveAndClear(archiveName);
    addToast(`Excel exportado — ${count} rolos arquivados`, 'ok');
  };

  return (
    <motion.header
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="topbar-bg text-primary-foreground flex items-center gap-2 sm:gap-3 px-3 sm:px-5 h-12 sm:h-14 sticky top-0 z-50"
      style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div className="flex items-center gap-2 flex-shrink-0">
        <img src={logoImg} alt="Pente Fino" className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg object-contain" />
        <div className="font-semibold text-sm leading-tight">Pente Fino</div>
      </div>

      <div className="flex items-center gap-1.5 min-w-0">
        <User className="w-3 h-3 text-white/30" />
        <input
          className="glass-input font-medium w-[92px] sm:w-[120px] text-xs min-w-0"
          value={conferente}
          onChange={e => setConferente(e.target.value)}
          placeholder="Conferente *"
          autoComplete="off"
          required
        />
      </div>

      <div className="flex gap-1 ml-auto items-center">
        <div className="stat-pill">
          <span className="font-semibold font-mono text-white text-xs">{registros.length}</span>
          <span className="text-white/35 text-[9px] uppercase tracking-wider">Rolos</span>
        </div>
        <div className="stat-pill hidden sm:flex">
          <Ruler className="w-3 h-3 text-white/35" />
          <span className="font-semibold font-mono text-white text-xs">{formatML(totalML) || '0'}</span>
        </div>
      </div>

      <div className="flex gap-1.5 flex-shrink-0">
        <button className="glass-btn-accent glass-btn" onClick={exportExcel} title="Exportar Excel">
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline text-xs">Excel</span>
        </button>
        <button className="glass-btn" onClick={onOpenConfig} title="Configurações API">
          <Settings className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.header>
  );
}
