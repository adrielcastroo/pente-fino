import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { PageShell, PageHeader } from '@/components/compras/ui';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import {
  Plus, FileSpreadsheet, MoreVertical, Pencil, Trash2, Printer, ChevronDown, ChevronRight, Palette, FileText, Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { exportRomaneioXLSX } from '@/lib/compras/starcolorRomaneioExport';

type RomaneioStatus = 'rascunho' | 'gerado' | 'enviado' | 'retornou' | 'finalizado';

interface RomaneioRow {
  id: string;
  numero: string;
  numero_nf: string;
  cor: string;
  data_emissao: string;
  servico_adicional: string | null;
  acabamento: string | null;
  observacoes: string | null;
  status: RomaneioStatus;
  created_at: string;
}

interface ItemRow {
  id: string;
  romaneio_id: string;
  ordem: number;
  codigo: string | null;
  qtd_pecas: number | null;
  tam_barras: number | null;
  peso_liq: number | null;
  op_texto: string | null;
  compras_starcolor_ops?: { numero_op: string } | null;
}

const STATUS_META: Record<RomaneioStatus, { label: string; className: string }> = {
  rascunho:   { label: 'Rascunho',   className: 'bg-muted text-muted-foreground' },
  gerado:     { label: 'Gerado',     className: 'bg-primary/15 text-primary' },
  enviado:    { label: 'Enviado',    className: 'bg-amber-500/15 text-warning dark:text-warning' },
  retornou:   { label: 'Retornou',   className: 'bg-blue-500/15 text-blue-600 dark:text-blue-400' },
  finalizado: { label: 'Finalizado', className: 'bg-emerald-500/15 text-success dark:text-success' },
};

const fmtDate = (iso: string | null) => {
  if (!iso) return '—';
  const [y, m, d] = iso.split('T')[0].split('-');
  return y && m && d ? `${d}/${m}/${y}` : iso;
};
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : Number(v) || 0);

async function fetchAllItens(romaneioIds: string[]): Promise<ItemRow[]> {
  if (!romaneioIds.length) return [];
  const { data, error } = await supabase
    .from('compras_starcolor_romaneio_itens')
    .select('*, compras_starcolor_ops(numero_op)')
    .in('romaneio_id', romaneioIds)
    .order('ordem');
  if (error) throw error;
  return (data ?? []) as unknown as ItemRow[];
}

export default function RomaneiosStarcolorPage() {
  const qc = useQueryClient();
  const nav = useNavigate();
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [exportingId, setExportingId] = useState<string | null>(null);

  const romsQ = useQuery({
    queryKey: ['compras', 'starcolor', 'romaneios'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('compras_starcolor_romaneios')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as RomaneioRow[];
    },
  });

  const romaneios = romsQ.data ?? [];

  const itensQ = useQuery({
    queryKey: ['compras', 'starcolor', 'romaneio_itens', romaneios.map(r => r.id).join(',')],
    queryFn: () => fetchAllItens(romaneios.map(r => r.id)),
    enabled: romaneios.length > 0,
  });

  const itensByRomaneio = useMemo(() => {
    const map = new Map<string, ItemRow[]>();
    for (const it of itensQ.data ?? []) {
      const arr = map.get(it.romaneio_id) ?? [];
      arr.push(it);
      map.set(it.romaneio_id, arr);
    }
    return map;
  }, [itensQ.data]);

  // Agrupar por NF
  const groups = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = q
      ? romaneios.filter(r =>
          r.numero_nf?.toLowerCase().includes(q) ||
          r.cor?.toLowerCase().includes(q) ||
          r.numero?.toLowerCase().includes(q),
        )
      : romaneios;

    const byNf = new Map<string, RomaneioRow[]>();
    for (const r of filtered) {
      const arr = byNf.get(r.numero_nf) ?? [];
      arr.push(r);
      byNf.set(r.numero_nf, arr);
    }
    return Array.from(byNf.entries()).map(([nf, list]) => ({ nf, list }));
  }, [romaneios, search]);

  const toggle = (nf: string) =>
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(nf) ? next.delete(nf) : next.add(nf);
      return next;
    });

  const delMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('compras_starcolor_romaneios')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['compras', 'starcolor', 'romaneios'] });
      toast.success('Romaneio excluído');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleDelete = (r: RomaneioRow) => {
    if (confirm(`Excluir romaneio ${r.numero} — ${r.cor}?`)) delMut.mutate(r.id);
  };

  const handleExport = async (r: RomaneioRow) => {
    setExportingId(r.id);
    try {
      let itens = itensByRomaneio.get(r.id);
      if (!itens) {
        const fetched = await fetchAllItens([r.id]);
        itens = fetched;
      }
      exportRomaneioXLSX({
        numero: r.numero,
        numero_nf: r.numero_nf,
        cor: r.cor,
        data_emissao: r.data_emissao,
        servico_adicional: r.servico_adicional,
        acabamento: r.acabamento,
        observacoes: r.observacoes,
        itens: (itens ?? []).map(it => ({
          codigo: it.codigo,
          qtd_pecas: it.qtd_pecas,
          tam_barras: it.tam_barras,
          peso_liq: it.peso_liq,
          op: it.compras_starcolor_ops?.numero_op ?? it.op_texto ?? '',
        })),
      });
      toast.success('Romaneio exportado');
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setExportingId(null);
    }
  };

  const handleExportGroup = async (nf: string, list: RomaneioRow[]) => {
    for (const r of list) await handleExport(r);
    toast.success(`${list.length} romaneio(s) da NF ${nf} exportado(s)`);
  };

  return (
    <PageShell>
      <PageHeader
        title="Romaneios Starcolor"
        subtitle="Gere um romaneio por cor. NFs com múltiplas cores ficam agrupadas."
        actions={
          <Button size="sm" onClick={() => nav('/compras/acompanhamentos/starcolor/romaneios/novo')}>
            <Plus className="w-4 h-4 mr-1" /> Novo Romaneio
          </Button>
        }
      />

      <div className="flex items-center gap-2">
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por NF, cor ou nº do romaneio..."
          className="max-w-sm"
        />
        <div className="ml-auto text-xs text-muted-foreground tabular-nums">
          {romaneios.length} romaneio(s) · {groups.length} NF(s)
        </div>
      </div>

      {romsQ.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 rounded-md bg-muted animate-pulse" />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Nenhum romaneio cadastrado. Clique em <span className="font-medium">Novo Romaneio</span> para começar.
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map(({ nf, list }) => {
            const isOpen = expanded.has(nf);
            const cores = list.map(r => r.cor).join(' · ');
            return (
              <div key={nf} className="rounded-lg border border-border bg-card overflow-hidden">
                <button
                  onClick={() => toggle(nf)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors text-left"
                >
                  {isOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-primary shrink-0" />
                    <div className="font-semibold">NF {nf}</div>
                  </div>
                  <Badge variant="secondary" className="tabular-nums">{list.length} cor(es)</Badge>
                  <div className="text-xs text-muted-foreground truncate hidden sm:block">{cores}</div>
                  <div className="ml-auto flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8"
                      onClick={e => { e.stopPropagation(); handleExportGroup(nf, list); }}
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 mr-1" /> Exportar todos
                    </Button>
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-border/60 divide-y divide-border/60">
                    {list.map(r => {
                      const itens = itensByRomaneio.get(r.id) ?? [];
                      const totalPeso = itens.reduce((s, i) => s + num(i.peso_liq), 0);
                      const totalMetro = itens.reduce((s, i) => s + num(i.qtd_pecas) * num(i.tam_barras), 0);
                      const meta = STATUS_META[r.status];
                      return (
                        <div key={r.id} className="px-4 py-3 flex items-center gap-3 hover:bg-muted/20 transition-colors">
                          <div className="w-1.5 h-10 rounded bg-primary/60 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Palette className="w-3.5 h-3.5 text-muted-foreground" />
                              <span className="font-medium">{r.cor}</span>
                              <span className="text-xs text-muted-foreground">· {r.numero}</span>
                              <Badge className={cn('text-[10px] uppercase', meta.className)} variant="secondary">
                                {meta.label}
                              </Badge>
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5 flex flex-wrap gap-x-3">
                              <span>Emissão: {fmtDate(r.data_emissao)}</span>
                              <span>{itens.length} itens</span>
                              <span className="tabular-nums">{totalPeso.toFixed(2)} kg</span>
                              <span className="tabular-nums">{totalMetro.toFixed(2)} m</span>
                            </div>
                          </div>

                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8"
                            disabled={exportingId === r.id}
                            onClick={() => handleExport(r)}
                          >
                            {exportingId === r.id ? (
                              <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                            ) : (
                              <FileSpreadsheet className="w-3.5 h-3.5 mr-1" />
                            )}
                            XLSX
                          </Button>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link to={`/compras/acompanhamentos/starcolor/romaneios/${r.id}`}>
                                  <Pencil className="w-3.5 h-3.5 mr-2" /> Editar
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => window.print()}>
                                <Printer className="w-3.5 h-3.5 mr-2" /> Imprimir
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDelete(r)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="w-3.5 h-3.5 mr-2" /> Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
