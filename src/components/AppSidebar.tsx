import { Home, Waves, TreePine, Settings2, Table, FolderOpen, Warehouse, Archive, Settings, Sun, Moon } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { Logo } from './Logo';
import { useTheme } from 'next-themes';
import { AppTab } from '@/types';
import { useState, useCallback, memo } from 'react';
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

interface AppSidebarProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  onOpenConfig?: () => void;
}

const menuItems: { key: AppTab; label: string; icon: any }[] = [
  { key: 'inicio', label: 'Início', icon: Home },
  { key: 'tecido', label: 'Tecido', icon: Waves },
  { key: 'madeira', label: 'Madeira', icon: TreePine },
  { key: 'motor', label: 'Motor/Controle', icon: Settings2 },
  { key: 'estoque', label: 'Estoque', icon: Warehouse },
  { key: 'saida', label: 'Saída', icon: Archive },
  { key: 'table', label: 'Tabela', icon: Table },
  { key: 'history', label: 'Histórico', icon: FolderOpen },
];

const AppSidebar = memo(({ activeTab, onTabChange }: AppSidebarProps) => {
  const { state, setOpen, isMobile, setOpenMobile, open } = useSidebar();
  const registros = useAppStore(s => s.registros);
  const { theme, setTheme } = useTheme();
  const [isHovered, setIsHovered] = useState(false);
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);

  const collapsed = state === 'collapsed';

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  const handleMouseEnter = useCallback(() => {
    if (hoverTimeout) clearTimeout(hoverTimeout);
    if (!isMobile && !open) {
      setOpen(true);
      setIsHovered(true);
    }
  }, [hoverTimeout, isMobile, open, setOpen]);

  const handleMouseLeave = useCallback(() => {
    if (!isMobile && isHovered) {
      const timeout = setTimeout(() => {
        setOpen(false);
        setIsHovered(false);
      }, 300);
      setHoverTimeout(timeout);
    }
  }, [isMobile, isHovered, setOpen]);

  const handleTabClick = useCallback((tab: AppTab) => {
    onTabChange(tab);
    if (isMobile) {
      setOpenMobile(false);
    } else if (window.innerWidth < 1024) {
      setOpen(false);
    }
  }, [onTabChange, isMobile, setOpenMobile, setOpen]);

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-border/40 bg-sidebar"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      aria-label="Menu Principal"
    >
      {/* ── Header / Logo ── */}
      <SidebarHeader className="px-3 py-4 group-data-[state=collapsed]:px-0 group-data-[state=collapsed]:py-3">
        <div className="flex items-center gap-3 rounded-xl px-2 py-1.5 group-data-[state=collapsed]:justify-center group-data-[state=collapsed]:px-0 group-data-[state=collapsed]:mx-auto">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Logo className="h-5 w-5" />
          </div>
          <div className="flex flex-col overflow-hidden transition-all duration-300 group-data-[state=collapsed]:w-0 group-data-[state=collapsed]:opacity-0">
            <span className="text-sm font-bold leading-tight tracking-tight text-foreground whitespace-nowrap">
              Pente Fino
            </span>
            <span className="text-[9px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
              ESTOQUE
            </span>
          </div>
        </div>
      </SidebarHeader>

      {/* ── Nav Items ── */}
      <SidebarContent className="px-3 group-data-[state=collapsed]:px-0 custom-scrollbar">
        <SidebarGroup className="p-0">
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5 group-data-[state=collapsed]:items-center">
              {menuItems.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.key;
                const isTableTab = item.key === 'table';
                const hasRecords = isTableTab && registros.length > 0;

                return (
                <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton
                      size="lg"
                      onClick={() => handleTabClick(item.key)}
                      tooltip={item.label}
                      isActive={isActive}
                      aria-current={isActive ? 'page' : undefined}
                      className={`
                        relative h-10 rounded-lg transition-all duration-150 active:scale-[0.97]
                        group-data-[state=collapsed]:!h-10 group-data-[state=collapsed]:!w-10
                        group-data-[state=collapsed]:justify-center group-data-[state=collapsed]:mx-auto
                        ${isActive
                          ? 'bg-primary text-primary-foreground font-bold shadow-sm group-data-[state=collapsed]:bg-primary/15 group-data-[state=collapsed]:text-primary group-data-[state=collapsed]:shadow-none'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground font-medium'}
                        ${hasRecords && !isActive ? 'ring-1 ring-primary/30 ring-offset-1 ring-offset-sidebar' : ''}
                      `}
                    >
                      {/* Active indicator bar - only show when expanded */}
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-primary-foreground/40 group-data-[state=collapsed]:hidden" />
                      )}

                      {/* Icon */}
                      <div className="relative flex h-5 w-5 shrink-0 items-center justify-center">
                        <Icon className="h-[18px] w-[18px]" />
                        {hasRecords && collapsed && (
                          <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[8px] font-bold text-white">
                            {registros.length}
                          </span>
                        )}
                      </div>

                      {/* Label */}
                      <span className="truncate text-[13px] transition-all duration-300 group-data-[state=collapsed]:w-0 group-data-[state=collapsed]:opacity-0">
                        {item.label}
                      </span>

                      {/* Badge (expanded) */}
                      {hasRecords && (
                        <span
                          className={`ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-md px-1.5 text-[10px] font-bold tabular-nums transition-all duration-300 group-data-[state=collapsed]:w-0 group-data-[state=collapsed]:opacity-0 ${
                            isActive
                              ? 'bg-primary-foreground/20 text-primary-foreground'
                              : 'bg-primary/10 text-primary'
                          }`}
                        >
                          {registros.length}
                        </span>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* ── Footer ── */}
      <SidebarFooter className="px-3 py-3 group-data-[state=collapsed]:px-0 border-t border-border/30">
        <SidebarMenu className="gap-0.5 group-data-[state=collapsed]:items-center">
          {/* Theme toggle */}
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              onClick={toggleTheme}
              tooltip={theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
              aria-label="Alternar Tema"
              className="h-10 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors duration-150 group-data-[state=collapsed]:!h-10 group-data-[state=collapsed]:!w-10 group-data-[state=collapsed]:justify-center group-data-[state=collapsed]:mx-auto"
            >
              <div className="flex h-5 w-5 shrink-0 items-center justify-center">
                {theme === 'dark'
                  ? <Sun className="h-[18px] w-[18px] text-amber-500" />
                  : <Moon className="h-[18px] w-[18px] text-indigo-400" />
                }
              </div>
              <span className="text-xs font-medium transition-all duration-300 group-data-[state=collapsed]:w-0 group-data-[state=collapsed]:opacity-0 overflow-hidden whitespace-nowrap">
                {theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* Settings */}
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              onClick={() => handleTabClick('settings')}
              isActive={activeTab === 'settings'}
              tooltip="Configurações"
              aria-label="Abrir Configurações"
              className={`
                relative h-10 rounded-lg transition-colors duration-150
                group-data-[state=collapsed]:!h-10 group-data-[state=collapsed]:!w-10
                group-data-[state=collapsed]:justify-center group-data-[state=collapsed]:mx-auto
                ${activeTab === 'settings'
                  ? 'bg-primary text-primary-foreground font-bold shadow-sm group-data-[state=collapsed]:ring-2 group-data-[state=collapsed]:ring-primary/30 group-data-[state=collapsed]:ring-offset-2 group-data-[state=collapsed]:ring-offset-sidebar'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'}
              `}
            >
              {activeTab === 'settings' && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-primary-foreground/40 group-data-[state=collapsed]:hidden" />
              )}
              <div className="flex h-5 w-5 shrink-0 items-center justify-center">
                <Settings className="h-[18px] w-[18px]" />
              </div>
              <span className="text-xs font-medium transition-all duration-300 group-data-[state=collapsed]:w-0 group-data-[state=collapsed]:opacity-0 overflow-hidden whitespace-nowrap">
                Configurações
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
});

AppSidebar.displayName = 'AppSidebar';

export default AppSidebar;