import { useAppStore } from '@/store/useAppStore';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { Download, User, Archive, CheckCircle2 } from 'lucide-react';
import { getRegistroColumns } from '@/lib/registroColumns';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export default function TopBar() {
  const { currentMode, processo, conferente, setConferente, registros, archiveAndClear } = useAppStore();
  
  const exportExcel = async () => {
    if (!registros.length) { 
      toast.warning('Nenhum registro para exportar.'); 
      return; 
    }

    const isMotorControle = registros.some(r => r.modoOrigem === 'motor' || r.modoOrigem === 'controle');
    const requiresProcesso = !isMotorControle && (registros.some(r => r.modoOrigem !== 'diversos') || currentMode !== 'diversos');
    
    if (requiresProcesso && !processo.trim()) { 
      toast.warning('Preencha o campo PROCESSO para continuar.'); 
      return; 
    }
    
    if (!conferente.trim()) { 
      toast.warning('Identifique-se preenchendo o nome do CONFERENTE.'); 
      return; 
    }

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
    toast.success(`Exportação concluída! ${count} registros arquivados com sucesso.`, {
      icon: <CheckCircle2 className="w-4 h-4 text-primary" />,
    });
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/60 backdrop-blur-xl supports-[backdrop-filter]:bg-background/40 transition-all duration-500">
      <div className="flex h-14 sm:h-20 items-center gap-1.5 sm:gap-4 px-3 sm:px-8 max-w-[1800px] mx-auto">
        <div className="flex items-center gap-1.5 sm:gap-4">
          <SidebarTrigger className="h-9 w-9 sm:h-12 sm:w-12 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-300 rounded-xl shrink-0 border border-transparent hover:border-primary/20" />
          <div className="hidden xs:flex flex-col">
            <h2 className="text-[10px] sm:text-xs font-black tracking-[0.2em] leading-none uppercase text-muted-foreground/60">Painel Operacional</h2>
            <p className="text-xs sm:text-base font-black text-foreground uppercase tracking-tight mt-1">
              Sistema <span className="text-primary">Pente Fino</span>
            </p>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-end gap-1.5 sm:gap-6 min-w-0">
          <div className="relative group w-full max-w-[140px] xs:max-w-[200px] sm:max-w-[320px]">
            <label htmlFor="conferente-input" className="sr-only">Nome do Conferente</label>
            <div className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary group-hover:text-primary/70 transition-all z-10">
              <User className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <input
              id="conferente-input"
              className="h-10 sm:h-14 w-full rounded-2xl border border-border/50 bg-muted/30 pl-10 sm:pl-14 pr-4 text-xs sm:text-base font-bold tracking-tight ring-offset-background placeholder:text-muted-foreground/40 placeholder:font-medium focus:bg-background focus:border-primary/40 focus:ring-8 focus:ring-primary/5 transition-all duration-300 shadow-inner group-hover:border-border/80"
              value={conferente}
              onChange={e => setConferente(e.target.value)}
              placeholder="Nome do Conferente..."
              autoComplete="name"
              required
              aria-required="true"
            />
          </div>

          <div className="h-8 sm:h-10 w-[1px] bg-border/40 mx-1 hidden xs:block" />

          {registros.length > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  onClick={exportExcel}
                  size="sm"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-black px-3 sm:px-8 h-10 sm:h-14 rounded-2xl shadow-xl shadow-primary/25 transition-all hover:-translate-y-1 active:translate-y-0.5 gap-2 sm:gap-3 text-xs sm:text-base group/btn relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-white/10 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
                  <Download className="w-4 h-4 sm:w-6 sm:h-6 animate-bounce-subtle relative z-10" />
                  <span className="hidden sm:inline relative z-10">Finalizar e Exportar</span>
                  <Badge variant="secondary" className="bg-white/20 text-white border-none px-1.5 h-5 sm:h-6 min-w-[20px] sm:min-w-[24px] flex items-center justify-center font-black text-[10px] sm:text-xs relative z-10">
                    {registros.length}
                  </Badge>
                </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-popover/90 backdrop-blur-md border-border/40 shadow-2xl p-3 rounded-xl font-bold text-sm">
                <p>Exportar {registros.length} registros para Excel</p>
              </TooltipContent>
            </Tooltip>
          )}

          {registros.length === 0 && (
            <Badge variant="outline" className="h-10 sm:h-14 px-3 sm:px-6 rounded-2xl border-dashed border-muted-foreground/20 bg-muted/5 text-muted-foreground/60 font-bold flex gap-2 shrink-0 transition-all hover:bg-muted/10">
              <Archive className="w-4 h-4 sm:w-5 sm:h-5 opacity-40" />
              <span className="text-[10px] sm:text-sm whitespace-nowrap tracking-wide">Aguardando registros...</span>
            </Badge>
          )}
        </div>
      </div>
    </header>

  );
}
