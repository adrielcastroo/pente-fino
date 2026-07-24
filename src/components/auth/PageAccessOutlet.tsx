import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { usePageAccess } from '@/hooks/use-page-access';
import { pageKeyForPath } from '@/lib/page-registry';

/**
 * Guard baseado em Outlet: verifica se o pathname atual está catalogado
 * em `page-registry` e se o usuário pode acessá-lo. Se não puder, redireciona.
 * Rotas não-catalogadas passam sem restrição.
 */
export default function PageAccessOutlet() {
  const location = useLocation();
  const { loading, can } = usePageAccess();

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const key = pageKeyForPath(location.pathname);
  if (key && !can(key)) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}
