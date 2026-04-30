
import { useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import RightPanel from '@/components/RightPanel';

export default function TabelaPage() {
  const setFormData = useAppStore(s => s.setFormData);

  useEffect(() => {
    setFormData({ activeTab: 'table' });
  }, [setFormData]);

  return (
    <div className="h-full w-full max-w-full overflow-x-hidden animate-in fade-in duration-300">
      <RightPanel />
    </div>
  );
}
