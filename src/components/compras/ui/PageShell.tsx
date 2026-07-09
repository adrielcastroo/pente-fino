import { cn } from '@/lib/utils';
import type { ComponentProps } from 'react';

/**
 * Wrapper padrão de página do módulo Compras.
 * Espelha o espaçamento e o comportamento de scroll dos demais módulos.
 */
export function PageShell({ className, children, ...rest }: ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'max-w-full mx-auto space-y-4 sm:space-y-6 lg:space-y-8 pb-20 p-3 sm:p-4 lg:p-0 overflow-x-hidden min-w-0',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export default PageShell;
