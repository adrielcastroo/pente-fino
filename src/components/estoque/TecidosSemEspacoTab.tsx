import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Search, PackageX, RefreshCw, Loader2, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';

interface Row {
  id: string;
  item: string;
  endereco_desejado: string;
  estrutura: string;
  coluna: string;
  nivel: number;
  proc: string | null;
  m_linear: number | null;
  largura: number | null;
  m2: number | null;
  lote: string | null;
  lote_sistema: string;
  auge_cd_item: string | null;
  synced_at: string;
}

export default function TecidosSemEspacoTab() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState('');
  const [detail, setDetail] = useState<Row | null>(null);
  const [sortKey, setSortKey] = useState<keyof Row | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const toggleSort = (key: keyof Row) => {
    if (sortKey !== key) { setSortKey(key); setSortDir('asc'); return; }
    if (sortDir === 'asc') { setSortDir('desc'); return; }
    setSortKey(null); setSortDir('asc');
  };

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tecidos_sem_espaco' as any)
      .select('*')
      .order('estrutura', { ascending: true })
      .order('coluna', { ascending: true })
      .order('nivel', { ascending: true })
      .order('synced_at', { ascending: true });
    if (error) toast.error(error.message);
    setRows((data as any) ?? []);
    setLoading(false);
  };

  const runSync = async () => {
    setSyncing(true);
    const t = toast.loading('Sincronizando tecidos do Auge…');
    try {
      const { data, error } = await supabase.functions.invoke('auge-sync?action=sync_tecidos_map', {
        method: 'POST',
      });
      if (error) throw error;
      if ((data as any)?.ok === false) throw new Error((data as any).error);
      const r = data as any;
      toast.success(
        `${r.alocados ?? 0} alocados · ${r.sem_espaco ?? 0} sem espaço`,
        { id: t },
      );
      await load();
    } catch (e: any) {
      toast.error('Falha: ' + (e.message || ''), { id: t });
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel('tecidos-sem-espaco')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tecidos_sem_espaco' }, load)
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    let out = rows;
    if (q) {
      out = out.filter(
        r =>
          r.item?.toLowerCase().includes(q) ||
          r.endereco_desejado?.toLowerCase().includes(q) ||
          r.lote_sistema?.toLowerCase().includes(q) ||
          r.proc?.toLowerCase().includes(q),
      );
    }
    if (sortKey) {
      const dir = sortDir === 'asc' ? 1 : -1;
      out = [...out].sort((a, b) => {
        const av = a[sortKey] as any;
        const bv = b[sortKey] as any;
        if (av == null && bv == null) return 0;
        if (av == null) return 1;
        if (bv == null) return -1;
        if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
        return String(av).localeCompare(String(bv), 'pt-BR', { numeric: true, sensitivity: 'base' }) * dir;
      });
    }
    return out;
  }, [rows, search, sortKey, sortDir]);

  const SortHead = ({ k, children, align }: { k: keyof Row; children: React.ReactNode; align?: 'right' }) => {
    const active = sortKey === k;
    const Icon = !active ? ArrowUpDown : sortDir === 'asc' ? ArrowUp : ArrowDown;
    return (
      <TableHead className={align === 'right' ? 'text-right' : ''}>
        <button
          type="button"
          onClick={() => toggleSort(k)}
          className={`inline-flex items-center gap-1 hover:text-foreground transition-colors ${active ? 'text-foreground font-semibold' : 'text-muted-foreground'} ${align === 'right' ? 'flex-row-reverse' : ''}`}
        >
          <span>{children}</span>
          <Icon className="w-3 h-3 opacity-70" />
        </button>
      </TableHead>
    );
  };

  return (
    <Card className="border-border/40 shadow-xl shadow-black/5 overflow-hidden ring-1 ring-black/5">
      <CardHeader className="bg-muted/30 pb-4 border-b border-border/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <PackageX className="w-5 h-5 text-warning" />
            Tecidos sem espaço
            <Badge variant="secondary" className="ml-2 font-mono font-bold">{filtered.length}</Badge>
          </CardTitle>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar item, endereço, PROC…"
                className="pl-9"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={PackageX}
            title={rows.length === 0 ? 'Todos os lotes estão alocados' : 'Nenhum resultado para o filtro'}
            description={
              rows.length === 0
                ? 'Nenhum tecido do Auge está aguardando espaço no mapa.'
                : 'Ajuste a busca por item, endereço ou PROC para encontrar o lote.'
            }
          />
        ) : (
          <div className="overflow-auto max-h-[calc(100vh-320px)]">
            <Table>
              <TableHeader className="sticky top-0 bg-card z-10">
                <TableRow>
                  <SortHead k="endereco_desejado">Endereço desejado</SortHead>
                  <SortHead k="item">Item</SortHead>
                  <SortHead k="proc">PROC / NF</SortHead>
                  <SortHead k="m_linear" align="right">M lin</SortHead>
                  <SortHead k="largura" align="right">Largura</SortHead>
                  <SortHead k="m2" align="right">m²</SortHead>
                  <SortHead k="lote_sistema">Lote sistema</SortHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(r => (
                  <TableRow
                    key={r.id}
                    className="cursor-pointer hover:bg-muted/40"
                    onClick={() => setDetail(r)}
                  >
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-[11px]">{r.endereco_desejado}</Badge>
                    </TableCell>
                    <TableCell className="max-w-[280px] truncate font-medium text-xs">{r.item}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{r.proc || '—'}</TableCell>
                    <TableCell className="text-right font-mono text-xs">{r.m_linear?.toLocaleString('pt-BR') ?? '—'}</TableCell>
                    <TableCell className="text-right font-mono text-xs">{r.largura?.toLocaleString('pt-BR') ?? '—'}</TableCell>
                    <TableCell className="text-right font-mono text-xs">{r.m2?.toLocaleString('pt-BR') ?? '—'}</TableCell>
                    <TableCell className="font-mono text-[11px] truncate max-w-[220px]">{r.lote_sistema}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <Dialog open={!!detail} onOpenChange={o => !o && setDetail(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PackageX className="w-5 h-5 text-warning" />
              Tecido sem espaço
            </DialogTitle>
            <DialogDescription>
              Este tecido está aguardando espaço livre em {detail?.endereco_desejado}. Ele será
              alocado automaticamente quando alguma posição for liberada.
            </DialogDescription>
          </DialogHeader>
          {detail && (
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Field label="Endereço" value={detail.endereco_desejado} mono />
              <Field label="Código Auge" value={detail.auge_cd_item} mono />
              <Field label="Item" value={detail.item} full />
              <Field label="PROC / NF" value={detail.proc || '—'} />
              <Field label="Lote" value={detail.lote} mono />
              <Field label="M linear" value={detail.m_linear?.toLocaleString('pt-BR')} />
              <Field label="Largura" value={detail.largura?.toLocaleString('pt-BR')} />
              <Field label="m²" value={detail.m2?.toLocaleString('pt-BR')} />
              <Field label="Lote sistema (completo)" value={detail.lote_sistema} full mono />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function Field({ label, value, mono, full }: { label: string; value: any; mono?: boolean; full?: boolean }) {
  return (
    <div className={full ? 'col-span-2' : ''}>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`text-sm ${mono ? 'font-mono' : ''} break-words`}>{value ?? '—'}</div>
    </div>
  );
}
