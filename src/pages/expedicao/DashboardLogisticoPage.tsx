import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { Truck, FileText, Package } from 'lucide-react';

interface Romaneio {
  id: string;
  numero: string;
  status: 'aberto' | 'faturado' | 'cancelado';
  created_at: string;
  faturado_at: string | null;
  transportadora_id: string | null;
  transportadora?: { nome: string } | null;
}

function topN<T extends { nome: string; total: number }>(arr: T[], n = 10) {
  return [...arr].sort((a, b) => b.total - a.total).slice(0, n);
}

function useRomaneios() {
  return useQuery({
    queryKey: ['expedicao_romaneios_dashboard'],
    queryFn: async (): Promise<Romaneio[]> => {
      const { data, error } = await supabase
        .from('expedicao_romaneios')
        .select('id, numero, status, created_at, faturado_at, transportadora_id, transportadora:expedicao_transportadoras(nome)')
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as unknown as Romaneio[];
    },
    staleTime: 15_000,
  });
}

function usePecasPorTransportadora() {
  return useQuery({
    queryKey: ['expedicao_pecas_por_transportadora'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expedicao_pecas')
        .select('id, status, romaneio_id, romaneio:expedicao_romaneios(transportadora_id, transportadora:expedicao_transportadoras(nome))')
        .in('status', ['no_romaneio', 'faturada'])
        .limit(5000);
      if (error) throw error;
      return (data ?? []) as any[];
    },
    staleTime: 30_000,
  });
}

export default function ExpedicaoDashboardLogisticoPage() {
  const { data: romaneios = [], isLoading } = useRomaneios();
  const { data: pecas = [] } = usePecasPorTransportadora();

  const stats = useMemo(() => {
    const porTransp = new Map<string, number>();
    for (const r of romaneios) {
      const nome = r.transportadora?.nome?.trim() || '(sem transportadora)';
      porTransp.set(nome, (porTransp.get(nome) ?? 0) + 1);
    }

    const pecasPorTransp = new Map<string, number>();
    for (const p of pecas) {
      const nome = p.romaneio?.transportadora?.nome?.trim() || '(sem transportadora)';
      pecasPorTransp.set(nome, (pecasPorTransp.get(nome) ?? 0) + 1);
    }

    const abertos = romaneios.filter((r) => r.status === 'aberto').length;
    const faturados = romaneios.filter((r) => r.status === 'faturado').length;

    return {
      abertos,
      faturados,
      total: romaneios.length,
      totalPecas: pecas.length,
      transportadoras: topN(
        Array.from(porTransp, ([nome, total]) => ({ nome, total }))
      ),
      pecasTransp: topN(
        Array.from(pecasPorTransp, ([nome, total]) => ({ nome, total }))
      ),
    };
  }, [romaneios, pecas]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard Logístico</h1>
        <p className="text-sm text-muted-foreground">
          Volumes de romaneios e peças por transportadora.
        </p>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard icon={FileText} label="Romaneios abertos" value={stats.abertos} />
        <KpiCard icon={Truck} label="Romaneios faturados" value={stats.faturados} />
        <KpiCard icon={FileText} label="Total romaneios" value={stats.total} />
        <KpiCard icon={Package} label="Peças em rota/faturadas" value={stats.totalPecas} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard
          title="Romaneios por transportadora"
          icon={Truck}
          data={stats.transportadoras}
          color="#0ea5e9"
          loading={isLoading}
        />
        <ChartCard
          title="Peças por transportadora"
          icon={Package}
          data={stats.pecasTransp}
          color="#10b981"
          loading={isLoading}
        />
      </div>
    </div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{label}</span>
          <Icon className="w-4 h-4 text-muted-foreground" />
        </div>
        <p className="text-2xl font-semibold tabular-nums mt-2">{value}</p>
      </CardContent>
    </Card>
  );
}

function ChartCard({
  title,
  icon: Icon,
  data,
  color,
  loading,
  height = 320,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  data: { nome: string; total: number }[];
  color: string;
  loading: boolean;
  height?: number;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Icon className="w-4 h-4 text-muted-foreground" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent style={{ height }}>
        {loading ? (
          <div className="w-full h-full animate-pulse bg-muted rounded" />
        ) : data.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem dados.</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
              <YAxis
                type="category"
                dataKey="nome"
                tick={{ fontSize: 11 }}
                width={180}
                interval={0}
              />
              <Tooltip />
              <Bar dataKey="total" fill={color} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
