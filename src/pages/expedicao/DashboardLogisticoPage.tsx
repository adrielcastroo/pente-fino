import { useMemo } from 'react';
import { usePickings } from '@/hooks/expedicao/useExpedicaoData';
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
import { Truck, MapPin, Building2 } from 'lucide-react';

function topN<T extends { nome: string; total: number }>(arr: T[], n = 10) {
  return [...arr].sort((a, b) => b.total - a.total).slice(0, n);
}

export default function ExpedicaoDashboardLogisticoPage() {
  const { data: pickings = [], isLoading } = usePickings();

  const stats = useMemo(() => {
    const byKey = (key: 'transportadora' | 'regiao' | 'cidade') => {
      const map = new Map<string, number>();
      for (const p of pickings) {
        let nome: string | null = null;
        if (key === 'transportadora') nome = p.transportadora?.nome ?? null;
        else if (key === 'regiao') nome = p.regiao;
        else nome = p.cidade;
        const final = nome?.trim() || '(sem cadastro)';
        map.set(final, (map.get(final) ?? 0) + 1);
      }
      return Array.from(map, ([nome, total]) => ({ nome, total }));
    };

    return {
      transportadoras: topN(byKey('transportadora')),
      regioes: topN(byKey('regiao')),
      cidades: topN(byKey('cidade'), 15),
    };
  }, [pickings]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard Logístico</h1>
        <p className="text-sm text-muted-foreground">Volumes por transportadora, região e cidade.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard
          title="Top transportadoras"
          icon={Truck}
          data={stats.transportadoras}
          color="#0ea5e9"
          loading={isLoading}
        />
        <ChartCard
          title="Top regiões"
          icon={MapPin}
          data={stats.regioes}
          color="#10b981"
          loading={isLoading}
        />
      </div>

      <ChartCard
        title="Top cidades"
        icon={Building2}
        data={stats.cidades}
        color="#6366f1"
        loading={isLoading}
        height={Math.max(300, stats.cidades.length * 28)}
      />
    </div>
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
