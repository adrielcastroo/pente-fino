import { Home, Layers3, Package, Construction, Table, FolderOpen } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import logoImg from '@/assets/logo.ico';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from '@/components/ui/sidebar';

type AppTab = 'inicio' | 'tecido' | 'madeira' | 'motor' | 'table' | 'history';

interface AppSidebarProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
}

const menuItems: { key: AppTab; label: string; icon: typeof Home }[] = [
  { key: 'inicio', label: 'Início', icon: Home },
  { key: 'tecido', label: 'Tecido', icon: Layers3 },
  { key: 'madeira', label: 'Madeira', icon: Package },
  { key: 'motor', label: 'Motor/Controle', icon: Construction },
  { key: 'table', label: 'Tabela', icon: Table },
  { key: 'history', label: 'Histórico', icon: FolderOpen },
];

export default function AppSidebar({ activeTab, onTabChange }: AppSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const registros = useAppStore(s => s.registros);

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="p-3">
        <div className="flex items-center gap-2 overflow-hidden">
          <img src={logoImg} alt="Pente Fino" className="w-8 h-8 rounded-lg object-contain flex-shrink-0" />
          {!collapsed && (
            <span className="font-semibold text-sm text-foreground whitespace-nowrap">Pente Fino</span>
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
                      onClick={() => onTabChange(item.key)}
                      tooltip={item.label}
                      isActive={isActive}
                      className={isActive ? 'bg-primary/10 text-primary font-medium' : ''}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                      {item.key === 'table' && registros.length > 0 && (
                        <span className="ml-auto inline-flex items-center justify-center min-w-[20px] h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold px-1.5">
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
    </Sidebar>
  );
}
