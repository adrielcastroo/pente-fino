import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Package, Truck, ShoppingCart, ArrowRight, WifiOff, Plus, Pin } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import { useAppStore } from '@/store/useAppStore';
import { LATEST_VERSION, CHANGELOG_STORAGE_KEY } from '@/lib/changelog';
import { useCurrentRelease } from '@/hooks/useAppReleases';

declare const __BUILD_TIME__: string;
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

import logoComb from '@/assets/logo-comb.webp';

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 6) return 'Boa madrugada';
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

function getInitials(name: string): string {
  return name.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function getShift(): string {
  const h = new Date().getHours();
  if (h >= 6 && h < 14) return '1º Turno';
  if (h >= 14 && h < 22) return '2º Turno';
  return '3º Turno';
}

function FooterVersion({ hasNewVersion }: { hasNewVersion: boolean }) {
  const current = useCurrentRelease();
  const bundleVersion = LATEST_VERSION;
  const version = current?.version ?? bundleVersion;
  const buildIso = (current as any)?.build_time ?? (typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : '');
  let buildLabel = '';
  if (buildIso) {
    try {
      const d = new Date(buildIso);
      if (!isNaN(d.getTime())) {
        buildLabel = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
      }
    } catch {}
  }
  return (
    <>
      <p className="text-[10px] text-muted-foreground/50 font-mono">
        Pente Fino · v{version} “{codenameFor(version)}”{buildLabel ? ` · build ${buildLabel}` : ''}
      </p>
      {hasNewVersion && (
        <span className="text-[8px] font-semibold px-1 py-0.5 rounded bg-primary/10 text-primary">
          Novo
        </span>
      )}
    </>
  );
}



function getShiftEnd(): Date {
  const h = new Date().getHours();
  const end = new Date();
  if (h >= 6 && h < 14) end.setHours(14, 0, 0, 0);
  else if (h >= 14 && h < 22) end.setHours(22, 0, 0, 0);
  else {
    if (h >= 22) end.setDate(end.getDate() + 1);
    end.setHours(6, 0, 0, 0);
  }
  return end;
}

function formatRemaining(end: Date): string {
  const diff = end.getTime() - Date.now();
  if (diff <= 0) return 'turno encerrado';
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}min restantes` : `${m}min restantes`;
}

function formatTimeAgo(dateStr: string): string {
  const diffMin = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (diffMin < 1) return 'agora';
  if (diffMin < 60) return `há ${diffMin}min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `há ${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  return `há ${diffD}d`;
}

const ACTION_LABEL: Record<string, string> = {
  INSERT: 'Criou',
  UPDATE: 'Editou',
  DELETE: 'Removeu',
};
const ENTITY_LABEL: Record<string, string> = {
  registros: 'registro',
  conferences: 'conferência',
  estoque_posicoes: 'posição',
  estoque_saidas: 'saída',
  expedicao_pickings: 'picking',
  itens_cadastro: 'item',
};
function formatAuditAction(item: { action: string; entity: string; entity_id: string | null }) {
  const verb = ACTION_LABEL[item.action] ?? item.action;
  const entity = ENTITY_LABEL[item.entity] ?? item.entity;
  const ref = item.entity_id ? ` ${item.entity_id.slice(0, 8)}` : '';
  return `${verb} ${entity}${ref}`;
}

function useModuleStats(enabled: boolean) {
  return useQuery({
    queryKey: ['module-stats'],
    enabled,
    staleTime: 60_000,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const isoToday = today.toISOString();

      const safeCount = async (q: any): Promise<number> => {
        try { const r = await q; return (r?.count as number | null) ?? 0; } catch { return 0; }
      };

      const [openConfs, sessionsToday, regsToday, pendPickings, emSeparacao, expedHoje, occupied, totalSlots, comprasPend, comprasAtras] = await Promise.all([
        safeCount(supabase.from('conferences').select('id', { count: 'exact', head: true }).is('finished_at', null)),
        safeCount(supabase.from('conferences').select('id', { count: 'exact', head: true }).gte('started_at', isoToday)),
        safeCount(supabase.from('registros').select('id', { count: 'exact', head: true }).gte('created_at', isoToday)),
        safeCount(supabase.from('expedicao_pickings' as any).select('id', { count: 'exact', head: true }).in('status', ['pendente', 'em_separacao']) as any),
        safeCount(supabase.from('expedicao_pickings' as any).select('id', { count: 'exact', head: true }).eq('status', 'em_separacao') as any),
        safeCount(supabase.from('expedicao_pickings' as any).select('id', { count: 'exact', head: true }).eq('status', 'faturado').gte('updated_at', isoToday) as any),
        safeCount(supabase.from('estoque_posicoes').select('id', { count: 'exact', head: true }).not('item_id', 'is', null)),
        safeCount(supabase.from('estoque_posicoes').select('id', { count: 'exact', head: true })),
        safeCount(supabase.from('compras_pedidos' as any).select('id', { count: 'exact', head: true }).in('status', ['pendente', 'em_andamento']) as any),
        safeCount(supabase.from('compras_pedidos' as any).select('id', { count: 'exact', head: true }).eq('status', 'atrasado') as any),
      ]);

      const ocupacao = totalSlots ? Math.round((occupied / totalSlots) * 100) : 0;

      return {
        estoque: { openConferences: openConfs, sessionsToday, registrosToday: regsToday, ocupacao },
        expedicao: { pendentes: pendPickings, emSeparacao, expedidosHoje: expedHoje },
        compras: { emAcompanhamento: comprasPend, atrasados: comprasAtras },
      };
    },
  });
}

function useMyDayStats(userId?: string) {
  return useQuery({
    queryKey: ['my-day-stats', userId],
    enabled: !!userId,
    staleTime: 120_000,
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const iso = today.toISOString();
      try {
        const [mySessions, myRegs] = await Promise.all([
          supabase.from('conferences').select('id', { count: 'exact', head: true }).eq('created_by', userId!).gte('started_at', iso),
          supabase.from('registros')
            .select('id, conferences!inner(created_by)', { count: 'exact', head: true })
            .eq('conferences.created_by', userId!)
            .gte('created_at', iso) as any,
        ]);
        return { sessions: mySessions.count ?? 0, registros: (myRegs as any).count ?? 0 };
      } catch { return { sessions: 0, registros: 0 }; }
    },
  });
}

function useRecentActivity(userId?: string) {
  return useQuery({
    queryKey: ['recent-activity', userId],
    enabled: !!userId,
    staleTime: 60_000,
    queryFn: async () => {
      try {
        const { data } = await supabase
          .from('audit_logs')
          .select('action, entity, entity_id, occurred_at')
          .eq('user_id', userId!)
          .order('occurred_at', { ascending: false })
          .limit(3);
        return data ?? [];
      } catch { return []; }
    },
  });
}

function usePendingNotifications(role: string | null) {
  return useQuery({
    queryKey: ['pending-notifications'],
    enabled: role === 'admin' || role === 'gerente',
    staleTime: 300_000,
    queryFn: async () => {
      try {
        const fourHoursAgo = new Date(Date.now() - 4 * 3600000).toISOString();
        const { count } = await supabase
          .from('conferences')
          .select('id', { count: 'exact', head: true })
          .is('finished_at', null)
          .lt('started_at', fourHoursAgo);
        return count ?? 0;
      } catch { return 0; }
    },
  });
}

export default function SelecionarModuloPage() {
  const { profile, user, role, isGuest, modules, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const registros = useAppStore(s => s.registros);
  const processo = useAppStore(s => s.processo);
  const sessionStartedAt = useAppStore(s => s.sessionStartedAt);

  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [now, setNow] = useState(new Date());
  const [hasNewVersion, setHasNewVersion] = useState(false);
  const firstCardRef = useRef<HTMLAnchorElement>(null);
  const lastModule = typeof window !== 'undefined' ? localStorage.getItem('pf_lastModule') : null;
  const defaultModule = typeof window !== 'undefined' ? localStorage.getItem('pf_defaultModule') : null;

  useEffect(() => {
    try { setHasNewVersion(localStorage.getItem(CHANGELOG_STORAGE_KEY) !== LATEST_VERSION); } catch {}
  }, []);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        queryClient.invalidateQueries({ queryKey: ['module-stats'] });
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [queryClient]);

  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  const hasEstoque = modules.includes('estoque');
  const hasExpedicao = modules.includes('expedicao');
  const hasCompras = modules.includes('compras');
  const moduleCount = [hasEstoque, hasExpedicao, hasCompras].filter(Boolean).length;
  const showBoth = moduleCount > 1;

  useEffect(() => {
    if (!showBoth) return;
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && ['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      if (e.key === '1' && hasEstoque) navigate('/estoque');
      if (e.key === '2' && hasExpedicao) navigate('/expedicao/painel');
      if (e.key === '3' && hasCompras) navigate('/compras/acompanhamentos');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate, showBoth, hasEstoque, hasExpedicao, hasCompras]);

  useEffect(() => {
    const t = setTimeout(() => firstCardRef.current?.focus(), 100);
    return () => clearTimeout(t);
  }, []);

  const { data: stats, isLoading: statsLoading } = useModuleStats(!loading && !isGuest && showBoth);
  const { data: myStats } = useMyDayStats(user?.id);
  const { data: recent } = useRecentActivity(user?.id);
  const { data: alertsCount } = usePendingNotifications(role);

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center gap-3 bg-background">
        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Verificando permissões…</p>
      </div>
    );
  }

  if (isGuest) return <Navigate to="/estoque/operacao" replace />;
  if (moduleCount === 1) {
    if (hasEstoque) return <Navigate to="/estoque" replace />;
    if (hasExpedicao) return <Navigate to="/expedicao/painel" replace />;
    if (hasCompras) return <Navigate to="/compras/acompanhamentos" replace />;
  }
  // Feature 5: módulo padrão (skip automático) — ignorar se o usuário pediu para trocar
  const forceSwitch = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('switch');
  if (!forceSwitch) {
    if (defaultModule === 'estoque' && hasEstoque) return <Navigate to="/estoque" replace />;
    if (defaultModule === 'expedicao' && hasExpedicao) return <Navigate to="/expedicao/painel" replace />;
    if (defaultModule === 'compras' && hasCompras) return <Navigate to="/compras/acompanhamentos" replace />;
  }

  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'Operador';
  const roleName =
    role === 'admin' ? 'Administrador' :
    role === 'gerente' ? 'Gerente' :
    role === 'supervisor' ? 'Supervisor' :
    'Conferente';

  const hasActiveSession = registros.length > 0;
  const ocupacao = stats?.estoque.ocupacao ?? 0;

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const prefetchModule = (key: 'estoque' | 'expedicao' | 'compras') => {
    if (key === 'estoque') import('@/pages/DashboardPage').catch(() => {});
    if (key === 'expedicao') import('@/pages/expedicao/PainelPage').catch(() => {});
    if (key === 'compras') import('@/pages/compras/AcompanhamentosPage').catch(() => {});
  };

  const setDefaultModule = (mod: 'estoque' | 'expedicao' | 'compras', label: string) => {
    localStorage.setItem('pf_defaultModule', mod);
    toast.success(`${label} definido como módulo padrão`, {
      description: 'Você pode alterar isso em Configurações.',
    });
  };

  const dateTimeLabel = `${now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })} · ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  const shiftRemaining = formatRemaining(getShiftEnd());

  const renderMetric = (value: number | undefined, label: string, accent?: string) => (
    <div>
      {statsLoading ? (
        <Skeleton className="h-7 w-12 mb-1" />
      ) : (
        <p className={`text-xl font-semibold tabular-nums ${accent ?? 'text-foreground'}`}>
          {value?.toLocaleString('pt-BR') ?? 0}
        </p>
      )}
      <p className="text-[11px] text-muted-foreground mt-0.5">{label}</p>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background animate-in fade-in duration-300">
      <main className="flex-1 flex items-center justify-center px-6 py-8 sm:px-10 sm:py-12">
        <div className="w-full max-w-2xl">
          {/* Branding */}
          <div className="flex flex-col items-center justify-center gap-2 mb-6">
            <img
              src={logoComb}
              alt="Pente Fino"
              width={56}
              height={56}
              className="h-12 w-12 sm:h-14 sm:w-14 object-contain select-none"
              draggable={false}
            />
            <span className="text-sm sm:text-base font-semibold tracking-tight text-foreground">
              Pente Fino
            </span>
          </div>

          {!isOnline && (
            <div className="mb-4 flex items-center gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-warning dark:text-amber-300">
              <WifiOff className="w-3.5 h-3.5" />
              Sem conexão — dados podem estar desatualizados
            </div>
          )}

          {/* Identidade do operador */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-muted text-foreground inline-flex items-center justify-center text-sm font-semibold tabular-nums shrink-0">
              {getInitials(displayName)}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-semibold tracking-tight text-foreground truncate flex items-center gap-2">
                <span className="truncate">{getGreeting()}, {displayName}</span>
                {(alertsCount ?? 0) > 0 && (
                  <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-destructive/10 text-destructive border border-destructive/20 tabular-nums shrink-0">
                    {alertsCount} alerta{(alertsCount ?? 0) > 1 ? 's' : ''}
                  </span>
                )}
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5 first-letter:capitalize">
                {roleName} · {dateTimeLabel} · {getShift()} · {shiftRemaining}
              </p>
              {!!myStats && (myStats.sessions > 0 || myStats.registros > 0) && (
                <p className="text-[11px] text-muted-foreground/80 mt-1 tabular-nums">
                  Hoje: {myStats.sessions} sessão{myStats.sessions !== 1 ? 'ões' : ''}
                  {' · '}{myStats.registros} registro{myStats.registros !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>

          {/* Banner de sessão ativa */}
          {hasActiveSession && (
            <Link
              to="/estoque/operacao"
              className="mb-6 flex items-center justify-between gap-3 rounded-md border border-amber-500/30 bg-amber-500/5 px-4 py-3 hover:bg-amber-500/10 transition-colors"
            >
              <div className="min-w-0">
                <p className="text-xs font-semibold text-warning dark:text-amber-300">
                  Sessão aberta{processo ? `: ${processo}` : ''}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5 tabular-nums">
                  {registros.length} {registros.length === 1 ? 'registro' : 'registros'}
                  {sessionStartedAt ? ` · iniciada ${formatTimeAgo(new Date(sessionStartedAt).toISOString())}` : ''}
                </p>
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-warning dark:text-amber-300 shrink-0">
                Retomar <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </Link>
          )}

          {/* Cards de módulo */}
          <div className={`grid grid-cols-1 ${moduleCount >= 3 ? 'sm:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-2'} gap-4`}>
            {/* Estoque */}
            {hasEstoque && (
            <Link
              ref={firstCardRef}
              to="/estoque"
              onClick={() => localStorage.setItem('pf_lastModule', 'estoque')}
              onMouseEnter={() => prefetchModule('estoque')}
              onFocus={() => prefetchModule('estoque')}
              className={`group relative min-h-[200px] flex flex-col p-5 rounded-md border border-border bg-card hover:bg-muted/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                lastModule === 'estoque' ? 'ring-1 ring-sky-400/40' : ''
              }`}
            >
              <div className="flex items-center gap-2 mb-4">
                <Package className="w-5 h-5 text-sky-600" strokeWidth={1.75} />
                <h2 className="text-sm font-semibold text-foreground">Estoque</h2>
                {!!stats?.estoque.openConferences && (
                  <span className="ml-auto text-[10px] font-medium text-warning dark:text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded px-1.5 py-0.5 tabular-nums">
                    {stats.estoque.openConferences} aberta{stats.estoque.openConferences > 1 ? 's' : ''}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                {renderMetric(stats?.estoque.sessionsToday, 'sessões hoje')}
                {renderMetric(stats?.estoque.registrosToday, 'registros hoje')}
              </div>

              {ocupacao > 0 && (
                <div className="mb-4">
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-muted-foreground">Ocupação</span>
                    <span className="tabular-nums text-foreground font-medium">{ocupacao}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full transition-all ${ocupacao > 80 ? 'bg-amber-500' : 'bg-sky-500'}`}
                      style={{ width: `${ocupacao}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="mt-auto flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">Conferência, armazém e saídas</span>
                <kbd className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/70 border border-border rounded px-1.5 py-0.5">
                  1
                </kbd>
              </div>

              <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDefaultModule('estoque', 'Estoque'); }}
                className="absolute bottom-1.5 left-1.5 text-[9px] text-muted-foreground/40 hover:text-muted-foreground transition-colors inline-flex items-center gap-1"
                title="Definir como módulo padrão"
              >
                <Pin className="w-2.5 h-2.5" /> padrão
              </button>
            </Link>
            )}

            {/* Expedição */}
            {hasExpedicao && (
            <Link
              to="/expedicao/painel"
              onClick={() => localStorage.setItem('pf_lastModule', 'expedicao')}
              onMouseEnter={() => prefetchModule('expedicao')}
              onFocus={() => prefetchModule('expedicao')}
              className={`group relative min-h-[200px] flex flex-col p-5 rounded-md border border-border bg-card hover:bg-muted/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                lastModule === 'expedicao' ? 'ring-1 ring-emerald-400/40' : ''
              }`}
            >
              <div className="flex items-center gap-2 mb-4">
                <Truck className="w-5 h-5 text-success" strokeWidth={1.75} />
                <h2 className="text-sm font-semibold text-foreground">Expedição</h2>
                {!!stats?.expedicao.pendentes && (
                  <span className="ml-auto text-[10px] font-medium text-warning dark:text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded px-1.5 py-0.5 tabular-nums">
                    {stats.expedicao.pendentes} pendente{stats.expedicao.pendentes > 1 ? 's' : ''}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                {renderMetric(stats?.expedicao.emSeparacao, 'em separação')}
                {renderMetric(stats?.expedicao.expedidosHoje, 'expedidos hoje')}
              </div>

              <div className="mt-auto flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">Picking, conferência e romaneio</span>
                <kbd className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/70 border border-border rounded px-1.5 py-0.5">
                  2
                </kbd>
              </div>

              <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDefaultModule('expedicao', 'Expedição'); }}
                className="absolute bottom-1.5 left-1.5 text-[9px] text-muted-foreground/40 hover:text-muted-foreground transition-colors inline-flex items-center gap-1"
                title="Definir como módulo padrão"
              >
                <Pin className="w-2.5 h-2.5" /> padrão
              </button>
            </Link>
            )}

            {/* Compras */}
            {hasCompras && (
            <Link
              to="/compras/acompanhamentos"
              onClick={() => localStorage.setItem('pf_lastModule', 'compras')}
              onMouseEnter={() => prefetchModule('compras')}
              onFocus={() => prefetchModule('compras')}
              className={`group relative min-h-[200px] flex flex-col p-5 rounded-md border border-border bg-card hover:bg-muted/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                lastModule === 'compras' ? 'ring-1 ring-violet-400/40' : ''
              }`}
            >
              <div className="flex items-center gap-2 mb-4">
                <ShoppingCart className="w-5 h-5 text-violet-600" strokeWidth={1.75} />
                <h2 className="text-sm font-semibold text-foreground">Compras</h2>
                {!!stats?.compras.atrasados && (
                  <span className="ml-auto text-[10px] font-medium text-destructive bg-destructive/10 border border-destructive/20 rounded px-1.5 py-0.5 tabular-nums">
                    {stats.compras.atrasados} atrasado{stats.compras.atrasados > 1 ? 's' : ''}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                {renderMetric(stats?.compras.emAcompanhamento, 'em acompanhamento')}
                {renderMetric(stats?.compras.atrasados, 'atrasados', stats?.compras.atrasados ? 'text-destructive' : undefined)}
              </div>

              <div className="mt-auto flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">Pedidos, fornecedores e recebimento</span>
                <kbd className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/70 border border-border rounded px-1.5 py-0.5">
                  3
                </kbd>
              </div>

              <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDefaultModule('compras', 'Compras'); }}
                className="absolute bottom-1.5 left-1.5 text-[9px] text-muted-foreground/40 hover:text-muted-foreground transition-colors inline-flex items-center gap-1"
                title="Definir como módulo padrão"
              >
                <Pin className="w-2.5 h-2.5" /> padrão
              </button>
            </Link>
            )}
          </div>

          {/* Acesso rápido: nova conferência */}
          {hasEstoque && !hasActiveSession && (
            <div className="mt-4 flex justify-center">
              <Link
                to="/estoque/operacao"
                className="text-xs font-medium text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Iniciar nova conferência
              </Link>
            </div>
          )}

          {/* Atividade recente */}
          {recent && recent.length > 0 && (
            <div className="mt-8 space-y-1">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70 mb-2">Sua atividade recente</p>
              {recent.map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-[11px] text-muted-foreground py-0.5">
                  <span className="w-1 h-1 rounded-full bg-muted-foreground/30 shrink-0" />
                  <span className="truncate">{formatAuditAction(item as any)}</span>
                  <span className="text-muted-foreground/40 tabular-nums shrink-0 ml-auto">
                    {formatTimeAgo((item as any).occurred_at)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Ações secundárias */}
          <div className="flex items-center justify-center gap-3 mt-8 text-xs text-muted-foreground/60">
            <button type="button" onClick={handleSignOut} className="hover:text-foreground transition-colors">
              Trocar conta
            </button>
            <span aria-hidden>·</span>
            <Link to="/configuracoes" className="hover:text-foreground transition-colors">
              Configurações
            </Link>
          </div>
        </div>
      </main>

      <footer className="py-4 flex items-center justify-center gap-2">
        <FooterVersion hasNewVersion={hasNewVersion} />
      </footer>
    </div>
  );
}
