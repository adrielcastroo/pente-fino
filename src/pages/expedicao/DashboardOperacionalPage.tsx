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
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { Clock, Tag, PackageCheck, ClipboardCheck, Truck } from 'lucide-react';

type PecaStatus = 'etiquetada' | 'alocada' | 'conferida' | 'no_romaneio' | 'faturada' | 'cancelada';

interface Peca {
  id: string;
  status: PecaStatus;
  etiquetada_at: string | null;
  alocada_at: string | null;
  conferida_at: string | null;
  faturada_at: string | null;
  created_at: string;
}

const STATUS_LABEL: Record<PecaStatus, string> = {
  etiquetada: 'Etiquetadas',
  alocada: 'Alocadas',
  conferida: 'Conferidas',
  no_romaneio: 'Em romaneio',
  faturada: 'Faturadas',
  cancelada: 'Canceladas',
};

const STATUS_COLOR: Record<PecaStatus, string> = {
  etiquetada: '#94a3b8',
  alocada: '#0ea5e9',
  conferida: '#10b981',
  no_romaneio: '#f59e0b',
  faturada: '#6366f1',
  cancelada: '#ef4444',
};

function fmtMin(ms: number) {
  if (!isFinite(ms) || ms <= 0) return '—';
  const min = Math.round(ms / 60000);
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}h ${m}m`;
}

function usePecas() {
  return useQuery({
    queryKey: ['expedicao_pecas_dashboard'],
    queryFn: async (): Promise<Peca[]> => {
      const { data, error } = await supabase
        .from('expedicao_pecas')
        .select('id, status, etiquetada_at, alocada_at, conferida_at, faturada_at, created_at')
        .order('created_at', { ascending: false })
        .limit(2000);
      if (error) throw error;
      return (data ?? []) as Peca[];
    },
    staleTime: 15_000,
  });
}

export default function ExpedicaoDashboardOperacionalPage() {
  const { data: pecas = [], isLoading } = usePecas();

  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayMs = today.getTime();

    const inToday = (iso: string | null) =>
      !!iso && new Date(iso).getTime() >= todayMs;

    const etiquetadasHoje = pecas.filter((p) => inToday(p.etiquetada_at)).length;
    const conferidasHoje = pecas.filter((p) => inToday(p.conferida_at)).length;
    const faturadasHoje = pecas.filter((p) => inToday(p.faturada_at)).length;

    const emAndamento = pecas.filter((p) =>
      ['etiquetada', 'alocada', 'conferida', 'no_romaneio'].includes(p.status)
    ).length;

    // Tempo médio: etiquetada → faturada
    const ciclos = pecas
      .filter((p) => p.etiquetada_at && p.faturada_at)
      .map(
        (p) =>
          new Date(p.faturada_at!).getTime() - new Date(p.etiquetada_at!).getTime()
      );
    const tempoMedio = ciclos.length
      ? ciclos.reduce((a, b) => a + b, 0) / ciclos.length
      : 0;

    const porStatus = (Object.keys(STATUS_LABEL) as PecaStatus[]).map((s) => ({
      key: s,
      status: STATUS_LABEL[s],
      total: pecas.filter((p) => p.status === s).length,
    }));

    // Produção últimos 7 dias (peças etiquetadas x faturadas)
    const dias: { dia: string; etiquetadas: number; faturadas: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const ini = d.getTime();
      const fim = ini + 86_400_000;
      const inRange = (iso: string | null) => {
        if (!iso) return false;
        const t = new Date(iso).getTime();
        return t >= ini && t < fim;
      };
      dias.push({
        dia: d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' }),
        etiquetadas: pecas.filter((p) => inRange(p.etiquetada_at)).length,
        faturadas: pecas.filter((p) => inRange(p.faturada_at)).length,
      });
    }

    return {
      etiquetadasHoje,
      conferidasHoje,
      faturadasHoje,
      emAndamento,
      tempoMedio,
      porStatus,
      dias,
    };
  }, [pecas]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard Operacional</h1>
        <p className="text-sm text-muted-foreground">
          Peças em fluxo — Embalagem → Alocação → Conferência → Romaneio → Faturamento.
        </p>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard icon={Tag} label="Etiquetadas hoje" value={stats.etiquetadasHoje} color="text-primary" />
        <KpiCard icon={ClipboardCheck} label="Conferidas hoje" value={stats.conferidasHoje} color="text-success" />
        <KpiCard icon={Truck} label="Faturadas hoje" value={stats.faturadasHoje} color="text-primary" />
        <KpiCard icon={Clock} label="Ciclo médio" value={fmtMin(stats.tempoMedio)} color="text-warning" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Peças por status</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {isLoading ? (
              <Skeleton />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.porStatus.filter((s) => s.total > 0)}
                    dataKey="total"
                    nameKey="status"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={2}
                  >
                    {stats.porStatus
                      .filter((s) => s.total > 0)
                      .map((s) => (
                        <Cell key={s.key} fill={STATUS_COLOR[s.key]} />
                      ))}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Produção (últimos 7 dias)</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {isLoading ? (
              <Skeleton />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.dias}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="dia" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="etiquetadas" name="Etiquetadas" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="faturadas" name="Faturadas" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <PackageCheck className="w-4 h-4 text-muted-foreground" />
            Peças em andamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-semibold tabular-nums">{stats.emAndamento}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Etiquetadas, alocadas, conferidas ou aguardando faturamento em romaneio.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{label}</span>
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
        <p className="text-2xl font-semibold tabular-nums mt-2">{value}</p>
      </CardContent>
    </Card>
  );
}

function Skeleton() {
  return <div className="w-full h-full animate-pulse bg-muted rounded" />;
}
