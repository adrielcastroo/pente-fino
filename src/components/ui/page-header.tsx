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
        'flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4',
        className,
      )}
    >
      <div className="flex items-center gap-3 w-full">
        {backTo && (
          <Button
            variant="ghost"
            size="icon"
            aria-label="Voltar"
            onClick={() => navigate(backTo)}
            className="rounded-md hover:bg-muted/50 transition-colors w-9 h-9 shrink-0"
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={1.75} />
          </Button>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground leading-tight truncate">
            {title}
          </h1>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

export default PageHeader;
