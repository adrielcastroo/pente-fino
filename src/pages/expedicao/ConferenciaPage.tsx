import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Loader2, ScanLine, ShoppingCart, X } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAlocarPecaNoCarrinho } from '@/hooks/expedicao/useExpedicaoData';
import { toast } from 'sonner';

type CarrinhoOpt = { id: string; codigo: string; status: string };
type Alocacao = { etiqueta: string; carrinho: string; ts: number };

export default function ConferenciaPage() {
  const qc = useQueryClient();
  const [peca, setPeca] = useState('');
  const [carrinhoCodigo, setCarrinhoCodigo] = useState('');
  const [pendingEtiqueta, setPendingEtiqueta] = useState<string | null>(null);
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
    if (pendingEtiqueta) carrinhoRef.current?.focus();
    else pecaRef.current?.focus();
  }, [pendingEtiqueta]);

  // 1. Bipar peça — apenas registra a etiqueta pendente (sem procurar picking)
  const handlePecaEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    const codigo = peca.trim();
    if (!codigo) return;
    e.preventDefault();
    setPendingEtiqueta(codigo);
    setPeca('');
  };

  // 2/3. Alocar peça no carrinho
  const alocarCarrinho = async (codCar: string) => {
    if (!pendingEtiqueta) return;
    const carrinho = codCar.trim();
    if (!carrinho) return;
    try {
      await alocar.mutateAsync({ codigoEtiqueta: pendingEtiqueta, codigoCarrinho: carrinho });
      toast.success(`${pendingEtiqueta.toUpperCase()} → ${carrinho.toUpperCase()}`);
      setRecentes((prev) => [
        { etiqueta: pendingEtiqueta, carrinho: carrinho.toUpperCase(), ts: Date.now() },
        ...prev.slice(0, 19),
      ]);
      setPendingEtiqueta(null);
      setCarrinhoCodigo('');
      qc.invalidateQueries({ queryKey: ['expedicao_carrinhos_disponiveis'] });
      setTimeout(() => pecaRef.current?.focus(), 0);
    } catch {
      // toast já emitido pelo hook
    }
  };

  const handleCarrinhoEnter = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && carrinhoCodigo.trim() && pendingEtiqueta) {
      e.preventDefault();
      await alocarCarrinho(carrinhoCodigo.trim());
    }
  };

  const cancelarPendente = () => {
    setPendingEtiqueta(null);
    setCarrinhoCodigo('');
    setTimeout(() => pecaRef.current?.focus(), 0);
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Alocação de peças</h1>
        <p className="text-sm text-muted-foreground">
          Bipe a peça e, em seguida, o carrinho onde ela será armazenada até a conferência da expedição.
        </p>
      </header>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <ScanLine className="size-4" />
            {pendingEtiqueta ? 'Passo 2 — Bipar carrinho' : 'Passo 1 — Bipar peça'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!pendingEtiqueta ? (
            <Input
              ref={pecaRef}
              value={peca}
              onChange={(e) => setPeca(e.target.value)}
              onKeyDown={handlePecaEnter}
              placeholder="Bipe o QR / código da peça"
              autoComplete="off"
              className="h-12 font-mono uppercase text-base"
            />
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-xs">
                <span className="text-muted-foreground">
                  Etiqueta pendente:{' '}
                  <span className="font-mono font-semibold text-foreground">
                    {pendingEtiqueta.toUpperCase()}
                  </span>
                </span>
                <Button size="sm" variant="ghost" className="h-6" onClick={cancelarPendente}>
                  <X className="size-3" /> Cancelar
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
                  disabled={alocar.isPending}
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
                        disabled={alocar.isPending}
                        onClick={() => alocarCarrinho(c.codigo)}
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
              {alocar.isPending && (
                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="size-3 animate-spin" /> Alocando…
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
                  <span className="font-mono">{r.etiqueta.toUpperCase()}</span>
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
