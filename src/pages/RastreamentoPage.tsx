import { useState, useMemo, useCallback } from 'react';
import { Package, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { TooltipProvider } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import {
  useTrackingLinks,
  useSyncTracking,
  useLinkTracking,
  useUnlinkTracking,
  useDeleteTracking,
} from '@/hooks/useTracking';
import { RastreamentoForm } from '@/components/rastreamento/RastreamentoForm';
import { RastreamentoTimeline } from '@/components/rastreamento/RastreamentoTimeline';
import { RastreamentoProgress } from '@/components/rastreamento/RastreamentoProgress';
import { RastreamentoHistoryList } from '@/components/rastreamento/RastreamentoHistoryList';
import { RastreamentoLinkDialog } from '@/components/rastreamento/RastreamentoLinkDialog';
import { CarrierBadge } from '@/components/rastreamento/CarrierBadge';
import { MelhorEnvioConnectButton } from '@/components/rastreamento/MelhorEnvioConnectButton';
import type { TrackingStatus } from '@/types/tracking';

const STATUS_LABELS: Record<TrackingStatus, string> = {
  pendente: 'Pendente',
  pagamento: 'Pagamento',
  preparacao: 'Preparação',
  despachado: 'Despachado',
  em_transito: 'Em Trânsito',
  entregue: 'Entregue',
  erro: 'Erro',
  devolvido: 'Devolvido',
};

const fmt = (iso: string) => new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

export default function RastreamentoPage() {
  useDocumentTitle('Rastreamento');

  const syncMutation = useSyncTracking();
  const linkMutation = useLinkTracking();
  const unlinkMutation = useUnlinkTracking();
  const deleteMutation = useDeleteTracking();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<TrackingStatus | 'all'>('all');
  const [carrierFilter, setCarrierFilter] = useState<string>('all');
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);

  const { data: links, isLoading, refetch } = useTrackingLinks({
    status: statusFilter !== 'all' ? statusFilter : undefined,
    carrier: carrierFilter !== 'all' ? carrierFilter : undefined,
  });

  const handleTrack = useCallback(
    async (code: string, carrier?: string) => {
      try {
        await syncMutation.mutateAsync({ code, carrier });
        toast.success('Rastreamento atualizado');
      } catch (e) {
        toast.error((e as Error).message || 'Erro ao rastrear');
      }
    },
    [syncMutation],
  );

  const filteredLinks = useMemo(() => {
    if (!links) return [];
    const q = search.trim().toLowerCase();
    if (!q) return links;
    return links.filter(
      (l) =>
        l.trackingCode.toLowerCase().includes(q) ||
        l.carrier.toLowerCase().includes(q) ||
        (l.linkedType || '').toLowerCase().includes(q),
    );
  }, [links, search]);

  const availableCarriers = useMemo(
    () => [...new Set((links || []).map((l) => l.carrier))].sort(),
    [links],
  );

  const selectedLink = selectedId ? (links || []).find((l) => l.id === selectedId) : null;

  const kpis = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return {
      total: links?.length || 0,
      transito: links?.filter((l) => l.status === 'em_transito').length || 0,
      entregues: links?.filter((l) => l.status === 'entregue' && l.updatedAt.startsWith(today)).length || 0,
      erros: links?.filter((l) => l.status === 'erro' || l.status === 'devolvido').length || 0,
    };
  }, [links]);

  return (
    <TooltipProvider>
      <div className="p-4 sm:p-6 space-y-5">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Rastreamento de Encomendas</h1>
            <p className="text-sm text-muted-foreground">
              Consulte e vincule códigos de rastreio a notas, romaneios, conferências, reservas e pedidos.
            </p>
          </div>
          <MelhorEnvioConnectButton />
        </header>

        <Card>
          <CardContent className="space-y-4 pt-6">
            <RastreamentoForm onSubmit={handleTrack} />

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              {[
                { id: 'total', label: 'Total Rastreados', value: kpis.total, color: '' },
                { id: 'transito', label: 'Em Trânsito', value: kpis.transito, color: 'text-emerald-600' },
                { id: 'entregues', label: 'Entregues Hoje', value: kpis.entregues, color: 'text-emerald-700' },
                { id: 'erros', label: 'Com Erro', value: kpis.erros, color: 'text-red-600' },
              ].map((k) => (
                <div key={k.id} className="rounded-md border border-border bg-card/50 p-4">
                  <div className={cn('text-2xl sm:text-3xl font-semibold tabular-nums leading-none', k.color)}>{k.value}</div>
                  <p className="mt-1 text-xs font-medium text-muted-foreground">{k.label}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <Input
                placeholder="Buscar código, transportadora…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-xs"
              />
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as TrackingStatus | 'all')}>
                <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos status</SelectItem>
                  {(Object.keys(STATUS_LABELS) as TrackingStatus[]).map((k) => (
                    <SelectItem key={k} value={k}>{STATUS_LABELS[k]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={carrierFilter} onValueChange={setCarrierFilter}>
                <SelectTrigger className="w-48"><SelectValue placeholder="Transportadora" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas transportadoras</SelectItem>
                  {availableCarriers.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
                <Loader2 className={cn('h-4 w-4 mr-2', isLoading && 'animate-spin')} />
                Atualizar
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Histórico de Rastreamentos</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-14 bg-muted rounded animate-pulse" />
                ))}
              </div>
            ) : filteredLinks.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <h3 className="text-lg font-medium">Nenhum rastreamento encontrado</h3>
                <p className="text-sm text-muted-foreground">Digite um código acima para começar.</p>
              </div>
            ) : (
              <RastreamentoHistoryList
                links={filteredLinks}
                onDetail={(id) => { setSelectedId(id); setDetailOpen(true); }}
                onLink={(id) => { setSelectedId(id); setLinkDialogOpen(true); }}
                onUnlink={(id) => unlinkMutation.mutate(id)}
                onDelete={(id) => {
                  if (confirm('Excluir este rastreamento?')) deleteMutation.mutate(id);
                }}
              />
            )}
          </CardContent>
        </Card>

        <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            {selectedLink && (
              <>
                <DialogHeader>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <DialogTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      <code className="font-mono text-base">{selectedLink.trackingCode}</code>
                      <CarrierBadge carrierCode={selectedLink.carrier} />
                    </DialogTitle>
                    <Badge>{STATUS_LABELS[selectedLink.status]}</Badge>
                  </div>
                  <DialogDescription>
                    Última atualização: {fmt(selectedLink.updatedAt)}
                    {selectedLink.linkedType && (
                      <span className="ml-2 text-muted-foreground">
                        • Vinculado a {selectedLink.linkedType.replace('_', ' ').toUpperCase()}
                      </span>
                    )}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <RastreamentoProgress status={selectedLink.status} events={selectedLink.events} />
                  <RastreamentoTimeline
                    events={selectedLink.events}
                    currentStatus={selectedLink.status}
                    carrierCode={selectedLink.carrier}
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => { setLinkDialogOpen(true); setDetailOpen(false); }}>
                    Vincular ao ERP
                  </Button>
                  <Button onClick={() => handleTrack(selectedLink.trackingCode, selectedLink.carrier)}>
                    Atualizar
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>

        <RastreamentoLinkDialog
          open={linkDialogOpen}
          onClose={() => setLinkDialogOpen(false)}
          trackingCode={selectedLink?.trackingCode || ''}
          onLink={(type, id) => {
            if (!selectedId) return;
            linkMutation.mutate(
              { id: selectedId, type, entityId: id },
              {
                onSuccess: () => toast.success('Rastreamento vinculado'),
                onError: (e) => toast.error((e as Error).message),
              },
            );
          }}
        />
      </div>
    </TooltipProvider>
  );
}
