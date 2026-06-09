
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
  const [isNewItem, setIsNewItem] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [foundItem, setFoundItem] = useState<{ id: string | null, name: string, lote: string, currentAddress: string } | null>(null);
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
          setIsNewItem(true);
          toast.info('Item não cadastrado. Informe uma descrição para continuar.');
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

    setIsSubmitting(true);
    const newAddress = addressInput.trim().toUpperCase();
    const conferente = user?.email?.split('@')[0] || 'Conferente';
    const timestamp = new Date().toLocaleString('pt-BR');

    try {
      // 1. Save to movimentacoes_endereco
      const { error } = await supabase
        .from('movimentacoes_endereco')
        .insert({
          item_id: foundItem.id, // can be null
          codigo_lote: foundItem.lote,
          endereco_anterior: foundItem.currentAddress,
          endereco_novo: newAddress,
          conferente_nome: conferente,
          data_movimentacao: new Date().toISOString()
        });

      if (error) throw error;

      const allocationData = {
        timestamp,
        conferente,
        item: foundItem.name,
        lote: foundItem.lote,
        origem: foundItem.currentAddress,
        destino: newAddress
      };

      setLastAllocated(allocationData);
      setSessionAllocations(prev => [...prev, allocationData]);
      
      toast.success(`Alocação de ${foundItem.name} concluída!`);
      
      // Reset
      setLotInput('');
      setAddressInput('');
      setManualDescription('');
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
          {lastAllocated && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => exportAllocationXLSX({ data: lastAllocated })}
              className="h-8 rounded-xl font-black uppercase tracking-widest text-[9px] flex items-center gap-1.5 text-emerald-500 hover:bg-emerald-500/10"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Relatório
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
          </CardContent>
        </Card>

        {/* Found Item Detail Card (Visible when found or in Step 2) */}
        {foundItem && (
          <div className="animate-in zoom-in-95 slide-in-from-top-4 duration-500">
            <Card className="rounded-[2rem] border-emerald-500/30 bg-emerald-500/[0.02] border-dashed border-2 shadow-inner overflow-hidden">
              <CardContent className="p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                  <div className="p-4 rounded-2xl bg-emerald-500/10 text-emerald-600">
                    <Package className="w-10 h-10" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xl sm:text-2xl font-black text-foreground uppercase tracking-tight">{foundItem.name}</h4>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-black text-[9px] uppercase tracking-widest">LOTE: {foundItem.lote}</Badge>
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-black text-[9px] uppercase tracking-widest">ATUAL: {foundItem.currentAddress}</Badge>
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

      {/* History Log (Optional preview of current session) */}
      {lastAllocated && (
        <div className="p-6 rounded-3xl bg-emerald-500/5 border border-emerald-500/10 animate-in fade-in duration-500">
           <div className="flex items-center gap-3 mb-4">
              <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
              <h4 className="text-[11px] font-black uppercase tracking-widest text-emerald-600">Última Movimentação Registrada</h4>
           </div>
           <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="space-y-1">
                 <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Item</p>
                 <p className="text-xs font-black uppercase truncate">{lastAllocated.item}</p>
              </div>
              <div className="space-y-1">
                 <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Lote</p>
                 <p className="text-xs font-black uppercase">{lastAllocated.lote}</p>
              </div>
              <div className="space-y-1">
                 <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">De</p>
                 <p className="text-xs font-black uppercase text-amber-500">{lastAllocated.origem}</p>
              </div>
              <div className="space-y-1">
                 <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Para</p>
                 <p className="text-xs font-black uppercase text-emerald-500">{lastAllocated.destino}</p>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
