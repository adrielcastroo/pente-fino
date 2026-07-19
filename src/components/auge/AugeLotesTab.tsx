import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RefreshCw, Loader2, Package, Search } from 'lucide-react';
import { formatDateBR } from '@/lib/app-utils';
import AugeDetailDialog from './AugeDetailDialog';

export default function AugeLotesTab() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState('');
  const [detail, setDetail] = useState<any | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any).from('auge_lotes').select('*').order('data_validade', { nullsFirst: false }).limit(1000);
    if (error) toast.error(error.message);
    setRows(data || []);
    setLoading(false);
  };

  const sync = async () => {
    setSyncing(true);
    const t = toast.loading('Sincronizando lotes...');
    try {
      const { data, error } = await supabase.functions.invoke('auge-sync?entity=lotes');
      if (error) throw error;
      if (data?.ok === false) throw new Error(data.error);
      const r = (data?.results ?? []).find((x: any) => x.entity === 'lotes');
      if (r?.error) throw new Error(r.error);
      toast.success(`${r?.upserted ?? 0} lotes sincronizados`, { id: t });
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
      (r.lote || '').toLowerCase().includes(q)
    );
  }, [rows, search]);

  const today = new Date();
  const daysTo = (d: string | null) => d ? Math.floor((new Date(d).getTime() - today.getTime()) / 86400000) : null;

  return (
    <div className="flex flex-col gap-4 h-full overflow-hidden">
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar código ou lote..." className="pl-10 h-11" />
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
          <Package className="w-10 h-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">{rows.length === 0 ? 'Nenhum lote. Endpoint experimental — envie o HAR se falhar.' : 'Sem resultados.'}</p>
        </div>
      ) : (
        <div className="flex-1 overflow-auto border rounded-lg bg-card">
          <Table>
            <TableHeader className="sticky top-0 bg-card z-10">
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Lote</TableHead>
                <TableHead>Depósito</TableHead>
                <TableHead className="text-right">Qtd</TableHead>
                <TableHead>Fabricação</TableHead>
                <TableHead>Validade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(r => {
                const dt = daysTo(r.data_validade);
                const tone = dt == null ? '' : dt < 0 ? 'text-destructive' : dt < 30 ? 'text-warning' : 'text-success';
                return (
                  <TableRow key={r.id} className="cursor-pointer hover:bg-muted/40" onClick={() => setDetail(r)}>
                    <TableCell className="font-mono text-xs font-bold text-primary">{r.codigo_produto}</TableCell>
                    <TableCell className="font-mono text-xs">{r.lote}</TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px]">{r.deposito || '—'}</Badge></TableCell>
                    <TableCell className="text-right font-mono text-xs">{Number(r.quantidade || 0).toLocaleString('pt-BR')}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{r.data_fabricacao ? formatDateBR(r.data_fabricacao) : '—'}</TableCell>
                    <TableCell className={`text-xs ${tone}`}>
                      {r.data_validade ? formatDateBR(r.data_validade) : '—'}
                      {dt != null && dt < 30 && <span className="ml-1 text-[10px]">({dt}d)</span>}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {detail && (
        <AugeDetailDialog
          open={!!detail} onOpenChange={v => !v && setDetail(null)}
          title={`${detail.codigo_produto} · ${detail.lote}`}
          syncedAt={detail.synced_at}
          fields={[
            { label: 'Produto', value: detail.codigo_produto, mono: true },
            { label: 'Lote', value: detail.lote, mono: true },
            { label: 'Depósito', value: detail.deposito },
            { label: 'Quantidade', value: detail.quantidade },
            { label: 'Fabricação', value: detail.data_fabricacao ? formatDateBR(detail.data_fabricacao) : null },
            { label: 'Validade', value: detail.data_validade ? formatDateBR(detail.data_validade) : null },
          ]}
          raw={detail.raw}
        />
      )}
    </div>
  );
}
