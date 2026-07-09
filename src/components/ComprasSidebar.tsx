import { memo } from 'react';
import { ClipboardList } from 'lucide-react';
import ModuleSidebar, { type ModuleSidebarConfig } from '@/components/ModuleSidebar';

export const COMPRAS_NAV: ModuleSidebarConfig = {
  moduleLabel: 'COMPRAS',
  homePath: '/compras/acompanhamentos',
  settingsPath: '/compras/configuracoes',
  groups: [
    {
      label: 'Operação',
      items: [
        {
          key: 'acompanhamentos',
          label: 'Acompanhamentos',
          icon: ClipboardList,
          path: '/compras/acompanhamentos',
        },
      ],
    },
  ],
};

const ComprasSidebar = memo(() => <ModuleSidebar config={COMPRAS_NAV} />);
ComprasSidebar.displayName = 'ComprasSidebar';
export default ComprasSidebar;
