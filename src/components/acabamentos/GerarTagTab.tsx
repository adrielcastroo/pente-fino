import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Copy, Wand2, Tag as TagIcon, Layers, X, CheckCircle2 } from 'lucide-react';
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

// ============================================================
// Curinga estilo SAP B1: "*" = qualquer sequência de caracteres
// ============================================================

/** Remove caracteres que quebrariam o parser de filtros do PostgREST. */
function sanitizeTerm(raw: string): string {
  return raw.replace(/[,()"'\\]/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Converte um termo com curinga `*` em padrão ILIKE.
 * - "TUB*"    → "TUB%"       (começa com)
 * - "*MOTOR"  → "%MOTOR"     (termina com)
 * - "T*42"    → "T%42"       (contém no meio)
 * - "MOTOR"   → "%MOTOR%"    (contém — comportamento padrão)
 * Escapa `%` e `_` digitados literalmente para não virarem curingas ocultos.
 */
function toIlikePattern(raw: string): string {
  const clean = sanitizeTerm(raw);
  if (!clean) return '';
  // `%` digitado vira espaço para não virar curinga oculto. `_` é mantido:
  // como curinga de 1 caractere ele também casa com o próprio underscore.
  const escaped = clean.replace(/%/g, ' ').replace(/\s+/g, ' ').trim();
  if (escaped.includes('*')) return escaped.replace(/\*/g, '%');
  return `%${escaped}%`;
}

interface TagCategoria {
  code: string;
  items: Array<{ tag: CustomTag; cfgNome: string; score: number }>;
}

/** TAG escolhida pelo usuário para compor a TAG Custom final. */
interface TagSelecionada {
  id: string;
  code: string;
  valor: string;
  cfgNome: string;
}



// ============================================================
// Componente
// ============================================================
export default function GerarTagTab() {
  const [selecionado, setSelecionado] = useState<Acabamento | null>(null);
  const [tagGerada, setTagGerada] = useState('');
  const [entradaManual, setEntradaManual] = useState('');
  const entradaDeferida = useDeferredValue(entradaManual);

  // TAGs escolhidas que compõem a TAG Custom final (acumuladas sob a descrição).
  const [selecionadas, setSelecionadas] = useState<TagSelecionada[]>([]);
  const [tagCustomConfirmada, setTagCustomConfirmada] = useState('');


  // Termo com debounce usado na busca server-side de TAGs (tempo real).
  const [termoBusca, setTermoBusca] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setTermoBusca(entradaManual.trim()), 300);
    return () => clearTimeout(t);
  }, [entradaManual]);


  // ---------- Acabamentos (catálogo para recomendações) ----------
  const { data: acabamentos = [] } = useQuery({
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

  // ---------- Busca direta (tempo real) no catálogo de TAGs ----------
  // Independe do ranking local: consulta o banco a cada digitação (debounce 300ms),
  // aceitando curinga `*` no estilo SAP B1.
  const padraoBusca = useMemo(() => toIlikePattern(termoBusca), [termoBusca]);

  const { data: tagsBusca = [], isFetching: loadingBusca } = useQuery({
    queryKey: ['auge-tag-custom-busca', padraoBusca],
    enabled: padraoBusca.length >= 3,
    staleTime: 60 * 1000,
    queryFn: async () => {
      const cols = [
        'nm_configuracao',
        'ds_tag_customizada',
        'nm_tag_customizada',
        'ds_tag_texto',
        'ds_tag_calculada',
      ];
      const { data, error } = await (supabase as any)
        .from('auge_tag_custom')
        .select('cd_configuracao, nm_configuracao, nm_tag_customizada, ds_tag_customizada, ds_tag_calculada, ds_tag_texto')
        .or(cols.map((c) => `${c}.ilike.${padraoBusca}`).join(','))
        .limit(300);
      if (error) throw error;
      return (data ?? []) as CustomTag[];
    },
  });

  // União: TAGs das configurações ranqueadas + TAGs encontradas na busca direta.
  const tagsUnificadas = useMemo<CustomTag[]>(() => {
    const seen = new Set<string>();
    const out: CustomTag[] = [];
    for (const t of [...tagsTop, ...tagsBusca]) {
      const k = `${t.cd_configuracao}|${t.ds_tag_customizada ?? t.nm_tag_customizada ?? ''}|${t.ds_tag_texto ?? ''}`;
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(t);
    }
    return out;
  }, [tagsTop, tagsBusca]);

  // ---------- Agrupamento por CATEGORIA de TAG (T_BASE, T_TUBO, ...) ----------
  const categorias = useMemo<TagCategoria[]>(() => {
    if (tagsUnificadas.length === 0) return [];
    const scoreByCfg = new Map(configsRanqueadas.map((r) => [r.cfg.cd_configuracao, r.score]));
    const byCode = new Map<string, TagCategoria>();
    for (const tag of tagsUnificadas) {

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
  }, [tagsUnificadas, configsRanqueadas]);

  const melhor = recomendacoes[0] ?? null;

  const gerar = (input: string) => setTagGerada(normalizeTagFormatC(input));

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

  // ---------- Seleção acumulada de TAGs ----------
  const toggleTag = (code: string, valorBruto: string, cfgNome: string) => {
    const valor = normalizeTagFormatC(valorBruto);
    if (!valor || valor === '—') return;
    const id = `${code}|${valor}`;
    setSelecionadas((prev) => {
      if (prev.some((s) => s.id === id)) {
        toast.info(`TAG ${code} removida da composição.`);
        return prev.filter((s) => s.id !== id);
      }
      toast.success(`TAG ${code} adicionada à composição.`);
      return [...prev, { id, code, valor, cfgNome }];
    });
    setTagCustomConfirmada('');
  };

  const isSelecionada = (code: string, valorBruto: string) =>
    selecionadas.some((s) => s.id === `${code}|${normalizeTagFormatC(valorBruto)}`);

  const composicao = useMemo(
    () => selecionadas.map((s) => s.valor).join(' '),
    [selecionadas],
  );

  // A descrição da TAG Custom é exatamente o texto usado para gerar as recomendações.
  const descricaoCustom = entradaManual.trim();

  const confirmarTagCustom = () => {
    if (selecionadas.length === 0) return;
    const final = normalizeTagFormatC(composicao);
    setTagCustomConfirmada(final);
    setTagGerada(final);
    navigator.clipboard?.writeText(final).catch(() => undefined);
    toast.success(
      customAberta
        ? `TAG Custom "${customAberta.nm}" atualizada com ${selecionadas.length} TAG(s) e copiada.`
        : `TAG Custom criada com ${selecionadas.length} TAG(s) e copiada.`,
    );
  };



  return (
    <div className="grid grid-cols-1 gap-4">
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
            <p className="text-[10px] text-muted-foreground">
              <span className="font-semibold text-foreground">Curinga:</span> use <code className="font-mono">*</code> como
              no SAP B1 — <code className="font-mono">T42*</code> começa com, <code className="font-mono">*motor</code> termina
              com, <code className="font-mono">T*42</code> contém no meio. Sem <code className="font-mono">*</code>, a busca
              é "contém". A consulta é feita direto no catálogo do Auge enquanto você digita (mín. 3 caracteres).
            </p>
            {loadingCfgs && (
              <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" /> Carregando catálogo de configurações…
              </div>
            )}
          </div>

          {/* Categorias de TAGs (T_BASE, T_TUBO, T_TEC_X, ...) */}
          {((loadingTags || loadingBusca) && categorias.length === 0) && (
            <div className="rounded border p-3 text-[10px] text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" /> Buscando TAGs no catálogo do Auge…
            </div>
          )}
          {padraoBusca.length >= 3 && !loadingBusca && categorias.length === 0 && (
            <div className="rounded border p-3 text-[10px] text-muted-foreground">
              Nenhuma TAG encontrada para esse termo. Tente usar <code className="font-mono">*</code> (ex.: <code className="font-mono">*T42*</code>).
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
                      <div className="font-mono font-semibold text-[11px] text-primary truncate">{cat.code}</div>
                      <button
                        onClick={() => toggleTag(cat.code, bestValor, best?.cfgNome ?? '')}
                        className={`w-full text-left rounded border p-1.5 transition ${isSelecionada(cat.code, bestValor) ? 'border-primary bg-primary/15' : 'border-primary/30 hover:bg-primary/10'}`}
                        title="Selecionar/remover esta TAG da composição"
                      >
                        <div className="flex items-center gap-1.5">
                          {isSelecionada(cat.code, bestValor) && <CheckCircle2 className="h-3 w-3 text-primary shrink-0" />}
                          <div className="font-mono text-[11px] text-primary break-all">{bestValor}</div>
                        </div>
                        <div className="text-[9px] text-muted-foreground truncate mt-0.5">{best?.cfgNome}</div>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAGs acumuladas sob a descrição */}
          {selecionadas.length > 0 && (
            <div className="rounded border border-primary/40 bg-primary/5 p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="text-[10px] uppercase text-muted-foreground flex items-center gap-1">
                  <Layers className="h-3 w-3" /> TAGs selecionadas
                  <Badge variant="outline" className="text-[9px]">{selecionadas.length}</Badge>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2 text-[10px]"
                  onClick={() => { setSelecionadas([]); setTagCustomConfirmada(''); }}
                >
                  Limpar
                </Button>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {selecionadas.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => toggleTag(s.code, s.valor, s.cfgNome)}
                    title={`${s.cfgNome} — clique para remover`}
                    className="group flex items-center gap-1.5 rounded border border-primary/40 bg-background px-2 py-1 text-[10px] hover:border-destructive/60 transition"
                  >
                    <span className="font-mono font-semibold text-primary">{s.code}</span>
                    <span className="font-mono break-all">{s.valor}</span>
                    <X className="h-3 w-3 text-muted-foreground group-hover:text-destructive" />
                  </button>
                ))}
              </div>

              <div className="rounded border bg-background p-2">
                <div className="text-[9px] uppercase text-muted-foreground">Prévia da TAG Custom</div>
                <div className="font-mono text-[11px] break-all">{composicao}</div>
              </div>

              <Button onClick={confirmarTagCustom} className="w-full h-9 gap-2 text-xs">
                <CheckCircle2 className="h-4 w-4" />
                Confirmar criação da TAG Custom ({selecionadas.length})
              </Button>

              {tagCustomConfirmada && (
                <div className="rounded border border-emerald-500/40 bg-emerald-500/5 p-2 space-y-1">
                  <div className="text-[9px] uppercase text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> TAG Custom criada (copiada para a área de transferência)
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="font-mono text-[11px] break-all flex-1">{tagCustomConfirmada}</div>
                    <Button size="sm" variant="outline" className="h-6 px-2 text-[10px] gap-1 shrink-0" onClick={copiar}>
                      <Copy className="h-3 w-3" /> Copiar
                    </Button>
                  </div>
                </div>
              )}
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


        </Card>
      </div>
    </div>
  );
}
