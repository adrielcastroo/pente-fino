
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
          <h2 className="text-2xl font-black uppercase tracking-tight">Endereçamento WMS</h2>
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mt-1">Bipagem Sequencial de Itens e Endereços</p>
        </div>
        {sessionAllocations.length > 0 && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExportAll}
            className="rounded-xl font-black uppercase tracking-widest text-[9px] flex items-center gap-1.5 text-emerald-600 hover:bg-emerald-500/10 border-emerald-500/20"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Exportar ({sessionAllocations.length})
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6">
        <motion.div
           animate={{ opacity: step === 2 ? 0.6 : 1, scale: step === 2 ? 0.98 : 1 }}
           className="relative"
        >
          <Card className="rounded-[2.5rem] border-border/10 bg-card/50 backdrop-blur-xl shadow-2xl overflow-hidden border border-white/5">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent p-8 border-b border-white/5">
              <CardTitle className="flex items-center gap-4 text-xl font-black uppercase tracking-tight">
                <div className="p-3.5 rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                  <Barcode className="w-6 h-6" />
                </div>
                Etapa 1: Identificação
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handleLotSearch} className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Código do Lote / SKU</Label>
                <div className="relative group">
                  <Input 
                    ref={lotInputRef}
                    value={lotInput}
                    onChange={(e) => setLotInput(e.target.value)}
                    placeholder="BIPE O LOTE AQUI..." 
                    className="h-20 px-8 text-2xl font-black tracking-widest uppercase rounded-[1.5rem] bg-background border-2 border-border/50 focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all shadow-inner"
                    disabled={isValidating || step === 2}
                  />
                  {isValidating && <Loader2 className="absolute right-8 top-1/2 -translate-y-1/2 w-6 h-6 animate-spin text-primary" />}
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {foundItem && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative"
          >
            <Card className={cn(
              "rounded-[2rem] border-2 shadow-xl overflow-hidden bg-background/50",
              foundItem.isVirtual ? "border-amber-500/30" : "border-emerald-500/30"
            )}>
              <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                  <div className={cn(
                    "p-4 rounded-2xl",
                    foundItem.isVirtual ? "bg-amber-500/10 text-amber-600" : "bg-emerald-500/10 text-emerald-600"
                  )}>
                    <Package className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xl font-black text-foreground uppercase tracking-tight">{foundItem.name}</h4>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="bg-background/50 font-black text-[10px] uppercase tracking-widest py-1 px-3">LOTE: {foundItem.lote}</Badge>
                      <Badge variant="outline" className={cn(
                        "font-black text-[10px] uppercase tracking-widest py-1 px-3",
                        foundItem.isVirtual ? "bg-amber-500/10 text-amber-600 border-amber-500/20" : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                      )}>
                        {foundItem.isVirtual ? 'ESTOQUE VIRTUAL' : `ATUAL: ${foundItem.currentAddress}`}
                      </Badge>
                    </div>
                  </div>
                </div>
                 <Button variant="ghost" size="sm" onClick={() => { setStep(1); setFoundItem(null); setLotInput(''); }} className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:bg-muted">
                  Trocar
                 </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: step === 2 ? 1 : 0, height: step === 2 ? 'auto' : 0 }}
          className="overflow-hidden"
        >
          <Card className="rounded-[2.5rem] border-border/10 bg-card/50 backdrop-blur-xl shadow-2xl overflow-hidden border border-white/5">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent p-8 border-b border-white/5">
              <CardTitle className="flex items-center gap-4 text-xl font-black uppercase tracking-tight">
                <div className="p-3.5 rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                  <MapPin className="w-6 h-6" />
                </div>
                Etapa 2: Endereçamento
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <form onSubmit={handleFinalize} className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Código do Endereço (Destino)</Label>
                <Input 
                  ref={addressInputRef}
                  value={addressInput}
                  onChange={(e) => setAddressInput(e.target.value)}
                  placeholder="BIPE O ENDEREÇO AQUI..." 
                  className="h-20 px-8 text-2xl font-black tracking-widest uppercase rounded-[1.5rem] bg-background border-2 border-border/50 focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all shadow-inner"
                  disabled={isSubmitting}
                />
              </form>
              
              {foundItem?.isVirtual && (
                <div className="space-y-4 animate-in slide-in-from-top-2">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500 ml-1 flex items-center gap-2">
                    <AlertTriangle className="w-3 h-3" />
                    Quantidade / Metragem
                  </Label>
                  <Input 
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="0.00" 
                    className="h-20 px-8 text-2xl font-black uppercase rounded-[1.5rem] bg-amber-500/5 border-2 border-amber-500/20 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/5 transition-all shadow-inner"
                  />
                </div>
              )}

              <Button 
                onClick={handleFinalize}
                disabled={isSubmitting || !addressInput.trim()}
                className="w-full h-24 rounded-[2rem] bg-emerald-600 hover:bg-emerald-700 text-white text-lg font-black uppercase tracking-[0.3em] shadow-2xl shadow-emerald-600/20 transition-all hover:scale-[1.01] active:scale-[0.98] flex items-center justify-center gap-4 group"
              >
                {isSubmitting ? <Loader2 className="w-8 h-8 animate-spin" /> : (
                  <>
                    <CheckCircle2 className="w-8 h-8 group-hover:scale-110 transition-transform" />
                    Confirmar Alocação
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
