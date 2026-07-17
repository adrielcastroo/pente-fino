import { Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { atLeast } from '@/lib/permissions';

/**
 * Redirects the root path based on the user's role:
 *   - gestão (admin / gerente / supervisor) → /dashboard
 *   - operação (operador / user)             → /operacao
 */
export default function RoleHomeRedirect() {
  const { role, loading, isGuest, modules, user, profile } = useAuth();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), 5000);
    return () => clearTimeout(t);
  }, []);

  // Wait for profile to load so `modules` is accurate (avoids default 'estoque' redirect)
  if ((loading || (user && !profile)) && !timedOut) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!user && !isGuest) return <Navigate to="/login" replace />;

  // Guests have no role — default to operational home.
  if (isGuest) return <Navigate to="/estoque/operacao" replace />;

  // Bifurcação de módulos: se tem acesso a ambos, mostra seletor
  const hasEstoque = modules.includes('estoque');
  const hasExpedicao = modules.includes('expedicao');
  if (hasEstoque && hasExpedicao) return <Navigate to="/selecionar-modulo" replace />;
  if (hasExpedicao && !hasEstoque) return <Navigate to="/expedicao/painel" replace />;

  const isGestao = atLeast(role, 'supervisor');
  return <Navigate to={isGestao ? '/estoque/dashboard' : '/estoque/operacao'} replace />;
}
