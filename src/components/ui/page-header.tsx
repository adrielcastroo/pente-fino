import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface PageHeaderProps {
  title: ReactNode;
  subtitle?: string;
  backTo?: string;
  actions?: ReactNode;
  className?: string;
}

/**
 * Cabeçalho padrão de página — compartilhado entre todos os módulos.
 */
export function PageHeader({ title, subtitle, backTo, actions, className }: PageHeaderProps) {
  const navigate = useNavigate();

  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4',
        className,
      )}
    >
      <div className="flex items-center gap-2 sm:gap-3 w-full min-w-0">
        {backTo && (
          <Button
            variant="ghost"
            size="icon"
            aria-label="Voltar"
            onClick={() => navigate(backTo)}
            className="rounded-md hover:bg-muted/50 transition-colors w-8 h-8 sm:w-9 sm:h-9 shrink-0"
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={1.75} />
          </Button>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold tracking-tight text-foreground leading-tight truncate">
            {title}
          </h1>
          {subtitle && <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 line-clamp-1">{subtitle}</p>}
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto sm:justify-end">
          {actions}
        </div>
      )}
    </div>
  );
}

export default PageHeader;
