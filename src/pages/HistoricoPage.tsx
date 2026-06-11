
import { useEffect, memo, lazy, Suspense } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Loader2 } from 'lucide-react';

const HistoryPanel = lazy(() => import('@/components/HistoryPanel'));

const HistoricoPage = () => {
  const setFormData = useAppStore(s => s.setFormData);

  useEffect(() => {
    setFormData({ activeTab: 'history' });
  }, [setFormData]);

  return (
    <div className="h-full w-full max-w-full overflow-x-hidden animate-in fade-in duration-300">
      <Suspense fallback={<div className="h-[60vh] flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>}>
        <HistoryPanel />
      </Suspense>
    </div>
  );
};

export default memo(HistoricoPage);
