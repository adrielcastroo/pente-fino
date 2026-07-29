import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Search, Loader2, Sparkles, Copy, Wand2, Target, Tag as TagIcon, Layers } from 'lucide-react';
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

interface ConfiguracaoLite {
  cd_configuracao: string;
  nm_configuracao: string;
  qtd_tags: number;
}

interface CustomTag {
  cd_configuracao: string;
  nm_configuracao: string | null;
  nm_tag_customizada: string | null;
  ds_tag_customizada: string | null;
  ds_tag_calculada: string | null;
  ds_tag_texto: string | null;
}

// ============================================================
// Tokenização e ranking
// ============================================================

function tokenize(input: string): string[] {
  if (!input) return [];
  return input
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .split(/[\s_\-/.,;:()\[\]]+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2);
}

function uniqTokens(list: string[]): string[] {
  return Array.from(new Set(list));
}

// Termos estruturais que valem mais peso (tipo de cortina, tubo, motor, etc)
const STRUCTURAL_PATTERNS: Array<{ re: RegExp; weight: number; label: string }> = [
  { re: /^(rollo|shadow|diamond|romana|celular|wanza|b2h|rollo_light|shadow_light)$/i, weight: 8, label: 'tipo' },
  { re: /^t\d{2,3}$/i, weight: 6, label: 'tubo' },
  { re: /^(cm[-_]?\d+|st\d+|lsn\d+|alt\d+)$/i, weight: 5, label: 'motor' },
  { re: /^(110v|220v|bateria)$/i, weight: 3, label: 'tensão' },
  { re: /^(rf|auto|manual|monocontrole|basic)$/i, weight: 2, label: 'controle' },
  { re: /^(abs2|abs20|absolute|basic|sky|day|night|semi|open|standard|nivelador|square|round|fascia)$/i, weight: 2, label: 'opção' },
  { re: /^(branco|branca|preto|preta|bege|bronze|cinza|grafite|marrom|azul|verde)$/i, weight: 2, label: 'cor' },
];

interface WeightedToken {
  token: string;
  weight: number;
  structural: boolean;
}

function weightTokens(tokens: string[]): WeightedToken[] {
  return tokens.map((t) => {
    // Normaliza abs2.0 → abs20
    const norm = t.replace(/\./g, '');
    for (const p of STRUCTURAL_PATTERNS) {
      if (p.re.test(norm)) return { token: norm, weight: p.weight, structural: true };
    }
    return { token: norm, weight: 1, structural: false };
  });
}

interface RankedConfig {
  cfg: ConfiguracaoLite;
  score: number;
  matched: string[];
  coverage: number;
}

function rankConfiguracoes(input: string, cfgs: ConfiguracaoLite[]): RankedConfig[] {
  const raw = uniqTokens(tokenize(input));
  if (raw.length === 0) return [];
  const weighted = weightTokens(raw);
  const strongCount = weighted.filter((w) => w.structural).length || 1;

  const results: RankedConfig[] = [];
  for (const cfg of cfgs) {
    const nm = cfg.nm_configuracao ?? '';
    if (!nm) continue;
    const hayTokens = new Set(tokenize(nm).map((t) => t.replace(/\./g, '')));
    const hayLower = nm.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    let score = 0;
    let strongHit = 0;
    const matched: string[] = [];
    for (const w of weighted) {
      if (hayTokens.has(w.token)) {
        score += w.weight * 2;
        matched.push(w.token);
        if (w.structural) strongHit++;
      } else if (w.token.length >= 3 && hayLower.includes(w.token)) {
        score += w.weight;
        matched.push(w.token);
        if (w.structural) strongHit++;
      }
    }
    const coverage = strongHit / strongCount;
    if (coverage < 0.5 || score < 6) continue;
    score += Math.round(coverage * 5);
    results.push({ cfg, score, matched, coverage });
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, 30);
}

// ============================================================
// Ranking de acabamentos (mantido)
// ============================================================
interface Ranked {
  acab: Acabamento;
  score: number;
  matched: string[];
}

function rankAcabamentos(input: string, acabs: Acabamento[]): Ranked[] {
  const inTokens = uniqTokens(tokenize(input));
  if (inTokens.length === 0) return [];
  const results: Ranked[] = [];
  for (const a of acabs) {
    const haystackFields = [
      a.nm_acabamento, a.chave_acabamento ?? '',
      a.nm_classe1 ?? '', a.nm_combinacao1 ?? '',
      a.nm_classe2 ?? '', a.nm_combinacao2 ?? '',
      a.nm_classe3 ?? '', a.nm_combinacao3 ?? '',
    ].join(' ');
    const hayTokens = new Set(tokenize(haystackFields));
    const haystackLower = haystackFields.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    let score = 0;
    const matched: string[] = [];
    for (const t of inTokens) {
      if (hayTokens.has(t)) { score += 2; matched.push(t); }
      else if (t.length >= 3 && haystackLower.includes(t)) { score += 1; matched.push(t); }
    }
    const coverage = matched.length / inTokens.length;
    if (coverage < 0.3) continue;
    score += Math.round(coverage * 3);
    if (score > 0) results.push({ acab: a, score, matched });
  }
  results.sort((a, b) => b.score - a.score);
  return results.slice(0, 5);
}

// ============================================================
// Normalização de código de TAG (T_BASE / T_base / t_tubo → T_BASE)
// ============================================================
function normalizeTagCode(raw: string | null | undefined): string {
  if (!raw) return '';
  return raw.replace(/&/g, '').trim().toUpperCase().replace(/\s+/g, '');
}

interface TagCategoria {
  code: string;
  items: Array<{ tag: CustomTag; cfgNome: string; score: number }>;
}

// ============================================================
// Componente
// ============================================================
export default function GerarTagTab() {
  const [busca, setBusca] = useState('');
  const [selecionado, setSelecionado] = useState<Acabamento | null>(null);
  const [tagGerada, setTagGerada] = useState('');
  const [entradaManual, setEntradaManual] = useState('');
  const entradaDeferida = useDeferredValue(entradaManual);

  // ---------- Acabamentos (lista lateral) ----------
  const { data: acabamentos = [], isLoading } = useQuery({
    queryKey: ['acabamentos-gerar-tag'],
    staleTime: 5 * 60 * 1000,
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

  // ---------- Configurações leves (todas) ----------
  const { data: configuracoes = [], isLoading: loadingCfgs } = useQuery({
    queryKey: ['auge-tag-custom-configuracoes'],
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('auge_tag_custom_configuracoes')
        .select('cd_configuracao, nm_configuracao, qtd_tags')
        .limit(20000);
      if (error) throw error;
      return (data ?? []) as ConfiguracaoLite[];
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

  const recomendacoes = useMemo(() => {
    if (!entradaDeferida.trim() || acabamentos.length === 0) return [];
    return rankAcabamentos(entradaDeferida, acabamentos);
  }, [entradaDeferida, acabamentos]);

  // ---------- Configurações ranqueadas ----------
  const configsRanqueadas = useMemo(() => {
    if (!entradaDeferida.trim() || configuracoes.length === 0) return [];
    return rankConfiguracoes(entradaDeferida, configuracoes);
  }, [entradaDeferida, configuracoes]);

  const topCfgCodes = useMemo(
    () => configsRanqueadas.slice(0, 12).map((r) => r.cfg.cd_configuracao),
    [configsRanqueadas],
  );

  // ---------- Fetch de TAGs somente para os top-N ----------
  const { data: tagsTop = [], isFetching: loadingTags } = useQuery({
    queryKey: ['auge-tag-custom-top', topCfgCodes.join(',')],
    enabled: topCfgCodes.length > 0,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('auge_tag_custom')
        .select('cd_configuracao, nm_configuracao, nm_tag_customizada, ds_tag_customizada, ds_tag_calculada, ds_tag_texto')
        .in('cd_configuracao', topCfgCodes)
        .limit(5000);
      if (error) throw error;
      return (data ?? []) as CustomTag[];
    },
  });

  // ---------- Agrupamento por CATEGORIA de TAG (T_BASE, T_TUBO, ...) ----------
  const categorias = useMemo<TagCategoria[]>(() => {
    if (tagsTop.length === 0) return [];
    const scoreByCfg = new Map(configsRanqueadas.map((r) => [r.cfg.cd_configuracao, r.score]));
    const byCode = new Map<string, TagCategoria>();
    for (const tag of tagsTop) {
      const code = normalizeTagCode(tag.ds_tag_customizada ?? tag.nm_tag_customizada);
      if (!code) continue;
      const score = scoreByCfg.get(tag.cd_configuracao) ?? 0;
      const cfgNome = tag.nm_configuracao ?? tag.cd_configuracao;
      const cat = byCode.get(code) ?? { code, items: [] };
      cat.items.push({ tag, cfgNome, score });
      byCode.set(code, cat);
    }
    const arr = Array.from(byCode.values());
    for (const c of arr) c.items.sort((a, b) => b.score - a.score);
    arr.sort((a, b) => (b.items[0]?.score ?? 0) - (a.items[0]?.score ?? 0));
    return arr;
  }, [tagsTop, configsRanqueadas]);

  const melhor = recomendacoes[0] ?? null;

  const gerar = (input: string) => setTagGerada(normalizeTagFormatC(input));

  const selecionar = (a: Acabamento) => {
    setSelecionado(a);
    setEntradaManual(a.nm_acabamento);
    gerar(a.nm_acabamento);
  };

  useEffect(() => {
    if (!melhor) return;
    if (selecionado?.cd_acabamento === melhor.acab.cd_acabamento) return;
    if (melhor.score >= 6 && melhor.acab.ds_tag_calculada) {
      setTagGerada(melhor.acab.ds_tag_calculada);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [melhor?.acab.cd_acabamento, melhor?.score]);

  const aplicarRecomendacao = (r: Ranked) => {
    setSelecionado(r.acab);
    if (r.acab.ds_tag_calculada) setTagGerada(r.acab.ds_tag_calculada);
    else gerar(r.acab.nm_acabamento);
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
              placeholder="Ex: Rollo Abs2.0 M Motor LSN40 110v_RF T42 Standard P_Lat/Base_6.5_Parede Preto"
              className="text-xs min-h-[70px] font-mono"
            />
            <p className="text-[10px] text-muted-foreground">
              O app identifica tipo de cortina (Rollo/Shadow/Romana…), tubo (T35/T42/T65…), motor e cor,
              busca a configuração compatível e agrupa as TAGs por categoria (T_BASE, T_TUBO, T_TEC_X…).
            </p>
            {loadingCfgs && (
              <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" /> Carregando catálogo de configurações…
              </div>
            )}
          </div>


          {/* Categorias de TAGs (T_BASE, T_TUBO, T_TEC_X, ...) */}
          {(loadingTags && categorias.length === 0) && (
            <div className="rounded border p-3 text-[10px] text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" /> Buscando TAGs das configurações compatíveis…
            </div>
          )}
          {categorias.length > 0 && (
            <div className="rounded border border-primary/40 bg-primary/5 p-3 space-y-2">
              <div className="text-[10px] uppercase text-muted-foreground flex items-center gap-1">
                <TagIcon className="h-3 w-3" /> TAGs recomendadas por categoria
                <Badge variant="outline" className="text-[9px]">{categorias.length}</Badge>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Cada categoria representa um tipo de desperdício/componente (base, tubo, tecido, motor…).
                A primeira sugestão de cada é a melhor casada com a configuração descrita.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {categorias.map((cat) => {
                  const best = cat.items[0];
                  const bestValor = best?.tag.ds_tag_customizada ?? best?.tag.nm_tag_customizada ?? best?.tag.ds_tag_texto ?? best?.tag.ds_tag_calculada ?? '—';
                  return (
                    <div key={cat.code} className="rounded border bg-background p-2 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-mono font-semibold text-[11px] text-primary truncate">{cat.code}</div>
                        <Badge variant="outline" className="text-[9px] shrink-0">{cat.items.length}</Badge>
                      </div>
                      <button
                        onClick={() => { setTagGerada(normalizeTagFormatC(bestValor)); toast.success(`TAG ${cat.code} aplicada.`); }}
                        className="w-full text-left rounded border border-primary/30 hover:bg-primary/10 p-1.5 transition"
                        title="Aplicar esta TAG"
                      >
                        <div className="font-mono text-[11px] text-primary break-all">{bestValor}</div>
                        <div className="text-[9px] text-muted-foreground truncate mt-0.5">{best?.cfgNome}</div>
                      </button>
                      {cat.items.length > 1 && (
                        <details className="text-[10px]">
                          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                            + {cat.items.length - 1} variação(ões)
                          </summary>
                          <div className="space-y-1 mt-1">
                            {cat.items.slice(1, 6).map((it, i) => {
                              const v = it.tag.ds_tag_customizada ?? it.tag.nm_tag_customizada ?? it.tag.ds_tag_texto ?? it.tag.ds_tag_calculada ?? '—';
                              return (
                                <button
                                  key={i}
                                  onClick={() => { setTagGerada(normalizeTagFormatC(v)); toast.success(`TAG ${cat.code} aplicada.`); }}
                                  className="w-full text-left rounded border-transparent hover:border hover:bg-muted p-1 transition"
                                >
                                  <div className="font-mono text-[10px] break-all">{v}</div>
                                  <div className="text-[9px] text-muted-foreground truncate">{it.cfgNome} · score {it.score}</div>
                                </button>
                              );
                            })}
                          </div>
                        </details>
                      )}
                    </div>
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
