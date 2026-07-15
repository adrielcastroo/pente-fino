import { memo } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { EtiquetaHistorico } from '@/types/etiquetas';

interface EtiquetaHistoricoTableProps {
  historico: EtiquetaHistorico[];
  isLoading?: boolean;
}

export const EtiquetaHistoricoTable = memo(function EtiquetaHistoricoTable({ historico, isLoading }: EtiquetaHistoricoTableProps) {
  if (isLoading) {
    return (
      <div className="p-6 text-center text-sm text-muted-foreground">Carregando histórico...</div>
    );
  }
  if (!historico.length) {
    return (
      <div className="p-6 text-center text-sm text-muted-foreground">Nenhuma impressão registrada.</div>
    );
  }
  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Etiqueta / NF</TableHead>
            <TableHead>Usuário</TableHead>
            <TableHead>Impressora</TableHead>
            <TableHead className="text-right">Qtd</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {historico.map((h) => {
            const nf = h.variaveis_usadas?.nf;
            const titulo = nf ? `NF ${nf}` : h.template_nome;
            return (
              <TableRow key={h.id}>
                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                  {format(new Date(h.criado_em), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </TableCell>
                <TableCell className="font-medium">{titulo}</TableCell>
                <TableCell>{h.usuario_nome ?? '—'}</TableCell>
                <TableCell>
                  {h.impressora ? <Badge variant="outline">{h.impressora}</Badge> : <span className="text-muted-foreground">—</span>}
                </TableCell>
                <TableCell className="text-right font-mono">{h.quantidade}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
});
EtiquetaHistoricoTable.displayName = 'EtiquetaHistoricoTable';
