import { useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import LeftPanel from '@/components/LeftPanel';
import PreRegistrosLayout from '@/components/PreRegistrosLayout';

export default function TecidoPage() {
  const setMode = useAppStore(s => s.setMode);
  const currentMode = useAppStore(s => s.currentMode);
  const setFormData = useAppStore(s => s.setFormData);

  useEffect(() => {
    setFormData({ activeTab: 'tecido' });
    if (!['manual', 'openrouter', 'diversos', 'etiq_pronta'].includes(currentMode)) {
      setMode('manual');
    }
  }, [currentMode, setMode, setFormData]);

  return (
    <PreRegistrosLayout title="PréRegistros — Tecidos" filtersTitle="Filtros de PréRegistro">
      <LeftPanel />
    </PreRegistrosLayout>
  );
}
