import { useAppStore, formatML } from '@/store/useAppStore';
import * as XLSX from 'xlsx';
import { useToastStore } from '@/hooks/useToast';
import { Download, User } from 'lucide-react';
import { getRegistroColumns } from '@/lib/registroColumns';
import { SidebarTrigger } from '@/components/ui/sidebar';

export default function TopBar() {
  const { currentMode, processo, conferente, setConferente, registros, archiveAndClear } = useAppStore();
  const addToast = useToastStore(s => s.addToast);

  const exportExcel = async () => {
    if (!registros.length) { addToast('Nenhum rolo para exportar.', 'warn'); return; }

    const isMotorControle = registros.some(r => r.modoOrigem === 'motor' || r.modoOrigem === 'controle');
    const requiresProcesso = !isMotorControle && (registros.some(r => r.modoOrigem !== 'diversos') || currentMode !== 'diversos');
    if (requiresProcesso && !processo.trim()) { addToast('Preencha o campo PROCESSO.', 'warn'); return; }
    if (!conferente) { addToast('Preencha o campo CONFERENTE.', 'warn'); return; }

    const columns = getRegistroColumns(registros, currentMode);
    const headers = columns.map(column => column.label);
    const data = registros.map(r => columns.map(column => (r as any)[column.key] ?? ''));
    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
    ws['!cols'] = columns.map(column => ({ wch: column.width }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Conferência');

    let fileLabel: string;
    let archiveName: string;

    if (isMotorControle) {
      const nfs = Array.from(new Set(registros.map(r => (r.nf || '').trim()).filter(Boolean)));
      fileLabel = nfs.length > 0 ? `Motores NF ${nfs.join(' ')}` : 'Motores';
      archiveName = nfs.length > 0 ? `NF ${nfs.join(', ')}` : 'Motor/Controle';
    } else {
      const isDiversosOnly = registros.every(r => r.modoOrigem === 'diversos');
      if (isDiversosOnly) {
        const nfs = Array.from(new Set(registros.map(r => (r.nf || '').trim()).filter(Boolean)));
        fileLabel = nfs.length > 0 ? `NF_${nfs.join('_')}` : (processo.trim() || 'diversos');
        archiveName = nfs.length > 0 ? `NF ${nfs.join(', ')}` : (processo.trim() || 'Diversos');
      } else {
        fileLabel = processo.trim() || 'conferencia';
        archiveName = processo.trim() ? `PROC ${processo.trim()}` : 'Conferência';
      }
    }

    const fileName = isMotorControle
      ? `${fileLabel}.xlsx`
      : `conferencia_${fileLabel.replace(/[/\\,\s]+/g, '_')}.xlsx`;

    XLSX.writeFile(wb, fileName);
    const count = registros.length;
    await archiveAndClear(archiveName);
    addToast(`Excel exportado — ${count} rolos arquivados`, 'ok');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="h-9 w-9 text-muted-foreground hover:text-foreground transition-colors" />
          <div className="h-4 w-px bg-border/50 mx-1 hidden sm:block" />
        </div>

        <div className="flex flex-1 items-center justify-end space-x-3">
          <div className="flex items-center gap-2 relative group max-w-[200px]">
            <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
              <User className="h-3.5 w-3.5" />
            </div>
            <input
              className="h-9 w-full rounded-full border border-input bg-background pl-8 pr-3 text-xs ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all duration-200"
              value={conferente}
              onChange={e => setConferente(e.target.value)}
              placeholder="Conferente *"
              autoComplete="off"
              required
            />
          </div>

          <button
            className="inline-flex h-9 items-center justify-center gap-2 rounded-full px-4 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm shadow-primary/20 transition-all duration-200 active:scale-95 disabled:opacity-50"
            onClick={exportExcel}
            title="Exportar Excel"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Exportar</span>
          </button>
        </div>
      </div>
    </header>
  );
}
