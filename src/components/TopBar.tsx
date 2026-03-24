import { useAppStore, formatML } from '@/store/useAppStore';
import { motion } from 'framer-motion';
import * as XLSX from 'xlsx';
import { useToastStore } from '@/hooks/useToast';
import { Settings, Download, Package, Ruler, Square } from 'lucide-react';

export default function TopBar({ onOpenConfig }: { onOpenConfig?: () => void }) {
  const { nfe, setNfe, registros, clearAll } = useAppStore();
  const addToast = useToastStore(s => s.addToast);

  const totalML = registros.reduce((a, r) => a + r.mLinear, 0);
  const totalM2 = registros.reduce((a, r) => a + r.m2, 0);

  const exportExcel = () => {
    if (!registros.length) { addToast('Nenhum rolo para exportar.', 'warn'); return; }
    const nfeVal = nfe || 'sem_nfe';
    const headers = ['Item', 'Largura', 'Endereço', 'M Linear', 'Cor', 'Lote'];
    const rows = registros.map(r => [r.item, r.largura, r.endereco, r.mLinear, r.obs || '', r.lote]);
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    ws['!cols'] = [{ wch: 22 }, { wch: 10 }, { wch: 18 }, { wch: 12 }, { wch: 24 }, { wch: 32 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Conferência');
    XLSX.writeFile(wb, `conferencia_NFe_${nfeVal}.xlsx`);
    clearAll();
    addToast(`Excel exportado e tabela limpa (${registros.length} rolos)`, 'ok');
  };

  return (
    <motion.header
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="topbar-bg text-primary-foreground flex items-center gap-2 sm:gap-4 px-3 sm:px-5 h-12 sm:h-14 sticky top-0 z-50"
      style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="w-7 h-7 sm:w-8 sm:h-8 bg-primary rounded-lg flex items-center justify-center">
          <Package className="w-4 h-4 text-primary-foreground" />
        </div>
        <div className="hidden sm:block">
          <div className="font-semibold text-sm leading-tight">Conferência de Tecidos</div>
          <div className="text-[10px] opacity-40 font-mono">SAP B1 · Multi-IA</div>
        </div>
      </div>

      {/* NFe Input */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider hidden sm:inline">NFe</span>
        <input
          className="glass-input font-mono font-medium w-[80px] sm:w-[140px] text-xs"
          value={nfe}
          onChange={e => setNfe(e.target.value)}
          placeholder="NFe"
          autoComplete="off"
        />
      </div>

      {/* Stats */}
      <div className="flex gap-1 ml-auto items-center">
        <div className="stat-pill">
          <span className="font-semibold font-mono text-white text-xs">{registros.length}</span>
          <span className="text-white/35 text-[9px] uppercase tracking-wider">Rolos</span>
        </div>
        <div className="stat-pill hidden sm:flex">
          <Ruler className="w-3 h-3 text-white/35" />
          <span className="font-semibold font-mono text-white text-xs">{formatML(totalML) || '0'}</span>
        </div>
        <div className="stat-pill hidden sm:flex">
          <Square className="w-3 h-3 text-white/35" />
          <span className="font-semibold font-mono text-white text-xs">{totalM2.toFixed(1)}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-1.5 flex-shrink-0">
        <button className="glass-btn-accent glass-btn" onClick={exportExcel} title="Exportar Excel">
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline text-xs">Excel</span>
        </button>
        <button className="glass-btn" onClick={onOpenConfig} title="Configurações API">
          <Settings className="w-3.5 h-3.5" />
          <span className="hidden sm:inline text-xs">API</span>
        </button>
      </div>
    </motion.header>
  );
}
