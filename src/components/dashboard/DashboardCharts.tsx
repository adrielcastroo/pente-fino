import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity, Download, Eye, Package } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as ChartTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, CartesianGrid,
} from 'recharts';
import { usePerformance } from '@/hooks/use-performance';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

// Paleta sky/teal coerente — sem violeta
const CHART_COLORS = [
  'hsl(var(--primary))',
  '#0EA5E9', // sky-500
  '#0D9488', // teal-600
  '#0369A1', // sky-700
  '#14B8A6', // teal-500
  '#38BDF8', // sky-400
];

const CustomTooltip = ({ active, payload, label, prefix = '', suffix = '' }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="rounded-md border border-border/60 bg-card/95 backdrop-blur p-3 shadow-sm">
        <p className="text-xs font-medium text-muted-foreground mb-2 border-b border-border/40 pb-1.5">
          {label || data.name}
        </p>
        <div className="flex flex-col gap-1.5">
          {payload.map((p: any, i: number) => (
            <div key={i} className="flex items-center justify-between gap-6">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: p.color }} />
                <span className="text-xs text-muted-foreground">{p.name}:</span>
              </div>
              <span className="text-xs font-semibold tabular-nums" style={{ color: p.color }}>
                {prefix}{p.value}{suffix}
              </span>
            </div>
          ))}
          {data.inspectors && (
            <div className="mt-1.5 pt-1.5 border-t border-border/40">
              <span className="text-[10px] text-muted-foreground block mb-0.5">Responsáveis:</span>
              <span className="text-xs font-medium text-primary truncate max-w-[200px]">{data.inspectors}</span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

export const TimelineChart = React.memo(({ data, onExport, onDetailClick, id, periodLabel }: any) => {
  const { isLow } = usePerformance();
  const processedData = useMemo(() => isLow ? data.slice(-10) : data, [data, isLow]);

  return (
    <Card id={id} className="md:col-span-3 border border-border/40 bg-card/50 shadow-none overflow-hidden rounded-lg">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-4 gap-3 border-b border-border/30">
        <div>
          <CardTitle className="text-sm font-semibold tracking-tight">
            Volume de operações
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            {periodLabel || 'Histórico de conferências por período'}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {onDetailClick && (
            <Button variant="outline" size="icon" className="h-8 w-8 rounded-md" onClick={() => onDetailClick({ title: 'Volume de operações', data, type: 'area' })}>
              <Eye className="w-3.5 h-3.5" strokeWidth={1.75} />
            </Button>
          )}
          <Button variant="outline" size="icon" className="h-8 w-8 rounded-md" onClick={() => onExport(data, 'Timeline_Operacoes')}>
            <Download className="w-3.5 h-3.5" strokeWidth={1.75} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-6 pt-6 h-[360px] min-h-[300px]">
        {processedData.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <Activity className="w-8 h-8 opacity-30" strokeWidth={1.5} />
            <p className="text-sm font-medium">Nenhuma conferência no período</p>
            <p className="text-xs text-muted-foreground/70">Os dados aparecerão aqui após as primeiras bipagens</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={processedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border) / 0.5)" />
              <XAxis dataKey="name" fontSize={10} tick={{ fill: 'hsl(var(--muted-foreground))' }} interval="preserveStartEnd" />
              <YAxis fontSize={10} tick={{ fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
              <ChartTooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--primary) / 0.05)' }} />
              <Area type="monotone" dataKey="total" stroke="hsl(var(--primary))" strokeWidth={2} fill="hsl(var(--primary) / 0.1)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
});

export const SummaryChart = React.memo(({ title, desc, data, type, icon: Icon, onDetailClick, chartKey, id }: any) => {
  const isMobile = useIsMobile();
  // Top 5 ordenados desc — evita poluição visual e escalas distorcidas
  const displayData = useMemo(() => {
    if (!Array.isArray(data)) return [];
    return [...data]
      .sort((a: any, b: any) => (Number(b?.[chartKey]) || 0) - (Number(a?.[chartKey]) || 0))
      .slice(0, 5);
  }, [data, chartKey]);

  return (
    <Card id={id} className="border border-border/40 bg-card/50 shadow-none overflow-hidden rounded-lg">
      <CardHeader className="px-5 py-4 flex flex-row items-start justify-between border-b border-border/30">
        <div>
          <CardTitle className="text-sm font-semibold tracking-tight">{title}</CardTitle>
          {desc && <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-md hover:bg-muted/40"
          onClick={() => onDetailClick({ title, data, type })}
        >
          <Eye className="w-3.5 h-3.5" strokeWidth={1.75} />
        </Button>
      </CardHeader>
      <CardContent className={cn("px-4 sm:px-5 pb-5 pt-5", isMobile ? "min-h-[300px]" : "h-[340px] min-h-[300px]")}>

        {(!displayData || displayData.length === 0) ? (
          <div className="h-full min-h-[120px] flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <Icon className="w-7 h-7 opacity-30" strokeWidth={1.5} />
            <p className="text-sm font-medium">Sem dados ainda</p>
          </div>
        ) : type === 'bar' ? (
          // Lista ranqueada com progress bar — substitui barras horizontais
          // (resolve overflow, labels cortados e escala distorcida)
          (() => {
            const max = Math.max(...displayData.map((d: any) => Number(d[chartKey]) || 0), 1);
            return (
              <ul className="flex flex-col gap-3 py-1 h-full overflow-y-auto">
                {displayData.map((d: any, i: number) => {
                  const v = Number(d[chartKey]) || 0;
                  const pct = Math.round((v / max) * 100);
                  const color = CHART_COLORS[i % CHART_COLORS.length];
                  const fullName = String(d.name ?? '');
                  return (
                    <li key={i} className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between text-xs gap-3">
                        <span
                          className="truncate text-foreground/85 font-medium"
                          title={fullName}
                        >
                          {fullName}
                        </span>
                        <span className="tabular-nums text-muted-foreground shrink-0">{v}</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted/40 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, backgroundColor: color }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            );
          })()
        ) : isMobile ? (
          (() => {
            const max = Math.max(...displayData.map((d: any) => Number(d[chartKey]) || 0), 1);
            return (
              <ul className="flex flex-col gap-2.5 py-2">
                {displayData.map((d: any, i: number) => {
                  const v = Number(d[chartKey]) || 0;
                  const pct = Math.round((v / max) * 100);
                  const color = CHART_COLORS[i % CHART_COLORS.length];
                  return (
                    <li key={i} className="flex flex-col gap-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="truncate text-foreground/80 font-medium" title={String(d.name ?? '')}>{d.name}</span>
                        <span className="tabular-nums text-muted-foreground">{v}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted/40 overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            );
          })()
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={displayData} dataKey={chartKey} innerRadius="60%" outerRadius="85%" stroke="transparent">
                {displayData.map((_: any, i: number) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <ChartTooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        )}
        {/* Legenda HTML custom para pie */}
        {!isMobile && type === 'pie' && displayData.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 pt-3 -mb-2">
            {displayData.map((d: any, i: number) => (
              <div key={i} className="flex items-center gap-1.5 text-[11px]">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                <span className="text-muted-foreground" title={String(d.name ?? '')}>{d.name}</span>
                <span className="tabular-nums font-medium text-foreground/80">{Number(d[chartKey]) || 0}</span>
              </div>
            ))}
          </div>
        )}

      </CardContent>
    </Card>
  );
});

export const OccupationChart = React.memo(({ title, used, total, reserved = 0, blocked = 0, unit = 'alocações', id }: any) => {
  const percentage = total > 0 ? Math.round((used / total) * 100) : 0;
  const isEmpty = total === 0 || (used === 0 && reserved === 0 && blocked === 0);
  const isMobile = useIsMobile();
  const rawData = [
    { name: 'Ocupado', value: used, color: 'hsl(var(--primary))' },
    { name: 'Reservado', value: reserved, color: 'hsl(38 92% 50%)' },
    { name: 'Bloqueado', value: blocked, color: 'hsl(var(--destructive))' },
    { name: 'Livre', value: Math.max(0, total - used - reserved - blocked), color: 'hsl(var(--muted) / 0.3)' }
  ];
  const data = rawData.filter(d => d.name === 'Ocupado' || d.name === 'Livre' || d.value > 0);

  return (
    <Card id={id} className="border border-border/40 bg-card/50 shadow-none overflow-hidden rounded-lg">
      <CardHeader className="px-5 py-4 border-b border-border/30">
        <CardTitle className="text-sm font-medium flex items-center gap-2.5 tracking-tight">
          <div className={cn("p-1.5 rounded-md", isEmpty ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary")}>
            <Package className="w-4 h-4" strokeWidth={1.75} />
          </div>
          <span className={cn(isEmpty && "text-muted-foreground")}>{title}</span>
        </CardTitle>
      </CardHeader>
      {isEmpty ? (
        <CardContent className="p-6 flex flex-col items-center justify-center text-center gap-2 min-h-[180px]">
          <Package className="w-8 h-8 text-muted-foreground/40" strokeWidth={1.5} />
          <p className="text-sm font-medium text-muted-foreground">Setor inativo</p>
          <p className="text-xs text-muted-foreground/70">Nenhuma alocação registrada</p>
        </CardContent>
      ) : (
      <CardContent className={cn("flex flex-col items-center gap-5", isMobile ? "p-4" : "p-6 gap-6")}>
        {isMobile ? (
          <div className="w-full space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-bold tabular-nums text-foreground">{percentage}%</span>
              <span className="text-xs font-medium text-muted-foreground">Ocupado</span>
            </div>
            <div className="h-2 rounded-full bg-muted/40 overflow-hidden flex">
              {data.filter(d => d.name !== 'Livre').map((d, i) => {
                const pct = total > 0 ? (d.value / total) * 100 : 0;
                return <div key={i} className="h-full transition-all" style={{ width: `${pct}%`, backgroundColor: d.color }} />;
              })}
            </div>
          </div>
        ) : (
          <div className="relative w-[200px] h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} innerRadius="68%" outerRadius="95%" dataKey="value" startAngle={90} endAngle={450} isAnimationActive>
                  {data.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                </Pie>
                <ChartTooltip content={<CustomTooltip suffix={` ${unit}`} />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-bold tabular-nums text-foreground">{percentage}%</span>
              <span className="text-xs text-muted-foreground mt-0.5">Ocupado</span>
            </div>
          </div>
        )}
        <div className="w-full space-y-2">
          {data.map((d, i) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 text-muted-foreground font-medium">
                <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: d.color }} />
                {d.name}
              </span>
              <span className="text-foreground tabular-nums">{d.value} {unit}</span>
            </div>
          ))}
        </div>
      </CardContent>
      )}
    </Card>
  );
});

TimelineChart.displayName = 'TimelineChart';
SummaryChart.displayName = 'SummaryChart';
OccupationChart.displayName = 'OccupationChart';
