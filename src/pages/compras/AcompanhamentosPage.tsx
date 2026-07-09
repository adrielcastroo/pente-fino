import { useMemo, useState } from 'react';
import { PackageSearch, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';
import { PageShell, PageHeader, StatCard } from '@/components/compras/ui';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

type PedidoStatus = 'pendente' | 'em_andamento' | 'recebido' | 'atrasado';

interface PedidoCompra {
  id: string;
  numero: string;
  fornecedor: string;
  previsao: string;
  status: PedidoStatus;
  itens: number;
}

// Placeholder — futura integração com backend
const MOCK: PedidoCompra[] = [];

const STATUS_LABEL: Record<PedidoStatus, string> = {
  pendente: 'Pendente',
  em_andamento: 'Em andamento',
  recebido: 'Recebido',
  atrasado: 'Atrasado',
};

const STATUS_VARIANT: Record<PedidoStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pendente: 'outline',
  em_andamento: 'secondary',
  recebido: 'default',
  atrasado: 'destructive',
};

export default function AcompanhamentosPage() {
  const [filter, setFilter] = useState('');

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return MOCK;
    return MOCK.filter(p =>
      p.numero.toLowerCase().includes(q) ||
      p.fornecedor.toLowerCase().includes(q),
    );
  }, [filter]);

  const kpis = useMemo(() => ({
    total: MOCK.length,
    pendentes: MOCK.filter(p => p.status === 'pendente').length,
    em_andamento: MOCK.filter(p => p.status === 'em_andamento').length,
    atrasados: MOCK.filter(p => p.status === 'atrasado').length,
  }), []);

  return (
    <PageShell>
      <PageHeader
        title="Acompanhamentos"
        subtitle="Pedidos de compra em curso e previsões de recebimento"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Total" value={kpis.total} icon={PackageSearch} />
        <StatCard label="Pendentes" value={kpis.pendentes} icon={Clock} variant="muted" />
        <StatCard label="Em andamento" value={kpis.em_andamento} icon={PackageSearch} variant="primary" />
        <StatCard label="Atrasados" value={kpis.atrasados} icon={AlertTriangle} variant="destructive" />
      </div>

      <div className="flex items-center gap-2">
        <Input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Buscar por número ou fornecedor..."
          className="max-w-sm"
        />
      </div>

      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Fornecedor</TableHead>
              <TableHead className="tabular-nums">Itens</TableHead>
              <TableHead>Previsão</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <CheckCircle2 className="w-8 h-8 opacity-40" />
                    <span className="text-sm">Nenhum pedido em acompanhamento no momento.</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.numero}</TableCell>
                  <TableCell>{p.fornecedor}</TableCell>
                  <TableCell className="tabular-nums">{p.itens}</TableCell>
                  <TableCell>{p.previsao}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[p.status]}>{STATUS_LABEL[p.status]}</Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </PageShell>
  );
}
