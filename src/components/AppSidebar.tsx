import { Home, Layers3, Package, Settings2, Table, FolderOpen, Warehouse, Settings, Sun, Moon, Pin, PinOff } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { Logo } from './Logo';
import { useTheme } from '@/hooks/useTheme';
import { useState, useEffect } from 'react';
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

type AppTab = 'inicio' | 'tecido' | 'madeira' | 'motor' | 'estoque' | 'table' | 'history';

interface AppSidebarProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  onOpenConfig?: () => void;
}

const menuItems: { key: AppTab; label: string; icon: typeof Home }[] = [
  { key: 'inicio', label: 'Início', icon: Home },
  { key: 'tecido', label: 'Tecido', icon: Layers3 },
  { key: 'madeira', label: 'Madeira', icon: Package },
  { key: 'motor', label: 'Motor/Controle', icon: Settings2 },
  { key: 'estoque', label: 'Estoque', icon: Warehouse },
  { key: 'table', label: 'Tabela', icon: Table },
  { key: 'history', label: 'Histórico', icon: FolderOpen },
];

export default function AppSidebar({ activeTab, onTabChange, onOpenConfig }: AppSidebarProps) {
  const { state, setOpen, isMobile, toggleSidebar } = useSidebar();
  const [isPinned, setIsPinned] = useState(true);
  const registros = useAppStore(s => s.registros);
  const { theme, toggleTheme } = useTheme();

  // Sync sidebar state with pin state
  useEffect(() => {
    if (!isMobile) {
      setOpen(isPinned);
    }
  }, [isPinned, isMobile, setOpen]);

  const handleMouseEnter = () => {
    if (!isPinned && !isMobile) {
      setOpen(true);
    }
  };

  const handleMouseLeave = () => {
    if (!isPinned && !isMobile) {
      setOpen(false);
    }
  };

  const handleTabClick = (tab: AppTab) => {
    onTabChange(tab);
    if (isMobile) {
      toggleSidebar();
    }
  };

  const collapsed = state === 'collapsed';

  return (
    <Sidebar 
      collapsible="icon" 
      className={`border-r border-border/50 bg-sidebar transition-all duration-300 ease-in-out ${collapsed ? 'w-[--sidebar-width-icon]' : 'w-[--sidebar-width]'}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary/10 flex-shrink-0 shadow-sm border border-primary/20 backdrop-blur-sm transition-all duration-300">
            <Logo className="w-6 h-6" />
          </div>
          <div className={`flex flex-col transition-opacity duration-300 ${collapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>
            <span className="font-bold text-sm text-foreground leading-tight tracking-tight whitespace-nowrap">Pente Fino</span>
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider whitespace-nowrap">Gestão Industrial</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.key;
                const isTableTab = item.key === 'table';
                
                return (
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton
                      onClick={() => handleTabClick(item.key)}
                      tooltip={item.label}
                      isActive={isActive}
                      className={`
                        ${isActive 
                          ? 'bg-primary/10 text-primary font-bold shadow-sm transition-all duration-300 scale-[1.02] ring-1 ring-primary/20' 
                          : 'hover:bg-sidebar-accent/50 text-muted-foreground transition-all duration-300 hover:translate-x-1'}
                        ${isTableTab && registros.length > 0 ? 'ring-2 ring-primary/40 animate-pulse-subtle' : ''}
                      `}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-muted-foreground'} ${isTableTab && registros.length > 0 ? 'text-primary' : ''}`} />
                      <span className={`font-medium tracking-tight transition-opacity duration-300 ${collapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>
                        {item.label}
                      </span>
                      {isTableTab && registros.length > 0 && (
                        <span className={`ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground shadow-sm animate-in zoom-in ${collapsed ? 'absolute -top-1 -right-1' : ''}`}>
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

      <SidebarFooter className="p-2 space-y-1">
        <SidebarMenu>
          {!isMobile && (
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => setIsPinned(!isPinned)} tooltip={isPinned ? 'Sidebar Fixa' : 'Sidebar Fluida'}>
                {isPinned ? <Pin className="w-4 h-4" /> : <PinOff className="w-4 h-4" />}
                <span className={`transition-opacity duration-300 ${collapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>
                  {isPinned ? 'Sidebar Fixa' : 'Sidebar Fluida'}
                </span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
          <SidebarMenuItem>
            <SidebarMenuButton onClick={toggleTheme} tooltip={theme === 'dark' ? 'Tema claro' : 'Tema escuro'}>
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              <span className={`transition-opacity duration-300 ${collapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>
                {theme === 'dark' ? 'Claro' : 'Escuro'}
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          {onOpenConfig && (
            <SidebarMenuItem>
              <SidebarMenuButton onClick={onOpenConfig} tooltip="Configurações">
                <Settings className="w-4 h-4" />
                <span className={`transition-opacity duration-300 ${collapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>
                  Configurações
                </span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
