import { useAppStore, formatML } from '@/store/useAppStore';
import { motion } from 'framer-motion';
import * as XLSX from 'xlsx';
import { useToastStore } from '@/hooks/useToast';
import { Settings, Download, Ruler, User } from 'lucide-react';
import logoImg from '@/assets/logo.ico';

export default function TopBar({ onOpenConfig }: { onOpenConfig?: () => void }) {
  const { processo, setProcesso, conferente, setConferente, registros, archiveAndClear } = useAppStore();
  const addToast = useToastStore(s => s.addToast);
  const totalML = registros.reduce((a, r) => a + r.mLinear, 0);

  const exportExcel = async () => {
    if (!registros.length) { addToast('Nenhum rolo para exportar.', 'warn'); return; }
    if (!processo) { addToast('Preencha o campo PROCESSO.', 'warn'); return; }
    if (!conferente) { addToast('Preencha o campo CONFERENTE.', 'warn'); return; }
    const headers = ['Item/Referência', 'Largura', 'Endereço', 'M Linear', 'M²', 'Lote/Batch', 'Lote Final (Sistema)'];
    const data = registros.map(r => [r.item, r.largura, r.endereco, r.mLinear, r.m2, r.lote, r.loteSistema]);
    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
    ws['!cols'] = [{ wch: 28 }, { wch: 10 }, { wch: 18 }, { wch: 12 }, { wch: 10 }, { wch: 24 }, { wch: 36 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Conferência');
    XLSX.writeFile(wb, `conferencia_PROC_${processo.replace(/[/\\]/g, '_')}.xlsx`);
    const count = registros.length;
    await archiveAndClear(`PROC ${processo}`);
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
        <div className="hidden sm:block">
          <div className="font-semibold text-sm leading-tight">Conferência de Tecidos</div>
          <div className="text-[10px] opacity-40 font-mono">SAP B1</div>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider hidden sm:inline">PROC</span>
        <input
          className="glass-input font-mono font-medium w-[100px] sm:w-[140px] text-xs"
          value={processo}
          onChange={e => setProcesso(e.target.value)}
          placeholder="Processo *"
          autoComplete="off"
          required
        />
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
