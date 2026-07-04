import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, X, RefreshCw, ExternalLink, Bug, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

type Issue = {
  id: string;
  shortId?: string;
  title: string;
  level: 'fatal' | 'error' | 'warning' | 'info' | 'debug';
  count?: string | number;
  userCount?: number;
  lastSeen?: string;
  permalink?: string;
  project?: { slug?: string; name?: string };
};

const STORAGE_KEY = 'error_watcher_open';
const POLL_MS = 60_000;

const levelColor: Record<string, string> = {
  fatal: 'bg-red-600 text-white',
  error: 'bg-red-500 text-white',
  warning: 'bg-yellow-500 text-black',
  info: 'bg-blue-500 text-white',
  debug: 'bg-gray-500 text-white',
};

export default function ErrorWatcherWidget() {
  const { isAdmin, user } = useAuth();
  const [open, setOpen] = useState(() => localStorage.getItem(STORAGE_KEY) === '1');
  const [minimized, setMinimized] = useState(false);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  const fetchIssues = useCallback(async () => {
    setLoading(true); setErr(null);
    try {
      const { data, error } = await supabase.functions.invoke('sentry-issues', {
        body: { action: 'issues', query: 'is:unresolved', period: '24h', limit: 25 },
      });
      if (error) throw error;
      const list: Issue[] = (data?.issues ?? data ?? []) as Issue[];
      setIssues(Array.isArray(list) ? list : []);
      setLastFetch(new Date());
    } catch (e: any) {
      setErr(e?.message ?? String(e));
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    fetchIssues();
    const id = setInterval(fetchIssues, POLL_MS);
    return () => clearInterval(id);
  }, [isAdmin, fetchIssues]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, open ? '1' : '0');
  }, [open]);

  if (!isAdmin) return null;

  const critical = issues.filter((i) => i.level === 'fatal' || i.level === 'error').length;
  const warnings = issues.filter((i) => i.level === 'warning').length;
  const hasIssues = issues.length > 0;

  // Botão flutuante compacto
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className={cn(
          'fixed bottom-4 right-4 z-[60] rounded-full shadow-lg border border-border/40',
          'flex items-center gap-2 px-3 py-2 text-xs font-medium',
          'bg-card hover:bg-muted transition-colors',
          critical > 0 && 'ring-2 ring-red-500 animate-pulse',
        )}
        title="Monitor de erros"
      >
        <Bug className={cn('h-4 w-4', critical > 0 ? 'text-red-500' : 'text-muted-foreground')} />
        {hasIssues ? (
          <>
            <span className="tabular-nums">{issues.length}</span>
            {critical > 0 && <Badge className="bg-red-500 text-white h-4 px-1 text-[10px]">{critical}</Badge>}
          </>
        ) : (
          <span className="text-green-500">OK</span>
        )}
      </button>
    );
  }

  // Painel expandido
  return (
    <div
      className={cn(
        'fixed bottom-4 right-4 z-[60] w-[380px] max-w-[95vw]',
        'bg-card border border-border/60 rounded-lg shadow-2xl',
        'flex flex-col',
        minimized ? 'h-auto' : 'max-h-[70vh]',
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 p-3 border-b border-border/40">
        <Bug className={cn('h-4 w-4', critical > 0 ? 'text-red-500' : 'text-muted-foreground')} />
        <span className="text-sm font-semibold">Monitor de erros</span>
        {critical > 0 && <Badge className="bg-red-500 text-white text-[10px]">{critical} crítico{critical > 1 ? 's' : ''}</Badge>}
        {warnings > 0 && <Badge className="bg-yellow-500 text-black text-[10px]">{warnings} avisos</Badge>}
        <div className="ml-auto flex items-center gap-1">
          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={fetchIssues} disabled={loading} title="Atualizar">
            <RefreshCw className={cn('h-3 w-3', loading && 'animate-spin')} />
          </Button>
          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setMinimized((v) => !v)} title="Minimizar">
            {minimized ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </Button>
          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setOpen(false)} title="Fechar">
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {!minimized && (
        <>
          {/* Status bar */}
          <div className="px-3 py-1.5 border-b border-border/40 flex items-center justify-between text-[10px] text-muted-foreground">
            <span>{issues.length} issues abertas · últimas 24h</span>
            {lastFetch && <span>Atualizado {lastFetch.toLocaleTimeString('pt-BR')}</span>}
          </div>

          {/* Body */}
          <div className="flex-1 overflow-auto">
            {err ? (
              <div className="p-4 text-xs text-destructive flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold mb-1">Erro ao carregar</div>
                  <div className="text-muted-foreground">{err}</div>
                </div>
              </div>
            ) : issues.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                <div className="text-green-500 text-2xl mb-2">✓</div>
                Nenhum erro nas últimas 24h
              </div>
            ) : (
              <ul className="divide-y divide-border/40">
                {issues.map((i) => (
                  <li key={i.id} className="p-2.5 hover:bg-muted/40">
                    <div className="flex items-start gap-2">
                      <span className={cn('text-[9px] font-mono px-1.5 py-0.5 rounded uppercase shrink-0', levelColor[i.level] ?? 'bg-gray-500 text-white')}>
                        {i.level}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium truncate">{i.title}</div>
                        <div className="text-[10px] text-muted-foreground flex items-center gap-2 mt-0.5">
                          {i.project?.slug && <span>{i.project.slug}</span>}
                          {i.count && <span>· {i.count} evt</span>}
                          {i.userCount != null && <span>· {i.userCount} users</span>}
                          {i.lastSeen && <span>· {new Date(i.lastSeen).toLocaleTimeString('pt-BR')}</span>}
                        </div>
                      </div>
                      {i.permalink && (
                        <a href={i.permalink} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary shrink-0">
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer */}
          <div className="p-2 border-t border-border/40 flex items-center justify-between">
            <a href="/admin?tab=sentry" className="text-[11px] text-primary hover:underline">
              Abrir painel completo →
            </a>
            <span className="text-[10px] text-muted-foreground">Poll 60s</span>
          </div>
        </>
      )}
    </div>
  );
}
