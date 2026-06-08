
import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Barcode, CheckCircle2, AlertTriangle, Search, Package2, ArrowLeft, Send, FileSpreadsheet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { CountingHistoryTable } from '@/components/inventory/CountingHistoryTable';
import { cn } from '@/lib/utils';
import { TarefaContagem } from '@/types';
import { exportCyclicInventoryXLSX } from '@/lib/xlsx-utils';
import { formatDateBR } from '@/lib/app-utils';

export default function CyclicInventoryPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('execution');
  
  // Execution state
  const [lotInput, setLotInput] = useState('');
  const [foundItem, setFoundItem] = useState<{ id?: string, name: string, systemQty: number, tarefaId?: string } | null>(null);
  const [physicalQty, setPhysicalQty] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [errorStatus, setErrorStatus] = useState<'none' | 'not_found' | 'warning'>('none');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sessionScans, setSessionScans] = useState<{timestamp: string, itemCode: string, inspectorName: string}[]>([]);
  const [lastExportData, setLastExportData] = useState<{ itemCode: string, scans: any[] } | null>(null);
  
  const lotInputRef = useRef<HTMLInputElement>(null);
  const qtyInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    lotInputRef.current?.focus();
  }, [activeTab]);

  const handleLotSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lotInput.trim()) return;

    setIsValidating(true);
    setErrorStatus('none');
    setFoundItem(null);

    try {
      // 1. Check if there's a pending task for this lot
      const { data: taskData, error: taskError } = await supabase
        .from('tarefas_contagem')
        .select('*')
        .eq('codigo_lote', lotInput.trim())
        .eq('status', 'pendente')
        .maybeSingle();

      if (taskData) {
        setFoundItem({
          id: taskData.item_id,
          name: taskData.item_name || 'Item do Sistema',
          systemQty: taskData.quantidade_esperada_sistema,
          tarefaId: taskData.id
        });
        
        // Add to session scans
        setSessionScans(prev => [...prev, {
          timestamp: new Date().toLocaleString('pt-BR'),
          itemCode: lotInput.trim(),
          inspectorName: user?.email?.split('@')[0] || 'Conferente'
        }]);
        
        setTimeout(() => qtyInputRef.current?.focus(), 100);
      } else {
        // 2. If no pending task, check if lot exists in 'registros'
        const { data: regData, error: regError } = await supabase
          .from('registros')
          .select('id, item, quantidade, m2, m_linear')
          .eq('lote', lotInput.trim())
          .maybeSingle();

        if (regData) {
          setFoundItem({
            id: regData.id,
            name: regData.item || 'Item de Tecido',
            systemQty: regData.quantidade || regData.m2 || regData.m_linear || 0,
            tarefaId: undefined
          });
          
          // Add to session scans
          setSessionScans(prev => [...prev, {
            timestamp: new Date().toLocaleString('pt-BR'),
            itemCode: lotInput.trim(),
            inspectorName: user?.email?.split('@')[0] || 'Conferente'
          }]);
          
          setTimeout(() => qtyInputRef.current?.focus(), 100);
        } else {
          // 3. Check 'inventory' for motors or others
          const { data: invData, error: invError } = await supabase
            .from('inventory')
            .select('id, name, quantity, sku')
            .or(`sku.eq.${lotInput.trim()},name.ilike.%${lotInput.trim()}%`)
            .maybeSingle();

          if (invData) {
            setFoundItem({
              id: invData.id,
              name: invData.name,
              systemQty: invData.quantity,
                tarefaId: undefined
              });
              
              // Add to session scans
              setSessionScans(prev => [...prev, {
                timestamp: new Date().toLocaleString('pt-BR'),
                itemCode: lotInput.trim(),
                inspectorName: user?.email?.split('@')[0] || 'Conferente'
              }]);
              
              setTimeout(() => qtyInputRef.current?.focus(), 100);
          } else {
            setErrorStatus('not_found');
            toast.error('Lote não encontrado no sistema!');
          }
        }
      }
    } catch (err) {
      console.error('Search error:', err);
      toast.error('Erro ao validar lote');
    } finally {
      setIsValidating(false);
    }
  };

  const handleFinalize = async () => {
    if (!foundItem || !physicalQty) return;

    setIsSubmitting(true);
    const counted = parseFloat(physicalQty);
    const diff = counted - foundItem.systemQty;

    try {
      // 1. Create history record
      const { error: historyError } = await supabase
        .from('historico_contagens')
        .insert({
          tarefa_id: foundItem.tarefaId || null,
          conferente_nome: user?.email?.split('@')[0] || 'Conferente',
          quantidade_contada: counted,
          quantidade_sistema: foundItem.systemQty,
          diferenca: diff
        });

      if (historyError) throw historyError;

      // 2. If it was a pending task, mark as completed
      if (foundItem.tarefaId) {
        await supabase
          .from('tarefas_contagem')
          .update({ status: 'concluido' })
          .eq('id', foundItem.tarefaId);
      }

      toast.success('Contagem finalizada com sucesso!');
      
      // Prepare export data
      const scanData = {
        itemCode: foundItem.name, // Use the item name or first lot as reference
        scans: [...sessionScans]
      };
      setLastExportData(scanData);

      // Reset state
      setLotInput('');
      setFoundItem(null);
      setPhysicalQty('');
      setSessionScans([]);
      lotInputRef.current?.focus();
    } catch (err) {
      console.error('Submit error:', err);
      toast.error('Erro ao salvar contagem');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExport = () => {
    if (!lastExportData) return;
    exportCyclicInventoryXLSX({
      itemCode: lastExportData.itemCode,
      referenceDate: formatDateBR(new Date().toISOString()),
      scans: lastExportData.scans
    });
    toast.success('Relatório XLSX gerado!');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')} className="rounded-full hover:bg-primary/10">
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div>
            <h1 className="text-4xl font-black tracking-tight uppercase leading-none">Inventário Cíclico</h1>
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mt-2">Módulo de Conferência e Auditoria</p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-1 bg-muted/30 rounded-2xl border border-border/10">
          <Badge variant="outline" className="px-4 py-1 rounded-xl border-primary/20 text-primary font-black uppercase tracking-widest text-[10px]">ERP Conectado</Badge>
          <Badge variant="outline" className="px-4 py-1 rounded-xl border-emerald-500/20 text-emerald-500 font-black uppercase tracking-widest text-[10px]">Real-time</Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-16 bg-card/20 backdrop-blur-md rounded-2xl border border-border/10 p-1.5 shadow-sm">
          <TabsTrigger 
            value="execution" 
            className="rounded-xl font-black uppercase tracking-widest text-xs transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg shadow-primary/20"
          >
            Execução de Contagem
          </TabsTrigger>
          <TabsTrigger 
            value="history" 
            className="rounded-xl font-black uppercase tracking-widest text-xs transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg shadow-primary/20"
          >
            Histórico e Auditoria
          </TabsTrigger>
        </TabsList>

        <TabsContent value="execution" className="space-y-6 mt-8">
          <Card className="rounded-[2rem] border-border/20 bg-card/10 backdrop-blur-xl shadow-2xl overflow-hidden group">
            <CardHeader className="bg-primary/[0.03] p-8 border-b border-border/5">
              <CardTitle className="flex items-center gap-4 text-2xl font-black uppercase tracking-tight">
                <div className="p-3 rounded-2xl bg-primary/10 text-primary group-hover:scale-110 transition-transform duration-500">
                  <Barcode className="w-8 h-8" />
                </div>
                Entrada de Dados (Bipe)
              </CardTitle>
              <CardDescription className="text-sm font-bold uppercase tracking-widest text-muted-foreground ml-12">
                Bipe o lote ou digite o código do item para validar
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <form onSubmit={handleLotSearch} className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Código do Lote / Identificação</Label>
                  <div className="relative group">
                    <Search className={cn(
                      "absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 transition-colors duration-300",
                      isValidating ? "text-primary animate-pulse" : "text-muted-foreground group-focus-within:text-primary"
                    )} />
                    <Input 
                      ref={lotInputRef}
                      value={lotInput}
                      onChange={(e) => setLotInput(e.target.value)}
                      placeholder="BIPE O CÓDIGO AQUI..." 
                      className={cn(
                        "h-20 pl-14 text-2xl font-black tracking-widest uppercase rounded-2xl bg-muted/20 border-border/20 focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all",
                        errorStatus === 'not_found' && "border-destructive/50 ring-destructive/10 text-destructive placeholder:text-destructive/30"
                      )}
                    />
                    {lotInput && !isValidating && (
                      <Button 
                        type="submit" 
                        size="sm"
                        className="absolute right-4 top-1/2 -translate-y-1/2 rounded-xl font-black uppercase tracking-widest text-[10px] bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all"
                      >
                        Validar
                      </Button>
                    )}
                  </div>
                </div>

                {errorStatus === 'not_found' && (
                  <div className="p-6 rounded-2xl bg-destructive/5 border-2 border-destructive/20 border-dashed animate-in zoom-in-95 duration-300 flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-destructive/10 text-destructive">
                      <AlertTriangle className="w-8 h-8" />
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-destructive uppercase tracking-tight">Lote não encontrado!</h4>
                      <p className="text-xs font-bold text-destructive/70 uppercase tracking-widest leading-relaxed">Este lote não consta no sistema. Separe o item para análise ou verifique o código.</p>
                    </div>
                  </div>
                )}

                {foundItem && (
                  <div className="space-y-8 animate-in slide-in-from-top-4 duration-500">
                    <div className="p-8 rounded-[1.5rem] bg-emerald-500/5 border-2 border-emerald-500/20 border-dashed flex flex-col md:flex-row items-center justify-between gap-6">
                      <div className="flex items-center gap-6">
                        <div className="p-4 rounded-2xl bg-emerald-500/10 text-emerald-600 shadow-inner">
                          <Package2 className="w-10 h-10" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-2xl font-black text-foreground uppercase tracking-tight">{foundItem.name}</h4>
                            <Badge className="bg-emerald-500 text-white font-black text-[9px] uppercase tracking-widest py-0.5">Validado</Badge>
                          </div>
                          <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em]">
                            Qtd. no Sistema: <span className="text-emerald-600 font-black">{foundItem.systemQty}</span>
                          </p>
                        </div>
                      </div>
                      
                      <div className="w-full md:w-64 space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Quantidade Física Contada</Label>
                        <Input 
                          ref={qtyInputRef}
                          type="number"
                          step="any"
                          value={physicalQty}
                          onChange={(e) => setPhysicalQty(e.target.value)}
                          placeholder="0.00" 
                          className="h-16 text-2xl font-black text-center rounded-2xl bg-white dark:bg-black/20 border-emerald-500/30 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 transition-all"
                        />
                      </div>
                    </div>

                    <Button 
                      onClick={handleFinalize}
                      disabled={isSubmitting || !physicalQty}
                      className="w-full h-24 rounded-3xl bg-emerald-600 hover:bg-emerald-700 text-white text-xl font-black uppercase tracking-[0.3em] shadow-2xl shadow-emerald-500/20 transition-all hover:scale-[1.01] active:scale-[0.98] flex items-center justify-center gap-4 group"
                    >
                      {isSubmitting ? (
                        <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <CheckCircle2 className="w-8 h-8 group-hover:scale-110 transition-transform" />
                          Finalizar Contagem
                          <Send className="w-6 h-6 ml-2 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </Button>
                  </div>
                    )}
              </form>

              {sessionScans.length > 0 && (
                <div className="mt-8 space-y-4 animate-in slide-in-from-top-4 duration-500">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Log de Bipagem da Sessão ({sessionScans.length})</h4>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setSessionScans([])}
                      className="text-[10px] font-black uppercase tracking-widest text-destructive hover:bg-destructive/10"
                    >
                      Limpar Sessão
                    </Button>
                  </div>
                  <div className="rounded-2xl border border-border/10 overflow-hidden bg-muted/10">
                    <div className="max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-primary/20">
                      {sessionScans.map((scan, idx) => (
                        <div key={idx} className="p-4 border-b border-border/5 flex items-center justify-between hover:bg-primary/5 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary">
                              {idx + 1}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-black uppercase">{scan.itemCode}</span>
                              <span className="text-[9px] font-bold text-muted-foreground uppercase">{scan.timestamp}</span>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-[9px] font-black uppercase py-0 px-2 border-primary/20 text-primary">
                            {scan.inspectorName}
                          </Badge>
                        </div>
                      )).reverse()}
                    </div>
                  </div>
                </div>
              )}

              {lastExportData && (
                <div className="mt-8 p-6 rounded-2xl bg-primary/5 border border-primary/20 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in zoom-in-95 duration-500">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-primary/10 text-primary">
                      <FileSpreadsheet className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-black uppercase tracking-tight text-sm">Contagem finalizada para: {lastExportData.itemCode}</h4>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Deseja exportar os detalhes para Excel?</p>
                    </div>
                  </div>
                  <Button 
                    onClick={handleExport}
                    variant="default"
                    className="rounded-xl font-black uppercase tracking-widest text-xs px-6 py-4 h-auto shadow-lg shadow-primary/20"
                  >
                    Exportar XLSX
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-8">
          <CountingHistoryTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}
