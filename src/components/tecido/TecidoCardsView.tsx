import { memo } from 'react';
import { motion } from 'framer-motion';
import { Trash2, Copy, Package, Ruler, MapPin, Hash, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatML } from '@/lib/app-utils';
import type { Registro } from '@/types';

interface TecidoCardsViewProps {
  rows: Registro[];
  onDelete: (id: string) => void;
  onCopy: (text: string) => void;
  isGuest: boolean;
  showActions: boolean;
}

interface MetricProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  accent?: boolean;
}

const Metric = ({ icon: Icon, label, value, accent }: MetricProps) => (
  <div className="flex items-center gap-2 min-w-0">
    <Icon className={`w-3.5 h-3.5 shrink-0 ${accent ? 'text-primary' : 'text-muted-foreground/70'}`} aria-hidden />
    <div className="min-w-0">
      <div className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/60 leading-none">
        {label}
      </div>
      <div className={`text-sm font-mono font-semibold leading-tight truncate tabular-nums ${accent ? 'text-primary' : 'text-foreground'}`}>
        {value}
      </div>
    </div>
  </div>
);

/**
 * Cards de conferência de tecido — tablet vertical (md→lg).
 * Padrão industrial: rounded-md, border-border/60, sem sombras,
 * tabular-nums em todos os numéricos.
 */
const TecidoCardsView = memo(({ rows, onDelete, onCopy, isGuest, showActions }: TecidoCardsViewProps) => {
  if (rows.length === 0) return null;

  return (
    <ul
      role="list"
      aria-label="Registros de tecido"
      className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-1 gap-3 p-3"
    >
      {rows.map((r, i) => (
        <motion.li
          key={r.id}
          initial={r.isNew ? { opacity: 0, y: -8, scale: 0.98 } : false}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className={`group relative rounded-md border bg-card p-4 transition-colors ${
            r.isNew
              ? 'border-primary/40 bg-primary/[0.04]'
              : 'border-border/60 hover:border-border'
          }`}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-3 pb-3 border-b border-border/60">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="inline-flex items-center justify-center min-w-[1.5rem] h-5 px-1.5 rounded-md bg-muted/60 text-[10px] font-bold text-muted-foreground font-mono tabular-nums">
                  {i + 1}
                </span>
                <Package className="w-3.5 h-3.5 text-primary/70 shrink-0" aria-hidden />
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
              <p className="text-base font-bold text-foreground font-mono break-all leading-tight">
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
          <div className="grid grid-cols-2 gap-x-3 gap-y-2.5 mb-3">
            {r.m2 != null && r.m2 > 0 && (
              <Metric icon={Ruler} label="M²" value={r.m2.toFixed(1)} accent />
            )}
            {r.mLinear != null && r.mLinear > 0 && (
              <Metric icon={Ruler} label="M. Linear" value={formatML(r.mLinear)} />
            )}
            {r.largura != null && r.largura > 0 && (
              <Metric icon={Ruler} label="Largura" value={`${r.largura} m`} />
            )}
            {r.quantidade != null && r.quantidade > 0 && (
              <Metric icon={Hash} label="Quantidade" value={String(r.quantidade)} />
            )}
          </div>

          {/* Lote + endereço */}
          {(r.lote || r.endereco) && (
            <div className="flex flex-wrap gap-1.5 mb-3">
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

          {/* Lote sistema — CTA copiável */}
          {r.loteSistema && (
            <button
              type="button"
              onClick={() => onCopy(r.loteSistema!)}
              className="w-full flex items-center justify-between gap-2 rounded-md border border-dashed border-primary/40 bg-primary/[0.06] px-3 py-2.5 text-xs font-mono text-primary hover:bg-primary/10 hover:border-primary/60 active:scale-[0.98] transition-colors min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
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
