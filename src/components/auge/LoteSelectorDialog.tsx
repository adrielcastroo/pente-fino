import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Loader2, Layers, AlertCircle, Search, Wand2 } from 'lucide-react';
import { formatDateBR } from '@/lib/app-utils';

export interface LoteSelecionado {
  lote: string;
  qtd: number;
  disponivel: number;
  data_validade?: string | null;
}

type Modo = 'lote' | 'serie';

export default function LoteSelectorDialog({
  open, onOpenChange, cdItem, deposito, descricao,
  initial, onConfirm, qtdAlvo,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  cdItem: string;
  deposito: string;
  descricao?: string;
  initial: LoteSelecionado[];
  onConfirm: (sel: LoteSelecionado[], modo: Modo) => void;
  qtdAlvo?: number;
}) {
  const [lotes, setLotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modo, setModo] = useState<Modo>('lote');
  const [filtro, setFiltro] = useState('');
  const [alvo, setAlvo] = useState<number>(qtdAlvo ?? 0);
  // Map lote -> qtd (0 = não selecionado)
  const [sel, setSel] = useState<Record<string, number>>({});

  useEffect(() => {
    if (open) setAlvo(qtdAlvo ?? 0);
  }, [open, qtdAlvo]);


  useEffect(() => {
    if (!open || !cdItem || !deposito) return;
    (async () => {
      setLoading(true);
      try {
        // 1) Tenta série ao vivo (motores/controles). Se retornar dados, usa modo série.
        const serieRes = await supabase.functions.invoke('auge-sync?action=series_live', {
          body: { cdItem, cdDeposito: deposito },
        });
        const serieData = (serieRes.data as any)?.data ?? [];
        if (Array.isArray(serieData) && serieData.length > 0) {
          setLotes(serieData);
          setModo('serie');
          setLoading(false);
          return;
        }
        // 2) Consulta lotes ao vivo (tecidos e demais controlados por lote)
        const loteRes = await supabase.functions.invoke('auge-sync?action=lotes_live', {
          body: { cdItem, cdDeposito: deposito },
        });
        const loteData = (loteRes.data as any)?.data ?? [];
        if (Array.isArray(loteData) && loteData.length > 0) {
          setLotes(loteData);
          setModo('lote');
          setLoading(false);
          return;
        }
        // 3) Fallback: tabela local auge_lotes (caso item não seja controlado no Auge)
        const { data } = await supabase
          .from('auge_lotes')
          .select('lote, quantidade, data_fabricacao, data_validade')
          .eq('codigo_produto', cdItem)
          .eq('deposito', deposito)
          .order('data_validade', { ascending: true, nullsFirst: false });
        setLotes(data ?? []);
      } catch (_) {
        setLotes([]);
      }
      setLoading(false);
    })();
  }, [open, cdItem, deposito]);


  // Inicializa seleção do estado inicial
  useEffect(() => {
    if (!open) return;
    const map: Record<string, number> = {};
    for (const s of initial) map[s.lote] = s.qtd;
    setSel(map);
    // Heurística: se todos os lotes têm qtd inteira = disponível, provavelmente é série
    const looksSerie = initial.length > 0 && initial.every(s => s.qtd === s.disponivel);
    setModo(looksSerie ? 'serie' : 'lote');
  }, [open, initial]);

  const toggle = (lote: string, disponivel: number) => {
    setSel(prev => {
      const cur = prev[lote] || 0;
      if (cur > 0) { const { [lote]: _, ...rest } = prev; return rest; }
      return { ...prev, [lote]: disponivel };
    });
  };

  const setQtd = (lote: string, qtd: number, max: number) => {
    const clamped = Math.max(0, Math.min(qtd, max));
    setSel(prev => {
      if (clamped <= 0) { const { [lote]: _, ...rest } = prev; return rest; }
      return { ...prev, [lote]: clamped };
    });
  };

  const total = useMemo(
    () => Object.values(sel).reduce((a, b) => a + (Number(b) || 0), 0),
    [sel],
  );

  const selecionarTodos = () => {
    const map: Record<string, number> = {};
    for (const l of lotes) if (Number(l.quantidade) > 0) map[l.lote] = Number(l.quantidade);
    setSel(map);
  };
  const limpar = () => setSel({});

  // Lista filtrada (aplicada em busca — Proc/NF/Lote/Série/Endereço)
  const lotesFiltrados = useMemo(() => {
    const q = filtro.toLowerCase().trim();
    if (!q) return lotes;
    return lotes.filter(l => (l.lote || '').toLowerCase().includes(q));
  }, [lotes, filtro]);

  // Sugestão FIFO: preenche do topo (Auge já devolve em ordem FIFO / por validade
  // no fallback local) até bater a quantidade alvo.
  const sugerirFIFO = () => {
    if (!alvo || alvo <= 0) return;
    const map: Record<string, number> = {};
    let restante = alvo;
    for (const l of lotesFiltrados) {
      const disp = Number(l.quantidade || 0);
      if (disp <= 0) continue;
      if (restante <= 0) break;
      if (modo === 'serie') {
        // 1 unidade por série
        map[l.lote] = disp;
        restante -= disp;
      } else {
        const usar = Math.min(disp, restante);
        map[l.lote] = usar;
        restante -= usar;
      }
    }
    setSel(map);
  };


  const confirmar = () => {
    const result: LoteSelecionado[] = lotes
      .filter(l => (sel[l.lote] || 0) > 0)
      .map(l => ({
        lote: l.lote,
        qtd: Number(sel[l.lote] || 0),
        disponivel: Number(l.quantidade || 0),
        data_validade: l.data_validade,
      }));
    onConfirm(result, modo);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Layers className="w-4 h-4 text-primary" />
            Selecionar lotes/séries
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            <span className="font-mono text-primary">{cdItem}</span>
            {descricao && <> — {descricao}</>}
            {' · Origem '}<span className="font-mono">{deposito}</span>
          </p>
        </DialogHeader>

        <div className="flex flex-col gap-2 border-b pb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <ToggleGroup type="single" value={modo} onValueChange={(v) => v && setModo(v as Modo)}>
              <ToggleGroupItem value="lote" className="text-xs">
                Lote (fracionado)
              </ToggleGroupItem>
              <ToggleGroupItem value="serie" className="text-xs">
                Série (múltiplos)
              </ToggleGroupItem>
            </ToggleGroup>
            <div className="ml-auto flex items-center gap-2">
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={selecionarTodos}>
                Selecionar tudo
              </Button>
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={limpar}>
                Limpar
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50" />
              <Input
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                placeholder="Filtrar por Proc, NF, endereço, série..."
                className="pl-8 h-8 text-xs"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase text-muted-foreground">Alvo</span>
              <Input
                type="text"
                inputMode="decimal"
                value={alvo ? String(alvo).replace('.', ',') : ''}
                onChange={(e) => {
                  const v = Number(e.target.value.replace(',', '.').replace(/[^\d.]/g, ''));
                  setAlvo(Number.isFinite(v) ? v : 0);
                }}
                placeholder="0"
                className="h-8 text-xs text-right font-mono w-20"
              />
              <Button
                size="sm"
                variant="secondary"
                className="h-8 text-xs gap-1"
                onClick={sugerirFIFO}
                disabled={!alvo || alvo <= 0 || lotesFiltrados.length === 0}
                title="Preenche automaticamente os lotes mais antigos até bater a quantidade alvo"
              >
                <Wand2 className="w-3.5 h-3.5" /> FIFO
              </Button>
            </div>
          </div>
        </div>


        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : lotes.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <AlertCircle className="w-8 h-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                Nenhum lote/série do item <span className="font-mono">{cdItem}</span> no depósito <span className="font-mono">{deposito}</span>.
              </p>
              <p className="text-[11px] text-muted-foreground/70">
                Sincronize a entidade <b>lotes</b> no painel admin caso o item seja controlado.
              </p>
            </div>
          ) : (
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-card z-10">
                <tr className="text-[10px] uppercase text-muted-foreground border-b">
                  <th className="text-left p-2 w-8"></th>
                  <th className="text-left p-2">Lote / Série</th>
                  <th className="text-right p-2">Disponível</th>
                  <th className="text-right p-2 w-32">{modo === 'lote' ? 'Qtd a transferir' : 'Será enviado'}</th>
                  <th className="text-left p-2">Validade</th>
                </tr>
              </thead>
              <tbody>
                {lotes.map(l => {
                  const disponivel = Number(l.quantidade || 0);
                  const cur = sel[l.lote] || 0;
                  const checked = cur > 0;
                  return (
                    <tr key={l.lote} className={`border-b hover:bg-muted/40 ${checked ? 'bg-primary/5' : ''}`}>
                      <td className="p-2">
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() => toggle(l.lote, disponivel)}
                          disabled={disponivel <= 0}
                        />
                      </td>
                      <td className="p-2 font-mono font-semibold text-primary">{l.lote}</td>
                      <td className="p-2 text-right font-mono tabular-nums">
                        {disponivel.toLocaleString('pt-BR')}
                      </td>
                      <td className="p-2 text-right">
                        {modo === 'lote' ? (
                          <Input
                            type="text"
                            inputMode="decimal"
                            value={cur ? String(cur).replace('.', ',') : ''}
                            onChange={(e) => {
                              const v = Number(e.target.value.replace(',', '.').replace(/[^\d.]/g, ''));
                              if (!Number.isFinite(v)) return;
                              setQtd(l.lote, v, disponivel);
                            }}
                            placeholder="0"
                            disabled={disponivel <= 0}
                            className="h-7 text-xs text-right font-mono w-24 ml-auto"
                          />
                        ) : (
                          <span className="font-mono tabular-nums">
                            {checked ? disponivel.toLocaleString('pt-BR') : '—'}
                          </span>
                        )}
                      </td>
                      <td className="p-2 text-muted-foreground text-[11px]">
                        {l.data_validade ? formatDateBR(l.data_validade) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <DialogFooter className="border-t pt-3 sm:justify-between">
          <div className="flex items-center gap-2 text-xs">
            <Badge variant="secondary" className="font-mono">
              {Object.keys(sel).filter(k => sel[k] > 0).length} selecionados
            </Badge>
            <span className="text-muted-foreground">Total:</span>
            <span className="font-mono font-bold text-primary">{total.toLocaleString('pt-BR')}</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={confirmar} disabled={total <= 0}>Confirmar seleção</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
