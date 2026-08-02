import { useMemo, useState, useEffect } from 'react';
import { FileText, Loader2, Printer, Truck, Check } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PageShell, PageHeader, StatCard } from '@/components/expedicao/ui';
import { StatusBadge } from '@/components/ui/status-badge';
import { ExportRomaneioButton } from '@/components/expedicao/ExportRomaneioButton';

type Carrinho = { id: string; codigo: string; transportadora_id: string | null; conferido_at: string | null };
type Transportadora = { id: string; nome: string };
type Peca = { id: string; codigo_etiqueta: string; carrinho_id: string; carrinho_codigo?: string };
type Romaneio = {
  id: string;
  numero: string;
  status: string;
  created_at: string;
  transportadora_id: string | null;
  transportadora_nome?: string;
  total_pecas: number;
};

function gerarNumeroRomaneio(): string {
  const d = new Date();
  const ymd = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const rand = String(Math.floor(Math.random() * 9000) + 1000);
  return `ROM-${ymd}-${rand}`;
}

export default function RomaneioPage() {
  const qc = useQueryClient();
  const [selectedCarts, setSelectedCarts] = useState<Set<string>>(new Set());
  const [transportadoraId, setTransportadoraId] = useState<string>('');

  // Carrinhos prontos (em_uso, ainda sem romaneio) – detectados via pecas.romaneio_id null
  const { data: carrinhos = [], isLoading: loadingCarts } = useQuery({
    queryKey: ['expedicao_romaneio_carrinhos_prontos'],
    queryFn: async () => {
      const { data: carts, error } = await supabase
        .from('expedicao_carrinhos')
        .select('id, codigo, transportadora_id, conferido_at, status')
        .eq('status', 'em_uso')
        .order('conferido_at', { ascending: true, nullsFirst: false });
      if (error) throw error;
      if (!carts?.length) return [] as (Carrinho & { pecas_count: number })[];

      const { data: pecas } = await supabase
        .from('expedicao_pecas')
        .select('carrinho_id, romaneio_id, status')
        .in('carrinho_id', carts.map(c => c.id))
        .in('status', ['conferida']);

      const grouped = new Map<string, number>();
      (pecas ?? []).forEach(p => {
        if (p.romaneio_id) return;
        grouped.set(p.carrinho_id!, (grouped.get(p.carrinho_id!) ?? 0) + 1);
      });
      return carts
        .filter(c => (grouped.get(c.id) ?? 0) > 0)
        .map(c => ({ ...c, pecas_count: grouped.get(c.id) ?? 0 }));
    },
    refetchInterval: 15000,
  });

  const { data: transportadoras = [] } = useQuery({
    queryKey: ['expedicao_transportadoras'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expedicao_transportadoras')
        .select('id, nome')
        .order('nome');
      if (error) throw error;
      return data as Transportadora[];
    },
  });

  const { data: romaneiosAbertos = [], isLoading: loadingRom } = useQuery({
    queryKey: ['expedicao_romaneios_abertos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expedicao_romaneios')
        .select('id, numero, status, created_at, transportadora_id')
        .eq('status', 'aberto')
        .order('created_at', { ascending: false });
      if (error) throw error;
      if (!data?.length) return [] as Romaneio[];

      const [{ data: pecas }, { data: transps }] = await Promise.all([
        supabase.from('expedicao_pecas').select('romaneio_id').in('romaneio_id', data.map(r => r.id)),
        supabase.from('expedicao_transportadoras').select('id, nome'),
      ]);
      const tMap = new Map((transps ?? []).map(t => [t.id, t.nome]));
      const counts = new Map<string, number>();
      (pecas ?? []).forEach(p => counts.set(p.romaneio_id!, (counts.get(p.romaneio_id!) ?? 0) + 1));

      return data.map(r => ({
        ...r,
        transportadora_nome: r.transportadora_id ? tMap.get(r.transportadora_id) : undefined,
        total_pecas: counts.get(r.id) ?? 0,
      })) as Romaneio[];
    },
    refetchInterval: 15000,
  });

  // Sync transportadora sugerida quando seleciona um carrinho
  useEffect(() => {
    if (transportadoraId) return;
    const first = carrinhos.find(c => selectedCarts.has(c.id) && c.transportadora_id);
    if (first?.transportadora_id) setTransportadoraId(first.transportadora_id);
  }, [selectedCarts, carrinhos, transportadoraId]);

  const toggleCart = (id: string) => {
    setSelectedCarts(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const totalPecasSelecionadas = useMemo(
    () => carrinhos.filter(c => selectedCarts.has(c.id)).reduce((s, c) => s + c.pecas_count, 0),
    [carrinhos, selectedCarts]
  );

  const gerar = useMutation({
    mutationFn: async () => {
      if (selectedCarts.size === 0) throw new Error('Selecione ao menos um carrinho.');
      const cartIds = Array.from(selectedCarts);
      const { data: user } = await supabase.auth.getUser();

      const { data: romaneio, error: rErr } = await supabase
        .from('expedicao_romaneios')
        .insert({
          numero: gerarNumeroRomaneio(),
          transportadora_id: transportadoraId || null,
          status: 'aberto',
          created_by: user.user?.id ?? null,
        })
        .select('id, numero')
        .single();
      if (rErr) throw rErr;

      const { error: pErr } = await supabase
        .from('expedicao_pecas')
        .update({ romaneio_id: romaneio.id, status: 'no_romaneio' })
        .in('carrinho_id', cartIds)
        .is('romaneio_id', null)
        .eq('status', 'conferida');
      if (pErr) throw pErr;

      return romaneio;
    },
    onSuccess: (rom) => {
      toast.success(`Romaneio ${rom.numero} gerado.`);
      setSelectedCarts(new Set());
      setTransportadoraId('');
      qc.invalidateQueries({ queryKey: ['expedicao_romaneio_carrinhos_prontos'] });
      qc.invalidateQueries({ queryKey: ['expedicao_romaneios_abertos'] });
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : 'Erro ao gerar romaneio.'),
  });

  return (
    <PageShell>
      <PageHeader
        title="Romaneio"
        subtitle="Agrupe carrinhos conferidos e emita romaneios de expedição."
        actions={
          <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-1.5">
            <Printer className="w-4 h-4" /> Imprimir
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard label="Carrinhos prontos" value={carrinhos.length} icon={Truck} />
        <StatCard label="Peças selecionadas" value={totalPecasSelecionadas} />
        <StatCard label="Romaneios abertos" value={romaneiosAbertos.length} />
      </div>

      <section className="bg-card border border-border rounded-md">
        <header className="px-4 py-3 border-b border-border flex flex-wrap items-center gap-3">
          <h2 className="text-sm font-medium">Carrinhos prontos para romaneio</h2>
          <div className="ml-auto flex items-center gap-2">
            <Select value={transportadoraId} onValueChange={setTransportadoraId}>
              <SelectTrigger className="h-9 w-56"><SelectValue placeholder="Transportadora (opcional)" /></SelectTrigger>
              <SelectContent>
                {transportadoras.map(t => (
                  <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              disabled={selectedCarts.size === 0 || gerar.isPending}
              onClick={() => gerar.mutate()}
              className="gap-1.5"
            >
              {gerar.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Gerar romaneio ({selectedCarts.size})
            </Button>
          </div>
        </header>
        {loadingCarts ? (
          <div className="p-8 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : carrinhos.length === 0 ? (
          <EmptyState
            icon={Truck}
            title="Nenhum carrinho aguardando romaneio"
            description="Finalize a conferência de um carrinho na Double Check para que ele apareça aqui."
          />
        ) : (
          <ul className="divide-y divide-border">
            {carrinhos.map(c => (
              <li key={c.id} className="px-4 py-3 flex items-center gap-3 text-sm">
                <Checkbox checked={selectedCarts.has(c.id)} onCheckedChange={() => toggleCart(c.id)} />
                <span className="font-mono font-medium">{c.codigo}</span>
                <span className="text-muted-foreground">{c.pecas_count} peça(s)</span>
                {c.conferido_at && (
                  <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                    conferido {new Date(c.conferido_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="bg-card border border-border rounded-md">
        <header className="px-4 py-3 border-b border-border">
          <h2 className="text-sm font-medium">Romaneios abertos (aguardando faturamento)</h2>
        </header>
        {loadingRom ? (
          <div className="p-8 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : romaneiosAbertos.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Nenhum romaneio aberto"
            description="Os romaneios gerados ficam listados aqui até serem faturados."
          />

        ) : (
          <ul className="divide-y divide-border">
            {romaneiosAbertos.map(r => (
              <li key={r.id} className="px-4 py-3 flex flex-col md:flex-row md:flex-wrap md:items-center gap-2 md:gap-3 text-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-mono font-medium truncate">{r.numero}</span>
                  <StatusBadge tone="info" label={r.status} />
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs md:text-sm text-muted-foreground">
                  <span>{r.total_pecas} peça(s)</span>
                  {r.transportadora_nome && (
                    <span className="flex items-center gap-1">
                      <Truck className="w-3 h-3" /> {r.transportadora_nome}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2 md:ml-auto">
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {new Date(r.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <ExportRomaneioButton romaneioId={r.id} numero={r.numero} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </PageShell>
  );
}
