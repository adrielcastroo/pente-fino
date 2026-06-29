import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Package, Truck, ArrowRight, WifiOff } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useAppStore } from '@/store/useAppStore';
import { LATEST_VERSION } from '@/lib/changelog';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import logoComb from '@/assets/logo-comb.png';

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

function formatTimeAgo(dateStr: string): string {
  const diffMin = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (diffMin < 1) return 'agora mesmo';
  if (diffMin < 60) return `há ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `há ${diffH} h`;
  const diffD = Math.floor(diffH / 24);
  return `há ${diffD} dia${diffD > 1 ? 's' : ''}`;
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

      const safeCount = async (p: Promise<{ count: number | null }>) => {
        try { const r = await p; return r.count ?? 0; } catch { return 0; }
      };

      const [openConfs, sessionsToday, regsToday, pendPickings, emSeparacao, expedHoje, occupied, totalSlots] = await Promise.all([
        safeCount(supabase.from('conferences').select('id', { count: 'exact', head: true }).is('finished_at', null)),
        safeCount(supabase.from('conferences').select('id', { count: 'exact', head: true }).gte('started_at', isoToday)),
        safeCount(supabase.from('registros').select('id', { count: 'exact', head: true }).gte('created_at', isoToday)),
        safeCount(supabase.from('expedicao_pickings' as any).select('id', { count: 'exact', head: true }).in('status', ['pendente', 'em_separacao']) as any),
        safeCount(supabase.from('expedicao_pickings' as any).select('id', { count: 'exact', head: true }).eq('status', 'em_separacao') as any),
        safeCount(supabase.from('expedicao_pickings' as any).select('id', { count: 'exact', head: true }).eq('status', 'faturado').gte('updated_at', isoToday) as any),
        safeCount(supabase.from('estoque_posicoes').select('id', { count: 'exact', head: true }).not('item_id', 'is', null)),
        safeCount(supabase.from('estoque_posicoes').select('id', { count: 'exact', head: true })),
      ]);

      const ocupacao = totalSlots ? Math.round((occupied / totalSlots) * 100) : 0;

      return {
        estoque: { openConferences: openConfs, sessionsToday, registrosToday: regsToday, ocupacao },
        expedicao: { pendentes: pendPickings, emSeparacao, expedidosHoje: expedHoje },
      };
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
  const firstCardRef = useRef<HTMLAnchorElement>(null);
  const lastModule = typeof window !== 'undefined' ? localStorage.getItem('pf_lastModule') : null;

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
  const showBoth = hasEstoque && hasExpedicao;

  useEffect(() => {
    if (!showBoth) return;
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && ['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      if (e.key === '1') navigate('/estoque');
      if (e.key === '2') navigate('/expedicao/painel');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate, showBoth]);

  useEffect(() => {
    const t = setTimeout(() => firstCardRef.current?.focus(), 100);
    return () => clearTimeout(t);
  }, []);

  const { data: stats, isLoading: statsLoading } = useModuleStats(!loading && !isGuest && showBoth);

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center gap-3 bg-background">
        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Verificando permissões…</p>
      </div>
    );
  }

  if (isGuest) return <Navigate to="/estoque/operacao" replace />;
  if (hasEstoque && !hasExpedicao) return <Navigate to="/estoque" replace />;
  if (hasExpedicao && !hasEstoque) return <Navigate to="/expedicao/painel" replace />;

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

  const prefetchModule = (key: 'estoque' | 'expedicao') => {
    if (key === 'estoque') import('@/pages/DashboardPage').catch(() => {});
    if (key === 'expedicao') import('@/pages/expedicao/PainelPage').catch(() => {});
  };

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
            <div className="mb-4 flex items-center gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
              <WifiOff className="w-3.5 h-3.5" />
              Sem conexão — dados podem estar desatualizados
            </div>
          )}

          {/* Identidade do operador */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-muted text-foreground inline-flex items-center justify-center text-sm font-semibold tabular-nums shrink-0">
              {getInitials(displayName)}
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-semibold tracking-tight text-foreground truncate">
                {getGreeting()}, {displayName}
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                {roleName} · {getShift()}
              </p>
            </div>
          </div>

          {/* Banner de sessão ativa */}
          {hasActiveSession && (
            <Link
              to="/estoque/operacao"
              className="mb-6 flex items-center justify-between gap-3 rounded-md border border-amber-500/30 bg-amber-500/5 px-4 py-3 hover:bg-amber-500/10 transition-colors"
            >
              <div className="min-w-0">
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                  Sessão aberta{processo ? `: ${processo}` : ''}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5 tabular-nums">
                  {registros.length} {registros.length === 1 ? 'registro' : 'registros'}
                  {sessionStartedAt ? ` · iniciada ${formatTimeAgo(new Date(sessionStartedAt).toISOString())}` : ''}
                </p>
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-300 shrink-0">
                Retomar <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </Link>
          )}

          {/* Cards de módulo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Estoque */}
            <Link
              ref={firstCardRef}
              to="/estoque"
              onClick={() => localStorage.setItem('pf_lastModule', 'estoque')}
              onMouseEnter={() => prefetchModule('estoque')}
              onFocus={() => prefetchModule('estoque')}
              className={`group min-h-[200px] flex flex-col p-5 rounded-md border border-border bg-card hover:bg-muted/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                lastModule === 'estoque' ? 'ring-1 ring-sky-400/40' : ''
              }`}
            >
              <div className="flex items-center gap-2 mb-4">
                <Package className="w-5 h-5 text-sky-600" strokeWidth={1.75} />
                <h2 className="text-sm font-semibold text-foreground">Estoque</h2>
                {!!stats?.estoque.openConferences && (
                  <span className="ml-auto text-[10px] font-medium text-amber-700 dark:text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded px-1.5 py-0.5 tabular-nums">
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
            </Link>

            {/* Expedição */}
            <Link
              to="/expedicao/painel"
              onClick={() => localStorage.setItem('pf_lastModule', 'expedicao')}
              onMouseEnter={() => prefetchModule('expedicao')}
              onFocus={() => prefetchModule('expedicao')}
              className={`group min-h-[200px] flex flex-col p-5 rounded-md border border-border bg-card hover:bg-muted/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                lastModule === 'expedicao' ? 'ring-1 ring-emerald-400/40' : ''
              }`}
            >
              <div className="flex items-center gap-2 mb-4">
                <Truck className="w-5 h-5 text-emerald-600" strokeWidth={1.75} />
                <h2 className="text-sm font-semibold text-foreground">Expedição</h2>
                {!!stats?.expedicao.pendentes && (
                  <span className="ml-auto text-[10px] font-medium text-amber-700 dark:text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded px-1.5 py-0.5 tabular-nums">
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
            </Link>
          </div>

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

      <footer className="py-4 text-center">
        <p className="text-[10px] text-muted-foreground/50 font-mono">
          Pente Fino · v{LATEST_VERSION}
        </p>
      </footer>
    </div>
  );
}
