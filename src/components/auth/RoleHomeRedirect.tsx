import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { atLeast } from '@/lib/permissions';

/**
 * Redirects the root path based on the user's role:
 *   - gestão (admin / gerente / supervisor) → /dashboard
 *   - operação (operador / user)             → /operacao
 */
export default function RoleHomeRedirect() {
  const { role, loading, isGuest } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // Guests have no role — default to operational home.
  if (isGuest) return <Navigate to="/operacao" replace />;

  const isGestao = atLeast(role, 'supervisor');
  return <Navigate to={isGestao ? '/dashboard' : '/operacao'} replace />;
}
