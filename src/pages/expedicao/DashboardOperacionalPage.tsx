import { useMemo } from 'react';
import { usePickings, type PickingStatus } from '@/hooks/expedicao/useExpedicaoData';
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
import { Clock, Package, CheckCircle2, DollarSign } from 'lucide-react';

const STATUS_LABEL: Record<PickingStatus, string> = {
  aguardando: 'Aguardando',
  em_separacao: 'Em separação',
  em_conferencia: 'Em conferência',
  conferido: 'Conferido',
  faturado: 'Faturado',
  cancelado: 'Cancelado',
};

const STATUS_COLOR: Record<PickingStatus, string> = {
  aguardando: '#94a3b8',
  em_separacao: '#0ea5e9',
  em_conferencia: '#f59e0b',
  conferido: '#10b981',
  faturado: '#6366f1',
  cancelado: '#ef4444',
};

function fmtMin(ms: number) {
  if (!isFinite(ms) || ms <= 0) return '—';
  const min = Math.round(ms / 60000);
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}h ${m}m`;
}

export default function ExpedicaoDashboardOperacionalPage() {
  const { data: pickings = [], isLoading } = usePickings();

  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayMs = today.getTime();

    const hoje = pickings.filter((p) => new Date(p.created_at).getTime() >= todayMs);
    const conferidosHoje = hoje.filter((p) => p.status === 'conferido' || p.status === 'faturado');
    const faturadosHoje = hoje.filter((p) => p.status === 'faturado');
    const ativos = pickings.filter((p) =>
      ['aguardando', 'em_separacao', 'em_conferencia'].includes(p.status)
    );

    const tempos = pickings
      .filter((p) => p.finished_at)
      .map((p) => new Date(p.finished_at!).getTime() - new Date(p.created_at).getTime());
    const tempoMedio = tempos.length
      ? tempos.reduce((a, b) => a + b, 0) / tempos.length
      : 0;

    const porStatus = (Object.keys(STATUS_LABEL) as PickingStatus[]).map((s) => ({
      status: STATUS_LABEL[s],
      key: s,
      total: pickings.filter((p) => p.status === s).length,
    }));

    // Produção últimos 7 dias
    const dias: { dia: string; criados: number; conferidos: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const ini = d.getTime();
      const fim = ini + 86400000;
      const label = d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' });
      dias.push({
        dia: label,
        criados: pickings.filter((p) => {
          const t = new Date(p.created_at).getTime();
          return t >= ini && t < fim;
        }).length,
        conferidos: pickings.filter((p) => {
          if (!p.finished_at) return false;
          const t = new Date(p.finished_at).getTime();
          return t >= ini && t < fim;
        }).length,
      });
    }

    return {
      hoje: hoje.length,
      conferidosHoje: conferidosHoje.length,
      faturadosHoje: faturadosHoje.length,
      ativos: ativos.length,
      tempoMedio,
      porStatus,
      dias,
    };
  }, [pickings]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard Operacional</h1>
        <p className="text-sm text-muted-foreground">KPIs do dia, produtividade e tempos por etapa.</p>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard icon={Package} label="Pickings hoje" value={stats.hoje} color="text-sky-600" />
        <KpiCard icon={CheckCircle2} label="Conferidos hoje" value={stats.conferidosHoje} color="text-emerald-600" />
        <KpiCard icon={DollarSign} label="Faturados hoje" value={stats.faturadosHoje} color="text-indigo-600" />
        <KpiCard icon={Clock} label="Tempo médio" value={fmtMin(stats.tempoMedio)} color="text-amber-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pickings por status</CardTitle>
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
                  <Bar dataKey="criados" name="Criados" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="conferidos" name="Conferidos" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pickings ativos</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-semibold tabular-nums">{stats.ativos}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Aguardando, em separação ou em conferência.
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
