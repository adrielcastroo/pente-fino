import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Package, Truck } from 'lucide-react';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { LATEST_VERSION } from '@/lib/changelog';

export default function SelecionarModuloPage() {
  const { profile, user, isGuest, modules, loading, signOut } = useAuth();
  const navigate = useNavigate();

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

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 flex items-center justify-center px-6 py-8 sm:px-10 sm:py-12">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-10">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Pente Fino</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {displayName} · Escolha o módulo
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              to="/estoque"
              className="group min-h-[160px] flex flex-col items-center justify-center text-center p-6 rounded-md border border-border border-t-2 border-t-sky-500 bg-card hover:bg-muted/30 transition-colors"
            >
              <Package className="w-8 h-8 text-sky-600 dark:text-sky-400 mb-3" />
              <h2 className="text-sm font-semibold text-foreground">Estoque</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Conferência, armazém e saídas
              </p>
              <span className="mt-3 text-[10px] font-mono uppercase tracking-wider text-muted-foreground/70 border border-border rounded px-1.5 py-0.5">
                Tecle 1
              </span>
            </Link>

            <Link
              to="/expedicao/painel"
              className="group min-h-[160px] flex flex-col items-center justify-center text-center p-6 rounded-md border border-border border-t-2 border-t-emerald-500 bg-card hover:bg-muted/30 transition-colors"
            >
              <Truck className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mb-3" />
              <h2 className="text-sm font-semibold text-foreground">Expedição</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Picking, conferência e romaneio
              </p>
              <span className="mt-3 text-[10px] font-mono uppercase tracking-wider text-muted-foreground/70 border border-border rounded px-1.5 py-0.5">
                Tecle 2
              </span>
            </Link>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            className="text-xs text-muted-foreground/60 hover:text-foreground mt-8 block mx-auto transition-colors"
          >
            Trocar conta
          </button>
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
