import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity, Download, Eye } from 'lucide-react';
import { usePerformance } from '@/hooks/use-performance';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as ChartTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, CartesianGrid, LabelList, Legend
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
    <Card className="md:col-span-3 border-none bg-transparent shadow-none overflow-hidden rounded-[3rem]">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between px-10 py-10 gap-6 bg-muted/5 backdrop-blur-xl border-b border-border/10">
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
      <CardContent className="px-8 pb-12 pt-10 h-[350px] sm:h-[420px] lg:h-[480px]">
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
            <ChartTooltip 
              cursor={!isLow ? { stroke: 'hsl(var(--primary))', strokeWidth: 1.5, strokeDasharray: '4 4' } : false}
              contentStyle={{ 
                borderRadius: '16px', 
                border: '1px solid hsl(var(--border) / 0.5)', 
                background: 'hsl(var(--card) / 0.8)',
                backdropFilter: 'blur(12px)',
                fontSize: '12px',
                fontWeight: '700',
                boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)',
                padding: '12px 16px'
              }}
              itemStyle={{ color: 'hsl(var(--foreground))' }}
              formatter={(val: any) => [val, 'Quantidade']}
              labelFormatter={(label: any) => `Data: ${label}`}
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
    <Card className="group border border-border/10 bg-card/20 backdrop-blur-xl shadow-sm overflow-hidden transition-all duration-700 hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/[0.03] rounded-[2.5rem]">
      <CardHeader className="px-8 py-8 flex flex-row items-start justify-between">
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
      <CardContent className="px-8 pb-10 h-[220px] sm:h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          {type === 'bar' ? (
            <BarChart data={processedData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <XAxis dataKey="name" hide />
              <Bar 
                dataKey={chartKey} 
                fill="hsl(var(--primary))" 
                radius={[6, 6, 2, 2]} 
                barSize={28} 
                isAnimationActive={!isLow}
                animationDuration={1500}
              />
              <ChartTooltip 
                cursor={!isLow ? { fill: 'hsl(var(--primary) / 0.03)' } : false}
                contentStyle={{ 
                  borderRadius: '12px', 
                  border: '1px solid hsl(var(--border) / 0.5)', 
                  background: 'hsl(var(--card) / 0.8)',
                  backdropFilter: 'blur(8px)',
                  fontSize: '11px',
                  fontWeight: '700',
                  boxShadow: '0 10px 20px -5px rgba(0,0,0,0.1)',
                  padding: '8px 12px'
                }}
                itemStyle={{ color: 'hsl(var(--foreground))' }}
                formatter={(val: any) => [val, 'Quantidade']}
                labelFormatter={(label: any) => label}
              />
            </BarChart>
          ) : (
            <PieChart>
              <Pie 
                data={processedData} 
                dataKey={chartKey} 
                innerRadius="65%" 
                outerRadius="90%" 
                stroke="transparent"
                paddingAngle={isLow ? 0 : 4}
                isAnimationActive={!isLow}
                animationDuration={1500}
              >
                {processedData.map((_: any, i: number) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} className="hover:opacity-80 transition-opacity cursor-pointer" />)}
              </Pie>
              <ChartTooltip 
                contentStyle={{ 
                  borderRadius: '12px', 
                  border: '1px solid hsl(var(--border) / 0.5)', 
                  background: 'hsl(var(--card) / 0.8)',
                  backdropFilter: 'blur(8px)',
                  fontSize: '11px',
                  fontWeight: '700',
                  boxShadow: '0 10px 20px -5px rgba(0,0,0,0.1)',
                  padding: '8px 12px'
                }}
                itemStyle={{ color: 'hsl(var(--foreground))' }}
                formatter={(val: any) => [val, 'Quantidade']}
              />
            </PieChart>
          )}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
});

SummaryChart.displayName = 'SummaryChart';
