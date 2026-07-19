import { Card } from '@/components/ui/card';
import { PackagePlus } from 'lucide-react';
import AugeEntradasTab from '@/components/auge/AugeEntradasTab';
import Seo from '@/components/Seo';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export default function EntradasPage() {
  useDocumentTitle('Entradas');
  return (
    <div className="p-4 md:p-6 space-y-4 max-w-[1600px] mx-auto h-[calc(100vh-4rem)] flex flex-col">
      <Seo title="Entradas | Pente Fino" description="Entradas de estoque sincronizadas do Auge (Unilux ERP)." />
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-md bg-emerald-500/10 flex items-center justify-center">
          <PackagePlus className="w-5 h-5 text-success" />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">Entradas de Estoque</h1>
          <p className="text-xs text-muted-foreground">Entradas sincronizadas do Auge (Unilux ERP).</p>
        </div>
      </div>
      <Card className="flex-1 p-4 rounded-md border-border/40 overflow-hidden">
        <AugeEntradasTab />
      </Card>
    </div>
  );
}
