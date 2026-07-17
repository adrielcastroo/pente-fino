import { memo, useEffect, useState, useSyncExternalStore } from 'react';
import { componentesExportBus } from '@/lib/componentes-export-bus';
import { useAppStore } from '@/store/useAppStore';
import { useShallow } from 'zustand/react/shallow';
import { exportConferenceToExcel, exportMotorControleToExcel } from '@/lib/export-utils';
import { itensCadastroService } from '@/services/itensCadastroService';
import { toast } from 'sonner';
import { Download, User, CheckCircle2, LogOut, ScanBarcode, ArrowLeftRight } from 'lucide-react';
import { getRegistroColumns } from '@/lib/registroColumns';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/hooks/use-auth';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { GlossaryDialog } from '@/components/GlossaryDialog';
import { ChangelogDialog } from '@/components/ChangelogDialog';


const TopBar = memo(function TopBar() {
  const isMobile = useIsMobile();
  const location = useLocation();
  const navigate = useNavigate();

  const { user, isGuest, guestName, signOut, profile, modules } = useAuth();
  const canSwitchModule = modules.length > 1;
  const [isExporting, setIsExporting] = useState(false);
   const currentMode = useAppStore(s => s.currentMode);
   const processo = useAppStore(s => s.processo);
   const conferente = useAppStore(s => s.conferente);
   const setConferente = useAppStore(s => s.setConferente);
   const registroCount = useAppStore(s => s.registros.length);
   const archiveAndClear = useAppStore(s => s.archiveAndClear);
   const isArchiving = useAppStore(s => s.isArchiving);
   const resetFormData = useAppStore(s => s.resetFormData);
   const resetMotorFormData = useAppStore(s => s.resetMotorFormData);
   const { registros } = useAppStore(useShallow(s => ({ registros: s.registros })));

   const path = location.pathname.replace(/\/$/, '');
   const isRegistroRoute = path === '/estoque/tecido' || path === '/estoque/madeira' || path === '/estoque/motor';
   const isComponentesRoute = path === '/estoque/componentes';
   const componentesState = useSyncExternalStore(
     componentesExportBus.subscribe,
     componentesExportBus.getSnapshot,
     componentesExportBus.getSnapshot,
   );

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
    if (isArchiving || isExporting) return;
    const currentRegistros = [...useAppStore.getState().registros];
    if (!currentRegistros.length) {
      toast.warning('Nenhum item bipado nesta sessão para exportar.');
      return;
    }

    // Visitantes também podem exportar e arquivar no histórico

    const isMotorControle = currentRegistros.some(r => r.modoOrigem === 'motor' || r.modoOrigem === 'controle');
    const requiresProcesso = !isMotorControle &&
      currentRegistros.some(r => r.modoOrigem !== 'diversos' && r.modoOrigem !== 'etiq_pronta' && r.modoOrigem !== 'motor' && r.modoOrigem !== 'controle');

    // Validate BEFORE opening loading toast
    if (!conferente.trim()) {
      toast.warning('Identifique-se preenchendo o nome do CONFERENTE.');
      return;
    }
    if (requiresProcesso && !processo.trim()) {
      toast.warning('Preencha o campo PROCESSO para continuar.');
      return;
    }

    const toastId = toast.loading('Alocando tecidos e preparando arquivo...');


    const columns = getRegistroColumns(currentRegistros, currentMode);
    const isMotorControleExport = currentRegistros.some(r => r.modoOrigem === 'motor' || r.modoOrigem === 'controle');
    let headers = columns.map(column => column.label);
    let data = currentRegistros.map(r => columns.map(column => (r as any)[column.key] ?? ''));
    let columnWidths = columns.map(column => column.width);
    if (!isMotorControleExport) {
      const resolveCodigoInterno = await itensCadastroService.buildCodigoInternoResolver();
      headers = ['Código Interno', ...headers];
      data = currentRegistros.map((r, i) => [resolveCodigoInterno(r.item || ''), ...data[i]]);
      columnWidths = [18, ...columnWidths];
    }

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
      
      setIsExporting(true);

      // 2. Archive and Clear (This includes saving to DB and allocating stock)
      // We do this BEFORE downloading the Excel to ensure data is safe in DB first
      await archiveAndClear(archiveName);

      // Se houve erro no archive (ex.: sessão expirada), abortar — sem baixar Excel nem toast de sucesso
      const archiveError = useAppStore.getState().archiveError;
      if (archiveError) {
        toast.dismiss(toastId);
        return;
      }

      // 3. Download the Excel file
      if (isMotorControle) {
        await exportMotorControleToExcel(currentRegistros, fileName);
      } else {
        await exportConferenceToExcel(headers, data, fileName, columnWidths);
      }
      
      toast.dismiss(toastId);
      toast.success(`Exportação concluída! ${count} registros alocados no estoque e arquivados.`, {
        icon: <CheckCircle2 className="w-4 h-4 text-primary" />,
        action: {
          label: 'Ver no histórico',
          onClick: () => navigate('/estoque/historico'),
        },
      });

    } catch (error: any) {
      toast.dismiss(toastId);
      toast.error(error.message || 'Falha ao exportar e arquivar registros.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <header className="app-topbar sticky top-0 z-40 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="flex h-14 sm:h-16 xl:h-[72px] items-center gap-1 sm:gap-4 px-2 sm:px-6 xl:px-8 max-w-full mx-auto">
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <SidebarTrigger className="hidden desktop:inline-flex h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground hover:text-primary hover:bg-primary/8 transition-all duration-200 rounded-lg sm:rounded-md shrink-0" />
          {isRegistroRoute ? (
            <div className="flex items-center gap-2 sm:gap-2.5">
              <div className="hidden xs:flex w-8 h-8 sm:w-9 sm:h-9 rounded-md bg-primary/10 text-primary items-center justify-center shrink-0">
                <ScanBarcode className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2.2} />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="hidden sm:block text-[11px] sm:text-sm font-semibold text-foreground tracking-tight whitespace-nowrap">Registro &amp; Bipagem</span>
                <span className="text-[9px] sm:text-[10px] text-muted-foreground/70 font-bold">
                  {path === '/estoque/tecido' ? 'Tecido' : path === '/estoque/madeira' ? 'Madeira' : 'Motor / Controle'}
                </span>
              </div>
            </div>
          ) : (
            <div className="hidden xs:flex flex-col">
              <p className="text-[10px] sm:text-sm font-bold text-foreground tracking-tight">
                Sistema <span className="text-primary font-semibold text-[8px] sm:text-xs">Pente Fino</span>
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-1 items-center justify-end gap-1.5 sm:gap-3 min-w-0">
          {isGuest && (
            <div className="relative group w-full max-w-[120px] xs:max-w-[160px] sm:max-w-[240px] md:max-w-[280px] lg:max-w-[340px]">
              <label htmlFor="conferente-input" className="sr-only">Nome do Conferente</label>
              <div className="absolute left-2.5 sm:left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 group-focus-within:text-primary transition-colors z-10 pointer-events-none">
                <User className="h-3 w-3 sm:h-4 sm:w-4" />
              </div>
              <input
                id="conferente-input"
                className="h-8 sm:h-10 xl:h-11 w-full rounded-lg sm:rounded-md border border-border/60 bg-muted/30 pl-7 sm:pl-10 pr-2 text-[10px] sm:text-sm font-semibold tracking-tight ring-offset-background placeholder:text-muted-foreground/40 placeholder:font-normal focus:bg-background focus:border-primary/40 focus:ring-4 focus:ring-primary/5 transition-all duration-200"
                value={conferente}
                onChange={e => setConferente(e.target.value)}
                placeholder={isMobile ? "Conf..." : "Conferente..."}
                autoComplete="name"
                required
                aria-required="true"
              />
            </div>
          )}

          {!isGuest && user && (() => {
            const displayName = profile?.display_name || user.email?.split('@')[0] || 'Usuário';
            const avatarUrl = profile?.avatar_url as string | undefined;
            const initials = displayName
              .split(/\s+/)
              .filter(Boolean)
              .slice(0, 2)
              .map((p: string) => p[0]?.toUpperCase())
              .join('') || 'U';
            return (
              <Link
                to="/estoque/minha-atividade"
                className="flex items-center gap-2 pl-1 pr-1 sm:pr-2.5 py-1 rounded-full hover:bg-muted/60 transition-colors group shrink-0"
                aria-label="Ver minha atividade do dia"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden bg-muted ring-1 ring-border/60 group-hover:ring-primary/40 transition-shadow flex items-center justify-center shrink-0">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <span className="text-[11px] font-bold text-muted-foreground tracking-tight">{initials}</span>
                  )}
                </div>
                <span className="hidden sm:inline text-xs font-semibold text-foreground/90 truncate max-w-[80px] md:max-w-[120px]">
                  {displayName}
                </span>
              </Link>
            );
          })()}




          <GlossaryDialog />
          <ChangelogDialog />

          {canSwitchModule && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  asChild
                  size="sm"
                  variant="ghost"
                  className="h-9 sm:h-10 rounded-md px-2 text-muted-foreground hover:text-primary hover:bg-primary/5"
                >
                  <Link to="/selecionar-modulo" aria-label="Trocar de módulo">
                    <ArrowLeftRight className="w-4 h-4" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Trocar de módulo</TooltipContent>
            </Tooltip>
          )}

          <div className="h-6 w-[1px] bg-border/30 mx-0.5 hidden sm:block" />

          {isRegistroRoute && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    onClick={exportExcel}
                    size="sm"
                    disabled={isArchiving || isExporting || registroCount === 0}
                    variant="outline"
                    className="font-semibold px-3 sm:px-4 h-9 sm:h-10 xl:h-11 rounded-md border-border/60 bg-muted/30 hover:bg-muted/50 hover:border-primary/30 transition-all active:scale-95 gap-1.5 sm:gap-2 text-xs shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {isArchiving || isExporting ? (
                      <div className="w-4 h-4 border-2 border-muted-foreground/30 border-t-primary rounded-full animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
                    )}
                    <span className="hidden sm:inline">{isArchiving || isExporting ? 'Aguarde...' : 'Exportar Excel'}</span>
                    {!isArchiving && !isExporting && registroCount > 0 && (
                      <Badge variant="secondary" className="bg-primary/10 text-primary border-none px-1.5 h-5 min-w-[20px] flex items-center justify-center font-bold text-[10px] rounded-md">
                        {registroCount}
                      </Badge>
                    )}
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent className="font-semibold">
                <p>
                  {isGuest || !user
                    ? 'Entre na sua conta para exportar e salvar no histórico'
                    : registroCount === 0
                    ? 'Sem itens bipados nesta sessão'
                    : `Exportar ${registroCount} itens para Excel e enviar ao histórico`}
                </p>
              </TooltipContent>
            </Tooltip>
          )}

        </div>
      </div>
    </header>
  );
});

export default TopBar;