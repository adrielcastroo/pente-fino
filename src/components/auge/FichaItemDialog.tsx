import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, Boxes, ArrowRightLeft, History, MapPin, Loader2, AlertCircle, Layers, Palette, Pencil } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import AcabamentoItemEditDialog from '@/components/acabamentos/AcabamentoItemEditDialog';


interface Props {
  codigo: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Ficha completa do item (Auge + cadastro interno + posições).
 * Junta em um único modal:
 *  - Cabeçalho do produto (com qt disponível / entrada prev. / saída prev.)
 *  - Saldo por depósito (auge_produtos_saldo)
 *  - Kardex unificado (saídas + transferências)
 *  - Vínculos internos (itens_cadastro + estoque_posicoes)
 */
export default function FichaItemDialog({ codigo, open, onOpenChange }: Props) {
  const cod = codigo?.trim() || null;

  const { data: produto, isLoading: loadingProd } = useQuery({
    queryKey: ['ficha-produto', cod],
    enabled: !!cod && open,
    queryFn: async () => {
      const { data } = await supabase
        .from('auge_produtos')
        .select('*')
        .eq('codigo', cod!)
        .maybeSingle();
      return data;
    },
    staleTime: 60_000,
  });

  const { data: saldos = [] } = useQuery({
    queryKey: ['ficha-saldos', cod],
    enabled: !!cod && open,
    queryFn: async () => {
      const { data } = await supabase
        .from('auge_produtos_saldo')
        .select('deposito, quantidade, unidade, synced_at')
        .eq('codigo', cod!)
        .order('deposito');
      return data ?? [];
    },
  });

  const { data: kardex = [] } = useQuery({
    queryKey: ['ficha-kardex', cod],
    enabled: !!cod && open,
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('auge_kardex')
        .select('*')
        .eq('codigo_produto', cod!)
        .order('data_movimento', { ascending: false, nullsFirst: false })
        .limit(60);
      return (data ?? []) as any[];
    },
  });

  const { data: cadastroInterno } = useQuery({
    queryKey: ['ficha-cadastro', cod],
    enabled: !!cod && open,
    queryFn: async () => {
      const { data } = await supabase
        .from('itens_cadastro')
        .select('id, codigo_interno, descricao, codigos_fornecedor, updated_by_name, updated_at')
        .or(`codigo_interno.eq.${cod},codigos_fornecedor_normalizado.cs.{${cod}}`)
        .limit(5);
      return data ?? [];
    },
  });

  const { data: posicoes = [] } = useQuery({
    queryKey: ['ficha-posicoes', cod],
    enabled: !!cod && open,
    queryFn: async () => {
      const { data } = await supabase
        .from('estoque_posicoes')
        .select('endereco, item, quantidade, updated_at')
        .or(`item.ilike.%${cod}%`)
        .limit(30);
      return data ?? [];
    },
  });

  const { data: lotes = [] } = useQuery({
    queryKey: ['ficha-lotes', cod],
    enabled: !!cod && open,
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('auge_lotes')
        .select('lote, deposito, quantidade, data_fabricacao, data_validade, synced_at')
        .eq('codigo_produto', cod!)
        .order('data_fabricacao', { ascending: false, nullsFirst: false })
        .limit(100);
      return (data ?? []) as any[];
    },
  });

  const { data: acabamentos = [], refetch: refetchAcabamentos } = useQuery({
    queryKey: ['ficha-acabamentos', cod],
    enabled: !!cod && open,
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('auge_acabamento_itens')
        .select(`cd_acabamento_item, cd_acabamento, cd_item_acabamento, ds_item_acabamento, ds_item_acabamento_original, ds_item_acabamento_reduzida,
                 cd_kit_complementar_1, nm_kit_complementar_1,
                 cd_kit_complementar_2, nm_kit_complementar_2,
                 cd_kit_complementar_3, nm_kit_complementar_3,
                 cd_kit_complementar_4, nm_kit_complementar_4,
                 cd_kit_complementar_5, nm_kit_complementar_5,
                 auge_acabamentos ( cd_acabamento, chave_acabamento, nm_acabamento, nm_classe1, nm_combinacao1, id_cancelado )`)
        .eq('cd_item_acabamento', cod!)
        .limit(50);
      return (data ?? []) as any[];
    },
  });

  const [editingAcab, setEditingAcab] = useState<any | null>(null);

  const totalSaldo = useMemo(
    () => saldos.reduce((acc: number, s: any) => acc + Number(s.quantidade ?? 0), 0),
    [saldos],
  );


  const disponivel = Number(produto?.qt_disponivel ?? 0);
  const entradaPrev = Number(produto?.qt_entrada_prevista ?? 0);
  const saidaPrev = Number(produto?.qt_saida_prevista ?? 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Package className="h-5 w-5 text-primary" />
            Ficha do Item
            {cod && <span className="font-mono text-primary">{cod}</span>}
          </DialogTitle>
        </DialogHeader>

        {!cod ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Nenhum código informado.</div>
        ) : loadingProd ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : !produto ? (
          <div className="p-6 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
            <AlertCircle className="h-6 w-6 text-warning" />
            Item <span className="font-mono">{cod}</span> não encontrado no espelho do Auge.
          </div>
        ) : (
          <div className="space-y-3 overflow-auto pr-1">
            {/* Cabeçalho */}
            <Card className="p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="font-mono text-xs text-muted-foreground">{produto.codigo}</div>
                  <div className="font-semibold text-sm">{produto.descricao ?? '—'}</div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {produto.unidade && <Badge variant="outline" className="text-[10px]">Un: {produto.unidade}</Badge>}
                    {produto.ncm && <Badge variant="outline" className="text-[10px]">NCM: {produto.ncm}</Badge>}
                    {produto.categoria && <Badge variant="outline" className="text-[10px]">{produto.categoria}</Badge>}
                    {produto.ativo === false && <Badge variant="destructive" className="text-[10px]">inativo</Badge>}
                    <Badge variant="secondary" className="text-[10px]">
                      Sync {formatDistanceToNow(new Date(produto.synced_at), { addSuffix: true, locale: ptBR })}
                    </Badge>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 shrink-0 text-right">
                  <Kpi label="Saldo total" value={totalSaldo || Number(produto.qt_estoque ?? 0)} />
                  <Kpi label="Disponível" value={disponivel} tone="primary" />
                  <Kpi label="Entrada prev." value={entradaPrev} tone="emerald" />
                  <Kpi label="Saída prev." value={saidaPrev} tone="amber" />
                </div>
              </div>
            </Card>

            <Tabs defaultValue="depositos">
              <TabsList className="w-full grid grid-cols-6">
                <TabsTrigger value="depositos" className="gap-1.5">
                  <Boxes className="h-3.5 w-3.5" /> Depósitos ({saldos.length})
                </TabsTrigger>
                <TabsTrigger value="lotes" className="gap-1.5">
                  <Layers className="h-3.5 w-3.5" /> Lotes ({lotes.length})
                </TabsTrigger>
                <TabsTrigger value="kardex" className="gap-1.5">
                  <History className="h-3.5 w-3.5" /> Kardex ({kardex.length})
                </TabsTrigger>
                <TabsTrigger value="cadastro" className="gap-1.5">
                  <Package className="h-3.5 w-3.5" /> Cadastro ({cadastroInterno?.length ?? 0})
                </TabsTrigger>
                <TabsTrigger value="acabamentos" className="gap-1.5">
                  <Palette className="h-3.5 w-3.5" /> Acabamentos ({acabamentos.length})
                </TabsTrigger>
                <TabsTrigger value="posicoes" className="gap-1.5">
                  <MapPin className="h-3.5 w-3.5" /> Posições ({posicoes.length})
                </TabsTrigger>
              </TabsList>


              {/* Saldo por depósito */}
              <TabsContent value="depositos" className="mt-2">
                <Card className="overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-muted"><tr className="text-left">
                      <th className="p-2">Depósito</th>
                      <th className="p-2 text-right">Quantidade</th>
                      <th className="p-2">Un</th>
                    </tr></thead>
                    <tbody>
                      {saldos.map((s: any, i: number) => (
                        <tr key={i} className="border-t">
                          <td className="p-2"><Badge variant="outline">{s.deposito}</Badge></td>
                          <td className="p-2 text-right tabular-nums font-semibold">
                            {Number(s.quantidade ?? 0).toLocaleString('pt-BR')}
                          </td>
                          <td className="p-2 text-muted-foreground">{s.unidade ?? '—'}</td>
                        </tr>
                      ))}
                      {saldos.length === 0 && (
                        <tr>
                          <td colSpan={3} className="p-4 text-center text-muted-foreground text-[11px]">
                            Auge retorna somente saldo agregado (endpoint por depósito ainda não mapeado — envie o HAR da tela "Estoque por depósito").
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </Card>
              </TabsContent>

              {/* Lotes / Séries */}
              <TabsContent value="lotes" className="mt-2">
                <Card className="overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-muted"><tr className="text-left">
                      <th className="p-2">Lote / Série</th>
                      <th className="p-2">Depósito</th>
                      <th className="p-2 text-right">Qtd</th>
                      <th className="p-2">Fabricação</th>
                      <th className="p-2">Validade</th>
                    </tr></thead>
                    <tbody>
                      {lotes.map((l: any, i: number) => (
                        <tr key={i} className="border-t">
                          <td className="p-2 font-mono text-[11px] font-semibold text-primary">{l.lote ?? '—'}</td>
                          <td className="p-2"><Badge variant="outline" className="text-[10px]">{l.deposito ?? '—'}</Badge></td>
                          <td className="p-2 text-right tabular-nums">{Number(l.quantidade ?? 0).toLocaleString('pt-BR')}</td>
                          <td className="p-2 text-[10px] text-muted-foreground">
                            {l.data_fabricacao ? new Date(l.data_fabricacao).toLocaleDateString('pt-BR') : '—'}
                          </td>
                          <td className="p-2 text-[10px] text-muted-foreground">
                            {l.data_validade ? new Date(l.data_validade).toLocaleDateString('pt-BR') : '—'}
                          </td>
                        </tr>
                      ))}
                      {lotes.length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-4 text-center text-muted-foreground text-[11px]">
                            Nenhum lote/série no Auge para este item. Sincronize lotes na aba admin caso o item seja controlado por lote.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </Card>
              </TabsContent>



              {/* Kardex */}
              <TabsContent value="kardex" className="mt-2">
                <Card className="overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-muted"><tr className="text-left">
                      <th className="p-2">Data</th>
                      <th className="p-2">Operação</th>
                      <th className="p-2">Origem → Destino</th>
                      <th className="p-2 text-right">Qtd</th>
                      <th className="p-2">Doc</th>
                      <th className="p-2">Situação</th>
                    </tr></thead>
                    <tbody>
                      {kardex.map((k: any) => (
                        <tr key={`${k.origem}-${k.ref_id}`} className="border-t">
                          <td className="p-2 whitespace-nowrap">
                            {k.data_movimento ? new Date(k.data_movimento).toLocaleString('pt-BR', {
                              day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit',
                            }) : '—'}
                          </td>
                          <td className="p-2">
                            <Badge
                              variant={k.origem === 'transferencia' ? 'default' : 'outline'}
                              className="text-[10px]"
                            >
                              {k.operacao ?? '—'}
                            </Badge>
                          </td>
                          <td className="p-2 font-mono text-[10px]">
                            {k.deposito_origem ?? '—'}
                            {k.deposito_destino ? ` → ${k.deposito_destino}` : ''}
                          </td>
                          <td className="p-2 text-right tabular-nums">
                            {Number(k.quantidade ?? 0).toLocaleString('pt-BR')}
                          </td>
                          <td className="p-2 font-mono text-[10px]">{k.documento ?? '—'}</td>
                          <td className="p-2 text-[10px] text-muted-foreground">
                            {k.ds_situacao ?? '—'}
                          </td>
                        </tr>
                      ))}
                      {kardex.length === 0 && (
                        <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">Sem movimentações nos últimos 60 dias.</td></tr>
                      )}
                    </tbody>
                  </table>
                </Card>
              </TabsContent>

              {/* Cadastro interno */}
              <TabsContent value="cadastro" className="mt-2">
                <Card className="overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-muted"><tr className="text-left">
                      <th className="p-2">Código interno</th>
                      <th className="p-2">Descrição</th>
                      <th className="p-2">Cód. Fornecedor</th>
                      <th className="p-2">Última edição</th>
                    </tr></thead>
                    <tbody>
                      {(cadastroInterno ?? []).map((c: any) => (
                        <tr key={c.id} className="border-t">
                          <td className="p-2 font-mono">{c.codigo_interno}</td>
                          <td className="p-2">{c.descricao ?? '—'}</td>
                          <td className="p-2 font-mono text-[10px]">
                            {Array.isArray(c.codigos_fornecedor) ? c.codigos_fornecedor.join(', ') : '—'}
                          </td>
                          <td className="p-2 text-[10px] text-muted-foreground">
                            {c.updated_by_name ?? '—'}
                            {c.updated_at && ` · ${formatDistanceToNow(new Date(c.updated_at), { addSuffix: true, locale: ptBR })}`}
                          </td>
                        </tr>
                      ))}
                      {(!cadastroInterno || cadastroInterno.length === 0) && (
                        <tr><td colSpan={4} className="p-4 text-center text-muted-foreground">Sem vínculo em itens_cadastro.</td></tr>
                      )}
                    </tbody>
                  </table>
                </Card>
              </TabsContent>

              {/* Acabamentos que contêm este item */}
              <TabsContent value="acabamentos" className="mt-2">
                <Card className="overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-muted"><tr className="text-left">
                      <th className="p-2">Acabamento</th>
                      <th className="p-2">Classe / Combinação</th>
                      <th className="p-2">Descrição</th>
                      <th className="p-2">Kits</th>
                      <th className="p-2 w-24 text-right">Ações</th>
                    </tr></thead>
                    <tbody>
                      {acabamentos.map((a: any) => {
                        const kits = [1, 2, 3, 4, 5]
                          .map((n) => a[`nm_kit_complementar_${n}`])
                          .filter(Boolean);
                        const ac = a.auge_acabamentos ?? {};
                        return (
                          <tr key={a.cd_acabamento_item} className="border-t align-top">
                            <td className="p-2">
                              <div className="font-medium">{ac.nm_acabamento ?? a.cd_acabamento}</div>
                              <div className="font-mono text-[10px] text-muted-foreground">{ac?.chave_acabamento ?? `#${a.cd_acabamento}`}</div>
                              {ac.id_cancelado === 'S' && <Badge variant="destructive" className="text-[9px] mt-1">Cancelado</Badge>}
                            </td>
                            <td className="p-2 text-[11px]">
                              {ac.nm_classe1 && <div>{ac.nm_classe1}</div>}
                              {ac.nm_combinacao1 && <div className="text-muted-foreground">{ac.nm_combinacao1}</div>}
                            </td>
                            <td className="p-2 text-[11px]">
                              <div>{a.ds_item_acabamento_original ?? a.ds_item_acabamento ?? '—'}</div>
                              {a.ds_item_acabamento && a.ds_item_acabamento_original && a.ds_item_acabamento !== a.ds_item_acabamento_original && (
                                <div className="text-muted-foreground text-[10px]">↳ {a.ds_item_acabamento}</div>
                              )}
                            </td>
                            <td className="p-2 text-[10px] text-muted-foreground">
                              {kits.length ? kits.join(', ') : '—'}
                            </td>
                            <td className="p-2 text-right">
                              <Button size="sm" variant="outline" className="h-7 gap-1 text-[11px]" onClick={() => setEditingAcab(a)}>
                                <Pencil className="h-3 w-3" /> Editar
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                      {acabamentos.length === 0 && (
                        <tr><td colSpan={5} className="p-4 text-center text-muted-foreground">Este item não está em nenhum acabamento sincronizado. Rode a sincronização em /estoque/acabamentos.</td></tr>
                      )}
                    </tbody>
                  </table>
                </Card>
              </TabsContent>

              <TabsContent value="posicoes" className="mt-2">
                <Card className="overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-muted"><tr className="text-left">
                      <th className="p-2">Endereço</th>
                      <th className="p-2">Item conferido</th>
                      <th className="p-2 text-right">Qtd</th>
                      <th className="p-2">Última atualização</th>
                    </tr></thead>
                    <tbody>
                      {posicoes.map((p: any, i: number) => (
                        <tr key={i} className="border-t">
                          <td className="p-2 font-mono">{p.endereco ?? '—'}</td>
                          <td className="p-2">{p.item ?? '—'}</td>
                          <td className="p-2 text-right tabular-nums">
                            {p.quantidade != null ? Number(p.quantidade).toLocaleString('pt-BR') : '—'}
                          </td>
                          <td className="p-2 text-[10px] text-muted-foreground">
                            {p.updated_at ? formatDistanceToNow(new Date(p.updated_at), { addSuffix: true, locale: ptBR }) : '—'}
                          </td>
                        </tr>
                      ))}
                      {posicoes.length === 0 && (
                        <tr><td colSpan={4} className="p-4 text-center text-muted-foreground">Sem posições registradas no Pente Fino.</td></tr>
                      )}
                    </tbody>
                  </table>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </DialogContent>
      <AcabamentoItemEditDialog
        item={editingAcab}
        open={!!editingAcab}
        onOpenChange={(o) => { if (!o) setEditingAcab(null); }}
        onSaved={() => refetchAcabamentos()}
      />
    </Dialog>
  );
}

function Kpi({ label, value, tone }: { label: string; value: number; tone?: 'primary' | 'emerald' | 'amber' }) {
  const cls =
    tone === 'primary' ? 'text-primary' :
    tone === 'emerald' ? 'text-success' :
    tone === 'amber' ? 'text-warning' :
    'text-foreground';
  return (
    <div className="text-right">
      <div className="text-[9px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`font-bold tabular-nums text-sm ${cls}`}>
        {Number(value ?? 0).toLocaleString('pt-BR')}
      </div>
    </div>
  );
}
