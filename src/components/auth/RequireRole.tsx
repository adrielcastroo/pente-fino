import { ReactNode } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { atLeast, can, ROLE_LABEL, type Action, type Role } from '@/lib/permissions';
import { Lock } from 'lucide-react';

interface RequireRoleProps {
  /** Minimum role required. */
  role?: Role;
  /** Or a specific action from the permission matrix. */
  action?: Action;
  /** What to render if denied. Defaults to `null` (hide). */
  fallback?: ReactNode;
  /** If true, renders a locked placeholder instead of hiding. */
  showLocked?: boolean;
  children: ReactNode;
}

export function RequireRole({ role, action, fallback = null, showLocked, children }: RequireRoleProps) {
  const { role: currentRole, loading } = useAuth();
  if (loading) return null;

  const allowed = action
    ? can(currentRole, action)
    : role
      ? atLeast(currentRole, role)
      : true;

  if (allowed) return <>{children}</>;
  if (showLocked) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border/40 bg-muted/30 p-3 text-xs text-muted-foreground">
        <Lock className="h-3.5 w-3.5" />
        <span>Requer perfil {ROLE_LABEL[role ?? 'admin']} ou superior.</span>
      </div>
    );
  }
  return <>{fallback}</>;
}
