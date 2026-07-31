import { NavLink } from 'react-router-dom';
import { ClipboardList, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const TABS = [
  { path: '/compras/acompanhamentos', label: 'Acompanh.', icon: ClipboardList, exact: true },
  { path: '/compras/analise-compra', label: 'Análise', icon: TrendingDown, exact: false },
] as const;

export default function ComprasBottomTabBar() {
  return (
    <nav
      className="flex desktop:hidden tablet-landscape:hidden fixed bottom-0 left-0 right-0 z-50 h-16 border-t border-border/40 bg-background/95 backdrop-blur shadow-2xl pb-[env(safe-area-inset-bottom,0px)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Navegação Compras"
    >
      <div className="flex w-full items-stretch">
        {TABS.map(({ path, label, icon: Icon, exact }) => (
          <NavLink
            key={path}
            to={path}
            end={exact}
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
                <Icon
                  className={cn('w-6 h-6 transition-transform', isActive && 'scale-110')}
                  strokeWidth={isActive ? 2.4 : 1.75}
                  fill={isActive ? 'currentColor' : 'none'}
                  fillOpacity={isActive ? 0.18 : 0}
                />
                <span className="text-[10px] font-semibold uppercase tracking-wider">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
