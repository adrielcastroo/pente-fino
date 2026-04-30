import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity, Download, Eye, Package } from 'lucide-react';
import { usePerformance } from '@/hooks/use-performance';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as ChartTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, CartesianGrid, LabelList, Legend,
  RadialBarChart, RadialBar
} from 'recharts';

// Premium Color Palette - Jewel Tones with WCAG accessibility
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
    const total = payload[0].chartType === 'PieChart' 
      ? payload[0].payload.chartTotal 
      : null;
    
    return (
      <div className="rounded-2xl border border-border/50 bg-card/90 backdrop-blur-xl p-4 shadow-2xl shadow-black/10 animate-in fade-in zoom-in-95 duration-200">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 border-b border-border/10 pb-2">
          {label || data.name}
        </p>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-8">
            <span className="text-xs font-medium text-foreground/70">{payload[0].name || 'Valor'}:</span>
            <span className="text-sm font-black text-primary tabular-nums">
              {prefix}{payload[0].value}{suffix}
            </span>
          </div>
          {total && (
            <div className="flex items-center justify-between gap-8">
              <span className="text-[10px] font-bold text-muted-foreground/60">Participação:</span>
              <span className="text-[11px] font-bold text-muted-foreground tabular-nums">
                {((payload[0].value / total) * 100).toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

interface TimelineChartProps {
  data: any[];
  onExport: (data: any[], fileName: string) => void;
}

export const TimelineChart = React.memo(({ data, onExport }: TimelineChartProps) => {
  const { isLow } = usePerformance();
  const processedData = useMemo(() => isLow ? data.slice(-10) : data, [data, isLow]);

  return (
    <Card className="md:col-span-3 border-none bg-transparent shadow-none overflow-hidden rounded-[2rem] sm:rounded-[3rem]">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between px-6 sm:px-10 py-6 sm:py-8 gap-6 bg-muted/5 backdrop-blur-xl border-b border-border/10">
        <div className="space-y-1">
          <CardTitle className="text-xl font-extrabold tracking-tight flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Activity className="w-5 h-5" />
            </div>
            <span>Volume de Operações</span>
          </CardTitle>
          <p className="text-sm text-muted-foreground font-medium opacity-70 ml-11">Histórico de conferências por período</p>
        </div>
        <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-border/20 text-muted-foreground hover:text-primary hover:border-primary/30 transition-all" onClick={() => onExport(data, 'Timeline_Operacoes')}>
          <Download className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent className="px-4 sm:px-8 pb-8 sm:pb-12 pt-8 sm:pt-10 h-[clamp(300px,50vh,600px)]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={processedData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            {!isLow && (
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
              </defs>
            )}
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border) / 0.5)" />
            <XAxis 
              dataKey="name" 
              fontSize={10} 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'hsl(var(--muted-foreground))', fontWeight: 600 }}
              dy={15}
            />
            <YAxis 
              fontSize={10} 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'hsl(var(--muted-foreground))', fontWeight: 600 }}
              dx={-10}
            />
            <ChartTooltip content={<CustomTooltip />} cursor={!isLow ? { stroke: 'hsl(var(--primary))', strokeWidth: 1.5, strokeDasharray: '4 4' } : false} />
            <Legend 
              verticalAlign="top" 
              height={36} 
              iconType="circle"
              formatter={(value) => <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{value === 'total' ? 'Registros' : value}</span>}
            />
            <Area 
              type={isLow ? "linear" : "monotone"} 
              dataKey="total" 
              stroke="hsl(var(--primary))" 
              strokeWidth={3}
              fillOpacity={isLow ? 0.05 : 1} 
              fill={isLow ? "hsl(var(--primary))" : "url(#colorValue)"} 
              animationDuration={isLow ? 0 : 1500}
              isAnimationActive={!isLow}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
});

TimelineChart.displayName = 'TimelineChart';

export const SummaryChart = React.memo(({ title, desc, data, type, icon: Icon, onDetailClick, chartKey }: any) => {
  const { isLow } = usePerformance();
  const processedData = useMemo(() => isLow ? data.slice(0, 5) : data, [data, isLow]);

  return (
    <Card className="group border border-border/10 bg-card/20 backdrop-blur-xl shadow-sm overflow-hidden transition-all duration-700 hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/[0.03] rounded-[1.25rem] sm:rounded-[1.5rem]">
      <CardHeader className="px-6 sm:px-8 py-6 sm:py-8 flex flex-row items-start justify-between">
        <div className="space-y-1.5">
          <CardTitle className="text-base font-extrabold flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-primary/5 text-primary group-hover:bg-primary/10 transition-colors">
              <Icon className="w-4 h-4" />
            </div>
            <span className="text-foreground/90">{title}</span>
          </CardTitle>
          <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider opacity-60 ml-8">{desc}</p>
        </div>
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl opacity-0 group-hover:opacity-100 transition-all text-muted-foreground hover:text-primary hover:bg-primary/5" onClick={() => onDetailClick({ title, data, type })}>
          <Eye className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent className="px-4 sm:px-8 pb-6 sm:pb-8 h-[220px] sm:h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          {type === 'bar' ? (
            <BarChart data={processedData} margin={{ top: 20, right: 10, left: -20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border) / 0.3)" />
              <XAxis 
                dataKey="name" 
                fontSize={9} 
                tickLine={false} 
                axisLine={false} 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontWeight: 600 }}
                interval={0}
              />
              <YAxis 
                fontSize={9} 
                tickLine={false} 
                axisLine={false} 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontWeight: 600 }}
              />
              <Bar 
                dataKey={chartKey} 
                fill="hsl(var(--primary))" 
                radius={[6, 6, 2, 2]} 
                barSize={24} 
                isAnimationActive={!isLow}
                animationDuration={1500}
                name="Quantidade"
              >
                <LabelList 
                  dataKey={chartKey} 
                  position="top" 
                  fontSize={10} 
                  fontWeight={800} 
                  fill="hsl(var(--primary))"
                  offset={10}
                />
              </Bar>
              <ChartTooltip cursor={{ fill: 'hsl(var(--primary) / 0.05)' }} content={<CustomTooltip />} />
            </BarChart>
          ) : (
            <PieChart>
              <Pie 
                data={processedData.map((d: any) => ({ 
                  ...d, 
                  chartTotal: processedData.reduce((acc: number, curr: any) => acc + (curr[chartKey] || 0), 0) 
                }))} 
                dataKey={chartKey} 
                innerRadius="60%" 
                outerRadius="85%" 
                stroke="transparent"
                paddingAngle={isLow ? 0 : 4}
                isAnimationActive={!isLow}
                animationDuration={1500}
                nameKey="name"
              >
                {processedData.map((_: any, i: number) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} className="hover:opacity-80 transition-opacity cursor-pointer" />)}
                <LabelList 
                  dataKey={chartKey} 
                  position="outside" 
                  fontSize={10} 
                  fontWeight={700} 
                  fill="hsl(var(--muted-foreground))"
                  formatter={(val: any) => val > 0 ? val : ''}
                />
              </Pie>
              <ChartTooltip content={<CustomTooltip />} />
              <Legend 
                layout="horizontal" 
                verticalAlign="bottom" 
                align="center"
                iconType="circle"
                wrapperStyle={{ paddingTop: '20px' }}
                formatter={(value) => <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/80">{value}</span>}
              />
            </PieChart>
          )}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
});

SummaryChart.displayName = 'SummaryChart';

export const OccupationChart = React.memo(({ used, total, unit = 'm²' }: { used: number, total: number, unit?: string }) => {
  const { isLow } = usePerformance();
  const percentage = Math.round((used / total) * 100);
  
  const data = [
    {
      name: 'Disponível',
      value: total,
      fill: 'hsl(var(--muted) / 0.2)',
    },
    {
      name: 'Ocupado',
      value: used,
      fill: 'hsl(var(--primary))',
    }
  ];

  return (
    <Card className="border-none bg-card/10 backdrop-blur-md overflow-hidden rounded-[2rem] sm:rounded-[3rem] h-full transition-all duration-700 hover:border-primary/20 hover:shadow-2xl hover:shadow-primary/[0.02]">
      <CardHeader className="px-6 sm:px-10 py-6 sm:py-8 bg-muted/5 backdrop-blur-xl border-b border-border/10">
        <div className="space-y-1">
          <CardTitle className="text-xl font-extrabold tracking-tight flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Package className="w-5 h-5" />
            </div>
            <span>Ocupação do Estoque</span>
          </CardTitle>
          <p className="text-sm text-muted-foreground font-medium opacity-70 ml-11">Visão em tempo real da capacidade</p>
        </div>
      </CardHeader>
      <CardContent className="px-4 sm:px-8 py-8 sm:py-12 flex flex-col md:flex-row items-center justify-around gap-8">
        <div className="relative w-full max-w-[280px] aspect-square">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={[
                  { name: 'Ocupado', value: used },
                  { name: 'Disponível', value: total - used }
                ]}
                innerRadius="70%"
                outerRadius="95%"
                paddingAngle={5}
                dataKey="value"
                startAngle={90}
                endAngle={450}
                isAnimationActive={!isLow}
              >
                <Cell fill="hsl(var(--primary))" />
                <Cell fill="hsl(var(--muted) / 0.3)" />
              </Pie>
              <ChartTooltip 
                content={({ active, payload }: any) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-2xl border border-border/50 bg-card/90 backdrop-blur-xl p-4 shadow-2xl">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">{payload[0].name}</p>
                        <p className="text-sm font-black text-primary">{payload[0].value} {unit}</p>
                      </div>
                    );
                  }
                  return null;
                }} 
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-4xl font-black tracking-tighter text-foreground">{percentage}%</span>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Ocupado</span>
          </div>
        </div>

        <div className="flex flex-col gap-6 w-full md:max-w-[200px]">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Capacidade Total</span>
              <span className="text-sm font-bold text-foreground tabular-nums">{total} {unit}</span>
            </div>
            <div className="h-1.5 w-full bg-muted/30 rounded-full overflow-hidden">
              <div className="h-full bg-muted-foreground/20 rounded-full w-full" />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Espaço Utilizado</span>
              <span className="text-sm font-black text-primary tabular-nums">{used} {unit}</span>
            </div>
            <div className="h-1.5 w-full bg-muted/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full transition-all duration-1000 ease-out" 
                style={{ width: `${percentage}%` }} 
              />
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-border/10">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Disponível</span>
              <span className="text-sm font-bold text-foreground/70 tabular-nums">{total - used} {unit}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

OccupationChart.displayName = 'OccupationChart';
