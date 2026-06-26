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
  LogOut,
  FileDown,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { LATEST_VERSION } from '@/lib/changelog';
import { Button } from '@/components/ui/button';

const NAV = [
  { to: '/expedicao/painel', label: 'Painel', icon: ClipboardList },
  { to: '/expedicao/pickings', label: 'Pickings', icon: Package },
  { to: '/expedicao/conferencia', label: 'Conferência', icon: ScanLine },
  { to: '/expedicao/romaneio', label: 'Romaneio', icon: FileText },
  { to: '/expedicao/faturamento', label: 'Faturamento', icon: DollarSign },
];

const NAV_SECONDARY = [
  { to: '/expedicao/dashboard', label: 'Dashboard Operacional', icon: BarChart3 },
  { to: '/expedicao/logistica', label: 'Dashboard Logístico', icon: Truck },
  { to: '/expedicao/carrinhos', label: 'Carrinhos', icon: ShoppingCart },
  { to: '/expedicao/historico', label: 'Histórico', icon: History },
  { to: '/expedicao/relatorios', label: 'Relatórios', icon: FileDown },
  { to: '/expedicao/configuracoes', label: 'Configurações', icon: Settings },
];

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
    isActive
      ? 'bg-primary/10 text-primary font-medium'
      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
  }`;

export default function ExpedicaoLayout() {
  const { profile, modules, signOut } = useAuth();
  const navigate = useNavigate();
  const canSwitch = modules.length > 1;

  return (
    <div className="h-[100dvh] flex w-full bg-background overflow-hidden">
      <aside className="hidden desktop:flex w-60 flex-col border-r border-border bg-card/40">
        <div className="px-4 py-4 border-b border-border">
          <Link to="/expedicao/painel" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center">
              <Truck className="w-4 h-4 text-emerald-700 dark:text-emerald-300" />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-foreground">Pente Fino</p>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                Expedição
              </p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={linkClass} end>
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </NavLink>
          ))}

          <div className="my-2 border-t border-border/60" />

          {NAV_SECONDARY.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={linkClass} end>
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-border p-2 space-y-1">
          {canSwitch && (
            <button
              type="button"
              onClick={() => navigate('/selecionar-modulo')}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              <ArrowLeftRight className="w-4 h-4" />
              <span>Trocar módulo</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => signOut()}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="desktop:hidden h-12 border-b border-border bg-card/40 flex items-center justify-between px-3">
          <Link to="/expedicao/painel" className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-emerald-700 dark:text-emerald-300" />
            <span className="text-sm font-semibold">Expedição</span>
          </Link>
          {canSwitch && (
            <Button variant="ghost" size="sm" onClick={() => navigate('/selecionar-modulo')}>
              <ArrowLeftRight className="w-4 h-4" />
            </Button>
          )}
        </header>

        <main className="flex-1 overflow-y-auto custom-scrollbar pb-16 desktop:pb-0">
          <div className="p-4 lg:p-6 xl:p-8 max-w-[1600px] mx-auto">
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
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
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
          className="hidden md:flex border-t border-border bg-card/30 px-4 py-1.5 items-center justify-between text-[10px] text-muted-foreground/80"
        >
          <span>{profile?.display_name || 'Operador'} · Módulo Expedição</span>
          <span className="font-mono">Pente Fino · v{LATEST_VERSION}</span>
        </footer>
      </div>
    </div>
  );
}
