import { useDocumentTitle } from '@/hooks/useDocumentTitle';

import { useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import HistoryPanel from '@/components/HistoryPanel';

export default function HistoricoPage() {
  useDocumentTitle('Histórico');
  const setFormData = useAppStore(s => s.setFormData);

  useEffect(() => {
    setFormData({ activeTab: 'history' });
  }, [setFormData]);

  return (
    <div className="h-full w-full max-w-full overflow-x-hidden animate-in fade-in duration-300">
      <HistoryPanel />
    </div>
  );
}
