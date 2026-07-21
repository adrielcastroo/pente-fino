import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, CheckCircle2, XCircle, AlertCircle, KeyRound, ExternalLink } from "lucide-react";
import { toast } from "sonner";

type Usage = {
  requestsLimit: number | null;
  requestsRemaining: number | null;
  requestsReset: string | null;
  tokensLimit: number | null;
  tokensRemaining: number | null;
  tokensReset: string | null;
  retryAfter: string | null;
} | null;

type ProviderHealth = {
  ok: boolean;
  httpStatus: number;
  latencyMs: number;
  modelCount: number | null;
  error: string | null;
  usage: Usage;
} | null;


type ProviderStatus = {
  id: string;
  label: string;
  envKey: string;
  configured: boolean;
  masked: string | null;
  length: number;
  docs: string;
  health: ProviderHealth;
};

type Response = { providers: ProviderStatus[]; checkedAt: string };

export default function LlmTokensTab() {
  const [data, setData] = useState<Response | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data: res, error } = await supabase.functions.invoke<Response>("ai-tokens-status");
      if (error) throw error;
      setData(res ?? null);
    } catch (e) {
      toast.error("Falha ao consultar status dos tokens", {
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <KeyRound className="h-4 w-4 text-primary" />
              Tokens das LLMs
            </CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              Cadeia de fallback do Fio: Cerebras → Groq → NVIDIA. Lovable AI Gateway é o backup gerenciado.
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={`mr-2 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {!data && loading && (
            <div className="text-sm text-muted-foreground">Consultando provedores…</div>
          )}
          {data?.providers.map((p) => (
            <ProviderRow key={p.id} p={p} />
          ))}
          {data && (
            <p className="pt-1 text-[11px] text-muted-foreground">
              Última verificação: {new Date(data.checkedAt).toLocaleString("pt-BR")}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ProviderRow({ p }: { p: ProviderStatus }) {
  let statusBadge: React.ReactNode;
  if (!p.configured) {
    statusBadge = (
      <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400">
        <AlertCircle className="mr-1 h-3 w-3" /> Não configurado
      </Badge>
    );
  } else if (p.health?.ok) {
    statusBadge = (
      <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
        <CheckCircle2 className="mr-1 h-3 w-3" /> Online
      </Badge>
    );
  } else {
    statusBadge = (
      <Badge variant="outline" className="border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-400">
        <XCircle className="mr-1 h-3 w-3" /> Falha
      </Badge>
    );
  }

  return (
    <div className="rounded-lg border bg-card/50 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">{p.label}</span>
            {statusBadge}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono">{p.envKey}</code>
            {p.configured && p.masked && (
              <span className="font-mono">{p.masked}</span>
            )}
            {p.configured && (
              <span>({p.length} chars)</span>
            )}
          </div>
        </div>
        <a
          href={p.docs}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-xs text-primary hover:underline inline-flex items-center gap-1"
        >
          Obter chave <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {p.health && (
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
          <span>HTTP {p.health.httpStatus || "—"}</span>
          <span>Latência: {p.health.latencyMs} ms</span>
          {p.health.modelCount !== null && <span>Modelos: {p.health.modelCount}</span>}
          {p.health.error && (
            <span className="text-red-600 dark:text-red-400">Erro: {p.health.error}</span>
          )}
        </div>
      )}

      {p.health?.usage && <UsagePanel u={p.health.usage} />}
    </div>
  );
}

function fmtNum(n: number | null): string {
  if (n === null) return "—";
  return n.toLocaleString("pt-BR");
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}

function fmtCountdown(iso: string | null): string {
  if (!iso) return "";
  const ms = new Date(iso).getTime() - Date.now();
  if (isNaN(ms)) return "";
  if (ms <= 0) return "agora";
  const s = Math.floor(ms / 1000);
  if (s < 60) return `em ${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `em ${m}m ${s % 60}s`;
  const h = Math.floor(m / 60);
  return `em ${h}h ${m % 60}m`;
}

function UsagePanel({ u }: { u: NonNullable<NonNullable<ProviderHealth>["usage"]> }) {
  const hasAny =
    u.requestsLimit !== null || u.tokensLimit !== null || u.retryAfter !== null;
  if (!hasAny) {
    return (
      <div className="mt-2 rounded-md border border-dashed bg-muted/30 px-2 py-1.5 text-[11px] text-muted-foreground">
        Provedor não expõe cotas de uso via API.
      </div>
    );
  }

  const reqUsed =
    u.requestsLimit !== null && u.requestsRemaining !== null
      ? u.requestsLimit - u.requestsRemaining
      : null;
  const tokUsed =
    u.tokensLimit !== null && u.tokensRemaining !== null
      ? u.tokensLimit - u.tokensRemaining
      : null;
  const reqPct =
    u.requestsLimit && u.requestsLimit > 0 && reqUsed !== null
      ? Math.min(100, Math.round((reqUsed / u.requestsLimit) * 100))
      : null;
  const tokPct =
    u.tokensLimit && u.tokensLimit > 0 && tokUsed !== null
      ? Math.min(100, Math.round((tokUsed / u.tokensLimit) * 100))
      : null;

  return (
    <div className="mt-2 grid gap-2 rounded-md border bg-muted/30 p-2 text-[11px] sm:grid-cols-2">
      {u.requestsLimit !== null && (
        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="font-medium text-foreground">Requisições</span>
            <span className="text-muted-foreground">
              {fmtNum(reqUsed)} / {fmtNum(u.requestsLimit)}
              {reqPct !== null && <span className="ml-1">({reqPct}%)</span>}
            </span>
          </div>
          {reqPct !== null && (
            <div className="h-1.5 w-full overflow-hidden rounded bg-muted">
              <div
                className={`h-full ${reqPct >= 90 ? "bg-red-500" : reqPct >= 70 ? "bg-amber-500" : "bg-emerald-500"}`}
                style={{ width: `${reqPct}%` }}
              />
            </div>
          )}
          <div className="mt-1 text-muted-foreground">
            Recarga: {fmtDate(u.requestsReset)}{" "}
            <span className="text-foreground/70">{fmtCountdown(u.requestsReset)}</span>
          </div>
        </div>
      )}

      {u.tokensLimit !== null && (
        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="font-medium text-foreground">Tokens</span>
            <span className="text-muted-foreground">
              {fmtNum(tokUsed)} / {fmtNum(u.tokensLimit)}
              {tokPct !== null && <span className="ml-1">({tokPct}%)</span>}
            </span>
          </div>
          {tokPct !== null && (
            <div className="h-1.5 w-full overflow-hidden rounded bg-muted">
              <div
                className={`h-full ${tokPct >= 90 ? "bg-red-500" : tokPct >= 70 ? "bg-amber-500" : "bg-emerald-500"}`}
                style={{ width: `${tokPct}%` }}
              />
            </div>
          )}
          <div className="mt-1 text-muted-foreground">
            Recarga: {fmtDate(u.tokensReset)}{" "}
            <span className="text-foreground/70">{fmtCountdown(u.tokensReset)}</span>
          </div>
        </div>
      )}

      {u.retryAfter && (
        <div className="sm:col-span-2 text-amber-600 dark:text-amber-400">
          Rate limit ativo — tente novamente em {fmtDate(u.retryAfter)} ({fmtCountdown(u.retryAfter)})
        </div>
      )}
    </div>
  );
}

