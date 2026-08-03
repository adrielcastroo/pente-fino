import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { syncToast } from '@/lib/toast-flows';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RefreshCw, Loader2, Warehouse } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import AugeDetailDialog from './AugeDetailDialog';

export default function AugeDepositosTab() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [detail, setDetail] = useState<any | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any).from('auge_depositos').select('*').order('codigo').limit(500);
    if (error) syncToast.erro('depósitos', error);
    setRows(data || []);
    setLoading(false);
  };

  const sync = async () => {
    setSyncing(true);
    const t = syncToast.iniciado('depósitos');
    try {
      const { data, error } = await supabase.functions.invoke('auge-sync?entity=depositos');
      if (error) throw error;
      if (data?.ok === false) throw new Error(data.error);
      const r = (data?.results ?? []).find((x: any) => x.entity === 'depositos');
      if (r?.error) throw new Error(r.error);
      syncToast.ok('depósitos', r?.upserted ?? 0, 'Estrutura de depósitos atualizada.', { id: t });
      await load();
    } catch (e: any) {
      syncToast.erro('depósitos', e, { id: t });
    } finally { setSyncing(false); }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="flex flex-col gap-4 h-full overflow-hidden">
      <div className="flex justify-between items-center gap-3">
        <p className="text-xs text-muted-foreground">
          {rows.length} depósito(s). Endpoint experimental — se falhar, envie o HAR.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={Warehouse}
          title="Nenhum depósito sincronizado"
          description="Sincronize com o Auge para listar os depósitos disponíveis no ERP."
        />
      ) : (
        <div className="flex-1 overflow-auto border rounded-lg bg-card">
          <Table>
            <TableHeader className="sticky top-0 bg-card z-10">
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Localização</TableHead>
                <TableHead>Empresa/Filial</TableHead>
                <TableHead className="w-[80px] text-center">Ativo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(r => (
                <TableRow key={r.id} className="cursor-pointer hover:bg-muted/40" onClick={() => setDetail(r)}>
                  <TableCell className="font-mono text-xs font-bold text-primary">{r.codigo}</TableCell>
                  <TableCell className="text-xs">{r.nome || '—'}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{r.localizacao || '—'}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {[r.empresa, r.filial].filter(Boolean).join(' / ') || '—'}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={r.ativo ? 'default' : 'outline'} className="text-[10px]">
                      {r.ativo ? 'Sim' : 'Não'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {detail && (
        <AugeDetailDialog
          open={!!detail} onOpenChange={v => !v && setDetail(null)}
          title={detail.codigo} subtitle={detail.nome}
          syncedAt={detail.synced_at}
          fields={[
            { label: 'Nome', value: detail.nome, span: 2 },
            { label: 'Localização', value: detail.localizacao },
            { label: 'Tipo', value: detail.tipo },
            { label: 'Empresa', value: detail.empresa },
            { label: 'Filial', value: detail.filial },
            { label: 'Ativo', value: detail.ativo ? 'Sim' : 'Não' },
          ]}
          raw={detail.raw}
        />
      )}
    </div>
  );
}
