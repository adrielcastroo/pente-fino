import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, X, Bell } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'expedicao_alerts_dismissed';

type Alert = {
  id: string;
  severity: 'warning' | 'danger' | 'info';
  title: string;
  detail: string;
  count: number;
};

function loadDismissed(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]'));
  } catch { return new Set(); }
}
function saveDismissed(s: Set<string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(s)));
}

export function AlertsPanel() {
  const [dismissed, setDismissed] = useState<Set<string>>(loadDismissed);

  const { data: alerts = [] } = useQuery({
    queryKey: ['expedicao_alerts'],
    queryFn: async (): Promise<Alert[]> => {
      const now = Date.now();
      const h24 = new Date(now - 24 * 3600_000).toISOString();
      const h48 = new Date(now - 48 * 3600_000).toISOString();
      const h72 = new Date(now - 72 * 3600_000).toISOString();

      // 1) Romaneios abertos > 24h
      const romsAbertos = await supabase
        .from('expedicao_romaneios')
        .select('id, numero, created_at')
        .eq('status', 'aberto')
        .lt('created_at', h24);




      // 3) Peças etiquetadas > 72h sem alocação
      const pecasParadas = await supabase
        .from('expedicao_pecas')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'etiquetada')
        .lt('created_at', h72);

      const list: Alert[] = [];
      if ((romsAbertos.data?.length ?? 0) > 0) {
        list.push({
          id: 'roms_abertos_24h',
          severity: 'warning',
          title: `${romsAbertos.data!.length} romaneio(s) aberto(s) há mais de 24h`,
          detail: 'Sem faturamento. Verificar bloqueios fiscais ou fechar a operação.',
          count: romsAbertos.data!.length,
        });
      }
      
      if ((pecasParadas.count ?? 0) > 0) {
        list.push({
          id: 'pecas_etiquetadas_72h',
          severity: 'info',
          title: `${pecasParadas.count} peça(s) etiquetada(s) há 72h+`,
          detail: 'Peças aguardando alocação em carrinho.',
          count: pecasParadas.count ?? 0,
        });
      }
      return list;
    },
    refetchInterval: 60_000,
  });

  const visibles = useMemo(() => alerts.filter(a => !dismissed.has(a.id)), [alerts, dismissed]);

  if (visibles.length === 0) return null;

  const dismiss = (id: string) => {
    const next = new Set(dismissed);
    next.add(id);
    setDismissed(next);
    saveDismissed(next);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Bell className="w-4 h-4" /> Alertas ({visibles.length})
      </div>
      {visibles.map(a => (
        <div
          key={a.id}
          className={cn(
            'flex items-start gap-3 rounded-md border p-3 text-sm',
            a.severity === 'danger'  && 'border-destructive/40 bg-destructive/5',
            a.severity === 'warning' && 'border-warning/40 bg-warning/5',
            a.severity === 'info'    && 'border-primary/30 bg-primary/5',
          )}
        >
          <AlertTriangle className={cn(
            'w-4 h-4 mt-0.5 shrink-0',
            a.severity === 'danger'  && 'text-destructive',
            a.severity === 'warning' && 'text-warning',
            a.severity === 'info'    && 'text-primary',
          )} />
          <div className="flex-1 min-w-0">
            <div className="font-medium">{a.title}</div>
            <div className="text-xs text-muted-foreground">{a.detail}</div>
          </div>
          <Button size="sm" variant="ghost" onClick={() => dismiss(a.id)} className="h-7 w-7 p-0 shrink-0">
            <X className="w-3 h-3" />
          </Button>
        </div>
      ))}
    </div>
  );
}

export default AlertsPanel;
