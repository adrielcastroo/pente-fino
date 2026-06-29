import { useState } from 'react';
import { Plus, Loader2, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { useTransportadoras, useCreateTransportadora } from '@/hooks/expedicao/useExpedicaoData';
import { RequireRole } from '@/components/auth/RequireRole';
import { getAppsScriptWebhook, setAppsScriptWebhook } from '@/lib/expedicao-webhook';

export default function ExpedicaoConfiguracoesPage() {
  const { data = [], isLoading } = useTransportadoras();
  const create = useCreateTransportadora();
  const [nome, setNome] = useState('');
  const [webhook, setWebhook] = useState(getAppsScriptWebhook());

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
        <RequireRole
          action="expedicao:manage-cadastros"
          fallback={
            <p className="text-xs text-muted-foreground italic">
              Somente Supervisor+ pode cadastrar transportadoras.
            </p>
          }
        >
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
        </RequireRole>



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

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Mail className="size-4 text-muted-foreground" /> Webhook de e-mail (Google Apps Script)
        </h2>
        <p className="text-xs text-muted-foreground max-w-2xl">
          Cole aqui a URL pública de um Apps Script publicado como Web App. Será usado para
          enviar romaneios por e-mail sem custo. Endpoint deve aceitar POST com JSON{' '}
          <code>{'{ to, subject, html }'}</code>.
        </p>
        <div className="flex gap-2 max-w-2xl">
          <Input
            placeholder="https://script.google.com/macros/s/.../exec"
            value={webhook}
            onChange={(e) => setWebhook(e.target.value)}
          />
          <Button
            type="button"
            onClick={() => {
              setAppsScriptWebhook(webhook);
              toast.success(webhook.trim() ? 'Webhook salvo' : 'Webhook removido');
            }}
            className="shrink-0"
          >
            Salvar
          </Button>
        </div>
      </section>
    </div>
  );
}
