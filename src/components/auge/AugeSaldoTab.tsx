import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { syncToast } from '@/lib/toast-flows';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, RefreshCw, Loader2, Warehouse } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { formatDateBR } from '@/lib/app-utils';
import FichaItemDialog from './FichaItemDialog';

interface AugeSaldo {
  id: string;
  codigo: string;
  descricao: string | null;
  deposito: string;
  quantidade: number;
  unidade: string | null;
  synced_at: string;
  raw?: any;
}

export default function AugeSaldoTab() {
  const [rows, setRows] = useState<AugeSaldo[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState('');
  const [dep, setDep] = useState('todos');
  const [fichaCodigo, setFichaCodigo] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const all: AugeSaldo[] = [];
      for (let from = 0; from < 20000; from += 1000) {
        const { data, error } = await supabase
          .from('auge_produtos_saldo')
          .select('*')
          .order('codigo').range(from, from + 999);
        if (error) throw error;
        const batch = (data || []) as any as AugeSaldo[];
        all.push(...batch);
        if (batch.length < 1000) break;
      }
      setRows(all);
    } catch (e: any) {
      syncToast.erro('saldo', e);
    } finally { setLoading(false); }
  };

  const sync = async () => {
    setSyncing(true);
    const t = syncToast.iniciado('saldo do Auge');
    try {
      const { data, error } = await supabase.functions.invoke('auge-sync?entity=saldo');
      if (error) throw error;
      if (data?.ok === false) throw new Error(data.error);
      const r = (data?.results ?? []).find((x: any) => x.entity === 'saldo');
      syncToast.ok('saldos', r?.upserted ?? 0, 'Saldos atualizados conforme o ERP.', { id: t });
      await load();
    } catch (e: any) {
      syncToast.erro('saldo', e, { id: t });
    } finally { setSyncing(false); }
  };

  useEffect(() => { load(); }, []);

  const depositos = useMemo(() => {
    const s = new Set<string>();
    rows.forEach(r => r.deposito && s.add(r.deposito));
    return Array.from(s).sort();
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return rows.filter(r => {
      if (dep !== 'todos' && r.deposito !== dep) return false;
      if (!q) return true;
      return (r.codigo || '').toLowerCase().includes(q) || (r.descricao || '').toLowerCase().includes(q);
    });
  }, [rows, search, dep]);

  const stats = useMemo(() => {
    const total = rows.length;
    const comSaldo = rows.filter(r => r.quantidade > 0).length;
    const totalQtd = rows.reduce((s, r) => s + (Number(r.quantidade) || 0), 0);
    return { total, comSaldo, totalQtd };
  }, [rows]);

  return (
    <div className="flex flex-col gap-4 h-full overflow-hidden">
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar código ou descrição..." className="pl-10 h-11" />
        </div>
        <Select value={dep} onValueChange={setDep}>
          <SelectTrigger className="w-full lg:w-[220px] h-11"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos depósitos</SelectItem>
            {depositos.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatBox label="Registros" value={stats.total} />
        <StatBox label="Com saldo" value={stats.comSaldo} tone="emerald" />
        <StatBox label="Qtd total" value={Math.round(stats.totalQtd)} />
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Warehouse}
          title={rows.length === 0 ? 'Nenhum saldo sincronizado' : 'Nenhum resultado para o filtro'}
          description={rows.length === 0 ? 'Sincronize com o Auge para carregar os saldos por depósito.' : 'Ajuste a busca ou limpe os filtros para encontrar o item.'}
          action={search || dep !== 'todos' ? {
            label: 'Limpar filtros',
            onClick: () => { setSearch(''); setDep('todos'); }
          } : undefined}
        />
      ) : (
        <div className="flex-1 overflow-auto border rounded-lg bg-card">
          <Table>
            <TableHeader className="sticky top-0 bg-card z-10">
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Depósito</TableHead>
                <TableHead className="w-[80px]">UM</TableHead>
                <TableHead className="text-right">Quantidade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.slice(0, 300).map(r => (
                <TableRow key={r.id} className="cursor-pointer hover:bg-muted/40" onClick={() => setFichaCodigo(r.codigo)}>
                  <TableCell className="font-mono text-xs font-bold text-primary">{r.codigo}</TableCell>
                  <TableCell className="text-xs">{r.descricao || '—'}</TableCell>
                  <TableCell><Badge variant="outline" className="text-[10px]">{r.deposito}</Badge></TableCell>
                  <TableCell className="text-xs text-center">{r.unidade || '—'}</TableCell>
                  <TableCell className={`text-xs text-right font-mono font-bold ${r.quantidade > 0 ? 'text-success' : 'text-muted-foreground'}`}>
                    {Number(r.quantidade).toLocaleString('pt-BR')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filtered.length > 300 && (
            <p className="text-center py-3 text-xs text-muted-foreground">Exibindo 300 de {filtered.length}. Filtre para refinar.</p>
          )}
        </div>
      )}

      <FichaItemDialog
        codigo={fichaCodigo}
        open={!!fichaCodigo}
        onOpenChange={(o) => !o && setFichaCodigo(null)}
      />
    </div>
  );
}

function StatBox({ label, value, tone }: { label: string; value: number; tone?: 'emerald' | 'amber' }) {
  const cls = tone === 'emerald' ? 'text-success' : tone === 'amber' ? 'text-warning' : 'text-foreground';
  return (
    <div className="bg-card/60 border border-border/40 rounded-md p-3">
      <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/60">{label}</p>
      <p className={`text-xl font-bold ${cls}`}>{value.toLocaleString('pt-BR')}</p>
    </div>
  );
}
