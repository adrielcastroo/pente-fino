import { memo } from 'react';
import { Package, Link2, Unlink2, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { CarrierBadge } from './CarrierBadge';
import type { TrackingLink, TrackingStatus } from '@/types/tracking';

const STATUS_BADGE: Record<TrackingStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pendente:    { label: 'Pendente',    variant: 'secondary' },
  pagamento:   { label: 'Pagamento',   variant: 'default' },
  preparacao:  { label: 'Preparação',  variant: 'default' },
  despachado:  { label: 'Despachado',  variant: 'default' },
  em_transito: { label: 'Em Trânsito', variant: 'default' },
  entregue:    { label: 'Entregue',    variant: 'default' },
  erro:        { label: 'Erro',        variant: 'destructive' },
  devolvido:   { label: 'Devolvido',   variant: 'outline' },
};

const fmt = (iso: string) => new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

interface Props {
  links: TrackingLink[];
  onDetail: (id: string) => void;
  onLink: (id: string) => void;
  onUnlink: (id: string) => void;
  onDelete: (id: string) => void;
}

export const RastreamentoHistoryList = memo(function RastreamentoHistoryList({ links, onDetail, onLink, onUnlink, onDelete }: Props) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Código</TableHead>
            <TableHead>Transportadora</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Último Evento</TableHead>
            <TableHead>Vinculado a</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {links.map((link) => (
            <TableRow key={link.id} className="hover:bg-muted/40">
              <TableCell className="font-mono text-sm">{link.trackingCode}</TableCell>
              <TableCell><CarrierBadge carrierCode={link.carrier} /></TableCell>
              <TableCell>
                <Badge variant={STATUS_BADGE[link.status]?.variant || 'secondary'}>
                  {STATUS_BADGE[link.status]?.label || link.status}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground max-w-xs">
                {link.lastEvent ? (
                  <div className="truncate">
                    <div className="truncate">{link.lastEvent.description}</div>
                    <div className="text-xs">{fmt(link.lastEvent.timestamp)}</div>
                  </div>
                ) : '—'}
              </TableCell>
              <TableCell>
                {link.linkedType ? (
                  <span className="text-xs font-medium uppercase">{link.linkedType.replace('_', ' ')}</span>
                ) : (
                  <span className="text-muted-foreground text-xs">—</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => onDetail(link.id)}>
                        <Package className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Ver detalhes</TooltipContent>
                  </Tooltip>
                  {link.linkedType ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => onUnlink(link.id)} className="text-muted-foreground hover:text-destructive">
                          <Unlink2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Desvincular</TooltipContent>
                    </Tooltip>
                  ) : (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => onLink(link.id)}>
                          <Link2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Vincular ao ERP</TooltipContent>
                    </Tooltip>
                  )}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => onDelete(link.id)} className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Excluir</TooltipContent>
                  </Tooltip>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
});

RastreamentoHistoryList.displayName = 'RastreamentoHistoryList';
