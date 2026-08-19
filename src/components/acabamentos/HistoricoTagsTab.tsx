import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useGerarTagStore } from '@/store/useGerarTagStore';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  History, Search, CheckCircle2, AlertTriangle, Trash2, Tag as TagIcon,
  ChevronRight, Loader2, RefreshCw, User, ArrowLeftCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  TagHistoricoGrupo,
  TAG_EVENTO_LABEL,
  agruparEventosTag,
  formatarDataTag,
  lerEventosTag,
  removerGrupoTag,
  registrarEventoTag,
} from '@/lib/tag-historico';

/**
 * Aba "Histórico": consolida todas as ações e edições feitas nas TAGs Custom
 * por toda a equipe (tabela compartilhada + Realtime), agrupadas por TAG.
 * Clicar em uma TAG abre o detalhamento completo.
 */
export default function HistoricoTagsTab() {
  const qc = useQueryClient();
  const [busca, setBusca] = useState('');
  const [chaveAberta, setChaveAberta] = useState<string | null>(null);
  const [removendo, setRemovendo] = useState(false);
  const [revertendo, setRevertendo] = useState<string | null>(null);
  const [filtroAlteradas, setFiltroAlteradas] = useState<string | null>(null);
  const { setSnapshotLinhas, setCustomAberta, setLinhas, setModoEdicaoRelancamento, setResultado } = useGerarTagStore();
  



  const { data: eventos = [], isLoading, isFetching, refetch } = useQuery({
    queryKey: ['tag-custom-historico'],
    queryFn: lerEventosTag,
    staleTime: 30 * 1000,
  });

  // Histórico compartilhado: qualquer ação de qualquer usuário chega em tempo real.
  useEffect(() => {
    const channel = supabase
      .channel('tag-custom-historico-live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'auge_tag_custom_historico' },
        () => { qc.invalidateQueries({ queryKey: ['tag-custom-historico'] }); },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [qc]);

  const grupos = useMemo(() => agruparEventosTag(eventos), [eventos]);

  const lista = useMemo(() => {
    const t = busca.trim().toLowerCase();
    if (!t) return grupos;
    return grupos.filter((g) =>
      g.descricao.toLowerCase().includes(t) ||
      (g.nmConfiguracao ?? '').toLowerCase().includes(t) ||
      (g.cdConfiguracao ?? '').toLowerCase().includes(t) ||
      g.autores.some((a) => a.toLowerCase().includes(t)),
    );
  }, [grupos, busca]);

  const grupoAberto: TagHistoricoGrupo | null = useMemo(
    () => (chaveAberta ? grupos.find((g) => g.chave === chaveAberta) ?? null : null),
    [chaveAberta, grupos],
  );

  const removerGrupo = async (grupo: TagHistoricoGrupo) => {
    setRemovendo(true);
    try {
      const apagados = await removerGrupoTag(grupo.eventos);
      setChaveAberta(null);
      await refetch();
      if (apagados === 0) toast.error('Você não tem permissão para apagar estes registros.');
      else toast.success(`${apagados} registro(s) removido(s).`);
    } catch (e: any) {
      toast.error(e?.message ?? 'Falha ao remover o histórico desta TAG.');
    } finally {
      setRemovendo(false);
    }
  };

  const reverterPara = async (ev: any) => {
    if (!ev.linhas || ev.linhas.length === 0) {
      toast.error('Este registro não possui dados de composição para reverter.');
      return;
    }
    setRevertendo(ev.id);
    try {
      const { data, error } = await supabase.functions.invoke('auge-sync?action=criar_tag_custom', {
        body: {
          cdConfiguracao: ev.cdConfiguracao,
          descricao: ev.descricao,
          itens: ev.linhas.map((l: any) => ({
            dsTagCustomizada: l.valor,
            dsTagCalculada: l.calculada || '',
            dsFormula: l.formula || '',
            dsTagTexto: l.calculada ? '' : l.valor,
          })),
        },
      });
      if (error) throw error;
      const res = data as any;
      if (res?.ok) {
        toast.success(`Configuração revertida com sucesso no Auge (${res.gravadas}/${res.total}).`);
        await registrarEventoTag({
          ok: true,
          tipo: 'reversao',
          descricao: ev.descricao,
          cdConfiguracao: ev.cdConfiguracao,
          nmConfiguracao: ev.nmConfiguracao,
          linhas: ev.linhas,
          gravadas: res.gravadas,
          total: res.total,
        });
        qc.invalidateQueries({ queryKey: ['tag-custom-historico'] });
      } else {
        throw new Error(res?.error || 'O Auge não confirmou a reversão.');
      }
    } catch (e: any) {
      toast.error(e?.message || 'Falha ao reverter no Auge.');
    } finally {
      setRevertendo(null);
    }
  };

  return (
    <div className="space-y-3">
      <Card className="p-3">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <div className="text-[10px] uppercase text-muted-foreground">TAGs Custom</div>
            <div className="text-lg font-semibold font-mono">{grupos.length}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase text-muted-foreground">Ações registradas</div>
            <div className="text-lg font-semibold font-mono">{eventos.length}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase text-muted-foreground">Com falha</div>
            <div className="text-lg font-semibold font-mono text-destructive">
              {eventos.filter((e) => !e.ok).length}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase text-muted-foreground">Última ação</div>
            <div className="text-xs font-mono pt-1">
              {grupos[0] ? formatarDataTag(grupos[0].ultimoEm) : '—'}
            </div>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="p-3 border-b flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por TAG Custom, configuração ou autor…"
              className="h-9 pl-7 text-xs"
            />
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-9 gap-2 text-[11px]"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            {isFetching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Recarregar
          </Button>
        </div>

        {isLoading ? (
          <div className="p-8 text-center"><Loader2 className="h-4 w-4 animate-spin inline" /></div>
        ) : lista.length === 0 ? (
          <div className="p-8 text-center text-[11px] text-muted-foreground">
            <History className="h-5 w-5 mx-auto mb-2 opacity-50" />
            {eventos.length === 0
              ? 'Nenhuma ação registrada ainda. Ao gravar ou editar uma TAG Custom na aba "Gerar TAG", ela aparece aqui para toda a equipe.'
              : 'Nenhuma TAG Custom encontrada para esta busca.'}
          </div>
        ) : (
          <div className="divide-y">
            {lista.map((g) => (
              <button
                key={g.chave}
                type="button"
                onClick={() => setChaveAberta(g.chave)}
                className="w-full text-left p-3 flex items-center justify-between gap-3 hover:bg-muted/50 transition-colors"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <TagIcon className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="text-[11px] font-medium break-all">{g.descricao}</span>
                    <Badge variant="outline" className="text-[9px]">{g.totalEventos} ação(ões)</Badge>
                    {g.erros > 0 && (
                      <Badge variant="destructive" className="text-[9px]">{g.erros} falha(s)</Badge>
                    )}
                  </div>
                  <div className="text-[9px] text-muted-foreground break-all">
                    {g.nmConfiguracao ? `Configuração: ${g.nmConfiguracao}` : 'Sem configuração'}
                    {' · '}Última: {formatarDataTag(g.ultimoEm)}
                    {g.autores.length > 0 && ` · ${g.autores.join(', ')}`}
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </button>
            ))}
          </div>
        )}
      </Card>

      <Dialog open={!!grupoAberto} onOpenChange={(v) => !v && setChaveAberta(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col p-0 gap-0">
          <DialogHeader className="p-5 sm:p-6 pb-4 sm:pb-4 mb-0">
            <DialogTitle className="flex items-center gap-2 flex-wrap">
              <TagIcon className="h-4 w-4 text-primary" />
              <span className="break-all">{grupoAberto?.descricao ?? ''}</span>
              <Badge variant="outline" className="text-[10px] uppercase">Histórico</Badge>
            </DialogTitle>
            {grupoAberto?.nmConfiguracao && (
              <p className="text-xs text-muted-foreground break-all">
                Configuração: {grupoAberto.nmConfiguracao}
                {grupoAberto.cdConfiguracao ? ` [${grupoAberto.cdConfiguracao}]` : ''}
              </p>
            )}
          </DialogHeader>

          <ScrollArea className="flex-1 px-5 sm:px-6">
            <div className="space-y-3">
              {(grupoAberto?.eventos ?? []).map((ev) => (
                <div key={ev.id} className="rounded-md border p-3 space-y-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {ev.ok
                      ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      : <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" />}
                    <span className="text-[11px] font-semibold">{TAG_EVENTO_LABEL[ev.tipo]}</span>
                    <span className="text-[9px] text-muted-foreground">{formatarDataTag(ev.em)}</span>
                    {ev.usuarioNome && (
                      <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
                        <User className="h-2.5 w-2.5" />{ev.usuarioNome}
                      </span>
                    )}
                    {ev.total != null && (
                      <Badge variant="outline" className="text-[9px]">
                        {ev.gravadas ?? 0}/{ev.total} gravada(s)
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 mt-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-[10px] text-muted-foreground">
                        {ev.total != null && `${ev.gravadas ?? 0} de ${ev.total} configs. alteradas`}
                      </div>
                      {ev.ok && ev.tipo !== 'reversao' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-[10px] gap-1 hover:bg-amber-500/10 hover:text-amber-600 hover:border-amber-500/50"
                          onClick={() => reverterPara(ev)}
                          disabled={!!revertendo}
                        >
                          {revertendo === ev.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <ArrowLeftCircle className="h-3 w-3" />
                          )
                          }
                          Reverter para este estado
                        </Button>
                      )}
                    </div>

                  </div>

                  {ev.erro && (
                    <div className="text-[10px] text-destructive break-all">{ev.erro}</div>
                  )}



                  {ev.linhas.length > 0 && (
                    <div className="space-y-2">
                      <details className="group">
                        <summary className="text-[10px] font-medium text-primary cursor-pointer hover:underline list-none flex items-center gap-1">
                          <ChevronRight className="h-3 w-3 transition-transform group-open:rotate-90" />
                          Ver resumo das alterações ({ev.linhas.length} itens)
                        </summary>
                        <div className="mt-2 overflow-x-auto rounded border bg-muted/30">
                          <table className="w-full text-[10px]">
                            <thead className="bg-muted">
                              <tr className="text-left">
                                <th className="p-1.5">Cód. Configuração</th>
                                <th className="p-1.5">Anterior (Auge)</th>
                                <th className="p-1.5">TAG Calculada</th>
                                <th className="p-1.5">Fórmula</th>
                              </tr>
                            </thead>
                            <tbody>
                              {ev.linhas
                                .filter(l => filtroAlteradas === ev.id ? l.valor !== l.valor_antigo : true)
                                .map((l, i) => (
                                  <tr key={i} className={`border-t align-top ${l.valor !== l.valor_antigo ? 'bg-emerald-500/5' : 'bg-background/50'}`}>
                                    <td className="p-1.5 font-mono break-all font-semibold">
                                      {l.cdConfiguracaoLinha || l.cdTagCustomizada || l.code || '—'}
                                    </td>
                                    <td className="p-1.5 font-mono break-all text-muted-foreground">
                                      {l.valor_antigo || '—'}
                                    </td>
                                    <td className={`p-1.5 font-mono break-all font-medium ${l.valor !== l.valor_antigo ? 'text-emerald-600' : 'text-foreground'}`}>
                                      {l.calculada || '—'}
                                    </td>
                                    <td className="p-1.5 font-mono break-all text-muted-foreground italic">
                                      {l.formula || '—'}
                                    </td>
                                  </tr>
                                ))}

                            </tbody>
                          </table>
                          {filtroAlteradas === ev.id && ev.linhas.filter(l => l.valor === l.valor_antigo).length > 0 && (
                            <div className="p-2 text-[9px] text-muted-foreground bg-muted/50 border-t italic">
                              * {ev.linhas.filter(l => l.valor === l.valor_antigo).length} tags ocultadas por não terem sofrido alteração de valor.
                            </div>
                          )}
                        </div>

                      </details>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>

          {grupoAberto && (
            <div className="p-4 border-t flex justify-end">
              <Button
                size="sm"
                variant="ghost"
                className="h-8 px-2 text-[10px] gap-1 text-destructive"
                disabled={removendo}
                onClick={() => removerGrupo(grupoAberto)}
              >
                {removendo ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                Remover histórico desta TAG
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
