import { useCallback, useEffect, useState } from 'react';
import {
  checkHealth, listExecutions, getExecutionDetail, diagnose,
  getN8nBaseUrl, setN8nBaseUrl, getN8nApiKey, setN8nApiKey,
  getRecordedPayloads, retryPayload, clearRecordedPayloads,
  type N8nHealth, type N8nExecution, type Diagnosis, type LastPayload,
} from '@/services/n8nApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Activity, AlertTriangle, CheckCircle2, Info, RefreshCw,
  Send, Trash2, ExternalLink, XCircle, Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { N8nEtiquetaTester } from '@/components/admin/N8nEtiquetaTester';


const POLL_MS = 15_000;

const statusStyle: Record<string, string> = {
  success: 'bg-green-500/15 text-success border-green-500/30',
  error: 'bg-red-500/15 text-destructive border-red-500/30',
  crashed: 'bg-red-500/15 text-destructive border-red-500/30',
  running: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  waiting: 'bg-yellow-500/15 text-warning border-yellow-500/30',
  canceled: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
};

export default function N8nMonitorPage() {
  const [baseUrl, setBaseUrl] = useState(getN8nBaseUrl());
  const [apiKey, setApiKey] = useState(getN8nApiKey());
  const [webhookOverride, setWebhookOverride] = useState(
    typeof localStorage !== 'undefined' ? (localStorage.getItem('n8n_webhook_url') || '') : ''
  );
  const [health, setHealth] = useState<N8nHealth | null>(null);
  const [executions, setExecutions] = useState<N8nExecution[]>([]);
  const [diagnostics, setDiagnostics] = useState<Diagnosis[]>([]);
  const [payloads, setPayloads] = useState<LastPayload[]>(getRecordedPayloads());
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<(N8nExecution & { errorMessage?: string; errorNode?: string }) | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const h = await checkHealth();
      setHealth(h);
      let execs: N8nExecution[] = [];
      if (h.online && h.authenticated) {
        try {
          execs = await listExecutions({ limit: 20 });
          // Enriquecer últimos 5 erros com detalhes
          const errIds = execs.filter((e) => e.status === 'error' || e.status === 'crashed').slice(0, 5);
          const details = await Promise.all(errIds.map((e) => getExecutionDetail(e.id).catch(() => null)));
          for (const d of details) {
            if (!d) continue;
            const target = execs.find((e) => e.id === d.id);
            if (target) {
              target.errorMessage = d.errorMessage;
              target.errorNode = d.errorNode;
            }
          }
        } catch (e: any) {
          toast.error('Erro ao listar execuções: ' + e.message);
        }
      }
      setExecutions(execs);
      setDiagnostics(diagnose(h, execs));
      setPayloads(getRecordedPayloads());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, POLL_MS);
    return () => clearInterval(t);
  }, [refresh]);

  const saveConfig = () => {
    setN8nBaseUrl(baseUrl);
    setN8nApiKey(apiKey);
    if (webhookOverride.trim()) localStorage.setItem('n8n_webhook_url', webhookOverride.trim());
    else localStorage.removeItem('n8n_webhook_url');
    toast.success('Configuração salva');
    refresh();
  };

  const handleRetry = async (id: string) => {
    const r = await retryPayload(id);
    if (r.ok) toast.success('Payload reenviado com sucesso');
    else toast.error('Falha ao reenviar: ' + (r.error || `HTTP ${r.status}`));
    setPayloads(getRecordedPayloads());
    setTimeout(refresh, 1500);
  };

  const openDetail = async (exec: N8nExecution) => {
    setSelected(exec);
    setDetailLoading(true);
    try {
      const d = await getExecutionDetail(exec.id);
      setSelected({ ...exec, errorMessage: d.errorMessage, errorNode: d.errorNode });
    } catch (e: any) {
      toast.error('Erro ao carregar detalhes: ' + e.message);
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            Monitor n8n
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Diagnóstico e monitoramento da integração com o n8n local
          </p>
        </div>
        <Button onClick={refresh} disabled={loading} variant="outline" size="sm">
          <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
          Atualizar
        </Button>
      </div>

      {/* Configuração */}
      <Card className="p-4 space-y-3">
        <h2 className="font-semibold text-sm">Configuração</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">URL do n8n (API)</Label>
            <Input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder="https://seu-tunel.trycloudflare.com" />
            <p className="text-[10px] text-muted-foreground mt-1">
              Se rodar no preview HTTPS, precisa ser URL pública (ex.: túnel Cloudflare/ngrok).
            </p>
          </div>
          <div>
            <Label className="text-xs">API Key (n8n → Settings → n8n API)</Label>
            <Input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="Cole a API key aqui" />
          </div>
          <div className="md:col-span-2">
            <Label className="text-xs">URL do webhook de impressão (opcional)</Label>
            <Input
              value={webhookOverride}
              onChange={(e) => setWebhookOverride(e.target.value)}
              placeholder="Se vazio, usa {URL do n8n}/webhook/imprimir-etiqueta"
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              Sobrescreve a URL usada pelas etiquetas. Deixe vazio para derivar da URL do n8n.
            </p>
          </div>
        </div>
        <Button size="sm" onClick={saveConfig}>Salvar e testar</Button>
      </Card>

      {/* Testador de etiquetas */}
      <N8nEtiquetaTester defaultUrl={webhookOverride} />



      {/* Status + Health */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <StatusCard
          label="n8n"
          value={health?.online ? 'Online' : 'Offline'}
          ok={!!health?.online}
          hint={health ? `${health.latencyMs}ms` : '—'}
        />
        <StatusCard
          label="API Key"
          value={health?.authenticated ? 'Válida' : (getN8nApiKey() ? 'Inválida' : 'Não configurada')}
          ok={!!health?.authenticated}
          hint={health?.version ? `v${health.version}` : '—'}
        />
        <StatusCard
          label="Últimas execuções"
          value={String(executions.length)}
          ok={executions.length > 0 && !executions.some((e) => e.status === 'error')}
          hint={`${executions.filter((e) => e.status === 'error' || e.status === 'crashed').length} com erro`}
        />
      </div>

      {/* Diagnóstico */}
      {diagnostics.length > 0 && (
        <Card className="p-4 space-y-3">
          <h2 className="font-semibold text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Diagnóstico automático
          </h2>
          <div className="space-y-2">
            {diagnostics.map((d, i) => (
              <div
                key={i}
                className={cn(
                  'p-3 rounded-md border text-sm',
                  d.level === 'ok' && 'bg-green-500/10 border-green-500/30',
                  d.level === 'warn' && 'bg-yellow-500/10 border-yellow-500/30',
                  d.level === 'error' && 'bg-red-500/10 border-red-500/30',
                )}
              >
                <div className="flex items-start gap-2">
                  {d.level === 'ok' && <CheckCircle2 className="h-4 w-4 text-success mt-0.5" />}
                  {d.level === 'warn' && <AlertTriangle className="h-4 w-4 text-warning mt-0.5" />}
                  {d.level === 'error' && <XCircle className="h-4 w-4 text-destructive mt-0.5" />}
                  <div className="flex-1">
                    <div className="font-semibold">{d.title}</div>
                    <div className="text-xs text-muted-foreground mt-1">{d.detail}</div>
                    <div className="text-xs mt-2 flex items-start gap-1">
                      <Info className="h-3 w-3 mt-0.5 shrink-0" />
                      <span>{d.suggestion}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Últimas execuções */}
      <Card className="p-4">
        <h2 className="font-semibold text-sm mb-3">Últimas execuções (n8n)</h2>
        {executions.length === 0 ? (
          <div className="text-xs text-muted-foreground py-8 text-center">
            {health?.authenticated ? 'Nenhuma execução ainda.' : 'Configure a API key para ver execuções.'}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {executions.map((e) => (
              <button
                key={e.id}
                onClick={() => openDetail(e)}
                className="w-full flex items-center gap-3 py-2 text-left hover:bg-muted/40 px-2 rounded"
              >
                <Badge className={cn('text-[10px] border', statusStyle[e.status] ?? 'bg-gray-500/15')}>
                  {e.status}
                </Badge>
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate">{e.workflowName || `Workflow ${e.workflowId}`}</div>
                  <div className="text-[10px] text-muted-foreground">
                    #{e.id} · {new Date(e.startedAt).toLocaleString('pt-BR')}
                    {e.errorNode && ` · nó "${e.errorNode}"`}
                  </div>
                </div>
                {e.errorMessage && (
                  <span className="text-[10px] text-destructive max-w-[200px] truncate">{e.errorMessage}</span>
                )}
              </button>
            ))}
          </div>
        )}
      </Card>

      {/* Payloads enviados (com retry) */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-sm">Últimos envios do app ({payloads.length})</h2>
          {payloads.length > 0 && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => { clearRecordedPayloads(); setPayloads([]); }}
            >
              <Trash2 className="h-3 w-3 mr-1" /> Limpar
            </Button>
          )}
        </div>
        {payloads.length === 0 ? (
          <div className="text-xs text-muted-foreground py-8 text-center">
            Nenhum envio registrado ainda. Envie uma etiqueta pelo app.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {payloads.map((p) => (
              <div key={p.id} className="flex items-center gap-3 py-2">
                <Badge className={cn(
                  'text-[10px] border',
                  p.status === 'ok' ? statusStyle.success : statusStyle.error,
                )}>
                  {p.status === 'ok' ? 'enviado' : 'falha'}
                </Badge>
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate">{p.title || 'Etiqueta'}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {new Date(p.sentAt).toLocaleString('pt-BR')}
                    {p.errorMessage && ` · ${p.errorMessage}`}
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => handleRetry(p.id)}>
                  <Send className="h-3 w-3 mr-1" /> Reenviar
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Modal detalhe execução */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <Card className="max-w-2xl w-full p-4 space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Execução #{selected.id}</h3>
              <div className="flex gap-2">
                <a
                  href={`${getN8nBaseUrl()}/workflow/${selected.workflowId}/executions/${selected.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  Abrir no n8n <ExternalLink className="h-3 w-3" />
                </a>
                <Button size="sm" variant="ghost" onClick={() => setSelected(null)}>
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="text-sm space-y-2">
              <div><span className="text-muted-foreground">Workflow:</span> {selected.workflowName || selected.workflowId}</div>
              <div><span className="text-muted-foreground">Status:</span> <Badge className={cn('border', statusStyle[selected.status])}>{selected.status}</Badge></div>
              <div><span className="text-muted-foreground">Iniciada:</span> {new Date(selected.startedAt).toLocaleString('pt-BR')}</div>
              {detailLoading ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" /> Carregando detalhes…</div>
              ) : selected.errorMessage ? (
                <div className="bg-red-500/10 border border-red-500/30 rounded p-3 text-xs space-y-1">
                  <div className="font-semibold text-destructive">Erro no nó "{selected.errorNode || '?'}"</div>
                  <div className="text-muted-foreground">{selected.errorMessage}</div>
                </div>
              ) : null}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function StatusCard({ label, value, ok, hint }: { label: string; value: string; ok: boolean; hint?: string }) {
  return (
    <Card className="p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="flex items-center gap-2 mt-1">
        <div className={cn('h-2 w-2 rounded-full', ok ? 'bg-green-500' : 'bg-red-500')} />
        <div className="text-lg font-semibold">{value}</div>
      </div>
      {hint && <div className="text-[10px] text-muted-foreground mt-1">{hint}</div>}
    </Card>
  );
}
