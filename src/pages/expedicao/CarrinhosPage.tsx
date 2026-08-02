import { useState } from 'react';
import { Plus, Loader2, ShoppingCart } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { useCarrinhos, useCreateCarrinho, type CarrinhoStatus } from '@/hooks/expedicao/useExpedicaoData';
import { RequireRole } from '@/components/auth/RequireRole';
import { PageShell, PageHeader } from '@/components/expedicao/ui';
import { cn } from '@/lib/utils';

const STATUS: Record<CarrinhoStatus, { label: string; cls: string }> = {
  livre:       { label: 'Livre',       cls: 'bg-success/15 text-success' },
  em_uso:      { label: 'Em uso',      cls: 'bg-warning/15 text-warning' },
  manutencao:  { label: 'Manutenção',  cls: 'bg-destructive/15 text-destructive' },
};

export default function CarrinhosPage() {
  const { data = [], isLoading } = useCarrinhos();
  const create = useCreateCarrinho();
  const [codigo, setCodigo] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codigo.trim()) return;
    await create.mutateAsync(codigo);
    setCodigo('');
  };

  return (
    <PageShell>
      <PageHeader title="Carrinhos" subtitle="Gestão dos carrinhos da expedição." />

      <RequireRole
        action="expedicao:manage-cadastros"
        fallback={
          <p className="text-xs text-muted-foreground italic">
            Somente Supervisor+ pode cadastrar carrinhos.
          </p>
        }
      >
        <form onSubmit={submit} className="flex gap-2 max-w-md">
          <Input
            placeholder="Código do carrinho (ex: C001)"
            value={codigo}
            onChange={e => setCodigo(e.target.value)}
          />
          <Button type="submit" disabled={create.isPending} className="gap-2 shrink-0">
            <Plus className="w-4 h-4" /> Adicionar
          </Button>
        </form>
      </RequireRole>

      <div className="bg-card border border-border rounded-md overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex items-center justify-center text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : data.length === 0 ? (
          <EmptyState
            icon={ShoppingCart}
            title="Nenhum carrinho cadastrado"
            description="Cadastre os carrinhos usados na expedição para começar a alocar peças conferidas."
          />
        ) : (
          <>
            {/* Mobile: grid de cards */}
            <ul className="md:hidden grid grid-cols-2 gap-2 p-3">
              {data.map(c => {
                const s = STATUS[c.status];
                return (
                  <li
                    key={c.id}
                    className="flex flex-col items-start gap-1 rounded-md border border-border/60 bg-background p-3 min-h-[64px]"
                  >
                    <span className="font-mono text-sm font-semibold">{c.codigo}</span>
                    <span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium', s.cls)}>
                      {s.label}
                    </span>
                  </li>
                );
              })}
            </ul>

            {/* Desktop: tabela */}
            <Table className="hidden md:table">
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map(c => {
                  const s = STATUS[c.status];
                  return (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono">{c.codigo}</TableCell>
                      <TableCell>
                        <span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium', s.cls)}>
                          {s.label}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </>
        )}
      </div>
    </PageShell>
  );
}
