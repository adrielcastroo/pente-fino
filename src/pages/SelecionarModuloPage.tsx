import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Package, Truck, ArrowRight } from 'lucide-react';
import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useAppStore } from '@/store/useAppStore';
import { LATEST_VERSION } from '@/lib/changelog';
import { formatDateBR } from '@/lib/app-utils';
import { supabase } from '@/integrations/supabase/client';

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 6) return 'Boa madrugada';
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function getShift(): string {
  const h = new Date().getHours();
  if (h >= 6 && h < 14) return '1º Turno';
  if (h >= 14 && h < 22) return '2º Turno';
  return '3º Turno';
}

function useModuleStats(enabled: boolean) {
  return useQuery({
    queryKey: ['module-stats'],
    enabled,
    staleTime: 60_000,
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const isoToday = today.toISOString();

      const [openConfs, sessionsToday, regsToday, pendPickings, expedHoje] = await Promise.all([
        supabase.from('conferences').select('id', { count: 'exact', head: true }).is('finished_at', null),
        supabase.from('conferences').select('id', { count: 'exact', head: true }).gte('started_at', isoToday),
        supabase.from('registros').select('id', { count: 'exact', head: true }).gte('created_at', isoToday),
        supabase.from('expedicao_pickings' as any).select('id', { count: 'exact', head: true }).in('status', ['pendente', 'em_separacao']),
        supabase.from('expedicao_pickings' as any).select('id', { count: 'exact', head: true }).eq('status', 'faturado').gte('updated_at', isoToday),
      ]);

      return {
        estoque: {
          openConferences: openConfs.count ?? 0,
          sessionsToday: sessionsToday.count ?? 0,
          registrosToday: regsToday.count ?? 0,
        },
        expedicao: {
          pendentes: pendPickings.count ?? 0,
          expedidosHoje: expedHoje.count ?? 0,
        },
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

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['module-stats'] });
    const onFocus = () => queryClient.invalidateQueries({ queryKey: ['module-stats'] });
    const onVisibility = () => {
      if (document.visibilityState === 'visible') onFocus();
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [queryClient]);

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

  const { data: stats } = useModuleStats(!loading && !isGuest && showBoth);

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

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 flex items-center justify-center px-6 py-8 sm:px-10 sm:py-12">
        <div className="w-full max-w-2xl">
          {/* Branding */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <span className="w-9 h-9 inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-bold tracking-tight">
              PF
            </span>
            <span className="text-base font-semibold tracking-tight text-foreground">Pente Fino</span>
          </div>

          {/* Identidade do operador */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-full bg-muted text-foreground inline-flex items-center justify-center text-sm font-semibold tabular-nums shrink-0">
              {getInitials(displayName)}
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-semibold tracking-tight text-foreground truncate">
                {getGreeting()}, {displayName}
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                {roleName} · {formatDateBR(new Date().toISOString())} · {getShift()}
              </p>
            </div>
          </div>

          {/* Banner de sessão ativa */}
          {hasActiveSession && (
            <Link
              to="/estoque/operacao"
              className="mb-6 flex items-center justify-between gap-3 rounded-md border border-amber-500/30 bg-amber-500/5 dark:bg-amber-500/10 px-4 py-3 hover:bg-amber-500/10 transition-colors"
            >
              <div className="min-w-0">
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                  Sessão aberta{processo ? `: ${processo}` : ''}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5 tabular-nums">
                  {registros.length} {registros.length === 1 ? 'registro' : 'registros'}
                  {sessionStartedAt ? ` · iniciada ${formatDateBR(new Date(sessionStartedAt).toISOString())}` : ''}
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
              to="/estoque"
              className="group min-h-[200px] flex flex-col p-5 rounded-md border border-border border-t-2 border-t-sky-500 bg-card hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-2 mb-4">
                <Package className="w-5 h-5 text-sky-600 dark:text-sky-400" strokeWidth={1.75} />
                <h2 className="text-sm font-semibold text-foreground">Estoque</h2>
                {stats?.estoque.openConferences ? (
                  <span className="ml-auto text-[10px] font-medium text-amber-700 dark:text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded px-1.5 py-0.5 tabular-nums">
                    {stats.estoque.openConferences} aberta{stats.estoque.openConferences > 1 ? 's' : ''}
                  </span>
                ) : null}
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <p className="text-xl font-semibold text-foreground tabular-nums">
                    {stats?.estoque.sessionsToday ?? '—'}
                  </p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">sessões hoje</p>
                </div>
                <div>
                  <p className="text-xl font-semibold text-foreground tabular-nums">
                    {stats?.estoque.registrosToday?.toLocaleString('pt-BR') ?? '—'}
                  </p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">registros hoje</p>
                </div>
              </div>

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
              className="group min-h-[200px] flex flex-col p-5 rounded-md border border-border border-t-2 border-t-emerald-500 bg-card hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-2 mb-4">
                <Truck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" strokeWidth={1.75} />
                <h2 className="text-sm font-semibold text-foreground">Expedição</h2>
                {stats?.expedicao.pendentes ? (
                  <span className="ml-auto text-[10px] font-medium text-amber-700 dark:text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded px-1.5 py-0.5 tabular-nums">
                    {stats.expedicao.pendentes} pendente{stats.expedicao.pendentes > 1 ? 's' : ''}
                  </span>
                ) : null}
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <p className="text-xl font-semibold text-foreground tabular-nums">
                    {stats?.expedicao.pendentes ?? '—'}
                  </p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">pickings pendentes</p>
                </div>
                <div>
                  <p className="text-xl font-semibold text-foreground tabular-nums">
                    {stats?.expedicao.expedidosHoje ?? '—'}
                  </p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">expedidos hoje</p>
                </div>
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
            <button
              type="button"
              onClick={handleSignOut}
              className="hover:text-foreground transition-colors"
            >
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
