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
      className="border-r border-border/30 bg-sidebar"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      aria-label="Menu Principal"
    >
      {/* ── Header / Logo ── */}
      <SidebarHeader className="px-3 py-4 group-data-[state=collapsed]:px-2 group-data-[state=collapsed]:py-3">
        <div className="flex items-center gap-3 rounded-xl px-2 py-1.5 group-data-[state=collapsed]:justify-center group-data-[state=collapsed]:px-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20">
            <Logo className="h-6 w-6" />
          </div>
          {!collapsed && (
            <div className="flex flex-col overflow-hidden">
              <span className="text-base font-black leading-tight tracking-tighter text-foreground whitespace-nowrap">
                Pente Fino
              </span>
              <span className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-muted-foreground">
                ESTOQUE
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      {/* ── Nav Items ── */}
      <SidebarContent className="px-3 group-data-[state=collapsed]:px-2 custom-scrollbar">
        <SidebarGroup className="p-0">
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
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
                        relative h-11 rounded-xl transition-all duration-100 active:scale-95
                        group-data-[state=collapsed]:!h-11 group-data-[state=collapsed]:!w-11
                        group-data-[state=collapsed]:justify-center
                        ${isActive
                          ? 'bg-primary text-white font-bold shadow-lg shadow-primary/25 scale-[1.02]'
                          : 'text-muted-foreground hover:bg-primary/10 hover:text-primary font-medium'}
                        ${hasRecords && !isActive ? 'ring-1 ring-primary/40 ring-offset-1 ring-offset-sidebar' : ''}
                      `}
                    >
                      {/* Active indicator bar */}
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-white/50" />
                      )}

                      {/* Icon */}
                      <div className="relative flex h-5 w-5 shrink-0 items-center justify-center">
                        <Icon className="h-[18px] w-[18px]" />
                        {hasRecords && collapsed && (
                          <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[8px] font-black text-white shadow-sm">
                            {registros.length}
                          </span>
                        )}
                      </div>

                      {/* Label */}
                      {!collapsed && (
                        <span className="truncate text-sm">{item.label}</span>
                      )}

                      {/* Badge (expanded) */}
                      {hasRecords && !collapsed && (
                        <span
                          className={`ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-md px-1 text-[10px] font-black tabular-nums ${
                            isActive
                              ? 'bg-white/20 text-white'
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
      <SidebarFooter className="px-3 py-3 group-data-[state=collapsed]:px-2 border-t border-border/20">
        <SidebarMenu className="gap-1">
          {/* Theme toggle */}
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              onClick={toggleTheme}
              tooltip={theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
              aria-label="Alternar Tema"
              className="h-11 rounded-xl text-muted-foreground hover:bg-sidebar-accent hover:text-foreground transition-colors duration-150 group-data-[state=collapsed]:!h-11 group-data-[state=collapsed]:!w-11 group-data-[state=collapsed]:justify-center"
            >
              <div className="flex h-5 w-5 shrink-0 items-center justify-center">
                {theme === 'dark'
                  ? <Sun className="h-[18px] w-[18px] text-amber-500" />
                  : <Moon className="h-[18px] w-[18px] text-indigo-400" />
                }
              </div>
              {!collapsed && (
                <span className="text-xs font-bold uppercase tracking-widest opacity-70">
                  {theme === 'dark' ? 'Dia' : 'Noite'}
                </span>
              )}
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
                h-11 rounded-xl transition-colors duration-150
                group-data-[state=collapsed]:!h-11 group-data-[state=collapsed]:!w-11
                group-data-[state=collapsed]:justify-center
                ${activeTab === 'settings'
                  ? 'bg-primary text-primary-foreground font-bold shadow-sm shadow-primary/20'
                  : 'text-muted-foreground hover:bg-sidebar-accent hover:text-foreground'}
              `}
            >
              {activeTab === 'settings' && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-white/50" />
              )}
              <div className="flex h-5 w-5 shrink-0 items-center justify-center">
                <Settings className="h-[18px] w-[18px]" />
              </div>
              {!collapsed && (
                <span className="text-xs font-bold uppercase tracking-widest opacity-70">
                  Ajustes
                </span>
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
});

AppSidebar.displayName = 'AppSidebar';

export default AppSidebar;
