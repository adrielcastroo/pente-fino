import { memo } from 'react';
import { LayoutGrid, TrendingDown } from 'lucide-react';

import ModuleSidebar, { type ModuleSidebarConfig } from '@/components/ModuleSidebar';

export const COMPRAS_NAV: ModuleSidebarConfig = {
  moduleLabel: 'COMPRAS',
  homePath: '/compras/acompanhamentos',
  settingsPath: '/compras/configuracoes',
  teamsPath: '/compras/equipes',
  groups: [
    {
      label: 'Operação',
      items: [
        { key: 'acompanhamentos', label: 'Hub Acompanh.', icon: LayoutGrid, path: '/compras/acompanhamentos' },
        { key: 'analise-compra', label: 'Análise de Compra', icon: TrendingDown, path: '/compras/analise-compra' },
      ],
    },
  ],
};

const ComprasSidebar = memo(() => <ModuleSidebar config={COMPRAS_NAV} />);
ComprasSidebar.displayName = 'ComprasSidebar';
export default ComprasSidebar;
