import { memo, useMemo } from 'react';
import {
  Home,
  ScanLine,
  ArrowUpRight,
  Package,
  Table,
  FolderOpen,
  ClipboardList,
  ShieldAlert,
  LayoutDashboard,
  ShieldCheck,
  
  ArrowRightLeft,
  PackagePlus,
  Palette,
  BookOpen,
  Workflow,



} from 'lucide-react';

import ModuleSidebar, { type ModuleSidebarConfig } from '@/components/ModuleSidebar';
import { useAppStore } from '@/store/useAppStore';

/**
 * Sidebar do módulo Estoque — agora delega ao ModuleSidebar unificado.
 * Mantém a injeção de badges (reservas) via store.
 */
const EstoqueSidebar = memo(() => {
  const reservasCount = useAppStore(s => s.reservas.length);

  const config = useMemo<ModuleSidebarConfig>(
    () => ({
      moduleLabel: 'ESTOQUE',
      homePath: '/estoque/operacao',
      teamsPath: '/estoque/equipes',
      settingsPath: '/estoque/configuracoes',
      groups: [
        {
          label: 'Operações',
          items: [
            { key: 'inicio', label: 'Início', icon: Home, path: '/estoque/operacao' },
            { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/estoque/dashboard', minRole: 'supervisor' },
            { key: 'conferencia', label: 'Conferência', icon: ScanLine, path: '/estoque/conferencia' },
            { key: 'saida', label: 'Saída', icon: ArrowUpRight, path: '/estoque/saida' },
            { key: 'entradas', label: 'Entradas', icon: PackagePlus, path: '/estoque/entradas' },
            { key: 'acabamentos', label: 'Acabamentos', icon: Palette, path: '/estoque/acabamentos', minRole: 'supervisor' },
            
          ],

        },
        {
          label: 'Estoque',
          items: [
            { key: 'mapa', label: 'Estoque', icon: Package, path: '/estoque/mapa' },
            { key: 'reservas', label: 'Reservas', icon: Table, path: '/estoque/reservas', badge: reservasCount },
            
            { key: 'transferencias', label: 'Transferências', icon: ArrowRightLeft, path: '/estoque/transferencias' },
            { key: 'historico', label: 'Histórico', icon: FolderOpen, path: '/estoque/historico' },
          ],
        },
        {
          label: 'Admin',

          minRole: 'supervisor',
          items: [
            { key: 'cadastros', label: 'Cadastros', icon: ClipboardList, path: '/estoque/cadastros', minRole: 'supervisor' },
            { key: 'admin', label: 'Painel Admin', icon: ShieldCheck, path: '/admin', minRole: 'admin' },
            { key: 'automacoes', label: 'Automações', icon: Workflow, path: '/automacoes', minRole: 'admin' },
          ],
        },
      ],
    }),
    [reservasCount],
  );

  return <ModuleSidebar config={config} />;
});

EstoqueSidebar.displayName = 'EstoqueSidebar';

export default EstoqueSidebar;
