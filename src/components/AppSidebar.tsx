import { Home, Layers3, Package, Settings2, Table, FolderOpen, Warehouse, Settings, Sun, Moon } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { Logo } from './Logo';
import { useTheme } from '@/hooks/useTheme';
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
  const { state, toggleSidebar, isMobile } = useSidebar();
  const collapsed = state === 'collapsed';
  const registros = useAppStore(s => s.registros);
  const { theme, toggleTheme } = useTheme();

  const handleTabClick = (tab: AppTab) => {
    onTabChange(tab);
    if (isMobile) {
      toggleSidebar();
    }
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50 bg-sidebar">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 flex-shrink-0 shadow-sm border border-primary/20 backdrop-blur-sm">
            <Logo className="w-5 h-5" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-sm text-foreground leading-tight tracking-tight">Pente Fino</span>
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Gestão Industrial</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.key;
                return (
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton
                      onClick={() => handleTabClick(item.key)}
                      tooltip={item.label}
                      isActive={isActive}
                      className={isActive 
                        ? 'bg-primary/10 text-primary font-semibold shadow-sm transition-all duration-200' 
                        : 'hover:bg-sidebar-accent/50 text-muted-foreground transition-all duration-200'}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span className="font-medium tracking-tight">{item.label}</span>
                      {item.key === 'table' && registros.length > 0 && (
                        <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground shadow-sm animate-in zoom-in">
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
          <SidebarMenuItem>
            <SidebarMenuButton onClick={toggleTheme} tooltip={theme === 'dark' ? 'Tema claro' : 'Tema escuro'}>
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              <span>{theme === 'dark' ? 'Claro' : 'Escuro'}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          {onOpenConfig && (
            <SidebarMenuItem>
              <SidebarMenuButton onClick={onOpenConfig} tooltip="Configurações">
                <Settings className="w-4 h-4" />
                <span>Configurações</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
