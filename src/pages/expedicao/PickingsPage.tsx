import { useEffect, useMemo, useRef, useState } from 'react';
import { Link2, Loader2, ScanLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePickings, useAssociarCarrinho } from '@/hooks/expedicao/useExpedicaoData';

export default function PickingsPage() {
  const { data: pickings, isLoading } = usePickings();
  const associar = useAssociarCarrinho();
  const [picking, setPicking] = useState('');
  const [carrinho, setCarrinho] = useState('');
  const pickingRef = useRef<HTMLInputElement>(null);
  const carrinhoRef = useRef<HTMLInputElement>(null);

  useEffect(() => { pickingRef.current?.focus(); }, []);

  const handlePickingKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && picking.trim()) {
      e.preventDefault();
      carrinhoRef.current?.focus();
    }
  };

  const handleCarrinhoKey = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && carrinho.trim() && picking.trim()) {
      e.preventDefault();
      try {
        await associar.mutateAsync({ pickingNumero: picking, carrinhoCodigo: carrinho });
        setPicking(''); setCarrinho('');
        pickingRef.current?.focus();
      } catch { /* toast já exibido */ }
    }
  };

  const ativos = useMemo(
    () => (pickings ?? []).filter(p => p.carrinho_id && ['em_separacao', 'em_conferencia'].includes(p.status)),
    [pickings]
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Pickings</h1>
        <p className="text-sm text-muted-foreground">Associação picking ↔ carrinho por dupla bipagem.</p>
      </header>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <ScanLine className="size-4" /> Bipagem em sequência
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">1. Picking</label>
            <Input
              ref={pickingRef}
              value={picking}
              onChange={(e) => setPicking(e.target.value)}
              onKeyDown={handlePickingKey}
              placeholder="Bipe o número do picking"
              autoComplete="off"
              className="h-11 font-mono uppercase"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">2. Carrinho</label>
            <Input
              ref={carrinhoRef}
              value={carrinho}
              onChange={(e) => setCarrinho(e.target.value)}
              onKeyDown={handleCarrinhoKey}
              placeholder="Bipe o código do carrinho"
              autoComplete="off"
              className="h-11 font-mono uppercase"
            />
          </div>
          <div className="flex items-end">
            <Button
              className="h-11 w-full md:w-auto"
              disabled={!picking.trim() || !carrinho.trim() || associar.isPending}
              onClick={() => associar.mutate({ pickingNumero: picking, carrinhoCodigo: carrinho }, {
                onSuccess: () => { setPicking(''); setCarrinho(''); pickingRef.current?.focus(); },
              })}
            >
              {associar.isPending ? <Loader2 className="size-4 animate-spin" /> : <Link2 className="size-4" />}
              Associar
            </Button>
          </div>
        </CardContent>
      </Card>

      <section>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">Em separação / conferência</h2>
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Carregando…
          </div>
        ) : ativos.length === 0 ? (
          <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
            Nenhum picking associado no momento.
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {ativos.map((p) => (
              <li key={p.id} className="rounded-lg border bg-card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-mono text-sm font-semibold">{p.numero}</p>
                    <p className="text-xs text-muted-foreground">{p.cliente}</p>
                  </div>
                  <Badge variant="outline" className="font-mono">{p.carrinho?.codigo}</Badge>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
