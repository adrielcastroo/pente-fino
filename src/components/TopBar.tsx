import { useAppStore, formatML } from '@/store/useAppStore';
import * as XLSX from 'xlsx';
import { useToastStore } from '@/hooks/useToast';
import { Settings, Download, User, Menu } from 'lucide-react';
import { getRegistroColumns } from '@/lib/registroColumns';
import { SidebarTrigger } from '@/components/ui/sidebar';

interface TopBarProps {
  onOpenConfig?: () => void;
}

export default function TopBar({ onOpenConfig }: TopBarProps) {
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
    <header
      className="sticky top-0 z-50 bg-card border-b border-border"
    >
      <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 h-12">
        <SidebarTrigger className="text-foreground" />

        <div className="flex-1" />

        {/* Right actions */}
        <div className="flex gap-1.5 items-center flex-shrink-0">
          <div className="flex items-center gap-1 min-w-0">
            <User className="w-3 h-3 text-muted-foreground" />
            <input
              className="rounded-md px-2.5 py-1.5 text-xs outline-none transition-all duration-150 bg-muted border border-border text-foreground w-[100px] sm:w-[140px] min-w-[100px] font-medium placeholder:text-muted-foreground"
              value={conferente}
              onChange={e => setConferente(e.target.value)}
              placeholder="Conferente *"
              autoComplete="off"
              required
            />
          </div>
          <button
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs cursor-pointer transition-all duration-150 whitespace-nowrap bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 font-medium"
            onClick={exportExcel}
            title="Exportar Excel"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Excel</span>
          </button>
          <button
            className="flex items-center gap-1.5 rounded-md p-1.5 text-xs cursor-pointer transition-all duration-150 hover:bg-muted border border-border text-muted-foreground"
            onClick={onOpenConfig}
            title="Configurações API"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
}
