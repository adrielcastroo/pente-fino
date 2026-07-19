import { useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { PageHeader } from '@/components/ui/page-header';
import AugeSaidasTab from '@/components/auge/AugeSaidasTab';

export default function SaidaPage() {
  const setFormData = useAppStore(s => s.setFormData);
  useDocumentTitle('Saídas');

  useEffect(() => {
    setFormData({ activeTab: 'saida' });
  }, [setFormData]);

  return (
    <div className="space-y-4 min-w-0 flex flex-col">
      <PageHeader title="Saídas" />
      <AugeSaidasTab />
    </div>
  );
}
