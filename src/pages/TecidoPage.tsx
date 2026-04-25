
import { useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import LeftPanel from '@/components/LeftPanel';
import FormPageLayout from '@/components/FormPageLayout';

export default function TecidoPage() {
  const setMode = useAppStore(s => s.setMode);
  const currentMode = useAppStore(s => s.currentMode);
  const setFormData = useAppStore(s => s.setFormData);

  useEffect(() => {
    setFormData({ activeTab: 'tecido' });
    if (!['manual', 'openrouter', 'diversos'].includes(currentMode)) {
      setMode('manual');
    }
  }, [currentMode, setMode, setFormData]);

  return (
    <FormPageLayout>
      <LeftPanel />
    </FormPageLayout>
  );
}
