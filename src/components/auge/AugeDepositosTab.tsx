import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RefreshCw, Loader2, Warehouse } from 'lucide-react';
import AugeDetailDialog from './AugeDetailDialog';

export default function AugeDepositosTab() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [detail, setDetail] = useState<any | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any).from('auge_depositos').select('*').order('codigo').limit(500);
    if (error) toast.error(error.message);
    setRows(data || []);
    setLoading(false);
  };

  const sync = async () => {
    setSyncing(true);
    const t = toast.loading('Sincronizando depósitos...');
    try {
      const { data, error } = await supabase.functions.invoke('auge-sync?entity=depositos');
      if (error) throw error;
      if (data?.ok === false) throw new Error(data.error);
      const r = (data?.results ?? []).find((x: any) => x.entity === 'depositos');
      if (r?.error) throw new Error(r.error);
      toast.success(`${r?.upserted ?? 0} depósitos sincronizados`, { id: t });
      await load();
    } catch (e: any) {
      toast.error('Falha: ' + (e.message || ''), { id: t });
    } finally { setSyncing(false); }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="flex flex-col gap-4 h-full overflow-hidden">
      <div className="flex justify-between items-center gap-3">
        <p className="text-xs text-muted-foreground">
          {rows.length} depósito(s). Endpoint experimental — se falhar, envie o HAR.
        </p>
        <Button onClick={sync} disabled={syncing} className="h-10 gap-2">
          {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Sincronizar
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center py-12 gap-3">
          <Warehouse className="w-10 h-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">Nenhum depósito. Clique em Sincronizar.</p>
        </div>
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
