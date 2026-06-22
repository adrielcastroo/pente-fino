import { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Clock, ListChecks, Calendar, AlertTriangle, Activity } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Tooltip as RTooltip, XAxis } from 'recharts';
import type { Conference } from '@/types';
import { normalizeConferente } from '@/lib/dashboard-utils';
import { formatDateBR, formatTimeBR } from '@/lib/app-utils';

interface Props {
  conferente: string | null;
  history: Conference[];
  onClose: () => void;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] || '').concat(parts[1]?.[0] || '').toUpperCase() || '?';
}

function formatDurationMs(ms: number): string {
  if (!ms || ms <= 0) return '—';
  const mins = Math.floor(ms / 60000);
  const h = Math.floor(mins / 60);
  if (h > 0) return `${h}h ${mins % 60}min`;
  if (mins < 1) return '< 1min';
  return `${mins}min`;
}

export function ConferenteProfileDialog({ conferente, history, onClose }: Props) {
  const data = useMemo(() => {
    if (!conferente) return null;
    const target = normalizeConferente(conferente);
    const sessions = history.filter(h => normalizeConferente(h.conferente) === target);

    const totalRegistros = sessions.reduce((a, s) => a + s.registros.length, 0);
    const totalSessoes = sessions.length;

    const durations = sessions
      .filter(s => s.startedAt && s.finishedAt)
      .map(s => Math.abs(new Date(s.finishedAt!).getTime() - new Date(s.startedAt!).getTime()));
    const avgMs = durations.length ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;

    // Sparkline: últimos 14 dias
    const sparkline: { day: string; total: number }[] = [];
    const today = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const total = sessions
        .filter(s => (s.date || '').slice(0, 10) === key)
        .reduce((a, s) => a + s.registros.length, 0);
      sparkline.push({ day: `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`, total });
    }

    // Anomalias: sessões com duração > 2x a média
    const anomalyThreshold = avgMs * 2;
    const recentSessions = [...sessions]
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
      .slice(0, 8)
      .map(s => {
        const dur = s.startedAt && s.finishedAt
          ? Math.abs(new Date(s.finishedAt).getTime() - new Date(s.startedAt).getTime())
          : 0;
        return { ...s, durationMs: dur, isAnomaly: anomalyThreshold > 0 && dur > anomalyThreshold };
      });

    const lastActivity = sessions[0]?.date || '';

    return {
      name: target,
      totalRegistros,
      totalSessoes,
      avgDuration: formatDurationMs(avgMs),
      lastActivity,
      sparkline,
      recentSessions,
      anomaliesCount: recentSessions.filter(s => s.isAnomaly).length,
    };
  }, [conferente, history]);

  return (
    <Dialog open={!!conferente} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="w-[95vw] sm:max-w-2xl md:max-w-3xl h-[92dvh] md:h-[88dvh] lg:h-[85dvh] p-0 gap-0 overflow-hidden flex flex-col">
        <DialogHeader className="px-4 sm:px-6 pt-5 pb-4 border-b border-border/20 flex-none space-y-0">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-md bg-primary/10 text-primary flex items-center justify-center text-lg font-semibold border border-primary/20 flex-none">
              {data ? getInitials(data.name) : <User className="w-6 h-6" />}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <DialogTitle className="text-xl font-semibold tracking-tight truncate">
                {data?.name || 'Conferente'}
              </DialogTitle>
              <DialogDescription className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Perfil do conferente · histórico operacional
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
        {data && (
          <div className="space-y-6">
            {/* KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <KpiCard icon={ListChecks} label="Registros" value={data.totalRegistros} />
              <KpiCard icon={Activity} label="Sessões" value={data.totalSessoes} />
              <KpiCard icon={Clock} label="Tempo Médio" value={data.avgDuration} />
              <KpiCard icon={Calendar} label="Última Ativ." value={formatDateBR(data.lastActivity) || '—'} />
            </div>

            {/* Sparkline 14d */}
            <div className="rounded-md border border-border/40 bg-muted/20 p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Produção · 14 dias</span>
                <span className="text-xs font-bold text-primary tabular-nums">
                  {data.sparkline.reduce((a, b) => a + b.total, 0)} registros
                </span>
              </div>
              <div className="h-24">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.sparkline} margin={{ top: 5, right: 5, left: 5, bottom: 0 }}>
                    <XAxis dataKey="day" fontSize={9} tick={{ fill: 'hsl(var(--foreground) / 0.4)' }} interval="preserveStartEnd" />
                    <Area type="monotone" dataKey="total" stroke="hsl(var(--primary))" strokeWidth={2} fill="hsl(var(--primary) / 0.15)" />
                    <RTooltip
                      contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                      labelStyle={{ color: 'hsl(var(--muted-foreground))', fontWeight: 700 }}
                      formatter={(v: number) => [`${v} registros`, '']}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Últimas sessões */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Últimas sessões</span>
                {data.anomaliesCount > 0 && (
                  <Badge variant="outline" className="border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/5 text-[10px] font-bold gap-1">
                    <AlertTriangle className="w-3 h-3" /> {data.anomaliesCount} anormais
                  </Badge>
                )}
              </div>
              <div className="space-y-2">
                {data.recentSessions.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-6">Sem sessões registradas</p>
                )}
                {data.recentSessions.map(s => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between gap-3 rounded-md border border-border/30 bg-card/40 px-4 py-3 hover:border-primary/30 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold truncate">{s.processo || s.name}</p>
                      <p className="text-[11px] text-muted-foreground font-mono">
                        {formatDateBR(s.date)} · {formatTimeBR(s.startedAt)} → {formatTimeBR(s.finishedAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-none">
                      {s.isAnomaly && (
                        <span title="Duração acima do dobro da média">
                          <AlertTriangle className="w-4 h-4 text-amber-500" />
                        </span>
                      )}
                      <Badge variant="outline" className="text-[10px] font-bold font-mono">
                        {formatDurationMs(s.durationMs)}
                      </Badge>
                      <span className="text-lg font-semibold text-primary tabular-nums min-w-[2.5rem] text-right">
                        {s.registros.length}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        </div>

        <DialogFooter className="px-4 sm:px-6 py-3 border-t border-border/20 bg-muted/20 flex-none">
          <Button variant="default" onClick={onClose} className="w-full sm:w-auto font-bold">
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function KpiCard({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) {
  return (
    <div className="rounded-md border border-border/40 bg-muted/20 p-3 flex flex-col gap-1">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Icon className="w-3.5 h-3.5" />
        <span className="text-[9px] font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <span className="text-lg font-semibold tabular-nums truncate">{value}</span>
    </div>
  );
}
