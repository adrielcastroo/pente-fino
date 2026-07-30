import { memo } from 'react';
import { ClipboardList, Sparkles, FileSpreadsheet, Users, TrendingDown } from 'lucide-react';

import ModuleSidebar, { type ModuleSidebarConfig } from '@/components/ModuleSidebar';

export const COMPRAS_NAV: ModuleSidebarConfig = {
  moduleLabel: 'COMPRAS',
  homePath: '/compras/acompanhamentos',
  settingsPath: '/compras/configuracoes',
  groups: [
    {
      label: 'Operação',
      items: [
        { key: 'acompanhamentos', label: 'Acompanhamentos', icon: ClipboardList, path: '/compras/acompanhamentos' },
        { key: 'starcolor', label: 'Starcolor', icon: Sparkles, path: '/compras/acompanhamentos/starcolor' },
        { key: 'starcolor-romaneios', label: 'Romaneios', icon: FileSpreadsheet, path: '/compras/acompanhamentos/starcolor/romaneios' },
        { key: 'analise-compra', label: 'Análise de Compra', icon: TrendingDown, path: '/compras/analise-compra' },

      ],
    },
    {
      label: 'Admin',
      minRole: 'supervisor',
      items: [
        { key: 'equipes', label: 'Equipes', icon: Users, path: '/equipes', minRole: 'supervisor' },
      ],
    },
  ],
};

const ComprasSidebar = memo(() => <ModuleSidebar config={COMPRAS_NAV} />);
ComprasSidebar.displayName = 'ComprasSidebar';
export default ComprasSidebar;
