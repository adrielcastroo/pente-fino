import { lazy, Suspense, useEffect, useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
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

declare const __APP_VERSION__: string;

const TABS = [
  { key: 'overview', label: 'Visão geral', icon: Activity },
  { key: 'integrations', label: 'Integrações', icon: Plug },
  { key: 'observability', label: 'Observabilidade', icon: Eye },
  { key: 'sentry', label: 'Sentry', icon: Bug },
  { key: 'posthog', label: 'PostHog', icon: LineChart },
  { key: 'flags', label: 'Feature Flags', icon: Flag },
  { key: 'releases', label: 'Releases', icon: Rocket },
  { key: 'team', label: 'Usuários & Acessos', icon: Users },
  { key: 'settings', label: 'Configurações globais', icon: Settings2 },
  { key: 'database', label: 'Banco de Dados', icon: Database },
  { key: 'backup', label: 'Backup & Dados', icon: HardDriveDownload },
  { key: 'audit', label: 'Auditoria', icon: ScrollText },
  { key: 'security', label: 'Segurança & Auth', icon: KeyRound },
] as const;

type TabKey = typeof TABS[number]['key'];

export default function AdminPanelPage() {
  const { isAdmin, loading, user } = useAuth();
  const [params, setParams] = useSearchParams();
  const tab = (params.get('tab') as TabKey) || 'overview';

  if (loading) return null;
  if (!isAdmin) return <Navigate to="/" replace />;

  const setTab = (k: string) => setParams({ tab: k }, { replace: true });
  const version = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'dev';

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-6">
      <header className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ShieldCheck className="h-7 w-7 text-primary" /> Painel Admin
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Controle total do aplicativo: features, versões, usuários, banco e segurança.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <Badge variant="outline" className="font-mono">v{version}</Badge>
          <Badge variant="secondary" className="gap-1"><ShieldCheck className="h-3 w-3" /> {user?.email}</Badge>
        </div>
      </header>

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <div className="overflow-x-auto -mx-2 px-2">
          <TabsList className="inline-flex h-auto p-1">
            {TABS.map((t) => {
              const Icon = t.icon;
              return (
                <TabsTrigger key={t.key} value={t.key} className="gap-1.5 text-xs sm:text-sm">
                  <Icon className="h-3.5 w-3.5" /> {t.label}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        <TabsContent value="overview"><OverviewTab /></TabsContent>
        <TabsContent value="integrations">
          <Suspense fallback={<Skeleton className="h-96" />}><IntegrationsTab /></Suspense>
        </TabsContent>
        <TabsContent value="observability">
          <Suspense fallback={<Skeleton className="h-96" />}><ObservabilityTab /></Suspense>
        </TabsContent>
        <TabsContent value="sentry">
          <Suspense fallback={<Skeleton className="h-96" />}><SentryTab /></Suspense>
        </TabsContent>
        <TabsContent value="flags">
          <Suspense fallback={<Skeleton className="h-96" />}><FeatureFlagsPage /></Suspense>
        </TabsContent>
        <TabsContent value="releases">
          <Suspense fallback={<Skeleton className="h-96" />}><ReleasesPage /></Suspense>
        </TabsContent>
        <TabsContent value="team">
          <Card className="p-6">
            <Suspense fallback={<Skeleton className="h-96" />}><TeamPanel /></Suspense>
          </Card>
        </TabsContent>
        <TabsContent value="settings">
          <Suspense fallback={<Skeleton className="h-96" />}><GlobalSettingsTab /></Suspense>
        </TabsContent>
        <TabsContent value="database"><DatabaseTab /></TabsContent>
        <TabsContent value="backup">
          <Suspense fallback={<Skeleton className="h-96" />}><BackupTab /></Suspense>
        </TabsContent>
        <TabsContent value="audit"><AuditTab /></TabsContent>
        <TabsContent value="security"><SecurityTab /></TabsContent>
      </Tabs>
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

  if (!stats) return <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>;

  const current = stats.releases.find((r: any) => r.is_current);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" variant="ghost" onClick={load}><RefreshCw className="h-3.5 w-3.5" /> Atualizar</Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={Users} label="Usuários cadastrados" value={stats.users} />
        <StatCard icon={Flag} label="Feature flags ativas" value={`${stats.flagsAtivas}/${stats.flagsTotal}`} />
        <StatCard icon={Rocket} label="Versão atual" value={current ? `v${current.version}` : '—'} />
        <StatCard icon={Package} label="Registros" value={stats.registros.toLocaleString('pt-BR')} />
        <StatCard icon={Activity} label="Conferências" value={stats.conferences.toLocaleString('pt-BR')} />
        <StatCard icon={Activity} label="Saídas" value={stats.saidas.toLocaleString('pt-BR')} />
      </div>

      <Card className="p-5">
        <h3 className="font-semibold mb-3 flex items-center gap-2"><Rocket className="h-4 w-4" /> Últimas releases</h3>
        <div className="space-y-1.5">
          {stats.releases.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma release registrada.</p>
          ) : stats.releases.map((r: any) => (
            <div key={r.version} className="flex items-center gap-2 text-sm">
              <span className="font-mono">v{r.version}</span>
              {r.is_current && <Badge className="bg-primary text-xs">Atual</Badge>}
              {r.is_stable && <Badge variant="secondary" className="text-xs">Estável</Badge>}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: any }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-muted-foreground text-xs">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <div className="text-2xl font-bold mt-1 tabular-nums">{value}</div>
    </Card>
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
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Volumetria em tempo real (respeita RLS — admin enxerga tudo).
        </p>
        <Button size="sm" variant="ghost" onClick={load} disabled={loading}>
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Atualizar
        </Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
        {rows.map((r) => (
          <Card key={r.table} className="p-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground truncate">
              <HardDrive className="h-3 w-3 shrink-0" /> <span className="truncate font-mono">{r.table}</span>
            </div>
            <div className="text-xl font-bold tabular-nums mt-0.5">
              {r.error ? <span className="text-xs text-destructive">erro</span> : (r.count ?? 0).toLocaleString('pt-BR')}
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
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Últimas 100 alterações no sistema.</p>
        <Button size="sm" variant="ghost" onClick={load}><RefreshCw className="h-3.5 w-3.5" /> Atualizar</Button>
      </div>
      {loading ? <Skeleton className="h-64" /> : (
        <Card className="p-0 overflow-hidden">
          <div className="max-h-[600px] overflow-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/40 sticky top-0">
                <tr className="text-left">
                  <th className="p-2">Quando</th>
                  <th className="p-2">Quem</th>
                  <th className="p-2">Ação</th>
                  <th className="p-2">Entidade</th>
                  <th className="p-2">Campos</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id} className="border-t border-border/40 hover:bg-muted/20">
                    <td className="p-2 whitespace-nowrap font-mono text-[10px]">{new Date(l.created_at).toLocaleString('pt-BR')}</td>
                    <td className="p-2 truncate max-w-[160px]">{l.user_email || l.user_id?.slice(0, 8) || '—'}</td>
                    <td className="p-2"><Badge variant="outline" className="text-[10px]">{l.action}</Badge></td>
                    <td className="p-2 font-mono">{l.entity}</td>
                    <td className="p-2 text-muted-foreground truncate max-w-[240px]">{(l.changed_keys || []).join(', ')}</td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Sem registros.</td></tr>
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
      <Card className="p-4 border-primary/30 bg-primary/5">
        <h3 className="font-semibold text-sm flex items-center gap-2 mb-2">
          <ShieldCheck className="h-4 w-4 text-primary" /> Modelo de acesso
        </h3>
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Perfis: <strong>admin</strong> → <strong>gerente</strong> → <strong>supervisor</strong> → <strong>operador</strong>.</p>
          <p>• Alteração de perfis via aba <strong>Usuários &amp; Acessos</strong>.</p>
          <p>• Todas as tabelas usam RLS. Admin enxerga tudo via <code className="text-[10px]">has_role()</code>.</p>
        </div>
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Eventos de autenticação (login, reset, etc.).</p>
        <Button size="sm" variant="ghost" onClick={load}><RefreshCw className="h-3.5 w-3.5" /> Atualizar</Button>
      </div>

      {loading ? <Skeleton className="h-64" /> : (
        <Card className="p-0 overflow-hidden">
          <div className="max-h-[600px] overflow-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/40 sticky top-0">
                <tr className="text-left">
                  <th className="p-2">Quando</th>
                  <th className="p-2">Evento</th>
                  <th className="p-2">Email</th>
                  <th className="p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id} className="border-t border-border/40 hover:bg-muted/20">
                    <td className="p-2 whitespace-nowrap font-mono text-[10px]">{new Date(l.created_at).toLocaleString('pt-BR')}</td>
                    <td className="p-2"><Badge variant="outline" className="text-[10px]">{l.event_type}</Badge></td>
                    <td className="p-2 truncate max-w-[220px]">{l.email || '—'}</td>
                    <td className="p-2">
                      <Badge variant={l.status === 'success' ? 'default' : 'secondary'} className="text-[10px]">
                        {l.status || '—'}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">Sem eventos.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
