import { lazy, Suspense } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tag, Package, Truck, ClipboardCheck } from 'lucide-react';
import { usePublishLabelSettings } from '@/hooks/useGlobalSettings';

const LabelLayoutPanel = lazy(() => import('@/components/settings/LabelLayoutPanel'));
const LotesMestresPanel = lazy(() => import('@/components/settings/LotesMestresPanel'));
const InventorySettingsPanel = lazy(() => import('@/components/settings/InventorySettingsPanel'));
const ExpedicaoPanel = lazy(() => import('@/components/settings/ExpedicaoPanel'));

export default function GlobalSettingsTab() {
  // Toda alteração feita aqui é publicada como configuração global do app.
  usePublishLabelSettings(true);

  return (
    <div className="space-y-4">
      <Card className="p-4 border-primary/20 bg-primary/5 text-xs text-muted-foreground">
        Estas configurações afetam <strong className="text-foreground">todos os usuários</strong> do app.
        Apenas admins podem editá-las a partir daqui.
      </Card>


      <Tabs defaultValue="etiquetas" className="space-y-4">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="etiquetas" className="gap-1.5"><Tag className="h-3.5 w-3.5" /> Etiquetas</TabsTrigger>
          <TabsTrigger value="lotes" className="gap-1.5"><Package className="h-3.5 w-3.5" /> Lotes Mestres</TabsTrigger>
          <TabsTrigger value="inventario" className="gap-1.5"><ClipboardCheck className="h-3.5 w-3.5" /> Inventário</TabsTrigger>
          <TabsTrigger value="expedicao" className="gap-1.5"><Truck className="h-3.5 w-3.5" /> Expedição</TabsTrigger>
        </TabsList>

        <TabsContent value="etiquetas">
          <Card className="p-6"><Suspense fallback={<Skeleton className="h-64" />}><LabelLayoutPanel /></Suspense></Card>
        </TabsContent>
        <TabsContent value="lotes">
          <Card className="p-6"><Suspense fallback={<Skeleton className="h-64" />}><LotesMestresPanel /></Suspense></Card>
        </TabsContent>
        <TabsContent value="inventario">
          <Card className="p-6"><Suspense fallback={<Skeleton className="h-64" />}><InventorySettingsPanel /></Suspense></Card>
        </TabsContent>
        <TabsContent value="expedicao">
          <Card className="p-6"><Suspense fallback={<Skeleton className="h-64" />}><ExpedicaoPanel /></Suspense></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
