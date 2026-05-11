import { ReactNode } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import RightPanel from '@/components/RightPanel';

interface FormPageLayoutProps {
  children: ReactNode;
  showRightPanel?: boolean;
}

/**
 * Hierarquia visual:
 * - Mobile (<lg): coluna única, formulário ocupa 100% da largura, sem painel direito.
 *   Tabela de registros fica acessível via botão "Ver Tabela" dentro do LeftPanel.
 * - Desktop (≥lg): grid bidimensional fluido. A coluna do formulário usa clamp()
 *   para escalar suavemente entre 360px e 560px conforme o viewport, evitando
 *   "degraus" bruscos entre breakpoints (especialmente em tablets em paisagem,
 *   dobráveis e monitores intermediários).
 * - O container raiz aplica overflow-x-hidden + min-w-0 para impedir scroll
 *   horizontal indesejado caso algum filho extrapole o viewport.
 */
export default function FormPageLayout({ children, showRightPanel = true }: FormPageLayoutProps) {
  const isMobile = useIsMobile();

  if (showRightPanel && !isMobile) {
    return (
      <div className="flex flex-col lg:flex-row h-full w-full min-w-0 gap-4 lg:gap-6 2xl:gap-8 overflow-x-hidden">
        <div
          className="w-full shrink-0 h-full min-w-0"
          style={{ flexBasis: 'clamp(360px, 32vw, 560px)' }}
        >
          {children}
        </div>
        <div className="flex-1 min-w-0 h-full hidden lg:block animate-in fade-in slide-in-from-right-4 duration-500">
          <RightPanel />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full max-w-full min-w-0 overflow-x-hidden animate-in fade-in duration-300">
      {children}
    </div>
  );
}
