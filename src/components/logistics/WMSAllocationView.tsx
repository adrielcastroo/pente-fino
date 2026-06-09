
import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Barcode, MapPin, CheckCircle2, AlertTriangle, Package, Send, FileSpreadsheet, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import { exportAllocationXLSX } from '@/lib/xlsx-utils';
import { motion } from 'framer-motion';


export function WMSAllocationView() {
  const { user } = useAuth();
  
  // States
  const [step, setStep] = useState<1 | 2>(1);
  const [lotInput, setLotInput] = useState('');
  const [addressInput, setAddressInput] = useState('');
  const [manualDescription, setManualDescription] = useState('');
  const [quantity, setQuantity] = useState('');
  const [isNewItem, setIsNewItem] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [foundItem, setFoundItem] = useState<{ id: string | null, name: string, lote: string, currentAddress: string, isVirtual?: boolean } | null>(null);
  const [sessionAllocations, setSessionAllocations] = useState<any[]>([]);

  // Refs
  const lotInputRef = useRef<HTMLInputElement>(null);
  const addressInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (step === 1) lotInputRef.current?.focus();
    else addressInputRef.current?.focus();
  }, [step]);

  const handleLotSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!lotInput.trim()) return;

    setIsValidating(true);
    setFoundItem(null);
    setIsNewItem(false);

    try {
      const lot = lotInput.trim();
      
      const { data: regData } = await supabase
        .from('registros')
        .select('id, item, lote, endereco')
        .eq('lote', lot)
        .maybeSingle();

      if (regData) {
        setFoundItem({
          id: regData.id,
          name: regData.item,
          lote: regData.lote,
          currentAddress: regData.endereco || 'Sem endereço'
        });
        setStep(2);
        toast.success('Item validado! Agora bipe o novo endereço.');
      } else {
        const { data: invData } = await supabase
          .from('inventory')
          .select('id, name, sku, location')
          .eq('sku', lot)
          .maybeSingle();

        if (invData) {
          setFoundItem({
            id: invData.id,
            name: invData.name,
            lote: invData.sku,
            currentAddress: invData.location || 'Sem endereço'
          });
          setStep(2);
          toast.success('Item validado! Agora bipe o novo endereço.');
        } else {
          setFoundItem({
            id: null,
            name: `Item Virtual - Lote [${lot}]`,
            lote: lot,
            currentAddress: 'ESTOQUE VIRTUAL',
            isVirtual: true
          });
          setStep(2);
          toast.warning('Lote não encontrado. Criado como Estoque Virtual provisório.');
        }
      }
    } catch (err) {
      console.error('Search error:', err);
      toast.error('Erro ao validar lote');
    } finally {
      setIsValidating(false);
    }
  };

  const handleFinalize = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!foundItem || !addressInput.trim()) return;
    
    if (foundItem.isVirtual && !quantity.trim()) {
      toast.error('Informe a quantidade para itens virtuais');
      return;
    }

    setIsSubmitting(true);
    const newAddress = addressInput.trim().toUpperCase();
    const conferente = user?.email?.split('@')[0] || 'Conferente';
    const timestamp = new Date().toLocaleString('pt-BR');

    try {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('movimentacoes_endereco')
        .insert({
          item_id: foundItem.id,
          codigo_lote: foundItem.lote,
          endereco_anterior: foundItem.currentAddress,
          endereco_novo: newAddress,
          conferente_nome: conferente,
          data_movimentacao: now,
          tipo_estoque: foundItem.isVirtual ? 'VIRTUAL' : 'OFICIAL',
          status_integracao: foundItem.isVirtual ? 'pendente' : 'integrado',
          quantidade: foundItem.isVirtual ? parseFloat(quantity) : null,
          descricao_item: foundItem.name
        });

      if (error) throw error;

      if (foundItem.id) {
        const table = foundItem.id.length > 30 ? 'registros' : 'inventory';
        const updateData = table === 'registros' 
          ? { endereco: newAddress, data_entrada: now } 
          : { location: newAddress, data_entrada: now };
          
        await (supabase.from(table) as any).update(updateData).eq('id', foundItem.id);
      }

      const allocationData = {
        timestamp,
        conferente,
        item: foundItem.name,
        lote: foundItem.lote,
        origem: foundItem.currentAddress,
        destino: newAddress,
        origemCadastro: foundItem.isVirtual ? 'Estoque Virtual (Contingência)' : 'Cadastro Oficial'
      };

      setSessionAllocations(prev => [...prev, allocationData]);
      toast.success(`Alocação de ${foundItem.name} concluída!`);
      
      setLotInput('');
      setAddressInput('');
      setManualDescription('');
      setQuantity('');
      setFoundItem(null);
      setIsNewItem(false);
      setStep(1);
    } catch (err) {
      console.error('Submit error:', err);
      toast.error('Erro ao salvar alocação');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportAll = () => {
    if (sessionAllocations.length === 0) {
      toast.error('Nenhuma movimentação para exportar');
      return;
    }
    exportAllocationXLSX({ data: sessionAllocations });
    toast.success('Relatório completo exportado!');
  };


  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tight">Endereçamento</h2>
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mt-1">Bipagem Sequencial de Itens e Endereços</p>
        </div>
        {sessionAllocations.length > 0 && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExportAll}
            className="rounded-xl font-black uppercase tracking-widest text-[9px] h-11 px-5 flex items-center gap-2 text-emerald-600 hover:bg-emerald-500 hover:text-white border-emerald-500/30 transition-all duration-300 shadow-lg shadow-emerald-500/5 hover:scale-105 active:scale-95"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Exportar ({sessionAllocations.length})
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-8">
        <motion.div
           animate={{ 
             opacity: step === 2 ? 0.6 : 1, 
             scale: step === 2 ? 0.98 : 1,
             translateY: step === 2 ? -10 : 0
           }}
           transition={{ duration: 0.4 }}
           className="relative"
        >
          <Card className="rounded-[3rem] border-white/10 bg-card/40 backdrop-blur-3xl shadow-2xl overflow-hidden ring-1 ring-white/10 group transition-all duration-500 hover:shadow-primary/5">
            <CardHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-10 border-b border-white/5">
              <CardTitle className="flex items-center gap-5 text-2xl font-black uppercase tracking-tight">
                <div className="p-4 rounded-[1.5rem] bg-primary text-primary-foreground shadow-2xl shadow-primary/30 ring-4 ring-primary/20 group-hover:scale-110 transition-transform duration-500">
                  <Barcode className="w-8 h-8" />
                </div>
                <div>
                  <span className="block text-primary text-[10px] font-black tracking-[0.3em] mb-1">Passo 01</span>
                  Identificação do Lote
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-10">
              <form onSubmit={handleLotSearch} className="space-y-6">
                <div className="flex items-center justify-between ml-1">
                   <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Código de Barras / SKU</Label>
                   <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest px-2 py-0 border-primary/20 text-primary">Aguardando Bipe</Badge>
                </div>
                <div className="relative group/input">
                  <Input 
                    ref={lotInputRef}
                    value={lotInput}
                    onChange={(e) => setLotInput(e.target.value)}
                    placeholder="BIPE O LOTE AQUI..." 
                    className="h-24 px-10 text-3xl font-black tracking-[0.1em] uppercase rounded-[2rem] bg-background/50 border-2 border-border/50 focus:border-primary focus:ring-8 focus:ring-primary/5 transition-all shadow-2xl shadow-black/5 group-hover/input:border-primary/50"
                    disabled={isValidating || step === 2}
                  />
                  {isValidating ? (
                    <div className="absolute right-10 top-1/2 -translate-y-1/2">
                      <Loader2 className="w-10 h-10 animate-spin text-primary" />
                    </div>
                  ) : (
                    <div className="absolute right-10 top-1/2 -translate-y-1/2 opacity-20 group-focus-within/input:opacity-100 transition-opacity">
                      <Send className="w-8 h-8 text-primary" />
                    </div>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {foundItem && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative"
          >
            <Card className={cn(
              "rounded-[2.5rem] border-2 shadow-2xl overflow-hidden backdrop-blur-3xl transition-all duration-500",
              foundItem.isVirtual 
                ? "border-amber-500/50 bg-amber-500/5 shadow-amber-500/10" 
                : "border-emerald-500/50 bg-emerald-500/5 shadow-emerald-500/10"
            )}>
              <CardContent className="p-8 flex flex-col sm:flex-row items-center justify-between gap-8">
                <div className="flex items-center gap-8">
                  <div className={cn(
                    "p-6 rounded-3xl shadow-2xl ring-4 transition-transform duration-500 hover:rotate-6",
                    foundItem.isVirtual 
                      ? "bg-amber-500 text-white shadow-amber-500/30 ring-amber-500/20" 
                      : "bg-emerald-500 text-white shadow-emerald-500/30 ring-emerald-500/20"
                  )}>
                    <Package className="w-10 h-10" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h4 className="text-2xl font-black text-foreground uppercase tracking-tight">{foundItem.name}</h4>
                      {foundItem.isVirtual && (
                         <Badge className="bg-amber-500 text-white font-black uppercase text-[8px] animate-pulse">Pendente Regularização</Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <Badge variant="outline" className="bg-background/80 font-black text-[10px] uppercase tracking-[0.2em] py-1.5 px-4 rounded-xl border-white/10 shadow-sm">
                        LOTE: {foundItem.lote}
                      </Badge>
                      <Badge variant="outline" className={cn(
                        "font-black text-[10px] uppercase tracking-[0.2em] py-1.5 px-4 rounded-xl shadow-sm border-2",
                        foundItem.isVirtual 
                          ? "bg-amber-500/10 text-amber-600 border-amber-500/20" 
                          : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                      )}>
                        {foundItem.isVirtual ? 'ESTOQUE VIRTUAL' : `ATUAL: ${foundItem.currentAddress}`}
                      </Badge>
                    </div>
                  </div>
                </div>
                 <Button 
                   variant="ghost" 
                   size="sm" 
                   onClick={() => { setStep(1); setFoundItem(null); setLotInput(''); }} 
                   className="h-12 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500 transition-all duration-300 border border-transparent hover:border-rose-500/20"
                 >
                  Cancelar / Trocar
                 </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ 
            opacity: step === 2 ? 1 : 0, 
            height: step === 2 ? 'auto' : 0,
            translateY: step === 2 ? 0 : 40
          }}
          className="overflow-hidden"
        >
          <Card className="rounded-[3rem] border-white/10 bg-card/40 backdrop-blur-3xl shadow-2xl overflow-hidden ring-1 ring-white/10 group transition-all duration-500">
            <CardHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-10 border-b border-white/5">
              <CardTitle className="flex items-center gap-5 text-2xl font-black uppercase tracking-tight">
                <div className="p-4 rounded-[1.5rem] bg-primary text-primary-foreground shadow-2xl shadow-primary/30 ring-4 ring-primary/20 group-hover:scale-110 transition-transform duration-500">
                  <MapPin className="w-8 h-8" />
                </div>
                <div>
                   <span className="block text-primary text-[10px] font-black tracking-[0.3em] mb-1">Passo 02</span>
                   Endereçamento Final
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-10 space-y-10">
              <form onSubmit={handleFinalize} className="space-y-6">
                <div className="flex items-center justify-between ml-1">
                   <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Código do Endereço (Destino)</Label>
                   <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest px-2 py-0 border-primary/20 text-primary">Próxima Etapa</Badge>
                </div>
                <Input 
                  ref={addressInputRef}
                  value={addressInput}
                  onChange={(e) => setAddressInput(e.target.value)}
                  placeholder="BIPE O ENDEREÇO AQUI..." 
                  className="h-24 px-10 text-3xl font-black tracking-[0.1em] uppercase rounded-[2rem] bg-background/50 border-2 border-border/50 focus:border-primary focus:ring-8 focus:ring-primary/5 transition-all shadow-2xl shadow-black/5"
                  disabled={isSubmitting}
                />
              </form>
              
              {foundItem?.isVirtual && (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6 p-8 rounded-[2.5rem] bg-amber-500/5 border-2 border-amber-500/20 shadow-inner"
                >
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-500 ml-1 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Quantidade / Metragem Provisória
                    </Label>
                    <Badge className="bg-amber-500 text-white font-black text-[9px]">Obrigatório</Badge>
                  </div>
                  <Input 
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="0.00" 
                    className="h-24 px-10 text-5xl font-black uppercase rounded-[2rem] bg-background/50 border-2 border-amber-500/30 focus:border-amber-500 focus:ring-8 focus:ring-amber-500/10 transition-all text-center tracking-tighter shadow-2xl"
                  />
                </motion.div>
              )}

              <Button 
                onClick={handleFinalize}
                disabled={isSubmitting || !addressInput.trim()}
                className="w-full h-28 rounded-[2.5rem] bg-emerald-600 hover:bg-emerald-500 text-white text-xl font-black uppercase tracking-[0.4em] shadow-2xl shadow-emerald-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] ring-8 ring-emerald-500/10 flex items-center justify-center gap-6 group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite] transition-all" />
                {isSubmitting ? <Loader2 className="w-10 h-10 animate-spin" /> : (
                  <>
                    <CheckCircle2 className="w-10 h-10 group-hover:scale-125 transition-transform duration-500 drop-shadow-lg" />
                    Finalizar Alocação
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );

}
