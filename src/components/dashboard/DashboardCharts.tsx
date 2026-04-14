import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity, Download, Eye } from 'lucide-react';
import { usePerformance } from '@/hooks/use-performance';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as ChartTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, CartesianGrid
} from 'recharts';

const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--primary) / 0.75)',
  'hsl(var(--primary) / 0.55)',
  'hsl(var(--primary) / 0.35)',
  'hsl(var(--primary) / 0.2)',
];

interface TimelineChartProps {
  data: any[];
  onExport: (data: any[], fileName: string) => void;
}

export const TimelineChart = React.memo(({ data, onExport }: TimelineChartProps) => {
  const { isLow } = usePerformance();
  const processedData = useMemo(() => isLow ? data.slice(-10) : data, [data, isLow]);

  return (
    <Card className="md:col-span-3 border border-border/50 bg-card shadow-sm overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between px-5 sm:px-6 py-4">
        <div>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            <span>Volume de Operações</span>
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">Histórico recente de conferências</p>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-primary" onClick={() => onExport(data, 'Timeline_Operacoes')}>
          <Download className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent className="px-2 pb-6 pt-2 h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={processedData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            {!isLow && (
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
              </defs>
            )}
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="name" 
              fontSize={10} 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              dy={10}
            />
            <YAxis 
              fontSize={10} 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              dx={-10}
            />
            <ChartTooltip 
              cursor={!isLow ? { stroke: 'hsl(var(--primary))', strokeWidth: 1, strokeDasharray: '4 4' } : false}
              contentStyle={{ 
                borderRadius: '10px', 
                border: '1px solid hsl(var(--border))', 
                background: 'hsl(var(--card))',
                fontSize: '12px',
                fontWeight: '600',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
              }}
              formatter={(val: any) => [val, 'Quantidade']}
              labelFormatter={(label: any) => `Data: ${label}`}
            />
            <Area 
              type={isLow ? "linear" : "monotone"} 
              dataKey="value" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              fillOpacity={isLow ? 0.05 : 1} 
              fill={isLow ? "hsl(var(--primary))" : "url(#colorValue)"} 
              animationDuration={isLow ? 0 : 1200}
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
    <Card className="group border border-border/50 bg-card shadow-sm overflow-hidden transition-colors hover:border-primary/20">
      <CardHeader className="px-5 sm:px-6 py-4 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Icon className="w-3.5 h-3.5 text-primary" />
            <span>{title}</span>
          </CardTitle>
          <p className="text-[10px] text-muted-foreground font-medium mt-0.5">{desc}</p>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary" onClick={() => onDetailClick({ title, data, type })}>
          <Eye className="w-3.5 h-3.5" />
        </Button>
      </CardHeader>
      <CardContent className="px-4 pb-6 h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          {type === 'bar' ? (
            <BarChart data={processedData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" hide />
              <Bar 
                dataKey={chartKey} 
                fill="hsl(var(--primary))" 
                radius={[4, 4, 2, 2]} 
                barSize={24} 
                isAnimationActive={!isLow} 
              />
              <ChartTooltip 
                cursor={!isLow ? { fill: 'hsl(var(--primary) / 0.05)' } : false}
                contentStyle={{ 
                  borderRadius: '8px', 
                  border: '1px solid hsl(var(--border))', 
                  background: 'hsl(var(--card))',
                  fontSize: '11px',
                  fontWeight: '600',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                }}
                formatter={(val: any) => [val, 'Quantidade']}
                labelFormatter={(label: any) => label}
              />
            </BarChart>
          ) : (
            <PieChart>
              <Pie 
                data={processedData} 
                dataKey={chartKey} 
                innerRadius="60%" 
                outerRadius="85%" 
                stroke="transparent"
                paddingAngle={isLow ? 0 : 3}
                isAnimationActive={!isLow}
                animationDuration={0}
              >
                {processedData.map((_: any, i: number) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <ChartTooltip 
                contentStyle={{ 
                  borderRadius: '8px', 
                  border: '1px solid hsl(var(--border))', 
                  background: 'hsl(var(--card))',
                  fontSize: '11px',
                  fontWeight: '600',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                }}
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