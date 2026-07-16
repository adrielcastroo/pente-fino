import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Database, Package, ArrowRightLeft, Boxes, FileText, GitCompare, History, PackagePlus } from 'lucide-react';
import AugeProdutosTab from '@/components/auge/AugeProdutosTab';
import AugeSaidasTab from '@/components/auge/AugeSaidasTab';
import AugeEntradasTab from '@/components/auge/AugeEntradasTab';
import AugeSaldoTab from '@/components/auge/AugeSaldoTab';
import AugeTransferenciasTab from '@/components/auge/AugeTransferenciasTab';
import AugeReconciliacaoTab from '@/components/auge/AugeReconciliacaoTab';
import AugeKardexTab from '@/components/auge/AugeKardexTab';

export default function AugeSyncPage() {
  const [tab, setTab] = useState('produtos');

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-[1600px] mx-auto h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-md bg-primary/10 flex items-center justify-center">
          <Database className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">Espelho Auge (Unilux ERP)</h1>
          <p className="text-xs text-muted-foreground">Dados sincronizados do sistema Auge — leitura apenas.</p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="w-full overflow-x-auto justify-start h-auto p-1 bg-card/60 border border-border/40">
          <TabTrigger v="produtos" icon={Package}>Produtos</TabTrigger>
          <TabTrigger v="saldo" icon={Boxes}>Saldo</TabTrigger>
          <TabTrigger v="entradas" icon={PackagePlus}>Entradas</TabTrigger>
          <TabTrigger v="saidas" icon={FileText}>Saídas</TabTrigger>
          <TabTrigger v="transferencias" icon={ArrowRightLeft}>Transferências</TabTrigger>
          <TabTrigger v="kardex" icon={History}>Kardex</TabTrigger>
          <TabTrigger v="reconciliacao" icon={GitCompare}>Reconciliação</TabTrigger>
        </TabsList>

        <Card className="flex-1 p-4 mt-3 rounded-md border-border/40 overflow-hidden">
          <TabsContent value="produtos" className="h-full m-0"><AugeProdutosTab /></TabsContent>
          <TabsContent value="saldo" className="h-full m-0"><AugeSaldoTab /></TabsContent>
          <TabsContent value="entradas" className="h-full m-0"><AugeEntradasTab /></TabsContent>
          <TabsContent value="saidas" className="h-full m-0"><AugeSaidasTab /></TabsContent>
          <TabsContent value="transferencias" className="h-full m-0"><AugeTransferenciasTab /></TabsContent>
          <TabsContent value="kardex" className="h-full m-0"><AugeKardexTab /></TabsContent>
          <TabsContent value="reconciliacao" className="h-full m-0"><AugeReconciliacaoTab /></TabsContent>
        </Card>
      </Tabs>
    </div>
  );
}

function TabTrigger({ v, icon: Icon, children }: { v: string; icon: any; children: React.ReactNode }) {
  return (
    <TabsTrigger value={v} className="gap-1.5 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
      <Icon className="w-3.5 h-3.5" />{children}
    </TabsTrigger>
  );
}
