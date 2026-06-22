import { ReactNode } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { atLeast, can, requiredRoleFor, ROLE_LABEL, type Action, type Role } from '@/lib/permissions';
import { Lock } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface RequireRoleProps {
  /** Minimum role required. */
  role?: Role;
  /** Or a specific action from the permission matrix. */
  action?: Action;
  /** What to render if denied. Defaults to `null` (hide). */
  fallback?: ReactNode;
  /** If true, renders a compact lock placeholder with tooltip instead of hiding. */
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
    const needed = action ? requiredRoleFor(action) : (role ?? 'admin');
    const label = `Requer perfil ${ROLE_LABEL[needed]} ou superior`;
    return (
      <TooltipProvider delayDuration={150}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              aria-disabled="true"
              className="inline-flex h-9 w-9 cursor-not-allowed items-center justify-center rounded-lg border border-border/40 bg-muted/30 text-muted-foreground/60"
            >
              <Lock className="h-3.5 w-3.5" />
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">{label}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return <>{fallback}</>;
}
