import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, CalendarRange, Users, ListChecks, Package, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Conference } from '@/types';
import { normalizeConferente } from '@/lib/dashboard-utils';

interface Props {
  history: Conference[];
}

type PeriodDays = 7 | 30 | 90;

interface PeriodMetrics {
  conferencias: number;
  registros: number;
  conferentes: number;
  avgDurationMin: number;
}

function computeMetrics(history: Conference[], start: Date, end: Date): PeriodMetrics {
  const subset = history.filter(h => {
    const d = h.date ? new Date(h.date) : null;
    if (!d || isNaN(d.getTime())) return false;
    return d >= start && d <= end;
  });
  const TWELVE_H = 12 * 60 * 60 * 1000;
  const durations = subset
    .filter(h => h.startedAt && h.finishedAt)
    .map(h => Math.abs(new Date(h.finishedAt!).getTime() - new Date(h.startedAt!).getTime()))
    .filter(d => d > 0 && d <= TWELVE_H);
  const avgMs = durations.length ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
  return {
    conferencias: subset.length,
    registros: subset.reduce((acc, h) => acc + h.registros.length, 0),
    conferentes: new Set(subset.map(h => normalizeConferente(h.conferente))).size,
    avgDurationMin: Math.round(avgMs / 60000),
  };
}

function formatDelta(current: number, previous: number): { pct: number; trend: 'up' | 'down' | 'flat'; capped: boolean } {
  if (previous === 0 && current === 0) return { pct: 0, trend: 'flat', capped: false };
  if (previous === 0) return { pct: 999, trend: 'up', capped: true };
  const diff = ((current - previous) / previous) * 100;
  const rounded = Math.round(diff);
  const abs = Math.abs(rounded);
  const capped = abs > 999;
  return { pct: capped ? 999 : abs, trend: rounded > 0 ? 'up' : rounded < 0 ? 'down' : 'flat', capped };
}

const fmtRange = (start: Date, end: Date) => {
  const f = (d: Date) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
  return `${f(start)} – ${f(end)}`;
};

const fmtDuration = (mins: number) => {
  if (mins === 0) return '—';
  if (mins < 1) return '< 1min';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}min` : `${m}min`;
};

const METRICS = [
  { key: 'conferencias', label: 'Conferências', icon: ListChecks, isDuration: false },
  { key: 'registros', label: 'Itens bipados', icon: Package, isDuration: false },
  { key: 'conferentes', label: 'Conferentes', icon: Users, isDuration: false },
  { key: 'avgDurationMin', label: 'Duração média', icon: Clock, isDuration: true },
] as const;

export function PeriodComparisonCard({ history }: Props) {
  const [days, setDays] = useState<PeriodDays>(7);

  const { current, previous, currentRange, previousRange } = useMemo(() => {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const start = new Date(end);
    start.setDate(start.getDate() - (days - 1));
    start.setHours(0, 0, 0, 0);

    const prevEnd = new Date(start);
    prevEnd.setDate(prevEnd.getDate() - 1);
    prevEnd.setHours(23, 59, 59, 999);
    const prevStart = new Date(prevEnd);
    prevStart.setDate(prevStart.getDate() - (days - 1));
    prevStart.setHours(0, 0, 0, 0);

    return {
      current: computeMetrics(history, start, end),
      previous: computeMetrics(history, prevStart, prevEnd),
      currentRange: fmtRange(start, end),
      previousRange: fmtRange(prevStart, prevEnd),
    };
  }, [history, days]);

  return (
    <Card className="border-border/40 bg-card/50 shadow-none">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3">
        <div>
          <CardTitle className="text-sm font-semibold tracking-tight">
            Comparação período a período
          </CardTitle>
          <p className="text-xs text-muted-foreground tabular-nums mt-0.5">
            {currentRange} <span className="text-muted-foreground/60">vs</span> {previousRange}
          </p>
        </div>

        <div role="tablist" aria-label="Selecionar período" className="flex gap-0.5 p-0.5 rounded-md bg-muted/40 border border-border/30 self-start sm:self-auto">
          {([7, 30, 90] as PeriodDays[]).map(d => (
            <Button
              key={d}
              role="tab"
              aria-selected={days === d}
              variant={days === d ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setDays(d)}
              className={cn(
                'h-9 md:h-9 px-3 text-xs font-medium rounded',
                days === d ? '' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {d}d
            </Button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          {METRICS.map(m => {
            const curr = current[m.key];
            const prev = previous[m.key];
            const { pct, trend, capped } = formatDelta(curr, prev);
            const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

            const isPositive = m.isDuration ? trend === 'down' : trend === 'up';
            const isNegative = m.isDuration ? trend === 'up' : trend === 'down';
            const trendColor =
              trend === 'flat'
                ? 'bg-muted text-muted-foreground'
                : isPositive
                ? 'bg-emerald-500/10 text-success dark:text-success'
                : isNegative
                ? 'bg-rose-500/10 text-destructive dark:text-destructive'
                : 'bg-muted text-muted-foreground';

            
            const display = m.isDuration ? fmtDuration(curr) : curr.toLocaleString('pt-BR');
            const prevDisplay = m.isDuration ? fmtDuration(prev) : prev.toLocaleString('pt-BR');
            const deltaLabel = trend === 'flat'
              ? '—'
              : capped
                ? (trend === 'up' ? '+999%' : '−999%')
                : `${trend === 'down' ? '−' : '+'}${pct}%`;

            return (
              <div
                key={m.key}
                className="rounded-md border border-slate-200 dark:border-border/30 bg-white dark:bg-background/40 p-4 hover:border-border/60 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-muted-foreground truncate">{m.label}</span>
                  <Badge
                    variant="secondary"
                    className={cn('gap-0.5 font-medium text-[10px] px-1.5 py-0 h-5 border-none rounded tabular-nums', trendColor)}
                    title={capped ? `Variação real: ${prev === 0 ? 'sem base anterior' : `${trend === 'down' ? '−' : '+'}${Math.round(Math.abs(((curr - prev) / prev) * 100))}%`}` : undefined}
                  >
                    <TrendIcon className="w-3 h-3" strokeWidth={2} />
                    {deltaLabel}
                  </Badge>
                </div>
                <p className="text-3xl font-bold text-foreground tracking-tight tabular-nums leading-none">{display}</p>
                <p className="text-[11px] text-muted-foreground/80 mt-2">
                  Anterior <span className="tabular-nums">{prevDisplay}</span>
                </p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default PeriodComparisonCard;
