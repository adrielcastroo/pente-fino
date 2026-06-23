import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useMemo } from 'react';
import {
  LayoutDashboard,
  ScanLine,
  TreePine,
  Zap,
  Package,
  ArrowUpRight,
  FolderOpen,
  Package,
  Table,
  ShieldAlert,
  Settings as SettingsIcon,
  LogOut,
  Home,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { atLeast } from '@/lib/permissions';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type RailItem = { to: string; label: string; icon: any };

const railOperacao: RailItem[] = [
  { to: '/operacao', label: 'Início', icon: Home },
  { to: '/tecido', label: 'Tecido', icon: ScanLine },
  { to: '/madeira', label: 'Madeira', icon: TreePine },
  { to: '/motor', label: 'Motor/Controle', icon: Zap },
  { to: '/estoque', label: 'Estoque', icon: Package },
  { to: '/saida', label: 'Saída', icon: ArrowUpRight },
  { to: '/historico', label: 'Histórico', icon: FolderOpen },
];

const railGestao: RailItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/tecido', label: 'Conferência', icon: ScanLine },
  { to: '/estoque', label: 'Estoque', icon: Package },
  { to: '/saida', label: 'Saída', icon: ArrowUpRight },
  { to: '/historico', label: 'Histórico', icon: FolderOpen },
  { to: '/reservas', label: 'Reservas', icon: Table },
  { to: '/cadastros', label: 'Cadastros', icon: Package },
  { to: '/auditoria', label: 'Auditoria', icon: ShieldAlert },
];

/**
 * Rail vertical 64px para tablets em landscape (modo supervisão).
 * Renderiza apenas ícones com tooltip.
 */
export default function NavRail() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { signOut, role } = useAuth() as any;

  const isGestao = atLeast(role, 'supervisor');
  const items = useMemo(() => (isGestao ? railGestao : railOperacao), [isGestao]);

  const isActive = (to: string) =>
    pathname === to || (to === '/operacao' && pathname === '/');

  return (
    <TooltipProvider delayDuration={300}>
      <nav
        className="hidden tablet-landscape:flex flex-col items-center w-16 shrink-0 border-r border-border/40 bg-background/95 backdrop-blur z-40 py-2"
        aria-label="Navegação lateral"
      >
        <div className="flex flex-col gap-1 flex-1 w-full items-center">
          {items.map(({ to, label, icon: Icon }) => {
            const active = isActive(to);
            return (
              <Tooltip key={to}>
                <TooltipTrigger asChild>
                  <NavLink
                    to={to}
                    aria-label={label}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex items-center justify-center w-12 h-12 rounded-lg transition-colors',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      active
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    )}
                  >
                    <Icon
                      className="w-5 h-5"
                      strokeWidth={active ? 2.4 : 1.75}
                      fill={active ? 'currentColor' : 'none'}
                      fillOpacity={active ? 0.18 : 0}
                      aria-hidden="true"
                    />
                  </NavLink>
                </TooltipTrigger>
                <TooltipContent side="right">{label}</TooltipContent>
              </Tooltip>
            );
          })}
        </div>

        <div className="flex flex-col gap-1 w-full items-center pt-2 border-t border-border/30">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => navigate('/configuracoes')}
                aria-label="Configurações"
                className={cn(
                  'flex items-center justify-center w-12 h-12 rounded-lg transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  pathname === '/configuracoes'
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
              >
                <SettingsIcon className="w-5 h-5" aria-hidden="true" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Configurações</TooltipContent>
          </Tooltip>

          {signOut && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => signOut()}
                  aria-label="Sair"
                  className="flex items-center justify-center w-12 h-12 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <LogOut className="w-5 h-5" aria-hidden="true" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Sair</TooltipContent>
            </Tooltip>
          )}
        </div>
      </nav>
    </TooltipProvider>
  );
}
