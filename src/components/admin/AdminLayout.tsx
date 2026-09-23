import { Suspense, lazy, useState, useEffect, useMemo } from 'react';
import { Navigate, useNavigate, useSearchParams, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { StatCard, CardShell, SectionToolbar } from '@/components/design-system';
import { SidebarProvider, useSidebar, SidebarTrigger } from '@/components/ui/sidebar';
import { NAV, ALL_KEYS, tabFallback } from './navData';
import AdminSidebarWrapper from './AdminSidebarWrapper';
import {
  ShieldCheck,
  Rocket,
  Flag,
  Users,
  Database,
  KeyRound,
  Activity,
  HardDrive,
  Package,
  Workflow,
  ScrollText,
  ArrowLeft,
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

// Conteúdo de cada tab (extraído para o painel renderizar)
export function AdminTabs() {
  const [params] = useSearchParams();
  const tab = (params.get('tab') as string) || 'overview';
  const activeKey = ALL_KEYS.includes(tab) ? tab : 'overview';

  const TabContent = useMemo(() => {
    switch (activeKey) {
      case 'overview': return <OverviewTab />;
      case 'integrations': return <IntegrationsTab />;
      case 'auge': return <AugeAdminPanel />;
      case 'n8n': return <N8nMonitorPage />;
      case 'backfill-transf': return <BackfillTransferenciasTab />;
      case 'observability': return <ObservabilityTab />;
      case 'sentry': return <SentryTab />;
      case 'posthog': return <PostHogTab />;
      case 'llm-tokens': return <LlmTokensTab />;
      case 'flags': return <FeatureFlagsPage />;
      case 'releases': return <ReleasesPage />;
      case 'auge-perms': return <AugePermissoesTab />;
      case 'database': return <DatabaseTab />;
      case 'backup': return <BackupTab />;
      case 'security': return <SecurityTab />;
      case 'audit': return <AuditTab />;
      case 'audit-auge': return <AugeKardexTab />;
      case 'technical-audit': return <TechnicalAuditTab />;
      case 'team': return <TeamPanel />;
      default: return <OverviewTab />;
    }
  }, [activeKey]);

  return (
    <div
      key={activeKey}
      style={{ opacity: 1, y: 0 }}
    >
      <Suspense fallback={tabFallback}>{TabContent}</Suspense>
    </div>
  );
}

// ============ SIDEBAR ============
function AdminSidebar({ activeKey, onSelect }: { activeKey: string; onSelect: (k: string) => void }) {
  const navigate = useNavigate();
  const activeSection = NAV.find((s) => s.items.some((i) => i.key === activeKey));

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-border/40 bg-sidebar"
      aria-label="Menu"
    >
      <SidebarHeader className="overflow-hidden py-4 px-3">
        <div className="flex min-w-0 cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 transition-opacity hover:opacity-80">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center">
            <ShieldCheck className="h-7 w-7 text-primary" />
          </div>
          <div className="flex min-w-0 flex-col overflow-hidden">
            <span className="text-sm font-bold leading-tight tracking-tight text-sidebar-accent-foreground truncate">
              Pente Fino
            </span>
            <span className="text-[9px] font-semibold uppercase tracking-[0.15em] text-sidebar-foreground/70 truncate">
              Painel Admin
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="custom-scrollbar overflow-x-hidden px-3">
        {NAV.map((section) => {
          const SecIcon = section.icon;
          const isSectionActive = activeSection?.key === section.key;
          return (
            <SidebarGroup key={section.key} className="mb-2 p-0 shrink-0">
              <div
                data-sidebar="module-group-label"
                className="flex h-8 shrink-0 items-center px-2 text-[9px] font-semibold uppercase tracking-[0.2em] text-sidebar-foreground/50"
              >
                <SecIcon className="mr-1.5 h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                {section.label}
              </div>
              <SidebarGroupContent>
                <SidebarMenu className="gap-0.5">
                  {section.items.map((item) => {
                    const ItemIcon = item.icon;
                    const isActive = activeKey === item.key;
                    return (
                      <SidebarMenuItem key={item.key}>
                        <SidebarMenuButton
                          size="lg"
                          onClick={() => onSelect(item.key)}
                          isActive={isActive}
                          aria-current={isActive ? 'page' : undefined}
                          className={cn(
                            'relative h-10 rounded-md transition-colors duration-150 active:scale-[0.97]',
                            isActive
                              ? 'font-bold text-primary'
                              : 'font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                          )}
                        >
                          {isActive && (
                            <div className="pointer-events-none absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-primary" />
                          )}
                          <div className="relative flex h-5 w-5 shrink-0 items-center justify-center">
                            <ItemIcon
                              className="h-[18px] w-[18px]"
                              strokeWidth={isActive ? 2.4 : 1.75}
                            />
                          </div>
                          <span className="min-w-0 flex-1 truncate text-left text-[13px]">
                            {item.label}
                          </span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      <SidebarFooter className="overflow-hidden border-t border-border/30 py-3 px-3">
        <SidebarMenu className="gap-0.5">
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              onClick={() => navigate('/')}
              tooltip="Voltar ao app"
              aria-label="Voltar ao app"
              className="relative h-10 rounded-md text-sidebar-foreground transition-colors duration-150 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <div className="flex h-5 w-5 shrink-0 items-center justify-center">
                <ArrowLeft className="h-[18px] w-[18px]" />
              </div>
              <span className="min-w-0 flex-1 truncate text-left text-xs font-medium">
                Voltar ao app
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

// ============ LAYOUT ============

export default function AdminLayout() {
  return (
    <SidebarProvider>
      <AdminLayoutContent />
    </SidebarProvider>
  );
}

function AdminLayoutContent() {
  const { state: sidebarState } = useSidebar();
  const isCollapsed = sidebarState === 'collapsed';

  const { isAdmin, loading, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [params, setParams] = useSearchParams();

  const tab = (params.get('tab') as string) || 'overview';
  const activeKey = ALL_KEYS.includes(tab) ? tab : 'overview';
  const version = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'dev';
  const setTab = (k: string) => setParams({ tab: k }, { replace: true });
  const isSubRoute = location.pathname !== '/admin';

  if (loading) return null;
  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-border/40 bg-background/95 backdrop-blur px-4 py-2.5 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <SidebarTrigger className="h-8 w-8" />
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/')}
            className={cn(
              "h-8 gap-1.5 transition-all duration-200",
              isCollapsed && "opacity-0 w-0 px-0 overflow-hidden"
            )}
            disabled={isCollapsed}
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Voltar ao app
          </Button>
          <div className={cn(
            "flex items-center gap-2 transition-all duration-200",
            isCollapsed && "opacity-0 w-0 overflow-hidden"
          )}>
            <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
            <Badge variant="outline" className="font-mono h-6 px-2 text-[10px]">v{version}</Badge>
          </div>
        </div>
        <Badge variant="secondary" className="gap-1 h-7 px-2.5 text-xs shrink-0">
          <ShieldCheck className="h-3 w-3" /> {user?.email}
        </Badge>
      </header>

      <div className={cn(
        "grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4 items-start p-4 transition-all duration-200",
        isCollapsed && "lg:grid-cols-[72px_1fr]"
      )}>
        <AdminSidebarWrapper activeKey={activeKey} onSelect={setTab} />
        <main className={cn(
          "min-w-0 transition-all duration-200",
          isCollapsed && "ml-2"
        )}>
          {isSubRoute ? (
            <Suspense fallback={tabFallback}>
              <Outlet />
            </Suspense>
          ) : (
            <AdminTabs />
          )}
        </main>
      </div>
    </div>
  );
}

// ============ TABS CONTENT (movido para cá) ============

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
                <div className="flex items-center gap-2 flex-wrap">
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
          <div className="rounded-md bg-primary/10 p-2 text-primary shrink-0"><Workflow className="h-4 w-4" /></div>
          <div className="min-w-0">
            <div className="text-sm font-medium">Rotinas do Auge</div>
            <div className="text-xs text-muted-foreground">Entrega Após, abreviações e outras automações administrativas.</div>
          </div>
        </a>
      </CardShell>
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
      <CardShell title="Tabelas monitoradas" icon={<HardDrive className="h-4 w-4 text-primary" />}>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
          {rows.map((r) => (
            <div key={r.table} className="p-3 rounded-md border border-border/40 bg-card/60 hover:border-primary/40 transition-colors">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground truncate"><HardDrive className="h-3 w-3 shrink-0" /><span className="truncate font-mono">{r.table}</span></div>
              <div className="text-xl font-semibold tabular-nums mt-1">{r.error ? <span className="text-xs text-destructive">erro</span> : (r.count ?? 0).toLocaleString('pt-BR')}</div>
            </div>
          ))}
        </div>
      </CardShell>
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
      <CardShell title="Log de auditoria" icon={<ScrollText className="h-4 w-4 text-primary" />} subtitle="Últimas 100 alterações rastreadas no sistema">
        {loading ? <Skeleton className="h-64 rounded-md" /> : (
          <div className="rounded-md border border-border/40 bg-card/60 overflow-hidden">
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
      </CardShell>
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
      <CardShell
        title="Modelo de acesso"
        icon={<ShieldCheck className="h-4 w-4 text-primary" />}
        subtitle="Hierarquia de perfis e regras de acesso baseadas em RLS"
        variant="elevated"
      >
        <div className="text-xs text-muted-foreground space-y-1 leading-relaxed">
          <p>• Perfis: <strong className="text-foreground">admin</strong> → <strong className="text-foreground">gerente</strong> → <strong className="text-foreground">supervisor</strong> → <strong className="text-foreground">operador</strong>.</p>
          <p>• Alteração de perfis via aba <strong className="text-foreground">Usuários &amp; Acessos</strong>.</p>
          <p>• Todas as tabelas usam RLS. Admin enxerga tudo via <code className="text-[10px] bg-muted/60 px-1 py-0.5 rounded">has_role()</code>.</p>
        </div>
      </CardShell>
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
