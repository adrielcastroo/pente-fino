import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CalendarDays } from '@/components/icons';
import { cn } from '@/lib/utils';
import { formatDateBR } from '@/lib/app-utils';

interface HistoryItem {
  date: string;
  registros: unknown[];
}

interface SessionsHeatmapProps {
  history: HistoryItem[];
  weeks?: number;
  onDayClick?: (dateISO: string) => void;
}

const WEEK_DAY_LABELS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const MONTH_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function SessionsHeatmap({ history, weeks = 12, onDayClick }: SessionsHeatmapProps) {
  const [selected, setSelected] = useState<string | null>(null);

  const { grid, monthMarkers, max, totalSessions, activeDays } = useMemo(() => {
    // Aggregate sessions & registros per day
    const byDay = new Map<string, { sessions: number; registros: number }>();
    history.forEach(conf => {
      if (!conf.date) return;
      const iso = conf.date.slice(0, 10);
      const cur = byDay.get(iso) ?? { sessions: 0, registros: 0 };
      cur.sessions += 1;
      cur.registros += conf.registros?.length ?? 0;
      byDay.set(iso, cur);
    });

    // Build grid: columns = weeks, rows = 7 days (Sun..Sat)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const totalDays = weeks * 7;
    // Align end of grid to the most recent Saturday
    const dayOfWeek = today.getDay(); // 0..6 (Sun..Sat)
    const end = new Date(today);
    end.setDate(end.getDate() + (6 - dayOfWeek));

    const start = new Date(end);
    start.setDate(start.getDate() - (totalDays - 1));

    const cells: { date: string; sessions: number; registros: number; inFuture: boolean }[] = [];
    let maxSessions = 0;
    let total = 0;
    let active = 0;
    for (let i = 0; i < totalDays; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const iso = toISODate(d);
      const data = byDay.get(iso) ?? { sessions: 0, registros: 0 };
      const inFuture = d > today;
      if (!inFuture) {
        total += data.sessions;
        if (data.sessions > 0) active += 1;
        if (data.sessions > maxSessions) maxSessions = data.sessions;
      }
      cells.push({ date: iso, sessions: data.sessions, registros: data.registros, inFuture });
    }

    // Group into columns of 7 (week)
    const cols: typeof cells[] = [];
    for (let w = 0; w < weeks; w++) {
      cols.push(cells.slice(w * 7, w * 7 + 7));
    }

    // Month markers per column (label when the month of the first day differs)
    const markers: { col: number; label: string }[] = [];
    let lastMonth = -1;
    cols.forEach((col, idx) => {
      const firstDay = new Date(col[0].date + 'T00:00:00');
      const m = firstDay.getMonth();
      if (m !== lastMonth) {
        markers.push({ col: idx, label: MONTH_LABELS[m] });
        lastMonth = m;
      }
    });

    return { grid: cols, monthMarkers: markers, max: maxSessions, totalSessions: total, activeDays: active };
  }, [history, weeks]);

  const intensity = (sessions: number): number => {
    if (sessions <= 0 || max <= 0) return 0;
    const ratio = sessions / max;
    if (ratio < 0.25) return 1;
    if (ratio < 0.5) return 2;
    if (ratio < 0.75) return 3;
    return 4;
  };

  const levelClass = (lvl: number, isSelected: boolean): string => {
    const base = 'rounded-[3px] transition-all duration-200 cursor-pointer hover:ring-2 hover:ring-primary/60';
    const sel = isSelected ? 'ring-2 ring-primary scale-110' : '';
    const colors = [
      'bg-muted/40 hover:bg-muted/60',
      'bg-primary/20',
      'bg-primary/40',
      'bg-primary/65',
      'bg-primary/90',
    ];
    return cn(base, colors[lvl] ?? colors[0], sel);
  };

  const handleClick = (iso: string, sessions: number, inFuture: boolean) => {
    if (inFuture) return;
    const next = selected === iso ? null : iso;
    setSelected(next);
    onDayClick?.(iso);
    void sessions;
  };

  return (
    <Card className="h-full border-border/40 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base font-semibold tracking-tight">
              Mapa de Sessões
            </CardTitle>
            <p className="text-xs text-muted-foreground font-bold mt-1">
              Últimas {weeks} semanas · {totalSessions} sessões · {activeDays} dias ativos
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <TooltipProvider delayDuration={100}>
          <div className="flex gap-2">
            {/* Day-of-week labels */}
            <div className="flex flex-col gap-[3px] pt-6 pr-1">
              {WEEK_DAY_LABELS.map((d, i) => (
                <div
                  key={i}
                  className="h-4 text-[9px] leading-4 text-muted-foreground/70 font-bold"
                  style={{ visibility: i % 2 === 1 ? 'visible' : 'hidden' }}
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Grid */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-col gap-1 w-full">
                {/* Month row */}
                <div className="flex gap-[3px] h-4 relative w-full">
                  {grid.map((_, colIdx) => {
                    const marker = monthMarkers.find(m => m.col === colIdx);
                    return (
                      <div key={colIdx} className="flex-1 min-w-0 text-[9px] text-muted-foreground/70 font-bold">
                        {marker?.label ?? ''}
                      </div>
                    );
                  })}
                </div>
                {/* Cells */}
                <div className="flex gap-[3px] w-full">
                  {grid.map((col, colIdx) => (
                    <div key={colIdx} className="flex-1 min-w-0 flex flex-col gap-[3px]">
                      {col.map(cell => {
                        const lvl = intensity(cell.sessions);
                        const isSelected = selected === cell.date;
                        if (cell.inFuture) {
                          return <div key={cell.date} className="aspect-square w-full" />;
                        }
                        return (
                          <Tooltip key={cell.date}>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                aria-label={`${cell.date}: ${cell.sessions} sessões`}
                                className={cn('aspect-square w-full', levelClass(lvl, isSelected))}
                                onClick={() => handleClick(cell.date, cell.sessions, cell.inFuture)}
                              />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs font-bold">
                              <div>{formatDateBR(cell.date)}</div>
                              <div className="text-muted-foreground">
                                {cell.sessions} {cell.sessions === 1 ? 'sessão' : 'sessões'} · {cell.registros} registros
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-border/30 text-[10px] text-muted-foreground font-bold">
            <span>Menos</span>
            {[0, 1, 2, 3, 4].map(lvl => (
              <div key={lvl} className={cn('w-3 h-3 rounded-[3px]', levelClass(lvl, false).split(' ').filter(c => c.startsWith('bg-')).join(' '))} />
            ))}
            <span>Mais</span>
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
