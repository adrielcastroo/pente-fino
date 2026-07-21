import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { CalendarClock, Loader2, PlayCircle, CheckCircle2, XCircle, MinusCircle, Save, KeyRound } from 'lucide-react';

const DESTINOS: string[] = ['18', '20', 'EMBALAGE', 'ESPE.1', 'ESPE.2', 'PH', 'PVT'];

const PRESETS: { label: string; expr: string }[] = [
  { label: 'Seg–Sex 07:00 BRT', expr: '0 10 * * 1-5' },
  { label: 'Seg–Sex 06:00 BRT', expr: '0 9 * * 1-5' },
  { label: 'Seg–Sex 08:00 BRT', expr: '0 11 * * 1-5' },
  { label: 'Todo dia 07:00 BRT', expr: '0 10 * * *' },
];


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

export default function NecessidadeCronCard() {
  const [running, setRunning] = useState(false);
  const [lastRun, setLastRun] = useState<Run | null>(null);
  const [cronExpr, setCronExpr] = useState<string>('0 10 * * 1-5');
  const [cronCurrent, setCronCurrent] = useState<string>('');
  const [savingCron, setSavingCron] = useState(false);

  const carregarCron = async () => {
    const { data } = await (supabase as any).rpc('get_necessidade_cron');
    const row = Array.isArray(data) ? data[0] : data;
    if (row?.schedule) {
      setCronCurrent(row.schedule);
      setCronExpr(row.schedule);
    }
  };

  const salvarCron = async () => {
    if (!cronExpr.trim()) { toast.error('Informe uma expressão cron.'); return; }
    setSavingCron(true);
    const t = toast.loading('Atualizando agendamento…');
    try {
      const { error } = await (supabase as any).rpc('set_necessidade_cron', { cron_expr: cronExpr.trim() });
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

  const resultados: ResultItem[] = lastRun?.detalhes?.resultados ?? [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarClock className="h-4 w-4 text-primary" /> Agendamento — Necessidade Automática
            </CardTitle>
            <CardDescription className="mt-1">
              Roda de <strong>segunda a sexta</strong> às <strong>07:00 (BRT)</strong> e gera rascunhos
              no Auge com origem sempre <span className="font-mono">01 — Central</span>. Só entram itens
              com <strong>saldo em 01 &gt; 0</strong>. Para <span className="font-mono">PVT</span> gera
              dois rascunhos: <strong>Tecidos</strong> (códigos <span className="font-mono">TC.*</span>)
              e <strong>Outros</strong>.
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
      <CardContent className="space-y-3">
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
