import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ArrowRightLeft, Plus, Trash2, Search, Layers, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import LoteSelectorDialog, { type LoteSelecionado } from './LoteSelectorDialog';

interface Deposito { codigo: string; nome: string | null; }
interface Produto { codigo: string; descricao: string | null; unidade: string | null; }
interface Linha {
  key: string;
  cdItem: string;
  descricao: string;
  cdDepositoOrigem: string;
  cdDepositoDestino: string;
  qtd: string;
  lotes: LoteSelecionado[]; // vazio = sem controle por lote
  modoLote?: 'lote' | 'serie';
}

const novaLinha = (): Linha => ({
  key: crypto.randomUUID(),
  cdItem: '', descricao: '', cdDepositoOrigem: '', cdDepositoDestino: '', qtd: '1',
  lotes: [],
});

export type TransfDialogMode = 'novo' | 'editar' | 'duplicar';

export interface TransfDialogInitial {
  cdMovimentacao?: string | null;
  itens?: Array<{
    cdItem: string;
    descricao?: string | null;
    cdDepositoOrigem: string;
    cdDepositoDestino: string;
    qtd: number | string;
    lotes?: LoteSelecionado[];
    modoLote?: 'lote' | 'serie';
  }>;
  observacao?: string | null;
}

export default function NovaTransferenciaDialog({
  open, onOpenChange, onCreated, mode = 'novo', initial,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreated?: () => void;
  mode?: TransfDialogMode;
  initial?: TransfDialogInitial | null;
}) {
  const [depositos, setDepositos] = useState<Deposito[]>([]);
  const [linhas, setLinhas] = useState<Linha[]>([novaLinha()]);
  const [origemPadrao, setOrigemPadrao] = useState('');
  const [destinoPadrao, setDestinoPadrao] = useState('');
  const [observacao, setObservacao] = useState('');
  const [efetivar, setEfetivar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [seletor, setSeletor] = useState<{ key: string } | null>(null);
  const [visualizar, setVisualizar] = useState<Linha | null>(null);

  const isEdit = mode === 'editar' && !!initial?.cdMovimentacao;
  const cdEdit = initial?.cdMovimentacao ?? null;

  useEffect(() => {
    if (!open) return;
    (async () => {
      const { data } = await (supabase as any).from('auge_depositos').select('codigo,nome').order('codigo');
      setDepositos(data || []);
    })();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (initial?.itens?.length) {
      setLinhas(initial.itens.map(it => ({
        key: crypto.randomUUID(),
        cdItem: String(it.cdItem ?? ''),
        descricao: it.descricao ?? '',
        cdDepositoOrigem: String(it.cdDepositoOrigem ?? ''),
        cdDepositoDestino: String(it.cdDepositoDestino ?? ''),
        qtd: String(it.qtd ?? '1').replace('.', ','),
        lotes: it.lotes ?? [],
        modoLote: it.modoLote,
      })));
    } else {
      setLinhas([novaLinha()]);
    }
    setObservacao(initial?.observacao ?? '');
    setOrigemPadrao(''); setDestinoPadrao(''); setEfetivar(false);
  }, [open, initial]);

  useEffect(() => {
    if (!origemPadrao) return;
    setLinhas(ls => ls.map(l => l.cdDepositoOrigem ? l : { ...l, cdDepositoOrigem: origemPadrao }));
  }, [origemPadrao]);
  useEffect(() => {
    if (!destinoPadrao) return;
    setLinhas(ls => ls.map(l => l.cdDepositoDestino ? l : { ...l, cdDepositoDestino: destinoPadrao }));
  }, [destinoPadrao]);

  const linhaTotal = (l: Linha) =>
    l.lotes.length > 0
      ? l.lotes.reduce((a, b) => a + (Number(b.qtd) || 0), 0)
      : Number(String(l.qtd).replace(',', '.')) || 0;

  const canSubmit = useMemo(
    () => !loading && linhas.every(l =>
      l.cdItem.trim() && l.cdDepositoOrigem && l.cdDepositoDestino &&
      l.cdDepositoOrigem !== l.cdDepositoDestino && linhaTotal(l) > 0
    ),
    [linhas, loading],
  );

  const reset = () => {
    setLinhas([novaLinha()]);
    setOrigemPadrao(''); setDestinoPadrao(''); setObservacao(''); setEfetivar(false);
  };

  const updateLinha = (key: string, patch: Partial<Linha>) =>
    setLinhas(ls => ls.map(l => l.key === key ? { ...l, ...patch } : l));

  const removeLinha = (key: string) =>
    setLinhas(ls => ls.length === 1 ? ls : ls.filter(l => l.key !== key));

  const addLinha = () => setLinhas(ls => [...ls, {
    ...novaLinha(),
    cdDepositoOrigem: origemPadrao,
    cdDepositoDestino: destinoPadrao,
  }]);

  const linhaSelecionador = linhas.find(l => l.key === seletor?.key) ?? null;

  const submit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    const t = toast.loading(
      isEdit ? 'Atualizando no Auge...' :
      efetivar ? 'Criando e efetivando...' : 'Criando transferência...'
    );
    try {
      // Expande cada linha em N itens quando há lotes selecionados
      const itens = linhas.flatMap(l => {
        if (l.lotes.length > 0) {
          return l.lotes.map(lt => ({
            cdItem: l.cdItem.trim(),
            cdDepositoOrigem: l.cdDepositoOrigem,
            cdDepositoDestino: l.cdDepositoDestino,
            qtd: Number(lt.qtd),
            nrLote: lt.lote,
          }));
        }
        return [{
          cdItem: l.cdItem.trim(),
          cdDepositoOrigem: l.cdDepositoOrigem,
          cdDepositoDestino: l.cdDepositoDestino,
          qtd: Number(String(l.qtd).replace(',', '.')),
        }];
      });
      const endpoint = isEdit
        ? 'auge-sync?action=transferencia_atualizar'
        : 'auge-sync?action=transferencia_criar';
      const body: any = isEdit
        ? { cdMovimentacao: cdEdit, itens, observacao: observacao.trim() }
        : { itens, observacao: observacao.trim(), efetivar };
      const { data, error } = await supabase.functions.invoke(endpoint, { body });
      if (error) throw error;
      if (data?.ok === false) throw new Error(data.error || 'Falha');
      toast.success(
        isEdit
          ? `Rascunho ${data.cdMovimentacao} atualizado`
          : `Transferência ${data.cdMovimentacao} ${data.efetivado ? 'criada e efetivada' : 'criada (rascunho)'}`,
        { id: t },
      );
      reset();
      onOpenChange(false);
      onCreated?.();
    } catch (e: any) {
      toast.error('Erro: ' + (e.message || String(e)), { id: t });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <Dialog open={open} onOpenChange={(o) => { if (!loading) onOpenChange(o); }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4 text-primary" />
            {isEdit
              ? `Editar rascunho ${cdEdit}`
              : mode === 'duplicar'
                ? 'Duplicar transferência (Auge)'
                : 'Nova transferência (Auge)'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2 overflow-auto pr-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Origem padrão</Label>
              <Select value={origemPadrao} onValueChange={setOrigemPadrao}>
                <SelectTrigger><SelectValue placeholder="Aplicar em todas" /></SelectTrigger>
                <SelectContent>
                  {depositos.map(d => (
                    <SelectItem key={d.codigo} value={d.codigo}>
                      <span className="font-mono">{d.codigo}</span> {d.nome ? `— ${d.nome}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Destino padrão</Label>
              <Select value={destinoPadrao} onValueChange={setDestinoPadrao}>
                <SelectTrigger><SelectValue placeholder="Aplicar em todas" /></SelectTrigger>
                <SelectContent>
                  {depositos.map(d => (
                    <SelectItem key={d.codigo} value={d.codigo}>
                      <span className="font-mono">{d.codigo}</span> {d.nome ? `— ${d.nome}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Itens ({linhas.length})</Label>
              <Button type="button" size="sm" variant="outline" onClick={addLinha} className="h-7 gap-1">
                <Plus className="w-3 h-3" /> Adicionar item
              </Button>
            </div>

            {linhas.map((l, idx) => {
              const total = linhaTotal(l);
              const temLotes = l.lotes.length > 0;
              const podeSelecionarLote = !!l.cdItem && !!l.cdDepositoOrigem;
              return (
                <div key={l.key} className="border rounded-md p-2.5 space-y-2 bg-card/50">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-[10px]">#{idx + 1}</Badge>
                    {linhas.length > 1 && (
                      <Button type="button" size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive"
                        onClick={() => removeLinha(l.key)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>

                  <ItemAutocomplete
                    cdItem={l.cdItem}
                    descricao={l.descricao}
                    onSelect={(p) => updateLinha(l.key, { cdItem: p.codigo, descricao: p.descricao || '', lotes: [] })}
                    onCdItemChange={(v) => updateLinha(l.key, { cdItem: v, lotes: [] })}
                  />

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label className="text-[10px]">Origem</Label>
                      <Select value={l.cdDepositoOrigem} onValueChange={(v) => updateLinha(l.key, { cdDepositoOrigem: v, lotes: [] })}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="—" /></SelectTrigger>
                        <SelectContent>
                          {depositos.map(d => (
                            <SelectItem key={d.codigo} value={d.codigo}>
                              <span className="font-mono">{d.codigo}</span> {d.nome ? `— ${d.nome}` : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-[10px]">Destino</Label>
                      <Select value={l.cdDepositoDestino} onValueChange={(v) => updateLinha(l.key, { cdDepositoDestino: v })}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="—" /></SelectTrigger>
                        <SelectContent>
                          {depositos.map(d => (
                            <SelectItem key={d.codigo} value={d.codigo} disabled={d.codigo === l.cdDepositoOrigem}>
                              <span className="font-mono">{d.codigo}</span> {d.nome ? `— ${d.nome}` : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-[10px]">
                        Quantidade {temLotes && <span className="text-primary">(auto lotes)</span>}
                      </Label>
                      {temLotes ? (
                        <div className="h-8 flex items-center px-2 rounded-md border bg-muted/40 font-mono text-xs text-primary font-semibold">
                          {total.toLocaleString('pt-BR')}
                        </div>
                      ) : (
                        <Input
                          type="text"
                          inputMode="decimal"
                          value={l.qtd}
                          onChange={(e) => updateLinha(l.key, { qtd: e.target.value.replace(/[^\d.,]/g, '') })}
                          className="h-8 text-xs font-mono"
                        />
                      )}
                    </div>
                  </div>

                  {/* Ações de lote/série */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 border-t">
                    <Button
                      type="button" size="sm" variant="outline"
                      className="h-7 text-[11px] gap-1"
                      disabled={!podeSelecionarLote}
                      onClick={() => setSeletor({ key: l.key })}
                      title={podeSelecionarLote ? '' : 'Escolha item e origem primeiro'}
                    >
                      <Layers className="w-3 h-3" />
                      {temLotes ? 'Alterar lotes/séries' : 'Selecionar lotes/séries'}
                    </Button>
                    {temLotes && (
                      <>
                        <Button
                          type="button" size="sm" variant="ghost"
                          className="h-7 text-[11px] gap-1"
                          onClick={() => setVisualizar(l)}
                        >
                          <Eye className="w-3 h-3" />
                          Ver seleção ({l.lotes.length})
                        </Button>
                        <Button
                          type="button" size="sm" variant="ghost"
                          className="h-7 text-[11px] text-destructive"
                          onClick={() => updateLinha(l.key, { lotes: [] })}
                        >
                          Limpar lotes
                        </Button>
                        <Badge variant="secondary" className="text-[10px] font-mono">
                          {l.modoLote === 'serie' ? 'Série' : 'Lote'}
                        </Badge>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="obs" className="text-xs">Observação</Label>
            <Textarea id="obs" value={observacao} onChange={(e) => setObservacao(e.target.value)} rows={2} />
          </div>

          {!isEdit && (
            <>
              <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                <Checkbox checked={efetivar} onCheckedChange={(v) => setEfetivar(!!v)} />
                <span>Efetivar imediatamente após criar</span>
              </label>
              {efetivar && (
                <p className="text-[11px] text-warning -mt-2">
                  ⚠ Movimenta estoque no Auge sem conferência manual.
                </p>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancelar</Button>
          <Button onClick={submit} disabled={!canSubmit} className="gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {isEdit
              ? 'Salvar alterações no Auge'
              : efetivar ? 'Criar e efetivar' : 'Criar rascunho'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {linhaSelecionador && (
      <LoteSelectorDialog
        open={!!seletor}
        onOpenChange={(o) => !o && setSeletor(null)}
        cdItem={linhaSelecionador.cdItem}
        deposito={linhaSelecionador.cdDepositoOrigem}
        descricao={linhaSelecionador.descricao}
        initial={linhaSelecionador.lotes}
        qtdAlvo={Number(String(linhaSelecionador.qtd).replace(',', '.')) || 0}

        onConfirm={(sel, modo) => {
          updateLinha(linhaSelecionador.key, { lotes: sel, modoLote: modo });
        }}
      />
    )}

    {/* Visualização somente-leitura, com atalho para editar */}
    <Dialog open={!!visualizar} onOpenChange={(o) => !o && setVisualizar(null)}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Eye className="w-4 h-4 text-primary" />
            Lotes/séries selecionados
          </DialogTitle>
          {visualizar && (
            <p className="text-xs text-muted-foreground">
              <span className="font-mono text-primary">{visualizar.cdItem}</span>
              {visualizar.descricao && <> — {visualizar.descricao}</>}
            </p>
          )}
        </DialogHeader>
        {visualizar && (
          <div className="space-y-2 max-h-[50vh] overflow-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-[10px] uppercase text-muted-foreground border-b">
                  <th className="text-left p-2">Lote/Série</th>
                  <th className="text-right p-2">Qtd</th>
                  <th className="text-right p-2">Disponível</th>
                </tr>
              </thead>
              <tbody>
                {visualizar.lotes.map(lt => (
                  <tr key={lt.lote} className="border-b">
                    <td className="p-2 font-mono font-semibold text-primary">{lt.lote}</td>
                    <td className="p-2 text-right font-mono">{lt.qtd.toLocaleString('pt-BR')}</td>
                    <td className="p-2 text-right text-muted-foreground font-mono">{lt.disponivel.toLocaleString('pt-BR')}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t font-bold">
                  <td className="p-2 text-right">Total</td>
                  <td className="p-2 text-right font-mono text-primary">
                    {visualizar.lotes.reduce((a, b) => a + b.qtd, 0).toLocaleString('pt-BR')}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setVisualizar(null)}>Fechar</Button>
          <Button onClick={() => { if (visualizar) { setSeletor({ key: visualizar.key }); setVisualizar(null); } }}>
            Alterar seleção
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}

// ---------- Autocomplete de item ----------
function ItemAutocomplete({
  cdItem, descricao, onSelect, onCdItemChange,
}: {
  cdItem: string;
  descricao: string;
  onSelect: (p: Produto) => void;
  onCdItemChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(false);
  const debouncedRef = useRef<number | null>(null);

  const buscar = (q: string) => {
    if (debouncedRef.current) window.clearTimeout(debouncedRef.current);
    const term = q.trim();
    if (term.length < 1) { setResults([]); return; }
    debouncedRef.current = window.setTimeout(async () => {
      setLoading(true);
      const s = term.replace(/[%,]/g, ' ');
      const { data } = await supabase
        .from('auge_produtos')
        .select('codigo,descricao,unidade')
        .or(`codigo.ilike.%${s}%,descricao.ilike.%${s}%`)
        .order('codigo')
        .limit(20);
      setResults((data ?? []) as Produto[]);
      setLoading(false);
    }, 200);
  };

  const showList = open && (results.length > 0 || loading);

  return (
    <div className="relative">
      <Label className="text-[10px]">Código do item ou descrição</Label>
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <Input
          value={cdItem}
          onChange={(e) => { onCdItemChange(e.target.value); buscar(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Digite código ou parte da descrição (ex: comp)..."
          className="pl-7 h-8 text-xs font-mono"
          autoComplete="off"
        />
      </div>
      {showList && (
        <div className="absolute z-50 mt-1 w-full max-h-64 overflow-auto rounded-md border bg-popover shadow-lg">
          {loading && (
            <div className="p-2 text-[10px] text-muted-foreground flex items-center gap-1.5">
              <Loader2 className="w-3 h-3 animate-spin" /> Buscando...
            </div>
          )}
          <ul className="divide-y">
            {results.map(p => (
              <li key={p.codigo}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => { onSelect(p); setOpen(false); }}
                  className="w-full text-left p-2 hover:bg-muted/60 transition-colors"
                >
                  <div className="font-mono text-[11px] font-semibold text-primary">{p.codigo}</div>
                  <div className="text-[11px] text-muted-foreground line-clamp-1">{p.descricao ?? '—'}</div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {descricao && !showList && (
        <div className="text-[10px] text-muted-foreground mt-1 line-clamp-1">✓ {descricao}</div>
      )}
    </div>
  );
}
