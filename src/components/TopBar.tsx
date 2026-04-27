import { memo, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useShallow } from 'zustand/react/shallow';
import { exportConferenceToExcel, exportMotorControleToExcel } from '@/lib/export-utils';
import { toast } from 'sonner';
import { Download, User, Archive, CheckCircle2, LogOut, ScanBarcode } from 'lucide-react';
import { getRegistroColumns } from '@/lib/registroColumns';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/hooks/use-auth';


const TopBar = memo(function TopBar() {
  const isMobile = useIsMobile();
  const { user, isGuest, guestName, signOut, profile } = useAuth();
   const currentMode = useAppStore(s => s.currentMode);
   const processo = useAppStore(s => s.processo);
   const conferente = useAppStore(s => s.conferente);
   const setConferente = useAppStore(s => s.setConferente);
   const registroCount = useAppStore(s => s.registros.length);
   const archiveAndClear = useAppStore(s => s.archiveAndClear);
   const isArchiving = useAppStore(s => s.isArchiving);
   const { registros } = useAppStore(useShallow(s => ({ registros: s.registros })));

    // Ensure conferente is synced with auth profile or guest name
    useEffect(() => {
      if (!isGuest && user && !conferente.trim()) {
        const name = profile?.display_name || user.email?.split('@')[0] || 'Usuário';
        setConferente(name);
      } else if (isGuest && guestName && !conferente.trim()) {
        setConferente(guestName);
      }
    }, [isGuest, guestName, user, profile, conferente, setConferente]);

  
  const exportExcel = async () => {
    if (isArchiving) return;
    const currentRegistros = useAppStore.getState().registros;
    if (!currentRegistros.length) { 
      toast.warning('Nenhum registro para exportar.'); 
      return; 
    }

    const isMotorControle = currentRegistros.some(r => r.modoOrigem === 'motor' || r.modoOrigem === 'controle');
    const requiresProcesso = !isMotorControle && (currentRegistros.some(r => r.modoOrigem !== 'diversos') || currentMode !== 'diversos');
    
    if (requiresProcesso && !processo.trim()) { 
      toast.warning('Preencha o campo PROCESSO para continuar.'); 
      return; 
    }
    
    if (!conferente.trim()) { 
      toast.warning('Identifique-se preenchendo o nome do CONFERENTE.'); 
      return; 
    }

    const columns = getRegistroColumns(currentRegistros, currentMode);
    const headers = columns.map(column => column.label);
    const data = currentRegistros.map(r => columns.map(column => (r as any)[column.key] ?? ''));
    const columnWidths = columns.map(column => column.width);

    let fileLabel: string;
    let archiveName: string;

    if (isMotorControle) {
      const nfs = Array.from(new Set(currentRegistros.map(r => (r.nf || '').trim()).filter(Boolean)));
      fileLabel = nfs.length > 0 ? `Motores NF ${nfs.join(' ')}` : 'Motores';
      archiveName = nfs.length > 0 ? `NF ${nfs.join(', ')}` : 'Motor/Controle';
    } else {
      const isDiversosOnly = currentRegistros.every(r => r.modoOrigem === 'diversos');
      if (isDiversosOnly) {
        const nfs = Array.from(new Set(currentRegistros.map(r => (r.nf || '').trim()).filter(Boolean)));
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
      const count = currentRegistros.length;
      if (isMotorControle) {
        await exportMotorControleToExcel(currentRegistros, fileName);
      } else {
        await exportConferenceToExcel(headers, data, fileName, columnWidths);
      }
      await archiveAndClear(archiveName);
      toast.success(`Exportação concluída! ${count} registros arquivados com sucesso.`, {
        icon: <CheckCircle2 className="w-4 h-4 text-primary" />,
      });
    } catch (error: any) {
      toast.error(error.message || 'Falha ao exportar e arquivar registros.');
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="flex h-14 sm:h-16 xl:h-[72px] items-center gap-2 sm:gap-4 px-3 sm:px-6 xl:px-8 max-w-[2000px] mx-auto">
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="h-9 w-9 sm:h-10 sm:w-10 flex items-center justify-center bg-primary/10 text-primary rounded-xl shrink-0">
             <ScanBarcode className="w-5 h-5" />
          </div>
          <div className="hidden md:flex flex-col">
            <p className="text-sm font-bold text-foreground tracking-tight">
              Sistema <span className="text-primary">Pente Fino</span>
            </p>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-end gap-2 sm:gap-3 min-w-0">
          {isGuest && (
            <div className="relative group w-full max-w-[160px] sm:max-w-[240px] md:max-w-[280px] lg:max-w-[340px]">
              <label htmlFor="conferente-input" className="sr-only">Nome do Conferente</label>
              <div className="absolute left-3 sm:left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 group-focus-within:text-primary transition-colors z-10 pointer-events-none">
                <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </div>
              <input
                id="conferente-input"
                className="h-9 sm:h-10 xl:h-11 w-full rounded-xl border border-border/60 bg-muted/30 pl-8 sm:pl-10 pr-3 text-[11px] sm:text-sm font-semibold tracking-tight ring-offset-background placeholder:text-muted-foreground/40 placeholder:font-normal focus:bg-background focus:border-primary/40 focus:ring-4 focus:ring-primary/5 transition-all duration-200"
                value={conferente}
                onChange={e => setConferente(e.target.value)}
                placeholder={isMobile ? "Conf..." : "Conferente..."}
                autoComplete="name"
                required
                aria-required="true"
              />
            </div>
          )}

          {!isGuest && user && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-primary/5 rounded-xl border border-primary/10">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                <User className="w-3.5 h-3.5 text-primary" />
              </div>
              <span className="text-xs font-bold text-foreground truncate max-w-[80px] md:max-w-[120px]">
                {profile?.display_name || user.email?.split('@')[0] || 'Usuário'}
              </span>
            </div>
          )}

          {isGuest && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-muted/20 rounded-xl border border-border/10">
              <div className="w-6 h-6 rounded-full bg-muted/40 flex items-center justify-center">
                <User className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">
                Visitante
              </span>
            </div>
          )}


          <div className="h-6 w-[1px] bg-border/30 mx-0.5 hidden sm:block" />

          {registroCount > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  onClick={exportExcel}
                  size="sm"
                  disabled={isArchiving}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-3 sm:px-5 h-9 sm:h-10 xl:h-11 rounded-xl shadow-md shadow-primary/15 transition-all active:scale-95 gap-1.5 sm:gap-2 text-xs group/btn relative overflow-hidden shrink-0"
                >
                  {isArchiving ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  )}
                  <span className="hidden sm:inline font-bold">{isArchiving ? 'Aguarde...' : 'Exportar'}</span>
                  {!isArchiving && (
                    <Badge variant="secondary" className="bg-white/20 text-white border-none px-1.5 h-5 min-w-[20px] flex items-center justify-center font-bold text-[10px] rounded-md">
                      {registroCount}
                    </Badge>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent className="font-semibold">
                <p>Exportar {registroCount} registros para Excel</p>
              </TooltipContent>
            </Tooltip>
          )}

          {registroCount === 0 && (
            <Badge variant="outline" className="h-9 sm:h-10 px-3 sm:px-4 rounded-xl border-dashed border-border/40 bg-transparent text-muted-foreground/50 font-medium flex gap-1.5 shrink-0">
              <Archive className="w-3.5 h-3.5 opacity-50" />
              <span className="text-[10px] sm:text-xs whitespace-nowrap">Vazio</span>
            </Badge>
          )}
        </div>
      </div>
    </header>
  );
});

export default TopBar;