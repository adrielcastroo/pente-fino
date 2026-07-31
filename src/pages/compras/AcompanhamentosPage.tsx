import { useMemo, useState } from 'react';
import {
  DndContext, DragOverlay, PointerSensor, TouchSensor, closestCorners,
  useSensor, useSensors, type DragEndEvent, type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext, useSortable, verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { CalendarDays, Loader2, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { PageShell, PageHeader } from '@/components/compras/ui';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import PedidoDetailDialog from '@/components/compras/PedidoDetailDialog';
import {
  KANBAN_COLUNAS, useComprasKanbanPedidos, useUpdatePedido,
  type ComprasPedidoCard,
} from '@/hooks/compras/useComprasKanban';
import type { ComprasPedidoStatus } from '@/hooks/compras/useComprasPedidos';

function formatDate(iso: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('pt-BR');
}

function formatCurrency(v: number | null) {
  if (v === null || v === undefined) return null;
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

interface CardProps {
  pedido: ComprasPedidoCard;
  onOpen: (p: ComprasPedidoCard) => void;
  dragging?: boolean;
}

function PedidoCardContent({ pedido, onOpen, dragging }: CardProps) {
  return (
    <button
      type="button"
      onClick={() => onOpen(pedido)}
      className={cn(
        'w-full text-left rounded-lg border border-border bg-card p-3 space-y-1.5 transition-colors hover:border-primary/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        dragging && 'shadow-lg',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-xs text-muted-foreground">{pedido.numero}</span>
        {pedido.valor_total != null && (
          <span className="text-xs tabular-nums text-muted-foreground">{formatCurrency(pedido.valor_total)}</span>
        )}
      </div>
      <p className="text-sm font-medium leading-snug break-words">
        {pedido.titulo?.trim() || pedido.fornecedor}
      </p>
      {pedido.descricao && (
        <p className="text-xs text-muted-foreground line-clamp-2 break-words">{pedido.descricao}</p>
      )}
      <div className="flex flex-wrap items-center gap-2 pt-0.5 text-[11px] text-muted-foreground">
        <span>{pedido.itens} {pedido.itens === 1 ? 'item' : 'itens'}</span>
        {pedido.previsao && (
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="w-3 h-3" aria-hidden /> {formatDate(pedido.previsao)}
          </span>
        )}
      </div>
    </button>
  );
}

function SortablePedidoCard({ pedido, onOpen }: CardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: pedido.id,
    data: { status: pedido.status },
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn('touch-none', isDragging && 'opacity-40')}
      {...attributes}
      {...listeners}
    >
      <PedidoCardContent pedido={pedido} onOpen={onOpen} />
    </div>
  );
}

interface ColumnProps {
  status: ComprasPedidoStatus;
  label: string;
  pedidos: ComprasPedidoCard[];
  onOpen: (p: ComprasPedidoCard) => void;
}

function KanbanColumn({ status, label, pedidos, onOpen }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: `col:${status}`, data: { status } });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-col min-w-[260px] w-[280px] shrink-0 rounded-xl border border-border bg-muted/30 p-2 transition-colors',
        isOver && 'border-primary/60 bg-primary/5',
      )}
    >
      <header className="flex items-center justify-between px-1 py-1.5">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</h2>
        <Badge variant="secondary" className="tabular-nums">{pedidos.length}</Badge>
      </header>
      <SortableContext items={pedidos.map(p => p.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2 min-h-[80px] pb-1">
          {pedidos.map((p) => (
            <SortablePedidoCard key={p.id} pedido={p} onOpen={onOpen} />
          ))}
          {pedidos.length === 0 && (
            <p className="text-[11px] text-muted-foreground/70 px-1 py-4 text-center">
              Arraste um pedido para cá
            </p>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

export default function AcompanhamentosPage() {
  const [search, setSearch] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [detalhe, setDetalhe] = useState<ComprasPedidoCard | null>(null);

  const { data: pedidos = [], isLoading, isError, error } = useComprasKanbanPedidos();
  const updatePedido = useUpdatePedido();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
  );

  const filtrados = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return pedidos;
    return pedidos.filter(p =>
      [p.numero, p.fornecedor, p.titulo, p.descricao]
        .some(v => (v ?? '').toLowerCase().includes(q)),
    );
  }, [pedidos, search]);

  const porStatus = useMemo(() => {
    const map: Record<string, ComprasPedidoCard[]> = {};
    KANBAN_COLUNAS.forEach(c => { map[c.status] = []; });
    filtrados.forEach(p => { (map[p.status] ??= []).push(p); });
    Object.values(map).forEach(list => list.sort((a, b) => a.ordem - b.ordem));
    return map;
  }, [filtrados]);

  const activePedido = activeId ? pedidos.find(p => p.id === activeId) ?? null : null;

  // Mantém o diálogo sincronizado com os dados em tempo real.
  const detalheAtual = detalhe ? pedidos.find(p => p.id === detalhe.id) ?? detalhe : null;

  function handleDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  async function handleDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;

    const moved = pedidos.find(p => p.id === active.id);
    if (!moved) return;

    const overId = String(over.id);
    const destino: ComprasPedidoStatus = overId.startsWith('col:')
      ? (overId.slice(4) as ComprasPedidoStatus)
      : ((over.data.current?.status as ComprasPedidoStatus) ?? moved.status);

    const lista = (porStatus[destino] ?? []).filter(p => p.id !== moved.id);
    const overIndex = overId.startsWith('col:') ? lista.length : lista.findIndex(p => p.id === overId);
    const index = overIndex < 0 ? lista.length : overIndex;

    const antes = lista[index - 1]?.ordem;
    const depois = lista[index]?.ordem;
    let novaOrdem: number;
    if (antes === undefined && depois === undefined) novaOrdem = 0;
    else if (antes === undefined) novaOrdem = (depois as number) - 1;
    else if (depois === undefined) novaOrdem = antes + 1;
    else novaOrdem = (antes + depois) / 2;

    if (destino === moved.status && novaOrdem === moved.ordem) return;

    try {
      await updatePedido.mutateAsync({ id: moved.id, patch: { status: destino, ordem: novaOrdem } });
    } catch (err) {
      toast.error(`Não foi possível mover o pedido: ${(err as Error).message}`);
    }
  }

  return (
    <PageShell>
      <PageHeader
        title="Acompanhamentos"
        subtitle="Quadro kanban dos pedidos de compra — arraste para mudar o status"
      />

      <div className="flex items-center gap-2">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por número, fornecedor ou título..."
          className="max-w-sm"
        />
        {isLoading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" aria-hidden />}
      </div>

      {isError ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          Erro ao carregar pedidos: {(error as Error)?.message ?? 'desconhecido'}
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={() => setActiveId(null)}
        >
          <div className="flex gap-3 overflow-x-auto pb-4 -mx-3 px-3 sm:mx-0 sm:px-0">
            {KANBAN_COLUNAS.map((col) => (
              <KanbanColumn
                key={col.status}
                status={col.status}
                label={col.label}
                pedidos={porStatus[col.status] ?? []}
                onOpen={(p) => setDetalhe(p)}
              />
            ))}
          </div>

          <DragOverlay>
            {activePedido && (
              <div className="w-[264px] rotate-1">
                <PedidoCardContent pedido={activePedido} onOpen={() => {}} dragging />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}

      {!isLoading && filtrados.length === 0 && (
        <p className="text-sm text-muted-foreground inline-flex items-center gap-2">
          <MessageSquare className="w-4 h-4 opacity-50" aria-hidden />
          Nenhum pedido em acompanhamento.
        </p>
      )}

      <PedidoDetailDialog
        pedido={detalheAtual}
        open={!!detalhe}
        onOpenChange={(v) => { if (!v) setDetalhe(null); }}
      />
    </PageShell>
  );
}
