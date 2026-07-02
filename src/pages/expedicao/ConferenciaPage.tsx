import { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, CloudOff, Loader2, RefreshCw, ScanLine, ShoppingCart, Wifi, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  usePickingByNumero,
  usePickingItens,
  useBipPeca,
  useFinalizarConferencia,
  useAlocarPecaNoCarrinho,
} from '@/hooks/expedicao/useExpedicaoData';
import { useOfflineBipQueue } from '@/hooks/expedicao/useOfflineBipQueue';
import { toast } from 'sonner';

export default function ConferenciaPage() {
  const [numero, setNumero] = useState('');
  const [confirmado, setConfirmado] = useState<string | null>(null);
  const [peca, setPeca] = useState('');
  const pickingRef = useRef<HTMLInputElement>(null);
  const pecaRef = useRef<HTMLInputElement>(null);

  const { data: picking, isFetching: loadingPicking } = usePickingByNumero(confirmado);
  const pickingId = picking?.id ?? null;
  const { data: itens } = usePickingItens(pickingId);
  const bip = useBipPeca();
  const finalizar = useFinalizarConferencia();
  const { online, pending, syncing, queueBip, flush } = useOfflineBipQueue();

  useEffect(() => { pickingRef.current?.focus(); }, []);
  useEffect(() => { if (picking) pecaRef.current?.focus(); }, [picking]);

  const totals = useMemo(() => {
    const list = itens ?? [];
    const prevista = list.reduce((s, i) => s + i.qtd_prevista, 0);
    const bipada = list.reduce((s, i) => s + i.qtd_bipada, 0);
    return { prevista, bipada, pct: prevista > 0 ? Math.min(100, (bipada / prevista) * 100) : 0 };
  }, [itens]);

  const handlePickingEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && numero.trim()) {
      e.preventDefault();
      setConfirmado(numero.trim().toUpperCase());
    }
  };

  const handlePecaEnter = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && peca.trim() && pickingId) {
      e.preventDefault();
      const codigo = peca;
      setPeca('');
      if (!online) {
        await queueBip(pickingId, codigo);
        toast.info(`Offline — ${codigo.trim().toUpperCase()} na fila`);
      } else {
        try {
          const r = await bip.mutateAsync({ pickingId, codigoPeca: codigo });
          if (r.novo) toast.success(`Nova peça ${r.codigo}`);
        } catch {
          // Network error → enqueue as fallback
          await queueBip(pickingId, codigo);
          toast.warning(`Sem conexão — ${codigo.trim().toUpperCase()} na fila`);
        }
      }
      pecaRef.current?.focus();
    }
  };

  const reset = () => {
    setConfirmado(null); setNumero(''); setPeca('');
    setTimeout(() => pickingRef.current?.focus(), 0);
  };

  if (!picking || !pickingId) {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">Conferência de peças</h1>
          <p className="text-sm text-muted-foreground">Bipe o picking para iniciar a conferência.</p>
        </header>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <ScanLine className="size-4" /> Picking
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              ref={pickingRef}
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
              onKeyDown={handlePickingEnter}
              placeholder="Bipe o número do picking"
              autoComplete="off"
              className="h-12 font-mono uppercase text-base"
            />
            {loadingPicking && confirmado && (
              <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="size-3 animate-spin" /> Buscando {confirmado}…
              </p>
            )}
            {confirmado && !loadingPicking && !picking && (
              <p className="mt-2 text-xs text-destructive">Picking {confirmado} não encontrado.</p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  const completo = totals.prevista > 0 && totals.bipada >= totals.prevista;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            <span className="font-mono">{picking.numero}</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            {picking.cliente}
            {picking.carrinho?.codigo && <> · Carrinho <span className="font-mono">{picking.carrinho.codigo}</span></>}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={reset}>
          <X className="size-4" /> Trocar picking
        </Button>
      </header>

      <div className="flex flex-wrap items-center gap-2 rounded-md border bg-card px-3 py-2 text-xs">
        <Badge variant={online ? 'default' : 'destructive'} className="gap-1">
          {online ? <Wifi className="size-3" /> : <CloudOff className="size-3" />}
          {online ? 'Online' : 'Offline'}
        </Badge>
        <span className="text-muted-foreground">
          Fila local: <span className="font-mono">{pending.length}</span>
        </span>
        {pending.length > 0 && (
          <Button size="sm" variant="ghost" className="ml-auto h-7" disabled={syncing || !online} onClick={() => flush()}>
            {syncing ? <Loader2 className="size-3 animate-spin" /> : <RefreshCw className="size-3" />}
            Sincronizar
          </Button>
        )}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <ScanLine className="size-4" /> Bipar peça
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            ref={pecaRef}
            value={peca}
            onChange={(e) => setPeca(e.target.value)}
            onKeyDown={handlePecaEnter}
            placeholder="Bipe o QR / código da peça"
            autoComplete="off"
            className="h-12 font-mono uppercase text-base"
          />
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progresso</span>
              <span className="font-mono">{totals.bipada} / {totals.prevista}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full transition-all ${completo ? 'bg-success' : 'bg-primary'}`}
                style={{ width: `${totals.pct}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Peças ({itens?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {!itens || itens.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma peça bipada ainda.</p>
          ) : (
            <ul className="divide-y">
              {itens.map((i) => {
                const ok = i.qtd_bipada >= i.qtd_prevista;
                return (
                  <li key={i.id} className="flex items-center justify-between py-2">
                    <div>
                      <p className="font-mono text-sm">{i.codigo_peca}</p>
                      {i.descricao && <p className="text-xs text-muted-foreground">{i.descricao}</p>}
                    </div>
                    <Badge variant={ok ? 'default' : 'outline'} className="font-mono">
                      {i.qtd_bipada} / {i.qtd_prevista}
                    </Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          size="lg"
          disabled={!completo || finalizar.isPending}
          onClick={() => finalizar.mutate(pickingId, { onSuccess: reset })}
        >
          {finalizar.isPending ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
          Finalizar conferência
        </Button>
      </div>
    </div>
  );
}
