import { useDocumentTitle } from '@/hooks/useDocumentTitle';

import { useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import LeftPanel from '@/components/LeftPanel';
import FormPageLayout from '@/components/FormPageLayout';

export default function MadeiraPage() {
  useDocumentTitle('Madeira');
  const setMode = useAppStore(s => s.setMode);
  const setFormData = useAppStore(s => s.setFormData);

  useEffect(() => {
    setFormData({ activeTab: 'madeira' });
    setMode('madeira');
  }, [setMode, setFormData]);

  return (
    <FormPageLayout>
      <LeftPanel />
    </FormPageLayout>
  );
}
