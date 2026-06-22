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
      {/* Header compacto — visível apenas em tablet (md → lg) */}
      <header
        className="hidden md:flex xl:hidden items-center gap-3 px-4 py-3 border-b border-border/40 bg-card/60 backdrop-blur sticky top-0 z-20"
        aria-label="Cabeçalho operacional Tecido"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
          <ScanLine className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0">
          <h1 className="text-base font-semibold text-foreground leading-tight truncate">
            Tecido
          </h1>
          <p className="text-xs text-muted-foreground leading-tight truncate">
            Aponte o leitor ou digite o código para iniciar
          </p>
        </div>
        <kbd className="ml-auto hidden md:inline-flex items-center gap-1 px-2 py-1 text-[10px] font-mono font-semibold text-muted-foreground bg-muted/60 border border-border/40 rounded">
          B
        </kbd>
      </header>

      {/*
        Conteúdo operacional — LeftPanel mantém todo o fluxo de bipagem,
        formulário e modos (manual / IA / diversos / etiq. pronta).
        O padding inferior em tablet (pb-20) garante que a BottomTabBar
        (h-16) não cubra a última linha de ações.
      */}
      <div className="flex-1 min-h-0 min-w-0 overflow-hidden md:pb-20 xl:pb-0">
        <LeftPanel />
        {children}
      </div>
    </div>
  );
}
