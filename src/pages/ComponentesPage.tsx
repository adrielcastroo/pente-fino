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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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

/* ---------- Form (LeftPanel equivalente) ---------- */

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
    <div className="h-full w-full flex flex-col overflow-y-auto p-4 lg:p-6 gap-4">
      <header className="space-y-1">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
          <Package className="size-3.5" /> Conferência
        </div>
        <h1 className="text-xl lg:text-2xl font-semibold tracking-tight">Componentes</h1>
        <p className="text-sm text-muted-foreground">
          Bipe o código do componente e informe a quantidade por pacote.
        </p>
      </header>

      <div className="rounded-lg border bg-card p-4 space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <ScanBarcode className="size-4 text-primary" /> Bipar componente
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="codigo">Código / Conferência</Label>
            <Input
              id="codigo"
              ref={codigoRef}
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              onKeyDown={handleCodigoKey}
              placeholder="Bipe ou digite o código"
              autoComplete="off"
              className="h-12 font-mono uppercase text-base"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="quantidade">Quantidade (Pacote)</Label>
            <Input
              id="quantidade"
              ref={qtdRef}
              type="number"
              inputMode="numeric"
              min={1}
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
              onKeyDown={handleQtdKey}
              className="h-12 text-center font-mono text-base"
            />
          </div>

          <Button onClick={adicionar} className="h-12 w-full gap-2">
            <Plus className="size-4" /> Adicionar
          </Button>
        </div>
      </div>

      <div className="rounded-lg border bg-card/50 p-4 grid grid-cols-2 gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Linhas</div>
          <div className="text-2xl font-semibold font-mono">{totalLinhas}</div>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Pacotes</div>
          <div className="text-2xl font-semibold font-mono text-primary">{totalPacotes}</div>
        </div>
      </div>

      <div className="mt-auto flex flex-col gap-2 pt-2">
        <Button onClick={onFinalizar} disabled={!temItens} className="h-11 gap-2">
          <Check className="size-4" /> Finalizar conferência
        </Button>
        <Button
          variant="outline"
          onClick={onLimpar}
          disabled={!temItens}
          className="h-11 gap-2"
        >
          <RotateCcw className="size-4" /> Limpar
        </Button>
      </div>
    </div>
  );
}

/* ---------- Tabela (RightPanel equivalente) ---------- */

interface TabelaProps {
  itens: Item[];
  onAjustar: (id: string, delta: number) => void;
  onRemover: (id: string) => void;
  totalPacotes: number;
  isLow: boolean;
}

function ComponentesTabela({ itens, onAjustar, onRemover, totalPacotes, isLow }: TabelaProps) {
  return (
    <div className="h-full w-full flex flex-col overflow-hidden p-4 lg:p-6">
      <div className="flex items-center justify-between mb-3 gap-2">
        <div className="flex items-center gap-2">
          <ClipboardList className="size-4 text-primary" />
          <h2 className="text-base font-semibold">Itens conferidos</h2>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono">{itens.length} linha(s)</Badge>
          <Badge className="font-mono">{totalPacotes} pacote(s)</Badge>
        </div>
      </div>

      <div className="flex-1 min-h-0 rounded-lg border bg-card overflow-hidden flex flex-col">
        {itens.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-2 p-8 text-muted-foreground">
            <Package className="size-8 opacity-40" />
            <p className="text-sm">Nenhum item bipado ainda.</p>
            <p className="text-xs">Comece bipando um código no formulário ao lado.</p>
          </div>
        ) : (
          <div className="flex-1 min-h-0 overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-card z-10">
                <TableRow>
                  <TableHead className="w-12 text-center">#</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead className="w-48 text-center">Quantidade (Pacote)</TableHead>
                  <TableHead className="w-16" />
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence initial={false}>
                  {itens.map((i, idx) => {
                    const row = (
                      <TableRow key={i.id} className="group">
                        <TableCell className="text-center text-xs font-mono text-muted-foreground">
                          {itens.length - idx}
                        </TableCell>
                        <TableCell className="font-mono text-sm truncate">{i.codigo}</TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0"
                              onClick={() => onAjustar(i.id, -1)}
                              aria-label="Diminuir"
                            >
                              <Minus className="size-3" />
                            </Button>
                            <span className="min-w-10 text-center font-mono font-semibold">
                              {i.quantidade}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0"
                              onClick={() => onAjustar(i.id, +1)}
                              aria-label="Aumentar"
                            >
                              <Plus className="size-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-destructive opacity-70 group-hover:opacity-100"
                            onClick={() => onRemover(i.id)}
                            aria-label="Remover"
                          >
                            <Trash2 className="size-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );

                    if (isLow) return row;

                    return (
                      <motion.tr
                        key={i.id}
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className={cn('group border-b')}
                      >
                        <td className="p-2 align-middle text-center text-xs font-mono text-muted-foreground">
                          {itens.length - idx}
                        </td>
                        <td className="p-2 align-middle font-mono text-sm truncate">{i.codigo}</td>
                        <td className="p-2 align-middle">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0"
                              onClick={() => onAjustar(i.id, -1)}
                              aria-label="Diminuir"
                            >
                              <Minus className="size-3" />
                            </Button>
                            <span className="min-w-10 text-center font-mono font-semibold">
                              {i.quantidade}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0"
                              onClick={() => onAjustar(i.id, +1)}
                              aria-label="Aumentar"
                            >
                              <Plus className="size-3" />
                            </Button>
                          </div>
                        </td>
                        <td className="p-2 align-middle text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-destructive opacity-70 group-hover:opacity-100"
                            onClick={() => onRemover(i.id)}
                            aria-label="Remover"
                          >
                            <Trash2 className="size-3" />
                          </Button>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- Página (FormPageLayout equivalente) ---------- */

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
