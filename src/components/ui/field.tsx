import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface FieldProps {
  label: string;
  htmlFor?: string;
  className?: string;
  labelExtra?: ReactNode;
  children: ReactNode;
}

/**
 * Wrapper padronizado para campos de formulário.
 * Garante baseline consistente: label row h-4 + gap 1.5 + input.
 */
export function Field({ label, htmlFor, className, labelExtra, children }: FieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-center gap-1.5 h-4">
        <label
          htmlFor={htmlFor}
          className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
        >
          {label}
        </label>
        {labelExtra}
      </div>
      {children}
    </div>
  );
}
