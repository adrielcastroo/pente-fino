import { Card } from '@/components/ui/card';
import { ArrowRightLeft } from 'lucide-react';
import AugeTransferenciasTab from '@/components/auge/AugeTransferenciasTab';
import Seo from '@/components/Seo';

export default function TransferenciasPage() {
  return (
    <div className="p-4 md:p-6 space-y-4 max-w-[1600px] mx-auto h-[calc(100vh-4rem)] flex flex-col">
      <Seo title="Transferências | Pente Fino" description="Transferências entre depósitos sincronizadas do Auge." />
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-md bg-primary/10 flex items-center justify-center">
          <ArrowRightLeft className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">Transferências</h1>
          <p className="text-xs text-muted-foreground">Movimentações entre depósitos — sincronizadas do Auge.</p>
        </div>
      </div>
      <Card className="flex-1 p-4 rounded-md border-border/40 overflow-hidden">
        <AugeTransferenciasTab />
      </Card>
    </div>
  );
}
