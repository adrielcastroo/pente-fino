import { Card } from '@/components/ui/card';
import AugeEntradasTab from '@/components/auge/AugeEntradasTab';
import Seo from '@/components/Seo';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { PageHeader } from '@/components/ui/page-header';

export default function EntradasPage() {
  useDocumentTitle('Entradas');
  return (
    <div className="space-y-4 w-full min-w-0 h-full flex flex-col">
      <Seo title="Entradas | Pente Fino" description="Entradas de estoque sincronizadas do Auge (Unilux ERP)." />
      <PageHeader title="Entradas de Estoque" />
      <Card className="flex-1 p-4 rounded-md border-border/40 overflow-hidden">
        <AugeEntradasTab />
      </Card>
    </div>
  );
}
