import { memo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { exportConferenceToExcel } from '@/lib/export-utils';
import { toast } from 'sonner';
import { Download, User, Archive, CheckCircle2 } from 'lucide-react';
import { getRegistroColumns } from '@/lib/registroColumns';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const TopBar = memo(function TopBar() {
  const currentMode = useAppStore(s => s.currentMode);
  const processo = useAppStore(s => s.processo);
  const conferente = useAppStore(s => s.conferente);
  const setConferente = useAppStore(s => s.setConferente);
  const registros = useAppStore(s => s.registros);
  const archiveAndClear = useAppStore(s => s.archiveAndClear);
  const isArchiving = useAppStore(s => s.isArchiving);
  
  const exportExcel = async () => {
    if (isArchiving) return;
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
    const columnWidths = columns.map(column => column.width);

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
      ? fileLabel
      : `conferencia_${fileLabel.replace(/[/\\,\s]+/g, '_')}`;

    try {
      const count = registros.length;
      await exportConferenceToExcel(headers, data, fileName, columnWidths);
      await archiveAndClear(archiveName);
      toast.success(`Exportação concluída! ${count} registros arquivados com sucesso.`, {
        icon: <CheckCircle2 className="w-4 h-4 text-primary" />,
      });
    } catch (error: any) {
      toast.error(error.message || 'Falha ao exportar e arquivar registros.');
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/60 backdrop-blur-xl supports-[backdrop-filter]:bg-background/40 transition-all duration-500">
      <div className="flex h-16 sm:h-20 items-center gap-2 px-3 sm:px-8 max-w-[1800px] mx-auto">
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <SidebarTrigger className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-300 rounded-xl shrink-0 border border-transparent hover:border-primary/20" />
          <div className="hidden sm:flex flex-col">
            <h2 className="text-[10px] font-black tracking-[0.2em] leading-none uppercase text-muted-foreground/60">Painel Operacional</h2>
            <p className="text-sm font-black text-foreground uppercase tracking-tight mt-1">
              Sistema <span className="text-primary">Pente Fino</span>
            </p>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-end gap-1.5 sm:gap-6 min-w-0">
          <div className="relative group w-full max-w-[120px] xs:max-w-[180px] sm:max-w-[320px]">
            <label htmlFor="conferente-input" className="sr-only">Nome do Conferente</label>
            <div className="absolute left-2.5 sm:left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary group-hover:text-primary/70 transition-all z-10">
              <User className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
            </div>
            <input
              id="conferente-input"
              className="h-9 sm:h-14 w-full rounded-xl sm:rounded-2xl border border-border/50 bg-muted/30 pl-8 sm:pl-14 pr-3 text-[10px] sm:text-base font-bold tracking-tight ring-offset-background placeholder:text-muted-foreground/40 placeholder:font-medium focus:bg-background focus:border-primary/40 focus:ring-8 focus:ring-primary/5 transition-all duration-300 shadow-inner group-hover:border-border/80"
              value={conferente}
              onChange={e => setConferente(e.target.value)}
              placeholder="Conferente..."
              autoComplete="name"
              required
              aria-required="true"
            />
          </div>

          <div className="h-6 sm:h-10 w-[1px] bg-border/40 mx-0.5 hidden sm:block" />

          {registros.length > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  onClick={exportExcel}
                  size="sm"
                  disabled={isArchiving}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-black px-2 sm:px-8 h-9 sm:h-14 rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl shadow-primary/25 transition-all active:translate-y-0.5 gap-1 sm:gap-3 text-[9px] sm:text-base group/btn relative overflow-hidden shrink-0"
                >
                  <div className="absolute inset-0 bg-white/10 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
                  {isArchiving ? (
                    <div className="w-4 h-4 sm:w-6 sm:h-6 border-2 border-white/30 border-t-white rounded-full animate-spin relative z-10" />
                  ) : (
                    <Download className="w-3.5 h-3.5 sm:w-6 sm:h-6 relative z-10" />
                  )}
                  <span className="hidden xs:inline relative z-10">{isArchiving ? 'Processando...' : 'Exportar'}</span>
                  {!isArchiving && (
                    <Badge variant="secondary" className="bg-white/20 text-white border-none px-1 h-4 sm:h-6 min-w-[16px] sm:min-w-[24px] flex items-center justify-center font-black text-[8px] sm:text-xs relative z-10">
                      {registros.length}
                    </Badge>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-popover/90 backdrop-blur-md border-border/40 shadow-2xl p-3 rounded-xl font-bold text-sm">
                <p>Exportar {registros.length} registros para Excel</p>
              </TooltipContent>
            </Tooltip>
          )}

          {registros.length === 0 && (
            <Badge variant="outline" className="h-9 sm:h-14 px-2 sm:px-6 rounded-xl sm:rounded-2xl border-dashed border-muted-foreground/20 bg-muted/5 text-muted-foreground/60 font-bold flex gap-1.5 sm:gap-2 shrink-0 transition-all hover:bg-muted/10">
              <Archive className="w-3.5 h-3.5 sm:w-5 sm:h-5 opacity-40" />
              <span className="text-[9px] sm:text-sm whitespace-nowrap tracking-wide">Vazio</span>
            </Badge>
          )}
        </div>
      </div>
    </header>

  );
});

export default TopBar;
