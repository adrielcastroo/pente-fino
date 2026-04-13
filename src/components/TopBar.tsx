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
    <header className="sticky top-0 z-40 w-full border-b border-border/10 bg-background/50 backdrop-blur-2xl supports-[backdrop-filter]:bg-background/40">
      <div className="flex h-16 items-center gap-6 px-4 max-w-[1800px] mx-auto">
        <div className="flex items-center">
          <SidebarTrigger className="h-10 w-10 text-muted-foreground hover:text-foreground hover:bg-primary/10 transition-all duration-300 rounded-xl" />
        </div>

        <div className="flex flex-1 items-center justify-end gap-6">
          <div className="flex items-center gap-3 relative group w-full max-w-[280px]">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors z-10">
              <User className="h-4.5 w-4.5" />
            </div>
            <input
              className="h-11 w-full rounded-2xl border border-border/50 bg-muted/40 pl-11 pr-4 text-sm font-bold tracking-tight ring-offset-background placeholder:text-muted-foreground/60 placeholder:font-medium focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/5 focus-visible:border-primary/40 transition-all duration-500 hover:bg-muted/60"
              value={conferente}
              onChange={e => setConferente(e.target.value)}
              placeholder="Nome do Conferente..."
              autoComplete="off"
              required
            />
          </div>

          <button
            className="inline-flex h-11 items-center justify-center gap-2.5 rounded-2xl px-6 text-sm font-black bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_8px_30px_rgb(0,0,0,0.12)] shadow-primary/20 hover:shadow-primary/40 transition-all duration-500 hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 group"
            onClick={exportExcel}
            title="Exportar Excel e Arquivar"
          >
            <Download className="h-4.5 w-4.5 group-hover:translate-y-0.5 transition-transform" />
            <span className="hidden sm:inline">Exportar & Arquivar</span>
            {registros.length > 0 && (
              <span className="flex h-5 w-5 items-center justify-center bg-white/20 rounded-full text-[10px] font-black animate-in zoom-in-50 duration-500">
                {registros.length}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
