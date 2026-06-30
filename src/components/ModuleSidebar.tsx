import { memo, useCallback, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Settings, LogOut, ArrowLeftRight } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/use-auth';
import { atLeast, type Role } from '@/lib/permissions';
import logoComb from '@/assets/logo-comb.png';

export type ModuleSidebarItem = {
  key: string;
  label: string;
  icon: any;
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
  groups: ModuleSidebarGroup[];
};

interface ModuleSidebarProps {
  config: ModuleSidebarConfig;
}

const ModuleSidebar = memo(({ config }: ModuleSidebarProps) => {
  const { state, setOpen, isMobile, setOpenMobile, open } = useSidebar();
  const { signOut, role, modules } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const collapsed = state === 'collapsed';
  const canSwitch = (modules?.length ?? 0) > 1;

  const visibleGroups = config.groups
    .map(g => ({ ...g, items: g.items.filter(i => !i.minRole || atLeast(role, i.minRole)) }))
    .filter(g => g.items.length > 0 && (!g.minRole || atLeast(role, g.minRole)));

  const [isHovered, setIsHovered] = useState(false);
  const [hoverTimeout, setHoverTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = useCallback(() => {
    if (hoverTimeout) clearTimeout(hoverTimeout);
    if (!isMobile && !open) {
      setOpen(true);
      setIsHovered(true);
    }
  }, [hoverTimeout, isMobile, open, setOpen]);

  const handleMouseLeave = useCallback(() => {
    if (!isMobile && isHovered) {
      const t = setTimeout(() => {
        setOpen(false);
        setIsHovered(false);
      }, 300);
      setHoverTimeout(t);
    }
  }, [isMobile, isHovered, setOpen]);

  const handleNavigate = useCallback(
    (path: string) => {
      navigate(path);
      if (isMobile) setOpenMobile(false);
      else if (window.innerWidth < 1024) setOpen(false);
    },
    [navigate, isMobile, setOpenMobile, setOpen],
  );

  const isItemActive = (path: string) =>
    location.pathname === path || (path !== '/' && location.pathname.startsWith(path + '/'));

  const settingsActive = isItemActive(config.settingsPath);

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-border/40 bg-sidebar"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      aria-label={`Menu ${config.moduleLabel}`}
    >
      <SidebarHeader className="px-3 py-4 group-data-[state=collapsed]:px-0 group-data-[state=collapsed]:py-3">
        <button
          onClick={() => handleNavigate(config.homePath)}
          className="flex items-center gap-3 rounded-md px-2 py-1.5 group-data-[state=collapsed]:justify-center group-data-[state=collapsed]:px-0 group-data-[state=collapsed]:mx-auto hover:opacity-80 transition-opacity cursor-pointer"
          aria-label={`Ir para ${config.moduleLabel}`}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center">
            <img src={logoComb} alt="Pente Fino" className="h-7 w-7 object-contain" />
          </div>
          <div className="flex flex-col overflow-hidden transition-all duration-300 group-data-[state=collapsed]:w-0 group-data-[state=collapsed]:opacity-0">
            <span className="text-sm font-bold leading-tight tracking-tight text-foreground whitespace-nowrap">
              Pente Fino
            </span>
            <span className="text-[9px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
              {config.moduleLabel}
            </span>
          </div>
        </button>
      </SidebarHeader>

      <SidebarContent className="px-3 group-data-[state=collapsed]:px-0 custom-scrollbar">
        {visibleGroups.map(group => (
          <SidebarGroup key={group.label} className="p-0 mb-2">
            <SidebarGroupLabel className="px-2 text-[9px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/60 group-data-[state=collapsed]:hidden">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5 group-data-[state=collapsed]:items-center">
                {group.items.map(item => {
                  const Icon = item.icon;
                  const isActive = isItemActive(item.path);
                  const hasBadge = (item.badge ?? 0) > 0;

                  return (
                    <SidebarMenuItem key={item.key}>
                      <SidebarMenuButton
                        size="lg"
                        onClick={() => handleNavigate(item.path)}
                        tooltip={item.label}
                        isActive={isActive}
                        aria-current={isActive ? 'page' : undefined}
                        className={`
                          relative h-10 rounded-md transition-all duration-150 active:scale-[0.97]
                          group-data-[state=collapsed]:!h-10 group-data-[state=collapsed]:!w-10
                          group-data-[state=collapsed]:justify-center group-data-[state=collapsed]:mx-auto
                          ${isActive
                            ? 'text-primary font-bold'
                            : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground font-medium'}
                          ${hasBadge && !isActive ? 'ring-1 ring-primary/30 ring-offset-1 ring-offset-sidebar' : ''}
                        `}
                      >
                        {isActive && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-primary" />
                        )}

                        <div className="relative flex h-5 w-5 shrink-0 items-center justify-center">
                          <Icon
                            className="h-[18px] w-[18px]"
                            strokeWidth={isActive ? 2.4 : 1.75}
                            fill={isActive ? 'currentColor' : 'none'}
                            fillOpacity={isActive ? 0.18 : 0}
                          />
                          {hasBadge && collapsed && (
                            <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[8px] font-bold text-white">
                              {item.badge}
                            </span>
                          )}
                        </div>

                        <span className="truncate text-[13px] transition-all duration-300 group-data-[state=collapsed]:w-0 group-data-[state=collapsed]:opacity-0">
                          {item.label}
                        </span>

                        {hasBadge && (
                          <span
                            className={`ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-md px-1.5 text-[10px] font-bold tabular-nums transition-all duration-300 group-data-[state=collapsed]:w-0 group-data-[state=collapsed]:opacity-0 ${
                              isActive
                                ? 'bg-primary-foreground/20 text-primary-foreground'
                                : 'bg-primary/10 text-primary'
                            }`}
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

      <SidebarFooter className="px-3 py-3 group-data-[state=collapsed]:px-0 border-t border-border/30">
        <SidebarMenu className="gap-0.5 group-data-[state=collapsed]:items-center">
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              onClick={() => handleNavigate(config.settingsPath)}
              isActive={settingsActive}
              tooltip="Configurações"
              aria-label="Abrir Configurações"
              className={`
                relative h-10 rounded-md transition-colors duration-150
                group-data-[state=collapsed]:!h-10 group-data-[state=collapsed]:!w-10
                group-data-[state=collapsed]:justify-center group-data-[state=collapsed]:mx-auto
                ${settingsActive
                  ? 'text-primary font-bold'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'}
              `}
            >
              {settingsActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-primary" />
              )}
              <div className="flex h-5 w-5 shrink-0 items-center justify-center">
                <Settings className="h-[18px] w-[18px]" />
              </div>
              <span className="text-xs font-medium transition-all duration-300 group-data-[state=collapsed]:w-0 group-data-[state=collapsed]:opacity-0 overflow-hidden whitespace-nowrap">
                Configurações
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {canSwitch && (
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                onClick={() => navigate('/selecionar-modulo')}
                tooltip="Trocar módulo"
                aria-label="Trocar módulo"
                className="h-10 rounded-md text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors duration-150 group-data-[state=collapsed]:!h-10 group-data-[state=collapsed]:!w-10 group-data-[state=collapsed]:justify-center group-data-[state=collapsed]:mx-auto"
              >
                <div className="flex h-5 w-5 shrink-0 items-center justify-center">
                  <ArrowLeftRight className="h-[18px] w-[18px]" />
                </div>
                <span className="text-xs font-medium transition-all duration-300 group-data-[state=collapsed]:w-0 group-data-[state=collapsed]:opacity-0 overflow-hidden whitespace-nowrap">
                  Trocar módulo
                </span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}

          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              onClick={() => signOut()}
              tooltip="Sair"
              aria-label="Sair da conta"
              className="h-10 rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors duration-150 group-data-[state=collapsed]:!h-10 group-data-[state=collapsed]:!w-10 group-data-[state=collapsed]:justify-center group-data-[state=collapsed]:mx-auto"
            >
              <div className="flex h-5 w-5 shrink-0 items-center justify-center">
                <LogOut className="h-[18px] w-[18px]" />
              </div>
              <span className="text-xs font-medium transition-all duration-300 group-data-[state=collapsed]:w-0 group-data-[state=collapsed]:opacity-0 overflow-hidden whitespace-nowrap">
                Sair
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
});

ModuleSidebar.displayName = 'ModuleSidebar';

export default ModuleSidebar;
