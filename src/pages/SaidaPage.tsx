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
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <div className="p-4 sm:p-8 flex-shrink-0">
        <PageHeader title="Saídas" className="lg:items-center" />
      </div>
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 pb-12 custom-scrollbar">
        <div className="max-w-[1400px] mx-auto">
          <AugeSaidasTab />
        </div>
      </div>
    </div>
  );
}
