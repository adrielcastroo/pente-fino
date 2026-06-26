import { useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';
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
          <div className="p-8 text-center text-sm text-muted-foreground">
            Nenhum carrinho cadastrado.
          </div>
        ) : (
          <Table>
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
                      <Badge variant="outline" className={`${s.cls} border-transparent`}>{s.label}</Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
