import { Suspense } from 'react';
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import {
  ClipboardList,
  Package,
  ScanLine,
  FileText,
  DollarSign,
  BarChart3,
  Truck,
  ShoppingCart,
  Settings,
  ArrowLeftRight,
  History,
  FileDown,
  Tag,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { LATEST_VERSION, BUILD_TIME } from '@/lib/changelog';
import { Button } from '@/components/ui/button';
import ModuleSwitchFab from '@/components/ModuleSwitchFab';
import { SidebarProvider } from '@/components/ui/sidebar';
import ModuleSidebar, { type ModuleSidebarConfig } from '@/components/ModuleSidebar';
import { useIsMobile, useIsTablet } from '@/hooks/use-mobile';

const EXPEDICAO_NAV: ModuleSidebarConfig = {
  moduleLabel: 'EXPEDIÇÃO',
  homePath: '/expedicao/painel',
  settingsPath: '/expedicao/configuracoes',
  groups: [
    {
      label: 'Operações',
      items: [
        { key: 'painel', label: 'Painel', icon: ClipboardList, path: '/expedicao/painel' },
        { key: 'pickings', label: 'Pickings', icon: Package, path: '/expedicao/pickings' },
        { key: 'conferencia', label: 'Conferência', icon: ScanLine, path: '/expedicao/conferencia' },
        { key: 'romaneio', label: 'Romaneio', icon: FileText, path: '/expedicao/romaneio' },
        { key: 'faturamento', label: 'Faturamento', icon: DollarSign, path: '/expedicao/faturamento' },
      ],
    },
    {
      label: 'Análises',
      items: [
        { key: 'dashboard', label: 'Operacional', icon: BarChart3, path: '/expedicao/dashboard' },
        { key: 'logistica', label: 'Logístico', icon: Truck, path: '/expedicao/logistica' },
      ],
    },
    {
      label: 'Recursos',
      items: [
        { key: 'carrinhos', label: 'Carrinhos', icon: ShoppingCart, path: '/expedicao/carrinhos' },
        { key: 'etiquetas', label: 'Etiquetas', icon: Tag, path: '/expedicao/etiquetas' },
      ],
    },
    {
      label: 'Admin',
      items: [
        { key: 'historico', label: 'Histórico', icon: History, path: '/expedicao/historico' },
        { key: 'relatorios', label: 'Relatórios', icon: FileDown, path: '/expedicao/relatorios' },
      ],
    },
  ],
};

// Bottom tab bar (mobile/tablet) — itens primários
const MOBILE_NAV = EXPEDICAO_NAV.groups[0].items.slice(0, 5);

export default function ExpedicaoLayout() {
  const { profile, modules } = useAuth();
  const navigate = useNavigate();
  const canSwitch = modules.length > 1;
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();

  const prefStartCollapsed =
    typeof window !== 'undefined' && localStorage.getItem('pref_sidebar_collapsed') === 'true';
  const defaultOpen = !isMobile && !isTablet && !prefStartCollapsed;

  const handleOpenChange = (open: boolean) => {
    try {
      localStorage.setItem('pref_sidebar_collapsed', open ? 'false' : 'true');
    } catch {
      /* ignore */
    }
  };

  return (
    <SidebarProvider defaultOpen={defaultOpen} onOpenChange={handleOpenChange}>
      <div className="h-[100dvh] flex w-full bg-background overflow-hidden">
        {/* Sidebar shadcn padronizada — apenas em desktop real */}
        <div className="hidden desktop:contents">
          <ModuleSidebar config={EXPEDICAO_NAV} />
        </div>

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <header className="desktop:hidden h-12 border-b border-border bg-card/40 flex items-center justify-between px-3">
            <Link to="/expedicao/painel" className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold">Expedição</span>
            </Link>
            {canSwitch && (
              <Button variant="ghost" size="sm" onClick={() => navigate('/selecionar-modulo')}>
                <ArrowLeftRight className="w-4 h-4" />
              </Button>
            )}
          </header>

          <main className="flex-1 overflow-y-auto custom-scrollbar pb-16 desktop:pb-0">
            <div className="p-2 sm:p-4 lg:p-6 xl:p-8 max-w-[1600px] mx-auto w-full">
              <Suspense
                fallback={
                  <div className="space-y-3">
                    <div className="h-8 bg-muted rounded w-1/4" />
                    <div className="h-32 bg-muted rounded" />
                  </div>
                }
              >
                <Outlet />
              </Suspense>
            </div>
          </main>

          {/* Bottom tab bar (mobile/tablet) */}
          <nav
            className="desktop:hidden fixed bottom-0 inset-x-0 z-40 h-14 border-t border-border bg-card/95 backdrop-blur grid grid-cols-5"
            aria-label="Navegação Expedição"
          >
            {MOBILE_NAV.map(({ path, label, icon: Icon }) => (
              <NavLink
                key={path}
                to={path}
                end
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center gap-0.5 text-[10px] ${
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Footer */}
          <footer
            role="contentinfo"
            className="hidden desktop:flex border-t border-border bg-card/30 px-4 py-1.5 items-center justify-between text-[10px] text-muted-foreground/80"
          >
            <span>{profile?.display_name || 'Operador'} · Módulo Expedição</span>
            <span
              className="font-mono"
              title={BUILD_TIME ? `Build: ${new Date(BUILD_TIME).toLocaleString('pt-BR')}` : undefined}
            >
              Pente Fino · v{LATEST_VERSION}
            </span>
          </footer>
        </div>
        <ModuleSwitchFab />
      </div>
    </SidebarProvider>
  );
}
