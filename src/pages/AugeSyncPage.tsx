import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { RefreshCw, Database, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AugeSaldo {
  id: string;
  codigo: string;
  descricao: string | null;
  deposito: string;
  quantidade: number;
  unidade: string | null;
  synced_at: string;
}

interface AugeRun {
  id: string;
  started_at: string;
  finished_at: string | null;
  status: string;
  rows_processed: number;
  rows_upserted: number;
  error_message: string | null;
  entidade: string | null;
}

const ENTIDADES = [
  { key: 'produtos', label: 'Produtos' },
  { key: 'depositos', label: 'Depósitos' },
  { key: 'saldo', label: 'Saldo' },
  { key: 'movimentacoes', label: 'Movimentações' },
  { key: 'lotes', label: 'Lotes' },
] as const;

export default function AugeSyncPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');

  const { data: saldos } = useQuery({
    queryKey: ['auge_saldos', search],
    queryFn: async () => {
      let q = (supabase as any).from('auge_produtos_saldo').select('*')
        .order('synced_at', { ascending: false }).limit(500);
      if (search.trim()) {
        const s = search.trim().replace(/[%,]/g, ' ');
        q = q.or(`codigo.ilike.%${s}%,descricao.ilike.%${s}%`);
      }
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as AugeSaldo[];
    },
  });

  const { data: runs } = useQuery({
    queryKey: ['auge_runs'],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from('auge_sync_runs')
        .select('*').order('started_at', { ascending: false }).limit(10);
      if (error) throw error;
      return (data ?? []) as AugeRun[];
    },
    refetchInterval: 5000,
  });

  const sync = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('auge-sync');
      if (error) throw error;
      return data;
    },
    onSuccess: (d: any) => {
      toast.success(`Sincronizado: ${d?.upserted ?? 0} registros`);
      qc.invalidateQueries({ queryKey: ['auge_saldos'] });
      qc.invalidateQueries({ queryKey: ['auge_runs'] });
    },
    onError: (e: any) => toast.error(`Falha: ${e.message}`),
  });

  const lastRun = runs?.[0];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Database className="h-6 w-6 text-primary" /> Espelho Auge (Unilux)
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Sincroniza saldos de estoque do ERP Auge para consulta dentro do Pente Fino.
          </p>
        </div>
        <Button onClick={() => sync.mutate()} disabled={sync.isPending} size="lg">
          <RefreshCw className={`h-4 w-4 mr-2 ${sync.isPending ? 'animate-spin' : ''}`} />
          Sincronizar agora
        </Button>
      </div>

      {lastRun && (
        <Card className="p-4 flex items-center gap-3 text-sm">
          {lastRun.status === 'success' && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
          {lastRun.status === 'error' && <AlertCircle className="h-4 w-4 text-destructive" />}
          {lastRun.status === 'running' && <Clock className="h-4 w-4 text-amber-500 animate-pulse" />}
          <div className="flex-1">
            <span className="font-semibold capitalize">{lastRun.status}</span>
            <span className="text-muted-foreground ml-2">
              {formatDistanceToNow(new Date(lastRun.started_at), { addSuffix: true, locale: ptBR })}
              {' · '}{lastRun.rows_upserted} linhas
            </span>
            {lastRun.error_message && (
              <p className="text-destructive text-xs mt-1">{lastRun.error_message}</p>
            )}
          </div>
        </Card>
      )}

      <div className="space-y-2">
        <Input
          placeholder="Buscar por código ou descrição..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
        <Card className="overflow-hidden">
          <div className="max-h-[600px] overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted sticky top-0">
                <tr className="text-left">
                  <th className="p-2 font-semibold">Código</th>
                  <th className="p-2 font-semibold">Descrição</th>
                  <th className="p-2 font-semibold">Depósito</th>
                  <th className="p-2 font-semibold text-right">Qtd</th>
                  <th className="p-2 font-semibold">Un</th>
                  <th className="p-2 font-semibold">Sync</th>
                </tr>
              </thead>
              <tbody>
                {(saldos ?? []).map((s) => (
                  <tr key={s.id} className="border-t hover:bg-muted/40">
                    <td className="p-2 font-mono text-xs">{s.codigo}</td>
                    <td className="p-2">{s.descricao ?? '-'}</td>
                    <td className="p-2"><Badge variant="outline">{s.deposito}</Badge></td>
                    <td className="p-2 text-right tabular-nums">{s.quantidade}</td>
                    <td className="p-2 text-muted-foreground">{s.unidade ?? '-'}</td>
                    <td className="p-2 text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(s.synced_at), { addSuffix: true, locale: ptBR })}
                    </td>
                  </tr>
                ))}
                {(!saldos || saldos.length === 0) && (
                  <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">
                    Nenhum saldo sincronizado ainda. Clique em "Sincronizar agora".
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
