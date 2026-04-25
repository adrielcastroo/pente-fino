import { Home, Waves, TreePine, Settings2, Table, FolderOpen, Warehouse, Archive, Settings, LogOut } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import logoComb from '@/assets/logo-comb.png';
import { AppTab } from '@/types';
import { useState, useCallback, memo } from 'react';
import { useAuth } from '@/hooks/use-auth';

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

const menuItems: { key: AppTab; label: string; icon: any; path: string }[] = [
  { key: 'inicio', label: 'Início', icon: Home, path: '/dashboard' },
  { key: 'tecido', label: 'Tecido', icon: Waves, path: '/tecido' },
  { key: 'madeira', label: 'Madeira', icon: TreePine, path: '/madeira' },
  { key: 'motor', label: 'Motor/Controle', icon: Settings2, path: '/motor' },
  { key: 'estoque', label: 'Estoque', icon: Warehouse, path: '/estoque' },
  { key: 'saida', label: 'Saída', icon: Archive, path: '/saida' },
  { key: 'table', label: 'Tabela', icon: Table, path: '/tabela' },
  { key: 'history', label: 'Histórico', icon: FolderOpen, path: '/historico' },
];

const AppSidebar = memo(({ activeTab, onTabChange }: AppSidebarProps) => {
  const { state, setOpen, isMobile, setOpenMobile, open } = useSidebar();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const registroCount = useAppStore(s => s.registros.length);

  const [isHovered, setIsHovered] = useState(false);
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);

  const collapsed = state === 'collapsed';

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

  const handleTabClick = useCallback((tab: AppTab, path: string) => {
    navigate(path);
    if (isMobile) {
      setOpenMobile(false);
    } else if (window.innerWidth < 1024) {
      setOpen(false);
    }
  }, [navigate, isMobile, setOpenMobile, setOpen]);

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
        <button
          onClick={() => handleTabClick('inicio', '/')}
          className="flex items-center gap-3 rounded-xl px-2 py-1.5 group-data-[state=collapsed]:justify-center group-data-[state=collapsed]:px-0 group-data-[state=collapsed]:mx-auto hover:opacity-80 transition-opacity cursor-pointer"
          aria-label="Ir para Início"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center">
            <img src={logoComb} alt="Pente Fino" className="h-7 w-7 object-contain" />
          </div>
          <div className="flex flex-col overflow-hidden transition-all duration-300 group-data-[state=collapsed]:w-0 group-data-[state=collapsed]:opacity-0">
            <span className="text-sm font-bold leading-tight tracking-tight text-foreground whitespace-nowrap">
              Pente Fino
            </span>
            <span className="text-[9px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
              ESTOQUE
            </span>
          </div>
        </button>
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
                const hasRecords = isTableTab && registroCount > 0;

                return (
                <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton
                      size="lg"
                      onClick={() => handleTabClick(item.key, item.path)}
                      tooltip={item.label}
                      isActive={isActive}
                      aria-current={isActive ? 'page' : undefined}
                      className={`
                        relative h-10 rounded-lg transition-all duration-150 active:scale-[0.97]
                        group-data-[state=collapsed]:!h-10 group-data-[state=collapsed]:!w-10
                        group-data-[state=collapsed]:justify-center group-data-[state=collapsed]:mx-auto
                        ${isActive
                          ? 'text-primary font-bold'
                          : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground font-medium'}
                        ${hasRecords && !isActive ? 'ring-1 ring-primary/30 ring-offset-1 ring-offset-sidebar' : ''}
                      `}
                    >
                      {/* Active indicator bar */}
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-primary" />
                      )}

                      {/* Icon */}
                      <div className="relative flex h-5 w-5 shrink-0 items-center justify-center">
                        <Icon className="h-[18px] w-[18px]" />
                        {hasRecords && collapsed && (
                          <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[8px] font-bold text-white">
                            {registroCount}
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
                          {registroCount}
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
          {/* Settings */}
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              onClick={() => handleTabClick('settings', '/configuracoes')}
              isActive={activeTab === 'settings'}
              tooltip="Configurações"
              aria-label="Abrir Configurações"
              className={`
                relative h-10 rounded-lg transition-colors duration-150
                group-data-[state=collapsed]:!h-10 group-data-[state=collapsed]:!w-10
                group-data-[state=collapsed]:justify-center group-data-[state=collapsed]:mx-auto
                ${activeTab === 'settings'
                  ? 'text-primary font-bold'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'}
              `}
            >
              {activeTab === 'settings' && (
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

          {/* Logout */}
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              onClick={() => signOut()}
              tooltip="Sair"
              aria-label="Sair da conta"
              className="h-10 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors duration-150 group-data-[state=collapsed]:!h-10 group-data-[state=collapsed]:!w-10 group-data-[state=collapsed]:justify-center group-data-[state=collapsed]:mx-auto"
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

AppSidebar.displayName = 'AppSidebar';

export default AppSidebar;