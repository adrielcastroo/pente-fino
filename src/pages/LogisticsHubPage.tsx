
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MapPin, ClipboardCheck, AlertCircle, LayoutDashboard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { WMSAllocationView } from '@/components/logistics/WMSAllocationView';
import { CyclicInventoryView } from '@/components/logistics/CyclicInventoryView';
import { VirtualStockView } from '@/components/logistics/VirtualStockView';

export default function LogisticsHubPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('enderecamento');

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 p-4 sm:p-0">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')} className="rounded-full hover:bg-primary/10">
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight uppercase leading-none">Hub Logístico</h1>
            <p className="text-xs sm:text-sm font-bold text-muted-foreground uppercase tracking-widest mt-2">Gestão Unificada de WMS e Inventário</p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-1 bg-muted/30 rounded-2xl border border-border/10">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <LayoutDashboard className="w-5 h-5" />
            </div>
            <span className="px-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Operação Centralizada</span>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-16 rounded-3xl p-1.5 shadow-lg bg-card/50 backdrop-blur-xl border border-border/10">
          <TabsTrigger 
            value="enderecamento" 
            className="rounded-2xl font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all flex items-center gap-2"
          >
            <MapPin className="w-4 h-4" />
            <span className="hidden sm:inline">Endereçamento</span>
          </TabsTrigger>
          <TabsTrigger 
            value="inventario" 
            className="rounded-2xl font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all flex items-center gap-2"
          >
            <ClipboardCheck className="w-4 h-4" />
            <span className="hidden sm:inline">Inventário Cíclico</span>
          </TabsTrigger>
          <TabsTrigger 
            value="virtual" 
            className="rounded-2xl font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Estoque Virtual</span>
          </TabsTrigger>
        </TabsList>

        <div className="mt-8">
            <TabsContent value="enderecamento" className="animate-in fade-in slide-in-from-left-4 duration-500 outline-none">
                <WMSAllocationView />
            </TabsContent>
            
            <TabsContent value="inventario" className="animate-in fade-in slide-in-from-right-4 duration-500 outline-none">
                <CyclicInventoryView />
            </TabsContent>
            
            <TabsContent value="virtual" className="animate-in fade-in zoom-in-95 duration-500 outline-none">
                <VirtualStockView />
            </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
