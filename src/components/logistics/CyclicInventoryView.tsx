
import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Barcode, CheckCircle2, Search, Loader2, History, Lightbulb, PlayCircle, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { CountingHistoryTable } from '@/components/inventory/CountingHistoryTable';
import { InventorySuggestionsTab } from '@/components/inventory/InventorySuggestionsTab';
import { motion, AnimatePresence } from 'framer-motion';


export function CyclicInventoryView() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('execution');
  
  const [lotInput, setLotInput] = useState('');
  const [foundItem, setFoundItem] = useState<{ 
    id: string, 
    name: string, 
    systemQty: number, 
    tarefaId?: string, 
    hasLote: boolean,
    lote?: string
  } | null>(null);
  
  const [physicalQtyInput, setPhysicalQtyInput] = useState('');
  const [bipedLotes, setBipedLotes] = useState<{lote: string, quantity: number}[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const lotInputRef = useRef<HTMLInputElement>(null);
  const qtyInputRef = useRef<HTMLInputElement>(null);
  const loteBipeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeTab === 'execution') lotInputRef.current?.focus();
  }, [activeTab]);

  const checkDailyLimits = async (hasLote: boolean) => {
    if (!user) return true;
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('inventory_daily_limits')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .maybeSingle();

    if (data) {
      if (hasLote && data.counts_with_lote >= 2) {
        toast.error('Limite diário atingido: Máximo de 2 contagens com lote por dia.');
        return false;
      }
      if (!hasLote && data.counts_without_lote >= 3) {
        toast.error('Limite diário atingido: Máximo de 3 contagens sem lote por dia.');
        return false;
      }
    }
    return true;
  };

  const handleItemSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lotInput.trim()) return;

    setIsValidating(true);
    setFoundItem(null);
    setBipedLotes([]);

    try {
      const code = lotInput.trim();
      
      const { data: task } = await (supabase.from('inventory_tasks') as any)
        .select('*')
        .eq('codigo_lote', code)
        .eq('status', 'pendente')
        .maybeSingle();

      if (task) {
        const taskData = task as any;
        setFoundItem({
          id: taskData.item_id || '',
          name: taskData.item_name || 'Item sem nome',
          systemQty: taskData.expected_qty || 0,
          tarefaId: taskData.id,
          hasLote: taskData.has_lote || false,
          lote: taskData.codigo_lote
        });
        toast.success('Tarefa encontrada!');
      } else {
        const { data: reg } = await supabase.from('registros').select('*').eq('lote', code).maybeSingle();
        if (reg) {
          setFoundItem({
            id: reg.id,
            name: reg.item,
            systemQty: reg.quantidade || reg.m2 || reg.m_linear || 0,
            hasLote: true,
            lote: reg.lote
          });
        } else {
          const { data: inv } = await supabase.from('inventory').select('*').or(`sku.eq.${code},name.ilike.%${code}%`).maybeSingle();
          if (inv) {
            setFoundItem({
              id: inv.id,
              name: inv.name,
              systemQty: inv.quantity,
              hasLote: false
            });
          } else {
            toast.error('Item não encontrado!');
          }
        }
      }
    } catch (err) {
      toast.error('Erro na busca');
    } finally {
      setIsValidating(false);
    }
  };

  const handleLoteBipe = (e: React.FormEvent) => {
    e.preventDefault();
    const bipe = (e.target as any).loteBipe.value.trim();
    if (!bipe) return;
    setBipedLotes(prev => [...prev, { lote: bipe, quantity: 1 }]);
    (e.target as any).loteBipe.value = '';
    loteBipeRef.current?.focus();
  };

  const handleFinalize = async () => {
    if (!foundItem || !user) return;
    
    const canProceed = await checkDailyLimits(foundItem.hasLote);
    if (!canProceed) return;

    setIsSubmitting(true);
    const countedQty = foundItem.hasLote ? bipedLotes.length : parseFloat(physicalQtyInput);
    const systemQty = foundItem.systemQty || 0;
    const diff = countedQty - systemQty;
    const diffPercent = systemQty > 0 ? Math.abs(diff / systemQty) : (countedQty > 0 ? 1 : 0);
    const needsRecheck = diffPercent > 0.05;

    try {
      const now = new Date().toISOString();
      
      if (foundItem.tarefaId) {
        await supabase
          .from('inventory_tasks')
          .update({
            status: needsRecheck ? 'awaiting_recheck' : 'completed',
            completed_by: user.id,
            completed_at: now,
            counted_qty: countedQty,
            conferente_nome: user.email?.split('@')[0],
            divergence_details: {
                diff,
                diffPercent,
                bipedLotes: foundItem.hasLote ? bipedLotes : null
            }
          } as any)
          .eq('id', foundItem.tarefaId);
      }

      const today = new Date().toISOString().split('T')[0];
      const { data: limit } = await supabase.from('inventory_daily_limits').select('*').eq('user_id', user.id).eq('date', today).maybeSingle();
      
      if (limit) {
        await supabase.from('inventory_daily_limits').update({
          counts_with_lote: foundItem.hasLote ? limit.counts_with_lote + 1 : limit.counts_with_lote,
          counts_without_lote: !foundItem.hasLote ? limit.counts_without_lote + 1 : limit.counts_without_lote,
        }).eq('id', limit.id);
      } else {
        await supabase.from('inventory_daily_limits').insert({
          user_id: user.id,
          date: today,
          counts_with_lote: foundItem.hasLote ? 1 : 0,
          counts_without_lote: !foundItem.hasLote ? 1 : 0
        });
      }

      if (!needsRecheck) {
          const table = foundItem.id.length > 30 ? 'registros' : 'inventory';
          await (supabase.from(table) as any).update({ ultima_contagem: now }).eq('id', foundItem.id);
      }

      if (needsRecheck) {
        toast.warning(`Divergência alta (${(diffPercent * 100).toFixed(1)}%). Solicitada reconferência.`);
      } else {
        toast.success('Contagem finalizada e aprovada!');
      }

      setFoundItem(null);
      setLotInput('');
      setPhysicalQtyInput('');
      setBipedLotes([]);
    } catch (err) {
      toast.error('Erro ao finalizar');
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="space-y-8">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex w-full sm:w-auto h-16 rounded-[1.5rem] p-1.5 shadow-2xl bg-card/40 backdrop-blur-3xl border border-white/10 mb-10 ring-1 ring-white/5">
          <TabsTrigger value="execution" className="rounded-xl font-black uppercase tracking-widest text-[10px] flex-1 sm:flex-none sm:px-10 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-xl transition-all duration-500 gap-2.5">
            <PlayCircle className="w-4 h-4" />
            Execução
          </TabsTrigger>
          <TabsTrigger value="suggestions" className="rounded-xl font-black uppercase tracking-widest text-[10px] flex-1 sm:flex-none sm:px-10 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-xl transition-all duration-500 gap-2.5">
            <Lightbulb className="w-4 h-4" />
            Sugestões
          </TabsTrigger>
          <TabsTrigger value="history" className="rounded-xl font-black uppercase tracking-widest text-[10px] flex-1 sm:flex-none sm:px-10 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-xl transition-all duration-500 gap-2.5">
            <History className="w-4 h-4" />
            Histórico
          </TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <TabsContent value="execution" className="space-y-8 mt-0">
              <Card className="rounded-[3rem] border-white/10 bg-card/40 backdrop-blur-3xl shadow-2xl overflow-hidden ring-1 ring-white/10 group transition-all duration-500">
                <CardHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-10 border-b border-white/5">
                  <CardTitle className="flex items-center gap-5 text-2xl font-black uppercase tracking-tight">
                    <div className="p-4 rounded-[1.5rem] bg-primary text-primary-foreground shadow-2xl shadow-primary/30 ring-4 ring-primary/20 group-hover:scale-110 transition-transform duration-500">
                      <Barcode className="w-8 h-8" />
                    </div>
                    <div>
                      <span className="block text-primary text-[10px] font-black tracking-[0.3em] mb-1">{foundItem ? 'Etapa de Contagem' : 'Abertura de Auditoria'}</span>
                      {foundItem ? 'Identificar Itens' : 'Início de Inventário'}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-10">
                  {!foundItem ? (
                    <form onSubmit={handleItemSearch} className="space-y-8">
                      <div className="flex items-center justify-between ml-1">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Bipar Lote ou SKU para Iniciar</Label>
                        <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest px-2 py-0 border-primary/20 text-primary">Operação Ativa</Badge>
                      </div>
                      <div className="relative group/input">
                        <Search className="absolute left-10 top-1/2 -translate-y-1/2 w-8 h-8 text-muted-foreground group-focus-within/input:text-primary transition-colors duration-500" />
                        <Input 
                          ref={lotInputRef}
                          value={lotInput}
                          onChange={(e) => setLotInput(e.target.value)}
                          placeholder="BIPE O CÓDIGO AQUI..." 
                          className="h-28 pl-24 pr-10 text-3xl sm:text-4xl font-black uppercase rounded-[2.5rem] bg-background/50 border-2 border-border/50 focus:border-primary focus:ring-8 focus:ring-primary/5 transition-all shadow-2xl shadow-black/5"
                        />
                        {isValidating && <Loader2 className="absolute right-10 top-1/2 -translate-y-1/2 w-10 h-10 animate-spin text-primary" />}
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-8 animate-in zoom-in-95 duration-500">
                      <div className="p-8 rounded-[2rem] bg-primary/5 border-2 border-primary/10 flex flex-col sm:flex-row items-center justify-between gap-6">
                        <div className="text-center sm:text-left">
                          <h4 className="text-2xl font-black uppercase tracking-tight text-foreground">{foundItem.name}</h4>
                          <div className="flex items-center gap-3 mt-1 justify-center sm:justify-start">
                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Sistema:</span>
                            <span className="text-sm font-black text-primary">{foundItem.systemQty}</span>
                          </div>
                        </div>
                        <Badge className="bg-primary text-primary-foreground font-black py-2 px-6 rounded-2xl shadow-lg shadow-primary/20 uppercase tracking-widest text-[10px]">
                            {foundItem.hasLote ? 'COM LOTE' : 'SEM LOTE'}
                        </Badge>
                      </div>

                      {foundItem.hasLote ? (
                        <div className="space-y-6">
                          <form onSubmit={handleLoteBipe} className="space-y-4">
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary ml-1">Bipar Lotes Individuais</Label>
                            <Input 
                              name="loteBipe"
                              ref={loteBipeRef}
                              autoFocus
                              placeholder="BIPE CADA LOTE..."
                              className="h-20 px-8 text-2xl font-black uppercase rounded-[1.5rem] border-2 border-primary/20 focus:border-primary focus:ring-4 focus:ring-primary/5 bg-primary/5 shadow-inner"
                            />
                          </form>
                          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 max-h-[250px] overflow-y-auto p-4 rounded-[1.5rem] bg-muted/10 border border-border/5">
                            {bipedLotes.length === 0 ? (
                              <div className="col-span-full py-10 text-center text-muted-foreground font-bold uppercase text-[10px] tracking-widest">Aguardando bipe...</div>
                            ) : bipedLotes.map((b, i) => (
                              <Badge key={i} variant="outline" className="h-12 justify-center px-4 border-emerald-500/20 bg-emerald-500/5 text-emerald-600 font-black text-[10px] rounded-xl shadow-sm">
                                {b.lote}
                              </Badge>
                            ))}
                          </div>
                          <div className="flex items-center justify-between bg-emerald-500/5 p-6 rounded-[1.5rem] border border-emerald-500/10">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => setBipedLotes([])} 
                                className="text-[10px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-500/10 rounded-xl px-4"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Limpar
                              </Button>
                              <div className="flex flex-col items-end">
                                <span className="text-[10px] font-black text-muted-foreground uppercase">Total Bipado</span>
                                <span className="text-3xl font-black text-emerald-600 tracking-tighter">{bipedLotes.length}</span>
                              </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary ml-1 text-center block">Quantidade Total Encontrada</Label>
                          <Input 
                            type="number"
                            ref={qtyInputRef}
                            value={physicalQtyInput}
                            onChange={(e) => setPhysicalQtyInput(e.target.value)}
                            placeholder="0.00"
                            className="h-32 text-6xl font-black text-center rounded-[2rem] bg-background border-2 border-border/50 focus:border-primary focus:ring-8 focus:ring-primary/5 shadow-inner"
                          />
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row gap-4 pt-6">
                          <Button variant="outline" onClick={() => setFoundItem(null)} className="h-20 rounded-[1.5rem] font-black uppercase tracking-widest flex-1 hover:bg-muted transition-colors border-2">Trocar Item</Button>
                          <Button 
                            onClick={handleFinalize}
                            disabled={isSubmitting || (foundItem.hasLote ? bipedLotes.length === 0 : !physicalQtyInput)}
                            className="h-20 rounded-[1.5rem] bg-emerald-600 hover:bg-emerald-700 text-white text-xl font-black uppercase tracking-[0.2em] shadow-2xl shadow-emerald-600/20 flex-[2] group"
                          >
                            {isSubmitting ? <Loader2 className="w-8 h-8 animate-spin" /> : (
                                <>
                                    <CheckCircle2 className="w-8 h-8 mr-3 group-hover:scale-110 transition-transform" />
                                    Finalizar
                                </>
                            )}
                          </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="suggestions" className="mt-0">
              <InventorySuggestionsTab />
            </TabsContent>

            <TabsContent value="history" className="mt-0">
              <CountingHistoryTable />
            </TabsContent>
          </motion.div>
        </AnimatePresence>
      </Tabs>
    </div>
  );

}
