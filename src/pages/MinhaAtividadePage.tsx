import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Activity,
  Package,
  LogOut,
  Clock,
  CheckCircle2,
  Calendar,
  ArrowRight,
} from 'lucide-react';

type Conf = { id: string; processo: string | null; conferente: string | null; started_at: string | null; finished_at: string | null; created_at: string };
type Reg = { id: string; item: string | null; nf: string | null; created_at: string; conference_id: string | null };
type Sai = { id: string; item: string | null; estrutura: string; coluna: string; nivel: number; posicao: number; created_at: string };

function fmtTime(iso?: string | null) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  } catch { return '—'; }
}

function fmtDuration(start?: string | null, end?: string | null) {
  if (!start || !end) return '—';
  const diff = Math.abs(new Date(end).getTime() - new Date(start).getTime());
  const mins = Math.floor(diff / 60000);
  const h = Math.floor(mins / 60);
  if (h > 0) return `${h}h ${mins % 60}min`;
  if (mins < 1) return '< 1min';
  return `${mins}min`;
}

export default function MinhaAtividadePage() {
  useDocumentTitle('Minha Atividade');
  const { user, profile } = useAuth();
  const [confs, setConfs] = useState<Conf[]>([]);
  const [regs, setRegs] = useState<Reg[]>([]);
  const [saidas, setSaidas] = useState<Sai[]>([]);
  const [loading, setLoading] = useState(true);

  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'Você';

  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isoStart = today.toISOString();

    (async () => {
      setLoading(true);
      try {
        const [confRes, regRes, saiRes] = await Promise.all([
          supabase
            .from('conferences')
            .select('id, processo, conferente, started_at, finished_at, created_at')
            .eq('created_by', user?.id ?? '00000000-0000-0000-0000-000000000000')
            .gte('created_at', isoStart)
            .order('created_at', { ascending: false }),
          supabase
            .from('registros')
            .select('id, item, nf, created_at, conference_id')
            .gte('created_at', isoStart)
            .order('created_at', { ascending: false })
            .limit(200),
          supabase
            .from('estoque_saidas')
            .select('id, item, estrutura, coluna, nivel, posicao, created_at')
            .gte('created_at', isoStart)
            .order('created_at', { ascending: false })
            .limit(100),
        ]);
        setConfs((confRes.data as Conf[]) ?? []);
        setRegs((regRes.data as Reg[]) ?? []);
        setSaidas((saiRes.data as Sai[]) ?? []);
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.id]);

  const totalDurationMs = useMemo(() => {
    return confs.reduce((acc, c) => {
      if (!c.started_at || !c.finished_at) return acc;
      const ms = Math.abs(new Date(c.finished_at).getTime() - new Date(c.started_at).getTime());
      return ms > 0 && ms < 12 * 60 * 60 * 1000 ? acc + ms : acc;
    }, 0);
  }, [confs]);

  const avgMinPerConf = confs.length > 0 ? Math.round(totalDurationMs / 60000 / Math.max(1, confs.filter(c => c.started_at && c.finished_at).length)) : 0;

  // Build timeline (mix of confs + regs + saidas)
  type TLItem = { id: string; type: 'conf' | 'reg' | 'sai'; at: string; title: string; subtitle?: string };
  const timeline: TLItem[] = useMemo(() => {
    const items: TLItem[] = [];
    confs.forEach(c => items.push({
      id: `c-${c.id}`, type: 'conf', at: c.created_at,
      title: `Conferência ${c.processo ? `· ${c.processo}` : ''}`,
      subtitle: `${fmtTime(c.started_at)} → ${fmtTime(c.finished_at)} · ${fmtDuration(c.started_at, c.finished_at)}`,
    }));
    regs.slice(0, 30).forEach(r => items.push({
      id: `r-${r.id}`, type: 'reg', at: r.created_at,
      title: r.item || '(sem item)',
      subtitle: r.nf ? `NF ${r.nf}` : undefined,
    }));
    saidas.forEach(s => items.push({
      id: `s-${s.id}`, type: 'sai', at: s.created_at,
      title: `Saída · ${s.item || '(sem item)'}`,
      subtitle: `${s.estrutura}.${s.coluna}.N${String(s.nivel).padStart(2, '0')}.P${String(s.posicao).padStart(2, '0')}`,
    }));
    return items.sort((a, b) => b.at.localeCompare(a.at)).slice(0, 50);
  }, [confs, regs, saidas]);

  const summary = [
    { label: 'Conferências', value: confs.length, icon: CheckCircle2 },
    { label: 'Itens bipados', value: regs.length, icon: Package },
    { label: 'Saídas', value: saidas.length, icon: LogOut },
    { label: 'Tempo médio', value: avgMinPerConf > 0 ? `${avgMinPerConf}min` : '—', icon: Clock },
  ];

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Minha atividade</h1>
        <p className="text-sm text-muted-foreground">
          Olá, <span className="font-medium text-foreground">{displayName}</span> — resumo do que você fez hoje.
        </p>
      </header>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {summary.map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-lg border border-border/40 bg-card/50 p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" strokeWidth={1.75} />
                </div>
              </div>
              <div>
                <div className="text-2xl font-semibold tabular-nums text-foreground leading-none">{s.value}</div>
                <p className="text-xs font-medium text-muted-foreground mt-1">{s.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Timeline */}
      <div className="rounded-lg border border-border/40 bg-card/50 overflow-hidden">
        <div className="px-5 py-4 border-b border-border/30 flex items-center gap-2.5">
          <div className="p-1.5 rounded-md bg-primary/10 text-primary">
            <Calendar className="h-4 w-4" strokeWidth={1.75} />
          </div>
          <h2 className="text-sm font-medium tracking-tight">Timeline de hoje</h2>
        </div>
        <div className="px-5 py-4">
          {loading && <p className="text-sm text-muted-foreground py-8 text-center">Carregando...</p>}
          {!loading && timeline.length === 0 && (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Nenhuma atividade registrada hoje.
              <Link to="/tecido" className="text-primary hover:underline ml-1 font-medium">Iniciar bipagem →</Link>
            </p>
          )}
          {!loading && timeline.length > 0 && (
            <ol className="space-y-1">
              {timeline.map(item => (
                <li key={item.id} className="flex items-start gap-3 py-2 border-b border-border/20 last:border-0">
                  <Badge
                    variant="outline"
                    className={
                      'font-medium text-[10px] tabular-nums ' + (
                        item.type === 'conf' ? 'bg-emerald-500/10 text-success border-emerald-500/30' :
                        item.type === 'sai' ? 'bg-rose-500/10 text-destructive border-rose-500/30' :
                        'bg-primary/10 text-primary border-primary/30'
                      )
                    }
                  >
                    {fmtTime(item.at)}
                  </Badge>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{item.title}</div>
                    {item.subtitle && <div className="text-xs text-muted-foreground truncate">{item.subtitle}</div>}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <Button asChild variant="outline" size="sm" className="gap-2">
          <Link to="/historico" aria-label="Ver histórico completo">
            Ver histórico completo <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
          </Link>
        </Button>
      </div>
    </div>
  );
}
