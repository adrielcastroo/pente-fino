import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, TestTube2, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { validateWebhookUrl } from '@/lib/webhook-url';
import { cn } from '@/lib/utils';

/** Timeout máximo aceito para uma resposta do n8n. */
const TIMEOUT_MS = 5_000;

/** PNG 1x1 transparente — payload mínimo de etiqueta para o teste. */
const SAMPLE_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

type Outcome = 'ok' | 'http-error' | 'timeout' | 'network' | 'invalid';

interface TestResult {
  outcome: Outcome;
  status?: number;
  durationMs: number;
  body?: string;
  /** Explicação em pt-BR do provável motivo do erro. */
  reason?: string;
  hints?: string[];
}

function buildSamplePayload() {
  return {
    type: 'tecido' as const,
    template: 'tecido',
    format: 'tecido',
    title: 'ETIQUETA DE TESTE — Pente Fino',
    widthMm: 100,
    heightMm: 50,
    imageBase64: SAMPLE_PNG_BASE64,
    mimeType: 'image/png',
    imageSize: SAMPLE_PNG_BASE64.length,
    dataUrl: `data:image/png;base64,${SAMPLE_PNG_BASE64}`,
    isTest: true,
    sentAt: new Date().toISOString(),
    data: {
      item: 'TESTE.000.001',
      lote: 'TESTE-0001',
      endereco: 'TEC01.A.N01',
      largura: '2,80',
      m_linear: '30,00',
      conferente: 'Teste automático',
    },
  };
}

function diagnoseHttp(status: number): { reason: string; hints: string[] } {
  if (status === 404) {
    return {
      reason: 'O n8n respondeu 404 — o webhook não está registrado nessa URL.',
      hints: [
        'Se for URL de TESTE, clique em "Listen for test event" / "Execute workflow" no n8n antes de testar: a URL de teste só existe durante a escuta.',
        'Confira se o path do nó Webhook é exatamente o mesmo da URL informada.',
        'Se o fluxo já estiver publicado, use a URL de produção (/webhook/...) em vez de /webhook-test/....',
      ],
    };
  }
  if (status === 401 || status === 403) {
    return {
      reason: `O n8n recusou a chamada (HTTP ${status}) — autenticação do webhook.`,
      hints: [
        'O nó Webhook está com Authentication (Header/Basic Auth) ativo; o app envia a etiqueta sem credenciais.',
        'Desative a autenticação do nó ou publique um proxy que injete o header.',
      ],
    };
  }
  if (status === 405) {
    return {
      reason: 'HTTP 405 — o método POST não é aceito nesse webhook.',
      hints: ['Altere o nó Webhook do n8n para aceitar POST.'],
    };
  }
  if (status >= 500) {
    return {
      reason: `O fluxo do n8n quebrou durante a execução (HTTP ${status}).`,
      hints: [
        'Abra a execução em Executions no n8n para ver o nó que falhou.',
        'Campos esperados no payload: imageBase64, mimeType, widthMm, heightMm, title, data.',
      ],
    };
  }
  return {
    reason: `O n8n respondeu HTTP ${status}.`,
    hints: ['Verifique a resposta bruta abaixo e a execução correspondente no n8n.'],
  };
}

export function N8nEtiquetaTester({ defaultUrl = '' }: { defaultUrl?: string }) {
  const [url, setUrl] = useState(defaultUrl);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);

  const runTest = async () => {
    const validation = validateWebhookUrl(url, { allowEmpty: false });
    if (!validation.ok) {
      setResult({
        outcome: 'invalid',
        durationMs: 0,
        reason: validation.error,
        hints: ['Formato esperado: https://seu-n8n/webhook-test/imprimir-etiqueta'],
      });
      return;
    }

    setRunning(true);
    setResult(null);
    const started = performance.now();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const res = await fetch(url.trim(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify(buildSamplePayload()),
        signal: controller.signal,
      });
      const durationMs = Math.round(performance.now() - started);
      const body = (await res.text().catch(() => '')).slice(0, 4000);

      if (res.ok) {
        setResult({ outcome: 'ok', status: res.status, durationMs, body });
      } else {
        setResult({ outcome: 'http-error', status: res.status, durationMs, body, ...diagnoseHttp(res.status) });
      }
    } catch (err: any) {
      const durationMs = Math.round(performance.now() - started);
      const aborted = err?.name === 'AbortError';
      if (aborted) {
        setResult({
          outcome: 'timeout',
          durationMs,
          reason: `Sem resposta do n8n em ${TIMEOUT_MS / 1000}s. Prováveis motivos:`,
          hints: [
            'O fluxo não tem o nó "Respond to Webhook" — nesse caso o n8n só responde ao terminar tudo, e a impressora pode estar travando a execução.',
            'O nó Webhook está com "Respond: When Last Node Finishes" e algum nó ficou preso (impressora offline, fila cheia).',
            'A URL de teste não está em escuta: o n8n só aceita /webhook-test/... enquanto o botão "Listen for test event" está ativo.',
            'O workflow está desativado (toggle Active desligado) e você usou a URL de produção.',
            'A instância do n8n está fora do ar ou atrás de um túnel lento.',
          ],
        });
      } else {
        setResult({
          outcome: 'network',
          durationMs,
          reason: 'Não foi possível alcançar o n8n (falha de rede ou CORS).',
          hints: [
            'Se o n8n está em HTTP e o app em HTTPS, o navegador bloqueia a chamada (mixed content). Publique o n8n em HTTPS.',
            'CORS: adicione o domínio do app em "Access-Control-Allow-Origin" na resposta do nó Respond to Webhook.',
            'Verifique se o host/porta estão corretos e acessíveis a partir deste navegador.',
            err?.message ? `Detalhe técnico: ${err.message}` : '',
          ].filter(Boolean),
        });
      }
    } finally {
      clearTimeout(timer);
      setRunning(false);
    }
  };

  const badge = result
    ? result.outcome === 'ok'
      ? { icon: CheckCircle2, label: 'Sucesso', className: 'bg-primary/15 text-primary border-primary/30' }
      : result.outcome === 'timeout'
        ? { icon: AlertTriangle, label: 'Timeout', className: 'bg-muted text-muted-foreground border-border' }
        : { icon: XCircle, label: 'Falha', className: 'bg-destructive/15 text-destructive border-destructive/30' }
    : null;

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-start gap-3">
        <TestTube2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-foreground">Testador de envio de etiquetas</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Envia uma etiqueta de teste (PNG mínimo + campos reais) para a URL informada e aguarda
            até {TIMEOUT_MS / 1000}s pela resposta do n8n. Nada é impresso nem gravado no estoque.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 sm:items-end">
        <div className="space-y-1.5">
          <Label htmlFor="n8n-test-url" className="text-xs font-medium text-muted-foreground">
            URL de teste do fluxo
          </Label>
          <Input
            id="n8n-test-url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !running) runTest(); }}
            placeholder="https://seu-n8n/webhook-test/imprimir-etiqueta"
            className="font-mono text-xs"
          />
        </div>
        <Button onClick={runTest} disabled={running || !url.trim()}>
          {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <TestTube2 className="h-4 w-4" />}
          {running ? 'Testando…' : 'Enviar teste'}
        </Button>
      </div>

      {result && badge && (
        <div className="rounded-md border border-border bg-muted/30 p-3 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={cn('gap-1 border', badge.className)}>
              <badge.icon className="h-3 w-3" />
              {badge.label}
            </Badge>
            {result.status != null && (
              <span className="text-xs font-mono text-muted-foreground">HTTP {result.status}</span>
            )}
            <span className="text-xs text-muted-foreground">{result.durationMs} ms</span>
          </div>

          {result.outcome === 'ok' ? (
            <p className="text-xs text-foreground/90">
              O n8n recebeu a etiqueta e respondeu dentro do tempo limite. O fluxo está saudável.
            </p>
          ) : (
            <>
              <p className="text-xs font-medium text-foreground">{result.reason}</p>
              {!!result.hints?.length && (
                <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
                  {result.hints.map((h, i) => <li key={i}>{h}</li>)}
                </ul>
              )}
            </>
          )}

          {result.body && (
            <div className="space-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Resposta do n8n
              </p>
              <pre className="text-[11px] bg-background border border-border rounded p-2 overflow-auto max-h-48 whitespace-pre-wrap break-all">
                {result.body}
              </pre>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

export default N8nEtiquetaTester;
