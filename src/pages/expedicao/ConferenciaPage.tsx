import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Loader2, ScanLine, ShoppingCart, Trash2, X } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAlocarPecaNoCarrinho } from '@/hooks/expedicao/useExpedicaoData';
import { toast } from 'sonner';
import { bipToast } from '@/lib/toast-flows';

type CarrinhoOpt = { id: string; codigo: string; status: string };
type Alocacao = { etiqueta: string; carrinho: string; ts: number };

export default function ConferenciaPage() {
  const qc = useQueryClient();
  const [peca, setPeca] = useState('');
  const [carrinhoCodigo, setCarrinhoCodigo] = useState('');
  const [pendingList, setPendingList] = useState<string[]>([]);
  const [step, setStep] = useState<'bipar' | 'carrinho'>('bipar');
  const [alocando, setAlocando] = useState(false);
  const [recentes, setRecentes] = useState<Alocacao[]>([]);

  const pecaRef = useRef<HTMLInputElement>(null);
  const carrinhoRef = useRef<HTMLInputElement>(null);

  const alocar = useAlocarPecaNoCarrinho();

  const { data: carrinhos = [] } = useQuery({
    queryKey: ['expedicao_carrinhos_disponiveis'],
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expedicao_carrinhos')
        .select('id, codigo, status')
        .in('status', ['livre', 'em_uso'])
        .order('codigo', { ascending: true });
      if (error) throw error;
      return (data ?? []) as CarrinhoOpt[];
    },
  });

  useEffect(() => { pecaRef.current?.focus(); }, []);
  useEffect(() => {
    if (step === 'carrinho') carrinhoRef.current?.focus();
    else pecaRef.current?.focus();
  }, [step]);

  // 1. Bipar peça — acumula na lista pendente
  const handlePecaEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    const codigo = peca.trim().toUpperCase();
    if (!codigo) return;
    e.preventDefault();
    if (pendingList.includes(codigo)) {
      bipToast.duplicado(codigo);
      setPeca('');
      return;
    }
    setPendingList((prev) => [codigo, ...prev]);
    setPeca('');
  };

  const removerPendente = (codigo: string) => {
    setPendingList((prev) => prev.filter((c) => c !== codigo));
  };

  const limparTudo = () => {
    setPendingList([]);
    setStep('bipar');
    setCarrinhoCodigo('');
    setTimeout(() => pecaRef.current?.focus(), 0);
  };

  // 2. Alocar todas as peças pendentes em um carrinho
  const alocarLote = async (codCar: string) => {
    const carrinho = codCar.trim().toUpperCase();
    if (!carrinho || pendingList.length === 0) return;
    setAlocando(true);
    let sucesso = 0;
    const alocadas: Alocacao[] = [];
    try {
      for (const etiqueta of pendingList) {
        try {
          await alocar.mutateAsync({ codigoEtiqueta: etiqueta, codigoCarrinho: carrinho });
          alocadas.push({ etiqueta, carrinho, ts: Date.now() });
          sucesso++;
        } catch {
          // toast já emitido pelo hook
        }
      }
      if (sucesso > 0) {
        bipToast.lote(sucesso, pendingList.length, carrinho);
        setRecentes((prev) => [...alocadas, ...prev].slice(0, 30));
        setPendingList([]);
        setStep('bipar');
        setCarrinhoCodigo('');
        qc.invalidateQueries({ queryKey: ['expedicao_carrinhos_disponiveis'] });
        setTimeout(() => pecaRef.current?.focus(), 0);
      }
    } finally {
      setAlocando(false);
    }
  };

  const handleCarrinhoEnter = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && carrinhoCodigo.trim()) {
      e.preventDefault();
      await alocarLote(carrinhoCodigo);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Conferência</h1>
        <p className="text-sm text-muted-foreground">
          Bipe todas as peças e, ao final, escolha o carrinho onde elas serão alocadas.
        </p>
      </header>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <ScanLine className="size-4" />
            {step === 'bipar' ? `Passo 1 — Bipar peças (${pendingList.length})` : 'Passo 2 — Escolher carrinho'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {step === 'bipar' ? (
            <>
              <Input
                ref={pecaRef}
                value={peca}
                onChange={(e) => setPeca(e.target.value)}
                onKeyDown={handlePecaEnter}
                placeholder="Bipe o QR / código da peça e pressione Enter"
                autoComplete="off"
                className="h-12 font-mono uppercase text-base"
              />

              {pendingList.length > 0 && (
                <>
                  <div className="rounded-md border bg-muted/30 max-h-60 overflow-y-auto divide-y">
                    {pendingList.map((codigo) => (
                      <div key={codigo} className="flex items-center justify-between px-3 py-1.5 text-sm">
                        <span className="font-mono">{codigo}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={() => removerPendente(codigo)}
                        >
                          <Trash2 className="size-3" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      className="flex-1 gap-2"
                      onClick={() => setStep('carrinho')}
                    >
                      <ShoppingCart className="size-4" />
                      Escolher carrinho ({pendingList.length})
                    </Button>
                    <Button variant="outline" onClick={limparTudo}>
                      Limpar
                    </Button>
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-xs">
                <span className="text-muted-foreground">
                  <span className="font-semibold text-foreground">{pendingList.length}</span> peça(s) para alocar
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6"
                  onClick={() => setStep('bipar')}
                  disabled={alocando}
                >
                  <X className="size-3" /> Voltar
                </Button>
              </div>

              <div className="relative">
                <ShoppingCart className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  ref={carrinhoRef}
                  value={carrinhoCodigo}
                  onChange={(e) => setCarrinhoCodigo(e.target.value)}
                  onKeyDown={handleCarrinhoEnter}
                  placeholder="Bipe o código do carrinho"
                  autoComplete="off"
                  className="h-12 pl-9 font-mono uppercase text-base"
                  disabled={alocando}
                />
              </div>

              {carrinhos.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Ou selecione um carrinho
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {carrinhos.map((c) => (
                      <Button
                        key={c.id}
                        type="button"
                        size="sm"
                        variant={c.status === 'livre' ? 'outline' : 'secondary'}
                        disabled={alocando}
                        onClick={() => alocarLote(c.codigo)}
                        className={cn(
                          'h-9 gap-1.5 font-mono text-xs',
                          c.status === 'em_uso' && 'border-primary/40',
                        )}
                        title={`Status: ${c.status}`}
                      >
                        <ShoppingCart className="size-3" />
                        {c.codigo}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {alocando && (
                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="size-3 animate-spin" /> Alocando {pendingList.length} peça(s)…
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <CheckCircle2 className="size-4" /> Últimas alocações ({recentes.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma peça alocada nesta sessão.</p>
          ) : (
            <ul className="divide-y">
              {recentes.map((r, idx) => (
                <li key={`${r.ts}-${idx}`} className="flex items-center justify-between py-2 text-sm">
                  <span className="font-mono">{r.etiqueta}</span>
                  <Badge variant="outline" className="gap-1 font-mono">
                    <ShoppingCart className="size-3" /> {r.carrinho}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
