import React, { useMemo, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity, Download, Eye, Package, ListChecks } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as ChartTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, CartesianGrid, LabelList, Legend,
} from 'recharts';
import { usePerformance } from '@/hooks/use-performance';

// Premium Color Palette
const CHART_COLORS = [
  'hsl(var(--primary))',
  '#0D9488', // Teal 600
  '#7C3AED', // Violet 600
  '#D97706', // Amber 600
  '#DC2626', // Red 600
  '#2563EB', // Blue 600
];

const CustomTooltip = ({ active, payload, label, prefix = '', suffix = '' }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="rounded-2xl border border-border/50 bg-card/90 backdrop-blur-xl p-4 shadow-2xl shadow-black/10 animate-in fade-in zoom-in-95 duration-200">
        <p className="text-[10px] font-black uppercase tracking-widest text-foreground/50 mb-2 border-b border-border/10 pb-2">
          {label || data.name}
        </p>
        <div className="flex flex-col gap-1.5">
          {payload.map((p: any, i: number) => (
            <div key={i} className="flex items-center justify-between gap-8">
              <span className="text-xs font-medium text-foreground/70">{p.name}:</span>
              <span className="text-sm font-black tabular-nums" style={{ color: p.color }}>
                {prefix}{p.value}{suffix}
              </span>
            </div>
          ))}
          {data.inspectors && (
            <div className="mt-2 pt-2 border-t border-border/10">
               <span className="text-[10px] font-black uppercase text-foreground/40 block mb-1">Responsáveis:</span>
               <span className="text-xs font-bold text-primary">{data.inspectors}</span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

export const TimelineChart = React.memo(({ data, onExport, onDetailClick, id }: any) => {
  const { isLow } = usePerformance();
  const processedData = useMemo(() => isLow ? data.slice(-10) : data, [data, isLow]);

  return (
    <Card id={id} className="md:col-span-3 border-none bg-transparent shadow-none overflow-hidden rounded-[2rem]">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between px-10 py-8 gap-6 bg-muted/5 backdrop-blur-xl border-b border-border/10">
        <div className="space-y-1">
          <CardTitle className="text-xl font-extrabold tracking-tight flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Activity className="w-5 h-5" />
            </div>
            <span>Volume de Operações</span>
          </CardTitle>
          <p className="text-sm text-foreground/60 font-black ml-11">Histórico de conferências por período</p>
        </div>
        <div className="flex items-center gap-2">
          {onDetailClick && (
            <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl" onClick={() => onDetailClick({ title: 'Volume de Operações', data, type: 'area' })}>
              <Eye className="w-4 h-4" />
            </Button>
          )}
          <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl" onClick={() => onExport(data, 'Timeline_Operacoes')}>
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-8 pb-12 pt-10 h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={processedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border) / 0.5)" />
            <XAxis dataKey="name" fontSize={10} tick={{ fill: 'hsl(var(--foreground) / 0.6)', fontWeight: 800 }} />
            <YAxis fontSize={10} tick={{ fill: 'hsl(var(--foreground) / 0.6)', fontWeight: 800 }} />
            <ChartTooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="total" stroke="hsl(var(--primary))" strokeWidth={3} fill="hsl(var(--primary) / 0.1)" />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
});

export const SummaryChart = React.memo(({ title, desc, data, type, icon: Icon, onDetailClick, chartKey, id }: any) => {
  const { isLow } = usePerformance();
  return (
    <Card id={id} className="group border border-border/10 bg-card/20 backdrop-blur-xl shadow-sm overflow-hidden rounded-[1.5rem]">
      <CardHeader className="px-8 py-8 flex flex-row items-start justify-between">
        <div className="space-y-1.5">
          <CardTitle className="text-base font-extrabold flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-primary/5 text-primary">
              <Icon className="w-4 h-4" />
            </div>
            <span>{title}</span>
          </CardTitle>
          <p className="text-[11px] text-foreground/60 font-black uppercase tracking-wider ml-8">{desc}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={() => onDetailClick({ title, data, type })}>
          <Eye className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent className="px-8 pb-8 h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          {type === 'bar' ? (
            <BarChart data={data}>
              <XAxis dataKey="name" fontSize={9} tick={{ fill: 'hsl(var(--foreground) / 0.6)', fontWeight: 800 }} />
              <Bar dataKey={chartKey} fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              <ChartTooltip content={<CustomTooltip />} />
            </BarChart>
          ) : (
            <PieChart>
              <Pie data={data} dataKey={chartKey} innerRadius="60%" outerRadius="85%" stroke="transparent">
                {data.map((_: any, i: number) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <ChartTooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          )}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
});

export const OccupationChart = React.memo(({ title, used, total, reserved = 0, blocked = 0, unit = 'alocações', id }: any) => {
  const percentage = total > 0 ? Math.round((used / total) * 100) : 0;
  const data = [
    { name: 'Ocupado', value: used, color: 'hsl(var(--primary))' },
    { name: 'Reservado', value: reserved, color: '#D97706' },
    { name: 'Bloqueado', value: blocked, color: '#DC2626' },
    { name: 'Livre', value: Math.max(0, total - used - reserved - blocked), color: 'hsl(var(--muted) / 0.3)' }
  ];

  return (
    <Card id={id} className="border-none bg-card/10 backdrop-blur-md overflow-hidden rounded-[2rem]">
      <CardHeader className="px-10 py-8 border-b border-border/10">
        <CardTitle className="text-xl font-extrabold flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <Package className="w-5 h-5" />
          </div>
          <span>{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-12 flex flex-col items-center gap-8">
        <div className="relative w-[240px] h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} innerRadius="68%" outerRadius="95%" dataKey="value" startAngle={90} endAngle={450}>
                {data.map((entry, index) => <Cell key={index} fill={entry.color} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-4xl font-black text-foreground">{percentage}%</span>
            <span className="text-[10px] font-black uppercase text-foreground/50">Ocupado</span>
          </div>
        </div>
        <div className="w-full space-y-4">
           {data.map((d, i) => (
             <div key={i} className="flex items-center justify-between text-xs font-bold uppercase tracking-widest">
               <span className="text-muted-foreground">{d.name}</span>
               <span className="text-foreground">{d.value} {unit}</span>
             </div>
           ))}
        </div>
      </CardContent>
    </Card>
  );
});

export const InventoryTimelineChart = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: hist } = await (supabase
        .from('inventory_tasks') as any)
        .select('*')
        .eq('status', 'completed')
        .order('completed_at', { ascending: true })
        .limit(100);

      if (hist) {
        const grouped = hist.reduce((acc: any, curr: any) => {
          const date = new Date(curr.completed_at).toLocaleDateString('pt-BR');
          if (!acc[date]) acc[date] = { name: date, divergence: 0, counts: 0, inspectors: new Set() };
          const details = curr.divergence_details as any;
          acc[date].divergence += Math.abs(details?.diff || 0);
          acc[date].counts += 1;
          if (curr.conferente_nome) acc[date].inspectors.add(curr.conferente_nome);
          return acc;
        }, {});
        
        setData(Object.values(grouped).map((g: any) => ({
            ...g,
            inspectors: Array.from(g.inspectors).join(', ')
        })));
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) return <div className="h-64 flex items-center justify-center"><Activity className="animate-spin" /></div>;

  return (
    <Card className="border-none bg-transparent shadow-none overflow-hidden rounded-[2rem]">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between px-10 py-8 gap-6 bg-muted/5 backdrop-blur-xl border-b border-border/10">
        <div className="space-y-1">
          <CardTitle className="text-xl font-extrabold tracking-tight flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <ListChecks className="w-5 h-5" />
            </div>
            <span>Cronologia de Inventários</span>
          </CardTitle>
          <p className="text-sm text-foreground/60 font-black ml-11">Histórico de acuracidade e divergências</p>
        </div>
      </CardHeader>
      <CardContent className="px-8 pb-12 pt-10 h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border) / 0.5)" />
            <XAxis dataKey="name" fontSize={10} tick={{ fill: 'hsl(var(--foreground) / 0.6)', fontWeight: 800 }} />
            <YAxis fontSize={10} tick={{ fill: 'hsl(var(--foreground) / 0.6)', fontWeight: 800 }} />
            <ChartTooltip content={<CustomTooltip />} />
            <Legend verticalAlign="top" height={36}/>
            <Bar dataKey="counts" name="Total Contagens" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            <Bar dataKey="divergence" name="Volume Divergência" fill="#f43f5e" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

TimelineChart.displayName = 'TimelineChart';
SummaryChart.displayName = 'SummaryChart';
OccupationChart.displayName = 'OccupationChart';
