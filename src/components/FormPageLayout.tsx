
import { ReactNode } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import RightPanel from '@/components/RightPanel';

interface FormPageLayoutProps {
  children: ReactNode;
  showRightPanel?: boolean;
}

export default function FormPageLayout({ children, showRightPanel = true }: FormPageLayoutProps) {
  const isMobile = useIsMobile();

  if (showRightPanel && !isMobile) {
    return (
      <div className="flex flex-col lg:flex-row h-full gap-4 lg:gap-6 2xl:gap-8">
        <div className="w-full lg:w-[420px] xl:w-[460px] 2xl:w-[540px] shrink-0 h-full">
          {children}
        </div>
        <div className="flex-1 min-w-0 h-full hidden lg:block animate-in fade-in slide-in-from-right-4 duration-500">
          <RightPanel />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full max-w-full overflow-x-hidden animate-in fade-in duration-300">
      {children}
    </div>
  );
}
