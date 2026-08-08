import { ReactNode, useState } from 'react';
import { useIsMobile, useIsTablet } from '@/hooks/use-mobile';
import RightPanel from '@/components/RightPanel';
import { Button } from '@/components/ui/button';
import { List, ClipboardList } from 'lucide-react';

interface FormPageLayoutProps {
  children: ReactNode;
  showRightPanel?: boolean;
}

export default function FormPageLayout({ children, showRightPanel = true }: FormPageLayoutProps) {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  // Tablet (<1024px) trata o RightPanel como oculto (hidden lg:block),
  // então usamos o mesmo padrão fullscreen-com-toggle do mobile para
  // evitar o bug de flex-basis virar altura em flex-col.
  const isNarrow = isMobile || isTablet;
  const [showTableMobile, setShowTableMobile] = useState(false);

  if (showRightPanel) {
    if (!isNarrow) {
      return (
        <div className="flex flex-col md:flex-row h-full w-full min-w-0 gap-4 lg:gap-6 overflow-hidden">
          <div
            className="shrink-0 h-full min-w-0 overflow-y-auto custom-scrollbar"
            style={{ flexBasis: 'clamp(380px, 30vw, 550px)' }}
          >
            {children}
          </div>
          <div className="flex-1 min-w-0 h-full animate-in fade-in slide-in-from-right-4 duration-500 overflow-hidden">
            <RightPanel />
          </div>
        </div>
      );
    }

    // Mobile/tablet layout with floating toggle between form and table
    return (
      <div className="h-full w-full max-w-full min-w-0 flex flex-col relative animate-in fade-in duration-300">
        <div className="flex-1 min-h-0 overflow-y-auto pb-20">
          {showTableMobile ? (
            <div className="animate-in slide-in-from-right-4 duration-300 h-full">
              <RightPanel />
            </div>
          ) : (
            <div className="animate-in slide-in-from-left-4 duration-300 h-full">
              {children}
            </div>
          )}
        </div>

        {/* Floating Mobile/Tablet Toggle Button */}
        <div className="fixed bottom-6 right-6 z-50 lg:hidden">
          <Button
            size="lg"
            onClick={() => setShowTableMobile(!showTableMobile)}
            className="rounded-full h-14 w-14 shadow-lg border border-border active:scale-95 transition-transform bg-primary text-primary-foreground hover:bg-primary/90"
            aria-label={showTableMobile ? 'Voltar ao formulário' : 'Ver itens bipados'}
          >
            {showTableMobile ? <ClipboardList className="w-6 h-6" /> : <List className="w-6 h-6" />}
          </Button>
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
