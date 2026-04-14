import { Home, Waves, TreePine, Settings2, Table, FolderOpen, Warehouse, Archive, Settings, Sun, Moon } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { Logo } from './Logo';
import { useTheme } from 'next-themes';
import { AppTab } from '@/types';
import { useState, memo } from 'react';
import { usePerformance } from '@/hooks/use-performance';
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

const AppSidebar = memo(({ activeTab, onTabChange, onOpenConfig }: AppSidebarProps) => {
  const { state, setOpen, isMobile, toggleSidebar, open } = useSidebar();
  const registros = useAppStore(s => s.registros);
  const { theme, setTheme } = useTheme();
  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');
  const [isHovered, setIsHovered] = useState(false);
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);
  const { isLow } = usePerformance();

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
      <SidebarHeader className="p-4 sm:p-6 group-data-[state=collapsed]:p-3 transition-all duration-300">
        <div className="flex items-center gap-3 overflow-hidden rounded-3xl p-2 group-data-[state=collapsed]:p-0 transition-all duration-300 hover:bg-sidebar-accent/30 group/logo">
          <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 group-data-[state=collapsed]:w-10 group-data-[state=collapsed]:h-10 rounded-2xl bg-primary shadow-lg shadow-primary/30 text-primary-foreground flex-shrink-0 transition-all duration-300 group-hover/logo:rotate-12 group-hover/logo:scale-110">
            <Logo className="w-6 h-6 sm:w-8 sm:h-8 group-data-[state=collapsed]:w-6 group-data-[state=collapsed]:h-6" />

          </div>
          <div className={`flex flex-col transition-all duration-300 ${collapsed ? 'opacity-0 w-0 ml-0' : 'opacity-100 ml-2'}`}>
            <span className="font-black text-lg text-foreground leading-none tracking-tighter whitespace-nowrap">Pente Fino</span>
            <span className="text-[10px] text-muted-foreground font-extrabold uppercase tracking-[0.2em] mt-0.5">ESTOQUE</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-4 group-data-[state=collapsed]:px-2 mt-4 custom-scrollbar">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-3">
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
                        h-12 sm:h-14 rounded-2xl transition-all duration-300 relative overflow-hidden group/btn
                        ${isActive 
                          ? 'bg-primary text-primary-foreground font-black shadow-xl shadow-primary/30 scale-[1.04]' 
                          : 'hover:bg-sidebar-accent text-muted-foreground hover:text-foreground font-bold hover:translate-x-1.5'}
                        ${isTableTab && registros.length > 0 && !isActive ? 'ring-2 ring-primary ring-offset-2 ring-offset-sidebar' : ''}
                      `}
                    >
                      <div className="relative flex items-center justify-center shrink-0">
                        <Icon className={`w-5 h-5 sm:w-6 sm:h-6 transition-all duration-300 ${isActive ? 'scale-110 text-primary-foreground drop-shadow-md' : 'group-hover/btn:text-primary group-hover/btn:scale-110'}`} />
                        {isTableTab && registros.length > 0 && collapsed && (
                          <span className="absolute -top-3 -right-3 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-black text-white ring-4 ring-sidebar shadow-lg">
                            {registros.length}
                          </span>
                        )}
                      </div>
                      <span className={`tracking-tight transition-all duration-300 whitespace-nowrap ${collapsed ? 'opacity-0 w-0' : 'opacity-100 ml-4'} ${isActive ? 'text-sm' : 'text-sm'}`}>
                        {item.label}
                      </span>
                      {isTableTab && registros.length > 0 && !collapsed && (
                        <span className={`ml-auto flex h-6 w-6 items-center justify-center rounded-lg text-[10px] font-black shadow-inner transition-all duration-300 ${isActive ? 'bg-white/20 text-white' : 'bg-primary text-white shadow-lg shadow-primary/20'}`}>
                          {registros.length}
                        </span>
                      )}
                      
                      {isActive && (
                        <div className="absolute left-0 w-1.5 h-8 bg-white/40 rounded-r-full blur-[1px]" />
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 group-data-[state=collapsed]:p-2 border-t border-border/20 space-y-3 bg-sidebar-accent/10 backdrop-blur-sm">
        <SidebarMenu className="gap-3">
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={toggleTheme} 
              className="h-12 rounded-2xl hover:bg-sidebar-accent/80 text-muted-foreground hover:text-foreground transition-all duration-300 group/footer shadow-sm hover:shadow-md"

              tooltip={theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
              aria-label="Alternar Tema"
            >
              <div className="w-6 h-6 flex items-center justify-center transition-transform duration-300 group-hover/footer:rotate-180 group-hover/footer:scale-110">
                {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-indigo-500" />}
              </div>
              {!collapsed && (
                <span className="ml-4 font-black text-xs tracking-widest uppercase opacity-70">
                  {theme === 'dark' ? 'Dia' : 'Noite'}
                </span>
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={() => handleTabClick('settings')} 
              isActive={activeTab === 'settings'}
              className="h-12 rounded-2xl hover:bg-sidebar-accent/80 text-muted-foreground hover:text-foreground transition-all duration-300 group/footer shadow-sm hover:shadow-md"
              tooltip="Configurações"
              aria-label="Abrir Configurações"
            >
              <div className="w-6 h-6 flex items-center justify-center transition-transform duration-300 group-hover/footer:rotate-90 group-hover/footer:scale-110">
                <Settings className={`w-5 h-5 ${activeTab === 'settings' ? 'text-primary' : ''} group-hover/footer:text-primary`} />
              </div>
              {!collapsed && (
                <span className="ml-4 font-black text-xs tracking-widest uppercase opacity-70">
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

export default AppSidebar;
