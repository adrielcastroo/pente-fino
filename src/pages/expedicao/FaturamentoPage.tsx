import { useMemo, useState } from 'react';
import { DollarSign, Loader2, Link2, Check, FileText, Truck } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PageShell, PageHeader, StatCard } from '@/components/expedicao/ui';
import { StatusBadge } from '@/components/ui/status-badge';

type NFe = { id: string; numero: string; serie: string | null; nome_destinatario: string | null; valor_total: number | null; data_emissao: string | null };
type Romaneio = {
  id: string;
  numero: string;
  status: string;
  created_at: string;
  faturado_at: string | null;
  transportadora_id: string | null;
  transportadora_nome?: string;
  total_pecas: number;
  carrinho_ids: string[];
  nfe_ids: string[];
};

export default function FaturamentoPage() {
  const qc = useQueryClient();
  const [selectedNfe, setSelectedNfe] = useState<Record<string, string>>({});

  const { data: romaneios = [], isLoading } = useQuery({
    queryKey: ['expedicao_faturamento_romaneios'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expedicao_romaneios')
        .select('id, numero, status, created_at, faturado_at, transportadora_id')
        .in('status', ['aberto', 'faturado'])
        .order('created_at', { ascending: false })
        .limit(30);
      if (error) throw error;
      if (!data?.length) return [] as Romaneio[];

      const ids = data.map(r => r.id);
      const [{ data: pecas }, { data: transps }, { data: vincs }] = await Promise.all([
        supabase.from('expedicao_pecas').select('romaneio_id, carrinho_id').in('romaneio_id', ids),
        supabase.from('expedicao_transportadoras').select('id, nome'),
        supabase.from('expedicao_romaneio_nfe').select('romaneio_id, nfe_id').in('romaneio_id', ids),
      ]);
      const tMap = new Map((transps ?? []).map(t => [t.id, t.nome]));
      const pMap = new Map<string, { count: number; carts: Set<string> }>();
      (pecas ?? []).forEach(p => {
        const key = p.romaneio_id!;
        const cur = pMap.get(key) ?? { count: 0, carts: new Set<string>() };
        cur.count++;
        if (p.carrinho_id) cur.carts.add(p.carrinho_id);
        pMap.set(key, cur);
      });
      const nfeMap = new Map<string, string[]>();
      (vincs ?? []).forEach(v => {
        const arr = nfeMap.get(v.romaneio_id) ?? [];
        arr.push(v.nfe_id);
        nfeMap.set(v.romaneio_id, arr);
      });

      return data.map(r => ({
        ...r,
        transportadora_nome: r.transportadora_id ? tMap.get(r.transportadora_id) : undefined,
        total_pecas: pMap.get(r.id)?.count ?? 0,
        carrinho_ids: Array.from(pMap.get(r.id)?.carts ?? []),
        nfe_ids: nfeMap.get(r.id) ?? [],
      })) as Romaneio[];
    },
    refetchInterval: 15000,
  });

  const { data: nfeDisponiveis = [] } = useQuery({
    queryKey: ['expedicao_nfe_disponiveis'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nfe_importadas')
        .select('id, numero, serie, nome_destinatario, valor_total, data_emissao')
        .order('data_emissao', { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as NFe[];
    },
  });

  const nfeMap = useMemo(() => new Map(nfeDisponiveis.map(n => [n.id, n])), [nfeDisponiveis]);

  const abertos = useMemo(() => romaneios.filter(r => r.status === 'aberto'), [romaneios]);
  const faturados = useMemo(() => romaneios.filter(r => r.status === 'faturado'), [romaneios]);
  const valorEmFila = useMemo(() => {
    return abertos.reduce((s, r) => {
      return s + r.nfe_ids.reduce((ss, id) => ss + (nfeMap.get(id)?.valor_total ?? 0), 0);
    }, 0);
  }, [abertos, nfeMap]);

  const vincular = useMutation({
    mutationFn: async ({ romaneioId, nfeId }: { romaneioId: string; nfeId: string }) => {
      const { data: user } = await supabase.auth.getUser();
      const { error } = await supabase.from('expedicao_romaneio_nfe').insert({
        romaneio_id: romaneioId,
        nfe_id: nfeId,
        vinculada_por: user.user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: (_data, vars) => {
      toast.success('NF vinculada ao romaneio.');
      setSelectedNfe(prev => ({ ...prev, [vars.romaneioId]: '' }));
      qc.invalidateQueries({ queryKey: ['expedicao_faturamento_romaneios'] });
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : 'Erro ao vincular NF.'),
  });

  const faturar = useMutation({
    mutationFn: async (romaneio: Romaneio) => {
      if (romaneio.nfe_ids.length === 0) throw new Error('Vincule ao menos uma NF antes de faturar.');
      const now = new Date().toISOString();

      const { error: rErr } = await supabase
        .from('expedicao_romaneios')
        .update({ status: 'faturado', faturado_at: now })
        .eq('id', romaneio.id);
      if (rErr) throw rErr;

      const { error: pErr } = await supabase
        .from('expedicao_pecas')
        .update({ status: 'faturada', faturada_at: now })
        .eq('romaneio_id', romaneio.id);
      if (pErr) throw pErr;

      if (romaneio.carrinho_ids.length > 0) {
        const { error: cErr } = await supabase
          .from('expedicao_carrinhos')
          .update({ status: 'livre' })
          .in('id', romaneio.carrinho_ids);
        if (cErr) throw cErr;
      }
    },
    onSuccess: (_d, r) => {
      toast.success(`Romaneio ${r.numero} faturado.`);
      qc.invalidateQueries({ queryKey: ['expedicao_faturamento_romaneios'] });
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : 'Erro ao faturar.'),
  });

  return (
    <PageShell>
      <PageHeader
        title="Faturamento"
        subtitle="Vincule notas fiscais aos romaneios abertos e finalize a expedição."
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard label="Romaneios abertos" value={abertos.length} icon={FileText} />
        <StatCard label="Valor em fila" value={valorEmFila.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} icon={DollarSign} />
        <StatCard label="Faturados (recentes)" value={faturados.length} icon={Check} />
      </div>

      <section className="bg-card border border-border rounded-md">
        <header className="px-4 py-3 border-b border-border">
          <h2 className="text-sm font-medium">Romaneios abertos</h2>
        </header>
        {isLoading ? (
          <div className="p-8 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : abertos.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">Nenhum romaneio aberto no momento.</p>
        ) : (
          <ul className="divide-y divide-border">
            {abertos.map(r => {
              const availableNfe = nfeDisponiveis.filter(n => !r.nfe_ids.includes(n.id));
              const totalRom = r.nfe_ids.reduce((s, id) => s + (nfeMap.get(id)?.valor_total ?? 0), 0);
              return (
                <li key={r.id} className="p-4 space-y-3">
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <span className="font-mono font-medium">{r.numero}</span>
                    <StatusBadge tone="info" label="aberto" />
                    <span className="text-muted-foreground">{r.total_pecas} peça(s)</span>
                    {r.transportadora_nome && (
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Truck className="w-3 h-3" /> {r.transportadora_nome}
                      </span>
                    )}
                    <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                      {new Date(r.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {r.nfe_ids.length > 0 && (
                    <ul className="text-xs bg-muted/40 rounded p-2 space-y-1">
                      {r.nfe_ids.map(id => {
                        const n = nfeMap.get(id);
                        return (
                          <li key={id} className="flex items-center gap-2">
                            <Link2 className="w-3 h-3 text-muted-foreground" />
                            <span className="font-mono">NF {n?.numero ?? id.slice(0, 8)}</span>
                            <span className="text-muted-foreground truncate">{n?.nome_destinatario}</span>
                            <span className="ml-auto tabular-nums">
                              {(n?.valor_total ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </span>
                          </li>
                        );
                      })}
                      <li className="flex items-center gap-2 pt-1 border-t border-border/60 font-medium">
                        <span className="ml-auto tabular-nums">
                          Total: {totalRom.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                      </li>
                    </ul>
                  )}

                  <div className="flex flex-wrap items-center gap-2">
                    <Select
                      value={selectedNfe[r.id] ?? ''}
                      onValueChange={(v) => setSelectedNfe(prev => ({ ...prev, [r.id]: v }))}
                    >
                      <SelectTrigger className="h-9 w-72"><SelectValue placeholder="Selecionar NF importada" /></SelectTrigger>
                      <SelectContent>
                        {availableNfe.length === 0 ? (
                          <div className="px-2 py-1.5 text-xs text-muted-foreground">Nenhuma NF disponível.</div>
                        ) : availableNfe.map(n => (
                          <SelectItem key={n.id} value={n.id}>
                            NF {n.numero} · {n.nome_destinatario ?? '—'} · {(n.valor_total ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!selectedNfe[r.id] || vincular.isPending}
                      onClick={() => vincular.mutate({ romaneioId: r.id, nfeId: selectedNfe[r.id] })}
                      className="gap-1.5"
                    >
                      <Link2 className="w-4 h-4" /> Vincular
                    </Button>
                    <Button
                      size="sm"
                      disabled={r.nfe_ids.length === 0 || faturar.isPending}
                      onClick={() => faturar.mutate(r)}
                      className="gap-1.5 ml-auto bg-success text-success-foreground hover:bg-success/90"
                    >
                      {faturar.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      Faturar
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="bg-card border border-border rounded-md">
        <header className="px-4 py-3 border-b border-border">
          <h2 className="text-sm font-medium">Faturados recentes</h2>
        </header>
        {faturados.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">Ainda não há romaneios faturados.</p>
        ) : (
          <ul className="divide-y divide-border">
            {faturados.map(r => (
              <li key={r.id} className="px-4 py-3 flex flex-wrap items-center gap-3 text-sm">
                <span className="font-mono font-medium">{r.numero}</span>
                <StatusBadge tone="success" label="faturado" />
                <span className="text-muted-foreground">{r.total_pecas} peça(s)</span>
                <span className="text-muted-foreground">{r.nfe_ids.length} NF(s)</span>
                {r.faturado_at && (
                  <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                    {new Date(r.faturado_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </PageShell>
  );
}
