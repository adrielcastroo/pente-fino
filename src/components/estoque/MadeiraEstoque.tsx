import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { TreePine, AlertTriangle, MapPin, Search, Loader2, Package } from '@/components/icons';
import { lotesMestresService, type LoteMestre } from '@/services/lotesMestresService';
import { formatDateBR } from '@/lib/app-utils';
import { toast } from 'sonner';

interface MadeiraRow {
  id: string;
  item: string;
  nf: string;
  endereco: string | null;
  lote: string | null;
  lote_sistema: string | null;
  largura: number | null;
  m_linear: number | null;
  m2: number | null;
  tipo_tecido: string | null;
  lote_mestre_id: string | null;
  avaria_tipo: string | null;
  avaria_descricao: string | null;
  avaria_foto_url: string | null;
  created_at: string;
  edited_by: string | null;
}

const AVARIA_LABELS: Record<string, string> = {
  riscado: 'Riscado',
  manchado: 'Manchado',
  quebrado: 'Quebrado',
  outro: 'Outro',
};

export default function MadeiraEstoque() {
  const [rows, setRows] = useState<MadeiraRow[]>([]);
  const [lotes, setLotes] = useState<LoteMestre[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterLote, setFilterLote] = useState<string | null>(null);
  const [onlyAvarias, setOnlyAvarias] = useState(false);
  const [detail, setDetail] = useState<MadeiraRow | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const [{ data, error }, lotesData] = await Promise.all([
          supabase
            .from('registros')
            .select('id, item, nf, endereco, lote, lote_sistema, largura, m_linear, m2, tipo_tecido, lote_mestre_id, avaria_tipo, avaria_descricao, avaria_foto_url, created_at, edited_by')
            .eq('modo_origem', 'madeira')
            .order('created_at', { ascending: false }),
          lotesMestresService.list().catch(() => []),
        ]);
        if (error) throw error;
        if (!mounted) return;
        setRows((data as any[] as MadeiraRow[]) || []);
        setLotes(lotesData);
      } catch (e: any) {
        toast.error('Erro ao carregar madeira: ' + (e.message || ''));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const lotesById = useMemo(() => {
    const m: Record<string, LoteMestre> = {};
    lotes.forEach(l => { m[l.id] = l; });
    return m;
  }, [lotes]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter(r => {
      if (filterLote && r.lote_mestre_id !== filterLote) return false;
      if (onlyAvarias && !r.avaria_tipo) return false;
      if (!q) return true;
      return (
        (r.item || '').toLowerCase().includes(q) ||
        (r.nf || '').toLowerCase().includes(q) ||
        (r.endereco || '').toLowerCase().includes(q) ||
        (r.lote || '').toLowerCase().includes(q)
      );
    });
  }, [rows, search, filterLote, onlyAvarias]);

  const stats = useMemo(() => ({
    total: rows.length,
    avarias: rows.filter(r => r.avaria_tipo).length,
    laminas: rows.filter(r => r.tipo_tecido === 'Lâmina').length,
    bases: rows.filter(r => r.tipo_tecido === 'Base').length,
    bandos: rows.filter(r => r.tipo_tecido === 'Bandô').length,
  }), [rows]);

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="overflow-x-auto pb-2 -mx-2 px-2 sm:mx-0 sm:px-0 custom-scrollbar overscroll-x-contain">
        <div className="flex sm:grid sm:grid-cols-5 gap-3 min-w-max sm:min-w-0">
          {[
            { label: 'Total', value: stats.total, color: 'text-foreground' },
            { label: 'Lâminas', value: stats.laminas, color: 'text-emerald-400' },
            { label: 'Bases', value: stats.bases, color: 'text-cyan-400' },
            { label: 'Bandôs', value: stats.bandos, color: 'text-violet-400' },
            { label: 'Avarias', value: stats.avarias, color: 'text-red-400' },
          ].map((s) => (
            <Card key={s.label} className="border border-border/30 bg-card/40 shadow-none shrink-0 w-[120px] sm:w-auto">
              <CardContent className="p-4 text-center space-y-1">
                <div className={`text-2xl sm:text-3xl font-semibold tabular-nums ${s.color}`}>{s.value}</div>
                <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.15em]">{s.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Legenda Lotes Mestres */}
      {lotes.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 p-3 rounded-md border border-border/30 bg-muted/20">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mr-1">Tonalidades:</span>
          <button
            onClick={() => setFilterLote(null)}
            className={`text-[11px] font-semibold px-2.5 py-1 rounded-md border transition ${!filterLote ? 'border-primary bg-primary/10 text-primary' : 'border-border/40 text-muted-foreground hover:text-foreground'}`}
          >
            Todas
          </button>
          {lotes.map(l => (
            <button
              key={l.id}
              onClick={() => setFilterLote(prev => prev === l.id ? null : l.id)}
              className={`flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-md border transition ${filterLote === l.id ? 'border-primary bg-primary/10 text-primary' : 'border-border/40 text-muted-foreground hover:text-foreground'}`}
            >
              <span className="w-3 h-3 rounded-full border border-border/50" style={{ background: l.cor_hex }} />
              {l.nome}
            </button>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar item, NF, endereço, lote..."
            className="pl-9 h-11"
          />
        </div>
        <Button
          variant={onlyAvarias ? 'default' : 'outline'}
          onClick={() => setOnlyAvarias(v => !v)}
          className="h-11 gap-2"
        >
          <AlertTriangle className="w-4 h-4" />
          Apenas com avarias
        </Button>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground gap-3">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm font-semibold">Carregando madeira...</span>
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border border-dashed border-border/40 bg-transparent">
          <CardContent className="p-2">
            <EmptyState
              icon={TreePine}
              title="Nenhum item de madeira encontrado"
              description="Registre lâminas, bases ou bandôs pela aba Madeira para visualizá-los aqui."
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(r => {
            const lote = r.lote_mestre_id ? lotesById[r.lote_mestre_id] : null;
            return (
              <Card
                key={r.id}
                onClick={() => setDetail(r)}
                className="border border-border/40 bg-card/40 hover:border-primary/40 hover:bg-primary/5 transition cursor-pointer"
              >
                <CardContent className="p-4 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <TreePine className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="text-sm font-bold truncate">{r.item || '—'}</span>
                    </div>
                    {r.avaria_tipo && (
                      <Badge variant="destructive" className="text-[9px] gap-1 shrink-0">
                        <AlertTriangle className="w-3 h-3" />
                        {AVARIA_LABELS[r.avaria_tipo] || r.avaria_tipo}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <MapPin className="w-3 h-3" />
                    <span className="font-mono">{r.endereco || 'Sem endereço'}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    {lote ? (
                      <span className="flex items-center gap-1.5 text-[11px] font-semibold">
                        <span className="w-3 h-3 rounded-full border border-border/50" style={{ background: lote.cor_hex }} />
                        {lote.nome}
                      </span>
                    ) : (
                      <span className="text-[11px] text-muted-foreground/60">Sem tonalidade</span>
                    )}
                    {r.tipo_tecido && (
                      <Badge variant="outline" className="text-[9px]">{r.tipo_tecido}</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!detail} onOpenChange={o => !o && setDetail(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {detail?.item || 'Item Madeira'}
            </DialogTitle>
            <DialogDescription>Detalhes do registro de madeira</DialogDescription>
          </DialogHeader>
          {detail && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Endereço" value={detail.endereco || '—'} mono />
                <Field label="Tipo" value={detail.tipo_tecido || '—'} />
                <Field label="NF" value={detail.nf || '—'} />
                <Field label="Lote" value={detail.lote || '—'} />
                <Field label="Largura" value={detail.largura ? `${detail.largura} m` : '—'} />
                <Field label="M Linear" value={detail.m_linear ? `${detail.m_linear} m` : '—'} />
                <Field label="Conferente" value={detail.edited_by || '—'} />
                <Field label="Data" value={formatDateBR(detail.created_at)} />
              </div>
              {detail.lote_mestre_id && lotesById[detail.lote_mestre_id] && (
                <div className="p-3 rounded-lg border border-border/40 bg-muted/20 flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full border border-border/50" style={{ background: lotesById[detail.lote_mestre_id].cor_hex }} />
                  <span className="text-sm font-semibold">{lotesById[detail.lote_mestre_id].nome}</span>
                </div>
              )}
              {detail.avaria_tipo && (
                <div className="p-3 rounded-lg border border-destructive/40 bg-destructive/10 space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-destructive" />
                    <span className="text-sm font-bold text-destructive">
                      Avaria: {AVARIA_LABELS[detail.avaria_tipo] || detail.avaria_tipo}
                    </span>
                  </div>
                  {detail.avaria_descricao && (
                    <p className="text-xs text-muted-foreground whitespace-pre-wrap">{detail.avaria_descricao}</p>
                  )}
                  {detail.avaria_foto_url && (
                    <a href={detail.avaria_foto_url} target="_blank" rel="noreferrer" className="block">
                      <img src={detail.avaria_foto_url} alt="Avaria" className="w-full h-40 object-cover rounded-md border border-border/40" />
                    </a>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="space-y-0.5">
      <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={`text-sm font-semibold break-words ${mono ? 'font-mono' : ''}`}>{value}</div>
    </div>
  );
}
