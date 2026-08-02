import { memo, useCallback, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Settings, LogOut, ArrowLeftRight, Users, ShieldCheck, type LucideIcon } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/use-auth';
import { atLeast, type Role } from '@/lib/permissions';
import { usePageAccess } from '@/hooks/use-page-access';
import { pageKeyForPath } from '@/lib/page-registry';
import { cn } from '@/lib/utils';
import { prefetchRoute, prefetchOnIdle } from '@/lib/route-prefetch';
import logoComb from '@/assets/logo-comb.webp';

export type ModuleSidebarItem = {
  key: string;
  label: string;
  icon: LucideIcon;
  path: string;
  minRole?: Role;
  /** Badge numérico (ex.: contagem de pendentes). */
  badge?: number;
};

export type ModuleSidebarGroup = {
  label: string;
  items: ModuleSidebarItem[];
  minRole?: Role;
};

export type ModuleSidebarConfig = {
  /** Nome do módulo exibido em CAPS no header (ex.: "ESTOQUE", "EXPEDIÇÃO"). */
  moduleLabel: string;
  /** Rota do logo / link principal. */
  homePath: string;
  /** Rota das configurações no footer. */
  settingsPath: string;
  /** Rota da página de Equipes do módulo (footer, acima de Configurações). */
  teamsPath?: string;
  groups: ModuleSidebarGroup[];
};

interface ModuleSidebarProps {
  config: ModuleSidebarConfig;
}

const ModuleSidebar = memo(({ config }: ModuleSidebarProps) => {
  const { state, isMobile, setOpenMobile } = useSidebar();
  const { signOut, role, modules } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isIconCollapsed = state === 'collapsed' && !isMobile;
  const canSwitch = (modules?.length ?? 0) > 1;

  const { can: canPage } = usePageAccess();

  const visibleGroups = config.groups
    .map(g => ({
      ...g,
      items: g.items.filter(i => {
        if (i.minRole && !atLeast(role, i.minRole)) return false;
        const key = pageKeyForPath(i.path);
        if (key && !canPage(key)) return false;
        return true;
      }),
    }))
    .filter(g => g.items.length > 0 && (!g.minRole || atLeast(role, g.minRole)));

  const handleNavigate = useCallback(
    (path: string) => {
      navigate(path);
      // Fecha apenas o drawer mobile após navegar; desktop respeita o estado escolhido pelo usuário no trigger.
      if (isMobile) setOpenMobile(false);
    },
    [navigate, isMobile, setOpenMobile],
  );

  const isItemActive = (path: string) =>
    location.pathname === path || (path !== '/' && location.pathname.startsWith(path + '/'));

  const settingsActive = isItemActive(config.settingsPath);
  const teamsActive = config.teamsPath ? isItemActive(config.teamsPath) : false;
  const showTeams = Boolean(config.teamsPath) && atLeast(role, 'supervisor');
  const showAdmin = atLeast(role, 'admin');

  // Prefetch em idle das rotas visíveis — navegação passa a ser instantânea
  // após o primeiro segundo de idle da aplicação.
  useEffect(() => {
    const paths = visibleGroups.flatMap(g => g.items.map(i => i.path));
    prefetchOnIdle(paths);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.moduleLabel]);



  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-border/40 bg-sidebar"
      aria-label={`Menu ${config.moduleLabel}`}
    >
      <SidebarHeader className={cn('overflow-hidden py-4', isIconCollapsed ? 'px-0 py-3' : 'px-3')}>
        <button
          onClick={() => handleNavigate(config.homePath)}
          className={cn(
            'flex min-w-0 cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 transition-opacity hover:opacity-80',
            isIconCollapsed && 'mx-auto justify-center px-0',
          )}
          aria-label={`Ir para ${config.moduleLabel}`}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center">
            <img src={logoComb} alt="Pente Fino" className="h-7 w-7 object-contain drop-shadow-sm" />
          </div>
          {!isIconCollapsed && (
          <div className="flex min-w-0 flex-col overflow-hidden">
            <span className="text-sm font-bold leading-tight tracking-tight text-sidebar-accent-foreground truncate">
              Pente Fino
            </span>
            <span className="text-[9px] font-semibold uppercase tracking-[0.15em] text-sidebar-foreground/70 truncate">
              {config.moduleLabel}
            </span>
          </div>
          )}
        </button>
      </SidebarHeader>

      <SidebarContent className={cn('custom-scrollbar overflow-x-hidden', isIconCollapsed ? 'px-0' : 'px-3')}>
        {visibleGroups.map(group => (
          <SidebarGroup key={group.label} className="mb-2 p-0 shrink-0">
            {!isIconCollapsed && (
              <div
                data-sidebar="module-group-label"
                className="flex h-8 shrink-0 items-center px-2 text-[9px] font-semibold uppercase tracking-[0.2em] text-sidebar-foreground/50"
              >
                {group.label}
              </div>
            )}
            <SidebarGroupContent>
              <SidebarMenu className={cn('gap-0.5', isIconCollapsed && 'items-center')}>
                {group.items.map(item => {
                  const Icon = item.icon;
                  const isActive = isItemActive(item.path);
                  const hasBadge = (item.badge ?? 0) > 0;

                  return (
                    <SidebarMenuItem key={item.key}>
                      <SidebarMenuButton
                        size="lg"
                        onClick={() => handleNavigate(item.path)}
                        onMouseEnter={() => prefetchRoute(item.path)}
                        onFocus={() => prefetchRoute(item.path)}
                        onTouchStart={() => prefetchRoute(item.path)}
                        tooltip={item.label}
                        isActive={isActive}
                        aria-current={isActive ? 'page' : undefined}
                        className={cn(
                          'relative h-10 rounded-md transition-colors duration-150 active:scale-[0.97]',
                          isIconCollapsed && '!size-10 !p-0 justify-center',
                          isActive
                            ? 'font-bold text-primary'
                            : 'font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                        )}
                      >
                        {isActive && !isIconCollapsed && (
                          <div className="pointer-events-none absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-primary" />
                        )}

                        <div className="relative flex h-5 w-5 shrink-0 items-center justify-center">
                          <Icon
                            className="h-[18px] w-[18px]"
                            strokeWidth={isActive ? 2.4 : 1.75}
                          />
                          {hasBadge && isIconCollapsed && (
                            <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[8px] font-bold text-destructive-foreground">
                              {item.badge}
                            </span>
                          )}
                        </div>

                        {!isIconCollapsed && (
                          <span className="min-w-0 flex-1 truncate text-left text-[13px]">
                            {item.label}
                          </span>
                        )}

                        {hasBadge && !isIconCollapsed && (
                          <span
                            className={cn(
                              'ml-auto flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-md px-1.5 text-[10px] font-bold tabular-nums',
                              isActive
                                ? 'bg-primary-foreground/20 text-primary-foreground'
                                : 'bg-primary/10 text-primary',
                            )}
                          >
                            {item.badge}
                          </span>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className={cn('overflow-hidden border-t border-border/30 py-3', isIconCollapsed ? 'px-0' : 'px-3')}>
        <SidebarMenu className={cn('gap-0.5', isIconCollapsed && 'items-center')}>
          {showAdmin && (
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                onClick={() => handleNavigate('/admin')}
                isActive={location.pathname.startsWith('/admin')}
                tooltip="Painel Admin"
                aria-label="Abrir Painel Admin"
                className={cn(
                  'relative h-10 rounded-md transition-colors duration-150',
                  isIconCollapsed && '!size-10 !p-0 justify-center',
                  location.pathname.startsWith('/admin')
                    ? 'font-bold text-primary'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                )}
              >
                {location.pathname.startsWith('/admin') && !isIconCollapsed && (
                  <div className="pointer-events-none absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-primary" />
                )}
                <div className="flex h-5 w-5 shrink-0 items-center justify-center">
                  <ShieldCheck className="h-[18px] w-[18px]" />
                </div>
                {!isIconCollapsed && (
                  <span className="min-w-0 flex-1 truncate text-left text-xs font-medium">
                    Painel Admin
                  </span>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}

          {showTeams && (
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                onClick={() => handleNavigate(config.teamsPath!)}
                isActive={teamsActive}
                tooltip="Equipes"
                aria-label="Abrir Equipes"
                className={cn(
                  'relative h-10 rounded-md transition-colors duration-150',
                  isIconCollapsed && '!size-10 !p-0 justify-center',
                  teamsActive
                    ? 'font-bold text-primary'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                )}
              >
                {teamsActive && !isIconCollapsed && (
                  <div className="pointer-events-none absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-primary" />
                )}
                <div className="flex h-5 w-5 shrink-0 items-center justify-center">
                  <Users className="h-[18px] w-[18px]" />
                </div>
                {!isIconCollapsed && (
                  <span className="min-w-0 flex-1 truncate text-left text-xs font-medium">
                    Equipes
                  </span>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}

          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              onClick={() => handleNavigate(config.settingsPath)}
              isActive={settingsActive}
              tooltip="Configurações"
              aria-label="Abrir Configurações"
              className={cn(
                'relative h-10 rounded-md transition-colors duration-150',
                isIconCollapsed && '!size-10 !p-0 justify-center',
                settingsActive
                  ? 'font-bold text-primary'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
              )}
            >
              {settingsActive && !isIconCollapsed && (
                <div className="pointer-events-none absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-primary" />
              )}
              <div className="flex h-5 w-5 shrink-0 items-center justify-center">
                <Settings className="h-[18px] w-[18px]" />
              </div>
              {!isIconCollapsed && (
                <span className="min-w-0 flex-1 truncate text-left text-xs font-medium">
                  Configurações
                </span>
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>

          {canSwitch && (
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                onClick={() => navigate('/selecionar-modulo?switch=1')}
                tooltip="Trocar módulo"
                aria-label="Trocar módulo"
                className={cn(
                  'h-10 rounded-md text-sidebar-foreground transition-colors duration-150 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                  isIconCollapsed && '!size-10 !p-0 justify-center',
                )}
              >
                <div className="flex h-5 w-5 shrink-0 items-center justify-center">
                  <ArrowLeftRight className="h-[18px] w-[18px]" />
                </div>
                {!isIconCollapsed && (
                  <span className="min-w-0 flex-1 truncate text-left text-xs font-medium">
                    Trocar módulo
                  </span>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}

          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              onClick={() => signOut()}
              tooltip="Sair"
              aria-label="Sair da conta"
              className={cn(
                'h-10 rounded-md text-sidebar-foreground transition-colors duration-150 hover:bg-destructive/10 hover:text-destructive',
                isIconCollapsed && '!size-10 !p-0 justify-center',
              )}
            >
              <div className="flex h-5 w-5 shrink-0 items-center justify-center">
                <LogOut className="h-[18px] w-[18px]" />
              </div>
              {!isIconCollapsed && (
                <span className="min-w-0 flex-1 truncate text-left text-xs font-medium">
                  Sair
                </span>
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
});

ModuleSidebar.displayName = 'ModuleSidebar';

export default ModuleSidebar;
