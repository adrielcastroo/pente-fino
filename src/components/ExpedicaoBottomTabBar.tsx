import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { EXPEDICAO_NAV } from '@/components/ExpedicaoSidebar';

const MOBILE_NAV = EXPEDICAO_NAV.groups[0].items.slice(0, 5);

export default function ExpedicaoBottomTabBar() {
  return (
    <nav
      className="flex desktop:hidden tablet-landscape:hidden fixed bottom-0 left-0 right-0 z-50 h-16 border-t border-border/40 bg-background/95 backdrop-blur shadow-2xl pb-[env(safe-area-inset-bottom,0px)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Navegação Expedição"
    >
      <div className="flex w-full items-stretch">
        {MOBILE_NAV.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              cn(
                'flex-1 flex flex-col items-center justify-center gap-0.5 min-h-[56px] transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  className={cn('w-6 h-6', isActive && 'drop-shadow-[0_0_6px_hsl(var(--primary))]')}
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
