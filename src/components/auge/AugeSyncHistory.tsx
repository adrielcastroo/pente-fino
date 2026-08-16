import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  CheckCircle2, XCircle, Clock, Loader2, 
  ExternalLink, ChevronRight, Info
} from 'lucide-react';
import { formatDateBR } from '@/lib/app-utils';
import { cn } from '@/lib/utils';

interface Run {
  id: string;
  entidade: string | null;
  status: string;
  started_at: string;
  finished_at: string | null;
  rows_processed: number | null;
  rows_upserted: number | null;
  error_message: string | null;
  triggered_by: string | null;
  detalhes: any;
}

export default function AugeSyncHistory() {
  const { data: runs, isLoading, refetch } = useQuery({
    queryKey: ['auge_sync_runs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('auge_sync_runs')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data as Run[];
    },
    refetchInterval: 10000, // Auto-refresh a cada 10s
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-md" />
        ))}
      </div>
    );
  }

  if (!runs?.length) {
    return (
      <Card className="p-8 text-center border-dashed">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <Info className="h-8 w-8 opacity-20" />
          <p className="text-sm">Nenhuma sincronização registrada no histórico.</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {runs.map((run) => (
        <SyncRunCard key={run.id} run={run} />
      ))}
    </div>
  );
}

function SyncRunCard({ run }: { run: Run }) {
  const duration = run.finished_at 
    ? Math.round((new Date(run.finished_at).getTime() - new Date(run.started_at).getTime()) / 1000)
    : null;

  const statusMap = {
    success: { icon: CheckCircle2, color: 'text-success bg-success/10 border-success/20', label: 'Sucesso' },
    error: { icon: XCircle, color: 'text-destructive bg-destructive/10 border-destructive/20', label: 'Falha' },
    running: { icon: Loader2, color: 'text-warning bg-warning/10 border-warning/20', label: 'Rodando' },
  };

  const status = (statusMap[run.status as keyof typeof statusMap] || statusMap.running);
  const StatusIcon = status.icon;

  return (
    <Card className="overflow-hidden border-border/40 hover:border-border/80 transition-all duration-200">
      <div className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className={cn(
            "p-2 rounded-full border shrink-0",
            status.color
          )}>
            <StatusIcon className={cn("h-4 w-4", run.status === 'running' && "animate-spin")} />
          </div>
          
          <div className="min-w-0 space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm">
                {run.entidade ? run.entidade.charAt(0).toUpperCase() + run.entidade.slice(1) : 'Sincronização Global'}
              </span>
              <Badge variant="outline" className="text-[10px] font-mono h-5">
                {run.triggered_by ? 'Manual' : 'Agendada'}
              </Badge>
              {run.status === 'success' && (
                <Badge className="bg-success/20 text-success hover:bg-success/30 border-none text-[10px] h-5">
                  +{run.rows_upserted ?? 0} registros
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDateBR(run.started_at)}
              </span>
              {duration !== null && (
                <span>Duração: {duration}s</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-10 sm:ml-0">
          {run.error_message && (
            <Badge variant="destructive" className="text-[10px] max-w-[150px] truncate" title={run.error_message}>
              Erro: {run.error_message}
            </Badge>
          )}
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" asChild>
            <a href={`/admin/audit?run=${run.id}`}>
              <ChevronRight className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>
      
      {/* Detalhes expandidos se houver erro ou info extra */}
      {run.detalhes && typeof run.detalhes === 'object' && Object.keys(run.detalhes).length > 0 && (
        <div className="px-4 pb-3 pt-0 border-t border-border/10 bg-muted/20">
          <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
            {Object.entries(run.detalhes).map(([key, val]) => (
              <div key={key} className="text-[10px]">
                <span className="text-muted-foreground block uppercase tracking-tighter">{key.replace(/_/g, ' ')}</span>
                <span className="font-mono truncate block">{String(val)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

function Button({ className, variant, size, asChild, ...props }: any) {
  const Comp = asChild ? 'span' : 'button';
  return (
    <Comp
      className={cn(
        "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        variant === 'ghost' && "hover:bg-accent hover:text-accent-foreground",
        className
      )}
      {...props}
    />
  );
}
