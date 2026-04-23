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

export const TimelineChart = React.memo(({ data, onExport, onDetailClick }: any) => {
  const { isLow } = usePerformance();
  const processedData = useMemo(() => isLow ? data.slice(-10) : data, [data, isLow]);

  return (
    <button 
      onClick={() => onDetailClick && onDetailClick({ title: 'Volume de Operações', data, type: 'area' })}
      className="md:col-span-3 text-left w-full cursor-pointer rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden hover:border-primary/40 hover:shadow-md transition-all active:scale-[0.99] group"
    >
      <div className="flex flex-row items-center justify-between px-5 sm:px-6 py-4">
        <div>
          <div className="text-base font-bold flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
            <span>Volume de Operações</span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">Histórico recente de conferências</p>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-primary" onClick={() => onExport(data, 'Timeline_Operacoes')}>
          <Download className="w-4 h-4" />
        </Button>
      </div>
      <div className="px-2 pb-6 pt-2 h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={processedData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
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
              dataKey="total" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              fillOpacity={isLow ? 0.05 : 1} 
              fill={isLow ? "hsl(var(--primary))" : "url(#colorValue)"} 
              animationDuration={isLow ? 0 : 1200}
              isAnimationActive={!isLow}
            />
          </AreaChart>
        </ResponsiveContainer>
    </div>
    </button>
  );
});

TimelineChart.displayName = 'TimelineChart';

export const SummaryChart = React.memo(({ title, desc, data, type, icon: Icon, onDetailClick, chartKey }: any) => {
  const { isLow } = usePerformance();
  const processedData = useMemo(() => isLow ? data.slice(0, 5) : data, [data, isLow]);

  return (
    <button 
      onClick={() => onDetailClick({ title, data, type })}
      className="group text-left w-full cursor-pointer rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden hover:border-primary/40 hover:shadow-md transition-all active:scale-[0.98]"
    >
      <div className="px-5 sm:px-6 py-4 flex flex-row items-center justify-between">
        <div>
          <div className="text-sm font-bold flex items-center gap-2">
            <Icon className="w-3.5 h-3.5 text-primary" />
            <span>{title}</span>
          </div>
          <p className="text-[10px] text-muted-foreground font-medium mt-0.5">{desc}</p>
        </div>
        <div className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
          <Eye className="w-3.5 h-3.5" />
        </div>
      </div>
      <div className="px-5 sm:px-6 pb-4 h-[180px] flex flex-col">
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            {type === 'bar' ? (
              <BarChart data={processedData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
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
        </div>
        <div className="mt-2 space-y-1">
          {processedData.slice(0, 2).map((d: any, i: number) => (
            <div key={i} className="flex items-center justify-between text-[10px]">
              <span className="flex items-center gap-1.5 font-medium truncate max-w-[120px]">
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: type === 'bar' ? 'hsl(var(--primary))' : CHART_COLORS[i % CHART_COLORS.length] }} />
                {d.name}
              </span>
              <span className="font-bold text-muted-foreground">{d[chartKey]}</span>
            </div>
          ))}
        </div>
      </div>
    </button>
  );
});

SummaryChart.displayName = 'SummaryChart';