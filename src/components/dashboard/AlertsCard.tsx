import { memo, useMemo, useState, useEffect, useCallback } from 'react';
import { AlertTriangle, CheckCircle2, Info, PackageX, X } from 'lucide-react';
import { motion } from 'framer-motion';

const DISMISSED_KEY = 'pf_dashboard_dismissed_alerts_v1';

function loadDismissed(): Set<string> {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

type AlertSeverity = 'critical' | 'warning' | 'info';

interface AlertItem {
  id: string;
  severity: AlertSeverity;
  title: string;
  description: string;
}

interface AlertsCardProps {
  stats: any;
}

const SEVERITY_STYLES: Record<AlertSeverity, { bg: string; text: string; border: string; icon: any }> = {
  critical: { bg: 'bg-destructive/10', text: 'text-destructive', border: 'border-destructive/30', icon: AlertTriangle },
  warning: { bg: 'bg-amber-500/10', text: 'text-amber-500', border: 'border-amber-500/30', icon: PackageX },
  info: { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/30', icon: Info },
};

export const AlertsCard = memo(({ stats }: AlertsCardProps) => {
  const [dismissed, setDismissed] = useState<Set<string>>(() => loadDismissed());

  useEffect(() => {
    try {
      localStorage.setItem(DISMISSED_KEY, JSON.stringify(Array.from(dismissed)));
    } catch { /* ignore */ }
  }, [dismissed]);

  const dismiss = useCallback((id: string) => {
    setDismissed(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const allAlerts = useMemo<AlertItem[]>(() => {
    const list: AlertItem[] = [];
    const tecido = stats?.occupation?.tecido;
    const madeira = stats?.occupation?.madeira;

    if (tecido?.total > 0) {
      const pct = Math.round(((tecido.used + tecido.reserved + tecido.blocked) / tecido.total) * 100);
      if (pct >= 80) {
        list.push({
          id: 'tecido-cheio',
          severity: pct >= 95 ? 'critical' : 'warning',
          title: `Ocupação Tecidos em ${pct}%`,
          description: 'Setor próximo da capacidade máxima — avalie liberação de endereços.',
        });
      }
    }

    if (madeira?.total > 0 && (madeira.used + madeira.reserved + madeira.blocked) === 0) {
      list.push({
        id: 'madeira-vazio',
        severity: 'info',
        title: 'Setor Madeira sem alocações',
        description: 'Nenhuma alocação registrada. Verifique se o setor está inativo ou aguardando importação.',
      });
    } else if (madeira?.total > 0) {
      const pct = Math.round(((madeira.used + madeira.reserved + madeira.blocked) / madeira.total) * 100);
      if (pct >= 80) {
        list.push({
          id: 'madeira-cheio',
          severity: pct >= 95 ? 'critical' : 'warning',
          title: `Ocupação Madeira em ${pct}%`,
          description: 'Setor próximo do limite — considere movimentação ou saída.',
        });
      }
    }

    return list;
  }, [stats]);

  const alerts = useMemo(() => allAlerts.filter(a => !dismissed.has(a.id)), [allAlerts, dismissed]);

  if (alerts.length === 0) {
    return (
      <div className="rounded-lg border border-border/40 bg-card/50 px-4 py-3 flex items-center gap-3">
        <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-500">
          <CheckCircle2 className="w-4 h-4" strokeWidth={1.75} />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-foreground">Nenhum alerta ativo</span>
          <span className="text-xs text-muted-foreground">0 alertas</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border/40 bg-card/50 overflow-hidden">
      <div className="px-4 py-2.5 border-b border-border/30 flex items-center gap-2">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-500" strokeWidth={1.75} />
        <h2 className="text-xs font-medium text-foreground">
          Alertas operacionais
        </h2>
        <span className="ml-auto text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 tabular-nums">
          {alerts.length}
        </span>
      </div>
      <div className="divide-y divide-border/20">
        {alerts.map(alert => {
          const style = SEVERITY_STYLES[alert.severity];
          const Icon = style.icon;
          return (
            <div key={alert.id} className="px-4 py-3 flex items-start gap-3 hover:bg-muted/20 transition-colors">
              <div className={`p-1.5 rounded-md ${style.bg} ${style.text} shrink-0`}>
                <Icon className="w-3.5 h-3.5" strokeWidth={1.75} />
              </div>
              <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                <span className={`text-sm font-medium ${style.text} truncate`}>{alert.title}</span>
                <span className="text-xs text-muted-foreground">{alert.description}</span>
              </div>
              <button
                type="button"
                onClick={() => dismiss(alert.id)}
                aria-label={`Fechar alerta: ${alert.title}`}
                className="shrink-0 p-1 rounded-md text-muted-foreground/60 hover:text-foreground hover:bg-muted/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="w-3.5 h-3.5" strokeWidth={2} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
});

AlertsCard.displayName = 'AlertsCard';
