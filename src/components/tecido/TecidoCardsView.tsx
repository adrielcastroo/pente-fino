import { memo } from 'react';
import { motion } from 'framer-motion';
import { Trash2, Copy, Package, Ruler, MapPin, Hash, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatML } from '@/lib/app-utils';
import type { Registro } from '@/types';

export type TecidoCardVariant = 'compact' | 'emphasis' | 'motion';

interface TecidoCardsViewProps {
  rows: Registro[];
  onDelete: (id: string) => void;
  onCopy: (text: string) => void;
  isGuest: boolean;
  showActions: boolean;
  /** Variação visual do card. Default: 'emphasis'. */
  variant?: TecidoCardVariant;
}

interface MetricProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  accent?: boolean;
  variant: TecidoCardVariant;
}

const Metric = ({ icon: Icon, label, value, accent, variant }: MetricProps) => {
  const iconSize = variant === 'compact' ? 'w-3 h-3' : 'w-3.5 h-3.5';
  const valueSize = variant === 'compact' ? 'text-xs' : 'text-sm';
  const labelSize = variant === 'compact' ? 'text-[8px]' : 'text-[9px]';
  return (
    <div className="flex items-center gap-2 min-w-0">
      <Icon className={`${iconSize} shrink-0 ${accent ? 'text-primary' : 'text-muted-foreground/70'}`} aria-hidden />
      <div className="min-w-0">
        <div className={`${labelSize} font-semibold uppercase tracking-wider text-muted-foreground/60 leading-none`}>
          {label}
        </div>
        <div className={`${valueSize} font-mono font-semibold leading-tight truncate tabular-nums ${accent ? 'text-primary' : 'text-foreground'}`}>
          {value}
        </div>
      </div>
    </div>
  );
};

/**
 * Cards de conferência de tecido — 3 variações visuais:
 * - compact: alta densidade, padding/gap reduzidos, tipografia compacta
 * - emphasis: peso visual no item + métrica primária destacada (default)
 * - motion:  transições sutis (stagger, hover lift, glow no primário)
 */
const TecidoCardsView = memo(({
  rows, onDelete, onCopy, isGuest, showActions, variant = 'emphasis',
}: TecidoCardsViewProps) => {
  if (rows.length === 0) return null;

  const isCompact = variant === 'compact';
  const isEmphasis = variant === 'emphasis';
  const isMotion = variant === 'motion';

  const ulPadding = isCompact ? 'p-2 gap-2' : 'p-3 gap-3';
  const cardPad = isCompact ? 'p-3' : 'p-4';
  const headerMb = isCompact ? 'mb-2 pb-2' : 'mb-3 pb-3';
  const itemFont = isCompact ? 'text-sm' : isEmphasis ? 'text-lg' : 'text-base';
  const metricsGap = isCompact ? 'gap-x-2 gap-y-1.5 mb-2' : 'gap-x-3 gap-y-2.5 mb-3';

  return (
    <ul
      role="list"
      aria-label="Registros de tecido"
      className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-1 ${ulPadding}`}
    >
      {rows.map((r, i) => (
        <motion.li
          key={r.id}
          initial={
            isMotion
              ? { opacity: 0, y: 12 }
              : r.isNew
                ? { opacity: 0, y: -8, scale: 0.98 }
                : false
          }
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            duration: isMotion ? 0.32 : 0.25,
            delay: isMotion ? Math.min(i * 0.03, 0.18) : 0,
            ease: 'easeOut',
          }}
          whileHover={isMotion ? { y: -2 } : undefined}
          className={`group relative rounded-md border bg-card ${cardPad} transition-colors ${
            r.isNew
              ? isEmphasis
                ? 'border-primary/50 ring-2 ring-primary/25 bg-gradient-to-br from-primary/[0.08] to-transparent'
                : 'border-primary/40 ring-1 ring-primary/20 bg-gradient-to-br from-primary/[0.05] to-transparent'
              : isMotion
                ? 'border-border/60 hover:border-primary/40 hover:shadow-[0_6px_20px_-8px_hsl(var(--primary)/0.25)]'
                : 'border-border/60 hover:border-primary/30'
          }`}
        >
          {/* Header */}
          <div className={`flex items-start justify-between gap-3 ${headerMb} border-b border-border/60`}>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="inline-flex items-center justify-center min-w-[1.5rem] h-5 px-1.5 rounded-md bg-muted/60 text-[10px] font-bold text-muted-foreground font-mono tabular-nums">
                  {i + 1}
                </span>
                <Package className={`w-3.5 h-3.5 shrink-0 ${isEmphasis ? 'text-primary' : 'text-primary/70'}`} aria-hidden />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                  Item
                </span>
                {r.isNew && (
                  <Badge variant="default" className="h-5 px-1.5 text-[9px] gap-1 bg-primary/15 text-primary border-primary/30 hover:bg-primary/15">
                    <Sparkles className="w-2.5 h-2.5" aria-hidden />
                    NOVO
                  </Badge>
                )}
              </div>
              <p className={`${itemFont} font-bold text-foreground font-mono break-all leading-tight ${isEmphasis ? 'tracking-tight' : ''}`}>
                {r.item || <span className="text-muted-foreground/50 italic font-normal">sem item</span>}
              </p>
            </div>

            {showActions && !isGuest && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(r.id)}
                className="h-9 w-9 rounded-md shrink-0 text-muted-foreground/70 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive"
                aria-label={`Remover registro ${r.item || ''}`}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Métricas */}
          <div className={`grid grid-cols-2 ${metricsGap}`}>
            {r.m2 != null && r.m2 > 0 && (
              <Metric icon={Ruler} label="M²" value={r.m2.toFixed(1)} accent variant={variant} />
            )}
            {r.mLinear != null && r.mLinear > 0 && (
              <Metric icon={Ruler} label="M. Linear" value={formatML(r.mLinear)} variant={variant} />
            )}
            {r.largura != null && r.largura > 0 && (
              <Metric icon={Ruler} label="Largura" value={`${r.largura} m`} variant={variant} />
            )}
            {r.quantidade != null && r.quantidade > 0 && (
              <Metric icon={Hash} label="Quantidade" value={String(r.quantidade)} variant={variant} />
            )}
          </div>

          {/* Lote + endereço */}
          {(r.lote || r.endereco) && (
            <div className={`flex flex-wrap gap-1.5 ${isCompact ? 'mb-2' : 'mb-3'}`}>
              {r.lote && (
                <Badge variant="secondary" className="text-[10px] font-mono gap-1 h-6 rounded-md">
                  <Hash className="w-3 h-3" aria-hidden />
                  {r.lote}
                </Badge>
              )}
              {r.endereco && (
                <Badge variant="secondary" className="text-[10px] font-mono gap-1 h-6 rounded-md">
                  <MapPin className="w-3 h-3" aria-hidden />
                  {r.endereco}
                </Badge>
              )}
            </div>
          )}

          {/* Lote sistema */}
          {r.loteSistema && (
            <button
              type="button"
              onClick={() => onCopy(r.loteSistema!)}
              className={`w-full flex items-center justify-between gap-2 rounded-md border border-dashed border-primary/40 bg-primary/[0.06] px-3 ${isCompact ? 'py-2 min-h-[40px]' : 'py-2.5 min-h-[44px]'} text-xs font-mono text-primary hover:bg-primary/10 hover:border-primary/60 active:scale-[0.98] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40`}
              aria-label={`Copiar Lote Sistema ${r.loteSistema}`}
            >
              <span className="flex items-center gap-2 min-w-0">
                <span className="text-[9px] font-sans font-semibold uppercase tracking-wider text-primary/70 shrink-0">
                  Lote Sistema
                </span>
                <span className="truncate font-bold">{r.loteSistema}</span>
              </span>
              <Copy className="w-3.5 h-3.5 shrink-0 opacity-70 group-hover:opacity-100" aria-hidden />
            </button>
          )}
        </motion.li>
      ))}
    </ul>
  );
});

TecidoCardsView.displayName = 'TecidoCardsView';

export default TecidoCardsView;
