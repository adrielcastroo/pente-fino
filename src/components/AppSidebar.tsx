import { Home, Waves, TreePine, Settings2, Table, FolderOpen, Warehouse, Archive, Settings, Sun, Moon } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { Logo } from './Logo';
import { useTheme } from 'next-themes';
import { AppTab } from '@/types';
import { useState } from 'react';
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

const menuItems: { key: AppTab; label: string; icon: any; color?: string }[] = [
  { key: 'inicio', label: 'Início', icon: Home, color: 'text-primary' },
  { key: 'tecido', label: 'Tecido', icon: Waves, color: 'text-blue-500' },
  { key: 'madeira', label: 'Madeira', icon: TreePine, color: 'text-amber-600' },
  { key: 'motor', label: 'Motor/Controle', icon: Settings2, color: 'text-rose-500' },
  { key: 'estoque', label: 'Estoque', icon: Warehouse, color: 'text-emerald-500' },
  { key: 'saida', label: 'Saída', icon: Archive, color: 'text-violet-500' },
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
      }, 300);
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
      className="border-r border-border/40 bg-sidebar shadow-xl"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      aria-label="Menu Principal"
    >
      <SidebarHeader className="p-4 group-data-[state=collapsed]:p-2 transition-all duration-300">
        <div className="flex items-center gap-3 overflow-hidden rounded-2xl p-1.5 group-data-[state=collapsed]:p-0 transition-all duration-300">
          <div className="flex items-center justify-center w-10 h-10 group-data-[state=collapsed]:w-9 group-data-[state=collapsed]:h-9 rounded-xl bg-primary/10 text-primary flex-shrink-0 transition-all duration-500 hover:rotate-12 hover:scale-110">
            <Logo className="w-6 h-6 group-data-[state=collapsed]:w-5 group-data-[state=collapsed]:h-5" />
          </div>
          <div className={`flex flex-col transition-all duration-300 ${collapsed ? 'opacity-0 w-0 ml-0' : 'opacity-100 ml-1.5'}`}>
            <span className="font-extrabold text-sm text-foreground leading-tight tracking-tight whitespace-nowrap">Pente Fino</span>
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Controle de Estoque</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 group-data-[state=collapsed]:px-1 mt-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2">
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
                      aria-current={isActive ? 'page' : undefined}
                      className={`
                        h-12 rounded-xl transition-all duration-300 relative overflow-hidden group/btn
                        ${isActive 
                          ? 'bg-primary text-primary-foreground font-extrabold shadow-lg shadow-primary/25 scale-[1.02]' 
                          : 'hover:bg-sidebar-accent/80 text-sidebar-foreground font-semibold hover:translate-x-1'}
                        ${isTableTab && registros.length > 0 && !isActive ? 'ring-2 ring-primary/40' : ''}
                      `}
                    >
                      <div className="relative flex items-center justify-center">
                        <Icon className={`w-5 h-5 transition-all duration-300 ${isActive ? 'scale-110 text-primary-foreground' : 'text-muted-foreground group-hover/btn:text-foreground'}`} />
                        {isTableTab && registros.length > 0 && collapsed && (
                          <span className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-black text-white ring-2 ring-sidebar animate-pulse">
                            {registros.length}
                          </span>
                        )}
                      </div>
                      <span className={`tracking-tight transition-all duration-300 whitespace-nowrap ${collapsed ? 'opacity-0 w-0' : 'opacity-100 ml-3'} ${isActive ? 'font-black' : 'font-bold'}`}>
                        {item.label}
                      </span>
                      {isTableTab && registros.length > 0 && !collapsed && (
                        <span className={`ml-auto flex h-6 w-6 items-center justify-center rounded-lg text-[10px] font-black shadow-inner transition-all duration-300 ${isActive ? 'bg-white/20 text-white' : 'bg-primary text-white shadow-primary/20 animate-bounce'}`}>
                          {registros.length}
                        </span>
                      )}
                      
                      {isActive && (
                        <div className="absolute left-0 w-1.5 h-6 bg-white rounded-r-full shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 group-data-[state=collapsed]:p-2 border-t border-border/40 space-y-2 bg-sidebar-accent/20">
        <SidebarMenu className="gap-2">
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={toggleTheme} 
              className="h-11 rounded-xl hover:bg-sidebar-accent/80 text-sidebar-foreground transition-all duration-300 group/footer"
              tooltip={theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
              aria-label="Alternar Tema"
            >
              <div className="w-5 h-5 flex items-center justify-center transition-transform group-hover/footer:rotate-45">
                {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-slate-500" />}
              </div>
              {!collapsed && (
                <span className="ml-3 font-bold tracking-tight">
                  {theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
                </span>
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>
          {onOpenConfig && (
            <SidebarMenuItem>
              <SidebarMenuButton 
                onClick={onOpenConfig} 
                className="h-11 rounded-xl hover:bg-sidebar-accent/80 text-sidebar-foreground transition-all duration-300 group/footer"
                tooltip="Configurações"
                aria-label="Abrir Configurações"
              >
                <div className="w-5 h-5 flex items-center justify-center transition-transform group-hover/footer:rotate-90">
                  <Settings className="w-5 h-5 text-muted-foreground group-hover/footer:text-foreground" />
                </div>
                {!collapsed && (
                  <span className="ml-3 font-bold tracking-tight text-muted-foreground group-hover/footer:text-foreground">
                    Configurações
                  </span>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
