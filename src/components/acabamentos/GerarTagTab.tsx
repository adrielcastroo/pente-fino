import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Pencil,
  History,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { normalizeTagFormatC } from '@/lib/tag-utils';
import { registrarEventoTag, type TagEventoTipo } from '@/lib/tag-historico';

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
  { re: /^(rollo|shadow|diamond|romana|celular|wanza|b2h|rollo_light|shadow_light|cortina|persiana)$/i, weight: 8, label: 'tipo' },
  { re: /^t\d{2,3}$/i, weight: 6, label: 'tubo' },
  { re: /^(cm[-_]?\d+|st\d+|lsn\d+|alt\d+)$/i, weight: 5, label: 'motor' },
  { re: /^(110v|220v|bateria|pilha)$/i, weight: 3, label: 'tensão' },
  { re: /^(rf|auto|manual|monocontrole|basic|wifi|zigbee)$/i, weight: 2, label: 'controle' },
  { re: /^(abs2|abs20|absolute|basic|sky|day|night|semi|open|standard|nivelador|square|round|fascia|blackout|translúcido|dimout|balance)$/i, weight: 2, label: 'opção' },
  { re: /^(branco|branca|preto|preta|bege|bronze|cinza|grafite|marrom|azul|verde|offwhite)$/i, weight: 2, label: 'cor' },
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
    if (coverage < 0.2 || score < 2) continue;
    score += Math.round(coverage * 5);
    results.push({ cfg, score, matched, coverage });
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, 500);
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
 *
 * O curinga `*` também é tratado como separador: "Cortina*CM*35*Liso*10*"
 * vira os tokens `%cortina%`, `%cm%`, `%35%`, `%liso%`, `%10%`, todos exigidos
 * (AND) mas sem impor a ORDEM em que aparecem no nome — que era exatamente o
 * motivo de a busca com curinga não retornar todos os itens esperados.
 */
function toIlikeTokens(raw: string): string[] {
  const clean = sanitizeTerm(raw).replace(/%/g, ' ');
  return clean
    .split(/[\s*]+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 1)
    .slice(0, 12)
    .map((t) => `%${t}%`);
}


/** Normalização usada nas comparações por palavra-chave. */
function normKey(s: string): string {
  return (s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export interface Palavra { token: string; weight: number; structural: boolean }

/**
 * Palavras-chave da configuração digitada, ordenadas da mais relevante
 * (tipo/tubo/motor) para a menos relevante. Usadas para descobrir quais TAGs
 * Configuradas são obrigatórias.
 */
function extrairPalavras(input: string): Palavra[] {
  const raw = uniqTokens(normKey(input).split(' ').filter((t) => t.length >= 2));
  return weightTokens(raw).sort((a, b) => b.weight - a.weight || a.token.localeCompare(b.token));
}




interface TagCategoria {
  code: string;
  items: Array<{ tag: CustomTag; cfgNome: string; score: number }>;
}

/** Linha da tabela: TAG configurada escolhida + TAG calculada vinculada. */
interface LinhaTag {
  id: string;
  code: string;
  valor: string;
  cfgNome: string;
  calculada: string;
  /** Fórmula da TAG calculada (mesma coluna existente no Auge). */
  formula: string;
  /** Código da linha no Auge — quando presente, a gravação sobrescreve. */
  cdTagCustomizada?: string;
  /**
   * Código da TAG calculada no Auge (`cd_tag`). Quando o usuário escolhe a
   * opção na lista já temos o código: enviá-lo evita que o backend precise
   * reencontrar a TAG pelo nome (fórmulas com vírgula quebravam essa busca).
   */
  cdTagCalculada?: string;
}

interface ResultadoAuge {
  ok: boolean;
  descricao?: string;
  cdConfiguracao?: string;

  total?: number;
  gravadas?: number;
  falhas?: number;
  results?: Array<{
    tag: string;
    calculada: string;
    formula?: string;
    cdTagCustomizada?: string;
    ok: boolean;
    erro?: string;
  }>;
  augeRows?: any[];
  error?: string;
}

/**
 * Rascunho em memória (escopo do módulo): mantém o progresso ao navegar entre
 * abas/páginas do SPA e ao alternar de janela (alt+tab). Só é descartado
 * quando a página é recarregada ou o navegador é fechado.
 */
interface RascunhoGerarTag {
  descricao: string;
  linhas: LinhaTag[];
  customAberta: { cd: string; nm: string } | null;
  resultado: ResultadoAuge | null;
}

const rascunho: RascunhoGerarTag = {
  descricao: '',
  linhas: [],
  customAberta: null,
  resultado: null,
};

// ============================================================
// Histórico local ("Últimos registros")
// ============================================================

/** Um lançamento feito nesta aba, guardado para reedição/relançamento. */
export interface RegistroGerarTag {
  id: string;
  /** ISO timestamp da gravação. */
  em: string;
  ok: boolean;
  descricao: string;
  configuracao: { cd: string; nm: string } | null;
  linhas: LinhaTag[];
}

const HISTORICO_KEY = 'gerar-tag:historico';
const HISTORICO_MAX = 10;

function lerHistorico(): RegistroGerarTag[] {
  try {
    const raw = localStorage.getItem(HISTORICO_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as RegistroGerarTag[]).slice(0, HISTORICO_MAX) : [];
  } catch {
    return [];
  }
}

function gravarHistorico(regs: RegistroGerarTag[]): void {
  try {
    localStorage.setItem(HISTORICO_KEY, JSON.stringify(regs.slice(0, HISTORICO_MAX)));
  } catch {
    /* quota cheia — histórico é conveniência, nunca bloqueia o fluxo */
  }
}

function formatarData(iso: string): string {
  try {
    return new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return iso;
  }
}


/** Valor completo de uma TAG calculada selecionada. */
interface TagCalculadaSel {
  valor: string;
  formula: string;
  /** Código no Auge — usado para completar a fórmula truncada da grade. */
  cdTag?: string;
}

/** A grade do Auge trunca fórmulas longas ("...", "…"). */
function formulaTruncada(f: string): boolean {
  return /(\.\.\.|…)$/.test((f ?? '').trim());
}

/**
 * Busca no Auge a fórmula inteira quando a grade devolveu a versão truncada,
 * garantindo que a coluna "Fórmula" do Pente Fino mostre o mesmo do ERP.
 */
async function completarFormula(sel: TagCalculadaSel): Promise<TagCalculadaSel> {
  if (!sel.valor || (sel.formula && !formulaTruncada(sel.formula))) return sel;
  try {
    // Timeout defensivo: o Auge pode demorar/estourar CPU na Edge Function.
    // Sem isso a promise fica pendurada e a célula nunca conclui a seleção.
    const req = supabase.functions.invoke('auge-sync?action=tag_calculada_formula', {
      body: { cdTag: sel.cdTag ?? '', nome: sel.valor },
    });
    const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 12_000));
    const res = await Promise.race([req, timeout]);
    if (!res) return sel;
    const formula = String((res as { data?: { formula?: unknown } })?.data?.formula ?? '').trim();
    return formula ? { ...sel, formula } : sel;
  } catch {
    return sel;
  }
}




// ============================================================
// Célula de busca da TAG calculada (curinga SAP B1)
// ============================================================

function TagCalculadaCell({
  valor,
  onChange,
  compacto = false,
}: {
  valor: string;
  onChange: (v: TagCalculadaSel) => void;
  compacto?: boolean;
}) {
  const [busca, setBusca] = useState('');
  const [aberto, setAberto] = useState(false);
  const [termo, setTermo] = useState('');
  /** Evita atualizar estado depois que a célula sai da tela (blank screen). */
  const montadoRef = useRef(true);
  useEffect(() => {
    montadoRef.current = true;
    return () => { montadoRef.current = false; };
  }, []);

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
      const out: Array<{ valor: string; formula: string; descricao: string; cdTag?: string }> = [];
      const push = (valorRaw: unknown, formulaRaw: unknown, descricaoRaw: unknown, cdTagRaw?: unknown) => {
        const v = String(valorRaw ?? '').trim();
        if (!v || seen.has(v)) return;
        seen.add(v);
        out.push({
          valor: v,
          formula: String(formulaRaw ?? '').trim(),
          descricao: String(descricaoRaw ?? '').trim(),
          cdTag: String(cdTagRaw ?? '').trim() || undefined,
        });
      };

      // 1) Espelho auge_tags_calculadas: busca simultânea por NOME, DESCRIÇÃO
      //    e FÓRMULA (não apenas fallback) — o usuário pode procurar por
      //    qualquer uma das três colunas, como faz na grade do Auge.
      if (padrao) {
        const cols = ['nome', 'descricao', 'formula', 'nm_tag'];
        const { data } = await (supabase as any)
          .from('auge_tags_calculadas')
          .select('cd_tag, nome, descricao, formula, nm_tag')
          // O valor precisa ir entre aspas: fórmulas têm vírgula decimal
          // ("[LAR]-0,004") e o PostgREST usa vírgula como separador do `or`.
          .or(cols.map((c) => `${c}.ilike.${JSON.stringify(padrao)}`).join(','))
          .order('nome', { ascending: true })
          .limit(200);
        for (const r of (data ?? []) as any[]) {
          push(r.nome ?? r.nm_tag ?? r.descricao, r.formula, r.descricao, r.cd_tag);
        }
      }

      // 2) Fallback: nomes já sincronizados nos acabamentos.
      if (out.length === 0 && padrao) {
        const { data } = await (supabase as any)
          .from('auge_acabamentos')
          .select('ds_tag_calculada, nm_acabamento')
          .not('ds_tag_calculada', 'is', null)
          .ilike('ds_tag_calculada', padrao)
          .order('ds_tag_calculada', { ascending: true })
          .limit(200);
        for (const r of (data ?? []) as any[]) push(r.ds_tag_calculada, '', r.nm_acabamento ?? '');
      }

      // 3) Busca ao vivo no Auge (caso o espelho ainda não esteja sincronizado).
      if (out.length === 0) {
        try {
          const { data: fn } = await supabase.functions.invoke('auge-sync?action=tag_calculada_select', {
            body: { term: termo.replace(/\*/g, '') },
          });

          const alvo = termo.replace(/\*/g, '').toLowerCase();
          const rows = (fn as any)?.rows ?? [];
          for (const r of rows as Array<{ id: string; text: string }>) {
            const raw = String(r?.text ?? '').trim();
            if (!raw) continue;
            const idx = raw.lastIndexOf('\\');
            const nome = idx >= 0 ? raw.slice(idx + 1).trim() : raw;
            const formula = idx >= 0 ? raw.slice(0, idx).trim() : '';
            if (alvo && !nome.toLowerCase().includes(alvo) && !raw.toLowerCase().includes(alvo)) continue;
            push(nome || raw, formula, raw);
          }
        } catch { /* segue para o fallback local */ }
      }

      // 4) Fallback: TAGs calculadas já vinculadas em TAG Custom.
      if (out.length === 0 && padrao) {
        const { data } = await (supabase as any)
          .from('auge_tag_custom')
          .select('ds_tag_calculada, cd_tag_calculada, nm_configuracao')
          .or(
            `ds_tag_calculada.ilike.${JSON.stringify(padrao)},cd_tag_calculada.ilike.${JSON.stringify(padrao)}`,
          )
          .limit(200);
        for (const r of (data ?? []) as any[]) {
          push(r.ds_tag_calculada ?? r.cd_tag_calculada, '', r.nm_configuracao ?? '', r.cd_tag_calculada);
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
          placeholder={compacto ? 'Nome, descrição ou fórmula' : 'Buscar por nome, descrição ou fórmula (use * como curinga)'}
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
                onClick={() => { onChange({ valor: termo.replace(/\*/g, '').trim(), formula: '' }); setAberto(false); }}
                className="text-[10px] text-primary hover:underline"
              >
                Usar “{termo.replace(/\*/g, '').trim()}” como texto livre
              </button>
            </div>
          )}

          {opcoes.map((o) => (
            <button
              key={o.valor}
              onClick={() => {
                const base: TagCalculadaSel = { valor: o.valor, formula: o.formula, cdTag: o.cdTag };
                onChange(base);
                setAberto(false);
                // A grade do Auge trunca fórmulas longas; completamos no ERP.
                // Roda em background: nunca bloqueia nem derruba o render se falhar.
                if (formulaTruncada(o.formula) || !o.formula) {
                  void completarFormula(base)
                    .then((completo) => {
                      if (!montadoRef.current) return;
                      if (completo.formula !== base.formula) onChange(completo);
                    })
                    .catch(() => { /* fórmula truncada permanece — sem quebrar a tela */ });
                }
              }}

              className="w-full text-left px-2 py-1 hover:bg-muted/60 transition"
            >
              <div className="font-mono text-[11px] break-all">{o.valor}</div>
              {o.formula && (
                <div className="text-[9px] text-muted-foreground font-mono truncate">ƒ {o.formula}</div>
              )}
              {!o.formula && o.descricao && (
                <div className="text-[9px] text-muted-foreground truncate">{o.descricao}</div>
              )}
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
  onSearchStateChange,
}: {
  valor: { cd: string; nm: string } | null;
  onChange: (v: { cd: string; nm: string } | null) => void;
  onSearchStateChange?: (state: { termo: string; hasResults: boolean; isSearching: boolean; pesquisou: boolean }) => void;
}) {
  const [busca, setBusca] = useState('');
  const [termo, setTermo] = useState('');
  const [aberto, setAberto] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setTermo(busca.trim()), 300);
    return () => clearTimeout(t);
  }, [busca]);

  // Clicar fora apenas fecha a lista suspensa: o termo e o resultado da busca
  // permanecem, então a configuração NÃO passa a ser tratada como nova.
  useEffect(() => {
    const onDocDown = (ev: MouseEvent) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(ev.target as Node)) setAberto(false);
    };
    document.addEventListener('mousedown', onDocDown);
    return () => document.removeEventListener('mousedown', onDocDown);
  }, []);

  const padrao = useMemo(() => toIlikePattern(termo), [termo]);
  const tokens = useMemo(() => toIlikeTokens(termo), [termo]);

  // A busca roda sempre que houver termo suficiente (mesmo com a lista fechada),
  // garantindo análise imediata das TAGs obrigatórias.
  const { data: opcoes = [], isFetching, isSuccess } = useQuery({
    queryKey: ['tag-custom-configuracao-busca', padrao, tokens.join('|')],
    enabled: termo.length >= 2,

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

      // A busca NÃO pode ser curto-circuitada pelo padrão ordenado: com curinga
      // ("Cortina*CM*35*Liso*10*") o usuário espera TODOS os itens que contêm
      // essas informações, em qualquer ordem. Por isso unimos os resultados do
      // padrão ordenado com os do AND por tokens, nas duas fontes locais.
      const acumulado: ConfiguracaoLite[] = [];

      const buscarEm = async (tabela: string) => {
        // a) padrão ordenado (comportamento SAP B1 clássico)
        const exata = await (supabase as any)
          .from(tabela)
          .select('cd_configuracao, nm_configuracao, qtd_tags')
          .ilike('nm_configuracao', padrao)
          .limit(100);
        if (!exata.error) acumulado.push(...((exata.data ?? []) as ConfiguracaoLite[]));

        // b) AND por tokens (ordem livre) — cobre o caso do curinga
        if (tokens.length > 0) {
          let q = (supabase as any)
            .from(tabela)
            .select('cd_configuracao, nm_configuracao, qtd_tags');
          for (const t of tokens) q = q.ilike('nm_configuracao', t);
          const { data, error } = await q.limit(100);
          if (!error) acumulado.push(...((data ?? []) as ConfiguracaoLite[]));
        }
      };

      // 1) View local (configurações que já têm linhas de TAG gravadas).
      await buscarEm('auge_tag_custom_configuracoes');
      // 2) Varredura completa: esta fonte também contém configurações ainda sem
      // TAGs locais. Ela deve ser consultada SEMPRE; antes, um único resultado
      // na view local impedia a leitura dos demais cadastros conhecidos no Auge.
      await buscarEm('auge_tag_custom_scan');

      if (acumulado.length > 0) {
        return dedupe(acumulado).sort((a, b) =>
          (a.nm_configuracao ?? '').localeCompare(b.nm_configuracao ?? '', 'pt-BR'),
        );
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

  useEffect(() => {
    onSearchStateChange?.({
      termo,
      hasResults: opcoes.length > 0,
      isSearching: isFetching,
      pesquisou: isSuccess && !isFetching && termo.length >= 2,
    });
  }, [termo, opcoes.length, isFetching, isSuccess, padrao.length, onSearchStateChange]);

  // A exibição de valor selecionado individualmente foi removida para priorizar o fluxo automatizado global
  // que atua sobre todas as configurações encontradas pelo termo de busca.

  const mostrarDropdown = false; // Desativado para remover seleção individual conforme solicitado

  return (
    <div className="space-y-1" ref={wrapRef}>

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
      {/* A opção de selecionar uma configuração individual foi removida para priorizar a automação por palavras-chave */}
    </div>
  );
}

// ============================================================
// Busca manual de TAG Configurada (para inclusão avulsa na composição)
// ============================================================

interface TagConfiguradaOpt { valor: string; calculada: string; cfgNome: string }

function TagConfiguradaSearch({
  onPick,
  inline = false,
  onCancel,
}: {
  onPick: (o: TagConfiguradaOpt) => void;
  inline?: boolean;
  onCancel?: () => void;
}) {
  const [busca, setBusca] = useState('');
  const [termo, setTermo] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setTermo(busca.trim()), 300);
    return () => clearTimeout(t);
  }, [busca]);

  const padrao = useMemo(() => toIlikePattern(termo), [termo]);
  const tokens = useMemo(() => toIlikeTokens(termo), [termo]);

  const { data: opcoes = [], isFetching } = useQuery({
    queryKey: ['tag-configurada-manual', padrao, tokens.join('|')],
    enabled: termo.length >= 2,
    staleTime: 60 * 1000,
    queryFn: async () => {
      const sel = 'nm_configuracao, nm_tag_customizada, ds_tag_customizada, ds_tag_calculada, ds_tag_texto';
      const acc: any[] = [];

      const { data, error } = await (supabase as any)
        .from('auge_tag_custom')
        .select(sel)
        .or(
          ['ds_tag_customizada', 'nm_tag_customizada']
            .map((c) => `${c}.ilike.${JSON.stringify(padrao)}`)
            .join(','),
        )
        .limit(300);
      if (!error) acc.push(...(data ?? []));

      if (tokens.length > 0) {
        let q = (supabase as any).from('auge_tag_custom').select(sel);
        for (const t of tokens) q = q.ilike('ds_tag_customizada', t);
        const alt = await q.limit(300);
        if (!alt.error) acc.push(...(alt.data ?? []));
      }

      const seen = new Set<string>();
      const out: TagConfiguradaOpt[] = [];
      for (const r of acc) {
        const valor = normalizeTagFormatC(r.ds_tag_customizada ?? r.nm_tag_customizada ?? '');
        if (!valor) continue;
        const key = normalizeTagCode(valor);
        if (!key || seen.has(key)) continue;
        seen.add(key);
        out.push({
          valor,
          calculada: normalizeTagFormatC(r.ds_tag_calculada ?? ''),
          cfgNome: r.nm_configuracao ?? '',
        });
      }
      return out.sort((a, b) => a.valor.localeCompare(b.valor, 'pt-BR')).slice(0, 60);
    },
  });

  const livre = termo.replace(/\*/g, '').trim();

  const body = (
    <>
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          autoFocus
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Pesquisar TAG Configurada (use * como curinga)"
          className="h-9 pl-7 text-[11px] font-mono"
        />
      </div>
      {termo.length >= 2 && (
        <div className="rounded border bg-background max-h-56 overflow-auto">
          {isFetching && (
            <div className="p-2 text-[10px] text-muted-foreground flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" /> Buscando…
            </div>
          )}
          {!isFetching && opcoes.length === 0 && (
            <div className="p-2 space-y-1">
              <p className="text-[10px] text-muted-foreground">Nenhuma TAG Configurada encontrada.</p>
              {livre && (
                <button
                  onClick={() => onPick({ valor: livre, calculada: '', cfgNome: '' })}
                  className="text-[10px] text-primary hover:underline"
                >
                  Adicionar “{livre}” como texto livre
                </button>
              )}
            </div>
          )}
          {opcoes.map((o) => (
            <button
              key={o.valor}
              onClick={() => onPick(o)}
              className="w-full text-left px-2 py-1 hover:bg-muted/60 transition"
            >
              <div className="font-mono text-[11px] break-all">{o.valor}</div>
              {o.calculada && (
                <div className="text-[9px] text-muted-foreground font-mono truncate">= {o.calculada}</div>
              )}
            </button>
          ))}
        </div>
      )}
      {inline && onCancel && (
        <Button size="sm" variant="ghost" className="h-7 px-2 text-[10px]" onClick={onCancel}>
          Cancelar
        </Button>
      )}
    </>
  );

  if (inline) {
    return <div className="space-y-2">{body}</div>;
  }

  return (
    <div className="p-3 border-b bg-muted/30 space-y-2">
      {body}
    </div>
  );
}


// ============================================================
// Componente principal
// ============================================================
export interface GerarTagTabProps {
  /** Abre a aba "Histórico" com o log completo por TAG Custom. */
  onVerHistorico?: () => void;
}

export default function GerarTagTab({ onVerHistorico }: GerarTagTabProps = {}) {
  const [descricao, setDescricao] = useState(rascunho.descricao);
  const [linhas, setLinhas] = useState<LinhaTag[]>(rascunho.linhas);
  const [customAberta, setCustomAberta] = useState<{ cd: string; nm: string } | null>(rascunho.customAberta);
  const [enviando, setEnviando] = useState(false);
  // O resultado é preservado no rascunho de módulo: alternar de aba, rota ou
  // janela (alt+tab) não pode limpar o retorno do Auge.
  const [resultado, setResultado] = useState<ResultadoAuge | null>(rascunho.resultado);
  const [tentouEnviar, setTentouEnviar] = useState(false);

  // Edição das TAGs calculadas já gravadas no Auge.
  const [editandoAuge, setEditandoAuge] = useState(false);
  const [edicoesAuge, setEdicoesAuge] = useState<Record<string, TagCalculadaSel>>({});
  const [regravando, setRegravando] = useState(false);

  // Inclusão manual de TAG Configurada na composição.
  const [addManual, setAddManual] = useState(false);

  // Histórico local dos últimos lançamentos desta aba.
  const [historico, setHistorico] = useState<RegistroGerarTag[]>(() => lerHistorico());


  useEffect(() => { rascunho.descricao = descricao; }, [descricao]);
  useEffect(() => { rascunho.linhas = linhas; }, [linhas]);
  useEffect(() => { rascunho.customAberta = customAberta; }, [customAberta]);
  useEffect(() => { rascunho.resultado = resultado; }, [resultado]);


  // Estado da busca no campo Configuração (para indicar "Nova TAG Custom").
  const [cfgSearch, setCfgSearch] = useState<{ termo: string; hasResults: boolean; isSearching: boolean; pesquisou: boolean }>({
    termo: '',
    hasResults: false,
    isSearching: false,
    pesquisou: false,
  });


  // O texto da CONFIGURAÇÃO (não o nome da Tag) é o único driver das análises:
  // recomendações e detecção do padrão obrigatório.
  const termoBusca = useMemo(
    () => (customAberta?.nm ?? cfgSearch.termo ?? '').trim(),
    [customAberta, cfgSearch.termo],
  );
  const termoDeferido = useDeferredValue(termoBusca);

  // ---------- Configurações (catálogo leve) ----------
  const { data: configuracoes = [], isLoading: loadingCfgs } = useQuery({
    queryKey: ['auge-tag-custom-configuracoes'],
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      // Consultamos tanto as configurações que já possuem TAGs quanto o scan geral
      const [resConfig, resScan] = await Promise.all([
        (supabase as any).from('auge_tag_custom_configuracoes').select('cd_configuracao, nm_configuracao, qtd_tags').limit(15000),
        (supabase as any).from('auge_tag_custom_scan').select('cd_configuracao, nm_configuracao, qtd_tags').limit(15000)
      ]);

      const merged = [...(resConfig.data || []), ...(resScan.data || [])];
      const seen = new Set<string>();
      const out: ConfiguracaoLite[] = [];

      for (const r of merged) {
        if (!r.cd_configuracao || seen.has(r.cd_configuracao)) continue;
        seen.add(r.cd_configuracao);
        out.push(r as ConfiguracaoLite);
      }
      
      return out;
    },
  });

  const configsRanqueadas = useMemo(() => {
    const termo = termoDeferido.trim().toLowerCase();
    if (!termo || configuracoes.length === 0) return [];
    
    // 1. Tokenização rigorosa para filtro exato
    // Removemos caracteres especiais e espaços para comparar apenas o texto essencial.
    // O caractere "*" é explicitamente tratado como separador.
    const tokens = termo
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .split(/[\s*_\-/.,;:()\[\]]+/)
      .filter(t => t.length >= 1); 

    if (tokens.length === 0) return [];

    // 1. Identificar tokens estruturais (pesos maiores) para priorização
    const weighted = weightTokens(tokens);
    const strongTokens = weighted.filter(w => w.structural).map(w => w.token);

    // 2. Filtro Determinístico (Lógica AND): a configuração DEVE conter TODOS os tokens pesquisados.
    let filtrados = configuracoes.filter(cfg => {
      const nmOriginal = (cfg.nm_configuracao || "").toLowerCase();
      const nmNorm = nmOriginal.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const nmSemPontuacao = nmNorm.replace(/[^\w\s]/g, ' ');
      
      return tokens.every(t => {
        const tNorm = t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        return nmOriginal.includes(tNorm) || nmNorm.includes(tNorm) || nmSemPontuacao.includes(tNorm);
      });
    });

    // 3. Ranking por relevância (Pesagem estatística)
    const ranked = filtrados.map(cfg => {
      const nm = (cfg.nm_configuracao || "").toLowerCase();
      let score = 0;
      const matched: string[] = [];

      weighted.forEach(w => {
        if (nm.includes(w.token)) {
          score += w.weight * 2; // Hit exato
          matched.push(w.token);
        }
      });

      return {
        cfg,
        score,
        matched,
        coverage: matched.length / tokens.length
      };
    });

    // Ordena pelo score de peso (tokens estruturais valem mais)
    return ranked.sort((a, b) => b.score - a.score || a.cfg.nm_configuracao.localeCompare(b.cfg.nm_configuracao));
    });

    // Fallback: Se não encontrou nada com AND estrito, tenta relaxar os tokens
    // removendo os muito curtos ou ignorando erros comuns de digitação/sincronia.
    if (filtrados.length === 0 && tokens.length > 2) {
      const tokensLongos = tokens.filter(t => t.length >= 3);
      if (tokensLongos.length > 0) {
        filtrados = configuracoes.filter(cfg => {
          const nm = (cfg.nm_configuracao || "").toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          return tokensLongos.every(t => nm.includes(t));
        });
      }
    }

    // 3. Mapeamento para o formato esperado
    return filtrados.map(cfg => ({
      cfg,
      score: 1, 
      matched: tokens,
      coverage: 1
    })).sort((a, b) => a.cfg.nm_configuracao.localeCompare(b.cfg.nm_configuracao));
  }, [termoDeferido, configuracoes]);


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
      const sel = 'cd_configuracao, nm_configuracao, nm_tag_customizada, ds_tag_customizada, ds_tag_calculada, ds_tag_texto';
      const cols = ['nm_configuracao', 'ds_tag_customizada', 'nm_tag_customizada', 'ds_tag_texto', 'ds_tag_calculada'];
      const acc: CustomTag[] = [];

      const { data, error } = await (supabase as any)
        .from('auge_tag_custom')
        .select(sel)
        .or(cols.map((c) => `${c}.ilike.${JSON.stringify(padraoBusca)}`).join(','))
        .limit(300);
      if (!error) acc.push(...((data ?? []) as CustomTag[]));

      // AND por tokens (ordem livre) — sempre somado, nunca só fallback:
      // é o que faz o curinga "A*B*C*" trazer tudo que contém A, B e C.
      if (tokensBusca.length > 0) {
        let q = (supabase as any).from('auge_tag_custom').select(sel);
        for (const t of tokensBusca) q = q.ilike('nm_configuracao', t);
        const alt = await q.limit(300);
        if (!alt.error) acc.push(...((alt.data ?? []) as CustomTag[]));
      }

      const seen = new Set<string>();
      return acc.filter((t) => {
        const k = `${t.cd_configuracao}|${t.ds_tag_customizada ?? t.nm_tag_customizada ?? ''}|${t.ds_tag_texto ?? ''}`;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });
    },


  });

  // ---------- Busca por PALAVRAS-CHAVE (item 1 e 2 do fluxo) ----------
  // Independe da lista suspensa: sempre que houver palavras-chave, buscamos
  // TODAS as TAGs Custom cujas configurações contenham essas palavras, para
  // então deduzir as TAGs Configuradas obrigatórias.
  const palavras = useMemo(() => extrairPalavras(termoDeferido), [termoDeferido]);

  const { data: buscaPalavras, isFetching: loadingPalavras } = useQuery({
    queryKey: ['auge-tag-custom-palavras', palavras.map((p) => p.token).join('|')],
    enabled: palavras.length > 0,
    staleTime: 60 * 1000,
    queryFn: async () => {
      const sel =
        'cd_configuracao, nm_configuracao, nm_tag_customizada, ds_tag_customizada, ds_tag_calculada, ds_tag_texto';
      
      const tokens = palavras.map(p => p.token);
      if (tokens.length === 0) return { rows: [] as CustomTag[], usados: [] as string[] };

      // Se houver configurações já filtradas pelo rankConfiguracoes no frontend,
      // podemos usar seus IDs para buscar as TAGs no banco, garantindo consistência
      // entre o bloco Resumo e as recomendações de TAGs.
      const codes = configsRanqueadas.slice(0, 500).map(r => r.cfg.cd_configuracao);
      
      let q = (supabase as any).from('auge_tag_custom').select(sel);
      
      if (codes.length > 0) {
        // Busca as tags especificamente para as configurações que apareceram no resumo
        q = q.in('cd_configuracao', codes);
      } else {
        // Fallback: Busca AND por tokens se não houver códigos (ou muitos códigos)
        for (const t of tokens) q = q.ilike('nm_configuracao', `%${t}%`);
      }
      
      const { data, error } = await q.limit(4000);
      if (error) throw error;
      
      return { rows: (data || []) as CustomTag[], usados: tokens };
    },
  });

  const tagsPalavras = buscaPalavras?.rows ?? [];
  const palavrasUsadas = buscaPalavras?.usados ?? [];



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
    for (const t of [...tagsDaCustom, ...tagsTop, ...tagsBusca, ...tagsPalavras]) {
      const k = `${t.cd_configuracao}|${t.ds_tag_customizada ?? t.nm_tag_customizada ?? ''}|${t.ds_tag_texto ?? ''}`;
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(t);
    }
    return out;
  }, [tagsDaCustom, tagsTop, tagsBusca, tagsPalavras]);

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

  /** TAGs necessárias: melhor item de cada categoria. */
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

  // Sincroniza automaticamente a tabela com as recomendações do sistema
  useEffect(() => {
    if (recomendadas.length > 0) {
      setLinhas(recomendadas.map(r => ({
        id: r.id,
        code: r.code,
        valor: r.valor,
        cfgNome: r.cfgNome,
        calculada: r.calculada,
        formula: '',
      })));
    } else if (termoBusca.trim().length < 2) {
      // Limpa se o termo for removido
      setLinhas([]);
    }
  }, [recomendadas, termoBusca]);

  // ---------- Padrão obrigatório de TAGs ----------
  /**
   * Agrupa as configurações (TAG Customs) já existentes que casam com o texto
   * digitado. Cada configuração vira um "modelo" com o conjunto de TAGs
   * Configuradas que ela possui.
   */
  const modelosExistentes = useMemo(() => {
    const map = new Map<string, { nm: string; codes: Map<string, { valor: string; calculada: string }> }>();
    for (const t of [...tagsPalavras, ...tagsBusca, ...tagsTop]) {
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
  }, [tagsPalavras, tagsBusca, tagsTop]);

  /**
   * Escopo por PALAVRAS-CHAVE (independente da ordem digitada).
   *
   * 1) Cada modelo existente recebe uma pontuação = soma dos pesos das
   *    palavras-chave da configuração digitada que ele contém.
   * 2) Fica valendo apenas o grupo de modelos com a MAIOR cobertura
   *    (conjunto mais específico). Ex.: "Rollo Pro T45" prioriza as Custom que
   *    têm as três palavras; se nenhuma tiver, cai para as que têm duas.
   */
  const escopoPadrao = useMemo(() => {
    const modelos = Array.from(modelosExistentes.values());
    if (palavras.length === 0 || modelos.length === 0) {
      return { modelos: [] as typeof modelos, termo: '', tokens: [] as string[] };
    }

    type Marcado = { modelo: (typeof modelos)[number]; peso: number; hits: string[] };
    const marcados: Marcado[] = [];
    for (const m of modelos) {
      const alvo = ` ${normKey(m.nm)} `;
      let peso = 0;
      const hits: string[] = [];
      for (const p of palavras) {
        const exato = alvo.includes(` ${p.token} `);
        const parcial = !exato && p.token.length >= 3 && alvo.includes(p.token);
        if (exato || parcial) {
          peso += exato ? p.weight * 2 : p.weight;
          hits.push(p.token);
        }
      }
      if (hits.length > 0) marcados.push({ modelo: m, peso, hits });
    }
    if (marcados.length === 0) return { modelos: [] as typeof modelos, termo: '', tokens: [] as string[] };

    const melhorPeso = Math.max(...marcados.map((m) => m.peso));
    const selecionados = marcados.filter((m) => m.peso === melhorPeso);
    const tokens = Array.from(new Set(selecionados.flatMap((s) => s.hits)));

    return {
      modelos: selecionados.map((s) => s.modelo),
      termo: tokens.join(' '),
      tokens,
    };
  }, [modelosExistentes, palavras]);

  /**
   * TAGs Configuradas que são padrão (presentes em praticamente todos os
   * modelos do escopo mais específico). São obrigatórias na nova TAG Custom.
   */
  const obrigatorias = useMemo(() => {
    const modelos = escopoPadrao.modelos;
    const totalModelos = modelos.length;
    if (totalModelos < 1) return [] as Array<{ code: string; valor: string; calculada: string; freq: number; total: number }>;
    const acc = new Map<string, { n: number; valor: string; calculadas: Map<string, number> }>();
    for (const modelo of modelos) {
      for (const [code, info] of modelo.codes) {
        const cur = acc.get(code) ?? { n: 0, valor: info.valor, calculadas: new Map<string, number>() };
        cur.n += 1;
        if (info.calculada) cur.calculadas.set(info.calculada, (cur.calculadas.get(info.calculada) ?? 0) + 1);
        acc.set(code, cur);
      }
    }
    // Com um único modelo de referência, todas as suas TAGs são o padrão.
    const minimo = totalModelos === 1 ? 1 : Math.max(1, Math.ceil(totalModelos * 0.7));
    const out: Array<{ code: string; valor: string; calculada: string; freq: number; total: number }> = [];
    for (const [code, info] of acc) {
      if (info.n < minimo) continue;
      const calculada = Array.from(info.calculadas.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '';
      out.push({ code, valor: info.valor, calculada, freq: info.n, total: totalModelos });
    }
    return out.sort((a, b) => b.freq - a.freq || a.code.localeCompare(b.code));
  }, [escopoPadrao]);


  const codigosNaTabela = useMemo(() => new Set(linhas.map((l) => l.code)), [linhas]);
  const obrigatoriasFaltando = useMemo(
    () => obrigatorias.filter((o) => !codigosNaTabela.has(o.code)),
    [obrigatorias, codigosNaTabela],
  );

  /**
   * Nenhuma configuração existente casou com o texto → TAG Custom nova.
   * Só vale quando a busca do campo Configuração realmente terminou sem
   * resultados: fechar a lista suspensa (clique fora) não muda esse estado.
   */
  const ehTagCustomNova = useMemo(
    () =>
      !customAberta &&
      termoBusca.trim().length >= 2 &&
      !loadingBusca &&
      !cfgSearch.isSearching &&
      cfgSearch.pesquisou &&
      !cfgSearch.hasResults &&
      customsEncontradas.length === 0 &&
      !loadingPalavras &&
      tagsPalavras.length === 0,
    [customAberta, termoBusca, loadingBusca, cfgSearch, customsEncontradas.length, loadingPalavras, tagsPalavras.length],
  );


  // ---------- Manipulação das linhas da tabela ----------
  const jaNaTabela = (id: string) => linhas.some((l) => l.id === id);


  const adicionarLinha = (r: { id: string; code: string; valor: string; cfgNome: string; calculada: string }) => {
    setLinhas((prev) => {
      if (prev.some((l) => l.id === r.id)) {
        toast.info(`TAG ${r.code} removida da tabela.`);
        return prev.filter((l) => l.id !== r.id);
      }
      toast.success(`TAG ${r.code} adicionada à coluna Tag Configurada.`);
      return [...prev, {
        id: r.id,
        code: r.code,
        valor: r.valor,
        cfgNome: r.cfgNome,
        calculada: r.calculada,
        formula: '',
      }];
    });
  };

  /** Adiciona manualmente uma TAG Configurada pesquisada pelo usuário. */
  const adicionarTagConfiguradaManual = (opt: { valor: string; calculada: string; cfgNome: string }) => {
    const valor = normalizeTagFormatC(opt.valor);
    if (!valor) return;
    const code = normalizeTagCode(valor) || 'TAG';
    const id = `manual|${code}|${valor}`;
    if (linhas.some((l) => l.id === id || l.code === code)) {
      toast.info(`A TAG ${code} já está na composição.`);
      return;
    }
    setLinhas((prev) => [...prev, {
      id,
      code,
      valor,
      cfgNome: opt.cfgNome || customAberta?.nm || '',
      calculada: normalizeTagFormatC(opt.calculada ?? ''),
      formula: '',
    }]);
    toast.success(`TAG ${code} adicionada à composição.`);
  };


  const setCalculada = (id: string, sel: TagCalculadaSel) => {
    setLinhas((prev) => prev.map((l) => (
      l.id === id
        ? { ...l, calculada: sel.valor, formula: sel.formula, cdTagCalculada: sel.cdTag ?? '' }
        : l
    )));
  };

  /** Insere de uma vez todas as TAGs Configuradas obrigatórias que faltam. */
  const adicionarObrigatoriasFaltando = () => {
    if (obrigatoriasFaltando.length === 0) return;
    setLinhas((prev) => {
      const existentes = new Set(prev.map((l) => l.code));
      const novas: LinhaTag[] = obrigatoriasFaltando
        .filter((o) => !existentes.has(o.code))
        .map((o) => ({
          id: `obrig|${o.code}|${o.valor}`,
          code: o.code,
          valor: o.valor,
          cfgNome: customAberta?.nm ?? '',
          calculada: o.calculada,
          formula: '',
        }));
      return [...prev, ...novas];
    });
    toast.success(`${obrigatoriasFaltando.length} TAG(s) obrigatória(s) adicionada(s).`);
  };

  /**
   * Nome da TAG Custom enviado ao Auge. O campo de texto livre foi removido da
   * interface: usamos a própria Configuração selecionada/pesquisada como nome.
   */
  const descricaoFinal = useMemo(
    () => (descricao.trim() || customAberta?.nm?.trim() || termoBusca.trim()),
    [descricao, customAberta, termoBusca],
  );

  /** Guarda o lançamento atual no histórico local (últimos 10). */
  const registrarHistorico = (ok: boolean, res?: ResultadoAuge | null, tipo: TagEventoTipo = 'criacao') => {
    const reg: RegistroGerarTag = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      em: new Date().toISOString(),
      ok,
      descricao: descricaoFinal,
      configuracao: customAberta,
      // cópia profunda leve: o histórico não pode referenciar o estado vivo
      linhas: linhas.map((l) => ({ ...l })),
    };
    setHistorico((prev) => {
      const next = [reg, ...prev].slice(0, HISTORICO_MAX);
      gravarHistorico(next);
      return next;
    });
    // Log permanente por TAG Custom, consumido pela aba "Histórico".
    registrarEventoTag({
      ok,
      tipo,
      descricao: descricaoFinal || '—',
      cdConfiguracao: customAberta?.cd ?? res?.cdConfiguracao ?? null,
      nmConfiguracao: customAberta?.nm ?? null,
      linhas: reg.linhas.map((l) => ({
        code: l.code,
        valor: l.valor,
        calculada: l.calculada ?? null,
        formula: l.formula ?? null,
      })),
      gravadas: res?.gravadas ?? null,
      total: res?.total ?? null,
      erro: res?.ok === false ? (res?.error ?? null) : null,
    });
  };

  /** Recarrega um registro do histórico na composição para editar e relançar. */
  const relancarRegistro = (reg: RegistroGerarTag) => {
    setCustomAberta(reg.configuracao);
    setDescricao(reg.descricao ?? '');
    setLinhas(reg.linhas.map((l) => ({ ...l })));
    setResultado(null);
    setEditandoAuge(false);
    setEdicoesAuge({});
    setTentouEnviar(false);
    registrarEventoTag({
      ok: true,
      tipo: 'relancamento',
      descricao: reg.descricao || '—',
      cdConfiguracao: reg.configuracao?.cd ?? null,
      nmConfiguracao: reg.configuracao?.nm ?? null,
      linhas: reg.linhas.map((l) => ({
        code: l.code,
        valor: l.valor,
        calculada: l.calculada ?? null,
        formula: l.formula ?? null,
      })),
    });
    toast.success('Registro carregado — edite e grave novamente.');
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const limparHistorico = () => {
    setHistorico([]);
    gravarHistorico([]);
  };


  const adicionarTagCustom = async () => {
    setTentouEnviar(true);
    if (!descricaoFinal) {
      toast.error('Selecione ou pesquise a Configuração antes de gravar.');
      return;
    }
    if (linhas.length === 0) {
      toast.error('Adicione ao menos uma TAG configurada na tabela.');
      return;
    }
    if (obrigatoriasFaltando.length > 0) {
      toast.error(
        `Faltam TAGs obrigatórias do padrão: ${obrigatoriasFaltando.map((o) => o.code).join(', ')}.`,
      );
      return;
    }

    setEnviando(true);
    try {
      const { data, error } = await supabase.functions.invoke('auge-sync?action=criar_tag_custom', {
        body: {
          // Lista de configurações detectadas no Resumo
          cdConfiguracoes: configsRanqueadas.map(r => r.cfg.cd_configuracao),
          cdConfiguracao: customAberta?.cd ?? '',
          descricao: descricaoFinal,
          itens: linhas.map((l) => {
            const calculada = (l.calculada ?? '').trim();
            return {
              // TAG (Pente Fino) -> Tag (Auge)
              dsTagCustomizada: l.valor,
              // TAG Calculada (Pente Fino) -> Tag Calculada (Auge)
              dsTagCalculada: calculada,
              // Código já resolvido na busca — dispensa o lookup por nome.
              cdTagCalculada: l.cdTagCalculada ?? '',
              dsFormula: l.formula ?? '',
              // Quando a linha já existe no Auge, sobrescreve em vez de duplicar.
              cdTagCustomizada: l.cdTagCustomizada ?? '',
              // "Texto Livre" só é usado quando não há Tag Calculada (são mutuamente exclusivos no Auge)
              dsTagTexto: calculada ? '' : l.valor,
            };
          }),
        },
      });
      if (error) throw error;
      const res = data as ResultadoAuge;
      setResultado(res);
      setEditandoAuge(false);
      setEdicoesAuge({});
      registrarHistorico(res?.ok === true, res, 'criacao');
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

  /**
   * Regrava no Auge as TAGs calculadas editadas pelo usuário no bloco de
   * retorno. Como enviamos o `cdTagCustomizada` da linha existente, o Auge
   * executa uma atualização (idAcao=2) e a TAG calculada antiga é substituída.
   */
  const confirmarEdicaoAuge = async () => {
    const rows = resultado?.augeRows ?? [];
    const itens = rows
      .map((r: any, i: number) => {
        const chave = String(r?.cdTagCustomizada ?? i);
        const edicao = edicoesAuge[chave];
        if (!edicao) return null;
        const calculada = (edicao.valor ?? '').trim();
        const dsTagCustomizada = String(r?.dsTagCustomizada ?? r?.nmTagCustomizada ?? '').trim();
        if (!dsTagCustomizada) return null;
        return {
          cdTagCustomizada: String(r?.cdTagCustomizada ?? ''),
          dsTagCustomizada,
          dsTagCalculada: calculada,
          cdTagCalculada: edicao.cdTag ?? '',
          dsFormula: edicao.formula ?? '',
          dsTagTexto: calculada ? '' : dsTagCustomizada,
        };
      })
      .filter(Boolean);

    if (itens.length === 0) {
      toast.info('Altere ao menos uma TAG calculada antes de confirmar.');
      return;
    }

    setRegravando(true);
    try {
      const { data, error } = await supabase.functions.invoke('auge-sync?action=criar_tag_custom', {
        body: {
          cdConfiguracao: customAberta?.cd ?? resultado?.cdConfiguracao ?? '',
          descricao: (resultado?.descricao ?? descricao).trim() || descricao.trim(),
          itens,
        },
      });
      if (error) throw error;
      const res = data as ResultadoAuge;
      setResultado(res);
      setEdicoesAuge({});
      setEditandoAuge(false);
      registrarEventoTag({
        ok: res?.ok === true,
        tipo: 'edicao',
        descricao: (resultado?.descricao ?? descricao).trim() || descricaoFinal || '—',
        cdConfiguracao: customAberta?.cd ?? resultado?.cdConfiguracao ?? null,
        nmConfiguracao: customAberta?.nm ?? null,
        linhas: (itens as any[]).map((it) => ({
          valor: it.dsTagCustomizada,
          calculada: it.dsTagCalculada || null,
          formula: it.dsFormula || null,
        })),
        gravadas: res?.gravadas ?? null,
        total: res?.total ?? null,
        erro: res?.ok === false ? (res?.error ?? null) : null,
      });
      if (res?.ok) toast.success(`Edição gravada no Auge (${res.gravadas}/${res.total}).`);
      else toast.error(res?.error ?? 'O Auge não confirmou a edição.');
    } catch (e: any) {
      toast.error(e?.message ?? 'Falha ao regravar a TAG Custom no Auge.');
    } finally {
      setRegravando(false);
    }
  };


  const carregandoRecs = loadingCfgs || loadingTags || loadingBusca || loadingPalavras || loadingCustom;

  return (
    <div className="space-y-4">
      {/* Espelha o diálogo "Manter Tag Customizada" do Auge */}
      <Card className="p-4 space-y-4">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Wand2 className="h-3.5 w-3.5" /> Manter Tag Customizada
        </div>

        {/* Configuração: busca a TAG Custom (configuração) existente */}
        <div className="space-y-1">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            Configuração
            {ehTagCustomNova && (
              <Badge className="bg-amber-500 text-amber-950 hover:bg-amber-500 text-[9px]">Nova TAG Custom</Badge>
            )}
          </div>
          <ConfiguracaoSelect
            valor={customAberta}
            onChange={(v) => setCustomAberta(v)}
            onSearchStateChange={setCfgSearch}
          />
          <p className="text-[10px] text-muted-foreground">
            Digite aqui (ex.: <code className="font-mono">Rollo Pro</code>) — o sistema reconhecerá todas as configurações 
            e TAGs correspondentes e as listará no bloco "Resumo" abaixo automaticamente.
            <span className="font-semibold text-foreground"> Curinga:</span> <code className="font-mono">*</code> como no SAP B1.
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
                criará uma TAG Custom nova com as TAGs Configuradas da tabela abaixo.
              </p>
            </div>
          </div>
        )}

        {/* BLOCO DE RESUMO (Colapsável) - Posicionado abaixo do bloco "Manter Tag Customizada" */}
        {termoBusca.trim().length >= 2 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg border bg-muted/30 overflow-hidden"
          >
            <details className="group">
              <summary className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50 transition-colors list-none">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-primary" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider">
                    Resumo {configsRanqueadas.length > 0 ? `(${configsRanqueadas.length} configurações encontradas)` : `(Nenhuma configuração encontrada)`}
                  </span>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-90" />
              </summary>
              <div className="px-3 pb-3 space-y-2 border-t pt-2">
                {configsRanqueadas.length > 0 ? (
                  <>
                    <div className="text-[10px] text-muted-foreground leading-relaxed flex items-center justify-between">
                      <span>As configurações abaixo foram identificadas e as TAGs configuradas aplicadas automaticamente.</span>
                      {obrigatorias.length > 0 && (
                        <Badge variant="outline" className="text-[9px] border-blue-500/30 text-blue-600 bg-blue-50/50">
                          {obrigatorias.length} TAGs Reconhecidas
                        </Badge>
                      )}
                    </div>
                    
                    {/* Exibição das TAGs Reconhecidas/Padrão */}
                    {obrigatorias.length > 0 && (
                      <div className="flex flex-wrap gap-1 p-2 bg-blue-500/5 rounded border border-blue-500/10">
                        {obrigatorias.map((o) => (
                          <div key={o.code} className="flex items-center gap-1.5 px-2 py-0.5 rounded-md border bg-background/80 text-[10px] font-mono shadow-sm">
                            <span className="text-blue-600 font-bold">{o.code}</span>
                            <span className="text-muted-foreground">→</span>
                            <span className="truncate max-w-[100px]">{o.valor}</span>
                            {o.calculada && <span className="text-[9px] text-emerald-600 font-bold ml-1">[{o.calculada}]</span>}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-1.5 max-h-60 overflow-y-auto pr-1">
                      {configsRanqueadas.map((r) => (
                        <Badge 
                          key={r.cfg.cd_configuracao} 
                          variant="outline" 
                          className="text-[10px] font-mono py-0.5 px-2 bg-background/50 border-primary/20 hover:bg-muted transition-colors"
                        >
                          {r.cfg.nm_configuracao}
                        </Badge>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="py-4 flex flex-col items-center justify-center text-center bg-muted/20 rounded-md border border-dashed border-muted-foreground/20">
                    <Search className="h-5 w-5 mb-2 text-muted-foreground opacity-20" />
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">
                      (Nenhuma configuração exata encontrada)
                    </p>
                    <p className="text-[9px] text-muted-foreground/60 max-w-[200px] mt-1">
                      Certifique-se de que os termos pesquisados (como "{termoBusca}") existem exatamente no cadastro.
                    </p>
                  </div>
                )}
              </div>
            </details>
          </motion.div>
        )}
      </Card>



      <div className="grid grid-cols-1 gap-4 items-start">
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
                  <th className="p-2 w-[32%]">Tag Configurada</th>
                  <th className="p-2 w-[34%]">Tag Calculada</th>
                  <th className="p-2 w-[30%]">Fórmula</th>
                  <th className="p-2 text-right w-10"></th>
                </tr>
              </thead>
              <tbody>
                {linhas.map((l) => {
                  const obrigatoria = obrigatorias.some((o) => o.code === l.code);
                  return (
                    <tr key={l.id} className="border-t align-top">
                      <td className="p-2">
                        <div className={`font-mono font-semibold text-[10px] flex items-center gap-1 ${obrigatoria ? 'text-blue-600 dark:text-blue-400' : 'text-primary'}`}>
                          {l.code}
                          {obrigatoria && (
                            <span className="rounded border border-blue-500/50 bg-blue-500/10 px-1 text-[8px] uppercase">
                              obrigatória
                            </span>
                          )}
                        </div>
                        <div className="font-mono text-[11px] break-all">{l.valor}</div>
                        <div className="text-[9px] text-muted-foreground truncate">{l.cfgNome}</div>
                      </td>
                      <td className="p-2">
                        <TagCalculadaCell valor={l.calculada} onChange={(v) => setCalculada(l.id, v)} />
                      </td>
                      <td className="p-2 font-mono text-[10px] text-muted-foreground break-all">
                        {l.formula || '—'}
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
                  );
                })}
                {linhas.length === 0 && !addManual && (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-muted-foreground text-[11px]">
                      Nenhuma TAG adicionada à composição.
                    </td>
                  </tr>
                )}
                {addManual ? (
                  <tr className="border-t align-top bg-muted/20">
                    <td colSpan={4} className="p-2">
                      <TagConfiguradaSearch
                        inline
                        onPick={(o) => { adicionarTagConfiguradaManual(o); setAddManual(false); }}
                        onCancel={() => setAddManual(false)}
                      />
                    </td>
                  </tr>
                ) : (
                  <tr className="border-t">
                    <td colSpan={4} className="p-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 px-2 text-[10px] gap-1"
                        onClick={() => setAddManual(true)}
                      >
                        <Plus className="h-3 w-3" /> Adicionar TAG Configurada
                      </Button>
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
              <div className="flex items-start justify-between gap-2 flex-wrap">
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
                <div className="flex items-center gap-1.5">
                  {!!resultado.augeRows?.length && !editandoAuge && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-[10px] gap-1"
                      onClick={() => { setEditandoAuge(true); setEdicoesAuge({}); }}
                    >
                      <Pencil className="h-3 w-3" /> Edição
                    </Button>
                  )}
                  {editandoAuge && (
                    <>
                      <Button
                        size="sm"
                        className="h-7 px-2 text-[10px] gap-1"
                        disabled={regravando || Object.keys(edicoesAuge).length === 0}
                        onClick={confirmarEdicaoAuge}
                      >
                        {regravando
                          ? <Loader2 className="h-3 w-3 animate-spin" />
                          : <CheckCircle2 className="h-3 w-3" />}
                        {regravando ? 'Regravando…' : `Confirmar edição (${Object.keys(edicoesAuge).length})`}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-[10px]"
                        disabled={regravando}
                        onClick={() => { setEditandoAuge(false); setEdicoesAuge({}); }}
                      >
                        Cancelar
                      </Button>
                    </>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-[10px]"
                    onClick={() => { setResultado(null); setEditandoAuge(false); setEdicoesAuge({}); }}
                  >
                    Fechar
                  </Button>
                </div>
              </div>

              {resultado.error && (
                <div className="text-[11px] text-destructive break-words">{resultado.error}</div>
              )}

              {(() => {
                // Se o Auge não devolveu detalhamento, mostramos ao menos o que
                // foi enviado — a tabela nunca mais fica vazia sem explicação.
                const linhasResultado = resultado.results?.length
                  ? resultado.results
                  : linhas.map((l) => ({
                      tag: l.valor,
                      calculada: l.calculada,
                      formula: l.formula,
                      ok: false,
                      erro: resultado.error ?? 'Sem retorno detalhado do Auge para esta linha.',
                    }));
                if (!linhasResultado.length) return null;
                return (
                  <div className="rounded border bg-background overflow-x-auto">
                    <table className="w-full text-[10px]">
                      <thead className="bg-muted"><tr className="text-left">
                        <th className="p-1.5">Tag Configurada</th>
                        <th className="p-1.5">Tag Calculada</th>
                        <th className="p-1.5">Fórmula</th>
                        <th className="p-1.5">Status</th>
                      </tr></thead>
                      <tbody>
                        {linhasResultado.map((r, i) => (
                          <tr key={i} className="border-t">
                            <td className="p-1.5 font-mono break-all">{r.tag || '—'}</td>
                            <td className="p-1.5 font-mono break-all">{r.calculada || '—'}</td>
                            <td className="p-1.5 font-mono break-all text-muted-foreground">{r.formula || '—'}</td>
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
                );
              })()}

              {!!resultado.augeRows?.length && (
                <div className="space-y-1">
                  <div className="text-[9px] uppercase text-muted-foreground flex items-center gap-1.5">
                    Como ficou no Auge
                    {editandoAuge && (
                      <Badge variant="outline" className="text-[8px] border-blue-500/50 text-blue-700 dark:text-blue-400">
                        edição — a TAG calculada antiga será substituída
                      </Badge>
                    )}
                  </div>
                  <div className="rounded border bg-background max-h-72 overflow-auto">
                    <table className="w-full text-[10px]">
                      <thead className="bg-muted"><tr className="text-left">
                        <th className="p-1.5">Tag Configurada</th>
                        <th className="p-1.5">Tag Calculada</th>
                        <th className="p-1.5">Fórmula</th>
                        <th className="p-1.5">Configuração</th>
                      </tr></thead>
                      <tbody>
                        {resultado.augeRows.map((r: any, i: number) => {
                          const chave = String(r?.cdTagCustomizada ?? i);
                          const edicao = edicoesAuge[chave];
                          const calculadaAtual = String(r?.dsTagCalculada ?? r?.dsTagTexto ?? '').trim();
                          const formulaAtual = String(r?.dsFormula ?? '').trim();
                          return (
                            <tr key={chave} className="border-t align-top">
                              <td className="p-1.5 font-mono break-all">{r.dsTagCustomizada ?? r.nmTagCustomizada ?? '—'}</td>
                              <td className="p-1.5 font-mono break-all min-w-[180px]">
                                {editandoAuge ? (
                                  <TagCalculadaCell
                                    compacto
                                    valor={edicao?.valor ?? ''}
                                    onChange={(sel) => setEdicoesAuge((prev) => ({ ...prev, [chave]: sel }))}
                                  />
                                ) : (
                                  calculadaAtual || '—'
                                )}
                                {editandoAuge && calculadaAtual && (
                                  <div className="text-[9px] text-muted-foreground line-through break-all mt-0.5">
                                    {calculadaAtual}
                                  </div>
                                )}
                              </td>
                              <td className="p-1.5 font-mono break-all text-muted-foreground">
                                {(edicao?.formula || formulaAtual) || '—'}
                              </td>
                              <td className="p-1.5 break-all">{r.nmConfiguracao ?? r.cdConfiguracao ?? '—'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

        </Card>

        {/* Últimos registros: as 10 últimas alterações feitas nesta aba */}
        <Card className="overflow-hidden">
          <div className="p-3 border-b flex items-center justify-between gap-2">
            <div className="text-xs font-semibold flex items-center gap-1.5">
              <History className="h-3.5 w-3.5 text-muted-foreground" />
              Últimos registros
              <span className="text-[10px] font-normal text-muted-foreground">
                {historico.length}/{HISTORICO_MAX}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {onVerHistorico && (
                <Button size="sm" variant="outline" className="h-7 px-2 text-[10px] gap-1" onClick={onVerHistorico}>
                  <History className="h-3 w-3" /> Ver histórico completo
                </Button>
              )}
              {historico.length > 0 && (
                <Button size="sm" variant="ghost" className="h-7 px-2 text-[10px]" onClick={limparHistorico}>
                  Limpar
                </Button>
              )}
            </div>
          </div>

          {historico.length === 0 ? (
            <div className="p-6 text-center text-[11px] text-muted-foreground">
              Nenhum lançamento ainda. Ao gravar uma TAG Custom, ela aparece aqui para reedição.
            </div>
          ) : (
            <div className="divide-y">
              {historico.map((reg) => (
                <div key={reg.id} className="p-3 flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {reg.ok
                        ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        : <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" />}
                      <span className="text-[11px] font-medium break-all">{reg.descricao || '—'}</span>
                      <Badge variant="outline" className="text-[9px]">{reg.linhas.length} TAG(s)</Badge>
                      <span className="text-[9px] text-muted-foreground">{formatarData(reg.em)}</span>
                    </div>
                    {reg.configuracao?.nm && (
                      <div className="text-[9px] text-muted-foreground break-all">
                        Configuração: {reg.configuracao.nm}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-1">
                      {reg.linhas.slice(0, 8).map((l) => (
                        <span
                          key={l.id}
                          title={l.calculada ? `${l.valor} = ${l.calculada}` : l.valor}
                          className="rounded border bg-muted/50 px-1.5 py-0.5 font-mono text-[9px]"
                        >
                          {l.code}
                        </span>
                      ))}
                      {reg.linhas.length > 8 && (
                        <span className="text-[9px] text-muted-foreground">+{reg.linhas.length - 8}</span>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 text-[10px] gap-1 shrink-0"
                    onClick={() => relancarRegistro(reg)}
                  >
                    <Pencil className="h-3 w-3" /> Editar e relançar
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>

      </div>
    </div>
  );
}
