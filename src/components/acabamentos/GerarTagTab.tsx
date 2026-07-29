import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  Wand2,
  Tag as TagIcon,
  Layers,
  X,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Search,
  Sparkles,

} from 'lucide-react';
import { toast } from 'sonner';
import { normalizeTagFormatC } from '@/lib/tag-utils';

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

const STRUCTURAL_PATTERNS: Array<{ re: RegExp; weight: number; label: string }> = [
  { re: /^(rollo|shadow|diamond|romana|celular|wanza|b2h|rollo_light|shadow_light)$/i, weight: 8, label: 'tipo' },
  { re: /^t\d{2,3}$/i, weight: 6, label: 'tubo' },
  { re: /^(cm[-_]?\d+|st\d+|lsn\d+|alt\d+)$/i, weight: 5, label: 'motor' },
  { re: /^(110v|220v|bateria)$/i, weight: 3, label: 'tensão' },
  { re: /^(rf|auto|manual|monocontrole|basic)$/i, weight: 2, label: 'controle' },
  { re: /^(abs2|abs20|absolute|basic|sky|day|night|semi|open|standard|nivelador|square|round|fascia)$/i, weight: 2, label: 'opção' },
  { re: /^(branco|branca|preto|preta|bege|bronze|cinza|grafite|marrom|azul|verde)$/i, weight: 2, label: 'cor' },
];

interface WeightedToken { token: string; weight: number; structural: boolean }

function weightTokens(tokens: string[]): WeightedToken[] {
  return tokens.map((t) => {
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

function normalizeTagCode(raw: string | null | undefined): string {
  if (!raw) return '';
  return raw.replace(/&/g, '').trim().toUpperCase().replace(/\s+/g, '');
}

// ============================================================
// Curinga estilo SAP B1
// ============================================================

function sanitizeTerm(raw: string): string {
  return raw.replace(/[,()"'\\]/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * "TUB*" → "TUB%" · "*MOTOR" → "%MOTOR" · "T*42" → "T%42" · "MOTOR" → "%MOTOR%".
 */
function toIlikePattern(raw: string): string {
  const clean = sanitizeTerm(raw);
  if (!clean) return '';
  const escaped = clean.replace(/%/g, ' ').replace(/\s+/g, ' ').trim();
  if (escaped.includes('*')) return escaped.replace(/\*/g, '%');
  return `%${escaped}%`;
}

/**
 * Quebra o termo em tokens para busca AND (cada token precisa existir na
 * configuração, em qualquer ordem). Evita falhas quando o usuário digita a
 * descrição com espaçamento/ordem levemente diferente do cadastro no Auge.
 */
function toIlikeTokens(raw: string): string[] {
  const clean = sanitizeTerm(raw).replace(/%/g, ' ');
  return clean
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2)
    .slice(0, 12)
    .map((t) => (t.includes('*') ? t.replace(/\*/g, '%') : `%${t}%`));
}


interface TagCategoria {
  code: string;
  items: Array<{ tag: CustomTag; cfgNome: string; score: number }>;
}

/** Linha da tabela: TAG customizada escolhida + TAG calculada vinculada. */
interface LinhaTag {
  id: string;
  code: string;
  valor: string;
  cfgNome: string;
  calculada: string;
}

interface ResultadoAuge {
  ok: boolean;
  descricao?: string;
  total?: number;
  gravadas?: number;
  falhas?: number;
  results?: Array<{ tag: string; calculada: string; ok: boolean; erro?: string }>;
  augeRows?: any[];
  error?: string;
}

/**
 * Rascunho em memória (escopo do módulo): mantém o progresso ao navegar entre
 * abas/páginas do SPA e é descartado ao recarregar a página.
 */
interface RascunhoGerarTag {
  descricao: string;
  linhas: LinhaTag[];
  customAberta: { cd: string; nm: string } | null;
}

const rascunho: RascunhoGerarTag = {
  descricao: '',
  linhas: [],
  customAberta: null,
};

// ============================================================
// Célula de busca da TAG calculada (curinga SAP B1)
// ============================================================

function TagCalculadaCell({
  valor,
  onChange,
}: {
  valor: string;
  onChange: (v: string) => void;
}) {
  const [busca, setBusca] = useState('');
  const [aberto, setAberto] = useState(false);
  const [termo, setTermo] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setTermo(busca.trim()), 300);
    return () => clearTimeout(t);
  }, [busca]);

  const padrao = useMemo(() => toIlikePattern(termo), [termo]);

  const { data: opcoes = [], isFetching } = useQuery({
    queryKey: ['tag-calculada-busca', termo, padrao],
    enabled: aberto && termo.length >= 2,
    staleTime: 60 * 1000,
    queryFn: async () => {
      const seen = new Set<string>();
      const out: Array<{ valor: string; cfg: string }> = [];

      // 1) NOMES das TAGs calculadas (ex.: CONS_CORT_WAVE_IRREG_SLIM).
      //    A busca é pelo nome da TAG, não pela descrição.
      if (padrao) {
        const { data } = await (supabase as any)
          .from('auge_acabamentos')
          .select('ds_tag_calculada, nm_acabamento')
          .not('ds_tag_calculada', 'is', null)
          .ilike('ds_tag_calculada', padrao)
          .order('ds_tag_calculada', { ascending: true })
          .limit(200);
        for (const r of (data ?? []) as any[]) {
          const v = String(r.ds_tag_calculada ?? '').trim();
          if (!v || seen.has(v)) continue;
          seen.add(v);
          out.push({ valor: v, cfg: r.nm_acabamento ?? '' });
        }
      }


      // 2) Busca ao vivo no Auge (caso o espelho ainda não esteja sincronizado).
      if (out.length === 0) {
        try {
          const { data: fn } = await supabase.functions.invoke('auge-sync?action=tag_calculada_select', {
            body: { term: termo.replace(/\*/g, '') },
          });

          const alvo = termo.replace(/\*/g, '').toLowerCase();
          const rows = (fn as any)?.rows ?? [];
          for (const r of rows as Array<{ id: string; text: string }>) {
            const v = String(r?.text ?? '').trim();
            if (!v || seen.has(v)) continue;
            if (alvo && !v.toLowerCase().includes(alvo)) continue;
            seen.add(v);
            out.push({ valor: v, cfg: '' });
          }
        } catch { /* segue para o fallback local */ }
      }

      // 3) Fallback: o que já está sincronizado localmente (acabamentos).
      if (out.length === 0 && padrao) {
        const { data } = await (supabase as any)
          .from('auge_acabamentos')
          .select('ds_tag_calculada, nm_acabamento')
          .not('ds_tag_calculada', 'is', null)
          .ilike('ds_tag_calculada', padrao)
          .limit(200);
        for (const r of (data ?? []) as any[]) {
          const v = String(r.ds_tag_calculada ?? '').trim();
          if (!v || seen.has(v)) continue;
          seen.add(v);
          out.push({ valor: v, cfg: r.nm_acabamento ?? '' });
        }
      }


      // 3) Fallback: TAGs calculadas já vinculadas em TAG Custom.
      if (out.length === 0 && padrao) {
        const { data } = await (supabase as any)
          .from('auge_tag_custom')
          .select('ds_tag_calculada, cd_tag_calculada, nm_configuracao')
          .or(`ds_tag_calculada.ilike.${padrao},cd_tag_calculada.ilike.${padrao}`)
          .limit(200);
        for (const r of (data ?? []) as any[]) {
          const v = String(r.ds_tag_calculada ?? r.cd_tag_calculada ?? '').trim();
          if (!v || seen.has(v)) continue;
          seen.add(v);
          out.push({ valor: v, cfg: r.nm_configuracao ?? '' });
        }
      }

      return out.slice(0, 50);
    },
  });


  if (valor && !aberto) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="font-mono text-[11px] break-all flex-1">{valor}</span>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 px-2 text-[10px] shrink-0"
          onClick={() => { setAberto(true); setBusca(valor); }}
        >
          Trocar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
        <Input
          value={busca}
          autoFocus={aberto}
          onFocus={() => setAberto(true)}
          onChange={(e) => { setBusca(e.target.value); setAberto(true); }}
          placeholder="Buscar TAG calculada (use * como curinga)"
          className="h-8 pl-7 text-[11px] font-mono"
        />
      </div>
      {aberto && termo.length >= 2 && (

        <div className="rounded border bg-background max-h-40 overflow-auto">
          {isFetching && (
            <div className="p-2 text-[10px] text-muted-foreground flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" /> Buscando…
            </div>
          )}
          {!isFetching && opcoes.length === 0 && (
            <div className="p-2 space-y-1">
              <p className="text-[10px] text-muted-foreground">
                Nenhuma TAG calculada encontrada. Tente <code className="font-mono">*termo*</code>.
              </p>
              <button
                onClick={() => { onChange(termo.replace(/\*/g, '').trim()); setAberto(false); }}
                className="text-[10px] text-primary hover:underline"
              >
                Usar “{termo.replace(/\*/g, '').trim()}” como texto livre
              </button>
            </div>
          )}

          {opcoes.map((o) => (
            <button
              key={o.valor}
              onClick={() => { onChange(o.valor); setAberto(false); }}
              className="w-full text-left px-2 py-1 hover:bg-muted/60 transition"
            >
              <div className="font-mono text-[11px] break-all">{o.valor}</div>
              {o.cfg && <div className="text-[9px] text-muted-foreground truncate">{o.cfg}</div>}
            </button>
          ))}
        </div>
      )}
      {aberto && valor && (
        <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px]" onClick={() => setAberto(false)}>
          Cancelar
        </Button>
      )}
    </div>
  );
}

// ============================================================
// Busca de Configuração (equivale ao campo "Configuração" do Auge)
// ============================================================

function ConfiguracaoSelect({
  valor,
  onChange,
}: {
  valor: { cd: string; nm: string } | null;
  onChange: (v: { cd: string; nm: string } | null) => void;
}) {
  const [busca, setBusca] = useState('');
  const [termo, setTermo] = useState('');
  const [aberto, setAberto] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setTermo(busca.trim()), 300);
    return () => clearTimeout(t);
  }, [busca]);

  const padrao = useMemo(() => toIlikePattern(termo), [termo]);
  const tokens = useMemo(() => toIlikeTokens(termo), [termo]);

  const { data: opcoes = [], isFetching } = useQuery({
    queryKey: ['tag-custom-configuracao-busca', padrao, tokens.join('|')],
    enabled: aberto && padrao.length >= 3,
    staleTime: 60 * 1000,
    queryFn: async () => {
      const dedupe = (rows: ConfiguracaoLite[]) => {
        const seen = new Set<string>();
        const out: ConfiguracaoLite[] = [];
        for (const r of rows) {
          const cd = String(r.cd_configuracao ?? '').trim();
          if (!cd || seen.has(cd)) continue;
          seen.add(cd);
          out.push({ cd_configuracao: cd, nm_configuracao: r.nm_configuracao ?? cd, qtd_tags: r.qtd_tags ?? 0 });
        }
        return out;
      };

      // 1) View local (só lista configurações que já têm linhas de TAG gravadas).
      const exata = await (supabase as any)
        .from('auge_tag_custom_configuracoes')
        .select('cd_configuracao, nm_configuracao, qtd_tags')
        .ilike('nm_configuracao', padrao)
        .limit(50);
      if (!exata.error && (exata.data ?? []).length > 0) return dedupe(exata.data as ConfiguracaoLite[]);

      // 2) View local por tokens (AND, ordem livre).
      if (tokens.length > 0) {
        let q = (supabase as any)
          .from('auge_tag_custom_configuracoes')
          .select('cd_configuracao, nm_configuracao, qtd_tags');
        for (const t of tokens) q = q.ilike('nm_configuracao', t);
        const { data } = await q.limit(50);
        if ((data ?? []).length > 0) return dedupe(data as ConfiguracaoLite[]);
      }

      // 3) Varredura (auge_tag_custom_scan): configurações conhecidas no Auge que
      //    ainda não têm linhas de TAG gravadas localmente.
      const scanExata = await (supabase as any)
        .from('auge_tag_custom_scan')
        .select('cd_configuracao, nm_configuracao, qtd_tags')
        .ilike('nm_configuracao', padrao)
        .limit(50);
      if (!scanExata.error && (scanExata.data ?? []).length > 0) return dedupe(scanExata.data as ConfiguracaoLite[]);

      if (tokens.length > 0) {
        let qs = (supabase as any)
          .from('auge_tag_custom_scan')
          .select('cd_configuracao, nm_configuracao, qtd_tags');
        for (const t of tokens) qs = qs.ilike('nm_configuracao', t);
        const { data } = await qs.limit(50);
        if ((data ?? []).length > 0) return dedupe(data as ConfiguracaoLite[]);
      }

      // 4) Último recurso: lookup ao vivo no Auge (fonte oficial).
      try {
        const { data: fn } = await supabase.functions.invoke('auge-sync?action=tag_config_select', {
          body: { term: sanitizeTerm(termo).replace(/\*/g, ' ').trim(), qtdItens: 50 },
        });
        const rows = ((fn as any)?.rows ?? []) as Array<{ id: string; text: string }>;
        return dedupe(rows.map((r) => ({
          cd_configuracao: String(r.id ?? '').trim(),
          nm_configuracao: String(r.text ?? '').trim(),
          qtd_tags: 0,
        })));
      } catch {
        return [] as ConfiguracaoLite[];
      }
    },
  });



  if (valor && !aberto) {
    return (
      <div className="flex items-center gap-2 rounded border px-2 py-2">
        <Layers className="h-3.5 w-3.5 text-primary shrink-0" />
        <span className="text-[11px] font-medium break-all flex-1">{valor.nm}</span>
        <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px]" onClick={() => { setAberto(true); setBusca(valor.nm); }}>
          Trocar
        </Button>
        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => onChange(null)} aria-label="Limpar configuração">
          <X className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          value={busca}
          onFocus={() => setAberto(true)}
          onChange={(e) => { setBusca(e.target.value); setAberto(true); }}
          placeholder="Digite para procurar a configuração (use * como curinga)"
          className="h-10 pl-7 text-[11px]"
        />
      </div>
      {aberto && padrao.length >= 3 && (
        <div className="rounded border bg-background max-h-48 overflow-auto">
          {isFetching && (
            <div className="p-2 text-[10px] text-muted-foreground flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" /> Buscando…
            </div>
          )}
          {!isFetching && opcoes.length === 0 && (
            <div className="p-2 text-[10px] text-muted-foreground">Nenhuma configuração encontrada.</div>
          )}
          {opcoes.map((o) => (
            <button
              key={o.cd_configuracao}
              onClick={() => { onChange({ cd: o.cd_configuracao, nm: o.nm_configuracao }); setAberto(false); }}
              className="w-full text-left px-2 py-1 hover:bg-muted/60 transition"
            >
              <div className="text-[11px] break-all">{o.nm_configuracao}</div>
              <div className="text-[9px] text-muted-foreground">{o.qtd_tags} TAG(s)</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Componente principal
// ============================================================
export default function GerarTagTab() {
  const [descricao, setDescricao] = useState(rascunho.descricao);
  const descricaoDeferida = useDeferredValue(descricao);
  const [linhas, setLinhas] = useState<LinhaTag[]>(rascunho.linhas);
  const [customAberta, setCustomAberta] = useState<{ cd: string; nm: string } | null>(rascunho.customAberta);
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoAuge | null>(null);
  const [tentouEnviar, setTentouEnviar] = useState(false);

  useEffect(() => { rascunho.descricao = descricao; }, [descricao]);
  useEffect(() => { rascunho.linhas = linhas; }, [linhas]);
  useEffect(() => { rascunho.customAberta = customAberta; }, [customAberta]);

  // Termo com debounce para busca server-side em tempo real.
  const [termoBusca, setTermoBusca] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setTermoBusca(descricao.trim()), 300);
    return () => clearTimeout(t);
  }, [descricao]);

  // ---------- Configurações (catálogo leve) ----------
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

  const configsRanqueadas = useMemo(() => {
    if (!descricaoDeferida.trim() || configuracoes.length === 0) return [];
    return rankConfiguracoes(descricaoDeferida, configuracoes);
  }, [descricaoDeferida, configuracoes]);

  const topCfgCodes = useMemo(
    () => configsRanqueadas.slice(0, 12).map((r) => r.cfg.cd_configuracao),
    [configsRanqueadas],
  );

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

  const padraoBusca = useMemo(() => toIlikePattern(termoBusca), [termoBusca]);
  const tokensBusca = useMemo(() => toIlikeTokens(termoBusca), [termoBusca]);

  const { data: tagsBusca = [], isFetching: loadingBusca } = useQuery({
    queryKey: ['auge-tag-custom-busca', padraoBusca, tokensBusca.join('|')],
    enabled: padraoBusca.length >= 3,
    staleTime: 60 * 1000,
    queryFn: async () => {
      const cols = ['nm_configuracao', 'ds_tag_customizada', 'nm_tag_customizada', 'ds_tag_texto', 'ds_tag_calculada'];
      const { data, error } = await (supabase as any)
        .from('auge_tag_custom')
        .select('cd_configuracao, nm_configuracao, nm_tag_customizada, ds_tag_customizada, ds_tag_calculada, ds_tag_texto')
        .or(cols.map((c) => `${c}.ilike.${padraoBusca}`).join(','))
        .limit(300);
      if (error) throw error;
      if ((data ?? []).length > 0) return data as CustomTag[];

      // Fallback por tokens na configuração (ordem/espaçamento diferentes).
      if (tokensBusca.length === 0) return [] as CustomTag[];
      let q = (supabase as any)
        .from('auge_tag_custom')
        .select('cd_configuracao, nm_configuracao, nm_tag_customizada, ds_tag_customizada, ds_tag_calculada, ds_tag_texto');
      for (const t of tokensBusca) q = q.ilike('nm_configuracao', t);
      const alt = await q.limit(300);
      return (alt.data ?? []) as CustomTag[];
    },

  });

  // TAGs Custom existentes que casam com o termo pesquisado.
  const customsEncontradas = useMemo(() => {
    const byCfg = new Map<string, { cd: string; nm: string; qtd: number }>();
    for (const t of tagsBusca) {
      const cd = t.cd_configuracao;
      const cur = byCfg.get(cd) ?? { cd, nm: t.nm_configuracao ?? cd, qtd: 0 };
      cur.qtd += 1;
      byCfg.set(cd, cur);
    }
    return Array.from(byCfg.values()).sort((a, b) => a.nm.localeCompare(b.nm)).slice(0, 30);
  }, [tagsBusca]);

  const { data: tagsDaCustom = [], isFetching: loadingCustom } = useQuery({
    queryKey: ['auge-tag-custom-detalhe', customAberta?.cd ?? ''],
    enabled: !!customAberta?.cd,
    staleTime: 60 * 1000,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('auge_tag_custom')
        .select('cd_configuracao, nm_configuracao, nm_tag_customizada, ds_tag_customizada, ds_tag_calculada, ds_tag_texto')
        .eq('cd_configuracao', customAberta!.cd)
        .limit(2000);
      if (error) throw error;
      const locais = (data ?? []) as CustomTag[];
      if (locais.length > 0) return locais;

      // Sem linhas locais: consulta ao vivo no Auge (a edge function também
      // grava o resultado, então na próxima vez já vem do banco).
      try {
        const { data: fn } = await supabase.functions.invoke('auge-sync?action=tag_custom_por_config', {
          body: { cdConfiguracao: customAberta!.cd, nmConfiguracao: customAberta!.nm },
        });
        const rows = ((fn as any)?.rows ?? []) as any[];
        return rows.map((r) => ({
          cd_configuracao: String(r.cdConfiguracao ?? customAberta!.cd),
          nm_configuracao: r.nmConfiguracao ?? customAberta!.nm ?? null,
          nm_tag_customizada: r.nmTagCustomizada ?? null,
          ds_tag_customizada: r.dsTagCustomizada ?? null,
          ds_tag_calculada: r.dsTagCalculada ?? null,
          ds_tag_texto: r.dsTagTexto ?? null,
        })) as CustomTag[];
      } catch {
        return locais;
      }
    },
  });


  // União: TAGs das configurações ranqueadas + busca direta + TAG Custom aberta.
  const tagsUnificadas = useMemo<CustomTag[]>(() => {
    const seen = new Set<string>();
    const out: CustomTag[] = [];
    for (const t of [...tagsDaCustom, ...tagsTop, ...tagsBusca]) {
      const k = `${t.cd_configuracao}|${t.ds_tag_customizada ?? t.nm_tag_customizada ?? ''}|${t.ds_tag_texto ?? ''}`;
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(t);
    }
    return out;
  }, [tagsDaCustom, tagsTop, tagsBusca]);

  // ---------- Agrupamento por categoria (T_BASE, T_TUBO, ...) ----------
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

  /** TAGs recomendadas (bloco da esquerda): melhor item de cada categoria. */
  const recomendadas = useMemo(() => {
    const out: Array<{ id: string; code: string; valor: string; cfgNome: string; calculada: string }> = [];
    for (const cat of categorias) {
      const best = cat.items[0];
      if (!best) continue;
      const valorBruto = best.tag.ds_tag_customizada ?? best.tag.nm_tag_customizada ?? best.tag.ds_tag_texto ?? '';
      const valor = normalizeTagFormatC(valorBruto);
      if (!valor || valor === '—') continue;
      out.push({
        id: `${cat.code}|${valor}`,
        code: cat.code,
        valor,
        cfgNome: best.cfgNome,
        calculada: normalizeTagFormatC(best.tag.ds_tag_calculada ?? ''),
      });
    }
    return out;
  }, [categorias]);

  // ---------- Padrão obrigatório de TAGs ----------
  /**
   * Agrupa as configurações (TAG Customs) já existentes que casam com o texto
   * digitado. Cada configuração vira um "modelo" com o conjunto de TAGs
   * Configuradas que ela possui.
   */
  const modelosExistentes = useMemo(() => {
    const map = new Map<string, { nm: string; codes: Map<string, { valor: string; calculada: string }> }>();
    for (const t of [...tagsBusca, ...tagsTop]) {
      const code = normalizeTagCode(t.ds_tag_customizada ?? t.nm_tag_customizada);
      if (!code) continue;
      const valor = normalizeTagFormatC(t.ds_tag_customizada ?? t.nm_tag_customizada ?? t.ds_tag_texto ?? '');
      if (!valor) continue;
      const cur = map.get(t.cd_configuracao) ?? {
        nm: t.nm_configuracao ?? t.cd_configuracao,
        codes: new Map<string, { valor: string; calculada: string }>(),
      };
      if (!cur.codes.has(code)) {
        cur.codes.set(code, { valor, calculada: normalizeTagFormatC(t.ds_tag_calculada ?? '') });
      }
      map.set(t.cd_configuracao, cur);
    }
    return map;
  }, [tagsBusca, tagsTop]);

  /**
   * TAGs Configuradas que são padrão (presentes em praticamente todos os
   * modelos com a mesma descrição). São obrigatórias na nova TAG Custom.
   */
  const obrigatorias = useMemo(() => {
    const totalModelos = modelosExistentes.size;
    if (totalModelos < 2) return [] as Array<{ code: string; valor: string; calculada: string; freq: number; total: number }>;
    const acc = new Map<string, { n: number; valor: string; calculadas: Map<string, number> }>();
    for (const modelo of modelosExistentes.values()) {
      for (const [code, info] of modelo.codes) {
        const cur = acc.get(code) ?? { n: 0, valor: info.valor, calculadas: new Map<string, number>() };
        cur.n += 1;
        if (info.calculada) cur.calculadas.set(info.calculada, (cur.calculadas.get(info.calculada) ?? 0) + 1);
        acc.set(code, cur);
      }
    }
    const minimo = Math.max(2, Math.ceil(totalModelos * 0.9));
    const out: Array<{ code: string; valor: string; calculada: string; freq: number; total: number }> = [];
    for (const [code, info] of acc) {
      if (info.n < minimo) continue;
      const calculada = Array.from(info.calculadas.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '';
      out.push({ code, valor: info.valor, calculada, freq: info.n, total: totalModelos });
    }
    return out.sort((a, b) => b.freq - a.freq || a.code.localeCompare(b.code));
  }, [modelosExistentes]);

  const codigosNaTabela = useMemo(() => new Set(linhas.map((l) => l.code)), [linhas]);
  const obrigatoriasFaltando = useMemo(
    () => obrigatorias.filter((o) => !codigosNaTabela.has(o.code)),
    [obrigatorias, codigosNaTabela],
  );

  /** Nenhuma configuração existente casou com o texto → TAG Custom nova. */
  const ehTagCustomNova = useMemo(
    () =>
      !customAberta &&
      termoBusca.trim().length >= 3 &&
      !loadingBusca &&
      customsEncontradas.length === 0,
    [customAberta, termoBusca, loadingBusca, customsEncontradas.length],
  );

  // ---------- Manipulação das linhas da tabela ----------
  const jaNaTabela = (id: string) => linhas.some((l) => l.id === id);


  const adicionarLinha = (r: { id: string; code: string; valor: string; cfgNome: string; calculada: string }) => {
    setResultado(null);
    setLinhas((prev) => {
      if (prev.some((l) => l.id === r.id)) {
        toast.info(`TAG ${r.code} removida da tabela.`);
        return prev.filter((l) => l.id !== r.id);
      }
      toast.success(`TAG ${r.code} adicionada à coluna Tag Customizada.`);
      return [...prev, { id: r.id, code: r.code, valor: r.valor, cfgNome: r.cfgNome, calculada: r.calculada }];
    });
  };

  /** Adiciona a "Tag" (texto livre) digitada pelo usuário como linha da tabela. */
  const adicionarTagTextoLivre = () => {
    const valor = normalizeTagFormatC(descricao);
    if (!valor) {
      toast.error('Digite o nome da Tag antes de adicionar.');
      return;
    }
    const id = `livre|${valor}`;
    if (linhas.some((l) => l.id === id)) {
      toast.info('Essa Tag já está na tabela.');
      return;
    }
    setResultado(null);
    setLinhas((prev) => [...prev, {
      id,
      code: normalizeTagCode(valor) || 'TAG',
      valor,
      cfgNome: customAberta?.nm ?? '',
      calculada: '',
    }]);
    toast.success('Tag adicionada à coluna Tag Customizada.');
  };

  const setCalculada = (id: string, calculada: string) => {
    setLinhas((prev) => prev.map((l) => (l.id === id ? { ...l, calculada } : l)));
  };

  /** Insere de uma vez todas as TAGs Configuradas obrigatórias que faltam. */
  const adicionarObrigatoriasFaltando = () => {
    if (obrigatoriasFaltando.length === 0) return;
    setResultado(null);
    setLinhas((prev) => {
      const existentes = new Set(prev.map((l) => l.code));
      const novas = obrigatoriasFaltando
        .filter((o) => !existentes.has(o.code))
        .map((o) => ({
          id: `obrig|${o.code}|${o.valor}`,
          code: o.code,
          valor: o.valor,
          cfgNome: customAberta?.nm ?? '',
          calculada: o.calculada,
        }));
      return [...prev, ...novas];
    });
    toast.success(`${obrigatoriasFaltando.length} TAG(s) obrigatória(s) adicionada(s).`);
  };

  const descricaoInvalida = tentouEnviar && descricao.trim().length === 0;

  const adicionarTagCustom = async () => {
    setTentouEnviar(true);
    if (!descricao.trim()) {
      toast.error('Informe a descrição da TAG Custom antes de continuar.');
      return;
    }
    if (linhas.length === 0) {
      toast.error('Adicione ao menos uma TAG customizada na tabela.');
      return;
    }
    if (obrigatoriasFaltando.length > 0) {
      toast.error(
        `Faltam TAGs obrigatórias do padrão: ${obrigatoriasFaltando.map((o) => o.code).join(', ')}.`,
      );
      return;
    }

    setEnviando(true);
    setResultado(null);
    try {
      const { data, error } = await supabase.functions.invoke('auge-sync?action=criar_tag_custom', {
        body: {
          cdConfiguracao: customAberta?.cd ?? '',
          descricao: descricao.trim(),
          itens: linhas.map((l) => ({
            dsTagCustomizada: l.valor,
            dsTagCalculada: l.calculada,
            dsTagTexto: descricao.trim(),
          })),
        },
      });
      if (error) throw error;
      const res = data as ResultadoAuge;
      setResultado(res);
      if (res?.ok) toast.success(`TAG Custom gravada no Auge (${res.gravadas}/${res.total}).`);
      else toast.error(res?.error ?? 'O Auge não confirmou a gravação da TAG Custom.');
    } catch (e: any) {
      const msg = e?.message ?? 'Falha ao criar a TAG Custom no Auge.';
      setResultado({ ok: false, error: msg });
      toast.error(msg);
    } finally {
      setEnviando(false);
    }
  };

  const carregandoRecs = loadingCfgs || loadingTags || loadingBusca || loadingCustom;

  return (
    <div className="space-y-4">
      
      {/* Espelha o diálogo "Manter Tag Customizada" do Auge */}
      <Card className="p-4 space-y-4">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Wand2 className="h-3.5 w-3.5" /> Manter Tag Customizada
        </div>

        {/* Configuração: busca a TAG Custom (configuração) existente */}
        <div className="space-y-1">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Configuração
          </div>
          <ConfiguracaoSelect valor={customAberta} onChange={(v) => { setCustomAberta(v); setResultado(null); }} />
          <p className="text-[10px] text-muted-foreground">
            Busca a TAG Custom já existente no sistema. Deixe vazio para criar uma nova.
          </p>
        </div>

        {/* Tag: nome livre */}
        <div className="space-y-1">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            Tag
            <Badge variant="destructive" className="text-[9px]">obrigatório</Badge>
          </div>
          <div className="flex gap-2">
            <Input
              value={descricao}
              onChange={(e) => { setDescricao(e.target.value); setResultado(null); }}
              onKeyDown={(e) => { if (e.key === 'Enter') adicionarTagTextoLivre(); }}
              placeholder="Nome da Tag (texto livre). Ex: Rollo Abs2.0 T42 Standard Preto"
              className={`h-11 text-xs font-mono flex-1 ${descricaoInvalida ? 'border-destructive focus-visible:ring-destructive' : ''}`}
            />
            <Button variant="outline" className="h-11 px-3 gap-1 text-[11px] shrink-0" onClick={adicionarTagTextoLivre}>
              <Plus className="h-3.5 w-3.5" /> Adicionar
            </Button>
          </div>
          {descricaoInvalida && (
            <p className="text-[10px] text-destructive flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> O nome da Tag é obrigatório.
            </p>
          )}
          <p className="text-[10px] text-muted-foreground">
            O texto também alimenta as recomendações ao lado.
            <span className="font-semibold text-foreground"> Curinga:</span> use <code className="font-mono">*</code> como
            no SAP B1 — <code className="font-mono">T42*</code> começa com, <code className="font-mono">*motor</code> termina
            com, <code className="font-mono">T*42</code> contém no meio (mín. 3 caracteres).
          </p>
        </div>


        {ehTagCustomNova && (
          <div className="rounded border border-amber-500/40 bg-amber-500/10 p-2.5 flex items-start gap-2">
            <Sparkles className="h-3.5 w-3.5 text-amber-600 mt-0.5 shrink-0" />
            <div className="min-w-0">
              <div className="text-[11px] font-semibold flex items-center gap-1.5">
                Nova TAG Custom
                <Badge className="bg-amber-500 text-amber-950 hover:bg-amber-500 text-[9px]">será criada</Badge>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Nenhuma configuração existente casou com “{termoBusca.trim()}”. Ao gravar, o Auge
                criará uma TAG Custom nova com as TAGs Configuradas da tabela ao lado.
              </p>
            </div>
          </div>
        )}

        {obrigatorias.length > 0 && (
          <div
            className={`rounded border p-2.5 space-y-2 ${
              obrigatoriasFaltando.length > 0
                ? 'border-destructive/50 bg-destructive/5'
                : 'border-emerald-500/40 bg-emerald-500/5'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="text-[11px] font-semibold flex items-center gap-1.5">
                  {obrigatoriasFaltando.length > 0
                    ? <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                    : <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />}
                  TAGs Configuradas obrigatórias
                  <Badge variant="outline" className="text-[9px]">
                    {obrigatorias.length - obrigatoriasFaltando.length}/{obrigatorias.length}
                  </Badge>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Padrão detectado nos modelos existentes com a mesma descrição. A gravação fica
                  bloqueada enquanto faltar alguma.
                </p>
              </div>
              {obrigatoriasFaltando.length > 0 && (
                <Button size="sm" variant="outline" className="h-7 px-2 text-[10px] shrink-0" onClick={adicionarObrigatoriasFaltando}>
                  <Plus className="h-3 w-3 mr-1" /> Adicionar faltantes
                </Button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {obrigatorias.map((o) => {
                const ok = codigosNaTabela.has(o.code);
                return (
                  <span
                    key={o.code}
                    title={`${o.valor} · presente em ${o.freq}/${o.total} modelos`}
                    className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 font-mono text-[10px] ${
                      ok
                        ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                        : 'border-destructive/50 bg-destructive/10 text-destructive'
                    }`}
                  >
                    {ok ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                    {o.code}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </Card>



      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4 items-start">
        {/* Bloco esquerdo: TAGs recomendadas */}
        <Card className="p-3 space-y-2">
          <div className="text-[10px] uppercase text-muted-foreground flex items-center gap-1">
            <TagIcon className="h-3 w-3" /> TAGs recomendadas
            <Badge variant="outline" className="text-[9px]">{recomendadas.length}</Badge>
          </div>
          <p className="text-[10px] text-muted-foreground">
            Clique para enviar a TAG para a coluna <span className="font-medium text-foreground">Tag Customizada</span>.
          </p>

          {carregandoRecs && recomendadas.length === 0 && (
            <div className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" /> Buscando TAGs no catálogo do Auge…
            </div>
          )}
          {!carregandoRecs && recomendadas.length === 0 && (
            <div className="text-[10px] text-muted-foreground">
              Digite a descrição acima para receber recomendações.
            </div>
          )}

          <div className="space-y-1.5 max-h-[65vh] overflow-auto">
            {recomendadas.map((r) => {
              const dentro = jaNaTabela(r.id);
              return (
                <button
                  key={r.id}
                  onClick={() => adicionarLinha(r)}
                  className={`w-full text-left rounded border p-2 transition ${dentro ? 'border-primary bg-primary/15' : 'hover:bg-muted/50'}`}
                >
                  <div className="flex items-start gap-1.5">
                    {dentro
                      ? <CheckCircle2 className="h-3 w-3 mt-0.5 text-primary shrink-0" />
                      : <Plus className="h-3 w-3 mt-0.5 text-muted-foreground shrink-0" />}
                    <div className="min-w-0">
                      <div className="font-mono font-semibold text-[10px] text-primary">{r.code}</div>
                      <div className="font-mono text-[10px] break-all">{r.valor}</div>
                      <div className="text-[9px] text-muted-foreground truncate">{r.cfgNome}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Tabela principal */}
        <Card className="overflow-hidden">
          <div className="p-3 border-b flex items-center justify-between gap-2">
            <div className="text-xs font-semibold">
              Composição da TAG Custom
              <span className="ml-2 text-[10px] font-normal text-muted-foreground">
                {linhas.length} TAG(s)
              </span>
            </div>
            {linhas.length > 0 && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-[10px]"
                onClick={() => { setLinhas([]); setResultado(null); }}
              >
                Limpar
              </Button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted">
                <tr className="text-left">
                  <th className="p-2 w-[45%]">Tag Customizada</th>
                  <th className="p-2 w-[45%]">Tag Calculada</th>
                  <th className="p-2 text-right w-10"></th>
                </tr>
              </thead>
              <tbody>
                {linhas.map((l) => (
                  <tr key={l.id} className="border-t align-top">
                    <td className="p-2">
                      <div className="font-mono font-semibold text-[10px] text-primary">{l.code}</div>
                      <div className="font-mono text-[11px] break-all">{l.valor}</div>
                      <div className="text-[9px] text-muted-foreground truncate">{l.cfgNome}</div>
                    </td>
                    <td className="p-2">
                      <TagCalculadaCell valor={l.calculada} onChange={(v) => setCalculada(l.id, v)} />
                    </td>
                    <td className="p-2 text-right">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => setLinhas((prev) => prev.filter((x) => x.id !== l.id))}
                        aria-label="Remover TAG"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {linhas.length === 0 && (
                  <tr>
                    <td colSpan={3} className="p-6 text-center text-muted-foreground text-[11px]">
                      Selecione TAGs recomendadas à esquerda para montar a TAG Custom.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="p-3 border-t space-y-1.5">
            <Button
              onClick={adicionarTagCustom}
              disabled={enviando || obrigatoriasFaltando.length > 0}
              className="w-full h-10 gap-2 text-xs"
            >
              {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {enviando ? 'Gravando no Auge…' : `Adicionar TAG Custom (${linhas.length})`}
            </Button>
            {obrigatoriasFaltando.length > 0 && (
              <p className="text-[10px] text-destructive flex items-start gap-1">
                <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
                Obrigatório incluir: {obrigatoriasFaltando.map((o) => o.code).join(', ')}.
              </p>
            )}

          </div>

          {/* Retorno do Auge */}
          {resultado && (
            <div className={`m-3 rounded border p-3 space-y-2 ${resultado.ok ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-destructive/40 bg-destructive/5'}`}>
              <div className="text-[10px] uppercase flex items-center gap-1 font-semibold">
                {resultado.ok
                  ? <><CheckCircle2 className="h-3 w-3 text-emerald-600" /> Gravada no Auge</>
                  : <><AlertTriangle className="h-3 w-3 text-destructive" /> Falha na gravação</>}
                {typeof resultado.gravadas === 'number' && (
                  <Badge variant="outline" className="text-[9px]">
                    {resultado.gravadas}/{resultado.total} ok
                  </Badge>
                )}
              </div>

              {resultado.error && (
                <div className="text-[11px] text-destructive break-words">{resultado.error}</div>
              )}

              {!!resultado.results?.length && (
                <div className="rounded border bg-background overflow-x-auto">
                  <table className="w-full text-[10px]">
                    <thead className="bg-muted"><tr className="text-left">
                      <th className="p-1.5">Tag Customizada</th>
                      <th className="p-1.5">Tag Calculada</th>
                      <th className="p-1.5">Status</th>
                    </tr></thead>
                    <tbody>
                      {resultado.results.map((r, i) => (
                        <tr key={i} className="border-t">
                          <td className="p-1.5 font-mono break-all">{r.tag}</td>
                          <td className="p-1.5 font-mono break-all">{r.calculada || '—'}</td>
                          <td className="p-1.5">
                            {r.ok
                              ? <span className="text-emerald-600">OK</span>
                              : <span className="text-destructive break-words">{r.erro}</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {!!resultado.augeRows?.length && (
                <div className="space-y-1">
                  <div className="text-[9px] uppercase text-muted-foreground">Como ficou no Auge</div>
                  <div className="rounded border bg-background max-h-56 overflow-auto">
                    <table className="w-full text-[10px]">
                      <thead className="bg-muted"><tr className="text-left">
                        <th className="p-1.5">Tag Customizada</th>
                        <th className="p-1.5">Tag Calculada</th>
                        <th className="p-1.5">Configuração</th>
                      </tr></thead>
                      <tbody>
                        {resultado.augeRows.map((r: any, i: number) => (
                          <tr key={i} className="border-t">
                            <td className="p-1.5 font-mono break-all">{r.dsTagCustomizada ?? r.nmTagCustomizada ?? '—'}</td>
                            <td className="p-1.5 font-mono break-all">{r.dsTagCalculada ?? r.dsTagTexto ?? '—'}</td>
                            <td className="p-1.5 break-all">{r.nmConfiguracao ?? r.cdConfiguracao ?? '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
