
import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Barcode, MapPin, CheckCircle2, AlertTriangle, ArrowLeft, Package, Send, FileSpreadsheet, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import { exportAllocationXLSX } from '@/lib/xlsx-utils';
import { formatDateBR } from '@/lib/app-utils';

export default function WMSAllocationPage() {
  const navigate = useNavigate();
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
  const [lastAllocated, setLastAllocated] = useState<any | null>(null);

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
      
      // Check in 'registros'
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
        // Check in 'inventory'
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
          // Automatic Fallback to Virtual Stock
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

  const handleConfirmNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualDescription.trim()) {
      toast.error('Informe a descrição do item');
      return;
    }

    setFoundItem({
      id: null,
      name: manualDescription.trim(),
      lote: lotInput.trim(),
      currentAddress: 'Não cadastrado'
    });
    setStep(2);
    toast.success('Descrição registrada! Agora bipe o endereço.');
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
      // 1. Save to movimentacoes_endereco
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('movimentacoes_endereco')
        .insert({
          item_id: foundItem.id, // can be null
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

      // 2. Update data_entrada/endereco in the item table
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

      setLastAllocated(allocationData);
      setSessionAllocations(prev => [...prev, allocationData]);
      
      toast.success(`Alocação de ${foundItem.name} concluída!`);
      
      // Reset
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
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 p-4 sm:p-0">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')} className="rounded-full hover:bg-primary/10">
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight uppercase leading-none">Endereçamento</h1>
            <p className="text-xs sm:text-sm font-bold text-muted-foreground uppercase tracking-widest mt-2">Alocação de Estoque WMS</p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-1 bg-muted/30 rounded-2xl border border-border/10">
          <Badge variant="outline" className="px-4 py-1 rounded-xl border-primary/20 text-primary font-black uppercase tracking-widest text-[10px]">WMS Ativo</Badge>
          {sessionAllocations.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleExportAll}
              className="h-8 rounded-xl font-black uppercase tracking-widest text-[9px] flex items-center gap-1.5 text-emerald-500 hover:bg-emerald-500/10"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Relatório Geral ({sessionAllocations.length})
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Step 1: Lot Scanning */}
        <Card className={cn(
          "rounded-[2rem] border-border/20 bg-card/10 backdrop-blur-xl shadow-2xl overflow-hidden transition-all duration-500",
          step === 2 && "opacity-50 grayscale scale-95 pointer-events-none"
        )}>
          <CardHeader className="bg-primary/[0.03] p-6 sm:p-8 border-b border-border/5">
            <CardTitle className="flex items-center gap-4 text-xl sm:text-2xl font-black uppercase tracking-tight">
              <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                <Barcode className="w-6 sm:w-8 h-6 sm:h-8" />
              </div>
              ETAPA 1: BIPAR ITEM / LOTE
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 sm:p-8">
            {!isNewItem ? (
              <form onSubmit={handleLotSearch} className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">CÓDIGO DO LOTE</Label>
                <div className="relative group">
                  <Input 
                    ref={lotInputRef}
                    value={lotInput}
                    onChange={(e) => setLotInput(e.target.value)}
                    placeholder="BIPE O LOTE AQUI..." 
                    className="h-16 sm:h-20 px-6 text-xl sm:text-2xl font-black tracking-widest uppercase rounded-2xl bg-muted/20 border-border/20 focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all"
                    disabled={isValidating || step === 2}
                  />
                  {isValidating && <Loader2 className="absolute right-6 top-1/2 -translate-y-1/2 w-6 h-6 animate-spin text-primary" />}
                </div>
              </form>
            ) : (
              <form onSubmit={handleConfirmNewItem} className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500 ml-1">DESCRIÇÃO DO NOVO ITEM</Label>
                   <Input 
                     autoFocus
                     value={manualDescription}
                     onChange={(e) => setManualDescription(e.target.value)}
                     placeholder="EX: MOTOR ELÉTRICO 5HP..." 
                     className="h-16 px-6 text-xl font-black uppercase rounded-2xl bg-amber-500/5 border-amber-500/20 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/5"
                   />
                </div>
                <div className="flex gap-4">
                   <Button type="button" variant="outline" onClick={() => setIsNewItem(false)} className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-[10px]">Cancelar</Button>
                   <Button type="submit" className="flex-2 h-14 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black uppercase tracking-widest px-8">Confirmar Item</Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Found Item Detail Card (Visible when found or in Step 2) */}
        {foundItem && (
          <div className="animate-in zoom-in-95 slide-in-from-top-4 duration-500">
            <Card className={cn(
              "rounded-[2rem] border-dashed border-2 shadow-inner overflow-hidden animate-in zoom-in-95 duration-500",
              foundItem.isVirtual ? "border-amber-500/30 bg-amber-500/[0.02]" : "border-emerald-500/30 bg-emerald-500/[0.02]"
            )}>
              <CardContent className="p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                  <div className={cn(
                    "p-4 rounded-2xl",
                    foundItem.isVirtual ? "bg-amber-500/10 text-amber-600" : "bg-emerald-500/10 text-emerald-600"
                  )}>
                    <Package className="w-10 h-10" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xl sm:text-2xl font-black text-foreground uppercase tracking-tight">{foundItem.name}</h4>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-black text-[9px] uppercase tracking-widest">LOTE: {foundItem.lote}</Badge>
                      <Badge variant="outline" className={cn(
                        "font-black text-[9px] uppercase tracking-widest",
                        foundItem.isVirtual ? "bg-amber-500/10 text-amber-600 border-amber-500/20" : "bg-primary/10 text-primary border-primary/20"
                      )}>
                        {foundItem.isVirtual ? 'ESTOQUE VIRTUAL / PROVISÓRIO' : `ATUAL: ${foundItem.currentAddress}`}
                      </Badge>
                      {foundItem.isVirtual && (
                        <Badge className="bg-amber-500 text-white font-black text-[9px] uppercase tracking-widest border-none">Aguardando Regularização</Badge>
                      )}
                    </div>
                  </div>
                </div>
                {step === 2 && (
                   <Button variant="ghost" size="sm" onClick={() => { setStep(1); setFoundItem(null); setLotInput(''); }} className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:bg-muted">
                    Trocar Item
                   </Button>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 2: Address Scanning */}
        <Card className={cn(
          "rounded-[2rem] border-border/20 bg-card/10 backdrop-blur-xl shadow-2xl overflow-hidden transition-all duration-500",
          step === 1 && "opacity-0 translate-y-8 pointer-events-none hidden",
          step === 2 && "opacity-100 translate-y-0"
        )}>
          <CardHeader className="bg-primary/[0.03] p-6 sm:p-8 border-b border-border/5">
            <CardTitle className="flex items-center gap-4 text-xl sm:text-2xl font-black uppercase tracking-tight">
              <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                <MapPin className="w-6 sm:w-8 h-6 sm:h-8" />
              </div>
              ETAPA 2: BIPAR ENDEREÇO
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 sm:p-8 space-y-8">
            <form onSubmit={handleFinalize} className="space-y-4">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">CÓDIGO DO ENDEREÇO (DESTINO)</Label>
              <Input 
                ref={addressInputRef}
                value={addressInput}
                onChange={(e) => setAddressInput(e.target.value)}
                placeholder="BIPE O ENDEREÇO AQUI..." 
                className="h-16 sm:h-20 px-6 text-xl sm:text-2xl font-black tracking-widest uppercase rounded-2xl bg-muted/20 border-border/20 focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all"
                disabled={isSubmitting}
              />
            </form>
            
            {foundItem?.isVirtual && (
              <div className="space-y-4 animate-in slide-in-from-top-2">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500 ml-1 flex items-center gap-2">
                  <AlertTriangle className="w-3 h-3" />
                  QUANTIDADE / METRAGEM (ESTOQUE VIRTUAL)
                </Label>
                <Input 
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="INFORME A QUANTIDADE..." 
                  className="h-16 px-6 text-xl font-black uppercase rounded-2xl bg-amber-500/5 border-amber-500/20 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/5 transition-all"
                />
              </div>
            )}

            <Button 
              onClick={handleFinalize}
              disabled={isSubmitting || !addressInput.trim()}
              className="w-full h-20 sm:h-24 rounded-3xl bg-emerald-600 hover:bg-emerald-700 text-white text-lg sm:text-xl font-black uppercase tracking-[0.3em] shadow-2xl shadow-emerald-500/20 transition-all hover:scale-[1.01] active:scale-[0.98] flex items-center justify-center gap-4 group"
            >
              {isSubmitting ? (
                <Loader2 className="w-8 h-8 animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-6 sm:w-8 h-6 sm:h-8" />
                  Confirmar Alocação
                  <Send className="w-5 sm:w-6 h-5 sm:h-6 ml-2" />
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* History Log (Session preview) */}
      {sessionAllocations.length > 0 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
                 <h4 className="text-[11px] font-black uppercase tracking-widest text-emerald-600">Resumo da Sessão</h4>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSessionAllocations([])} className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Limpar</Button>
           </div>
           
           <div className="rounded-3xl border border-border/10 bg-card/5 overflow-hidden">
             <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse">
                 <thead>
                   <tr className="bg-muted/30 border-b border-border/5">
                     <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-muted-foreground">Item / Lote</th>
                     <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-muted-foreground">De {'>'} Para</th>
                     <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-muted-foreground">Hora</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-border/5">
                   {sessionAllocations.slice().reverse().map((alloc, i) => (
                     <tr key={i} className="hover:bg-muted/20 transition-colors">
                       <td className="px-4 py-3">
                         <p className="text-xs font-black uppercase truncate max-w-[150px]">{alloc.item}</p>
                         <p className="text-[9px] font-bold text-muted-foreground uppercase">{alloc.lote}</p>
                       </td>
                       <td className="px-4 py-3">
                         <div className="flex items-center gap-2">
                           <span className="text-[10px] font-black text-amber-500">{alloc.origem}</span>
                           <span className="text-muted-foreground">→</span>
                           <span className="text-[10px] font-black text-emerald-500">{alloc.destino}</span>
                         </div>
                       </td>
                       <td className="px-4 py-3 text-[9px] font-bold text-muted-foreground">
                         {alloc.timestamp.split(' ')[1]}
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
           </div>
           
           <Button 
             onClick={handleExportAll}
             className="w-full h-14 rounded-2xl bg-muted border border-border/20 hover:bg-muted/80 text-foreground text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2"
           >
             <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
             Exportar Planilha Completa (.xlsx)
           </Button>
        </div>
      )}
    </div>
  );
}
