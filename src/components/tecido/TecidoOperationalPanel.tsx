import { ReactNode } from 'react';
import LeftPanel from '@/components/LeftPanel';

/**
 * Wrapper operacional da página /estoque/tecido, otimizado para tablet.
 * Reaproveita o LeftPanel existente sem duplicar lógica.
 * Padding inferior para não colidir com a BottomTabBar em tablet.
 */
interface Props {
  children?: ReactNode;
}

export default function TecidoOperationalPanel({ children }: Props) {
  return (
    <div className="flex h-full w-full flex-col min-w-0">
      <div
        className="flex-1 min-h-0 min-w-0 overflow-y-auto xl:overflow-hidden md:pb-24 xl:pb-0"
        style={{ paddingBottom: 'max(6rem, calc(env(safe-area-inset-bottom) + 5rem))' }}
      >
        <LeftPanel />
        {children}
      </div>
    </div>
  );
}

