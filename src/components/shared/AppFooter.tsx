import { LATEST_VERSION, BUILD_TIME } from '@/lib/changelog';
import { cn } from '@/lib/utils';

export interface AppFooterProps {
  className?: string;
}

/**
 * Rodapé global do app — compartilhado entre todos os módulos.
 * Exibe status do sistema + versão dinâmica (SemVer via CHANGELOG[0]).
 */
export default function AppFooter({ className }: AppFooterProps) {
  return (
    <footer role="contentinfo" className={cn('mt-4 border-t border-border/60 bg-card/30', className)}>
      <div className="max-w-[1600px] 2xl:max-w-[1800px] mx-auto px-2 sm:px-4 lg:px-6 xl:px-8 2xl:px-10 py-1.5 flex items-center justify-between gap-2 text-[10px] text-muted-foreground/80">
        <span className="flex items-center gap-1.5">
          <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
            <span className="absolute inline-flex h-full w-full rounded-full bg-success/60 animate-ping" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
          </span>
          <span className="hidden sm:inline">Sistema operacional</span>
          <span className="hidden sm:inline" aria-hidden="true">·</span>
          <span className="text-foreground/80 font-medium tracking-tight">Pente Fino</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="px-1.5 py-0 rounded bg-muted/60 text-muted-foreground border border-border/40 font-mono text-[10px] leading-4"
            title={BUILD_TIME ? `Build: ${new Date(BUILD_TIME).toLocaleString('pt-BR')}` : undefined}
          >
            v{LATEST_VERSION}
          </span>
        </span>
      </div>
    </footer>
  );
}
