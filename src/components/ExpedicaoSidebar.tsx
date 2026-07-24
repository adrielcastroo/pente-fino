import { memo, useMemo } from 'react';
import {
  Home,
  ClipboardList,
  ScanLine,
  FileText,
  DollarSign,
  BarChart3,
  Truck,
  ShoppingCart,
  History,
  FileDown,
  Tag,
  ShieldCheck,
  Users,

} from 'lucide-react';
import ModuleSidebar, { type ModuleSidebarConfig } from '@/components/ModuleSidebar';
import { useExpedicaoAlertCounts } from '@/hooks/expedicao/useExpedicaoAlertCounts';

/**
 * Configuração base (sem badges dinâmicas).
 * Reorganizada em 5 grupos: Operação / Fiscal / Análises / Recursos / Admin.
 * Exportada para uso na tab bar mobile.
 */
export const EXPEDICAO_NAV: ModuleSidebarConfig = {
  moduleLabel: 'EXPEDIÇÃO',
  homePath: '/expedicao/operacao',
  settingsPath: '/expedicao/configuracoes',
  groups: [
    {
      label: 'Operação',
      items: [
        { key: 'inicio', label: 'Início', icon: Home, path: '/expedicao/operacao' },
        { key: 'painel', label: 'Painel', icon: ClipboardList, path: '/expedicao/painel' },
        { key: 'conferencia', label: 'Conferência', icon: ScanLine, path: '/expedicao/conferencia' },
        { key: 'double-check', label: 'Double-Check', icon: ShieldCheck, path: '/expedicao/double-check' },
        { key: 'romaneio', label: 'Romaneio', icon: FileText, path: '/expedicao/romaneio' },
        
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
        { key: 'equipes', label: 'Equipes', icon: Users, path: '/equipes', minRole: 'supervisor' },
      ],
    },
  ],
};

const ExpedicaoSidebar = memo(() => {
  const { data: counts } = useExpedicaoAlertCounts();

  const config = useMemo<ModuleSidebarConfig>(() => {
    if (!counts) return EXPEDICAO_NAV;
    return {
      ...EXPEDICAO_NAV,
      groups: EXPEDICAO_NAV.groups.map((g) => ({
        ...g,
        items: g.items.map((i) => {
          switch (i.key) {
            case 'painel':
              return { ...i, badge: counts.painel };
            case 'conferencia':
              return { ...i, badge: counts.conferencia };
            case 'romaneio':
              return { ...i, badge: counts.romaneio };

            default:
              return i;
          }
        }),
      })),
    };
  }, [counts]);

  return <ModuleSidebar config={config} />;
});
ExpedicaoSidebar.displayName = 'ExpedicaoSidebar';
export default ExpedicaoSidebar;
