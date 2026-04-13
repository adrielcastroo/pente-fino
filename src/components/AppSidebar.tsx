import { Home, Layers3, Package, Settings2, Table, FolderOpen, Warehouse, Settings, Sun, Moon } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { Logo } from './Logo';
import { useTheme } from 'next-themes';
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

const menuItems: { key: AppTab; label: string; icon: typeof Home; color?: string }[] = [
  { key: 'inicio', label: 'Início', icon: Home, color: 'text-primary' },
  { key: 'tecido', label: 'Tecido', icon: Layers3, color: 'text-blue-500' },
  { key: 'madeira', label: 'Madeira', icon: Package, color: 'text-amber-600' },
  { key: 'motor', label: 'Motor/Controle', icon: Settings2, color: 'text-rose-500' },
  { key: 'estoque', label: 'Estoque', icon: Warehouse, color: 'text-emerald-500' },
  { key: 'table', label: 'Tabela', icon: Table, color: 'text-violet-500' },
  { key: 'history', label: 'Histórico', icon: FolderOpen, color: 'text-slate-500' },
];

export default function AppSidebar({ activeTab, onTabChange, onOpenConfig }: AppSidebarProps) {
  const { state, setOpen, isMobile, toggleSidebar, open } = useSidebar();
  const registros = useAppStore(s => s.registros);
  const { theme, setTheme } = useTheme();
  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');
  const [isHovered, setIsHovered] = useState(false);
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (hoverTimeout) clearTimeout(hoverTimeout);
    if (!isMobile && !open) {
      setOpen(true);
      setIsHovered(true);
    }
  };

  const handleMouseLeave = () => {
    if (!isMobile && isHovered) {
      const timeout = setTimeout(() => {
        setOpen(false);
        setIsHovered(false);
      }, 200);
      setHoverTimeout(timeout);
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
      className="border-r border-border/10 bg-sidebar"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <SidebarHeader className="p-4 group-data-[state=collapsed]:p-2 transition-all duration-300">
        <div className="flex items-center gap-3 overflow-hidden bg-primary/5 group-data-[state=collapsed]:bg-transparent rounded-2xl p-1.5 group-data-[state=collapsed]:p-0 border border-primary/10 group-data-[state=collapsed]:border-transparent shadow-sm group-data-[state=collapsed]:shadow-none backdrop-blur-sm transition-all duration-300">
          <div className="flex items-center justify-center w-10 h-10 group-data-[state=collapsed]:w-8 group-data-[state=collapsed]:h-8 rounded-xl bg-primary text-primary-foreground flex-shrink-0 shadow-lg shadow-primary/30 transition-transform duration-300 hover:rotate-6">
            <Logo className="w-6.5 h-6.5 group-data-[state=collapsed]:w-5 group-data-[state=collapsed]:h-5" />
          </div>
          <div className={`flex flex-col transition-all duration-300 ${collapsed ? 'opacity-0 w-0 ml-0' : 'opacity-100 ml-1.5'}`}>
            <span className="font-black text-sm text-foreground leading-tight tracking-tight whitespace-nowrap">Pente Fino</span>
            <span className="text-[9px] text-foreground/70 dark:text-foreground/80 font-bold uppercase tracking-[0.2em] whitespace-nowrap opacity-70">Industrial v4.0</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 group-data-[state=collapsed]:px-1">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5">
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
                        h-11 rounded-xl transition-all duration-200
                        ${isActive 
                          ? 'bg-primary/15 text-primary font-black shadow-[0_4px_20px_rgb(0,0,0,0.05)] scale-[1.02] ring-1 ring-primary/20' 
                          : 'hover:bg-sidebar-accent/70 text-foreground/80 dark:text-foreground font-bold hover:translate-x-1'}
                        ${isTableTab && registros.length > 0 ? 'ring-2 ring-primary/40 animate-pulse-subtle' : ''}
                      `}
                    >
                      <div className="relative">
                        <Icon className={`w-4.5 h-4.5 transition-all duration-200 ${isActive ? 'scale-110 ' + item.color : 'text-muted-foreground'} ${isTableTab && registros.length > 0 ? 'text-primary' : ''}`} />
                        {isTableTab && registros.length > 0 && collapsed && (
                          <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-[8px] font-black text-primary-foreground ring-2 ring-sidebar animate-in zoom-in-50">
                            {registros.length}
                          </span>
                        )}
                      </div>
                      <span className={`tracking-tight transition-all duration-200 ${collapsed ? 'opacity-0 w-0' : 'opacity-100 ml-2'} ${isActive ? 'font-black' : 'font-bold'} ${isActive ? item.color : ''}`}>
                        {item.label}
                      </span>
                      {isTableTab && registros.length > 0 && !collapsed && (
                        <span className="ml-auto flex h-5.5 w-5.5 items-center justify-center rounded-lg bg-primary text-[10px] font-black text-primary-foreground shadow-lg shadow-primary/20 animate-in slide-in-from-right-2 duration-300">
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

      <SidebarFooter className="p-3 group-data-[state=collapsed]:p-1.5 border-t border-border/5 space-y-2">
        <SidebarMenu className="gap-1">
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={toggleTheme} 
              className="h-11 rounded-xl hover:bg-sidebar-accent/50 text-foreground/80 dark:text-foreground transition-all duration-200"
              tooltip={theme === 'dark' ? 'Mudar para Tema Claro' : 'Mudar para Tema Escuro'}
            >
              <div className="w-4.5 h-4.5 flex items-center justify-center">
                {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-400" />}
              </div>
              <span className={`transition-all duration-200 font-bold tracking-tight ${collapsed ? 'opacity-0 w-0' : 'opacity-100 ml-2'}`}>
                {theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          {onOpenConfig && (
            <SidebarMenuItem>
              <SidebarMenuButton 
                onClick={onOpenConfig} 
                className="h-11 rounded-xl hover:bg-sidebar-accent/50 text-foreground/80 dark:text-foreground transition-all duration-200"
                tooltip="Acessar Configurações"
              >
                <div className="w-4.5 h-4.5 flex items-center justify-center">
                  <Settings className="w-4 h-4 text-muted-foreground" />
                </div>
                <span className={`transition-all duration-200 font-bold tracking-tight ${collapsed ? 'opacity-0 w-0' : 'opacity-100 ml-2'}`}>
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
