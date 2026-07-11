import { useState, useEffect, useMemo, useRef } from 'react';
import { Search, FileText, Truck, Package, ShoppingCart, CheckCircle2, Link2, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface EntityOption {
  id: string;
  label: string;
  subtitle?: string;
  badge?: string;
  type: string;
}

const ENTITY_TYPES = [
  { value: 'nota_fiscal',   label: 'Notas Fiscais',      icon: FileText,      color: 'bg-blue-500' },
  { value: 'romaneio',      label: 'Romaneios',          icon: Truck,         color: 'bg-green-500' },
  { value: 'conferencia',   label: 'Conferências',       icon: CheckCircle2,  color: 'bg-purple-500' },
  { value: 'reserva',       label: 'Reservas',           icon: Package,       color: 'bg-orange-500' },
  { value: 'pedido_compra', label: 'Pedidos de Compra',  icon: ShoppingCart,  color: 'bg-amber-500' },
] as const;

interface Props {
  open: boolean;
  onClose: () => void;
  trackingCode: string;
  onLink: (entityType: string, entityId: string) => void;
}

export function RastreamentoLinkDialog({ open, onClose, trackingCode, onLink }: Props) {
  const [activeTab, setActiveTab] = useState<string>(ENTITY_TYPES[0].value);
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<EntityOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<EntityOption | null>(null);

  const searchEntities = useMemo(
    () => async (type: string, query: string) => {
      setLoading(true);
      try {
        const q = query.trim();
        let data: EntityOption[] = [];

        if (type === 'nota_fiscal') {
          let sb = supabase.from('nfe_importadas').select('id, numero_nf, fornecedor_nome, valor_total, status').limit(20);
          if (q) sb = sb.ilike('numero_nf', `%${q}%`);
          const { data: rows } = await sb;
          data = (rows || []).map((r) => ({
            id: r.id, type,
            label: `NF ${r.numero_nf}`,
            subtitle: r.fornecedor_nome || undefined,
            badge: r.status || undefined,
          }));
        } else if (type === 'romaneio') {
          let sb = supabase.from('expedicao_romaneios').select('id, numero, motorista_nome, status').limit(20);
          if (q) sb = sb.ilike('numero', `%${q}%`);
          const { data: rows } = await sb;
          data = (rows || []).map((r) => ({
            id: r.id, type,
            label: `Romaneio ${r.numero}`,
            subtitle: r.motorista_nome || undefined,
            badge: r.status || undefined,
          }));
        } else if (type === 'conferencia') {
          let sb = supabase.from('conferences').select('id, processo, conferente, started_at, finished_at').limit(20);
          if (q) sb = sb.ilike('processo', `%${q}%`);
          const { data: rows } = await sb;
          data = (rows || []).map((r) => ({
            id: r.id, type,
            label: `Conf. ${r.processo || r.id.slice(0, 8)}`,
            subtitle: r.conferente || undefined,
            badge: r.finished_at ? 'finalizada' : 'em andamento',
          }));
        } else if (type === 'reserva') {
          let sb = supabase.from('independent_reservations').select('id, codigo_produto, descricao_produto, endereco, quantidade, status').limit(20);
          if (q) sb = sb.ilike('codigo_produto', `%${q}%`);
          const { data: rows } = await sb;
          data = (rows || []).map((r) => ({
            id: r.id, type,
            label: r.codigo_produto || 'Reserva',
            subtitle: r.descricao_produto || undefined,
            badge: r.endereco || r.status || undefined,
          }));
        } else if (type === 'pedido_compra') {
          let sb = supabase.from('compras_pedidos').select('id, numero_pedido, fornecedor, status').limit(20);
          if (q) sb = sb.ilike('numero_pedido', `%${q}%`);
          const { data: rows } = await sb;
          data = (rows || []).map((r) => ({
            id: r.id, type,
            label: `Pedido ${r.numero_pedido}`,
            subtitle: r.fornecedor || undefined,
            badge: r.status || undefined,
          }));
        }
        setResults(data);
      } catch (e) {
        console.error('Erro ao buscar entidades:', e);
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!open) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      void searchEntities(activeTab, searchQuery);
    }, 250);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [activeTab, searchQuery, open, searchEntities]);

  const handleLink = () => {
    if (selected) {
      onLink(selected.type, selected.id);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh]">
        <DialogHeader>
          <div className="flex items-center justify-between gap-2">
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              <span>Vincular Rastreamento</span>
              <Badge variant="outline"><code className="font-mono text-xs">{trackingCode}</code></Badge>
            </DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Fechar"><X className="h-4 w-4" /></Button>
          </div>
          <DialogDescription>Selecione uma entidade do ERP para vincular a este código de rastreio.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="flex flex-wrap gap-1 border-b border-border pb-2">
            {ENTITY_TYPES.map((t) => (
              <Button
                key={t.value}
                variant={activeTab === t.value ? 'default' : 'ghost'}
                size="sm"
                className="gap-1.5"
                onClick={() => { setActiveTab(t.value); setSearchQuery(''); setResults([]); setSelected(null); }}
              >
                <t.icon className="h-3.5 w-3.5" />
                {t.label}
              </Button>
            ))}
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={`Buscar ${ENTITY_TYPES.find((t) => t.value === activeTab)?.label.toLowerCase() || 'entidades'}…`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <ScrollArea className="h-64 rounded-md border border-border">
            {loading ? (
              <div className="flex items-center justify-center h-full py-16">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : results.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Search className="h-8 w-8 mb-2 opacity-50" />
                <p className="text-sm">Nenhum resultado</p>
                <p className="text-xs">Digite para buscar</p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {results.map((entity) => (
                  <button
                    type="button"
                    key={entity.id}
                    className={cn(
                      'w-full flex items-center gap-3 text-left px-3 py-2 rounded-md border transition-colors',
                      selected?.id === entity.id
                        ? 'bg-primary/10 border-primary'
                        : 'bg-card border-border hover:bg-muted',
                    )}
                    onClick={() => setSelected(entity)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{entity.label}</div>
                      {entity.subtitle && <div className="text-xs text-muted-foreground truncate">{entity.subtitle}</div>}
                    </div>
                    {entity.badge && <Badge variant="secondary" className="text-xs shrink-0">{entity.badge}</Badge>}
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleLink} disabled={!selected || loading}>
            <Link2 className="h-4 w-4 mr-2" /> Vincular
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
