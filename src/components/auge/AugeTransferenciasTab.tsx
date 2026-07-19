import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { RefreshCw, Loader2, ArrowRightLeft, Search, Plus, Zap, MoreVertical, Pencil, Copy, Trash2 } from 'lucide-react';
import { formatDateBR } from '@/lib/app-utils';
import { formatQty } from '@/lib/utils';
import TransferenciaDetailDialog from './TransferenciaDetailDialog';
import NovaTransferenciaDialog, { type TransfDialogInitial, type TransfDialogMode } from './NovaTransferenciaDialog';

type Filtro = 'todos' | 'rascunho' | 'efetivada';

export default function AugeTransferenciasTab({
  autoInitial,
  onAutoInitialConsumed,
}: {
  autoInitial?: TransfDialogInitial | null;
  onAutoInitialConsumed?: () => void;
} = {}) {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [detail, setDetail] = useState<any | null>(null);

  // Dialog Nova/Editar/Duplicar
  const [dialogMode, setDialogMode] = useState<TransfDialogMode>('novo');
  const [dialogInitial, setDialogInitial] = useState<TransfDialogInitial | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Abre automaticamente quando vier initial de fora (ex.: /historico → Transferir)
  useEffect(() => {
    if (autoInitial) {
      setDialogMode('novo');
      setDialogInitial(autoInitial);
      setDialogOpen(true);
      onAutoInitialConsumed?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoInitial]);

  const isRascunho = (r: any) =>
    r.situacao === 'D' || r.situacao === '10' || r.situacao === 10 ||
    /rascunho|edi[çc][ãa]o|digit/i.test(r.ds_situacao ?? '');
  const isEfetivada = (r: any) => !!r.nr_efetivacao || /efetiv/i.test(r.ds_situacao ?? '');

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

  const abrirEdicao = (row: any) => {
    setDialogMode('editar');
    setDialogInitial({
      cdMovimentacao: row.documento,
      observacao: row.observacao ?? '',
      itens: [{
        cdItem: row.codigo_produto ?? '',
        cdDepositoOrigem: row.deposito_origem ?? '',
        cdDepositoDestino: row.deposito_destino ?? '',
        qtd: Number(row.quantidade ?? 0),
      }],
    });
    setDialogOpen(true);
  };

  const abrirDuplicar = (row: any) => {
    setDialogMode('duplicar');
    setDialogInitial({
      observacao: row.observacao ?? '',
      itens: [{
        cdItem: row.codigo_produto ?? '',
        cdDepositoOrigem: row.deposito_origem ?? '',
        cdDepositoDestino: row.deposito_destino ?? '',
        qtd: Number(row.quantidade ?? 0),
      }],
    });
    setDialogOpen(true);
  };

  const abrirNovo = () => {
    setDialogMode('novo');
    setDialogInitial(null);
    setDialogOpen(true);
  };

  const excluirRascunho = async (row: any) => {
    if (!row?.documento) return;
    if (!confirm(`Remover o rascunho ${row.documento} definitivamente do Auge e do Pente Fino?`)) return;
    const t = toast.loading('Removendo no Auge...');
    try {
      const { data, error } = await supabase.functions.invoke('auge-sync?action=transferencia_excluir', {
        body: { cdMovimentacao: row.documento },
      });
      if (error) throw error;
      if (data?.ok === false) throw new Error(data.error);
      toast.success(`Rascunho ${row.documento} removido`, { id: t });
      setRows(rs => rs.filter(r => r.id !== row.id));
      await sync();
    } catch (e: any) {
      toast.error('Falha ao remover: ' + (e.message || ''), { id: t });
    }
  };

  const load = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from('auge_transferencias')
      .select('*')
      .order('data_movimento', { ascending: false, nullsFirst: false })
      .limit(500);
    if (error) toast.error(error.message);
    const transferencias = data || [];
    const codigos = Array.from(new Set(
      transferencias.map((r: any) => r.codigo_produto).filter(Boolean)
    ));
    if (codigos.length > 0) {
      const { data: produtos } = await (supabase as any)
        .from('auge_produtos')
        .select('codigo, descricao')
        .in('codigo', codigos);
      const descricoes = new Map((produtos || []).map((p: any) => [p.codigo, p.descricao]));
      setRows(transferencias.map((r: any) => ({
        ...r,
        descricao_produto: r.descricao_produto ?? descricoes.get(r.codigo_produto) ?? null,
      })));
    } else {
      setRows(transferencias);
    }
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
    return rows.filter(r => {
      if (filtro === 'rascunho' && !isRascunho(r)) return false;
      if (filtro === 'efetivada' && !isEfetivada(r)) return false;
      if (!q) return true;
      return (
        (r.codigo_produto || '').toLowerCase().includes(q) ||
        (r.descricao_produto || '').toLowerCase().includes(q) ||
        (r.documento || '').toLowerCase().includes(q) ||
        (r.nr_efetivacao || '').toLowerCase().includes(q) ||
        (r.deposito_origem || '').toLowerCase().includes(q) ||
        (r.deposito_destino || '').toLowerCase().includes(q) ||
        (r.observacao || '').toLowerCase().includes(q) ||
        (r.usuario_criacao || '').toLowerCase().includes(q)
      );
    });
  }, [rows, search, filtro]);

  return (
    <div className="flex flex-col gap-4 h-full min-h-0 min-w-0 overflow-hidden">
      <div className="flex flex-wrap items-stretch gap-2 sm:gap-3 min-w-0">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rascunho, nº efetivação, produto, depósito, usuário..." className="pl-10 h-11 w-full" />
        </div>
        <ToggleGroup type="single" value={filtro} onValueChange={(v) => v && setFiltro(v as Filtro)} className="h-11 shrink-0">
          <ToggleGroupItem value="todos" className="h-11 px-3 text-xs">Todos</ToggleGroupItem>
          <ToggleGroupItem value="rascunho" className="h-11 px-3 text-xs">Rascunhos</ToggleGroupItem>
          <ToggleGroupItem value="efetivada" className="h-11 px-3 text-xs">Efetivadas</ToggleGroupItem>
        </ToggleGroup>
        <Button onClick={abrirNovo} variant="default" className="h-11 px-4 sm:px-5 gap-2 shrink-0">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Nova</span>
        </Button>
        <Button onClick={sync} disabled={syncing} variant="outline" className="h-11 px-4 sm:px-5 gap-2 shrink-0">
          {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          <span className="hidden sm:inline">Sincronizar</span>
        </Button>
      </div>


      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-12 gap-3">
          <ArrowRightLeft className="w-10 h-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">{rows.length === 0 ? 'Nenhuma transferência.' : 'Sem resultados.'}</p>
        </div>
      ) : (
        <div className="flex-1 min-h-0 min-w-0 overflow-auto border rounded-lg bg-card">
          <Table className="min-w-[1080px]">
            <TableHeader className="sticky top-0 bg-card z-10">
              <TableRow>
                <TableHead className="whitespace-nowrap">Nº Rascunho</TableHead>
                <TableHead className="whitespace-nowrap">Nº Efetivação</TableHead>
                <TableHead className="whitespace-nowrap">Origem → Destino</TableHead>
                <TableHead className="whitespace-nowrap">Produto</TableHead>
                <TableHead className="min-w-[260px] whitespace-nowrap">Descrição</TableHead>
                <TableHead className="text-right whitespace-nowrap">Qtd</TableHead>
                <TableHead className="whitespace-nowrap">Usuário</TableHead>
                <TableHead className="max-w-[220px] whitespace-nowrap">Observação</TableHead>
                <TableHead className="whitespace-nowrap">Data</TableHead>
                <TableHead className="w-[80px] text-right whitespace-nowrap">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(r => {
                const rascunho = isRascunho(r) && !isEfetivada(r);
                return (
                  <TableRow key={r.id} className="cursor-pointer hover:bg-muted/40" onClick={() => rascunho ? abrirEdicao(r) : setDetail(r)}>
                    <TableCell className="font-mono text-xs font-bold text-primary whitespace-nowrap">{r.documento || '—'}</TableCell>
                    <TableCell className="font-mono text-xs whitespace-nowrap">
                      {r.nr_efetivacao ? (
                        <span className="font-bold text-success">{r.nr_efetivacao}</span>
                      ) : (
                        <span className="text-muted-foreground/60">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs whitespace-nowrap">
                      <span className="font-mono">{r.deposito_origem || '?'}</span>
                      <ArrowRightLeft className="inline w-3 h-3 mx-1 text-muted-foreground" />
                      <span className="font-mono">{r.deposito_destino || '?'}</span>
                    </TableCell>
                    <TableCell className="font-mono text-xs whitespace-nowrap">{r.codigo_produto || '—'}</TableCell>
                    <TableCell className="text-xs text-foreground max-w-[360px] truncate whitespace-nowrap" title={r.descricao_produto || ''}>
                      {r.descricao_produto || <span className="text-muted-foreground/40">—</span>}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs whitespace-nowrap">{formatQty(r.quantidade)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground truncate max-w-[140px] whitespace-nowrap" title={r.usuario_criacao || ''}>
                      {r.usuario_criacao || '—'}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[220px] truncate whitespace-nowrap" title={r.observacao || ''}>
                      {r.observacao || <span className="text-muted-foreground/40">—</span>}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{r.data_movimento ? formatDateBR(r.data_movimento) : '—'}</TableCell>

                    <TableCell className="p-1 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        {rascunho && (
                          <Button size="sm" variant="ghost" className="h-7 px-2 gap-1 text-warning hover:text-warning" onClick={() => efetivarRapido(r)} title="Efetivar no Auge">
                            <Zap className="w-3 h-3" /> Efetivar
                          </Button>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-7 w-7">
                              <MoreVertical className="w-3.5 h-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            {rascunho && (
                              <DropdownMenuItem onClick={() => abrirEdicao(r)}>
                                <Pencil className="w-3.5 h-3.5 mr-2" /> Editar
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => abrirDuplicar(r)}>
                              <Copy className="w-3.5 h-3.5 mr-2" /> Duplicar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setDetail(r)}>
                              Ver detalhes
                            </DropdownMenuItem>
                            {rascunho && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => excluirRascunho(r)} className="text-destructive focus:text-destructive">
                                  <Trash2 className="w-3.5 h-3.5 mr-2" /> Remover rascunho
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <TransferenciaDetailDialog
        transferencia={detail}
        open={!!detail}
        onOpenChange={(o) => !o && setDetail(null)}
      />
      <NovaTransferenciaDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        initial={dialogInitial}
        onCreated={() => sync()}
      />
    </div>
  );
}
