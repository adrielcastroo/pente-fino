import { useAppStore, formatML } from '@/store/useAppStore';
import { motion } from 'framer-motion';
import * as XLSX from 'xlsx';
import { useToastStore } from '@/hooks/useToast';
import { Settings, Download, User } from 'lucide-react';
import logoImg from '@/assets/logo.ico';
import { getRegistroColumns } from '@/lib/registroColumns';

type AppTab = 'tecido' | 'madeira' | 'motor' | 'table' | 'history';

interface TopBarProps {
  onOpenConfig?: () => void;
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
}

const tabs: { key: AppTab; label: string }[] = [
  { key: 'tecido', label: 'Tecido' },
  { key: 'madeira', label: 'Madeira' },
  { key: 'motor', label: 'Motor/Controle' },
  { key: 'table', label: 'Tabela' },
  { key: 'history', label: 'Histórico' },
];

export default function TopBar({ onOpenConfig, activeTab, onTabChange }: TopBarProps) {
  const { currentMode, processo, conferente, setConferente, registros, archiveAndClear } = useAppStore();
  const addToast = useToastStore(s => s.addToast);

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
      className="topbar-bg text-primary-foreground sticky top-0 z-50"
      style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
    >
      {/* Top row: logo + actions */}
      <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-5 h-12 sm:h-14">
        <div className="flex items-center gap-2 flex-shrink-0">
          <img src={logoImg} alt="Pente Fino" className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg object-contain" />
          <div className="font-semibold text-sm leading-tight">Pente Fino</div>
        </div>

        {/* Nav tabs */}
        <nav className="flex items-center gap-0.5 sm:gap-1 ml-2 overflow-x-auto scrollbar-none flex-1 min-w-0">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              className={`whitespace-nowrap px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-medium uppercase tracking-wider transition-colors rounded-md relative ${
                activeTab === tab.key
                  ? 'text-white bg-white/10'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/5'
              }`}
            >
              {tab.label}
              {tab.key === 'table' && registros.length > 0 && (
                <span className="ml-1 inline-flex items-center justify-center min-w-[16px] h-[16px] rounded-full bg-primary text-primary-foreground text-[9px] font-bold px-1">
                  {registros.length}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex gap-1.5 items-center flex-shrink-0">
          <div className="flex items-center gap-1 min-w-0">
            <User className="w-3 h-3 text-white/30" />
            <input
              className="glass-input font-medium w-[80px] sm:w-[110px] text-xs min-w-0"
              value={conferente}
              onChange={e => setConferente(e.target.value)}
              placeholder="Conferente *"
              autoComplete="off"
              required
            />
          </div>
          <button className="glass-btn-accent glass-btn" onClick={exportExcel} title="Exportar Excel">
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-xs">Excel</span>
          </button>
          <button className="glass-btn" onClick={onOpenConfig} title="Configurações API">
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.header>
  );
}
