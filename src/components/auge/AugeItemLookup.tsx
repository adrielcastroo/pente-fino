import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Package, Boxes, ArrowRightLeft, Layers, ExternalLink, Loader2 } from '@/components/icons';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  /** Query inicial (código ou descrição). Se omitido, abre com input vazio. */
  initialQuery?: string;
  /** Elemento clicável que abre o dialog. Se omitido, renderiza botão padrão. */
  trigger?: React.ReactNode;
}

type Produto = {
  id: string; codigo: string; descricao: string | null; unidade: string | null;
  ncm: string | null; categoria: string | null; ativo: boolean | null; synced_at: string;
};

/**
 * Dialog reutilizável para consultar itens no espelho do ERP Auge.
 * Busca em auge_produtos e ao selecionar mostra saldo por depósito,
 * últimas movimentações e lotes ativos.
 */
export default function AugeItemLookup({ initialQuery, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [debounced, setDebounced] = useState('');
  const [selected, setSelected] = useState<Produto | null>(null);

  useEffect(() => {
    if (open) setQ(initialQuery ?? '');
  }, [open, initialQuery]);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 250);
    return () => clearTimeout(t);
  }, [q]);

  const { data: produtos = [], isFetching } = useQuery({
    queryKey: ['auge-lookup', debounced],
    enabled: open && debounced.length >= 1,
    queryFn: async () => {
      const s = debounced.replace(/[%,]/g, ' ');
      const { data, error } = await supabase
        .from('auge_produtos')
        .select('id, codigo, descricao, unidade, ncm, categoria, ativo, synced_at')
        .or(`codigo.ilike.%${s}%,descricao.ilike.%${s}%`)
        .order('codigo')
        .limit(50);
      if (error) throw error;
      return (data ?? []) as Produto[];
    },
    staleTime: 60_000,
  });

  const codigo = selected?.codigo;

  const { data: saldos = [] } = useQuery({
    queryKey: ['auge-lookup-saldo', codigo],
    enabled: !!codigo,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('auge_produtos_saldo')
        .select('deposito, quantidade, unidade, synced_at')
        .eq('codigo', codigo!)
        .order('deposito');
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: movs = [] } = useQuery({
    queryKey: ['auge-lookup-mov', codigo],
    enabled: !!codigo,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('auge_movimentacoes')
        .select('id, tipo, quantidade, data_movimento, deposito, documento, observacao')
        .eq('codigo_produto', codigo!)
        .order('data_movimento', { ascending: false, nullsFirst: false })
        .limit(15);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: lotes = [] } = useQuery({
    queryKey: ['auge-lookup-lotes', codigo],
    enabled: !!codigo,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('auge_lotes')
        .select('id, lote, quantidade, deposito, data_fabricacao, data_validade')
        .eq('codigo_produto', codigo!)
        .order('data_validade', { ascending: true, nullsFirst: false })
        .limit(30);
      if (error) throw error;
      return data ?? [];
    },
  });

  const totalSaldo = useMemo(
    () => saldos.reduce((acc, s: any) => acc + Number(s.quantidade ?? 0), 0),
    [saldos],
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm" className="gap-2">
            <ExternalLink className="h-3.5 w-3.5" /> Consultar Auge
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" /> Consultar item no Auge
          </DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            autoFocus
            placeholder="Buscar por código ou descrição..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
          />
          {isFetching && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-3 flex-1 overflow-hidden">
          {/* Lista de resultados */}
          <Card className="overflow-auto max-h-[60vh]">
            {!debounced && (
              <div className="p-4 text-sm text-muted-foreground">Digite pelo menos 1 caractere para buscar.</div>
            )}
            {debounced && produtos.length === 0 && !isFetching && (
              <div className="p-4 text-sm text-muted-foreground">Nenhum item encontrado.</div>
            )}
            <ul className="divide-y">
              {produtos.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(p)}
                    className={`w-full text-left p-2.5 hover:bg-muted/60 transition-colors ${
                      selected?.id === p.id ? 'bg-muted' : ''
                    }`}
                  >
                    <div className="font-mono text-xs font-semibold">{p.codigo}</div>
                    <div className="text-xs text-muted-foreground line-clamp-2">{p.descricao ?? '—'}</div>
                    <div className="flex items-center gap-1 mt-1">
                      {p.unidade && <Badge variant="outline" className="text-[10px] h-4">{p.unidade}</Badge>}
                      {p.ativo === false && <Badge variant="destructive" className="text-[10px] h-4">inativo</Badge>}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </Card>

          {/* Detalhe */}
          <div className="overflow-auto max-h-[60vh]">
            {!selected && (
              <div className="p-8 text-center text-sm text-muted-foreground border rounded-md h-full flex items-center justify-center">
                Selecione um item para ver saldo, movimentações e lotes.
              </div>
            )}
            {selected && (
              <div className="space-y-3">
                <Card className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-mono text-xs text-muted-foreground">{selected.codigo}</div>
                      <div className="font-semibold text-sm">{selected.descricao ?? '—'}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-muted-foreground">Saldo total</div>
                      <div className="font-bold tabular-nums">{totalSaldo}</div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {selected.unidade && <Badge variant="outline" className="text-[10px]">Un: {selected.unidade}</Badge>}
                    {selected.ncm && <Badge variant="outline" className="text-[10px]">NCM: {selected.ncm}</Badge>}
                    {selected.categoria && <Badge variant="outline" className="text-[10px]">{selected.categoria}</Badge>}
                    <Badge variant="secondary" className="text-[10px]">
                      Sync: {formatDistanceToNow(new Date(selected.synced_at), { addSuffix: true, locale: ptBR })}
                    </Badge>
                  </div>
                </Card>

                <Tabs defaultValue="saldo">
                  <TabsList className="w-full grid grid-cols-3">
                    <TabsTrigger value="saldo" className="gap-1.5">
                      <Boxes className="h-3.5 w-3.5" /> Saldo ({saldos.length})
                    </TabsTrigger>
                    <TabsTrigger value="mov" className="gap-1.5">
                      <ArrowRightLeft className="h-3.5 w-3.5" /> Mov. ({movs.length})
                    </TabsTrigger>
                    <TabsTrigger value="lotes" className="gap-1.5">
                      <Layers className="h-3.5 w-3.5" /> Lotes ({lotes.length})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="saldo">
                    <Card className="overflow-hidden">
                      <table className="w-full text-xs">
                        <thead className="bg-muted"><tr className="text-left">
                          <th className="p-2">Depósito</th><th className="p-2 text-right">Qtd</th><th className="p-2">Un</th>
                        </tr></thead>
                        <tbody>
                          {saldos.map((s: any, i) => (
                            <tr key={i} className="border-t">
                              <td className="p-2"><Badge variant="outline">{s.deposito}</Badge></td>
                              <td className="p-2 text-right tabular-nums font-semibold">{s.quantidade}</td>
                              <td className="p-2 text-muted-foreground">{s.unidade ?? '—'}</td>
                            </tr>
                          ))}
                          {saldos.length === 0 && (
                            <tr><td colSpan={3} className="p-4 text-center text-muted-foreground">Sem saldo.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </Card>
                  </TabsContent>

                  <TabsContent value="mov">
                    <Card className="overflow-hidden">
                      <table className="w-full text-xs">
                        <thead className="bg-muted"><tr className="text-left">
                          <th className="p-2">Data</th><th className="p-2">Tipo</th>
                          <th className="p-2 text-right">Qtd</th><th className="p-2">Depósito</th><th className="p-2">Doc</th>
                        </tr></thead>
                        <tbody>
                          {movs.map((m: any) => (
                            <tr key={m.id} className="border-t">
                              <td className="p-2 whitespace-nowrap">
                                {m.data_movimento ? new Date(m.data_movimento).toLocaleDateString('pt-BR') : '—'}
                              </td>
                              <td className="p-2"><Badge variant="outline" className="text-[10px]">{m.tipo}</Badge></td>
                              <td className="p-2 text-right tabular-nums">{m.quantidade}</td>
                              <td className="p-2">{m.deposito ?? '—'}</td>
                              <td className="p-2 font-mono text-[10px]">{m.documento ?? '—'}</td>
                            </tr>
                          ))}
                          {movs.length === 0 && (
                            <tr><td colSpan={5} className="p-4 text-center text-muted-foreground">Sem movimentações.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </Card>
                  </TabsContent>

                  <TabsContent value="lotes">
                    <Card className="overflow-hidden">
                      <table className="w-full text-xs">
                        <thead className="bg-muted"><tr className="text-left">
                          <th className="p-2">Lote</th><th className="p-2 text-right">Qtd</th>
                          <th className="p-2">Depósito</th><th className="p-2">Fabricação</th><th className="p-2">Validade</th>
                        </tr></thead>
                        <tbody>
                          {lotes.map((l: any) => (
                            <tr key={l.id} className="border-t">
                              <td className="p-2 font-mono">{l.lote}</td>
                              <td className="p-2 text-right tabular-nums">{l.quantidade ?? '—'}</td>
                              <td className="p-2">{l.deposito ?? '—'}</td>
                              <td className="p-2">{l.data_fabricacao ? new Date(l.data_fabricacao).toLocaleDateString('pt-BR') : '—'}</td>
                              <td className="p-2">{l.data_validade ? new Date(l.data_validade).toLocaleDateString('pt-BR') : '—'}</td>
                            </tr>
                          ))}
                          {lotes.length === 0 && (
                            <tr><td colSpan={5} className="p-4 text-center text-muted-foreground">Sem lotes.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
