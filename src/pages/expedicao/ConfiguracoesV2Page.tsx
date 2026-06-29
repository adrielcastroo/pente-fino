import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings as SettingsIcon, Truck, Mail, Inbox, ShieldCheck, Bell,
  Plus, Loader2, Copy, ChevronRight, Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useTransportadoras, useCreateTransportadora } from '@/hooks/expedicao/useExpedicaoData';
import { RequireRole } from '@/components/auth/RequireRole';
import { getAppsScriptWebhook, setAppsScriptWebhook } from '@/lib/expedicao-webhook';

type Category = { id: string; name: string; icon: any; description: string };

const GROUPS: { id: string; label: string; items: Category[] }[] = [
  {
    id: 'operacao',
    label: 'Operação',
    items: [
      { id: 'transportadoras', name: 'Transportadoras', icon: Truck, description: 'Cadastro de parceiros de entrega.' },
      { id: 'sla',             name: 'SLAs e alertas', icon: Bell,   description: 'Tempos e notificações da expedição.' },
    ],
  },
  {
    id: 'integracoes',
    label: 'Integrações',
    items: [
      { id: 'email',  name: 'Webhook de e-mail', icon: Mail,  description: 'Apps Script para envio de romaneios.' },
      { id: 'nfe',    name: 'Importação de NF-e', icon: Inbox, description: 'Endpoint do Apps Script de XMLs.' },
    ],
  },
  {
    id: 'seguranca',
    label: 'Segurança',
    items: [
      { id: 'permissoes', name: 'Permissões', icon: ShieldCheck, description: 'Quem pode operar e configurar.' },
    ],
  },
];

const ALL = GROUPS.flatMap((g) => g.items);

export default function ExpedicaoConfiguracoesV2Page() {
  useDocumentTitle('Configurações da Expedição');
  const [activeId, setActiveId] = useState<string>('transportadoras');
  const active = useMemo(() => ALL.find((c) => c.id === activeId) ?? ALL[0], [activeId]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
      {/* Sidebar */}
      <aside className="lg:sticky lg:top-4 lg:self-start space-y-4">
        <div className="flex items-center gap-2 px-1">
          <SettingsIcon className="size-4 text-primary" />
          <h1 className="text-base font-semibold text-foreground">Configurações</h1>
        </div>

        <nav className="space-y-4">
          {GROUPS.map((group) => (
            <div key={group.id} className="space-y-1">
              <p className="px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {group.label}
              </p>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeId === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveId(item.id)}
                    className={cn(
                      'w-full flex items-center gap-2 rounded-md px-2.5 py-2 text-sm transition-colors',
                      'hover:bg-muted/60 text-muted-foreground',
                      isActive && 'bg-primary/10 text-foreground font-medium',
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    <span className="flex-1 text-left truncate">{item.name}</span>
                    {isActive && <ChevronRight className="size-3.5 text-primary" />}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>

      {/* Content */}
      <main className="min-w-0">
        <Card className="border-border">
          <CardHeader className="border-b border-border">
            <CardTitle className="flex items-center gap-2 text-base">
              <active.icon className="size-4 text-primary" />
              {active.name}
            </CardTitle>
            <CardDescription>{active.description}</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeId}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                {activeId === 'transportadoras' && <TransportadorasSection />}
                {activeId === 'sla' && <SlaSection />}
                {activeId === 'email' && <EmailWebhookSection />}
                {activeId === 'nfe' && <NfeImportSection />}
                {activeId === 'permissoes' && <PermissoesSection />}
              </motion.div>
            </AnimatePresence>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

/* ------------------- Sections ------------------- */

function TransportadorasSection() {
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
    <div className="space-y-4">
      <RequireRole
        action="expedicao:manage-cadastros"
        fallback={<p className="text-xs text-muted-foreground italic">Somente Supervisor+ pode cadastrar transportadoras.</p>}
      >
        <form onSubmit={submit} className="flex gap-2 max-w-md">
          <Input placeholder="Nome da transportadora" value={nome} onChange={(e) => setNome(e.target.value)} />
          <Button type="submit" disabled={create.isPending} className="gap-2 shrink-0">
            <Plus className="size-4" /> Adicionar
          </Button>
        </form>
      </RequireRole>

      <div className="bg-card border border-border rounded-md overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex items-center justify-center text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
          </div>
        ) : data.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Nenhuma transportadora cadastrada.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Situação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.nome}</TableCell>
                  <TableCell>
                    <Badge variant={t.ativo ? 'default' : 'secondary'}>{t.ativo ? 'Ativa' : 'Inativa'}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}

function SlaSection() {
  const [alertaAtraso, setAlertaAtraso] = useState(true);
  const [horasLimite, setHorasLimite] = useState(localStorage.getItem('exp_sla_horas') || '24');
  return (
    <div className="space-y-6 max-w-xl">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Alertar pickings atrasados</p>
          <p className="text-xs text-muted-foreground">Mostra badge vermelho no painel ao passar do SLA.</p>
        </div>
        <Switch checked={alertaAtraso} onCheckedChange={setAlertaAtraso} />
      </div>
      <Separator />
      <div className="space-y-2">
        <label className="text-sm font-medium">Tempo limite (horas)</label>
        <Input
          type="number" min={1} className="max-w-[160px]"
          value={horasLimite}
          onChange={(e) => setHorasLimite(e.target.value)}
          onBlur={() => { localStorage.setItem('exp_sla_horas', horasLimite); toast.success('SLA salvo'); }}
        />
      </div>
    </div>
  );
}

function EmailWebhookSection() {
  const [webhook, setWebhook] = useState(getAppsScriptWebhook());
  return (
    <div className="space-y-3 max-w-2xl">
      <p className="text-xs text-muted-foreground">
        URL pública de um Apps Script publicado como Web App. Body esperado:{' '}
        <code>{'{ to, subject, html }'}</code>.
      </p>
      <div className="flex gap-2">
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
          <Check className="size-4 mr-1" /> Salvar
        </Button>
      </div>
    </div>
  );
}

function NfeImportSection() {
  const endpoint = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/nfe-import`;
  return (
    <div className="space-y-3 max-w-2xl">
      <p className="text-xs text-muted-foreground">
        Apps Script monitora label do Gmail, extrai XMLs e envia para o endpoint abaixo.
        Cada NF-e é deduplicada pela chave de acesso e aparece em <strong>Faturamento</strong>.
      </p>
      <div className="rounded-md border border-border bg-muted/30 p-3 space-y-2">
        <div className="flex items-center gap-2">
          <code className="flex-1 text-xs break-all">{endpoint}</code>
          <Button
            type="button" variant="ghost" size="sm" className="shrink-0"
            onClick={() => { navigator.clipboard.writeText(endpoint); toast.success('Endpoint copiado'); }}
          >
            <Copy className="size-3.5" />
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Header <code>X-Import-Token</code> · Body <code>{'{ xmls: string[] }'}</code> ·
          Script em <code>docs/apps-script-nfe-import.gs</code>.
        </p>
      </div>
    </div>
  );
}

function PermissoesSection() {
  return (
    <ul className="space-y-2 text-sm">
      {[
        ['Operador', 'Bipa, monta pickings e gera romaneios.'],
        ['Supervisor', 'Cadastra transportadoras, edita SLAs e importa NF-e.'],
        ['Gerente', 'Acesso total a dashboards e relatórios.'],
        ['Admin', 'Configura integrações e webhook.'],
      ].map(([role, desc]) => (
        <li key={role} className="flex items-start gap-3 rounded-md border border-border p-3">
          <Badge variant="secondary" className="shrink-0">{role}</Badge>
          <span className="text-muted-foreground">{desc}</span>
        </li>
      ))}
    </ul>
  );
}
