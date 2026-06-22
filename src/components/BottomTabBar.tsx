import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Home, Warehouse, Archive, MoreHorizontal, Waves, TreePine, Settings2, FolderOpen, Table, Package, ShieldAlert, Settings as SettingsIcon, LogOut, LayoutDashboard } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { atLeast } from '@/lib/permissions';

type Tab = { to: string; label: string; icon: any };

const primaryOperacao: Tab[] = [
  { to: '/operacao', label: 'Início', icon: Home },
  { to: '/saida', label: 'Saída', icon: Archive },
  { to: '/estoque', label: 'Estoque', icon: Warehouse },
  { to: '/historico', label: 'Histórico', icon: FolderOpen },
];

const primaryGestao: Tab[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/tecido', label: 'Conferência', icon: Waves },
  { to: '/estoque', label: 'Estoque', icon: Warehouse },
  { to: '/saida', label: 'Saída', icon: Archive },
];

const overflowOperacao: Tab[] = [
  { to: '/tecido', label: 'Tecido', icon: Waves },
  { to: '/madeira', label: 'Madeira', icon: TreePine },
  { to: '/motor', label: 'Motor/Controle', icon: Settings2 },
  { to: '/reservas', label: 'Reservas', icon: Table },
  { to: '/cadastros', label: 'Cadastros', icon: Package },
  { to: '/configuracoes', label: 'Configurações', icon: SettingsIcon },
];


const overflowGestao: Tab[] = [
  { to: '/madeira', label: 'Madeira', icon: TreePine },
  { to: '/motor', label: 'Motor/Controle', icon: Settings2 },
  { to: '/reservas', label: 'Reservas', icon: Table },
  { to: '/historico', label: 'Histórico', icon: FolderOpen },
  { to: '/cadastros', label: 'Cadastros', icon: Package },
  { to: '/auditoria', label: 'Auditoria', icon: ShieldAlert },
  { to: '/configuracoes', label: 'Configurações', icon: SettingsIcon },
];

export default function BottomTabBar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { signOut, role } = useAuth() as any;

  const isGestao = atLeast(role, 'supervisor');
  const primary = useMemo(() => (isGestao ? primaryGestao : primaryOperacao), [isGestao]);
  const overflow = useMemo(() => (isGestao ? overflowGestao : overflowOperacao), [isGestao]);

  const isActive = (to: string) =>
    pathname === to || (to === '/operacao' && pathname === '/');


  return (
    <nav
      className="flex min-[1366px]:hidden fixed bottom-0 left-0 right-0 z-50 h-16 border-t border-border/40 bg-background/95 backdrop-blur shadow-2xl"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Navegação principal"
    >
      <div className="flex w-full items-stretch">
        {primary.map(({ to, label, icon: Icon }) => {
          const active = isActive(to);
          return (
            <NavLink
              key={to}
              to={to}
              aria-current={active ? 'page' : undefined}
              aria-label={label}
              className={cn(
                'flex-1 flex flex-col items-center justify-center gap-0.5 min-h-[56px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset transition-colors',
                active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon
                className={cn('w-6 h-6 md:w-7 md:h-7', active && 'drop-shadow-[0_0_6px_hsl(var(--primary))]')}
                strokeWidth={active ? 2.4 : 1.75}
                fill={active ? 'currentColor' : 'none'}
                fillOpacity={active ? 0.18 : 0}
                aria-hidden="true"
              />
              <span className="text-[10px] md:text-xs font-semibold uppercase tracking-wider">{label}</span>
            </NavLink>
          );
        })}

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              className="flex-1 flex flex-col items-center justify-center gap-0.5 min-h-[56px] text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset transition-colors"
              aria-label="Mais opções"
              aria-haspopup="dialog"
              aria-expanded={open}
            >
              <MoreHorizontal className="w-6 h-6 md:w-7 md:h-7" aria-hidden="true" />
              <span className="text-[10px] md:text-xs font-semibold uppercase tracking-wider">Menu</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-3xl max-h-[80vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="text-left text-xs font-semibold text-muted-foreground">Mais opções</SheetTitle>
            </SheetHeader>
            <div className="grid grid-cols-3 gap-3 mt-4">
              {overflow.map(({ to, label, icon: Icon }) => {
                const active = isActive(to);
                return (
                  <button
                    key={to}
                    onClick={() => { setOpen(false); navigate(to); }}
                    className={cn(
                      'flex flex-col items-center justify-center gap-2 p-4 rounded-md border border-border/40 bg-card/40 min-h-[88px] active:scale-95 transition-all',
                      active && 'ring-2 ring-primary bg-primary/5'
                    )}
                  >
                    <Icon
                      className="w-6 h-6 text-foreground/80"
                      strokeWidth={active ? 2.4 : 1.75}
                      fill={active ? 'currentColor' : 'none'}
                      fillOpacity={active ? 0.18 : 0}
                    />
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground/80 text-center leading-tight">{label}</span>
                  </button>
                );
              })}
              {signOut && (
                <button
                  onClick={() => { setOpen(false); signOut(); }}
                  className="flex flex-col items-center justify-center gap-2 p-4 rounded-md border border-destructive/30 bg-destructive/5 min-h-[88px] active:scale-95 transition-all col-span-3"
                >
                  <LogOut className="w-5 h-5 text-destructive" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-destructive">Sair</span>
                </button>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
