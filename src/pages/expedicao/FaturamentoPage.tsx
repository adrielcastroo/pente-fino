import { useMemo, useState } from 'react';
import { CheckCircle2, FileCheck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { usePickings, useFaturarPicking } from '@/hooks/expedicao/useExpedicaoData';
import { useAuth } from '@/hooks/use-auth';
import { Lock } from 'lucide-react';

export default function FaturamentoPage() {
  const { data, isLoading } = usePickings();
  const faturar = useFaturarPicking();
  const { can } = useAuth();
  const allowFaturar = can('expedicao:faturar');
  const [filter, setFilter] = useState('');

  const fila = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return (data ?? [])
      .filter(p => p.status === 'conferido')
      .filter(p => !q || p.numero.toLowerCase().includes(q) || p.cliente.toLowerCase().includes(q));
  }, [data, filter]);

  const faturados = useMemo(() => (data ?? []).filter(p => p.status === 'faturado').slice(0, 20), [data]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Faturamento</h1>
          <p className="text-sm text-muted-foreground">
            Fila de pickings liberados · <span className="font-mono">{fila.length}</span> aguardando
          </p>
        </div>
        <Input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filtrar por número ou cliente"
          className="h-10 w-full md:w-72"
        />
      </header>

      <section className="rounded-lg border bg-card">
        <header className="flex items-center gap-2 border-b px-4 py-3 text-sm font-medium">
          <FileCheck className="size-4" /> Aguardando faturamento
        </header>
        {isLoading ? (
          <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Carregando…
          </div>
        ) : fila.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">Nenhum picking na fila.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Picking</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Transportadora</TableHead>
                <TableHead>Carrinho</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fila.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono">{p.numero}</TableCell>
                  <TableCell>{p.cliente}</TableCell>
                  <TableCell className="text-muted-foreground">{p.transportadora?.nome ?? '—'}</TableCell>
                  <TableCell className="font-mono text-muted-foreground">{p.carrinho?.codigo ?? '—'}</TableCell>
                  <TableCell className="text-right">
                    {allowFaturar ? (
                      <Button
                        size="sm"
                        disabled={faturar.isPending}
                        onClick={() => faturar.mutate(p.id)}
                      >
                        {faturar.isPending ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                        Faturar
                      </Button>
                    ) : (
                      <span
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground"
                        title="Requer perfil Supervisor ou superior"
                      >
                        <Lock className="size-3" /> Sem permissão
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>

      {faturados.length > 0 && (
        <section className="rounded-lg border bg-card">
          <header className="border-b px-4 py-3 text-sm font-medium">Últimos faturados</header>
          <ul className="divide-y">
            {faturados.map((p) => (
              <li key={p.id} className="flex items-center justify-between px-4 py-2 text-sm">
                <span className="font-mono">{p.numero}</span>
                <span className="text-muted-foreground">{p.cliente}</span>
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">faturado</Badge>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
