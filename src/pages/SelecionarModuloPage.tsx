import { Link, Navigate } from 'react-router-dom';
import { Package, Truck } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { LATEST_VERSION } from '@/lib/changelog';

export default function SelecionarModuloPage() {
  const { profile, user, isGuest, modules, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // Visitantes não têm acesso ao módulo Expedição
  if (isGuest) return <Navigate to="/estoque/operacao" replace />;

  const hasEstoque = modules.includes('estoque');
  const hasExpedicao = modules.includes('expedicao');

  // Se só tem 1 módulo, vai direto
  if (hasEstoque && !hasExpedicao) return <Navigate to="/estoque" replace />;
  if (hasExpedicao && !hasEstoque) return <Navigate to="/expedicao/painel" replace />;

  const displayName =
    profile?.display_name || user?.email?.split('@')[0] || 'Operador';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-xl font-semibold text-slate-900 dark:text-foreground">
            Olá, {displayName}
          </h1>
          <p className="text-sm text-slate-500 dark:text-muted-foreground mt-1">
            Selecione o módulo para continuar
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Link
            to="/estoque"
            className="bg-white dark:bg-card border border-slate-200 dark:border-border rounded-md p-6 text-center hover:bg-slate-50/50 dark:hover:bg-accent/30 hover:border-sky-200 transition-colors group"
          >
            <div className="w-12 h-12 rounded-md bg-sky-50 dark:bg-sky-950/40 flex items-center justify-center mx-auto mb-3 group-hover:bg-sky-100 transition-colors">
              <Package className="w-6 h-6 text-sky-700 dark:text-sky-300" />
            </div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-foreground">
              Estoque
            </h2>
            <p className="text-xs text-slate-500 dark:text-muted-foreground mt-1">
              Conferência, armazém e saídas
            </p>
          </Link>

          <Link
            to="/expedicao/painel"
            className="bg-white dark:bg-card border border-slate-200 dark:border-border rounded-md p-6 text-center hover:bg-slate-50/50 dark:hover:bg-accent/30 hover:border-emerald-200 transition-colors group"
          >
            <div className="w-12 h-12 rounded-md bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center mx-auto mb-3 group-hover:bg-emerald-100 transition-colors">
              <Truck className="w-6 h-6 text-emerald-700 dark:text-emerald-300" />
            </div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-foreground">
              Expedição
            </h2>
            <p className="text-xs text-slate-500 dark:text-muted-foreground mt-1">
              Picking, conferência e romaneio
            </p>
          </Link>
        </div>

        <p className="text-[10px] text-slate-400 dark:text-muted-foreground/60 text-center mt-8 font-mono">
          Pente Fino · v{LATEST_VERSION}
        </p>
      </div>
    </div>
  );
}
