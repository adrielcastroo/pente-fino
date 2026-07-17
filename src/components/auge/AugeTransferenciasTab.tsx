import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RefreshCw, Loader2, ArrowRightLeft, Search, Plus, Zap } from 'lucide-react';
import { formatDateBR } from '@/lib/app-utils';
import TransferenciaDetailDialog from './TransferenciaDetailDialog';
import NovaTransferenciaDialog from './NovaTransferenciaDialog';

export default function AugeTransferenciasTab() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState('');
  const [detail, setDetail] = useState<any | null>(null);
  const [novaOpen, setNovaOpen] = useState(false);

  const efetivarRapido = async (row: any) => {
    if (!row?.documento) return;
    if (!confirm(`Efetivar transferência ${row.documento} no Auge? Isso movimenta estoque.`)) return;
    const t = toast.loading('Efetivando...');
    try {
      const { data, error } = await supabase.functions.invoke('auge-sync?action=transferencia_efetivar', {
        body: { cdMovimentacao: row.documento },
      });
      if (error) throw error;
      if (data?.ok === false) throw new Error(data.error);
      toast.success(`Transferência ${row.documento} efetivada`, { id: t });
      await sync();
    } catch (e: any) {
      toast.error('Falha: ' + (e.message || ''), { id: t });
    }
  };

  const load = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any).from('auge_transferencias').select('*').order('data_movimento', { ascending: false, nullsFirst: false }).limit(500);
    if (error) toast.error(error.message);
    setRows(data || []);
    setLoading(false);
  };

  const sync = async () => {
    setSyncing(true);
    const t = toast.loading('Sincronizando transferências...');
    try {
      const { data, error } = await supabase.functions.invoke('auge-sync?entity=transferencias');
      if (error) throw error;
      if (data?.ok === false) throw new Error(data.error);
      const r = (data?.results ?? []).find((x: any) => x.entity === 'transferencias');
      if (r?.error) throw new Error(r.error);
      toast.success(`${r?.upserted ?? 0} transferências sincronizadas`, { id: t });
      await load();
    } catch (e: any) {
      toast.error('Falha: ' + (e.message || ''), { id: t });
    } finally { setSyncing(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return rows;
    return rows.filter(r =>
      (r.codigo_produto || '').toLowerCase().includes(q) ||
      (r.documento || '').toLowerCase().includes(q) ||
      (r.deposito_origem || '').toLowerCase().includes(q) ||
      (r.deposito_destino || '').toLowerCase().includes(q)
    );
  }, [rows, search]);

  return (
    <div className="flex flex-col gap-4 h-full overflow-hidden">
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar produto, depósito, documento..." className="pl-10 h-11" />
        </div>
        <Button onClick={sync} disabled={syncing} className="h-11 px-5 gap-2">
          {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Sincronizar
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-12 gap-3">
          <ArrowRightLeft className="w-10 h-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">{rows.length === 0 ? 'Nenhuma transferência. Endpoint experimental.' : 'Sem resultados.'}</p>
        </div>
      ) : (
        <div className="flex-1 overflow-auto border rounded-lg bg-card">
          <Table>
            <TableHeader className="sticky top-0 bg-card z-10">
              <TableRow>
                <TableHead>Documento</TableHead>
                <TableHead>Origem → Destino</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead className="text-right">Qtd</TableHead>
                <TableHead>Situação</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(r => (
                <TableRow key={r.id} className="cursor-pointer hover:bg-muted/40" onClick={() => setDetail(r)}>
                  <TableCell className="font-mono text-xs font-bold text-primary">{r.documento || '—'}</TableCell>
                  <TableCell className="text-xs">
                    <span className="font-mono">{r.deposito_origem || '?'}</span>
                    <ArrowRightLeft className="inline w-3 h-3 mx-1 text-muted-foreground" />
                    <span className="font-mono">{r.deposito_destino || '?'}</span>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{r.codigo_produto || '—'}</TableCell>
                  <TableCell className="text-right font-mono text-xs">{Number(r.quantidade || 0).toLocaleString('pt-BR')}</TableCell>
                  <TableCell><Badge variant="outline" className="text-[10px]">{r.ds_situacao || r.situacao || '—'}</Badge></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{r.data_movimento ? formatDateBR(r.data_movimento) : '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <TransferenciaDetailDialog
        transferencia={detail}
        open={!!detail}
        onOpenChange={(o) => !o && setDetail(null)}
      />
    </div>
  );
}
