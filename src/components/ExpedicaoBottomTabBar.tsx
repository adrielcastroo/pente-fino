import { NavLink } from 'react-router-dom';
import { Home, ClipboardList, ScanLine, Truck, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useExpedicaoAlertCounts } from '@/hooks/expedicao/useExpedicaoAlertCounts';

const TABS = [
  { path: '/expedicao/operacao', label: 'Início', icon: Home, badgeKey: null },
  { path: '/expedicao/painel', label: 'Painel', icon: ClipboardList, badgeKey: 'painel' },
  { path: '/expedicao/conferencia', label: 'Conferir', icon: ScanLine, badgeKey: 'conferencia' },
  { path: '/expedicao/cargas', label: 'Cargas', icon: Truck, badgeKey: 'cargas' },
  { path: '/expedicao/nfe-entrada', label: 'NF-e', icon: Inbox, badgeKey: 'nfeEntrada' },
] as const;

export default function ExpedicaoBottomTabBar() {
  const { data: counts } = useExpedicaoAlertCounts();

  return (
    <nav
      className="flex desktop:hidden tablet-landscape:hidden fixed bottom-0 left-0 right-0 z-50 h-16 border-t border-border/40 bg-background/95 backdrop-blur shadow-2xl pb-[env(safe-area-inset-bottom,0px)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Navegação Expedição"
    >
      <div className="flex w-full items-stretch">
        {TABS.map(({ path, label, icon: Icon, badgeKey }) => {
          const badge = badgeKey ? counts?.[badgeKey] ?? 0 : 0;
          return (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                cn(
                  'relative flex-1 flex flex-col items-center justify-center gap-0.5 min-h-[56px] transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute top-0 left-1/2 -translate-x-1/2 h-[3px] w-10 rounded-b-full bg-primary" />
                  )}
                  <div className="relative">
                    <Icon
                      className={cn('w-6 h-6 transition-transform', isActive && 'scale-110 drop-shadow-[0_0_6px_hsl(var(--primary)/0.45)]')}
                      strokeWidth={isActive ? 2.4 : 1.75}
                      fill={isActive ? 'currentColor' : 'none'}
                      fillOpacity={isActive ? 0.18 : 0}
                    />
                    {badge > 0 && (
                      <span className="absolute -right-2 -top-1 min-w-[16px] h-4 px-1 rounded-full bg-destructive text-white text-[9px] font-bold flex items-center justify-center leading-none">
                        {badge > 99 ? '99+' : badge}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider">{label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
