import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { AlertTriangle, Activity, RefreshCw, TrendingUp, BarChart3, ExternalLink } from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';

type PhEvent = {
  id: string;
  event: string;
  timestamp: string;
  distinct_id: string;
  properties?: Record<string, any>;
};
type PhInsight = { id: number; name: string; description?: string; short_id: string };
type PhEventDef = { id: string; name: string; volume_30_day?: number | null };

async function call(params: Record<string, string>) {
  const qs = new URLSearchParams(params).toString();
  const { data, error } = await supabase.functions.invoke(`posthog-analytics?${qs}`, { method: 'GET' });
  if (error) throw error;
  return data;
}

export default function PostHogTab() {
  const [notConfigured, setNotConfigured] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [eventDefs, setEventDefs] = useState<PhEventDef[]>([]);
  const [insights, setInsights] = useState<PhInsight[]>([]);
  const [events, setEvents] = useState<PhEvent[]>([]);
  const [trend, setTrend] = useState<Array<{ label: string; value: number }>>([]);
  const [loading, setLoading] = useState(false);

  const [eventFilter, setEventFilter] = useState<string>('all');
  const [period, setPeriod] = useState<string>('-24h');

  useEffect(() => {
    (async () => {
      try {
        const [defs, ins] = await Promise.all([
          call({ action: 'event_definitions' }),
          call({ action: 'insights' }),
        ]);
        const errMsg = defs?.error ?? ins?.error;
        if (errMsg) {
          if (String(errMsg).includes('não configurados')) setNotConfigured(true);
          else setErr([errMsg, defs?.detail ?? ins?.detail].filter(Boolean).join(' — '));
        }
        setEventDefs(defs?.results ?? []);
        setInsights(ins?.results ?? []);
      } catch (e: any) {
        const msg = e?.message ?? String(e);
        if (msg.includes('não configurados')) setNotConfigured(true);
        else setErr(msg);
      }
    })();
  }, []);

  const load = async () => {
    setLoading(true); setErr(null);
    try {
      const ev = eventFilter !== 'all' ? eventFilter : '';
      const [evs, tr] = await Promise.all([
        call({ action: 'events', period, ...(ev ? { event: ev } : {}), limit: '50' }),
        call({ action: 'trend', period, ...(ev ? { event: ev } : {}) }),
      ]);
      const errMsg = evs?.error ?? tr?.error;
      if (errMsg) setErr([errMsg, evs?.detail ?? tr?.detail].filter(Boolean).join(' — '));
      setEvents(evs?.results ?? []);
      const series = tr?.results?.[0];
      if (series?.labels && series?.data) {
        setTrend(series.labels.map((l: string, i: number) => ({ label: l, value: series.data[i] ?? 0 })));
      } else setTrend([]);
    } catch (e: any) {
      const msg = e?.message ?? String(e);
      if (msg.includes('não configurados')) setNotConfigured(true);
      else setErr(msg);
    } finally { setLoading(false); }
  };

  useEffect(() => { if (!notConfigured) load(); /* eslint-disable-next-line */ }, [eventFilter, period]);

  const topEvents = useMemo(
    () => [...eventDefs].sort((a, b) => (b.volume_30_day ?? 0) - (a.volume_30_day ?? 0)).slice(0, 20),
    [eventDefs],
  );

  if (notConfigured) {
    return (
      <Card className="p-6 border-yellow-500/40 bg-yellow-500/5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
          <div className="space-y-2">
            <h3 className="font-semibold">PostHog ainda não configurado</h3>
            <p className="text-sm text-muted-foreground">
              Configure os secrets <code className="text-xs">POSTHOG_API_KEY</code> (Personal API Key com escopo <code>read</code>), <code className="text-xs">POSTHOG_PROJECT_ID</code> e opcionalmente <code className="text-xs">POSTHOG_HOST</code> (default <code>https://us.posthog.com</code>, use <code>https://eu.posthog.com</code> para EU).
            </p>
            <p className="text-xs text-muted-foreground">
              Crie a key em <a className="underline" href="https://us.posthog.com/settings/user-api-keys" target="_blank" rel="noreferrer">posthog.com/settings/user-api-keys</a>.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controles */}
      <Card className="p-4 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[220px]">
          <label className="text-xs text-muted-foreground">Evento / feature</label>
          <Select value={eventFilter} onValueChange={setEventFilter}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent className="max-h-80">
              <SelectItem value="all">Todos os eventos</SelectItem>
              {topEvents.map((d) => (
                <SelectItem key={d.id} value={d.name}>
                  {d.name} {d.volume_30_day ? `(${d.volume_30_day.toLocaleString('pt-BR')})` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-40">
          <label className="text-xs text-muted-foreground">Período</label>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="-1h">Última 1h</SelectItem>
              <SelectItem value="-6h">Últimas 6h</SelectItem>
              <SelectItem value="-24h">Últimas 24h</SelectItem>
              <SelectItem value="-7d">7 dias</SelectItem>
              <SelectItem value="-30d">30 dias</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="ghost" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-3.5 w-3.5 mr-1 ${loading ? 'animate-spin' : ''}`} /> Atualizar
        </Button>
      </Card>

      {err && (
        <Card className="p-3 border-destructive/40 bg-destructive/5 text-sm text-destructive">{err}</Card>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4">
          <div className="text-xs text-muted-foreground flex items-center gap-1"><Activity className="h-3.5 w-3.5" /> Eventos no período</div>
          <div className="text-2xl font-bold tabular-nums mt-1">{trend.reduce((s, p) => s + p.value, 0).toLocaleString('pt-BR')}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground flex items-center gap-1"><TrendingUp className="h-3.5 w-3.5" /> Eventos distintos</div>
          <div className="text-2xl font-bold tabular-nums mt-1">{eventDefs.length.toLocaleString('pt-BR')}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground flex items-center gap-1"><BarChart3 className="h-3.5 w-3.5" /> Insights salvos</div>
          <div className="text-2xl font-bold tabular-nums mt-1">{insights.length.toLocaleString('pt-BR')}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Última amostra</div>
          <div className="text-2xl font-bold tabular-nums mt-1">{events.length}</div>
        </Card>
      </div>

      {/* Trend */}
      <Card className="p-4">
        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" /> Tendência {eventFilter !== 'all' ? `— ${eventFilter}` : ''}
        </h3>
        {trend.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">Sem dados no período.</div>
        ) : (
          <div className="h-56">
            <ResponsiveContainer>
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', fontSize: 12 }} />
                <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {/* Insights salvos */}
      {insights.length > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" /> Insights do projeto
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {insights.slice(0, 10).map((i) => (
              <a key={i.id} href={`https://us.posthog.com/insights/${i.short_id}`}
                target="_blank" rel="noreferrer"
                className="p-2 border border-border/40 rounded hover:bg-muted/40 flex items-center justify-between text-sm">
                <span className="truncate">{i.name}</span>
                <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground" />
              </a>
            ))}
          </div>
        </Card>
      )}

      {/* Eventos recentes */}
      <Card className="p-0 overflow-hidden">
        <div className="p-3 border-b border-border/40 flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">Eventos recentes</h3>
          <Badge variant="outline" className="ml-auto">{events.length}</Badge>
        </div>
        {loading ? (
          <div className="p-4 space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
        ) : events.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Sem eventos nesse filtro.</div>
        ) : (
          <div className="max-h-[500px] overflow-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/40 sticky top-0">
                <tr className="text-left">
                  <th className="p-2">Quando</th>
                  <th className="p-2">Evento</th>
                  <th className="p-2">Distinct ID</th>
                  <th className="p-2">Rota</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e) => (
                  <tr key={e.id} className="border-t border-border/40 hover:bg-muted/20">
                    <td className="p-2 whitespace-nowrap font-mono text-[10px]">{new Date(e.timestamp).toLocaleString('pt-BR')}</td>
                    <td className="p-2"><Badge variant="outline" className="text-[10px] font-mono">{e.event}</Badge></td>
                    <td className="p-2 truncate max-w-[180px] font-mono text-[10px]">{e.distinct_id}</td>
                    <td className="p-2 truncate max-w-[240px] text-muted-foreground">
                      {e.properties?.$pathname ?? e.properties?.$current_url ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
