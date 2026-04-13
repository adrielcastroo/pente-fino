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
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/60 backdrop-blur-xl supports-[backdrop-filter]:bg-background/40">
      <div className="flex h-16 items-center gap-4 px-4 sm:px-6 max-w-[1800px] mx-auto">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="h-10 w-10 text-muted-foreground hover:text-foreground hover:bg-primary/10 transition-all duration-300 rounded-xl" />
          <div className="hidden lg:flex flex-col">
            <h2 className="text-sm font-black tracking-tight leading-none uppercase text-muted-foreground/80">Painel Operacional</h2>
            <p className="text-[10px] font-bold text-primary/80 uppercase tracking-widest mt-0.5">Sistema de Conferência</p>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-end gap-3 sm:gap-4">
          <div className="relative group w-full max-w-[200px] sm:max-w-[280px]">
            <label htmlFor="conferente-input" className="sr-only">Nome do Conferente</label>
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary group-hover:text-primary/70 transition-all z-10">
              <User className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <input
              id="conferente-input"
              className="h-10 sm:h-12 w-full rounded-2xl border border-border/50 bg-muted/30 pl-10 sm:pl-12 pr-4 text-xs sm:text-sm font-bold tracking-tight ring-offset-background placeholder:text-muted-foreground/50 placeholder:font-medium focus:bg-background focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all duration-300 shadow-sm"
              value={conferente}
              onChange={e => setConferente(e.target.value)}
              placeholder="Nome do Conferente..."
              autoComplete="name"
              required
            />
          </div>

          <div className="h-8 w-[1px] bg-border/40 mx-1 hidden sm:block" />

          {registros.length > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  onClick={exportExcel}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-black px-4 sm:px-6 h-10 sm:h-12 rounded-2xl shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 active:translate-y-0 gap-2 text-xs sm:text-sm"
                >
                  <Download className="w-4 h-4 sm:w-5 sm:h-5 animate-bounce-subtle" />
                  <span className="hidden sm:inline">Finalizar e Exportar</span>
                  <Badge variant="secondary" className="bg-white/20 text-white border-none ml-1 px-1.5 h-5 min-w-[20px] flex items-center justify-center font-black">
                    {registros.length}
                  </Badge>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Exporta os {registros.length} registros para Excel e limpa a tabela</p>
              </TooltipContent>
            </Tooltip>
          )}

          {registros.length === 0 && (
            <Badge variant="outline" className="h-10 sm:h-12 px-4 rounded-2xl border-dashed border-muted-foreground/30 text-muted-foreground font-bold flex gap-2">
              <Archive className="w-4 h-4" />
              <span className="text-[10px] sm:text-xs">Aguardando Registros...</span>
            </Badge>
          )}
        </div>
      </div>
    </header>
  );
}
