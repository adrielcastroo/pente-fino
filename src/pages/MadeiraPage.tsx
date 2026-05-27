
import { useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import LeftPanel from '@/components/LeftPanel';
import PreRegistrosLayout from '@/components/PreRegistrosLayout';

export default function MadeiraPage() {
  const setMode = useAppStore(s => s.setMode);
  const setFormData = useAppStore(s => s.setFormData);

  useEffect(() => {
    setFormData({ activeTab: 'madeira' });
    setMode('madeira');
  }, [setMode, setFormData]);

  return (
    <PreRegistrosLayout title="PréRegistros — Madeira" filtersTitle="Filtros de Madeira">
      <LeftPanel />
    </PreRegistrosLayout>
  );
}
