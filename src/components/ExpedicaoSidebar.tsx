import { memo } from 'react';
import {
  Home,
  ClipboardList,
  Package,
  ScanLine,
  FileText,
  DollarSign,
  BarChart3,
  Truck,
  ShoppingCart,
  History,
  FileDown,
  Tag,
  PackageCheck,
  Boxes,
} from 'lucide-react';
import ModuleSidebar, { type ModuleSidebarConfig } from '@/components/ModuleSidebar';

export const EXPEDICAO_NAV: ModuleSidebarConfig = {
  moduleLabel: 'EXPEDIÇÃO',
  homePath: '/expedicao/operacao',
  settingsPath: '/expedicao/configuracoes',
  groups: [
    {
      label: 'Operações',
      items: [
        { key: 'inicio', label: 'Início', icon: Home, path: '/expedicao/operacao' },
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

const ExpedicaoSidebar = memo(() => <ModuleSidebar config={EXPEDICAO_NAV} />);
ExpedicaoSidebar.displayName = 'ExpedicaoSidebar';
export default ExpedicaoSidebar;
