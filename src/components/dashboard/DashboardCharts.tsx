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
  'hsl(var(--primary) / 0.85)',
  'hsl(var(--primary) / 0.7)',
  'hsl(var(--primary) / 0.55)',
  'hsl(var(--primary) / 0.4)',
  'hsl(var(--primary) / 0.25)',
  'hsl(var(--primary) / 0.1)',
];

interface TimelineChartProps {
  data: any[];
  onExport: (data: any[], fileName: string) => void;
}

export const TimelineChart = React.memo(({ data, onExport }: TimelineChartProps) => {
  const { isLow } = usePerformance();
  const processedData = useMemo(() => isLow ? data.slice(-7) : data, [data, isLow]);

  return (
    <Card className="md:col-span-3 border border-border/50 bg-card/50 backdrop-blur-sm shadow-sm overflow-hidden group">
      <CardHeader className="flex flex-row items-center justify-between px-6 py-5">
        <div className="space-y-1">
          <CardTitle className="text-lg font-bold flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10">
              <Activity className="w-4 h-4 text-primary" />
            </div>
            <span>Fluxo de Produção</span>
          </CardTitle>
          <p className="text-[11px] font-medium text-muted-foreground/70 tracking-wide uppercase">Volume de conferências e registros por período</p>
        </div>
        <Button 
          variant="outline" 
          size="icon" 
          className="h-9 w-9 rounded-xl text-muted-foreground hover:text-primary hover:border-primary/30 transition-all" 
          onClick={() => onExport(data, 'Fluxo_Producao')}
        >
          <Download className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent className="px-2 pb-8 pt-2 h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={processedData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="hsl(var(--border) / 0.4)" />
            <XAxis 
              dataKey="name" 
              fontSize={10} 
              fontWeight={600}
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              dy={15}
            />
            <YAxis 
              fontSize={10} 
              fontWeight={600}
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              dx={-10}
            />
            <ChartTooltip 
              cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1.5, strokeDasharray: '5 5' }}
              contentStyle={{ 
                borderRadius: '12px', 
                border: '1px solid hsl(var(--border))', 
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(8px)',
                fontSize: '11px',
                fontWeight: '700',
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)'
              }}
              formatter={(val: any) => [val, 'Volume']}
              labelFormatter={(label: any) => `Período: ${label}`}
            />
            <Area 
              type="monotone" 
              dataKey="total" 
              stroke="hsl(var(--primary))" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorTotal)" 
              animationDuration={1500}
              activeDot={{ r: 6, strokeWidth: 0, fill: 'hsl(var(--primary))' }}
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
  const processedData = useMemo(() => isLow ? data.slice(0, 4) : data, [data, isLow]);

  return (
    <button 
      onClick={() => onDetailClick({ title, data, type })}
      className="group text-left w-full cursor-pointer rounded-2xl border border-border/50 bg-card/40 backdrop-blur-md shadow-sm overflow-hidden hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300 active:scale-[0.99]"
    >
      <div className="px-6 py-5 flex flex-row items-center justify-between">
        <div>
          <div className="text-sm font-black flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
              <Icon className="w-3.5 h-3.5" />
            </div>
            <span className="tracking-tight">{title}</span>
          </div>
          <p className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-wider mt-1.5">{desc}</p>
        </div>
        <div className="h-8 w-8 rounded-full border border-border/40 flex items-center justify-center text-muted-foreground group-hover:text-primary group-hover:border-primary/30 transition-all duration-300">
          <Eye className="w-3.5 h-3.5" />
        </div>
      </div>
      <div className="px-6 pb-6 h-[200px] flex flex-col">
        <div className="flex-1 min-h-0 relative">
          <ResponsiveContainer width="100%" height="100%">
            {type === 'bar' ? (
              <BarChart data={processedData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={1} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" hide />
                <Bar 
                  dataKey={chartKey} 
                  fill="url(#barGradient)" 
                  radius={[6, 6, 2, 2]} 
                  barSize={minMax(12, 32, 100 / processedData.length)} 
                  isAnimationActive={!isLow} 
                  animationDuration={1500}
                />
                <ChartTooltip 
                  cursor={{ fill: 'hsl(var(--primary) / 0.05)', radius: 8 }}
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: '1px solid hsl(var(--border))', 
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(4px)',
                    fontSize: '11px',
                    fontWeight: '700',
                    boxShadow: '0 8px 20px -4px rgba(0,0,0,0.1)'
                  }}
                  formatter={(val: any) => [val, 'Valor']}
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
                  stroke="hsl(var(--card))"
                  strokeWidth={2}
                  paddingAngle={processedData.length > 1 ? 5 : 0}
                  isAnimationActive={!isLow}
                  animationDuration={1000}
                >
                  {processedData.map((_: any, i: number) => (
                    <Cell 
                      key={i} 
                      fill={CHART_COLORS[i % CHART_COLORS.length]} 
                      style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))' }}
                    />
                  ))}
                </Pie>
                <ChartTooltip 
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: '1px solid hsl(var(--border))', 
                    background: 'rgba(255, 255, 255, 0.95)',
                    fontSize: '11px',
                    fontWeight: '700',
                    boxShadow: '0 8px 20px -4px rgba(0,0,0,0.1)'
                  }}
                  formatter={(val: any) => [val, 'Valor']}
                />
              </PieChart>
            )}
          </ResponsiveContainer>
        </div>
        <div className="mt-4 space-y-1.5 border-t border-border/10 pt-4">
          {processedData.slice(0, 2).map((d: any, i: number) => (
            <div key={i} className="flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-2 font-bold truncate max-w-[140px] text-muted-foreground group-hover:text-foreground transition-colors">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: type === 'bar' ? 'hsl(var(--primary))' : CHART_COLORS[i % CHART_COLORS.length] }} />
                {d.name}
              </span>
              <span className="font-black tabular-nums text-foreground">{d[chartKey]}</span>
            </div>
          ))}
        </div>
      </div>
    </button>
  );
});

function minMax(min: number, max: number, val: number) {
  return Math.max(min, Math.min(max, val));
}

SummaryChart.displayName = 'SummaryChart';