import { Card } from '@/components/ui/card';
import AugeEntradasTab from '@/components/auge/AugeEntradasTab';
import Seo from '@/components/Seo';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { PageHeader } from '@/components/ui/page-header';

export default function EntradasPage() {
  useDocumentTitle('Entradas');
  return (
    <div className="p-4 md:p-6 space-y-4 max-w-[1600px] mx-auto h-[calc(100vh-4rem)] flex flex-col">
      <Seo title="Entradas | Pente Fino" description="Entradas de estoque sincronizadas do Auge (Unilux ERP)." />
      <PageHeader
        title="Entradas de Estoque"
        subtitle="Entradas sincronizadas do Auge (Unilux ERP)."
      />
      <Card className="flex-1 p-4 rounded-md border-border/40 overflow-hidden">
        <AugeEntradasTab />
      </Card>
    </div>
  );
}
