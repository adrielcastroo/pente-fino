import { ReactNode, useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import RightPanel from '@/components/RightPanel';
import { Button } from '@/components/ui/button';
import { List, ClipboardList } from 'lucide-react';

interface FormPageLayoutProps {
  children: ReactNode;
  showRightPanel?: boolean;
}

export default function FormPageLayout({ children, showRightPanel = true }: FormPageLayoutProps) {
  const isMobile = useIsMobile();
  const [showTableMobile, setShowTableMobile] = useState(false);

  if (showRightPanel) {
    if (!isMobile) {
      return (
        <div className="flex flex-col lg:flex-row h-full w-full min-w-0 gap-4 lg:gap-6 2xl:gap-8 overflow-hidden">
          <div
            className="w-full shrink-0 h-full min-w-0 overflow-y-auto custom-scrollbar"
            style={{ flexBasis: 'clamp(360px, 32vw, 560px)' }}
          >
            <div className="h-fit">
              {children}
            </div>
          </div>
          <div className="flex-1 min-w-0 h-full hidden lg:block animate-in fade-in slide-in-from-right-4 duration-500 overflow-hidden">
            <RightPanel />
          </div>
        </div>
      );
    }

    // Mobile specific layout with toggle
    return (
      <div className="h-full w-full max-w-full min-w-0 flex flex-col relative animate-in fade-in duration-300">
        <div className="flex-1 overflow-y-auto pb-20">
          {showTableMobile ? (
            <div className="animate-in slide-in-from-right-4 duration-300 h-full">
              <RightPanel />
            </div>
          ) : (
            <div className="animate-in slide-in-from-left-4 duration-300">
              {children}
            </div>
          )}
        </div>

        {/* Floating Mobile Toggle Button */}
        <div className="fixed bottom-6 right-6 z-50 lg:hidden">
          <Button
            size="lg"
            onClick={() => setShowTableMobile(!showTableMobile)}
            className="rounded-full h-14 w-14 shadow-2xl shadow-primary/40 border-2 border-white/20 active:scale-90 transition-transform bg-primary text-primary-foreground"
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