import { memo } from 'react';
import { ClipboardList, Sparkles, FileSpreadsheet } from 'lucide-react';
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
        {
          key: 'starcolor',
          label: 'Starcolor',
          icon: Sparkles,
          path: '/compras/acompanhamentos/starcolor',
        },
        {
          key: 'starcolor-romaneios',
          label: 'Romaneios',
          icon: FileSpreadsheet,
          path: '/compras/acompanhamentos/starcolor/romaneios',
        },
      ],
    },
  ],
};

const ComprasSidebar = memo(() => <ModuleSidebar config={COMPRAS_NAV} />);
ComprasSidebar.displayName = 'ComprasSidebar';
export default ComprasSidebar;
