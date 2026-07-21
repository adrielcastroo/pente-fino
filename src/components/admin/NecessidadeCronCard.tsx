import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { CalendarClock, Loader2, PlayCircle, CheckCircle2, XCircle, MinusCircle, Save, Repeat } from 'lucide-react';

const DESTINOS: string[] = ['18', '20', 'EMBALAGE', 'ESPE.1', 'ESPE.2', 'PH', 'PVT'];

type ResultItem = {
  destino: string;
  tag?: string;
  status: string;
  cdMovimentacao?: string | number;
  itens?: number;
  efetivado?: boolean;
  erro?: string;
};

type Run = {
  id: string;
  finished_at: string | null;
  created_at: string;
  detalhes: any;
  status: string;
};

const WEEKDAYS = [
  { key: 0, label: 'Dom' },
  { key: 1, label: 'Seg' },
  { key: 2, label: 'Ter' },
  { key: 3, label: 'Qua' },
  { key: 4, label: 'Qui' },
  { key: 5, label: 'Sex' },
  { key: 6, label: 'Sáb' },
];

// BRT (UTC-3) -> UTC: add 3 hours
function brtToUtc(hh: number, mm: number, dayBrt?: number, monthBrt?: number, yearBrt?: number) {
  if (dayBrt && monthBrt && yearBrt) {
    const local = new Date(Date.UTC(yearBrt, monthBrt - 1, dayBrt, hh + 3, mm));
    return {
      minute: local.getUTCMinutes(),
      hour: local.getUTCHours(),
      day: local.getUTCDate(),
      month: local.getUTCMonth() + 1,
    };
  }
  let hour = hh + 3;
  let dayShift = 0;
  if (hour >= 24) { hour -= 24; dayShift = 1; }
  return { minute: mm, hour, dayShift };
}

// Parse cron -> UI state (best effort)
function parseCron(expr: string) {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) return null;
  const [m, h, dom, mon, dow] = parts;
  const mi = parseInt(m, 10);
  const hu = parseInt(h, 10);
  if (isNaN(mi) || isNaN(hu)) return null;
  // Convert UTC -> BRT
  let brtH = hu - 3;
  let dayShift = 0;
  if (brtH < 0) { brtH += 24; dayShift = -1; }

  const recurrent = dom === '*' || dow !== '*';
  if (recurrent) {
    let days: number[] = [];
    if (dow === '*') days = [0,1,2,3,4,5,6];
    else if (dow.includes('-')) {
      const [a, b] = dow.split('-').map(n => parseInt(n, 10));
      for (let i = a; i <= b; i++) days.push(i);
    } else {
      days = dow.split(',').map(n => parseInt(n, 10)).filter(n => !isNaN(n));
    }
    // Adjust for dayShift on weekdays
    if (dayShift !== 0) {
      days = days.map(d => (d + dayShift + 7) % 7);
    }
    return { mode: 'recurrent' as const, time: `${String(brtH).padStart(2,'0')}:${String(mi).padStart(2,'0')}`, days };
  }
  return { mode: 'once' as const, time: `${String(brtH).padStart(2,'0')}:${String(mi).padStart(2,'0')}`, day: parseInt(dom,10), month: parseInt(mon,10) };
}

export default function NecessidadeCronCard() {
  const [running, setRunning] = useState(false);
  const [lastRun, setLastRun] = useState<Run | null>(null);
  const [cronCurrent, setCronCurrent] = useState<string>('');
  const [savingCron, setSavingCron] = useState(false);
  const [liveResults, setLiveResults] = useState<ResultItem[]>([]);
  const [liveDestino, setLiveDestino] = useState<string | null>(null);
  const [liveProgress, setLiveProgress] = useState<number>(0);

  // UI state
  const [recurrent, setRecurrent] = useState<boolean>(true);
  const [time, setTime] = useState<string>('07:00');
  const [days, setDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const today = new Date();
  const isoToday = today.toISOString().slice(0, 10);
  const [date, setDate] = useState<string>(isoToday);

  const cronExpr = useMemo(() => {
    const [hStr, mStr] = time.split(':');
    const hh = parseInt(hStr, 10);
    const mm = parseInt(mStr, 10);
    if (isNaN(hh) || isNaN(mm)) return '';

    if (recurrent) {
      if (days.length === 0) return '';
      const conv = brtToUtc(hh, mm);
      const shifted = conv.dayShift ? days.map(d => (d + conv.dayShift + 7) % 7) : days;
      const dowSorted = [...new Set(shifted)].sort((a,b)=>a-b);
      // Detect consecutive range
      let dowStr: string;
      const isRange = dowSorted.length > 1 && dowSorted.every((d, i) => i === 0 || d === dowSorted[i-1] + 1);
      if (dowSorted.length === 7) dowStr = '*';
      else if (isRange) dowStr = `${dowSorted[0]}-${dowSorted[dowSorted.length-1]}`;
      else dowStr = dowSorted.join(',');
      return `${conv.minute} ${conv.hour} * * ${dowStr}`;
    } else {
      const [y, mo, d] = date.split('-').map(n => parseInt(n, 10));
      if (!y || !mo || !d) return '';
      const conv = brtToUtc(hh, mm, d, mo, y);
      return `${conv.minute} ${conv.hour} ${conv.day} ${conv.month} *`;
    }
  }, [recurrent, time, days, date]);

  const carregarCron = async () => {
    const { data } = await (supabase as any).rpc('get_necessidade_cron');
    const row = Array.isArray(data) ? data[0] : data;
    if (row?.schedule) {
      setCronCurrent(row.schedule);
      const parsed = parseCron(row.schedule);
      if (parsed) {
        setTime(parsed.time);
        if (parsed.mode === 'recurrent') {
          setRecurrent(true);
          setDays(parsed.days);
        } else {
          setRecurrent(false);
          const y = new Date().getFullYear();
          setDate(`${y}-${String(parsed.month).padStart(2,'0')}-${String(parsed.day).padStart(2,'0')}`);
        }
      }
    }
  };

  const salvarCron = async () => {
    if (!cronExpr.trim()) { toast.error('Configuração inválida.'); return; }
    setSavingCron(true);
    const t = toast.loading('Atualizando agendamento…');
    try {
      const { error } = await (supabase as any).rpc('set_necessidade_cron', { cron_expr: cronExpr });
      if (error) { toast.error(error.message ?? 'Falha ao salvar cron.', { id: t }); return; }
      toast.success('Agendamento atualizado.', { id: t });
      await carregarCron();
    } finally {
      setSavingCron(false);
    }
  };

  const carregarUltimaRun = async () => {
    const { data } = await (supabase as any)
      .from('auge_sync_runs')
      .select('id, finished_at, created_at, detalhes, status')
      .eq('entidade', 'transferencias')
      .filter('detalhes->>action', 'eq', 'necessidade_cron_run')
      .order('created_at', { ascending: false })
      .limit(1);
    setLastRun(data?.[0] ?? null);
  };

  useEffect(() => { carregarUltimaRun(); carregarCron(); }, []);

  const executarAgora = async () => {
    setRunning(true);
    const t = toast.loading('Gerando rascunhos no Auge para todos os depósitos…');
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;
      const anon = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY) as string;
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auge-sync?action=necessidade_cron_run`;
      const r = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: anon,
          Authorization: `Bearer ${token ?? anon}`,
        },
        body: JSON.stringify({}),
      });
      const j = await r.json();
      if (!j?.ok) {
        toast.error(j?.error ?? 'Falha ao executar necessidade automática.', { id: t });
        return;
      }
      const ok = (j.resultados as ResultItem[]).filter(x => x.status === 'ok').length;
      toast.success(`${ok} rascunho(s) gerado(s).`, { id: t });
      await carregarUltimaRun();
    } finally {
      setRunning(false);
    }
  };

  const toggleDay = (d: number) => {
    setDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
  };

  const resultados: ResultItem[] = lastRun?.detalhes?.resultados ?? [];
  const changed = cronExpr && cronExpr !== cronCurrent.trim();

  const resumo = useMemo(() => {
    if (!cronExpr) return 'Configuração incompleta';
    if (recurrent) {
      if (days.length === 0) return 'Selecione ao menos um dia';
      const labels = [...days].sort((a,b)=>a-b).map(d => WEEKDAYS[d].label).join(', ');
      return `Recorrente: ${labels} às ${time} (BRT)`;
    }
    const [y, mo, d] = date.split('-');
    return `Uma vez: ${d}/${mo}/${y} às ${time} (BRT)`;
  }, [cronExpr, recurrent, days, time, date]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarClock className="h-4 w-4 text-primary" /> Agendamento — Necessidade Automática
            </CardTitle>
            <CardDescription className="mt-1">
              Gera rascunhos no Auge com origem sempre <span className="font-mono">01 — Central</span>.
              Só entram itens com <strong>saldo em 01 &gt; 0</strong>.
            </CardDescription>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {DESTINOS.map(d => (
                <Badge key={d} variant="secondary" className="font-mono text-[10px]">{d}</Badge>
              ))}
            </div>
          </div>
          <Button onClick={executarAgora} disabled={running} className="gap-2 h-10 shrink-0">
            {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4" />}
            Executar agora
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md border p-4 space-y-4 bg-muted/10">
          {/* Recurrence toggle */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Repeat className="h-4 w-4 text-muted-foreground" />
              <div>
                <Label className="text-sm">Recorrente</Label>
                <p className="text-[11px] text-muted-foreground">
                  {recurrent ? 'Repete nos dias selecionados' : 'Executa uma única vez na data escolhida'}
                </p>
              </div>
            </div>
            <Switch checked={recurrent} onCheckedChange={setRecurrent} />
          </div>

          {/* Time + Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Horário (BRT)</Label>
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="h-10" />
            </div>
            {!recurrent && (
              <div className="space-y-1.5">
                <Label className="text-xs">Data</Label>
                <Input type="date" value={date} min={isoToday} onChange={(e) => setDate(e.target.value)} className="h-10" />
              </div>
            )}
          </div>

          {/* Weekday chips */}
          {recurrent && (
            <div className="space-y-1.5">
              <Label className="text-xs">Dias da semana</Label>
              <div className="flex flex-wrap gap-1.5">
                {WEEKDAYS.map(w => {
                  const active = days.includes(w.key);
                  return (
                    <Button
                      key={w.key}
                      type="button"
                      size="sm"
                      variant={active ? 'default' : 'outline'}
                      className="h-8 min-w-[52px] text-xs"
                      onClick={() => toggleDay(w.key)}
                    >
                      {w.label}
                    </Button>
                  );
                })}
                <Button type="button" size="sm" variant="ghost" className="h-8 text-[11px]"
                  onClick={() => setDays([1,2,3,4,5])}>Seg–Sex</Button>
                <Button type="button" size="sm" variant="ghost" className="h-8 text-[11px]"
                  onClick={() => setDays([0,1,2,3,4,5,6])}>Todos</Button>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t">
            <div className="text-[11px] text-muted-foreground">
              {resumo}
              {cronExpr && <span className="ml-2 font-mono text-foreground/70">({cronExpr} UTC)</span>}
            </div>
            <Button onClick={salvarCron} disabled={savingCron || !changed} size="sm" className="gap-1.5 h-9">
              {savingCron ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Salvar agendamento
            </Button>
          </div>
          {cronCurrent && (
            <p className="text-[10px] text-muted-foreground">
              Cron atual salvo: <span className="font-mono text-foreground">{cronCurrent}</span>
            </p>
          )}
        </div>

        {!lastRun && (
          <div className="rounded-md border bg-muted/20 px-3 py-6 text-center text-xs text-muted-foreground">
            Nenhuma execução automática registrada ainda.
          </div>
        )}
        {lastRun && (
          <>
            <div className="text-[11px] text-muted-foreground">
              Última execução:{' '}
              <span className="font-mono text-foreground">
                {new Date(lastRun.finished_at ?? lastRun.created_at).toLocaleString('pt-BR')}
              </span>
            </div>
            <div className="rounded-md border overflow-auto">
              <table className="w-full text-xs">
                <thead className="bg-card text-muted-foreground">
                  <tr>
                    <th className="px-2 py-2 text-left">Destino</th>
                    <th className="px-2 py-2 text-left">Tag</th>
                    <th className="px-2 py-2 text-left">Status</th>
                    <th className="px-2 py-2 text-right">Itens</th>
                    <th className="px-2 py-2 text-left">Rascunho</th>
                    <th className="px-2 py-2 text-left">Erro</th>
                  </tr>
                </thead>
                <tbody>
                  {resultados.map((r, i) => (
                    <tr key={i} className="border-t">
                      <td className="px-2 py-1.5 font-mono">{r.destino}</td>
                      <td className="px-2 py-1.5 text-muted-foreground">{r.tag ?? '—'}</td>
                      <td className="px-2 py-1.5">
                        {r.status === 'ok' && <Badge variant="secondary" className="gap-1"><CheckCircle2 className="h-3 w-3 text-emerald-500" /> ok</Badge>}
                        {r.status === 'sem_itens' && <Badge variant="outline" className="gap-1"><MinusCircle className="h-3 w-3" /> sem itens</Badge>}
                        {(r.status === 'erro' || r.status === 'erro_listar') && <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> {r.status}</Badge>}
                      </td>
                      <td className="px-2 py-1.5 text-right font-mono">{r.itens ?? '—'}</td>
                      <td className="px-2 py-1.5 font-mono text-primary">{r.cdMovimentacao ?? '—'}</td>
                      <td className="px-2 py-1.5 text-destructive text-[11px] truncate max-w-[240px]" title={r.erro}>{r.erro ?? ''}</td>
                    </tr>
                  ))}
                  {!resultados.length && (
                    <tr><td colSpan={6} className="px-3 py-4 text-center text-muted-foreground">Sem detalhes.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
