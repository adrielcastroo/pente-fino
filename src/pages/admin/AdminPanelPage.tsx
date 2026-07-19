import { lazy, Suspense, useEffect, useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { PageShell, PageHeader, StatCard } from '@/components/expedicao/ui';
import { cn } from '@/lib/utils';
import {
  ShieldCheck,
  Flag,
  Rocket,
  Users,
  Database,
  ScrollText,
  KeyRound,
  Activity,
  RefreshCw,
  HardDrive,
  Package,
  Plug,
  Eye,
  Settings2,
  HardDriveDownload,
  Bug,
  LineChart,
  Workflow,
  Warehouse,
} from 'lucide-react';

const FeatureFlagsPage = lazy(() => import('./FeatureFlagsPage'));
const ReleasesPage = lazy(() => import('./ReleasesPage'));
const TeamPanel = lazy(() => import('@/components/settings/TeamPanel'));
const IntegrationsTab = lazy(() => import('./tabs/IntegrationsTab'));
const ObservabilityTab = lazy(() => import('./tabs/ObservabilityTab'));
const GlobalSettingsTab = lazy(() => import('./tabs/GlobalSettingsTab'));
const BackupTab = lazy(() => import('./tabs/BackupTab'));
const SentryTab = lazy(() => import('./tabs/SentryTab'));
const PostHogTab = lazy(() => import('./tabs/PostHogTab'));
const N8nMonitorPage = lazy(() => import('@/pages/N8nMonitorPage'));
const AugeAdminPanel = lazy(() => import('@/components/auge/AugeAdminPanel'));

declare const __APP_VERSION__: string;

type LucideIcon = typeof Activity;
type TabDef = { key: string; label: string; icon: LucideIcon };
type TabGroup = { label: string; tabs: TabDef[] };

const TAB_GROUPS: TabGroup[] = [
  {
    label: 'Visão',
    tabs: [
      { key: 'overview', label: 'Visão geral', icon: Activity },
    ],
  },
  {
    label: 'Plataforma',
    tabs: [
      { key: 'integrations', label: 'Integrações', icon: Plug },
      { key: 'observability', label: 'Observabilidade', icon: Eye },
      { key: 'sentry', label: 'Sentry', icon: Bug },
      { key: 'posthog', label: 'PostHog', icon: LineChart },
      { key: 'n8n', label: 'n8n', icon: Workflow },
      { key: 'auge', label: 'Auge ERP', icon: Warehouse },
    ],
  },
  {
    label: 'Entrega',
    tabs: [
      { key: 'flags', label: 'Feature Flags', icon: Flag },
      { key: 'releases', label: 'Releases', icon: Rocket },
    ],
  },
  {
    label: 'Governança',
    tabs: [
      { key: 'team', label: 'Usuários & Acessos', icon: Users },
      { key: 'settings', label: 'Configurações', icon: Settings2 },
      { key: 'database', label: 'Banco de Dados', icon: Database },
      { key: 'backup', label: 'Backup & Dados', icon: HardDriveDownload },
      { key: 'audit', label: 'Auditoria', icon: ScrollText },
      { key: 'security', label: 'Segurança & Auth', icon: KeyRound },
    ],
  },
];

type TabKey = string;

const tabFallback = <Skeleton className="h-96 rounded-md" />;

export default function AdminPanelPage() {
  const { isAdmin, loading, user } = useAuth();
  const [params, setParams] = useSearchParams();
  const tab = (params.get('tab') as TabKey) || 'overview';

  if (loading) return null;
  if (!isAdmin) return <Navigate to="/" replace />;

  const setTab = (k: string) => setParams({ tab: k }, { replace: true });
  const version = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'dev';

  return (
    <PageShell>
      <PageHeader
        title="Painel Admin"
        actions={
          <div className="flex items-center gap-2 text-xs">
            <Badge variant="outline" className="font-mono h-7 px-2.5">v{version}</Badge>
            <Badge variant="secondary" className="gap-1 h-7 px-2.5">
              <ShieldCheck className="h-3 w-3" /> {user?.email}
            </Badge>
          </div>
        }
      />

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        {/* Navegação agrupada — categorias lógicas, wrap responsivo, sem scroll horizontal */}
        <nav
          aria-label="Seções do painel admin"
          className="bg-card/60 rounded-md border border-border/40 shadow-sm p-2 sm:p-3"
        >
          <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:gap-x-6 sm:gap-y-3">
            {TAB_GROUPS.map((group) => (
              <div key={group.label} className="flex flex-col gap-1.5 min-w-0">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground/70 px-1">
                  {group.label}
                </span>
                <div className="flex flex-wrap gap-1">
                  {group.tabs.map((t) => {
                    const Icon = t.icon;
                    const isActive = tab === t.key;
                    return (
                      <button
                        key={t.key}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        onClick={() => setTab(t.key)}
                        className={cn(
                          'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
                          isActive
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/40',
                        )}
                      >
                        <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                        <span>{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </nav>


        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          <TabsContent value="overview" className="mt-0"><OverviewTab /></TabsContent>
          <TabsContent value="integrations" className="mt-0">
            <Suspense fallback={tabFallback}><IntegrationsTab /></Suspense>
          </TabsContent>
          <TabsContent value="observability" className="mt-0">
            <Suspense fallback={tabFallback}><ObservabilityTab /></Suspense>
          </TabsContent>
          <TabsContent value="sentry" className="mt-0">
            <Suspense fallback={tabFallback}><SentryTab /></Suspense>
          </TabsContent>
          <TabsContent value="posthog" className="mt-0">
            <Suspense fallback={tabFallback}><PostHogTab /></Suspense>
          </TabsContent>
          <TabsContent value="n8n" className="mt-0">
            <Suspense fallback={tabFallback}><N8nMonitorPage /></Suspense>
          </TabsContent>
          <TabsContent value="auge" className="mt-0">
            <Suspense fallback={tabFallback}><AugeAdminPanel /></Suspense>
          </TabsContent>
          <TabsContent value="flags" className="mt-0">
            <Suspense fallback={tabFallback}><FeatureFlagsPage /></Suspense>
          </TabsContent>
          <TabsContent value="releases" className="mt-0">
            <Suspense fallback={tabFallback}><ReleasesPage /></Suspense>
          </TabsContent>
          <TabsContent value="team" className="mt-0">
            <Card className="p-6 rounded-md border-border/40 shadow-sm">
              <Suspense fallback={tabFallback}><TeamPanel /></Suspense>
            </Card>
          </TabsContent>
          <TabsContent value="settings" className="mt-0">
            <Suspense fallback={tabFallback}><GlobalSettingsTab /></Suspense>
          </TabsContent>
          <TabsContent value="database" className="mt-0"><DatabaseTab /></TabsContent>
          <TabsContent value="backup" className="mt-0">
            <Suspense fallback={tabFallback}><BackupTab /></Suspense>
          </TabsContent>
          <TabsContent value="audit" className="mt-0"><AuditTab /></TabsContent>
          <TabsContent value="security" className="mt-0"><SecurityTab /></TabsContent>
        </motion.div>
      </Tabs>
    </PageShell>
  );
}

// ============ SECTION HEADER ============
function SectionToolbar({
  hint,
  onRefresh,
  loading,
}: {
  hint?: string;
  onRefresh: () => void;
  loading?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 flex-wrap">
      {hint ? <p className="text-xs sm:text-sm text-muted-foreground">{hint}</p> : <span />}
      <Button size="sm" variant="outline" onClick={onRefresh} disabled={loading} className="h-8 gap-1.5">
        <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
        Atualizar
      </Button>
    </div>
  );
}

// ============ OVERVIEW ============
function OverviewTab() {
  const [stats, setStats] = useState<any>(null);

  const load = async () => {
    setStats(null);
    const [users, flags, releases, registros, conferences, saidas] = await Promise.all([
      (supabase.from('profiles' as any).select('id', { count: 'exact', head: true }) as any),
      (supabase.from('feature_flags' as any).select('key,enabled') as any),
      (supabase.from('app_releases' as any).select('version,is_current,is_stable').order('released_at', { ascending: false }).limit(5) as any),
      (supabase.from('registros' as any).select('id', { count: 'exact', head: true }) as any),
      (supabase.from('conferences' as any).select('id', { count: 'exact', head: true }) as any),
      (supabase.from('estoque_saidas' as any).select('id', { count: 'exact', head: true }) as any),
    ]);
    setStats({
      users: users.count ?? 0,
      flagsTotal: flags.data?.length ?? 0,
      flagsAtivas: (flags.data ?? []).filter((f: any) => f.enabled).length,
      releases: releases.data ?? [],
      registros: registros.count ?? 0,
      conferences: conferences.count ?? 0,
      saidas: saidas.count ?? 0,
    });
  };

  useEffect(() => { load(); }, []);

  if (!stats) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-md" />)}
        </div>
      </div>
    );
  }

  const current = stats.releases.find((r: any) => r.is_current);

  return (
    <div className="space-y-4">
      <SectionToolbar onRefresh={load} />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard icon={Users} label="Usuários" value={stats.users} />
        <StatCard icon={Flag} label="Feature flags" value={`${stats.flagsAtivas}/${stats.flagsTotal}`} variant="primary" />
        <StatCard icon={Rocket} label="Versão atual" value={current ? `v${current.version}` : '—'} variant="success" />
        <StatCard icon={Package} label="Registros" value={stats.registros.toLocaleString('pt-BR')} />
        <StatCard icon={Activity} label="Conferências" value={stats.conferences.toLocaleString('pt-BR')} />
        <StatCard icon={Activity} label="Saídas" value={stats.saidas.toLocaleString('pt-BR')} />
      </div>

      <Card className="p-5 rounded-md border-border/40 shadow-sm">
        <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm">
          <Rocket className="h-4 w-4 text-primary" /> Últimas releases
        </h3>
        {stats.releases.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma release registrada.</p>
        ) : (
          <ul className="divide-y divide-border/40">
            {stats.releases.map((r: any) => (
              <li key={r.version} className="flex items-center gap-2 py-2 text-sm">
                <span className="font-mono">v{r.version}</span>
                {r.is_current && <Badge className="bg-primary text-[10px] h-5">Atual</Badge>}
                {r.is_stable && <Badge variant="secondary" className="text-[10px] h-5">Estável</Badge>}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

// ============ DATABASE ============
const MONITORED_TABLES = [
  'profiles', 'user_roles', 'registros', 'conferences', 'estoque_posicoes', 'estoque_saidas',
  'reservas', 'itens_cadastro', 'expedicao_pecas', 'expedicao_romaneios', 'expedicao_pickings',
  'nfe_importadas', 'audit_logs', 'auth_audit_logs', 'feature_flags', 'app_releases',
];

function DatabaseTab() {
  const [rows, setRows] = useState<Array<{ table: string; count: number | null; error?: string }>>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const results = await Promise.all(MONITORED_TABLES.map(async (t) => {
      try {
        const { count, error } = await (supabase.from(t as any).select('*', { count: 'exact', head: true }) as any);
        if (error) return { table: t, count: null, error: error.message };
        return { table: t, count: count ?? 0 };
      } catch (e: any) {
        return { table: t, count: null, error: e?.message };
      }
    }));
    setRows(results.sort((a, b) => (b.count ?? -1) - (a.count ?? -1)));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-4">
      <SectionToolbar
        hint="Volumetria em tempo real (respeita RLS — admin enxerga tudo)."
        onRefresh={load}
        loading={loading}
      />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
        {rows.map((r) => (
          <Card
            key={r.table}
            className="p-3 rounded-md border-border/40 shadow-sm hover:border-primary/40 hover:shadow-md transition-colors duration-200"
          >
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground truncate">
              <HardDrive className="h-3 w-3 shrink-0" />
              <span className="truncate font-mono">{r.table}</span>
            </div>
            <div className="text-xl font-semibold tabular-nums mt-1">
              {r.error
                ? <span className="text-xs text-destructive">erro</span>
                : (r.count ?? 0).toLocaleString('pt-BR')}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ============ AUDIT ============
function AuditTab() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await (supabase.from('audit_logs' as any)
      .select('*').order('created_at', { ascending: false }).limit(100) as any);
    setLogs((data as any[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-3">
      <SectionToolbar
        hint="Últimas 100 alterações no sistema."
        onRefresh={load}
        loading={loading}
      />
      {loading ? <Skeleton className="h-64 rounded-md" /> : (
        <Card className="p-0 overflow-hidden rounded-md border-border/40 shadow-sm">
          <div className="max-h-[600px] overflow-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/40 sticky top-0 backdrop-blur">
                <tr className="text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                  <th className="p-2.5 font-semibold">Quando</th>
                  <th className="p-2.5 font-semibold">Quem</th>
                  <th className="p-2.5 font-semibold">Ação</th>
                  <th className="p-2.5 font-semibold">Entidade</th>
                  <th className="p-2.5 font-semibold">Campos</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id} className="border-t border-border/40 hover:bg-muted/30 transition-colors">
                    <td className="p-2.5 whitespace-nowrap font-mono text-[10px] text-muted-foreground">
                      {new Date(l.created_at).toLocaleString('pt-BR')}
                    </td>
                    <td className="p-2.5 truncate max-w-[160px]">{l.user_email || l.user_id?.slice(0, 8) || '—'}</td>
                    <td className="p-2.5"><Badge variant="outline" className="text-[10px] h-5">{l.action}</Badge></td>
                    <td className="p-2.5 font-mono">{l.entity}</td>
                    <td className="p-2.5 text-muted-foreground truncate max-w-[240px]">{(l.changed_keys || []).join(', ')}</td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Sem registros.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

// ============ SECURITY ============
function SecurityTab() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await (supabase.from('auth_audit_logs' as any)
      .select('*').order('created_at', { ascending: false }).limit(100) as any);
    setLogs((data as any[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-4">
      <Card className="p-4 rounded-md border-primary/30 bg-primary/5 shadow-sm">
        <h3 className="font-semibold text-sm flex items-center gap-2 mb-2">
          <ShieldCheck className="h-4 w-4 text-primary" /> Modelo de acesso
        </h3>
        <div className="text-xs text-muted-foreground space-y-1 leading-relaxed">
          <p>• Perfis: <strong className="text-foreground">admin</strong> → <strong className="text-foreground">gerente</strong> → <strong className="text-foreground">supervisor</strong> → <strong className="text-foreground">operador</strong>.</p>
          <p>• Alteração de perfis via aba <strong className="text-foreground">Usuários &amp; Acessos</strong>.</p>
          <p>• Todas as tabelas usam RLS. Admin enxerga tudo via <code className="text-[10px] bg-muted/60 px-1 py-0.5 rounded">has_role()</code>.</p>
        </div>
      </Card>

      <SectionToolbar
        hint="Eventos de autenticação (login, reset, etc.)."
        onRefresh={load}
        loading={loading}
      />

      {loading ? <Skeleton className="h-64 rounded-md" /> : (
        <Card className="p-0 overflow-hidden rounded-md border-border/40 shadow-sm">
          <div className="max-h-[600px] overflow-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/40 sticky top-0 backdrop-blur">
                <tr className="text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                  <th className="p-2.5 font-semibold">Quando</th>
                  <th className="p-2.5 font-semibold">Evento</th>
                  <th className="p-2.5 font-semibold">Email</th>
                  <th className="p-2.5 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id} className="border-t border-border/40 hover:bg-muted/30 transition-colors">
                    <td className="p-2.5 whitespace-nowrap font-mono text-[10px] text-muted-foreground">
                      {new Date(l.created_at).toLocaleString('pt-BR')}
                    </td>
                    <td className="p-2.5"><Badge variant="outline" className="text-[10px] h-5">{l.event_type}</Badge></td>
                    <td className="p-2.5 truncate max-w-[220px]">{l.email || '—'}</td>
                    <td className="p-2.5">
                      <Badge
                        variant={l.status === 'success' ? 'default' : 'secondary'}
                        className="text-[10px] h-5"
                      >
                        {l.status || '—'}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">Sem eventos.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
