import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Sparkles, FileText, Truck, Webhook, Mail, Database, Building2,
  ShieldAlert, LineChart, Zap, Clock, CheckCircle2, XCircle, AlertCircle, ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';

interface Integration {
  id: string; key: string; name: string; category: string;
  enabled: boolean; status: string; is_coming_soon: boolean;
  config: any; last_checked_at: string | null; last_error: string | null; notes: string | null;
}

const ICON: Record<string, any> = {
  ai_vision: Sparkles, nfe_sefaz: FileText, nfe_meudanfe: FileText, nfe_import: FileText,
  seurastreio: Truck, n8n_webhook: Webhook, emails: Mail, sap_b1: Building2,
  auge_suite: Building2, external_db: Database, sentry: ShieldAlert, posthog: LineChart,
};

const CATEGORY_LABEL: Record<string, string> = {
  ai: 'IA', fiscal: 'Fiscal', logistica: 'Logística', automacao: 'Automação',
  comunicacao: 'Comunicação', erp: 'ERP', infra: 'Infraestrutura', observabilidade: 'Observabilidade',
};

export default function IntegrationsTab() {
  const { isAdmin } = useAuth();
  const qc = useQueryClient();

  const { data: items, isLoading } = useQuery({
    queryKey: ['integrations'],
    queryFn: async () => {
      const { data, error } = await (supabase.from('integrations' as any)
        .select('*').order('is_coming_soon').order('category').order('name') as any);
      if (error) throw error;
      return (data ?? []) as Integration[];
    },
  });

  const toggle = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await (supabase.from('integrations' as any)
        .update({ enabled, status: enabled ? 'active' : 'disabled' }).eq('id', id) as any);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Integração atualizada');
      qc.invalidateQueries({ queryKey: ['integrations'] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (isLoading) {
    return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40" />)}
    </div>;
  }

  const grouped = (items ?? []).reduce((acc: Record<string, Integration[]>, it) => {
    (acc[it.category] ??= []).push(it);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <Card className="p-4 border-primary/30 bg-primary/5">
        <div className="flex items-start gap-3 text-xs">
          <ShieldAlert className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-foreground">Kill switch global de integrações</p>
              <Button variant="link" size="sm" className="h-auto p-0 text-primary text-[10px]" asChild>
                <a href="/admin/auge-sync-status" className="flex items-center gap-1">
                  Ver status de sincronização <ChevronRight className="h-3 w-3" />
                </a>
              </Button>
            </div>
            <p className="text-muted-foreground">
              Ao desativar uma integração aqui, ela para de responder em todo o app imediatamente.
              Use nossos <code className="text-[10px]">useFeatureFlag()</code> ou consulte
              <code className="text-[10px]"> integrations.enabled</code> antes de fazer chamadas.
            </p>
          </div>
        </div>
      </Card>

      {Object.entries(grouped).map(([cat, list]) => (
        <div key={cat} className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {CATEGORY_LABEL[cat] ?? cat}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {list.map((it) => {
              const Icon = ICON[it.key] ?? Zap;
              const disabled = !isAdmin || it.is_coming_soon;
              return (
                <Card key={it.id} className={`p-4 ${it.is_coming_soon ? 'opacity-70' : ''}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="h-9 w-9 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">{it.name}</p>
                        <StatusBadge status={it.status} coming={it.is_coming_soon} />
                      </div>
                    </div>
                    <Switch
                      checked={it.enabled && !it.is_coming_soon}
                      disabled={disabled || toggle.isPending}
                      onCheckedChange={(v) => toggle.mutate({ id: it.id, enabled: v })}
                    />
                  </div>

                  {it.notes && <p className="text-xs text-muted-foreground mt-2">{it.notes}</p>}

                  {it.last_checked_at && (
                    <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Última verificação: {new Date(it.last_checked_at).toLocaleString('pt-BR')}
                    </p>
                  )}

                  {it.last_error && (
                    <p className="text-[10px] text-destructive mt-1 truncate" title={it.last_error}>
                      Erro: {it.last_error}
                    </p>
                  )}

                  {it.is_coming_soon && isAdmin && (
                    <Button size="sm" variant="outline" className="w-full mt-3 h-8 text-xs"
                      onClick={() => toast.info('Formulário de credenciais será liberado quando a integração for implementada.')}>
                      Configurar credenciais
                    </Button>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function StatusBadge({ status, coming }: { status: string; coming: boolean }) {
  if (coming) return <Badge variant="outline" className="text-[9px] mt-0.5">Em breve</Badge>;
  const map: Record<string, { icon: any; cls: string; label: string }> = {
    active: { icon: CheckCircle2, cls: 'text-success dark:text-success', label: 'Ativa' },
    disabled: { icon: XCircle, cls: 'text-muted-foreground', label: 'Desativada' },
    error: { icon: AlertCircle, cls: 'text-destructive', label: 'Erro' },
    unknown: { icon: Clock, cls: 'text-muted-foreground', label: 'Sem verificação' },
    inactive: { icon: XCircle, cls: 'text-muted-foreground', label: 'Inativa' },
  };
  const s = map[status] ?? map.unknown;
  const Icon = s.icon;
  return (
    <span className={`text-[10px] flex items-center gap-1 mt-0.5 ${s.cls}`}>
      <Icon className="h-2.5 w-2.5" /> {s.label}
    </span>
  );
}
