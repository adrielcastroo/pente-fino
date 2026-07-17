import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  ClipboardList,
  List,
  Minus,
  Package,
  Plus,
  RotateCcw,
  ScanBarcode,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useIsMobile, useIsTablet } from '@/hooks/use-mobile';
import { usePerformance } from '@/hooks/use-performance';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { cn } from '@/lib/utils';

type Item = {
  id: string;
  codigo: string;
  quantidade: number;
  ts: number;
};

/* ============================================================
   FORM (LeftPanel equivalente) — mesmo design system das
   páginas Tecido/Madeira/Motor
   ============================================================ */

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
  onFinalizar: () => void;
  onLimpar: () => void;
  temItens: boolean;
}

const INPUT_BASE =
  'w-full h-11 rounded-lg border border-border bg-card px-3.5 text-sm font-mono shadow-sm ' +
  'transition-all duration-200 hover:border-primary/40 focus:border-primary focus:bg-card ' +
  'focus:ring-2 focus:ring-primary/25 focus:shadow-md focus:outline-none ' +
  'placeholder:text-muted-foreground/40';

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
  onFinalizar,
  onLimpar,
  temItens,
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
        {/* Header + reset */}
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
          <button
            type="button"
            onClick={onLimpar}
            disabled={!temItens}
            className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-destructive/70 hover:text-destructive transition-colors px-2.5 py-1 rounded-md hover:bg-destructive/10 border border-transparent hover:border-destructive/20 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:border-transparent"
          >
            Limpar
          </button>
        </div>

        {/* Sub-cabeçalho "Bipar componente" (padrão dos abas de sub-modo) */}
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

        {/* Campo: Código */}
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
        </div>

        {/* Campo: Quantidade */}
        <div className="space-y-1.5">
          <label
            htmlFor="quantidade"
            className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground"
          >
            Quantidade (Pacote)
          </label>
          <input
            id="quantidade"
            ref={qtdRef}
            type="number"
            inputMode="numeric"
            min={1}
            value={quantidade}
            onChange={(e) => setQuantidade(e.target.value)}
            onKeyDown={handleQtdKey}
            className={cn(INPUT_BASE, 'text-center font-semibold')}
          />
        </div>

        {/* Botão principal Adicionar */}
        <Button onClick={adicionar} className="w-full h-11 rounded-lg font-semibold gap-2">
          <Plus className="w-4 h-4" /> Adicionar
        </Button>

        {/* Totais */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-muted/20 rounded-md border border-border/40">
          <div className="rounded-md bg-background/40 px-3 py-2.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Linhas
            </div>
            <div className="text-lg font-bold font-mono tabular-nums">{totalLinhas}</div>
          </div>
          <div className="rounded-md bg-primary/5 border border-primary/20 px-3 py-2.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-primary/80">
              Pacotes
            </div>
            <div className="text-lg font-bold font-mono tabular-nums text-primary">
              {totalPacotes}
            </div>
          </div>
        </div>
      </div>

      {/* Rodapé fixo com Finalizar */}
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
   TABELA (RightPanel equivalente) — mesmo estilo do RightPanel
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
      {/* Header da tabela */}
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

      {/* Corpo */}
      <div className="flex-1 overflow-y-auto overflow-x-auto bg-background/20 custom-scrollbar relative min-h-0">
        {itens.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center gap-3 p-8">
            <div className="w-16 h-16 rounded-full bg-muted/40 border border-border/40 flex items-center justify-center">
              <Package className="w-7 h-7 text-muted-foreground/40" />
            </div>
            <p className="text-sm font-semibold text-muted-foreground">Nenhum item bipado.</p>
            <p className="text-xs text-muted-foreground/60 max-w-[240px]">
              Bipe o código do componente e informe a quantidade por pacote no formulário ao lado.
            </p>
          </div>
        ) : (
          <table className="w-full border-separate border-spacing-0 table-auto min-w-[520px]">
            <thead>
              <tr className="bg-muted/30">
                <th className="sticky top-0 z-10 px-2 sm:px-4 py-3 sm:py-4 text-left text-[8px] sm:text-[10px] font-semibold text-muted-foreground border-b border-r border-border/40 bg-background/80 whitespace-nowrap w-12">
                  #
                </th>
                <th className="sticky top-0 z-10 px-2 sm:px-4 py-3 sm:py-4 text-left text-[8px] sm:text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border-b border-r border-border/40 bg-background whitespace-nowrap">
                  Código
                </th>
                <th className="sticky top-0 z-10 px-2 sm:px-4 py-3 sm:py-4 text-center text-[8px] sm:text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border-b border-r border-border/40 bg-background whitespace-nowrap w-[180px]">
                  Quantidade (Pacote)
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
                            {r.quantidade}
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
   PÁGINA (FormPageLayout equivalente)
   ============================================================ */

export default function ComponentesPage() {
  useDocumentTitle('Conferência — Componentes');
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const isNarrow = isMobile || isTablet;
  const { isLow } = usePerformance();

  const [codigo, setCodigo] = useState('');
  const [quantidade, setQuantidade] = useState('1');
  const [itens, setItens] = useState<Item[]>([]);
  const [showTableMobile, setShowTableMobile] = useState(false);

  const codigoRef = useRef<HTMLInputElement>(null);
  const qtdRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    codigoRef.current?.focus();
  }, []);

  const totais = useMemo(() => {
    const totalPacotes = itens.reduce((acc, i) => acc + i.quantidade, 0);
    return { linhas: itens.length, totalPacotes };
  }, [itens]);

  const adicionar = () => {
    const cod = codigo.trim().toUpperCase();
    const qtd = Number(quantidade);
    if (!cod) {
      toast.warning('Bipe ou informe o código.');
      codigoRef.current?.focus();
      return;
    }
    if (!Number.isFinite(qtd) || qtd <= 0) {
      toast.warning('Quantidade (pacote) deve ser maior que zero.');
      qtdRef.current?.focus();
      return;
    }

    setItens((prev) => {
      const existente = prev.find((i) => i.codigo === cod);
      if (existente) {
        return prev.map((i) =>
          i.codigo === cod ? { ...i, quantidade: i.quantidade + qtd, ts: Date.now() } : i,
        );
      }
      return [
        { id: crypto.randomUUID(), codigo: cod, quantidade: qtd, ts: Date.now() },
        ...prev,
      ];
    });

    toast.success(`${cod} · ${qtd} pacote(s)`);
    setCodigo('');
    setQuantidade('1');
    setTimeout(() => codigoRef.current?.focus(), 0);
  };

  const remover = (id: string) => setItens((prev) => prev.filter((i) => i.id !== id));
  const ajustar = (id: string, delta: number) => {
    setItens((prev) =>
      prev
        .map((i) => (i.id === id ? { ...i, quantidade: i.quantidade + delta } : i))
        .filter((i) => i.quantidade > 0),
    );
  };
  const limpar = () => {
    if (itens.length === 0) return;
    if (!confirm('Limpar todos os itens da conferência?')) return;
    setItens([]);
    codigoRef.current?.focus();
  };
  const finalizar = () => {
    if (itens.length === 0) {
      toast.warning('Nenhum item para finalizar.');
      return;
    }
    toast.success(
      `Conferência finalizada: ${totais.linhas} item(s) · ${totais.totalPacotes} pacote(s).`,
    );
    setItens([]);
    codigoRef.current?.focus();
  };

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
      onFinalizar={finalizar}
      onLimpar={limpar}
      temItens={itens.length > 0}
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
