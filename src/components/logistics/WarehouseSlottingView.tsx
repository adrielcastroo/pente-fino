
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Grid3X3, AlertTriangle, Loader2, Package, MapPin, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AddressData {
  galpao: string;
  corredor: string;
  coluna: string;
  nivel: string;
  original: string;
}

interface Item {
  id: string;
  name: string;
  lote: string;
  endereco: string;
  quantidade: number;
  curva_abc?: string;
}

export function WarehouseSlottingView() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Item[]>([]);
  const [selectedCorredor, setSelectedCorredor] = useState('C01');

  const corredores = useMemo(() => Array.from({ length: 10 }, (_, i) => `C${String(i + 1).padStart(2, '0')}`), []);
  const colunas = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];
  const niveis = Array.from({ length: 11 }, (_, i) => String(i + 1).padStart(2, '0')).reverse(); // 11 to 01

  const parseAddress = (address: string): AddressData | null => {
    if (!address) return null;
    const parts = address.split('.');
    if (parts.length < 3) return null;

    const galpao = parts[0];
    const corredor = parts[1];
    const colunaNivel = parts[2];
    
    if (colunaNivel.length < 3) return null;
    const coluna = colunaNivel.substring(0, 1);
    const nivel = colunaNivel.substring(1);

    return { galpao, corredor, coluna, nivel, original: address };
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [regRes, invRes] = await Promise.all([
          supabase.from('registros').select('id, item, lote, endereco, quantidade, curva_abc'),
          supabase.from('inventory').select('id, name, sku, location, quantity, curva_abc')
        ]);

        const combinedItems: Item[] = [
          ...(regRes.data || []).map(i => ({
            id: i.id,
            name: i.item,
            lote: i.lote,
            endereco: i.endereco,
            quantidade: i.quantidade,
            curva_abc: i.curva_abc
          })),
          ...(invRes.data || []).map(i => ({
            id: i.id,
            name: i.name,
            lote: i.sku,
            endereco: i.location,
            quantidade: i.quantity,
            curva_abc: i.curva_abc
          }))
        ];

        setItems(combinedItems);
      } catch (error) {
        console.error('Error fetching warehouse data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const itemsMap = useMemo(() => {
    const map: Record<string, Item> = {};
    items.forEach(item => {
      if (item.endereco) {
        map[item.endereco.toUpperCase()] = item;
      }
    });
    return map;
  }, [items]);

  const alerts = useMemo(() => {
    const result: string[] = [];
    items.forEach(item => {
      const parsed = parseAddress(item.endereco?.toUpperCase());
      if (!parsed) return;

      const nivelNum = parseInt(parsed.nivel);
      
      // Curve A high giro items in high levels (09, 10, 11)
      if (item.curva_abc === 'A' && nivelNum >= 9) {
        result.push(`⚠️ Ineficiência: Item ${item.name} (Curva A) alocado no topo (${item.endereco}). Mova para os níveis 01 a 03.`);
      }

      // Curve C low giro items in noble positions (Nível 01-02, Coluna A-C)
      if (item.curva_abc === 'C' && nivelNum <= 2 && ['A', 'B', 'C'].includes(parsed.coluna)) {
        result.push(`⚠️ Alerta: Item ${item.name} (Curva C) em posição nobre (${item.endereco}). Sugerimos mover para o topo ou fundo.`);
      }
    });
    return result;
  }, [items]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="text-sm font-black uppercase tracking-widest text-muted-foreground">Carregando Mapa G4...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tight">Mapa de Ocupação G4</h2>
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mt-1">Galpão 4 • Monitoramento de Slotting Inteligente</p>
        </div>
        
        <div className="flex items-center gap-4 p-2 bg-card/50 rounded-2xl border border-white/5 backdrop-blur-md">
           <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
             <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-[9px] font-black uppercase text-emerald-600">Livre</span>
           </div>
           <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/20">
             <div className="w-3 h-3 rounded-full bg-red-500" />
             <span className="text-[9px] font-black uppercase text-red-600">Ocupado</span>
           </div>
        </div>
      </div>

      <Tabs value={selectedCorredor} onValueChange={setSelectedCorredor} className="w-full">
        <TabsList className="grid grid-cols-5 sm:grid-cols-10 h-auto p-2 rounded-[2rem] bg-card/40 border border-white/5 gap-2">
          {corredores.map((corredor) => (
            <TabsTrigger 
              key={corredor} 
              value={corredor}
              className="rounded-xl font-black text-[10px] uppercase py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground shadow-lg transition-all"
            >
              {corredor}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <Card className="lg:col-span-3 rounded-[3rem] border-white/5 bg-card/30 backdrop-blur-2xl overflow-hidden shadow-2xl">
          <CardHeader className="border-b border-white/5 p-8 flex flex-row items-center justify-between">
            <CardTitle className="text-xl font-black uppercase flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-primary text-primary-foreground">
                <Grid3X3 className="w-5 h-5" />
              </div>
              Grade de Endereços - {selectedCorredor}
            </CardTitle>
            <div className="hidden sm:flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              <MapPin className="w-3.5 h-3.5" />
              Galpão G4
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-8">
            <div className="overflow-x-auto">
              <div className="min-w-[800px]">
                {/* Header: Colunas A-I */}
                <div className="grid grid-cols-10 gap-2 mb-4">
                  <div className="flex items-center justify-center font-black text-xs text-muted-foreground uppercase">Nível</div>
                  {colunas.map(col => (
                    <div key={col} className="flex items-center justify-center font-black text-lg text-primary uppercase">
                      {col}
                    </div>
                  ))}
                </div>

                {/* Rows: Níveis 11-01 */}
                <div className="space-y-2">
                  {niveis.map(nivel => (
                    <div key={nivel} className="grid grid-cols-10 gap-2">
                      <div className="flex items-center justify-center font-black text-sm text-muted-foreground">
                        {nivel}
                      </div>
                      {colunas.map(col => {
                        const address = `G4.${selectedCorredor}.${col}${nivel}`;
                        const item = itemsMap[address];
                        
                        return (
                          <TooltipProvider key={col}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <motion.div
                                  whileHover={{ scale: 1.1, zIndex: 10 }}
                                  className={cn(
                                    "aspect-square rounded-xl cursor-pointer transition-all duration-300 border shadow-md flex items-center justify-center relative group",
                                    item 
                                      ? "bg-red-500/20 border-red-500/40 hover:bg-red-500/30" 
                                      : "bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20"
                                  )}
                                >
                                  {item && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                      <Package className="w-4 h-4 text-red-600 opacity-60 group-hover:scale-125 transition-transform" />
                                    </div>
                                  )}
                                </motion.div>
                              </TooltipTrigger>
                              <TooltipContent className="p-4 rounded-2xl bg-popover/90 backdrop-blur-xl border border-white/10 shadow-2xl min-w-[240px]">
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Endereço</span>
                                    <Badge variant="outline" className="font-black text-[10px] uppercase text-primary border-primary/20">{address}</Badge>
                                  </div>
                                  {item ? (
                                    <div className="space-y-2">
                                      <div>
                                        <p className="text-[10px] font-black uppercase text-muted-foreground">Item</p>
                                        <p className="text-sm font-black uppercase text-foreground">{item.name}</p>
                                      </div>
                                      <div className="flex justify-between gap-4">
                                        <div>
                                          <p className="text-[10px] font-black uppercase text-muted-foreground">Lote</p>
                                          <p className="text-xs font-bold">{item.lote}</p>
                                        </div>
                                        <div>
                                          <p className="text-[10px] font-black uppercase text-muted-foreground text-right">Qtd</p>
                                          <p className="text-xs font-bold text-right">{item.quantidade}</p>
                                        </div>
                                      </div>
                                      {item.curva_abc && (
                                        <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                                          <span className="text-[9px] font-black uppercase text-muted-foreground">Classificação ABC</span>
                                          <Badge className={cn(
                                            "font-black text-[10px]",
                                            item.curva_abc === 'A' ? "bg-red-500 text-white" : 
                                            item.curva_abc === 'B' ? "bg-amber-500 text-white" : "bg-blue-500 text-white"
                                          )}>
                                            Curva {item.curva_abc}
                                          </Badge>
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <p className="text-xs font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                      Posição Disponível
                                    </p>
                                  )}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-[2.5rem] border-white/5 bg-card/30 backdrop-blur-2xl shadow-xl">
            <CardHeader className="p-6 border-b border-white/5">
              <CardTitle className="text-lg font-black uppercase flex items-center gap-3 text-amber-500">
                <AlertTriangle className="w-5 h-5" />
                Alertas de Slotting
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {alerts.length > 0 ? (
                <div className="space-y-3">
                  {alerts.map((alert, idx) => (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      key={idx}
                    >
                      <Alert variant="destructive" className="bg-amber-500/10 border-amber-500/20 text-amber-600 rounded-2xl p-4">
                        <AlertTitle className="text-[10px] font-black uppercase tracking-widest mb-1">Otimização Necessária</AlertTitle>
                        <AlertDescription className="text-[11px] font-bold leading-relaxed">
                          {alert}
                        </AlertDescription>
                      </Alert>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
                  <div className="p-4 rounded-full bg-emerald-500/10">
                    <Info className="w-8 h-8 text-emerald-500" />
                  </div>
                  <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest leading-loose">
                    Parabéns!<br/>Todas as posições estão<br/>otimizadas conforme<br/>Curva ABC.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-[2.5rem] border-white/5 bg-card/30 backdrop-blur-2xl shadow-xl overflow-hidden">
             <div className="p-6 bg-primary/10 border-b border-white/5">
                <h4 className="text-xs font-black uppercase tracking-widest text-primary">Resumo Galpão G4</h4>
             </div>
             <CardContent className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                   <div className="space-y-1">
                      <p className="text-[10px] font-black text-muted-foreground uppercase">Ocupação Total</p>
                      <p className="text-2xl font-black">{Math.round((items.filter(i => i.endereco?.startsWith('G4')).length / (10 * 9 * 11)) * 100)}%</p>
                   </div>
                   <div className="p-3 rounded-xl bg-background/50 border border-white/5">
                      <LayoutDashboard className="w-5 h-5 text-muted-foreground" />
                   </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                   <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/10">
                      <p className="text-[8px] font-black text-red-500 uppercase mb-1">Ocupados</p>
                      <p className="text-lg font-black">{items.filter(i => i.endereco?.startsWith('G4')).length}</p>
                   </div>
                   <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                      <p className="text-[8px] font-black text-emerald-500 uppercase mb-1">Disponíveis</p>
                      <p className="text-lg font-black">{(10 * 9 * 11) - items.filter(i => i.endereco?.startsWith('G4')).length}</p>
                   </div>
                </div>
             </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
