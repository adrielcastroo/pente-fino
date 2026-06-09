import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Barcode, CheckCircle2, AlertTriangle, Search, Package2, ArrowLeft, Send, ListChecks, History as HistoryIcon, User, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { CountingHistoryTable } from '@/components/inventory/CountingHistoryTable';
import { InventorySuggestionsTab } from '@/components/inventory/InventorySuggestionsTab';
import { cn } from '@/lib/utils';
import { formatDateBR } from '@/lib/app-utils';

export default function CyclicInventoryPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('execution');
  
  // Execution state
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
      
      // 1. Check tasks
      const { data: task, error: taskError } = await supabase
        .from('inventory_tasks')
        .select('*')
        .eq('codigo_lote' as any, code)
        .eq('status', 'pendente')
        .maybeSingle();

      if (taskError) throw taskError;

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
        // 2. Fallback search
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

      if (foundItem.hasLote && bipedLotes.length > 0 && foundItem.tarefaId) {
        const itemsToInsert = bipedLotes.map(b => ({
            task_id: foundItem.tarefaId,
            lote: b.lote,
            quantity: b.quantity
        }));
        await supabase.from('inventory_task_items').insert(itemsToInsert as any);
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
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 p-4 sm:p-0">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')} className="rounded-full">
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div>
            <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight">Inventário</h1>
            <p className="text-xs sm:text-sm font-bold text-muted-foreground uppercase tracking-widest">Contagem e Auditoria</p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-14 rounded-2xl p-1.5 shadow-sm bg-muted/20">
          <TabsTrigger value="execution" className="font-black uppercase tracking-widest text-[10px]">Execução</TabsTrigger>
          <TabsTrigger value="suggestions" className="font-black uppercase tracking-widest text-[10px]">Sugestões</TabsTrigger>
          <TabsTrigger value="history" className="font-black uppercase tracking-widest text-[10px]">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="execution" className="space-y-6 mt-8">
          <Card className="rounded-[2rem] border-border/20 shadow-2xl overflow-hidden bg-card/10 backdrop-blur-md">
            <CardHeader className="bg-primary/[0.03] p-6 sm:p-8 border-b">
              <CardTitle className="flex items-center gap-4 text-xl sm:text-2xl font-black uppercase">
                <Barcode className="w-8 h-8 text-primary" />
                {foundItem ? 'Identificar Itens' : 'Bipar Lote'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 sm:p-8">
              {!foundItem ? (
                <form onSubmit={handleItemSearch} className="space-y-6">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Lote ou SKU</Label>
                  <div className="relative group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input 
                      ref={lotInputRef}
                      value={lotInput}
                      onChange={(e) => setLotInput(e.target.value)}
                      placeholder="BIPE O CÓDIGO AQUI..." 
                      className="h-20 pl-16 text-xl sm:text-2xl font-black uppercase rounded-2xl bg-muted/20 border-border/20 focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all"
                    />
                    {isValidating && <Loader2 className="absolute right-6 top-1/2 -translate-y-1/2 w-6 h-6 animate-spin text-primary" />}
                  </div>
                </form>
              ) : (
                <div className="space-y-8 animate-in zoom-in-95 duration-500">
                  <div className="p-6 rounded-3xl bg-primary/5 border-2 border-primary/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-center sm:text-left">
                      <h4 className="text-xl sm:text-2xl font-black uppercase tracking-tight">{foundItem.name}</h4>
                      <p className="text-xs sm:text-sm font-bold text-muted-foreground uppercase tracking-wider">Sistema: {foundItem.systemQty}</p>
                    </div>
                    <Badge className="bg-primary text-white font-black py-1.5 px-4 rounded-xl uppercase tracking-widest text-[10px]">
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
                          className="h-16 text-xl font-black uppercase rounded-2xl border-primary/30 focus:border-primary focus:ring-4 focus:ring-primary/5 bg-primary/5"
                        />
                      </form>
                      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 max-h-[200px] overflow-y-auto p-2 scrollbar-hide">
                        {bipedLotes.map((b, i) => (
                          <Badge key={i} variant="outline" className="h-10 justify-center px-4 border-emerald-500/30 bg-emerald-500/5 text-emerald-600 font-black text-[10px] rounded-xl">
                            {b.lote}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex items-center justify-between border-t border-border/10 pt-4">
                          <Button variant="ghost" size="sm" onClick={() => setBipedLotes([])} className="text-[10px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-500/10">Limpar Tudo</Button>
                          <p className="text-lg font-black text-emerald-600 uppercase tracking-widest">Total: {bipedLotes.length}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary ml-1">Quantidade Total Encontrada</Label>
                      <Input 
                        type="number"
                        ref={qtyInputRef}
                        value={physicalQtyInput}
                        onChange={(e) => setPhysicalQtyInput(e.target.value)}
                        placeholder="0.00"
                        className="h-24 text-4xl sm:text-5xl font-black text-center rounded-2xl bg-muted/20 border-border/20 focus:border-primary focus:ring-4 focus:ring-primary/5"
                      />
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-4 pt-4">
                      <Button variant="outline" onClick={() => setFoundItem(null)} className="h-16 rounded-2xl font-black uppercase tracking-widest flex-1">Trocar Item</Button>
                      <Button 
                        onClick={handleFinalize}
                        disabled={isSubmitting || (foundItem.hasLote ? bipedLotes.length === 0 : !physicalQtyInput)}
                        className="h-16 sm:h-20 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-lg font-black uppercase tracking-widest shadow-xl flex-[2] group"
                      >
                        {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                            <>
                                <CheckCircle2 className="w-6 h-6 mr-2 group-hover:scale-110 transition-transform" />
                                Finalizar Contagem
                            </>
                        )}
                      </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suggestions" className="mt-8">
          <InventorySuggestionsTab />
        </TabsContent>

        <TabsContent value="history" className="mt-8">
          <CountingHistoryTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}
