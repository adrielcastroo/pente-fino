import React, { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface RomaneioPecaGrande {
  id: string;
  cd_pedido: string;
  nr_pedido: string;
  cliente: string;
  produto: string;
  comprimento_m: number;
  observacao: string | null;
}

interface RomaneioDia {
  id: string;
  data_romaneio: string;
  titulo: string;
  status: string;
  pecas_grandes?: RomaneioPecaGrande[];
}

export default function PecasGrandesView({ romaneio }: { romaneio: RomaneioDia | null }) {
  const pecas = useMemo(() => romaneio?.pecas_grandes || [], [romaneio]);

  if (!pecas || pecas.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Peças > 4 metros</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Nenhuma peça com comprimento superior a 4 metros encontrada neste romaneio.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Peças > 4 metros ({pecas.length} itens)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-auto max-h-[400px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pedido</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Comprimento (m)</TableHead>
                <TableHead>Observação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pecas.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono">{p.nr_pedido || p.cd_pedido}</TableCell>
                  <TableCell>{p.cliente}</TableCell>
                  <TableCell>{p.produto}</TableCell>
                  <TableCell className="font-semibold text-right">{p.comprimento_m.toFixed(2)}</TableCell>
                  <TableCell>{p.observacao || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="mt-4 flex justify-end">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              // Export CSV logic could go here
              const csv = pecas.map(p => `${p.nr_pedido},${p.cliente},${p.comprimento_m},${p.observacao}`).join('\n');
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `pecas_4m_${romaneio?.titulo || 'romaneio'}.csv`;
              a.click();
            }}
          >
            Exportar CSV
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
