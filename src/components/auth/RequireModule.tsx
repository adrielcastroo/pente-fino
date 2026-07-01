import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';

interface RequireModuleProps {
  module: 'estoque' | 'expedicao';
  children: React.ReactNode;
}

/**
 * Blocks access to a route group unless the user's profile lists the required module.
 * Redirects to `/` so RoleHomeRedirect can send the user to their allowed home.
 */
export default function RequireModule({ module, children }: RequireModuleProps) {
  const { loading, user, profile, modules, isGuest } = useAuth();

  if (loading || (user && !profile)) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // Guests keep legacy behavior (estoque only).
  if (isGuest) {
    return module === 'estoque' ? <>{children}</> : <Navigate to="/" replace />;
  }

  if (!modules.includes(module)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
