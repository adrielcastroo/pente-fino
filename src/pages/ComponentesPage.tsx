import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  ClipboardList,
  FileSpreadsheet,
  List,
  Loader2,
  Minus,
  Package,
  Plus,
  RotateCcw,
  ScanBarcode,
  Trash2,
  Undo2,
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useIsMobile, useIsTablet } from '@/hooks/use-mobile';
import { usePerformance } from '@/hooks/use-performance';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useAuth } from '@/hooks/use-auth';
import { itensCadastroService } from '@/services/itensCadastroService';
import { printComponenteLabel } from '@/services/printService';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import ImportComponentesDialog, {
  type ImportedComponenteRow,
} from '@/components/componentes/ImportComponentesDialog';

/* ============================================================
   Tipos & Persistência
   ============================================================ */

type Item = {
  id: string;
  codigo: string;
  descricao: string | null;
  /** Quantidade total (peças/metros) do pacote bipado — o que o operador digitou. */
  quantidade: number;
  /** Unidade de medida vinda do cadastro (PC, MT, KG…). */
  unidade: string | null;
  /** Divisor para gerar etiquetas. `null` = sem divisão (1 etiqueta com a qtd bipada). */
  pacoteEstocagem: number | null;
  /** Só referência informativa vinda do cadastro. */
  pacoteFornecedor: number | null;
  ts: number;
};

type LookupResult = {
  descricao: string | null;
  unidade: string | null;
  pacoteEstocagem: number | null;
  pacoteFornecedor: number | null;
};

type UndoAction =
  | { type: 'delete'; item: Item; idx: number }
  | { type: 'clear'; items: Item[] }
  | { type: 'finalize'; items: Item[] };

const STORAGE_PREFIX = 'conf-componentes:v2';
const scopeKey = (uid: string | null, guestName: string, isGuest: boolean) => {
  if (uid) return `${STORAGE_PREFIX}:${uid}`;
  if (isGuest) return `${STORAGE_PREFIX}:guest:${guestName || 'default'}`;
  return `${STORAGE_PREFIX}:anon`;
};

/* ============================================================
   Cálculo de etiquetas
   ============================================================ */

export interface EtiquetaPlan {
  cheias: number;      // qtd de etiquetas com valor = por
  resto: number;       // qtd extra (0 se dividir exato)
  por: number;         // valor de cada etiqueta cheia
  total: number;       // total de etiquetas (cheias + (resto>0 ? 1 : 0))
}

export function planEtiquetas(quantidade: number, pacoteEstocagem: number | null): EtiquetaPlan {
  const q = Math.max(0, Number(quantidade) || 0);
  const por = pacoteEstocagem && pacoteEstocagem > 0 ? Number(pacoteEstocagem) : q || 1;
  if (!por || q <= 0) return { cheias: 0, resto: 0, por: por || 0, total: 0 };
  const cheias = Math.floor(q / por);
  const resto = +(q - cheias * por).toFixed(4);
  const total = cheias + (resto > 0 ? 1 : 0);
  return { cheias, resto, por, total };
}

function formatQtd(n: number): string {
  if (!Number.isFinite(n)) return String(n);
  return Number.isInteger(n) ? String(n) : String(+n.toFixed(2));
}

function labelUnidade(unidade: string | null | undefined): string {
  const u = (unidade || '').trim().toUpperCase();
  if (u === 'MT' || u === 'M' || u === 'METROS') return 'Metros por pacote';
  if (u === 'KG') return 'Quilos por pacote';
  if (u === 'PC' || u === 'PÇ' || u === 'PECAS' || u === 'PEÇAS') return 'Peças por pacote';
  return 'Quantidade por pacote';
}

/* ============================================================
   FORM (LeftPanel equivalente)
   ============================================================ */

const INPUT_BASE =
  'w-full h-11 rounded-lg border border-border bg-card px-3.5 text-sm font-mono shadow-sm ' +
  'transition-all duration-200 hover:border-primary/40 focus:border-primary focus:bg-card ' +
  'focus:ring-2 focus:ring-primary/25 focus:shadow-md focus:outline-none ' +
  'placeholder:text-muted-foreground/40';

interface FormProps {
  codigo: string;
  quantidade: string;
  setCodigo: (v: string) => void;
  setQuantidade: (v: string) => void;
  adicionar: () => void;
  codigoRef: React.RefObject<HTMLInputElement>;
  qtdRef: React.RefObject<HTMLInputElement>;
  totalLinhas: number;
  totalPacotes: number;
  totalEtiquetas: number;
  onFinalizar: () => void;
  onLimpar: () => void;
  onUndo: () => void;
  temItens: boolean;
  canUndo: boolean;
  lookupLoading: boolean;
  lookupHit: LookupResult | null;
  saving: boolean;
}

function ComponentesForm({
  codigo,
  quantidade,
  setCodigo,
  setQuantidade,
  adicionar,
  codigoRef,
  qtdRef,
  totalLinhas,
  totalPacotes,
  totalEtiquetas,
  onFinalizar,
  onLimpar,
  onUndo,
  temItens,
  canUndo,
  lookupLoading,
  lookupHit,
  saving,
}: FormProps) {
  const handleCodigoKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    if (quantidade && Number(quantidade) > 0) adicionar();
    else qtdRef.current?.focus();
  };
  const handleQtdKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      adicionar();
    }
  };

  return (
    <div className="bg-background xl:border-r border-border/40 overflow-hidden flex flex-col h-full w-full min-w-0 max-w-full rounded-md border border-border/50 lg:border-none lg:rounded-none">
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-5 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-md bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
              <Package className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Conferência
              </div>
              <h1 className="text-sm font-bold tracking-tight truncate">Componentes</h1>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onUndo}
              disabled={!canUndo}
              title="Desfazer (Ctrl+Z)"
              className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors px-2 py-1 rounded-md hover:bg-primary/10 border border-transparent hover:border-primary/20 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:border-transparent flex items-center gap-1"
            >
              <Undo2 className="w-3 h-3" /> Desfazer
            </button>
            <button
              type="button"
              onClick={onLimpar}
              disabled={!temItens}
              className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-destructive/70 hover:text-destructive transition-colors px-2 py-1 rounded-md hover:bg-destructive/10 border border-transparent hover:border-destructive/20 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:border-transparent"
            >
              Limpar
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-md border border-border/60 bg-muted/30 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
              <ScanBarcode className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Passo 1
              </div>
              <div className="text-sm font-semibold">Bipar componente</div>
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="codigo"
            className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground"
          >
            Código / Conferência
          </label>
          <input
            id="codigo"
            ref={codigoRef}
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            onKeyDown={handleCodigoKey}
            placeholder="Bipe ou digite o código"
            autoComplete="off"
            className={cn(INPUT_BASE, 'uppercase')}
          />
          {/* Feedback do vínculo com itens_cadastro */}
          <div className="min-h-[36px] space-y-0.5">
            {lookupLoading ? (
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Loader2 className="w-3 h-3 animate-spin" /> Buscando cadastro…
              </div>
            ) : lookupHit?.descricao || lookupHit?.unidade || lookupHit?.pacoteEstocagem ? (
              <>
                {lookupHit.descricao ? (
                  <div className="flex items-start gap-1.5 text-[11px] text-primary/80 font-medium">
                    <Check className="w-3 h-3 mt-0.5 shrink-0" />
                    <span className="truncate" title={lookupHit.descricao}>
                      {lookupHit.descricao}
                    </span>
                  </div>
                ) : null}
                <div className="flex flex-wrap gap-1.5 pl-4">
                  {lookupHit.unidade ? (
                    <span className="text-[10px] font-mono uppercase rounded border border-border/60 bg-muted/40 px-1.5 py-0.5">
                      {lookupHit.unidade}
                    </span>
                  ) : null}
                  {lookupHit.pacoteEstocagem ? (
                    <span className="text-[10px] font-mono rounded border border-primary/30 bg-primary/5 px-1.5 py-0.5 text-primary">
                      Estocagem: {formatQtd(lookupHit.pacoteEstocagem)}
                    </span>
                  ) : null}
                  {lookupHit.pacoteFornecedor ? (
                    <span className="text-[10px] font-mono rounded border border-border/60 bg-muted/40 px-1.5 py-0.5 text-muted-foreground">
                      Fornecedor: {formatQtd(lookupHit.pacoteFornecedor)}
                    </span>
                  ) : null}
                </div>
              </>
            ) : codigo.trim().length >= 2 ? (
              <div className="text-[11px] text-muted-foreground/60">
                Item não cadastrado — será registrado sem regra de divisão.
              </div>
            ) : null}
          </div>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="quantidade"
            className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground"
          >
            {labelUnidade(lookupHit?.unidade)}
          </label>
          <input
            id="quantidade"
            ref={qtdRef}
            type="number"
            inputMode="decimal"
            min={0.01}
            step="any"
            value={quantidade}
            onChange={(e) => setQuantidade(e.target.value)}
            onKeyDown={handleQtdKey}
            className={cn(INPUT_BASE, 'text-center font-semibold')}
          />
          {/* Prévia de etiquetas */}
          {(() => {
            const q = Number((quantidade || '').replace(',', '.'));
            if (!Number.isFinite(q) || q <= 0) return null;
            const plan = planEtiquetas(q, lookupHit?.pacoteEstocagem ?? null);
            if (plan.total <= 0) return null;
            const partes: string[] = [];
            if (plan.cheias > 0) partes.push(`${plan.cheias}× ${formatQtd(plan.por)}`);
            if (plan.resto > 0) partes.push(`1× ${formatQtd(plan.resto)}`);
            const unid = lookupHit?.unidade ? ` ${lookupHit.unidade}` : '';
            return (
              <div className="text-[11px] text-muted-foreground pl-0.5">
                {lookupHit?.pacoteEstocagem ? (
                  <>Vai gerar <span className="font-mono font-bold text-primary">{plan.total}</span> etiqueta(s): {partes.join(' + ')}{unid}</>
                ) : (
                  <>1 etiqueta com {formatQtd(q)}{unid} (sem pacote de estocagem cadastrado)</>
                )}
              </div>
            );
          })()}
        </div>

        <Button
          onClick={adicionar}
          disabled={saving}
          className="w-full h-11 rounded-lg font-semibold gap-2"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Adicionar
        </Button>

        <div className="grid grid-cols-3 gap-2 p-1 bg-muted/20 rounded-md border border-border/40">
          <div className="rounded-md bg-background/40 px-3 py-2.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Linhas
            </div>
            <div className="text-lg font-bold font-mono tabular-nums">{totalLinhas}</div>
          </div>
          <div className="rounded-md bg-background/40 px-3 py-2.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Total
            </div>
            <div className="text-lg font-bold font-mono tabular-nums">{formatQtd(totalPacotes)}</div>
          </div>
          <div className="rounded-md bg-primary/5 border border-primary/20 px-3 py-2.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-primary/80">
              Etiquetas
            </div>
            <div className="text-lg font-bold font-mono tabular-nums text-primary">
              {totalEtiquetas}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-shrink-0 p-3 sm:p-4 border-t border-border/40 bg-card/40">
        <Button
          onClick={onFinalizar}
          disabled={!temItens}
          className="w-full h-11 rounded-lg font-semibold gap-2"
        >
          <Check className="w-4 h-4" /> Finalizar conferência
        </Button>
      </div>
    </div>
  );
}

/* ============================================================
   TABELA (RightPanel equivalente)
   ============================================================ */

interface TabelaProps {
  itens: Item[];
  onAjustar: (id: string, delta: number) => void;
  onRemover: (id: string) => void;
  totalPacotes: number;
  isLow: boolean;
}

function ComponentesTabela({ itens, onAjustar, onRemover, totalPacotes, isLow }: TabelaProps) {
  return (
    <div className="flex flex-col h-full overflow-hidden bg-background rounded-md border border-border/50 shadow-2xl transition-all duration-500 min-h-0">
      <div className="px-3 xs:px-4 sm:px-6 py-3 sm:py-5 bg-card/60 border-b border-border/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 flex-shrink-0 min-w-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-md bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
            <ClipboardList className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Registros
            </div>
            <h2 className="text-sm font-bold tracking-tight truncate">Itens conferidos</h2>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="rounded-md border border-border/50 bg-background/60 px-2.5 py-1.5 text-[11px] font-mono font-semibold text-muted-foreground">
            {itens.length} linha(s)
          </span>
          <span className="rounded-md border border-primary/30 bg-primary/5 px-2.5 py-1.5 text-[11px] font-mono font-bold text-primary">
            {totalPacotes} pacote(s)
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-auto bg-background/20 custom-scrollbar relative min-h-0">
        {itens.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center gap-3 p-8">
            <div className="w-16 h-16 rounded-full bg-muted/40 border border-border/40 flex items-center justify-center">
              <Package className="w-7 h-7 text-muted-foreground/40" />
            </div>
            <p className="text-sm font-semibold text-muted-foreground">Nenhum item bipado.</p>
            <p className="text-xs text-muted-foreground/60 max-w-[260px]">
              Bipe o código e informe a quantidade por pacote. Itens ficam salvos automaticamente
              neste dispositivo.
            </p>
          </div>
        ) : (
          <table className="w-full border-separate border-spacing-0 table-auto min-w-[640px]">
            <thead>
              <tr className="bg-muted/30">
                <th className="sticky top-0 z-10 px-2 sm:px-4 py-3 sm:py-4 text-left text-[8px] sm:text-[10px] font-semibold text-muted-foreground border-b border-r border-border/40 bg-background/80 whitespace-nowrap w-12">
                  #
                </th>
                <th className="sticky top-0 z-10 px-2 sm:px-4 py-3 sm:py-4 text-left text-[8px] sm:text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border-b border-r border-border/40 bg-background whitespace-nowrap">
                  Código
                </th>
                <th className="sticky top-0 z-10 px-2 sm:px-4 py-3 sm:py-4 text-left text-[8px] sm:text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border-b border-r border-border/40 bg-background whitespace-nowrap">
                  Descrição
                </th>
                <th className="sticky top-0 z-10 px-2 sm:px-4 py-3 sm:py-4 text-center text-[8px] sm:text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border-b border-r border-border/40 bg-background whitespace-nowrap w-[180px]">
                  Quantidade
                </th>
                <th className="sticky top-0 z-10 px-2 sm:px-4 py-3 sm:py-4 text-center text-[8px] sm:text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border-b border-r border-border/40 bg-background whitespace-nowrap w-[140px]">
                  Etiquetas
                </th>
                <th className="sticky top-0 z-10 px-2 sm:px-4 py-3 sm:py-4 text-right border-b border-border/40 bg-background w-[70px] sm:w-[90px] text-[8px] sm:text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              <AnimatePresence initial={false}>
                {itens.map((r, i) => {
                  const content = (
                    <>
                      <td className="px-3 sm:px-5 py-3 sm:py-4 text-[10px] sm:text-xs text-muted-foreground/40 font-semibold tabular-nums border-r border-border/20">
                        {itens.length - i}
                      </td>
                      <td className="px-3 sm:px-5 py-3 sm:py-4 text-xs sm:text-sm font-mono text-foreground font-bold border-r border-border/20 uppercase">
                        {r.codigo}
                      </td>
                      <td className="px-3 sm:px-5 py-3 sm:py-4 text-xs sm:text-sm text-foreground/80 border-r border-border/20 max-w-[280px] truncate">
                        {r.descricao ? (
                          <span title={r.descricao}>{r.descricao}</span>
                        ) : (
                          <span className="text-muted-foreground/40 italic">—</span>
                        )}
                      </td>
                      <td className="px-3 sm:px-5 py-3 sm:py-4 border-r border-border/20">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 rounded-md hover:bg-primary/10 hover:text-primary transition-all active:scale-90"
                            onClick={() => onAjustar(r.id, -1)}
                            aria-label="Diminuir"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </Button>
                          <span className="min-w-10 text-center font-mono font-bold tabular-nums text-sm">
                            {formatQtd(r.quantidade)}
                            {r.unidade ? (
                              <span className="ml-1 text-[10px] text-muted-foreground font-normal">
                                {r.unidade}
                              </span>
                            ) : null}
                          </span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 rounded-md hover:bg-primary/10 hover:text-primary transition-all active:scale-90"
                            onClick={() => onAjustar(r.id, +1)}
                            aria-label="Aumentar"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                      <td className="px-3 sm:px-5 py-3 sm:py-4 border-r border-border/20 text-center">
                        {(() => {
                          const plan = planEtiquetas(r.quantidade, r.pacoteEstocagem);
                          if (plan.total <= 0) return <span className="text-muted-foreground/40">—</span>;
                          const partes: string[] = [];
                          if (plan.cheias > 0) partes.push(`${plan.cheias}× ${formatQtd(plan.por)}`);
                          if (plan.resto > 0) partes.push(`1× ${formatQtd(plan.resto)}`);
                          return (
                            <div className="flex flex-col items-center gap-0.5">
                              <span className="text-sm font-mono font-bold tabular-nums text-primary">
                                {plan.total}
                              </span>
                              <span className="text-[10px] font-mono text-muted-foreground">
                                {partes.join(' + ')}
                              </span>
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-3 sm:px-5 py-3 sm:py-4 text-right">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-9 w-9 rounded-md hover:bg-destructive/10 hover:text-destructive transition-all active:scale-90 shadow-none hover:shadow-sm"
                          onClick={() => onRemover(r.id)}
                          aria-label="Remover"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </>
                  );

                  if (isLow) {
                    return (
                      <tr
                        key={r.id}
                        className="group hover:bg-primary/[0.03] border-b border-border/30 transition-all duration-300"
                      >
                        {content}
                      </tr>
                    );
                  }
                  return (
                    <motion.tr
                      key={r.id}
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="group hover:bg-primary/[0.03] border-b border-border/30 transition-all duration-300"
                    >
                      {content}
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   PÁGINA
   ============================================================ */

export default function ComponentesPage() {
  useDocumentTitle('Conferência — Componentes');
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const isNarrow = isMobile || isTablet;
  const { isLow } = usePerformance();
  const { user, isGuest, guestName, loading: authLoading } = useAuth();

  const [codigo, setCodigo] = useState('');
  const [quantidade, setQuantidade] = useState('1');
  const [itens, setItens] = useState<Item[]>([]);
  const [undoStack, setUndoStack] = useState<UndoAction[]>([]);
  const [showTableMobile, setShowTableMobile] = useState(false);
  const [saving, setSaving] = useState(false);

  // Lookup em itens_cadastro (agora traz descrição + unidade + pacotes)
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupHit, setLookupHit] = useState<LookupResult | null>(null);
  // Cache local por sessão para evitar refetch por código
  const descCacheRef = useRef<Map<string, LookupResult>>(new Map());
  const lookupSeq = useRef(0);

  // Regras de impressão do usuário (mesma origem que Motor/Tecido)
  const labelSettings = useAppStore((s) => s.labelSettings);

  const codigoRef = useRef<HTMLInputElement>(null);
  const qtdRef = useRef<HTMLInputElement>(null);

  // Chave de persistência escopada por usuário
  const storageKey = useMemo(
    () => scopeKey(user?.id ?? null, guestName, isGuest),
    [user?.id, guestName, isGuest],
  );
  const hydrated = useRef(false);

  // Hidrata do localStorage — aceita formato antigo (v1) sem os campos novos.
  useEffect(() => {
    if (authLoading) return;
    try {
      const raw =
        localStorage.getItem(storageKey) ??
        localStorage.getItem(storageKey.replace(':v2:', ':v1:'));
      if (raw) {
        const parsed = JSON.parse(raw) as { itens?: Array<Partial<Item> & Pick<Item, 'id' | 'codigo' | 'quantidade' | 'ts'>> };
        if (Array.isArray(parsed.itens)) {
          const hydrated: Item[] = parsed.itens.map((i) => ({
            id: i.id,
            codigo: i.codigo,
            descricao: i.descricao ?? null,
            quantidade: Number(i.quantidade) || 0,
            unidade: i.unidade ?? null,
            pacoteEstocagem: i.pacoteEstocagem ?? null,
            pacoteFornecedor: i.pacoteFornecedor ?? null,
            ts: i.ts ?? Date.now(),
          }));
          setItens(hydrated);
        }
      } else {
        setItens([]);
      }
    } catch (e) {
      console.warn('[Componentes] hydrate falhou', e);
    }
    hydrated.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey, authLoading]);

  // Persiste
  useEffect(() => {
    if (!hydrated.current) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify({ itens }));
    } catch (e) {
      console.warn('[Componentes] persist falhou', e);
    }
  }, [itens, storageKey]);

  // Foco inicial
  useEffect(() => {
    codigoRef.current?.focus();
  }, []);

  const totais = useMemo(() => {
    const totalPacotes = itens.reduce((acc, i) => acc + i.quantidade, 0);
    const totalEtiquetas = itens.reduce(
      (acc, i) => acc + planEtiquetas(i.quantidade, i.pacoteEstocagem).total,
      0,
    );
    return { linhas: itens.length, totalPacotes, totalEtiquetas };
  }, [itens]);

  /* --------- Lookup em itens_cadastro (debounced) --------- */
  const buscarItem = useCallback(async (raw: string): Promise<LookupResult> => {
    const cod = raw.trim().toUpperCase();
    const empty: LookupResult = { descricao: null, unidade: null, pacoteEstocagem: null, pacoteFornecedor: null };
    if (!cod) return empty;
    const cached = descCacheRef.current.get(cod);
    if (cached) return cached;

    try {
      let hit = await itensCadastroService.findByCodigoFornecedor(cod);
      if (!hit) hit = await itensCadastroService.findByCodigoInterno(cod);
      const result: LookupResult = hit
        ? {
            descricao: hit.descricao?.trim() || null,
            unidade: hit.unidade || null,
            pacoteEstocagem: hit.pacote_estocagem != null ? Number(hit.pacote_estocagem) : null,
            pacoteFornecedor: hit.pacote_fornecedor != null ? Number(hit.pacote_fornecedor) : null,
          }
        : empty;
      descCacheRef.current.set(cod, result);
      return result;
    } catch (e) {
      console.warn('[Componentes] lookup falhou', e);
      return empty;
    }
  }, []);

  useEffect(() => {
    const cod = codigo.trim();
    if (cod.length < 2) {
      setLookupHit(null);
      setLookupLoading(false);
      return;
    }
    const seq = ++lookupSeq.current;
    setLookupLoading(true);
    const t = setTimeout(async () => {
      const res = await buscarItem(cod);
      if (seq !== lookupSeq.current) return; // corrida
      setLookupHit(res);
      setLookupLoading(false);
    }, 250);
    return () => clearTimeout(t);
  }, [codigo, buscarItem]);

  /* --------- Ações --------- */
  const adicionar = useCallback(async () => {
    const cod = codigo.trim().toUpperCase();
    const qtd = Number(quantidade.replace(',', '.'));
    if (!cod) {
      toast.warning('Bipe ou informe o código.');
      codigoRef.current?.focus();
      return;
    }
    if (!Number.isFinite(qtd) || qtd <= 0) {
      toast.warning('Quantidade deve ser maior que zero.');
      qtdRef.current?.focus();
      return;
    }

    setSaving(true);
    const info = descCacheRef.current.get(cod) ?? (await buscarItem(cod));
    setSaving(false);

    setItens((prev) => {
      const existente = prev.find((i) => i.codigo === cod);
      if (existente) {
        return prev.map((i) =>
          i.codigo === cod
            ? {
                ...i,
                quantidade: i.quantidade + qtd,
                descricao: i.descricao ?? info.descricao,
                unidade: i.unidade ?? info.unidade,
                pacoteEstocagem: i.pacoteEstocagem ?? info.pacoteEstocagem,
                pacoteFornecedor: i.pacoteFornecedor ?? info.pacoteFornecedor,
                ts: Date.now(),
              }
            : i,
        );
      }
      const novo: Item = {
        id: crypto.randomUUID(),
        codigo: cod,
        descricao: info.descricao,
        quantidade: qtd,
        unidade: info.unidade,
        pacoteEstocagem: info.pacoteEstocagem,
        pacoteFornecedor: info.pacoteFornecedor,
        ts: Date.now(),
      };
      return [novo, ...prev];
    });

    const plan = planEtiquetas(qtd, info.pacoteEstocagem);
    const detalhe =
      plan.total > 1
        ? plan.resto > 0
          ? ` · ${plan.cheias}×${formatQtd(plan.por)} + 1×${formatQtd(plan.resto)} etiquetas`
          : ` · ${plan.total}×${formatQtd(plan.por)} etiquetas`
        : '';
    toast.success(`${cod} · ${formatQtd(qtd)}${info.unidade ? ' ' + info.unidade : ''}${detalhe}`);
    setCodigo('');
    setQuantidade('1');
    setLookupHit(null);
    setTimeout(() => codigoRef.current?.focus(), 0);
  }, [codigo, quantidade, buscarItem]);

  const remover = useCallback((id: string) => {
    setItens((prev) => {
      const idx = prev.findIndex((i) => i.id === id);
      if (idx < 0) return prev;
      setUndoStack((u) => [...u, { type: 'delete', item: prev[idx], idx }]);
      return prev.filter((i) => i.id !== id);
    });
  }, []);

  const ajustar = useCallback((id: string, delta: number) => {
    setItens((prev) => {
      const next = prev
        .map((i) => (i.id === id ? { ...i, quantidade: i.quantidade + delta } : i))
        .filter((i) => i.quantidade > 0);
      // Se removeu por chegar em zero, empilha para undo
      if (next.length < prev.length) {
        const removed = prev.find((i) => i.id === id);
        const idx = prev.findIndex((i) => i.id === id);
        if (removed && idx >= 0) {
          setUndoStack((u) => [...u, { type: 'delete', item: removed, idx }]);
        }
      }
      return next;
    });
  }, []);

  const limpar = useCallback(() => {
    setItens((prev) => {
      if (prev.length === 0) return prev;
      if (!confirm('Limpar todos os itens da conferência?')) return prev;
      setUndoStack((u) => [...u, { type: 'clear', items: prev }]);
      return [];
    });
    codigoRef.current?.focus();
  }, []);

  const [printing, setPrinting] = useState(false);
  const finalizar = useCallback(async () => {
    if (itens.length === 0) {
      toast.warning('Nenhum item para finalizar.');
      return;
    }
    const snapshot = itens;
    const totalEtiquetas = snapshot.reduce(
      (acc, i) => acc + planEtiquetas(i.quantidade, i.pacoteEstocagem).total,
      0,
    );

    if (labelSettings.autoPrint && totalEtiquetas > 0) {
      setPrinting(true);
      const toastId = toast.loading(`Imprimindo ${totalEtiquetas} etiqueta(s)…`);
      let ok = 0;
      let fail = 0;
      try {
        for (const item of snapshot) {
          const plan = planEtiquetas(item.quantidade, item.pacoteEstocagem);
          // N etiquetas cheias
          for (let i = 0; i < plan.cheias; i++) {
            try {
              await printComponenteLabel(
                {
                  codigo: item.codigo,
                  descricao: item.descricao ?? undefined,
                  quantidade: plan.por,
                  unidade: item.unidade,
                },
                labelSettings,
              );
              ok++;
            } catch (e) {
              console.error('[Componentes] falha ao imprimir etiqueta cheia', e);
              fail++;
            }
          }
          // Etiqueta com o resto (se houver)
          if (plan.resto > 0) {
            try {
              await printComponenteLabel(
                {
                  codigo: item.codigo,
                  descricao: item.descricao ?? undefined,
                  quantidade: plan.resto,
                  unidade: item.unidade,
                },
                labelSettings,
              );
              ok++;
            } catch (e) {
              console.error('[Componentes] falha ao imprimir etiqueta parcial', e);
              fail++;
            }
          }
        }
      } finally {
        setPrinting(false);
        toast.dismiss(toastId);
      }
      if (fail === 0) {
        toast.success(`Conferência finalizada: ${ok} etiqueta(s) impressa(s).`);
      } else {
        toast.warning(`Finalizada com falhas: ${ok} ok · ${fail} falha(s).`);
      }
    } else if (totalEtiquetas > 0) {
      toast.info(
        `Impressão automática desativada — ${totalEtiquetas} etiqueta(s) não foram enviadas.`,
      );
    }

    setUndoStack((u) => [...u, { type: 'finalize', items: snapshot }]);
    setItens([]);
    codigoRef.current?.focus();
  }, [itens, labelSettings]);

  const undo = useCallback(() => {
    setUndoStack((stack) => {
      if (stack.length === 0) {
        toast.info('Nada para desfazer.');
        return stack;
      }
      const last = stack[stack.length - 1];
      setItens((prev) => {
        if (last.type === 'delete') {
          const next = [...prev];
          const idx = Math.min(last.idx, next.length);
          next.splice(idx, 0, last.item);
          return next;
        }
        // clear / finalize → restaura estado inteiro
        return last.items;
      });
      toast.success('Desfeito.');
      return stack.slice(0, -1);
    });
  }, []);

  // Ctrl+Z / Cmd+Z global (respeita campos de input)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isUndo = (e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z';
      if (!isUndo) return;
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      const editable =
        tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable;
      if (editable) return; // preserva undo do campo
      e.preventDefault();
      undo();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo]);

  const form = (
    <ComponentesForm
      codigo={codigo}
      quantidade={quantidade}
      setCodigo={setCodigo}
      setQuantidade={setQuantidade}
      adicionar={adicionar}
      codigoRef={codigoRef}
      qtdRef={qtdRef}
      totalLinhas={totais.linhas}
      totalPacotes={totais.totalPacotes}
      totalEtiquetas={totais.totalEtiquetas}
      onFinalizar={finalizar}
      onLimpar={limpar}
      onUndo={undo}
      temItens={itens.length > 0}
      canUndo={undoStack.length > 0}
      lookupLoading={lookupLoading}
      lookupHit={lookupHit}
      saving={saving}
    />
  );

  const tabela = (
    <ComponentesTabela
      itens={itens}
      onAjustar={ajustar}
      onRemover={remover}
      totalPacotes={totais.totalPacotes}
      isLow={isLow}
    />
  );

  if (!isNarrow) {
    return (
      <div className="flex flex-row h-full w-full min-w-0 gap-4 lg:gap-6 overflow-hidden">
        <div
          className="shrink-0 h-full min-w-0 overflow-hidden"
          style={{ flexBasis: 'clamp(380px, 30vw, 520px)' }}
        >
          {form}
        </div>
        <div className="flex-1 min-w-0 h-full animate-in fade-in slide-in-from-right-4 duration-500 overflow-hidden">
          {tabela}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full max-w-full min-w-0 flex flex-col relative animate-in fade-in duration-300">
      <div className="flex-1 min-h-0 overflow-y-auto pb-20">
        {showTableMobile ? (
          <div className="animate-in slide-in-from-right-4 duration-300 h-full">{tabela}</div>
        ) : (
          <div className="animate-in slide-in-from-left-4 duration-300 h-full">{form}</div>
        )}
      </div>
      <div className="fixed bottom-6 right-6 z-50 lg:hidden">
        <Button
          size="lg"
          onClick={() => setShowTableMobile((v) => !v)}
          className="rounded-full h-14 w-14 shadow-lg border border-border active:scale-95 transition-transform bg-primary text-primary-foreground hover:bg-primary/90 relative"
          aria-label={showTableMobile ? 'Voltar ao formulário' : 'Ver itens bipados'}
        >
          {showTableMobile ? <ClipboardList className="w-6 h-6" /> : <List className="w-6 h-6" />}
          {!showTableMobile && itens.length > 0 && (
            <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
              {itens.length}
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}
