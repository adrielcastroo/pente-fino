import { ReactNode } from 'react';
import LeftPanel from '@/components/LeftPanel';
import { ScanLine } from 'lucide-react';

/**
 * Wrapper operacional da página /tecido, otimizado para tablet.
 *
 * Responsabilidades (Fase 1 do plano):
 * - Header compacto: "Tecido — Registro e bipagem".
 * - Reaproveita o LeftPanel existente (sem duplicar lógica).
 * - Garante padding inferior para a BottomTabBar (h-16) + safe-area
 *   em tablet (md–lg), de forma que a última ação não fique coberta.
 *
 * Não altera regras de negócio, store ou serviços.
 */
interface Props {
  children?: ReactNode;
}

export default function TecidoOperationalPanel({ children }: Props) {
  return (
    <div className="flex h-full w-full flex-col min-w-0">
      {/* Header compacto — tablet (md → lg). Sticky com safe-area top. */}
      <header
        className="hidden md:flex xl:hidden items-center gap-3 px-4 py-3 border-b border-border/40 bg-card/70 backdrop-blur-md sticky top-0 z-20"
        style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
        aria-label="Cabeçalho operacional Tecido"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
          <ScanLine className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-base font-semibold text-foreground leading-tight truncate">
            Tecido — Registro e bipagem
          </h1>
          <p className="text-xs text-muted-foreground leading-tight truncate">
            Aponte o leitor ou digite o código para iniciar
          </p>
        </div>
        <kbd className="hidden md:inline-flex items-center gap-1 px-2 py-1 text-[10px] font-mono font-semibold text-muted-foreground bg-muted/60 border border-border/40 rounded shrink-0">
          B
        </kbd>
      </header>

      {/*
        Conteúdo operacional. Em tablet (md → lg) habilitamos scroll vertical
        e padding inferior maior (pb-24) para acomodar BottomTabBar + safe-area.
        Em desktop (xl+) mantém o layout em coluna sem padding extra.
      */}
      <div
        className="flex-1 min-h-0 min-w-0 overflow-y-auto xl:overflow-hidden md:pb-24 xl:pb-0"
        style={{ paddingBottom: 'max(6rem, calc(env(safe-area-inset-bottom) + 5rem))' }}
      >
        <LeftPanel />
        {children}
      </div>
    </div>
  );
}
