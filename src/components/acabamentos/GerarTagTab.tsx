import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Search, Loader2, Sparkles, Copy, Wand2, Target } from 'lucide-react';
import { toast } from 'sonner';
import { normalizeTagFormatC } from '@/lib/tag-utils';

interface Acabamento {
  cd_acabamento: string;
  chave_acabamento: string | null;
  nm_acabamento: string;
  ds_tag_calculada: string | null;
  nm_classe1: string | null;
  nm_combinacao1: string | null;
  nm_classe2: string | null;
  nm_combinacao2: string | null;
  nm_classe3: string | null;
  nm_combinacao3: string | null;
}

// Tokeniza descrição para comparação — mantém alfanuméricos, remove separadores comuns.
function tokenize(input: string): string[] {
  if (!input) return [];
  return input
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove acentos
    .split(/[\s_\-/.,;:()\[\]]+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2);
}

// Retorna tokens únicos (Set-like via Array)
function uniqTokens(list: string[]): string[] {
  return Array.from(new Set(list));
}

interface Ranked {
  acab: Acabamento;
  score: number;
  matched: string[];
}

// Ranking heurístico:
// - +2 se o token bater exatamente com um token do nm_acabamento/chave/classes
// - +1 se o token for substring de alguma classe/combinação
// - Bonus se termos "âncora" (motor codes, dimensões T50 etc) baterem em posição
function rankAcabamentos(input: string, acabs: Acabamento[]): Ranked[] {
  const inTokens = uniqTokens(tokenize(input));
  if (inTokens.length === 0) return [];

  const results: Ranked[] = [];
  for (const a of acabs) {
    const haystackFields = [
      a.nm_acabamento,
      a.chave_acabamento ?? '',
      a.nm_classe1 ?? '', a.nm_combinacao1 ?? '',
      a.nm_classe2 ?? '', a.nm_combinacao2 ?? '',
      a.nm_classe3 ?? '', a.nm_combinacao3 ?? '',
    ].join(' ');
    const hayTokens = new Set(tokenize(haystackFields));
    const haystackLower = haystackFields.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    let score = 0;
    const matched: string[] = [];
    for (const t of inTokens) {
      if (hayTokens.has(t)) {
        score += 2;
        matched.push(t);
      } else if (t.length >= 3 && haystackLower.includes(t)) {
        score += 1;
        matched.push(t);
      }
    }
    // penaliza descasamento severo (input com muitos tokens, poucos batidos)
    const coverage = matched.length / inTokens.length;
    if (coverage < 0.3) continue;
    // bonifica quando a maioria dos tokens bate
    score += Math.round(coverage * 3);

    if (score > 0) results.push({ acab: a, score, matched });
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, 5);
}

export default function GerarTagTab() {
  const [busca, setBusca] = useState('');
  const [selecionado, setSelecionado] = useState<Acabamento | null>(null);
  const [tagGerada, setTagGerada] = useState('');
  const [entradaManual, setEntradaManual] = useState('');

  const { data: acabamentos = [], isLoading } = useQuery({
    queryKey: ['acabamentos-gerar-tag'],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('auge_acabamentos')
        .select('cd_acabamento, chave_acabamento, nm_acabamento, ds_tag_calculada, nm_classe1, nm_combinacao1, nm_classe2, nm_combinacao2, nm_classe3, nm_combinacao3')
        .neq('id_cancelado', 'S')
        .order('nm_acabamento', { ascending: true })
        .limit(5000);
      return (data ?? []) as Acabamento[];
    },
  });

  const filtrados = useMemo(() => {
    const t = busca.trim().toLowerCase();
    if (!t) return acabamentos.slice(0, 200);
    return acabamentos
      .filter((a) =>
        (a.nm_acabamento ?? '').toLowerCase().includes(t) ||
        (a.chave_acabamento ?? '').toLowerCase().includes(t))
      .slice(0, 200);
  }, [acabamentos, busca]);

  // Recomendações baseadas no que o usuário digita
  const recomendacoes = useMemo(() => {
    if (!entradaManual.trim() || acabamentos.length === 0) return [];
    return rankAcabamentos(entradaManual, acabamentos);
  }, [entradaManual, acabamentos]);

  const melhor = recomendacoes[0] ?? null;

  const gerar = (input: string) => {
    setTagGerada(normalizeTagFormatC(input));
  };

  const selecionar = (a: Acabamento) => {
    setSelecionado(a);
    setEntradaManual(a.nm_acabamento);
    gerar(a.nm_acabamento);
  };

  // Se o usuário está digitando livre e há uma recomendação forte, aplica sua TAG
  // (mas não sobrescreve seleção manual explícita).
  useEffect(() => {
    if (!melhor) return;
    if (selecionado?.cd_acabamento === melhor.acab.cd_acabamento) return;
    // score mínimo para autoaplicar tag recomendada
    if (melhor.score >= 6 && melhor.acab.ds_tag_calculada) {
      setTagGerada(melhor.acab.ds_tag_calculada);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [melhor?.acab.cd_acabamento, melhor?.score]);

  const aplicarRecomendacao = (r: Ranked) => {
    setSelecionado(r.acab);
    if (r.acab.ds_tag_calculada) {
      setTagGerada(r.acab.ds_tag_calculada);
    } else {
      gerar(r.acab.nm_acabamento);
    }
  };

  const componentesClasses = selecionado ? [
    { label: 'Classe 1', valor: selecionado.nm_classe1, comb: selecionado.nm_combinacao1 },
    { label: 'Classe 2', valor: selecionado.nm_classe2, comb: selecionado.nm_combinacao2 },
    { label: 'Classe 3', valor: selecionado.nm_classe3, comb: selecionado.nm_combinacao3 },
  ].filter((c) => c.valor || c.comb) : [];

  const copiar = () => {
    if (!tagGerada) return;
    navigator.clipboard.writeText(tagGerada);
    toast.success('TAG copiada.');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-4">
      <Card className="p-3 space-y-3 h-fit">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar configuração..." className="h-9 pl-7 text-xs" />
        </div>
        <div className="text-[10px] text-muted-foreground">Mostrando {filtrados.length} de {acabamentos.length}</div>
        <div className="max-h-[60vh] overflow-auto space-y-1">
          {isLoading && <div className="p-4 text-center"><Loader2 className="h-4 w-4 animate-spin inline" /></div>}
          {filtrados.map((a) => (
            <button
              key={a.cd_acabamento}
              onClick={() => selecionar(a)}
              className={`w-full text-left rounded border p-2 text-xs transition ${selecionado?.cd_acabamento === a.cd_acabamento ? 'bg-primary/10 border-primary' : 'hover:bg-muted'}`}
            >
              <div className="font-medium truncate">{a.nm_acabamento}</div>
              <div className="font-mono text-[10px] text-muted-foreground">{a.chave_acabamento ?? `#${a.cd_acabamento}`}</div>
            </button>
          ))}
        </div>
      </Card>

      <div className="space-y-3">
        <Card className="p-4 space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Wand2 className="h-3.5 w-3.5" /> Gerar TAG a partir da descrição
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-medium">Descrição / Configuração</label>
            <Textarea
              value={entradaManual}
              onChange={(e) => { setEntradaManual(e.target.value); gerar(e.target.value); }}
              placeholder="Ex: Cortina Motor CM_35 220v_RF Liso 5% Balance Barra_15cm Reto P_Preto"
              className="text-xs min-h-[70px] font-mono"
            />
            <p className="text-[10px] text-muted-foreground">
              Digite a descrição livre. O sistema reconhece os componentes (linha, motor, tecido, cor…) e recomenda a TAG do acabamento correspondente.
            </p>
          </div>

          {/* Recomendações automáticas */}
          {recomendacoes.length > 0 && (
            <div className="rounded border bg-accent/30 p-3 space-y-2">
              <div className="text-[10px] uppercase text-muted-foreground flex items-center gap-1">
                <Target className="h-3 w-3" /> Recomendações de acabamento
              </div>
              <div className="space-y-1.5">
                {recomendacoes.map((r) => {
                  const isSel = selecionado?.cd_acabamento === r.acab.cd_acabamento;
                  const isBest = r === melhor;
                  return (
                    <button
                      key={r.acab.cd_acabamento}
                      onClick={() => aplicarRecomendacao(r)}
                      className={`w-full text-left rounded border p-2 text-xs transition ${isSel ? 'bg-primary/10 border-primary' : 'hover:bg-background border-transparent'}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            {isBest && <Badge variant="default" className="text-[9px] h-4">melhor</Badge>}
                            <span className="font-medium truncate">{r.acab.nm_acabamento}</span>
                          </div>
                          <div className="font-mono text-[10px] text-muted-foreground mt-0.5">
                            {r.acab.chave_acabamento ?? `#${r.acab.cd_acabamento}`}
                            {r.acab.ds_tag_calculada && (
                              <> · TAG: <span className="text-primary">{r.acab.ds_tag_calculada}</span></>
                            )}
                          </div>
                          {r.matched.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {r.matched.slice(0, 6).map((m) => (
                                <span key={m} className="inline-block px-1 py-0 rounded bg-primary/10 text-primary text-[9px] font-mono">{m}</span>
                              ))}
                            </div>
                          )}
                        </div>
                        <Badge variant="outline" className="text-[9px] shrink-0">score {r.score}</Badge>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {selecionado && componentesClasses.length > 0 && (
            <div className="rounded border bg-muted/30 p-2 space-y-1">
              <div className="text-[10px] uppercase text-muted-foreground">Composição (classes do Auge)</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[11px]">
                {componentesClasses.map((c, i) => (
                  <div key={i}>
                    <div className="text-muted-foreground">{c.label}</div>
                    <div className="font-medium">{c.valor ?? '—'}</div>
                    {c.comb && <div className="text-[10px] text-muted-foreground">{c.comb}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="rounded border border-primary/40 bg-primary/5 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-[10px] uppercase text-muted-foreground flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> TAG recomendada
              </div>
              <Button size="sm" variant="ghost" onClick={copiar} disabled={!tagGerada} className="h-7 gap-1 text-[11px]">
                <Copy className="h-3 w-3" /> Copiar
              </Button>
            </div>
            <div className="font-mono text-sm break-all min-h-[24px]">{tagGerada || <span className="text-muted-foreground text-xs">—</span>}</div>
            {selecionado?.ds_tag_calculada && (
              <div className="text-[10px] text-muted-foreground">
                TAG atual do acabamento no Auge: <span className="font-mono">{selecionado.ds_tag_calculada}</span>
              </div>
            )}
          </div>

          <Button disabled className="w-full h-10 gap-2" title="Aguardando HAR do endpoint de gravação de TAG no Auge">
            <Sparkles className="h-4 w-4" />
            Salvar TAG no Auge (aguardando endpoint)
          </Button>
          <p className="text-[10px] text-muted-foreground text-center">
            A gravação será habilitada assim que os HARs de TAG forem enviados.
          </p>
        </Card>
      </div>
    </div>
  );
}
