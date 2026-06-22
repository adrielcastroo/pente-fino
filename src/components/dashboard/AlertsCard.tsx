import { memo, useMemo } from 'react';
import { AlertTriangle, CheckCircle2, Info, PackageX } from 'lucide-react';
import { motion } from 'framer-motion';

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
  const alerts = useMemo<AlertItem[]>(() => {
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

  if (alerts.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] backdrop-blur-xl px-6 py-4 flex items-center gap-4"
      >
        <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-black text-foreground tracking-tight">Nenhum alerta ativo</span>
          <span className="text-[11px] font-bold text-foreground/50 uppercase tracking-wider">0 alertas</span>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border/20 bg-card/40 backdrop-blur-xl overflow-hidden"
    >
      <div className="px-6 py-3 border-b border-border/10 flex items-center gap-3">
        <AlertTriangle className="w-4 h-4 text-amber-500" />
        <h2 className="text-xs font-black uppercase tracking-[0.25em] text-foreground/70">
          Alertas Operacionais
        </h2>
        <span className="ml-auto text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/30 tabular-nums">
          {alerts.length}
        </span>
      </div>
      <div className="divide-y divide-border/5">
        {alerts.map(alert => {
          const style = SEVERITY_STYLES[alert.severity];
          const Icon = style.icon;
          return (
            <div key={alert.id} className="px-6 py-4 flex items-start gap-4 hover:bg-muted/10 transition-colors">
              <div className={`p-2 rounded-lg ${style.bg} ${style.text} ${style.border} border shrink-0`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className={`text-sm font-black ${style.text} truncate`}>{alert.title}</span>
                <span className="text-xs font-bold text-foreground/60">{alert.description}</span>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
});

AlertsCard.displayName = 'AlertsCard';
