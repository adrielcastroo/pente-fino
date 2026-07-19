import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RefreshCw, Loader2, Search, AlertTriangle, CheckCircle2, XCircle } from '@/components/icons';

interface Row {
  codigo: string;
  desc_interno: string | null;
  desc_auge: string | null;
  ativo_auge: boolean | null;
  qt_disp: number | null;
  status: 'ok' | 'divergente' | 'inativo' | 'ausente_auge' | 'ausente_interno';
}

export default function AugeReconciliacaoTab() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('divergentes');

  const load = async () => {
    setLoading(true);
    try {
      const fetchAll = async (table: string, cols: string) => {
        const all: any[] = [];
        for (let from = 0; from < 30000; from += 1000) {
          const { data, error } = await (supabase as any).from(table).select(cols).range(from, from + 999);
          if (error) throw error;
          all.push(...(data || []));
          if ((data || []).length < 1000) break;
        }
        return all;
      };
      const [internos, augeItens] = await Promise.all([
        fetchAll('itens_cadastro', 'codigo_interno, descricao'),
        fetchAll('auge_produtos', 'codigo, descricao, ativo, qt_disponivel'),
      ]);
      const mapAuge = new Map(augeItens.map((a: any) => [String(a.codigo).trim().toUpperCase(), a]));
      const mapInt = new Map(internos.map((i: any) => [String(i.codigo_interno).trim().toUpperCase(), i]));

      const norm = (s: any) => String(s ?? '').trim().toLowerCase();
      const out: Row[] = [];

      for (const [code, i] of mapInt) {
        const a = mapAuge.get(code);
        if (!a) {
          out.push({ codigo: code, desc_interno: i.descricao, desc_auge: null, ativo_auge: null, qt_disp: null, status: 'ausente_auge' });
        } else if (a.ativo === false) {
          out.push({ codigo: code, desc_interno: i.descricao, desc_auge: a.descricao, ativo_auge: false, qt_disp: a.qt_disponivel, status: 'inativo' });
        } else if (norm(i.descricao) !== norm(a.descricao) && i.descricao && a.descricao) {
          out.push({ codigo: code, desc_interno: i.descricao, desc_auge: a.descricao, ativo_auge: a.ativo, qt_disp: a.qt_disponivel, status: 'divergente' });
        } else {
          out.push({ codigo: code, desc_interno: i.descricao, desc_auge: a.descricao, ativo_auge: a.ativo, qt_disp: a.qt_disponivel, status: 'ok' });
        }
      }
      for (const [code, a] of mapAuge) {
        if (!mapInt.has(code) && a.ativo !== false && (a.qt_disponivel ?? 0) > 0) {
          out.push({ codigo: code, desc_interno: null, desc_auge: a.descricao, ativo_auge: a.ativo, qt_disp: a.qt_disponivel, status: 'ausente_interno' });
        }
      }
      setRows(out);
    } catch (e: any) {
      toast.error('Erro: ' + (e.message || ''));
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return rows.filter(r => {
      if (statusFilter !== 'todos') {
        if (statusFilter === 'divergentes' && r.status === 'ok') return false;
        if (statusFilter !== 'divergentes' && r.status !== statusFilter) return false;
      }
      if (!q) return true;
      return r.codigo.toLowerCase().includes(q) ||
        (r.desc_interno || '').toLowerCase().includes(q) ||
        (r.desc_auge || '').toLowerCase().includes(q);
    });
  }, [rows, search, statusFilter]);

  const stats = useMemo(() => ({
    total: rows.length,
    ok: rows.filter(r => r.status === 'ok').length,
    divergente: rows.filter(r => r.status === 'divergente').length,
    inativo: rows.filter(r => r.status === 'inativo').length,
    ausente_auge: rows.filter(r => r.status === 'ausente_auge').length,
    ausente_interno: rows.filter(r => r.status === 'ausente_interno').length,
  }), [rows]);

  return (
    <div className="flex flex-col gap-4 h-full overflow-hidden">
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar código ou descrição..." className="pl-10 h-11" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full lg:w-[220px] h-11"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="divergentes">Só divergentes</SelectItem>
            <SelectItem value="ok">OK</SelectItem>
            <SelectItem value="divergente">Descrição diferente</SelectItem>
            <SelectItem value="inativo">Inativo no Auge</SelectItem>
            <SelectItem value="ausente_auge">Ausente no Auge</SelectItem>
            <SelectItem value="ausente_interno">Ausente no Pente Fino</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={load} disabled={loading} variant="outline" className="h-11 px-5 gap-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Reprocessar
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatBox label="Total" value={stats.total} />
        <StatBox label="OK" value={stats.ok} tone="emerald" />
        <StatBox label="Descrição div." value={stats.divergente} tone="amber" />
        <StatBox label="Ausentes Auge" value={stats.ausente_auge} tone="red" />
        <StatBox label="Só no Auge" value={stats.ausente_interno} tone="amber" />
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="flex-1 overflow-auto border rounded-lg bg-card">
          <Table>
            <TableHeader className="sticky top-0 bg-card z-10">
              <TableRow>
                <TableHead className="w-[140px]">Código</TableHead>
                <TableHead>Descrição interna</TableHead>
                <TableHead>Descrição Auge</TableHead>
                <TableHead className="w-[100px] text-right">Qt Auge</TableHead>
                <TableHead className="w-[160px]">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.slice(0, 300).map(r => (
                <TableRow key={r.codigo}>
                  <TableCell className="font-mono text-xs font-bold text-primary">{r.codigo}</TableCell>
                  <TableCell className="text-xs">{r.desc_interno || <span className="text-muted-foreground/40">—</span>}</TableCell>
                  <TableCell className="text-xs">{r.desc_auge || <span className="text-muted-foreground/40">—</span>}</TableCell>
                  <TableCell className="text-right font-mono text-xs">{r.qt_disp != null ? Number(r.qt_disp).toLocaleString('pt-BR') : '—'}</TableCell>
                  <TableCell><StatusBadge status={r.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filtered.length > 300 && (
            <p className="text-center py-3 text-xs text-muted-foreground">Exibindo 300 de {filtered.length}.</p>
          )}
        </div>
      )}
    </div>
  );
}

function StatBox({ label, value, tone }: { label: string; value: number; tone?: 'emerald' | 'amber' | 'red' }) {
  const cls = tone === 'emerald' ? 'text-emerald-500' : tone === 'amber' ? 'text-amber-500' : tone === 'red' ? 'text-red-500' : 'text-foreground';
  return (
    <div className="bg-card/60 border border-border/40 rounded-md p-3">
      <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/60">{label}</p>
      <p className={`text-xl font-bold ${cls}`}>{value.toLocaleString('pt-BR')}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: Row['status'] }) {
  const map = {
    ok: { icon: CheckCircle2, cls: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30', label: 'OK' },
    divergente: { icon: AlertTriangle, cls: 'bg-amber-500/10 text-amber-500 border-amber-500/30', label: 'Descrição div.' },
    inativo: { icon: XCircle, cls: 'bg-slate-500/10 text-slate-400 border-slate-500/30', label: 'Inativo Auge' },
    ausente_auge: { icon: XCircle, cls: 'bg-red-500/10 text-red-500 border-red-500/30', label: 'Só no interno' },
    ausente_interno: { icon: AlertTriangle, cls: 'bg-blue-500/10 text-blue-400 border-blue-500/30', label: 'Só no Auge' },
  };
  const { icon: Icon, cls, label } = map[status];
  return <Badge className={`text-[10px] gap-1 ${cls}`}><Icon className="w-3 h-3" />{label}</Badge>;
}
