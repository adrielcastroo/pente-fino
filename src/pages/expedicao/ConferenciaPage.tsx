import { useEffect, useRef, useState } from 'react';
import { 
  CheckCircle2, 
  Loader2, 
  ScanLine, 
  ShoppingCart, 
  Trash2, 
  X, 
  Truck,
  ArrowRight,
  PackageCheck,
  UserCheck,
  Search
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useExpedicaoStore } from '@/store/useExpedicaoStore';
import { useValidarPeca, useAlocarPeca } from '@/hooks/expedicao/useExpedicaoFlow';
import CarrierSelectorDialog from '@/components/expedicao/CarrierSelectorDialog';
import { bipToast } from '@/lib/toast-flows';

export default function ConferenciaPage() {
  const qc = useQueryClient();
  const { 
    pecaAtual, 
    setPecaAtual,
    transportadoraSelecionada,
    setTransportadoraSelecionada,
    carrinhoSelecionado,
    setCarrinhoSelecionado,
    bipagemHistorico,
    addBipagemHistorico,
    limparSessaoAlocacao
  } = useExpedicaoStore();

  const [inputVal, setInputVal] = useState('');
  const [carrierModalOpen, setCarrierModalOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { validar, loading: validando } = useValidarPeca();
  const { alocar, loading: alocando } = useAlocarPeca();

  useEffect(() => { inputRef.current?.focus(); }, []);

  // Determinar o passo atual baseado no estado do store
  const step = !pecaAtual ? 'peca' : !transportadoraSelecionada ? 'transportadora' : 'carrinho';

  const handleEnter = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    const value = inputVal.trim().toUpperCase();
    if (!value) return;
    e.preventDefault();
    setInputVal('');

    if (step === 'peca') {
      const peca = await validar(value);
      if (peca) {
        // Acesso seguro via cast para evitar erro de relação não detectada pelo TS
        const pecaTyped = peca as any;
        if (pecaTyped.picking?.transportadora_id) {
          // Lógica futura: buscar transportadora se houver no picking
        }
      }
    } else if (step === 'carrinho') {
      // Bipar carrinho
      const { data: carrinho, error } = await supabase
        .from('expedicao_carrinhos')
        .select('*')
        .eq('codigo', value)
        .maybeSingle();

      if (error || !carrinho) {
        bipToast.erro('Carrinho não encontrado');
        return;
      }

      setCarrinhoSelecionado(carrinho);
      
      // Executar alocação atômica
      const res = await alocar({
        peca_id: pecaAtual.id,
        carrinho_id: carrinho.id,
        transportadora_id: transportadoraSelecionada.id
      });

      if (res?.ok) {
        addBipagemHistorico({
          codigo: pecaAtual.codigo_etiqueta,
          tipo: 'peca',
          status: 'sucesso'
        });
        limparSessaoAlocacao();
        setTimeout(() => inputRef.current?.focus(), 0);
      }
    }
  };

  const cancelarFluxo = () => {
    limparSessaoAlocacao();
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Fluxo de Conferência</h1>
          <p className="text-sm text-muted-foreground">
            Validação atômica e alocação direcionada por transportadora.
          </p>
        </div>
        {(pecaAtual || transportadoraSelecionada) && (
          <Button variant="ghost" size="sm" onClick={cancelarFluxo} className="text-destructive gap-2">
            <X className="size-4" /> Cancelar Fluxo
          </Button>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className={cn(
            "border-2 transition-all duration-200",
            step === 'peca' ? "border-primary shadow-lg" : "border-muted opacity-80"
          )}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <ScanLine className="size-5" />
                Passo 1: Identificar Peça
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pecaAtual ? (
                <div className="flex items-center justify-between bg-primary/5 p-4 rounded-lg border border-primary/20">
                  <div className="flex items-center gap-4">
                    <div className="bg-primary/20 p-2 rounded-full text-primary">
                      <PackageCheck className="size-6" />
                    </div>
                    <div>
                      <div className="font-mono text-lg font-bold">{pecaAtual.codigo_etiqueta}</div>
                      <div className="text-xs text-muted-foreground">{pecaAtual.cliente?.nome_razao || 'Cliente não identificado'}</div>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-background">VALIDADA</Badge>
                </div>
              ) : (
                <div className="space-y-4">
                  <Input
                    ref={step === 'peca' ? inputRef : null}
                    value={step === 'peca' ? inputVal : ''}
                    onChange={(e) => setInputVal(e.target.value)}
                    onKeyDown={handleEnter}
                    placeholder="Bipe a etiqueta da peça..."
                    className="h-14 text-xl font-mono uppercase"
                    disabled={validando}
                  />
                  {validando && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="size-4 animate-spin" /> Validando peça...
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className={cn(
            "border-2 transition-all duration-200",
            step === 'transportadora' ? "border-primary shadow-lg" : "border-muted",
            step === 'peca' && "opacity-40"
          )}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Truck className="size-5" />
                Passo 2: Direcionar Transportadora
              </CardTitle>
            </CardHeader>
            <CardContent>
              {transportadoraSelecionada ? (
                <div className="flex items-center justify-between bg-primary/5 p-4 rounded-lg border border-primary/20">
                  <div className="flex items-center gap-4">
                    <div className="bg-primary/20 p-2 rounded-full text-primary">
                      <Truck className="size-6" />
                    </div>
                    <div>
                      <div className="font-bold">{transportadoraSelecionada.nome}</div>
                      <div className="text-xs text-muted-foreground font-mono">{transportadoraSelecionada.codigo}</div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setTransportadoraSelecionada(null)}>Trocar</Button>
                </div>
              ) : (
                <div className="flex gap-4">
                  <Button 
                    className="h-14 flex-1 text-lg gap-3" 
                    variant="outline"
                    disabled={step === 'peca'}
                    onClick={() => setCarrierModalOpen(true)}
                  >
                    <Search className="size-5" />
                    Selecionar Transportadora
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className={cn(
            "border-2 transition-all duration-200",
            step === 'carrinho' ? "border-primary shadow-lg" : "border-muted",
            (step === 'peca' || step === 'transportadora') && "opacity-40"
          )}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <ShoppingCart className="size-5" />
                Passo 3: Alocar no Carrinho
              </CardTitle>
            </CardHeader>
            <CardContent>
              {carrinhoSelecionado ? (
                <div className="flex items-center gap-4 bg-primary/5 p-4 rounded-lg border border-primary/20">
                   <div className="bg-primary/20 p-2 rounded-full text-primary">
                      <ShoppingCart className="size-6" />
                    </div>
                    <div className="font-mono text-xl font-bold">{carrinhoSelecionado.codigo}</div>
                </div>
              ) : (
                <div className="space-y-4">
                   <Input
                    ref={step === 'carrinho' ? inputRef : null}
                    value={step === 'carrinho' ? inputVal : ''}
                    onChange={(e) => setInputVal(e.target.value)}
                    onKeyDown={handleEnter}
                    placeholder="Bipe o código do carrinho..."
                    className="h-14 text-xl font-mono uppercase"
                    disabled={step !== 'carrinho' || alocando}
                  />
                  {alocando && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="size-4 animate-spin" /> Efetuando alocação...
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle2 className="size-4" /> 
                Histórico da Sessão
              </CardTitle>
            </CardHeader>
            <CardContent>
              {bipagemHistorico.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground border-2 border-dashed rounded-lg">
                  Nenhuma peça alocada
                </div>
              ) : (
                <div className="space-y-3">
                  {bipagemHistorico.filter(b => b.tipo === 'peca').slice(0, 5).map((b, idx) => (
                    <div key={`${b.ts}-${idx}`} className="flex items-center justify-between p-2 rounded border bg-muted/20">
                      <span className="font-mono text-sm">{b.codigo}</span>
                      <Badge variant="outline" className="text-[10px] text-green-600 border-green-200">ALOCADA</Badge>
                    </div>
                  ))}
                  {bipagemHistorico.length > 5 && (
                    <Button variant="link" className="w-full text-xs" onClick={() => {}}>Ver histórico completo</Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <CarrierSelectorDialog 
        open={carrierModalOpen}
        onOpenChange={setCarrierModalOpen}
        onSelect={setTransportadoraSelecionada}
      />
    </div>
  );
}
