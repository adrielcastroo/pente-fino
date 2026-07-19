import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import AugeTransferenciasTab from '@/components/auge/AugeTransferenciasTab';
import type { TransfDialogInitial } from '@/components/auge/NovaTransferenciaDialog';
import Seo from '@/components/Seo';
import { PageHeader } from '@/components/ui/page-header';

export default function TransferenciasPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [autoInitial, setAutoInitial] = useState<TransfDialogInitial | null>(null);

  useEffect(() => {
    const st = location.state as { transferInitial?: TransfDialogInitial } | null;
    if (st?.transferInitial) {
      setAutoInitial(st.transferInitial);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  return (
    <div className="space-y-4 max-w-[1600px] w-full mx-auto flex flex-col min-h-[70vh] min-w-0">
      <Seo title="Transferências | Pente Fino" description="Transferências entre depósitos sincronizadas do Auge." />
      <PageHeader
        title="Transferências"
        subtitle="Movimentações entre depósitos — sincronizadas do Auge."
      />
      <Card className="flex-1 p-2 sm:p-3 md:p-4 rounded-md border-border/40 overflow-hidden min-w-0">
        <AugeTransferenciasTab
          autoInitial={autoInitial}
          onAutoInitialConsumed={() => setAutoInitial(null)}
        />
      </Card>
    </div>
  );
}
