import type { LucideIcon } from 'lucide-react';
import { DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface ErpDocNumero {
  label: string;
  value?: string | number | null;
  tone?: 'primary' | 'success' | 'muted';
  /** Oculta o chip quando não há valor. */
  hideWhenEmpty?: boolean;
}

const TONE: Record<NonNullable<ErpDocNumero['tone']>, string> = {
  primary: 'text-primary',
  success: 'text-success',
  muted: 'text-foreground',
};

/**
 * Cabeçalho padrão ERP: título à esquerda, números de documento à direita.
 * Substitui os badges coloridos por chips discretos e legíveis.
 */
export function ErpDialogHeader({
  icon: Icon,
  title,
  docs = [],
}: {
  icon?: LucideIcon;
  title: string;
  docs?: ErpDocNumero[];
  className?: string;
}) {
  const visiveis = docs.filter((d) => !(d.hideWhenEmpty && !d.value));

  return (
    <DialogHeader className={cn("pb-2 border-b border-border/60", className)}>
      <div className="flex items-start justify-between gap-4 pr-6">
        <DialogTitle className="flex items-center gap-2 text-base font-semibold">
          {Icon && <Icon className="h-4 w-4 text-primary shrink-0" />}
          {title}
        </DialogTitle>
        {visiveis.length > 0 && (
          <div className="flex items-start gap-4 shrink-0 text-right">
            {visiveis.map((d) => (
              <div key={d.label} className="min-w-0">
                <div className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold whitespace-nowrap">
                  {d.label}
                </div>
                <div className={cn('font-mono text-sm font-bold leading-tight', TONE[d.tone ?? 'muted'])}>
                  {d.value || '—'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DialogHeader>
  );
}

/** Bloco de seção padrão: rótulo discreto + card com conteúdo. */
export function ErpSection({
  label,
  icon: Icon,
  children,
  className,
  contentClassName,
}: {
  label: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <section className={className}>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5 flex items-center gap-1.5">
        {Icon && <Icon className="w-3 h-3" />} {label}
      </p>
      <Card className={cn('p-3 border-border', contentClassName)}>{children}</Card>
    </section>
  );
}

/** Item de metadado compacto usado nas grades dos diálogos. */
export function ErpMeta({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon?: LucideIcon;
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-1 text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">
        {Icon && <Icon className="w-3 h-3" />} {label}
      </div>
      <div
        className={cn('text-xs mt-0.5 truncate font-medium', mono && 'font-mono')}
        title={typeof value === 'string' ? value : undefined}
      >
        {value}
      </div>
    </div>
  );
}

/** Destaque de item: descrição em evidência, código secundário abaixo. */
export function ErpItemHeadline({
  descricao,
  codigo,
}: {
  descricao?: string | null;
  codigo?: string | null;
}) {
  return (
    <div className="min-w-0">
      <p className="text-base font-semibold leading-snug text-foreground break-words">
        {descricao || 'Sem descrição'}
      </p>
      <p className="font-mono text-[11px] text-muted-foreground mt-0.5">{codigo || '—'}</p>
    </div>
  );
}
