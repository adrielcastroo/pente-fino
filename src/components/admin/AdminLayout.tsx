import { Suspense, lazy, useState, useEffect } from 'react';
import { Navigate, useNavigate, useSearchParams, Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  ShieldCheck,
  LayoutDashboard,
  Plug,
  Eye,
  Rocket,
  Flag,
  Users,
  Database,
  ScrollText,
  KeyRound,
  Activity,
  RefreshCw,
  HardDrive,
  Package,
  Warehouse,
  ListChecks,
  Workflow,
  Bug,
  LineChart,
  ShieldAlert,
  ChevronDown,
  PanelLeft,
  ArrowLeft,
  Settings2,
  HardDriveDownload,
} from 'lucide-react';

// Sub-páginas fora do sistema de tabs (rotas dedicadas, mantidas por compatibilidade)
import N8nMonitorPage from '@/pages/N8nMonitorPage';
import HarTransferenciasPage from '@/pages/admin/HarTransferenciasPage';
import DepositosAdminPage from '@/pages/admin/DepositosAdminPage';
import AutomacoesPage from '@/pages/admin/AutomacoesPage';
import AugeSyncStatusPage from '@/pages/admin/AugeSyncStatusPage';

// Tabs lazy (internas do painel)
const FeatureFlagsPage = lazy(() => import('@/pages/admin/FeatureFlagsPage'));
const ReleasesPage = lazy(() => import('@/pages/admin/ReleasesPage'));
const TeamPanel = lazy(() => import('@/components/settings/TeamPanel'));
const IntegrationsTab = lazy(() => import('@/pages/admin/tabs/IntegrationsTab'));
const ObservabilityTab = lazy(() => import('@/pages/admin/tabs/ObservabilityTab'));
const GlobalSettingsTab = lazy(() => import('@/pages/admin/tabs/GlobalSettingsTab'));
const BackupTab = lazy(() => import('@/pages/admin/tabs/BackupTab'));
const SentryTab = lazy(() => import('@/pages/admin/tabs/SentryTab'));
const PostHogTab = lazy(() => import('@/pages/admin/tabs/PostHogTab'));
const LlmTokensTab = lazy(() => import('@/pages/admin/tabs/LlmTokensTab'));
const AugeAdminPanel = lazy(() => import('@/components/auge/AugeAdminPanel'));
const BackfillTransferenciasTab = lazy(() => import('@/pages/admin/tabs/BackfillTransferenciasTab'));
const AugePermissoesTab = lazy(() => import('@/pages/admin/tabs/AugePermissoesTab'));
import AugeKardexTab from '@/components/auge/AugeKardexTab';
import TechnicalAuditTab from '@/components/admin/TechnicalAuditTab';

declare const __APP_VERSION__: string;

type LucideIcon = typeof Activity;
type NavItem = { key: string; label: string; icon: LucideIcon };
type NavSection = { key: string; label: string; icon: LucideIcon; items: NavItem[] };

const NAV: NavSection[] = [
  {
    key: 'visao',
    label: 'Visão',
    icon: LayoutDashboard,
    items: [{ key: 'overview', label: 'Visão geral', icon: LayoutDashboard }],
  },
  {
    key: 'conexoes',
    label: 'Conexões',
    icon: Plug,
    items: [
      { key: 'integrations', label: 'Integrações', icon: Plug },
      { key: 'auge', label: 'Auge ERP', icon: Warehouse },
      { key: 'n8n', label: 'n8n', icon: Workflow },
      { key: 'backfill-transf', label: 'Backfill Transf.', icon: ListChecks },
    ],
  },
  {
    key: 'observabilidade',
    label: 'Observabilidade',
    icon: Eye,
    items: [
      { key: 'observability', label: 'Visão geral', icon: Eye },
      { key: 'sentry', label: 'Sentry', icon: Bug },
      { key: 'posthog', label: 'PostHog', icon: LineChart },
      { key: 'llm-tokens', label: 'Tokens LLM', icon: KeyRound },
    ],
  },
  {
    key: 'entrega',
    label: 'Entrega',
    icon: Rocket,
    items: [
      { key: 'flags', label: 'Feature Flags', icon: Flag },
      { key: 'releases', label: 'Releases', icon: Rocket },
    ],
  },
  {
    key: 'governanca',
    label: 'Governança',
    icon: ShieldCheck,
    items: [
      { key: 'team', label: 'Usuários & Acessos', icon: Users },
      { key: 'auge-perms', label: 'Permissões Auge', icon: ShieldCheck },
      { key: 'database', label: 'Banco de Dados', icon: Database },
      { key: 'backup', label: 'Backup & Dados', icon: HardDriveDownload },
      { key: 'security', label: 'Segurança & Auth', icon: KeyRound },
    ],
  },
  {
    key: 'auditoria',
    label: 'Auditoria',
    icon: ShieldAlert,
    items: [
      { key: 'audit', label: 'App', icon: ScrollText },
      { key: 'audit-auge', label: 'Auge', icon: ShieldAlert },
      { key: 'technical-audit', label: 'Técnica', icon: Bug },
    ],
  },
];

const ALL_KEYS = NAV.flatMap((s) => s.items.map((i) => i.key));
const tabFallback = <Skeleton className="h-96 rounded-md" />;

// Conteúdo de cada tab (extraído para o painel renderizar)
export function AdminTabs() {
  const [params] = useSearchParams();
  const tab = (params.get('tab') as string) || 'overview';
  const activeKey = ALL_KEYS.includes(tab) ? tab : 'overview';

  return (
    <motion.div
      key={activeKey}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      {activeKey === 'overview' && <OverviewTab />}
      {activeKey === 'integrations' && <Suspense fallback={tabFallback}><IntegrationsTab /></Suspense>}
      {activeKey === 'auge' && <Suspense fallback={tabFallback}><AugeAdminPanel /></Suspense>}
      {activeKey === 'n8n' && <Suspense fallback={tabFallback}><N8nMonitorPage /></Suspense>}
      {activeKey === 'backfill-transf' && <Suspense fallback={tabFallback}><BackfillTransferenciasTab /></Suspense>}
      {activeKey === 'observability' && <Suspense fallback={tabFallback}><ObservabilityTab /></Suspense>}
      {activeKey === 'sentry' && <Suspense fallback={tabFallback}><SentryTab /></Suspense>}
      {activeKey === 'posthog' && <Suspense fallback={tabFallback}><PostHogTab /></Suspense>}
      {activeKey === 'llm-tokens' && <Suspense fallback={tabFallback}><LlmTokensTab /></Suspense>}
      {activeKey === 'flags' && <Suspense fallback={tabFallback}><FeatureFlagsPage /></Suspense>}
      {activeKey === 'releases' && <Suspense fallback={tabFallback}><ReleasesPage /></Suspense>}
      {activeKey === 'team' && (
        <div className="rounded-md border border-border/40 shadow-sm bg-card/60 p-6">
          <Suspense fallback={tabFallback}><TeamPanel /></Suspense>
        </div>
      )}
      {activeKey === 'auge-perms' && <Suspense fallback={tabFallback}><AugePermissoesTab /></Suspense>}
      {activeKey === 'database' && <DatabaseTab />}
      {activeKey === 'backup' && <Suspense fallback={tabFallback}><BackupTab /></Suspense>}
      {activeKey === 'security' && <SecurityTab />}
      {activeKey === 'audit' && <AuditTab />}
      {activeKey === 'audit-auge' && <Suspense fallback={tabFallback}><AugeKardexTab /></Suspense>}
      {activeKey === 'technical-audit' && <TechnicalAuditTab />}
    </motion.div>
  );
}

// ============ SIDEBAR ============
function AdminSidebar({ activeKey, onSelect }: { activeKey: string; onSelect: (k: string) => void }) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const activeSection = NAV.find((s) => s.items.some((i) => i.key === activeKey));

  return (
    <aside className="sticky top-4 bg-card/60 rounded-md border border-border/40 shadow-sm p-2.5 max-h-[calc(100vh-7rem)] overflow-y-auto">
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground/70">
          Painel Admin
        </span>
        <PanelLeft className="h-3.5 w-3.5 text-muted-foreground/50" />
      </div>

      <nav aria-label="Seções do painel admin" className="space-y-1">
        {NAV.map((section) => {
          const SecIcon = section.icon;
          const isOpen = collapsed[section.key] ?? true;
          const isSectionActive = activeSection?.key === section.key;
          return (
            <div key={section.key} className="rounded-md">
              <button
                type="button"
                onClick={() => setCollapsed((c) => ({ ...c, [section.key]: !isOpen }))}
                className={cn(
                  'w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-xs font-semibold transition-colors',
                  isSectionActive ? 'text-foreground bg-muted/50' : 'text-muted-foreground hover:text-foreground hover:bg-muted/30',
                )}
              >
                <SecIcon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                <span className="flex-1 text-left">{section.label}</span>
                <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', !isOpen && '-rotate-90')} />
              </button>

              {isOpen && (
                <div className="ml-3 pl-2 border-l border-border/40 mt-0.5 space-y-0.5">
                  {section.items.map((item) => {
                    const ItemIcon = item.icon;
                    const isActive = activeKey === item.key;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        onClick={() => onSelect(item.key)}
                        className={cn(
                          'w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors',
                          isActive
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/40',
                        )}
                      >
                        <ItemIcon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                        <span className="truncate">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}

// ============ LAYOUT ============
export default function AdminLayout() {
  const { isAdmin, loading, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [params, setParams] = useSearchParams();

  if (loading) return null;
  if (!isAdmin) return <Navigate to="/" replace />;

  const tab = (params.get('tab') as string) || 'overview';
  const activeKey = ALL_KEYS.includes(tab) ? tab : 'overview';
  const version = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'dev';
  const setTab = (k: string) => setParams({ tab: k }, { replace: true });

  // Se estamos numa sub-rota dedicada (/admin/n8n, /automacoes...), o conteúdo
  // vem do <Outlet/>. Senão, renderizamos o painel em tabs via ?tab=.
  const isSubRoute = location.pathname !== '/admin';

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-border/40 bg-background/95 backdrop-blur px-4 py-2.5">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/')}
            className="h-8 gap-1.5"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Voltar ao app
          </Button>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">Painel Admin</span>
            <Badge variant="outline" className="font-mono h-6 px-2 text-[10px]">v{version}</Badge>
          </div>
        </div>
        <Badge variant="secondary" className="gap-1 h-7 px-2.5 text-xs">
          <ShieldCheck className="h-3 w-3" /> {user?.email}
        </Badge>
      </header>

      <div className="grid grid-cols-[260px_1fr] gap-4 items-start p-4">
        <AdminSidebar activeKey={activeKey} onSelect={setTab} />
        <main className="min-w-0">
          {isSubRoute ? <Outlet /> : <AdminTabs />}
        </main>
      </div>
    </div>
  );
}

// ============ TABS CONTENT (movido para cá) ============
function SectionToolbar({ hint, onRefresh, loading }: { hint?: string; onRefresh: () => void; loading?: boolean }) {
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

function OverviewTab() {
  const [stats, setStats] = useState<any>(null);
  const load = async () => {
    setStats(null);
    const [users, flags, releases, registros, conferences, saidas] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('feature_flags').select('key,enabled'),
      supabase.from('app_releases').select('version,is_current,is_stable,notes,released_at').order('released_at', { ascending: false }).limit(5),
      supabase.from('registros').select('id', { count: 'exact', head: true }),
      supabase.from('conferences').select('id', { count: 'exact', head: true }),
      supabase.from('estoque_saidas').select('id', { count: 'exact', head: true }),
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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-md" />)}
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
      <CardShell title="Últimas releases" icon={<Rocket className="h-4 w-4 text-primary" />}>
        {stats.releases.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma release registrada.</p>
        ) : (
          <ul className="divide-y divide-border/40">
            {stats.releases.map((r: any, index: number) => (
              <li key={r.id ?? `release-${index}`} className="flex flex-col py-3 text-sm gap-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold">v{r.version}</span>
                  {r.is_current && <Badge className="bg-primary text-[10px] h-5">Atual</Badge>}
                  {r.is_stable && <Badge variant="secondary" className="text-[10px] h-5">Estável</Badge>}
                  {r.released_at && <span className="text-[10px] text-muted-foreground ml-auto">{new Date(r.released_at).toLocaleDateString('pt-BR')}</span>}
                </div>
                {r.notes && <p className="text-[11px] text-muted-foreground line-clamp-2 leading-tight pl-0.5">{r.notes}</p>}
              </li>
            ))}
          </ul>
        )}
      </CardShell>
      <CardShell title="Automações" icon={<Workflow className="h-4 w-4 text-primary" />}>
        <a href="/automacoes" className="group flex items-start gap-3 rounded-md border border-border/40 bg-card/50 p-3 transition-colors hover:border-primary/40 hover:bg-card">
          <div className="rounded-md bg-primary/10 p-2 text-primary"><Workflow className="h-4 w-4" /></div>
          <div className="min-w-0">
            <div className="text-sm font-medium">Rotinas do Auge</div>
            <div className="text-xs text-muted-foreground">Entrega Após, abreviações e outras automações administrativas.</div>
          </div>
        </a>
      </CardShell>
    </div>
  );
}

function CardShell({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-border/40 shadow-sm bg-card/60 p-5">
      <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm">{icon}{title}</h3>
      {children}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, variant }: { icon: LucideIcon; label: string; value: any; variant?: string }) {
  return (
    <div className={cn('rounded-md border border-border/40 shadow-sm bg-card/60 p-3', variant === 'primary' && 'border-primary/30', variant === 'success' && 'border-emerald-500/30')}>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Icon className="h-3.5 w-3.5" />{label}</div>
      <div className="text-xl font-semibold tabular-nums mt-1">{value}</div>
    </div>
  );
}

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
        const { count, error } = await supabase.from(t).select('*', { count: 'exact', head: true });
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
      <SectionToolbar hint="Volumetria em tempo real (respeita RLS — admin enxerga tudo)." onRefresh={load} loading={loading} />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
        {rows.map((r) => (
          <div key={r.table} className="p-3 rounded-md border border-border/40 shadow-sm bg-card/60 hover:border-primary/40 hover:shadow-md transition-colors">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground truncate"><HardDrive className="h-3 w-3 shrink-0" /><span className="truncate font-mono">{r.table}</span></div>
            <div className="text-xl font-semibold tabular-nums mt-1">{r.error ? <span className="text-xs text-destructive">erro</span> : (r.count ?? 0).toLocaleString('pt-BR')}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AuditTab() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(100);
    setLogs((data as any[]) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);
  return (
    <div className="space-y-3">
      <SectionToolbar hint="Últimas 100 alterações no sistema." onRefresh={load} loading={loading} />
      {loading ? <Skeleton className="h-64 rounded-md" /> : (
        <div className="rounded-md border border-border/40 shadow-sm bg-card/60 overflow-hidden">
          <div className="max-h-[600px] overflow-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/40 sticky top-0 backdrop-blur">
                <tr className="text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                  <th className="p-2.5 font-semibold">Quando</th><th className="p-2.5 font-semibold">Quem</th>
                  <th className="p-2.5 font-semibold">Ação</th><th className="p-2.5 font-semibold">Entidade</th><th className="p-2.5 font-semibold">Campos</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id} className="border-t border-border/40 hover:bg-muted/30 transition-colors">
                    <td className="p-2.5 whitespace-nowrap font-mono text-[10px] text-muted-foreground">{new Date(l.created_at).toLocaleString('pt-BR')}</td>
                    <td className="p-2.5 truncate max-w-[160px]">{l.user_email || l.user_id?.slice(0, 8) || '—'}</td>
                    <td className="p-2.5"><Badge variant="outline" className="text-[10px] h-5">{l.action}</Badge></td>
                    <td className="p-2.5 font-mono">{l.entity}</td>
                    <td className="p-2.5 text-muted-foreground truncate max-w-[240px]">{(l.changed_keys || []).join(', ')}</td>
                  </tr>
                ))}
                {logs.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Sem registros.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function SecurityTab() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('auth_audit_logs').select('*').order('created_at', { ascending: false }).limit(100);
    setLogs((data as any[]) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);
  return (
    <div className="space-y-4">
      <div className="rounded-md border-primary/30 bg-primary/5 shadow-sm p-4">
        <h3 className="font-semibold text-sm flex items-center gap-2 mb-2"><ShieldCheck className="h-4 w-4 text-primary" /> Modelo de acesso</h3>
        <div className="text-xs text-muted-foreground space-y-1 leading-relaxed">
          <p>• Perfis: <strong className="text-foreground">admin</strong> → <strong className="text-foreground">gerente</strong> → <strong className="text-foreground">supervisor</strong> → <strong className="text-foreground">operador</strong>.</p>
          <p>• Alteração de perfis via aba <strong className="text-foreground">Usuários &amp; Acessos</strong>.</p>
          <p>• Todas as tabelas usam RLS. Admin enxerga tudo via <code className="text-[10px] bg-muted/60 px-1 py-0.5 rounded">has_role()</code>.</p>
        </div>
      </div>
      <SectionToolbar hint="Eventos de autenticação (login, reset, etc.)." onRefresh={load} loading={loading} />
      {loading ? <Skeleton className="h-64 rounded-md" /> : (
        <div className="rounded-md border border-border/40 shadow-sm bg-card/60 overflow-hidden">
          <div className="max-h-[600px] overflow-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/40 sticky top-0 backdrop-blur">
                <tr className="text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                  <th className="p-2.5 font-semibold">Quando</th><th className="p-2.5 font-semibold">Evento</th><th className="p-2.5 font-semibold">Email</th><th className="p-2.5 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id} className="border-t border-border/40 hover:bg-muted/30 transition-colors">
                    <td className="p-2.5 whitespace-nowrap font-mono text-[10px] text-muted-foreground">{new Date(l.created_at).toLocaleString('pt-BR')}</td>
                    <td className="p-2.5"><Badge variant="outline" className="text-[10px] h-5">{l.event_type}</Badge></td>
                    <td className="p-2.5 truncate max-w-[220px]">{l.email || '—'}</td>
                    <td className="p-2.5"><Badge variant={l.status === 'success' ? 'default' : 'secondary'} className="text-[10px] h-5">{l.status || '—'}</Badge></td>
                  </tr>
                ))}
                {logs.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">Sem eventos.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
