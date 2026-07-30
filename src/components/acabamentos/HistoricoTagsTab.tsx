import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  History, Search, CheckCircle2, AlertTriangle, Trash2, Tag as TagIcon, ChevronRight,
} from 'lucide-react';
import {
  TagHistoricoGrupo,
  TAG_EVENTO_LABEL,
  agruparEventosTag,
  formatarDataTag,
  lerEventosTag,
  limparEventosTag,
  observarEventosTag,
  removerGrupoTag,
} from '@/lib/tag-historico';

/**
 * Aba "Histórico": consolida todas as ações e edições feitas nas TAGs Custom,
 * agrupadas por TAG. Clicar em uma TAG abre o detalhamento completo.
 */
export default function HistoricoTagsTab() {
  const [eventos, setEventos] = useState(() => lerEventosTag());
  const [busca, setBusca] = useState('');
  const [aberta, setAberta] = useState<TagHistoricoGrupo | null>(null);

  useEffect(() => observarEventosTag(() => setEventos(lerEventosTag())), []);

  const grupos = useMemo(() => agruparEventosTag(eventos), [eventos]);

  const lista = useMemo(() => {
    const t = busca.trim().toLowerCase();
    if (!t) return grupos;
    return grupos.filter((g) =>
      g.descricao.toLowerCase().includes(t) ||
      (g.nmConfiguracao ?? '').toLowerCase().includes(t) ||
      (g.cdConfiguracao ?? '').toLowerCase().includes(t),
    );
  }, [grupos, busca]);

  // Mantém o diálogo sincronizado quando novos eventos chegam.
  const grupoAberto = useMemo(
    () => (aberta ? grupos.find((g) => g.chave === aberta.chave) ?? aberta : null),
    [aberta, grupos],
  );

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
              placeholder="Buscar por TAG Custom ou configuração…"
              className="h-9 pl-7 text-xs"
            />
          </div>
          {eventos.length > 0 && (
            <Button
              size="sm"
              variant="ghost"
              className="h-8 px-2 text-[10px] gap-1"
              onClick={() => { limparEventosTag(); setAberta(null); }}
            >
              <Trash2 className="h-3 w-3" /> Limpar histórico
            </Button>
          )}
        </div>

        {lista.length === 0 ? (
          <div className="p-8 text-center text-[11px] text-muted-foreground">
            <History className="h-5 w-5 mx-auto mb-2 opacity-50" />
            {eventos.length === 0
              ? 'Nenhuma ação registrada ainda. Ao gravar ou editar uma TAG Custom na aba "Gerar TAG", ela aparece aqui.'
              : 'Nenhuma TAG Custom encontrada para esta busca.'}
          </div>
        ) : (
          <div className="divide-y">
            {lista.map((g) => (
              <button
                key={g.chave}
                type="button"
                onClick={() => setAberta(g)}
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
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </button>
            ))}
          </div>
        )}
      </Card>

      <Dialog open={!!grupoAberto} onOpenChange={(v) => !v && setAberta(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
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

          <ScrollArea className="flex-1 pr-3">
            <div className="space-y-3">
              {(grupoAberto?.eventos ?? []).map((ev) => (
                <div key={ev.id} className="rounded-md border p-3 space-y-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {ev.ok
                      ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      : <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" />}
                    <span className="text-[11px] font-semibold">{TAG_EVENTO_LABEL[ev.tipo]}</span>
                    <span className="text-[9px] text-muted-foreground">{formatarDataTag(ev.em)}</span>
                    {ev.total != null && (
                      <Badge variant="outline" className="text-[9px]">
                        {ev.gravadas ?? 0}/{ev.total} gravada(s)
                      </Badge>
                    )}
                  </div>

                  {ev.erro && (
                    <div className="text-[10px] text-destructive break-all">{ev.erro}</div>
                  )}

                  {ev.linhas.length > 0 && (
                    <div className="overflow-x-auto rounded border">
                      <table className="w-full text-[10px]">
                        <thead className="bg-muted">
                          <tr className="text-left">
                            <th className="p-1.5">TAG Configurada</th>
                            <th className="p-1.5">TAG Calculada</th>
                            <th className="p-1.5">Fórmula</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ev.linhas.map((l, i) => (
                            <tr key={i} className="border-t align-top">
                              <td className="p-1.5 font-mono break-all">{l.valor || '—'}</td>
                              <td className="p-1.5 font-mono break-all">{l.calculada || '—'}</td>
                              <td className="p-1.5 font-mono break-all text-muted-foreground">
                                {l.formula || '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>

          {grupoAberto && (
            <div className="pt-2 border-t flex justify-end">
              <Button
                size="sm"
                variant="ghost"
                className="h-8 px-2 text-[10px] gap-1 text-destructive"
                onClick={() => { removerGrupoTag(grupoAberto.chave); setAberta(null); }}
              >
                <Trash2 className="h-3 w-3" /> Remover histórico desta TAG
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
