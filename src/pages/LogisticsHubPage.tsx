

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MapPin, ClipboardCheck, AlertCircle, LayoutDashboard, Grid3X3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { WMSAllocationView } from '@/components/logistics/WMSAllocationView';
import { CyclicInventoryView } from '@/components/logistics/CyclicInventoryView';
import { VirtualStockView } from '@/components/logistics/VirtualStockView';
import { WarehouseSlottingView } from '@/components/logistics/WarehouseSlottingView';
import { motion, AnimatePresence } from 'framer-motion';

export default function LogisticsHubPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('enderecamento');

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-6xl mx-auto space-y-8 p-4 sm:p-0 pb-20"
    >
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/dashboard')} 
            className="rounded-2xl hover:bg-primary/10 hover:scale-110 active:scale-95 transition-all duration-300 w-12 h-12"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tighter uppercase leading-none bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
              Hub Logístico
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <div className="h-1 w-8 bg-primary rounded-full" />
              <p className="text-[10px] sm:text-xs font-black text-muted-foreground uppercase tracking-[0.3em]">
                Gestão Unificada de WMS e Inventário
              </p>
            </div>
          </div>
        </div>
        
        <motion.div 
          whileHover={{ scale: 1.05 }}
          className="flex items-center gap-3 p-2 px-4 bg-primary/5 rounded-2xl border border-primary/10 backdrop-blur-sm"
        >
            <div className="p-2 rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                <LayoutDashboard className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest text-primary">Operação Centralizada</span>
              <span className="text-[8px] font-bold text-muted-foreground uppercase">Tempo Real</span>
            </div>
        </motion.div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-20 rounded-[2rem] p-2 shadow-2xl bg-card/40 backdrop-blur-2xl border border-white/10 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
          
          <TabsTrigger 
            value="enderecamento" 
            className="rounded-[1.5rem] font-black uppercase tracking-widest text-[9px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-xl data-[state=active]:shadow-primary/30 transition-all duration-500 flex flex-col sm:flex-row items-center gap-2 z-10"
          >
            <MapPin className="w-4 h-4" />
            <span className="hidden sm:inline">Endereçamento</span>
            <span className="sm:hidden">WMS</span>
          </TabsTrigger>

          <TabsTrigger 
            value="slotting" 
            className="rounded-[1.5rem] font-black uppercase tracking-widest text-[9px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-xl data-[state=active]:shadow-primary/30 transition-all duration-500 flex flex-col sm:flex-row items-center gap-2 z-10"
          >
            <Grid3X3 className="w-4 h-4" />
            <span className="hidden sm:inline">Mapa de Ocupação</span>
            <span className="sm:hidden">Mapa</span>
          </TabsTrigger>
          
          <TabsTrigger 
            value="inventario" 
            className="rounded-[1.5rem] font-black uppercase tracking-widest text-[9px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-xl data-[state=active]:shadow-primary/30 transition-all duration-500 flex flex-col sm:flex-row items-center gap-2 z-10"
          >
            <ClipboardCheck className="w-4 h-4" />
            <span className="hidden sm:inline">Inventário Cíclico</span>
            <span className="sm:hidden">Ciclico</span>
          </TabsTrigger>
          
          <TabsTrigger 
            value="virtual" 
            className="rounded-[1.5rem] font-black uppercase tracking-widest text-[9px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-xl data-[state=active]:shadow-primary/30 transition-all duration-500 flex flex-col sm:flex-row items-center gap-2 z-10"
          >
            <AlertCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Estoque Virtual</span>
            <span className="sm:hidden">Virtual</span>
          </TabsTrigger>
        </TabsList>

        <div className="mt-12 relative min-h-[500px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <TabsContent value="enderecamento" className="m-0 outline-none">
                  <WMSAllocationView />
              </TabsContent>

              <TabsContent value="slotting" className="m-0 outline-none">
                  <WarehouseSlottingView />
              </TabsContent>
              
              <TabsContent value="inventario" className="m-0 outline-none">
                  <CyclicInventoryView />
              </TabsContent>
              
              <TabsContent value="virtual" className="m-0 outline-none">
                  <VirtualStockView />
              </TabsContent>
            </motion.div>
          </AnimatePresence>
        </div>
      </Tabs>
    </motion.div>
  );
}

