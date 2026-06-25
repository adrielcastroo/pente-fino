import { useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { useTransportadoras, useCreateTransportadora } from '@/hooks/expedicao/useExpedicaoData';

export default function ExpedicaoConfiguracoesPage() {
  const { data = [], isLoading } = useTransportadoras();
  const create = useCreateTransportadora();
  const [nome, setNome] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;
    await create.mutateAsync(nome);
    setNome('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Configurações da expedição</h1>
        <p className="text-sm text-muted-foreground mt-1">Transportadoras, SLAs e alertas.</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Transportadoras</h2>
        <form onSubmit={submit} className="flex gap-2 max-w-md">
          <Input
            placeholder="Nome da transportadora"
            value={nome}
            onChange={e => setNome(e.target.value)}
          />
          <Button type="submit" disabled={create.isPending} className="gap-2 shrink-0">
            <Plus className="w-4 h-4" /> Adicionar
          </Button>
        </form>

        <div className="bg-card border border-border rounded-md overflow-hidden">
          {isLoading ? (
            <div className="p-12 flex items-center justify-center text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          ) : data.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Nenhuma transportadora cadastrada.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Situação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map(t => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.nome}</TableCell>
                    <TableCell>
                      <Badge variant={t.ativo ? 'default' : 'secondary'}>
                        {t.ativo ? 'Ativa' : 'Inativa'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </section>
    </div>
  );
}
