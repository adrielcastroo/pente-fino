import { useState, useCallback, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';
import { PageShell, PageHeader } from '@/components/expedicao/ui';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  RefreshCw, PlayCircle, Zap, Activity, 
  ArrowLeft, LayoutDashboard, History,
  Wifi, WifiOff, Loader2
} from 'lucide-react';
import { syncToast } from '@/lib/toast-flows';
import { formatDateBR } from '@/lib/app-utils';
import AugeSyncHistory from '@/components/auge/AugeSyncHistory';

export default function AugeSyncStatusPage() {
  const { isAdmin, loading } = useAuth();
  const [syncing, setSyncing] = useState(false);
  const [ping, setPing] = useState<{ ok: boolean; latency?: number; error?: string; checkedAt?: string } | null>(null);
  const [pinging, setPinging] = useState(false);

  const doPing = useCallback(async () => {
    setPinging(true);
    try {
      const t0 = Date.now();
      const { data, error } = await supabase.functions.invoke('auge-sync?action=ping');
      const latency = Date.now() - t0;
      if (error) throw error;
      setPing({ ok: data?.ok ?? false, latency, checkedAt: new Date().toISOString(), error: data?.error });
    } catch (e: any) {
      setPing({ ok: false, error: e.message, checkedAt: new Date().toISOString() });
    } finally {
      setPinging(false);
    }
  }, []);

  const syncAll = async () => {
    setSyncing(true);
    const t = syncToast.iniciado('sincronização global');
    try {
      const { data, error } = await supabase.functions.invoke('auge-sync');
      if (error) throw error;
      if (data?.ok === false) throw new Error(data.error);
      syncToast.ok('registros', data?.upserted ?? 0, 'Sincronização global concluída.', { id: t });
    } catch (e: any) {
      syncToast.erro('global', e, { id: t });
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    if (isAdmin) doPing();
  }, [isAdmin, doPing]);

  if (loading) return null;
  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <PageShell>
      <PageHeader
        title="Status da Sincronização"
        description="Monitoramento em tempo real do fluxo de dados Auge ERP"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild className="h-9">
              <a href="/admin?tab=auge">
                <LayoutDashboard className="h-4 w-4 mr-2" />
                Painel Admin
              </a>
            </Button>
            <Button size="sm" onClick={syncAll} disabled={syncing} className="h-9 gap-2">
              {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
              Sincronizar Agora
            </Button>
          </div>
        }
      />

      <div className="grid gap-6">
        {/* Status de Conexão */}
        <Card className="p-6 border-border/40 overflow-hidden relative">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center",
                pinging ? "bg-muted animate-pulse" : ping?.ok ? "bg-success/10" : "bg-destructive/10"
              )}>
                {pinging ? (
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                ) : ping?.ok ? (
                  <Wifi className="h-6 w-6 text-success" />
                ) : (
                  <WifiOff className="h-6 w-6 text-destructive" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold">Conexão Auge ERP</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant={ping?.ok ? "success" : "destructive"} className="text-[10px] uppercase">
                    {pinging ? "Verificando..." : ping?.ok ? "Online" : "Offline"}
                  </Badge>
                  {ping?.latency && (
                    <span className="text-xs text-muted-foreground font-mono">
                      {ping.latency}ms
                    </span>
                  )}
                  {ping?.checkedAt && (
                    <span className="text-[10px] text-muted-foreground/60 italic">
                      · {formatDateBR(ping.checkedAt)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={doPing} disabled={pinging} className="h-10">
                <RefreshCw className={cn("h-4 w-4 mr-2", pinging && "animate-spin")} />
                Testar Novamente
              </Button>
            </div>
          </div>
          
          {!ping?.ok && ping?.error && (
            <div className="mt-4 p-3 bg-destructive/5 border border-destructive/20 rounded-md flex items-start gap-2">
              <Activity className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
              <p className="text-xs text-destructive font-mono break-all">{ping.error}</p>
            </div>
          )}
        </Card>

        {/* Histórico Detalhado */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <History className="h-4 w-4" />
              Histórico de Execuções
            </h3>
            <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              Realtime · 50 registros
            </span>
          </div>
          <AugeSyncHistory />
        </div>
      </div>
    </PageShell>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
