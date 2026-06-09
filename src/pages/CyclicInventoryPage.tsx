import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Barcode, CheckCircle2, AlertTriangle, Search, Package2, ArrowLeft, Send, ListChecks, History as HistoryIcon, User } from 'lucide-react';
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
      const { data: task } = await supabase
        .from('tarefas_contagem')
        .select('*')
        .eq('codigo_lote', code)
        .eq('status', 'pendente')
        .maybeSingle();

      if (task) {
        setFoundItem({
          id: task.item_id,
          name: task.item_name,
          systemQty: task.quantidade_esperada_sistema,
          tarefaId: task.id,
          hasLote: task.has_lote || false,
          lote: task.codigo_lote
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
    const diffPercent = Math.abs((countedQty - foundItem.systemQty) / foundItem.systemQty);
    const needsRecheck = diffPercent > 0.05;

    try {
      const { error: histErr } = await supabase.from('historico_contagens').insert({
        tarefa_id: foundItem.tarefaId,
        conferente_nome: user.email?.split('@')[0],
        quantidade_contada: countedQty,
        quantidade_sistema: foundItem.systemQty,
        diferenca: countedQty - foundItem.systemQty,
        detalhes_bipagem: foundItem.hasLote ? bipedLotes : [{ qty: countedQty }]
      });

      if (histErr) throw histErr;

      // Update daily limits
      const today = new Date().toISOString().split('T')[0];
      const { data: limit } = await supabase.from('contagens_diarias_limite').select('*').eq('user_id', user.id).eq('data', today).maybeSingle();
      if (limit) {
        await supabase.from('contagens_diarias_limite').update({
          contagens_com_lote: foundItem.hasLote ? limit.contagens_com_lote + 1 : limit.contagens_com_lote,
          contagens_sem_lote: !foundItem.hasLote ? limit.contagens_sem_lote + 1 : limit.contagens_sem_lote,
        }).eq('id', limit.id);
      } else {
        await supabase.from('contagens_diarias_limite').insert({
          user_id: user.id,
          data: today,
          contagens_com_lote: foundItem.hasLote ? 1 : 0,
          contagens_sem_lote: !foundItem.hasLote ? 1 : 0
        });
      }

      if (needsRecheck && foundItem.tarefaId) {
        await supabase.from('tarefas_contagem').update({ status: 'awaiting_recheck' }).eq('id', foundItem.tarefaId);
        toast.warning('Divergência alta (>5%). Solicitada reconferência.');
      } else if (foundItem.tarefaId) {
        await supabase.from('tarefas_contagem').update({ status: 'completed' }).eq('id', foundItem.tarefaId);
        toast.success('Contagem finalizada e aprovada!');
      } else {
        toast.success('Contagem avulsa registrada!');
      }

      // Reset
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
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')} className="rounded-full">
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tight">Inventário</h1>
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Contagem e Auditoria</p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-16 rounded-2xl p-1.5 shadow-sm bg-muted/20">
          <TabsTrigger value="execution" className="font-black uppercase tracking-widest text-xs">Execução</TabsTrigger>
          <TabsTrigger value="suggestions" className="font-black uppercase tracking-widest text-xs">Sugestões</TabsTrigger>
          <TabsTrigger value="history" className="font-black uppercase tracking-widest text-xs">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="execution" className="space-y-6 mt-8">
          <Card className="rounded-[2rem] border-border/20 shadow-2xl overflow-hidden">
            <CardHeader className="bg-primary/[0.03] p-8 border-b">
              <CardTitle className="flex items-center gap-4 text-2xl font-black uppercase">
                <Barcode className="w-8 h-8 text-primary" />
                {foundItem ? 'Identificar Itens' : 'Bipar Lote'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              {!foundItem ? (
                <form onSubmit={handleItemSearch} className="space-y-6">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Lote ou SKU</Label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground" />
                    <Input 
                      ref={lotInputRef}
                      value={lotInput}
                      onChange={(e) => setLotInput(e.target.value)}
                      placeholder="BIPE O CÓDIGO..." 
                      className="h-20 pl-14 text-2xl font-black uppercase rounded-2xl bg-muted/20"
                    />
                  </div>
                </form>
              ) : (
                <div className="space-y-8">
                  <div className="p-6 rounded-2xl bg-primary/5 border-2 border-primary/20 flex items-center justify-between">
                    <div>
                      <h4 className="text-2xl font-black uppercase">{foundItem.name}</h4>
                      <p className="text-sm font-bold text-muted-foreground uppercase">Sistema: {foundItem.systemQty}</p>
                    </div>
                    <Badge className="bg-primary text-white font-black">{foundItem.hasLote ? 'COM LOTE' : 'SEM LOTE'}</Badge>
                  </div>

                  {foundItem.hasLote ? (
                    <div className="space-y-6">
                      <form onSubmit={handleLoteBipe} className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Bipar Cada Lote Individualmente</Label>
                        <Input 
                          name="loteBipe"
                          ref={loteBipeRef}
                          autoFocus
                          placeholder="BIPE LOTE..."
                          className="h-16 text-xl font-black uppercase rounded-2xl border-primary/30"
                        />
                      </form>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {bipedLotes.map((b, i) => (
                          <Badge key={i} variant="outline" className="h-10 justify-between px-3 border-emerald-500/30 bg-emerald-500/5">
                            {b.lote}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-right font-black text-emerald-600 uppercase tracking-widest">Total: {bipedLotes.length}</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Quantidade Total Encontrada</Label>
                      <Input 
                        type="number"
                        value={physicalQtyInput}
                        onChange={(e) => setPhysicalQtyInput(e.target.value)}
                        placeholder="0.00"
                        className="h-20 text-3xl font-black text-center rounded-2xl"
                      />
                    </div>
                  )}

                  <Button 
                    onClick={handleFinalize}
                    disabled={isSubmitting || (foundItem.hasLote ? bipedLotes.length === 0 : !physicalQtyInput)}
                    className="w-full h-24 rounded-3xl bg-emerald-600 hover:bg-emerald-700 text-white text-xl font-black uppercase tracking-widest shadow-2xl transition-all"
                  >
                    Finalizar Contagem ({foundItem.hasLote ? bipedLotes.length : physicalQtyInput})
                  </Button>
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