import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { StatCard, CardShell, SectionToolbar } from '@/components/design-system';
import { Activity, AlertTriangle, Sparkles, RefreshCw, TrendingUp, Zap } from 'lucide-react';

export default function ObservabilityTab() {
  const [stats, setStats] = useState<any>(null);

  const load = async () => {
    setStats(null);
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [aiUsage24h, aiUsage7d, deletes24h, authFails24h, topEntities] = await Promise.all([
      (supabase.from('ai_chat_history' as any).select('id', { count: 'exact', head: true }).gte('created_at', since24h) as any),
      (supabase.from('ai_chat_history' as any).select('id', { count: 'exact', head: true }).gte('created_at', since7d) as any),
      (supabase.from('audit_logs' as any).select('id', { count: 'exact', head: true }).eq('action', 'DELETE').gte('created_at', since24h) as any),
      (supabase.from('auth_audit_logs' as any).select('id', { count: 'exact', head: true }).eq('status', 'failed').gte('created_at', since24h) as any),
      (supabase.from('audit_logs' as any).select('entity').gte('created_at', since24h).limit(500) as any),
    ]);

    const entityCount: Record<string, number> = {};
    (topEntities.data ?? []).forEach((r: any) => {
      entityCount[r.entity] = (entityCount[r.entity] ?? 0) + 1;
    });
    const top = Object.entries(entityCount).sort((a, b) => b[1] - a[1]).slice(0, 8);

    setStats({
      aiUsage24h: aiUsage24h.count ?? 0,
      aiUsage7d: aiUsage7d.count ?? 0,
      deletes24h: deletes24h.count ?? 0,
      authFails24h: authFails24h.count ?? 0,
      topEntities: top,
    });
  };

  useEffect(() => { load(); }, []);

  if (!stats) return <div className="grid grid-cols-4 gap-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>;

  return (
    <div className="space-y-6">
      <SectionToolbar onRefresh={load} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={Sparkles} label="Chamadas IA (24h)" value={stats.aiUsage24h} variant="primary" />
        <StatCard icon={TrendingUp} label="Chamadas IA (7d)" value={stats.aiUsage7d} variant="primary" />
        <StatCard icon={AlertTriangle} label="Deletes (24h)" value={stats.deletes24h} />
        <StatCard icon={AlertTriangle} label="Falhas de login (24h)" value={stats.authFails24h} />
      </div>

      <CardShell title="Entidades mais alteradas (24h)" icon={<Activity className="h-4 w-4 text-primary" />}
        subtitle="Top 8 entidades com mais alterações">
        {stats.topEntities.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem alterações nas últimas 24h.</p>
        ) : (
          <div className="space-y-1.5">
            {stats.topEntities.map(([entity, count]: [string, number]) => {
              const max = stats.topEntities[0][1];
              return (
                <div key={entity} className="flex items-center gap-3">
                  <span className="font-mono text-xs w-40 truncate">{entity}</span>
                  <div className="flex-1 h-2 bg-muted/40 rounded overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${(count / max) * 100}%` }} />
                  </div>
                  <span className="tabular-nums text-xs w-12 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        )}
      </CardShell>

      <CardShell title="Ferramentas externas" icon={<Zap className="h-4 w-4 text-primary" />}
        variant="elevated">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
          <a
            href="/admin?tab=sentry"
            className="block p-3 rounded border border-border/40 bg-card/60 hover:bg-primary/5 hover:border-primary/30 transition-colors"
          >
            <p className="font-semibold text-sm">Sentry</p>
            <p className="text-xs text-muted-foreground mt-1">Captura erros de runtime em produção com stack traces e reprodução.</p>
          </a>
          <a
            href="/admin?tab=posthog"
            className="block p-3 rounded border border-border/40 bg-card/60 hover:bg-primary/5 hover:border-primary/30 transition-colors"
          >
            <p className="font-semibold text-sm">PostHog</p>
            <p className="text-xs text-muted-foreground mt-1">Analytics de produto: funil, retenção, session replay, A/B tests.</p>
          </a>
        </div>
        <p className="text-xs text-muted-foreground mt-4">
          <Badge variant="outline" className="text-[10px] mr-1.5">Logs Edge Functions</Badge>
          disponíveis via ferramentas de admin do backend (Cloud → Functions → Logs).
        </p>
      </CardShell>
    </div>
  );
}
