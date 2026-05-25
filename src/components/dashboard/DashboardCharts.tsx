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
  onDetailClick?: (config: any) => void;
  id?: string;
}

export const TimelineChart = React.memo(({ data, onExport, onDetailClick, id }: TimelineChartProps) => {
  const { isLow } = usePerformance();
  const processedData = useMemo(() => isLow ? data.slice(-10) : data, [data, isLow]);

  return (
    <Card id={id} className="md:col-span-3 border-none bg-transparent shadow-none overflow-hidden rounded-[1.25rem] sm:rounded-[2rem] lg:rounded-[3rem]">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between px-4 sm:px-6 lg:px-10 py-4 sm:py-6 lg:py-8 gap-4 sm:gap-6 bg-muted/5 backdrop-blur-xl border-b border-border/10">
        <div className="space-y-1">
          <CardTitle className="text-base sm:text-lg lg:text-xl font-extrabold tracking-tight flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10 text-primary">
              <Activity className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span>Volume de Operações</span>
          </CardTitle>
          <p className="text-[10px] sm:text-sm text-muted-foreground font-medium opacity-70 ml-8 sm:ml-11">Histórico de conferências por período</p>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {onDetailClick && (
            <Button 
              variant="outline" 
              size="icon" 
              className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl border-border/20 text-muted-foreground hover:text-primary hover:border-primary/30 transition-all" 
              onClick={() => onDetailClick({ title: 'Volume de Operações', data, type: 'area' })}
            >
              <Eye className="w-4 h-4" />
            </Button>
          )}
          <Button variant="outline" size="icon" className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl border-border/20 text-muted-foreground hover:text-primary hover:border-primary/30 transition-all" onClick={() => onExport(data, 'Timeline_Operacoes')}>
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:px-4 lg:px-8 pb-6 sm:pb-8 lg:pb-12 pt-6 sm:pt-8 lg:pt-10 h-[clamp(250px,45vh,600px)]">
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

export const SummaryChart = React.memo(({ title, desc, data, type, icon: Icon, onDetailClick, chartKey, id }: any) => {
  const { isLow } = usePerformance();
  const processedData = useMemo(() => isLow ? data.slice(0, 5) : data, [data, isLow]);

  return (
    <Card id={id} className="group border border-border/10 bg-card/20 backdrop-blur-xl shadow-sm overflow-hidden transition-all duration-700 hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/[0.03] rounded-[1.25rem] sm:rounded-[1.5rem]">
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

export const OccupationChart = React.memo(({ 
  title, 
  used, 
  total, 
  reserved = 0, 
  blocked = 0, 
  unit = 'alocações',
  customCategories,
  id
}: { 
  title: string, 
  used: number, 
  total: number, 
  reserved?: number, 
  blocked?: number, 
  unit?: string,
  customCategories?: { name: string, value: number, color?: string }[],
  id?: string
}) => {
  const { isLow } = usePerformance();
  
  const { calculatedUsed, calculatedTotal, finalData } = useMemo(() => {
    if (customCategories) {
      const sum = customCategories.reduce((acc, c) => acc + c.value, 0);
      return {
        calculatedUsed: sum,
        calculatedTotal: total || sum,
        finalData: customCategories
      };
    }
    
    return {
      calculatedUsed: used,
      calculatedTotal: total,
      finalData: [
        { name: 'Ocupado', value: used, color: 'hsl(var(--primary))' },
        { name: 'Reservado', value: reserved, color: '#D97706' },
        { name: 'Bloqueado', value: blocked, color: '#DC2626' },
        { name: 'Livre', value: Math.max(0, total - used - reserved - blocked), color: 'hsl(var(--muted) / 0.3)' }
      ]
    };
  }, [used, reserved, blocked, total, customCategories]);

  const percentage = calculatedTotal > 0 ? Math.round((calculatedUsed / calculatedTotal) * 100) : 0;
  const isEmpty = calculatedTotal === 0 && finalData.every(c => c.value === 0);

  return (
    <Card id={id} className="border-none bg-card/10 backdrop-blur-md overflow-hidden rounded-[1.25rem] sm:rounded-[2rem] h-full transition-all duration-700 hover:border-primary/20 hover:shadow-2xl hover:shadow-primary/[0.02]">
      <CardHeader className="px-4 sm:px-6 md:px-10 py-4 sm:py-6 md:py-8 bg-muted/5 backdrop-blur-xl border-b border-border/10">
        <div className="space-y-1">
          <CardTitle className="text-base sm:text-lg md:text-xl font-extrabold tracking-tight flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10 text-primary">
              <Package className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span className="truncate">{title}</span>
          </CardTitle>
          <p className="text-[10px] sm:text-sm text-muted-foreground font-medium opacity-70 ml-8 sm:ml-11">Visão em tempo real da capacidade</p>
        </div>
      </CardHeader>
      <CardContent className="px-3 sm:px-6 md:px-8 py-5 sm:py-8 md:py-12 flex flex-col items-center gap-6 sm:gap-8">
        <div className="relative w-[160px] h-[160px] sm:w-[200px] sm:h-[200px] md:w-[240px] md:h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={isEmpty ? [{ name: 'Sem dados', value: 1 }] : finalData}
                innerRadius="68%"
                outerRadius="95%"
                paddingAngle={isEmpty ? 0 : 4}
                dataKey="value"
                startAngle={90}
                endAngle={450}
                isAnimationActive={!isLow}
              >
                {isEmpty ? (
                  <Cell fill="hsl(var(--muted) / 0.2)" />
                ) : (
                  finalData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || CHART_COLORS[index % CHART_COLORS.length]} />
                  ))
                )}
              </Pie>
              {!isEmpty && (
                <ChartTooltip 
                  content={({ active, payload }: any) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-2xl border border-border/50 bg-card/90 backdrop-blur-xl p-3 sm:p-4 shadow-2xl">
                          <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">{payload[0].name}</p>
                          <p className="text-xs sm:text-sm font-black text-primary">{payload[0].value} {unit}</p>
                        </div>
                      );
                    }
                    return null;
                  }} 
                />
              )}
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tighter text-foreground">{isEmpty ? 0 : percentage}%</span>
            <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-[0.15em] sm:tracking-[0.2em] text-muted-foreground">{isEmpty ? 'Vazio' : 'Ocupado'}</span>
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:gap-6 w-full max-w-[280px]">
          {customCategories ? (
            <>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[9px] sm:text-[11px] font-bold uppercase tracking-wider sm:tracking-widest text-muted-foreground">Total</span>
                  <span className="text-xs sm:text-sm font-bold text-foreground tabular-nums whitespace-nowrap">{calculatedTotal} {unit}</span>
                </div>
                <div className="h-1 sm:h-1.5 w-full bg-muted/30 rounded-full overflow-hidden" />
              </div>
              {customCategories.map((cat, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[9px] sm:text-[11px] font-bold uppercase tracking-wider sm:tracking-widest text-muted-foreground">{cat.name}</span>
                    <span className="text-xs sm:text-sm font-black text-primary tabular-nums whitespace-nowrap">{cat.value} {unit}</span>
                  </div>
                  <div className="h-1 sm:h-1.5 w-full bg-muted/30 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all duration-1000 ease-out" 
                      style={{ width: `${calculatedTotal > 0 ? (cat.value / calculatedTotal) * 100 : 0}%`, backgroundColor: cat.color }} 
                    />
                  </div>
                </div>
              ))}
            </>
          ) : (
            <>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[9px] sm:text-[11px] font-bold uppercase tracking-wider sm:tracking-widest text-muted-foreground">Capacidade Total</span>
                  <span className="text-xs sm:text-sm font-bold text-foreground tabular-nums whitespace-nowrap">{total} {unit}</span>
                </div>
                <div className="h-1 sm:h-1.5 w-full bg-muted/30 rounded-full overflow-hidden">
                  <div className="h-full bg-muted-foreground/20 rounded-full w-full" />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[9px] sm:text-[11px] font-bold uppercase tracking-wider sm:tracking-widest text-muted-foreground">Espaço Utilizado</span>
                  <span className="text-xs sm:text-sm font-black text-primary tabular-nums whitespace-nowrap">{used} {unit}</span>
                </div>
                <div className="h-1 sm:h-1.5 w-full bg-muted/30 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full transition-all duration-1000 ease-out" 
                    style={{ width: `${percentage}%` }} 
                  />
                </div>
              </div>

              {reserved > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[9px] sm:text-[11px] font-bold uppercase tracking-wider sm:tracking-widest text-muted-foreground">Reservado</span>
                    <span className="text-xs sm:text-sm font-bold text-amber-600 tabular-nums whitespace-nowrap">{reserved} {unit}</span>
                  </div>
                  <div className="h-1 sm:h-1.5 w-full bg-muted/30 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-600 rounded-full" style={{ width: `${total > 0 ? Math.round((reserved / total) * 100) : 0}%` }} />
                  </div>
                </div>
              )}

              {blocked > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[9px] sm:text-[11px] font-bold uppercase tracking-wider sm:tracking-widest text-muted-foreground">Bloqueado</span>
                    <span className="text-xs sm:text-sm font-bold text-destructive tabular-nums whitespace-nowrap">{blocked} {unit}</span>
                  </div>
                  <div className="h-1 sm:h-1.5 w-full bg-muted/30 rounded-full overflow-hidden">
                    <div className="h-full bg-destructive rounded-full" style={{ width: `${total > 0 ? Math.round((blocked / total) * 100) : 0}%` }} />
                  </div>
                </div>
              )}

              <div className="pt-3 sm:pt-4 mt-2 sm:mt-4 border-t border-border/10">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[9px] sm:text-[11px] font-bold uppercase tracking-wider sm:tracking-widest text-muted-foreground">Livre</span>
                  <span className="text-xs sm:text-sm font-bold text-foreground/70 tabular-nums whitespace-nowrap">{Math.max(0, total - used - reserved - blocked)} {unit}</span>
                </div>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

OccupationChart.displayName = 'OccupationChart';
