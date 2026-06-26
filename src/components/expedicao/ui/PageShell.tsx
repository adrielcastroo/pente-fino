import { cn } from '@/lib/utils';
import type { ComponentProps } from 'react';

/**
 * Wrapper padrão de página do módulo Expedição.
 * Espelha o espaçamento e o comportamento de scroll do módulo Estoque.
 */
export function PageShell({ className, children, ...rest }: ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'max-w-full mx-auto space-y-4 sm:space-y-8 pb-20 p-2 sm:p-0 overflow-x-hidden',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export default PageShell;
