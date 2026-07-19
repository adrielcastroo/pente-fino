import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { AlertTriangle, Bug, RefreshCw, ExternalLink, Search, Activity } from 'lucide-react';

type SentryProject = { id: string; slug: string; name: string; platform?: string };
type SentryIssue = {
  id: string;
  shortId: string;
  title: string;
  culprit?: string;
  level: 'fatal' | 'error' | 'warning' | 'info' | 'debug';
  status: string;
  count: string;
  userCount: number;
  firstSeen: string;
  lastSeen: string;
  permalink: string;
  project?: { slug: string; name: string };
};

const LEVEL_COLOR: Record<string, string> = {
  fatal: 'bg-red-600 text-white',
  error: 'bg-destructive text-destructive-foreground',
  warning: 'bg-yellow-500 text-black',
  info: 'bg-blue-500 text-white',
  debug: 'bg-muted text-muted-foreground',
};

async function call(params: Record<string, string>) {
  const qs = new URLSearchParams(params).toString();
  const { data, error } = await supabase.functions.invoke(`sentry-issues?${qs}`, { method: 'GET' });
  if (error) throw error;
  return data;
}

function getSentryErrorMessage(data: any): string | null {
  if (!data?.error && !data?.detail) return null;
  return [data?.error, data?.detail].filter(Boolean).join(' — ');
}

export default function SentryTab() {
  const [projects, setProjects] = useState<SentryProject[]>([]);
  const [project, setProject] = useState<string>('all');
  const [query, setQuery] = useState('is:unresolved');
  const [period, setPeriod] = useState('24h');
  const [issues, setIssues] = useState<SentryIssue[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [notConfigured, setNotConfigured] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await call({ action: 'projects' });
        const sentryError = getSentryErrorMessage(data);
        if (sentryError) {
          setErr(sentryError);
          setProjects([]);
          return;
        }
        if (Array.isArray(data)) setProjects(data);
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
      const data = await call({
        action: 'issues',
        query,
        period,
        ...(project !== 'all' ? { project } : {}),
      });
      const sentryError = getSentryErrorMessage(data);
      if (sentryError) setErr(sentryError);
      if (Array.isArray(data)) setIssues(data);
      else if (Array.isArray(data?.issues)) setIssues(data.issues);
      else setIssues([]);
    } catch (e: any) {
      const msg = e?.message ?? String(e);
      if (msg.includes('não configurados')) setNotConfigured(true);
      else setErr(msg);
    } finally { setLoading(false); }
  };

  useEffect(() => { if (!notConfigured) load(); /* eslint-disable-next-line */ }, [project, period]);

  const bySeverity = useMemo(() => {
    const acc: Record<string, number> = { fatal: 0, error: 0, warning: 0, info: 0, debug: 0 };
    issues.forEach((i) => { acc[i.level] = (acc[i.level] ?? 0) + 1; });
    return acc;
  }, [issues]);

  if (notConfigured) {
    return (
      <Card className="p-6 border-yellow-500/40 bg-yellow-500/5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
          <div className="space-y-2">
            <h3 className="font-semibold">Sentry ainda não configurado</h3>
            <p className="text-sm text-muted-foreground">
              Para exibir dados ao vivo, configure os secrets <code className="text-xs">SENTRY_AUTH_TOKEN</code> (token de API com escopo <code className="text-xs">org:read</code> + <code className="text-xs">project:read</code> + <code className="text-xs">event:read</code>) e <code className="text-xs">SENTRY_ORG_SLUG</code> (slug da organização).
            </p>
            <p className="text-xs text-muted-foreground">
              Gere o token em <a className="underline" href="https://sentry.io/settings/account/api/auth-tokens/" target="_blank" rel="noreferrer">sentry.io/settings/account/api/auth-tokens</a>.
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
        <div className="flex-1 min-w-[200px]">
          <label className="text-xs text-muted-foreground">Projeto</label>
          <Select value={project} onValueChange={setProject}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os projetos</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name} ({p.slug})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-32">
          <label className="text-xs text-muted-foreground">Período</label>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">1 hora</SelectItem>
              <SelectItem value="24h">24 horas</SelectItem>
              <SelectItem value="7d">7 dias</SelectItem>
              <SelectItem value="14d">14 dias</SelectItem>
              <SelectItem value="30d">30 dias</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 min-w-[240px]">
          <label className="text-xs text-muted-foreground">Query (Sentry syntax)</label>
          <div className="flex gap-2">
            <Input value={query} onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && load()}
              placeholder="is:unresolved level:error" />
            <Button size="icon" variant="secondary" onClick={load}><Search className="h-4 w-4" /></Button>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-3.5 w-3.5 mr-1 ${loading ? 'animate-spin' : ''}`} /> Atualizar
        </Button>
      </Card>

      {/* Severidade */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {(['fatal', 'error', 'warning', 'info', 'debug'] as const).map((lvl) => (
          <Card key={lvl} className="p-3">
            <div className="flex items-center justify-between">
              <Badge className={LEVEL_COLOR[lvl]}>{lvl}</Badge>
              <span className="text-2xl font-bold tabular-nums">{bySeverity[lvl] ?? 0}</span>
            </div>
          </Card>
        ))}
      </div>

      {err && (
        <Card className="p-3 border-destructive/40 bg-destructive/5 text-sm text-destructive">
          {err}
        </Card>
      )}

      {/* Lista de issues */}
      <Card className="p-0 overflow-hidden">
        <div className="p-3 border-b border-border/40 flex items-center gap-2">
          <Bug className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">Issues abertas</h3>
          <Badge variant="outline" className="ml-auto">{issues.length}</Badge>
        </div>
        {loading ? (
          <div className="p-4 space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
        ) : issues.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
            <Activity className="h-6 w-6" /> Nenhuma issue encontrada nesse filtro.
          </div>
        ) : (
          <div className="max-h-[600px] overflow-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/40 sticky top-0">
                <tr className="text-left">
                  <th className="p-2">Nível</th>
                  <th className="p-2">Título</th>
                  <th className="p-2">Projeto</th>
                  <th className="p-2 text-right">Eventos</th>
                  <th className="p-2 text-right">Usuários</th>
                  <th className="p-2">Última</th>
                  <th className="p-2"></th>
                </tr>
              </thead>
              <tbody>
                {issues.map((i) => (
                  <tr key={i.id} className="border-t border-border/40 hover:bg-muted/20">
                    <td className="p-2"><Badge className={`${LEVEL_COLOR[i.level]} text-[10px]`}>{i.level}</Badge></td>
                    <td className="p-2 max-w-[380px]">
                      <div className="font-medium truncate">{i.title}</div>
                      {i.culprit && <div className="text-[10px] text-muted-foreground truncate font-mono">{i.culprit}</div>}
                    </td>
                    <td className="p-2 font-mono text-[10px]">{i.project?.slug ?? '—'}</td>
                    <td className="p-2 text-right tabular-nums">{Number(i.count).toLocaleString('pt-BR')}</td>
                    <td className="p-2 text-right tabular-nums">{i.userCount.toLocaleString('pt-BR')}</td>
                    <td className="p-2 whitespace-nowrap text-[10px] text-muted-foreground">{new Date(i.lastSeen).toLocaleString('pt-BR')}</td>
                    <td className="p-2">
                      <a href={i.permalink} target="_blank" rel="noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline">
                        <ExternalLink className="h-3 w-3" />
                      </a>
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
