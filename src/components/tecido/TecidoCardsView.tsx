import { memo } from 'react';
import { motion } from 'framer-motion';
import { Trash2, Copy, Package } from 'lucide-react';
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

/**
 * Lista de registros em cards — uso operacional em tablet vertical (md → lg)
 * para a aba Tecido. Substitui a tabela densa por blocos de toque amigável
 * (touch target ≥ 44px nas ações). Cada card mostra o essencial:
 * Item, M², M.Linear, Largura, Lote, Endereço e Lote Sistema.
 *
 * Não altera regras de negócio: usa as mesmas callbacks (onDelete/onCopy)
 * já passadas para a TableRow existente.
 */
const TecidoCardsView = memo(({ rows, onDelete, onCopy, isGuest, showActions }: TecidoCardsViewProps) => {
  if (rows.length === 0) return null;

  return (
    <ul
      role="list"
      aria-label="Registros de tecido"
      className="flex flex-col gap-3 p-3"
    >
      {rows.map((r, i) => (
        <motion.li
          key={r.id}
          initial={r.isNew ? { opacity: 0, y: -8, scale: 0.98 } : false}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className={`rounded-xl border border-border/50 bg-card p-4 shadow-sm transition-all hover:border-primary/40 hover:shadow-md ${
            r.isNew ? 'ring-2 ring-primary/30 bg-primary/5' : ''
          }`}
        >
          {/* Linha 1: índice + item + ações */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-semibold text-muted-foreground/60 font-mono">
                  #{i + 1}
                </span>
                <Package className="w-3.5 h-3.5 text-primary/60 shrink-0" aria-hidden />
              </div>
              <p className="text-sm font-semibold text-foreground font-mono break-all leading-tight">
                {r.item || '—'}
              </p>
            </div>

            {showActions && !isGuest && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(r.id)}
                className="h-11 w-11 rounded-lg shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                aria-label={`Remover registro ${r.item || ''}`}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Linha 2: métricas em grid */}
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs mb-3">
            {r.m2 != null && r.m2 > 0 && (
              <div>
                <dt className="text-[10px] font-semibold text-muted-foreground/60 uppercase">M²</dt>
                <dd className="text-sm font-mono text-foreground">{r.m2.toFixed(1)}</dd>
              </div>
            )}
            {r.mLinear != null && r.mLinear > 0 && (
              <div>
                <dt className="text-[10px] font-semibold text-muted-foreground/60 uppercase">M. Linear</dt>
                <dd className="text-sm font-mono text-foreground">{formatML(r.mLinear)}</dd>
              </div>
            )}
            {r.largura != null && r.largura > 0 && (
              <div>
                <dt className="text-[10px] font-semibold text-muted-foreground/60 uppercase">Largura</dt>
                <dd className="text-sm font-mono text-foreground">{r.largura} m</dd>
              </div>
            )}
            {r.quantidade != null && r.quantidade > 0 && (
              <div>
                <dt className="text-[10px] font-semibold text-muted-foreground/60 uppercase">Qtd</dt>
                <dd className="text-sm font-mono text-foreground">{r.quantidade}</dd>
              </div>
            )}
          </dl>

          {/* Linha 3: lote + endereço */}
          {(r.lote || r.endereco) && (
            <div className="flex flex-wrap gap-2 mb-3">
              {r.lote && (
                <Badge variant="outline" className="text-[10px] font-mono">
                  Lote: {r.lote}
                </Badge>
              )}
              {r.endereco && (
                <Badge variant="outline" className="text-[10px] font-mono">
                  End.: {r.endereco}
                </Badge>
              )}
            </div>
          )}

          {/* Linha 4: lote sistema (clicável para copiar) */}
          {r.loteSistema && (
            <button
              type="button"
              onClick={() => onCopy(r.loteSistema!)}
              className="w-full flex items-center justify-between gap-2 rounded-lg border border-dashed border-primary/30 bg-primary/5 px-3 py-2.5 text-xs font-mono text-primary hover:bg-primary/10 active:scale-[0.98] transition-all min-h-[44px]"
              aria-label={`Copiar Lote Sistema ${r.loteSistema}`}
            >
              <span className="truncate font-semibold">{r.loteSistema}</span>
              <Copy className="w-3.5 h-3.5 shrink-0" aria-hidden />
            </button>
          )}
        </motion.li>
      ))}
    </ul>
  );
});

TecidoCardsView.displayName = 'TecidoCardsView';

export default TecidoCardsView;
