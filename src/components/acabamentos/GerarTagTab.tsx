import { useDeferredValue, useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useTagCustomConfigurationSearch } from '@/hooks/useTagCustomConfigurationSearch';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Loader2,
  Wand2,
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
import { ResumoConfiguracoesMassa } from './ResumoConfiguracoesMassa';
import {
  extrairPalavras,
  filtrarPorIlike,
  ilikeAnd,
  ilikeCacheKey,
  ilikeOr,
  normKey,
  matchesIlike,
  rankByRelevance,
  sanitizeTerm,
  toIlikePattern,
  toIlikeTokens,
} from '@/lib/tag-search';

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

function normalizeTagCode(raw: string | null | undefined): string {
  if (!raw) return '';
  return raw.replace(/&/g, '').trim().toUpperCase().replace(/\s+/g, '');
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
  /** Valor que estava no Auge antes do usuário mexer (para o histórico). */
  valorAntigo?: string;
  /** Código da TAG calculada no Auge (`cd_tag`). */
  cdTagCalculada?: string;
  /** Valor original da TAG calculada (se era texto livre). */
  dsTagTexto?: string;
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
    queryKey: ['tag-calculada-busca', ilikeCacheKey(padrao, [])],
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
          placeholder={compacto ? 'Nome, descrição ou fórmula' : 'Identifique a TAG pela descrição, fórmula ou código (use * como curinga)'}
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
    queryKey: ['tag-custom-configuracao-busca', ilikeCacheKey(padrao, tokens)],
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
      // essas informações, em qualquer ordem. Por isso unificamos padrão ordenado
      // e AND por tokens numa única query: o PostgREST avalia as duas condições
      // como um AND lógico no servidor, eliminando as chamadas duplicadas e o
      // curto-circuito do "primeiro resultado ganhar".
      const acumulado: ConfiguracaoLite[] = [];
      const tabelas = ['auge_tag_custom_configuracoes', 'auge_tag_custom_scan'];

      await Promise.all(
        tabelas.map(async (tabela) => {
          const q = (supabase as any)
            .from(tabela)
            .select('cd_configuracao, nm_configuracao, qtd_tags');
          
          // Se houver tokens (AND), aplicamos a restrição total na query
          const { data, error } = await ilikeAnd(q, 'nm_configuracao', padrao, tokens).limit(1000);
          if (!error && data) acumulado.push(...(data as ConfiguracaoLite[]));
        }),
      );

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
    queryKey: ['tag-configurada-manual', ilikeCacheKey(padrao, tokens)],
    enabled: termo.length >= 2,
    staleTime: 60 * 1000,
    queryFn: async () => {
      const sel = 'nm_configuracao, nm_tag_customizada, ds_tag_customizada, ds_tag_calculada, ds_tag_texto';
      const acc: any[] = [];

      const qBase = (supabase as any).from('auge_tag_custom').select(sel);
      const { data, error } = await ilikeAnd(qBase, 'ds_tag_customizada', padrao, tokens).limit(300);
      if (!error) acc.push(...(data ?? []));

      if (padrao) {
        const cols = ['ds_tag_customizada', 'nm_tag_customizada'];
        const or = ilikeOr(cols, padrao, []);
        const { data: alt, error: altErr } = await (supabase as any)
          .from('auge_tag_custom')
          .select(sel)
          .or(or)
          .limit(300);
        if (!altErr) acc.push(...(alt ?? []));
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
  // 1. Hooks de estado no topo, sempre na mesma ordem
  const [descricao, setDescricao] = useState(rascunho.descricao);
  const [linhas, setLinhas] = useState<LinhaTag[]>(rascunho.linhas);
  const [customAberta, setCustomAberta] = useState<{ cd: string; nm: string } | null>(rascunho.customAberta);
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoAuge | null>(rascunho.resultado);
  const [tentouEnviar, setTentouEnviar] = useState(false);
  const [editandoAuge, setEditandoAuge] = useState(false);
  const [edicoesAuge, setEdicoesAuge] = useState<Record<string, TagCalculadaSel>>({});
  const [regravando, setRegravando] = useState(false);
  const [addManual, setAddManual] = useState(false);
  const [historico, setHistorico] = useState<RegistroGerarTag[]>([]);
  const [removidasManualmente, setRemovidasManualmente] = useState<Set<string>>(new Set());
  const [cfgSearch, setCfgSearch] = useState<{ termo: string; hasResults: boolean; isSearching: boolean; pesquisou: boolean }>({
    termo: '',
    hasResults: false,
    isSearching: false,
    pesquisou: false,
  });

  // 2. Efeitos e Memos subsequentes
  useEffect(() => {
    setHistorico(lerHistorico());
  }, []);

  useEffect(() => { rascunho.descricao = descricao; }, [descricao]);
  useEffect(() => { rascunho.linhas = linhas; }, [linhas]);
  useEffect(() => { rascunho.customAberta = customAberta; }, [customAberta]);
  useEffect(() => { rascunho.resultado = resultado; }, [resultado]);


  // O texto da CONFIGURAÇÃO (não o nome da Tag) é o único driver das análises:
  // recomendações e detecção do padrão obrigatório.
  const termoBusca = useMemo(
    () => (customAberta?.nm ?? cfgSearch.termo ?? '').trim(),
    [customAberta, cfgSearch.termo],
  );
  const termoDeferido = useDeferredValue(termoBusca);

  // Limpa remoções manuais ao mudar drasticamente o termo de busca (novo escopo)
  const termoAnteriorRef = useRef(termoBusca);
  useEffect(() => {
    if (termoAnteriorRef.current !== termoBusca) {
      setRemovidasManualmente(new Set());
      termoAnteriorRef.current = termoBusca;
    }
  }, [termoBusca]);

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
    const termo = termoDeferido.trim();
    if (termo.length < 2 || configuracoes.length === 0) return [];

    const padrao = toIlikePattern(termo);
    const tokens = toIlikeTokens(termo);

    const filtrados = filtrarPorIlike(configuracoes, padrao, tokens);
    const ranked = rankByRelevance(filtrados, termo).map(({ cfg, score }) => ({
      cfg,
      score,
      matched: [],
      coverage: 1,
    }));

    return ranked.slice(0, 500);
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
    queryKey: ['auge-tag-custom-busca', padraoBusca, tokensBusca],
    enabled: termoBusca.trim().length >= 2,
    staleTime: 60 * 1000,
    queryFn: async () => {
      const sel = 'cd_configuracao, nm_configuracao, nm_tag_customizada, ds_tag_customizada, ds_tag_calculada, ds_tag_texto';
      const acc: CustomTag[] = [];

      // O bloco "Resumo" precisa enxergar as TAGs Custom de TODAS as
      // configurações que casem com o termo (coringa SAP B1 ou AND por
      // tokens). Antes essa busca exigia >= 3 caracteres e só rodava o AND
      // por tokens em `nm_configuracao`, o que deixava de fora TAGs cujo
      // nome bate mas a config não. Agora usamos o mesmo predicado em
      // `nm_configuracao` e mantemos o OR nas outras colunas para o curinga.
      let qBase = (supabase as any).from('auge_tag_custom').select(sel);
      for (const t of tokensBusca) {
        qBase = qBase.ilike('nm_configuracao', t);
      }
      if (tokensBusca.length === 0 && padraoBusca) {
        qBase = qBase.ilike('nm_configuracao', padraoBusca);
      }
      const { data, error } = await qBase.limit(2000);
      if (!error) acc.push(...((data ?? []) as CustomTag[]));

      // CORREÇÃO: Removido o match amplo em colunas de TAG (ds_tag_customizada, etc)
      // para garantir que a busca por "Configuração" retorne apenas o que bota no nome da config.
      // Se o usuário quiser buscar por tag, ele deve usar a busca manual de tags.

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
  // Sempre que houver palavras-chave, buscamos TODAS as TAGs Custom cujos
  // VALORES (ds_tag_customizada, nm_tag_customizada, ds_tag_texto,
  // ds_tag_calculada) casem com o termo — exatamente a mesma lógica do
  // "Tags Configuradas" manual, que funciona. A partir das TAGs encontradas
  // derivamos a lista distinta de configurações para alimentar o bloco Resumo,
  // permitindo ao usuário alterar todas as TAGs da família de uma só vez.
  const palavras = useMemo(() => extrairPalavras(termoDeferido), [termoDeferido]);

  const { data: buscaPalavras, isFetching: loadingPalavras } = useQuery({
    queryKey: [
      'auge-tag-custom-palavras', termoDeferido,
    ],
    enabled: termoDeferido.trim().length >= 2,
    staleTime: 60 * 1000,
    queryFn: async () => {
      const sel = 'cd_configuracao, nm_configuracao, nm_tag_customizada, ds_tag_customizada, ds_tag_calculada, ds_tag_texto';
      const termo = termoDeferido.trim();
      const tokensIlike = toIlikeTokens(termo);
      const tokensPuros = termo.split(/[\s*]+/).map(t => t.trim().toLowerCase()).filter(t => t.length >= 2);

      if (tokensPuros.length === 0) return { configs: [], tags: [] };

      // 1) Match por NOME DA CONFIGURAÇÃO (nm_configuracao)
      // Aplicamos o filtro AND para garantir que todos os tokens estejam presentes no nome.
      let qCfg = (supabase as any).from('auge_tag_custom').select(sel);
      for (const t of tokensIlike) {
        qCfg = qCfg.ilike('nm_configuracao', t);
      }
      
      const { data: dataCfg, error: errorCfg } = await qCfg.limit(4000);
      let acc: CustomTag[] = errorCfg ? [] : (dataCfg ?? []);

      // 2) Deduplicação rigorosa e Validação Final no Cliente (Double Check)
      // Para o bloco RESUMO, só aceitamos se bater no NOME DA CONFIGURAÇÃO.
      const seenTag = new Set<string>();
      const validRows = acc.filter((t) => {
        const k = `${t.cd_configuracao}|${t.ds_tag_customizada ?? t.nm_tag_customizada ?? ''}|${t.ds_tag_texto ?? ''}`;
        if (seenTag.has(k)) return false;
        seenTag.add(k);

        const nm = (t.nm_configuracao || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        return tokensPuros.every(tk => nm.includes(tk));
      });

      // Deriva as configurações distintas
      const cfgMap = new Map<string, ConfiguracaoLite>();
      for (const t of validRows) {
        const cd = String(t.cd_configuracao ?? '').trim();
        if (!cd) continue;
        const cur = cfgMap.get(cd) ?? {
          cd_configuracao: cd,
          nm_configuracao: t.nm_configuracao ?? cd,
          qtd_tags: 0,
        };
        cur.qtd_tags += 1;
        cfgMap.set(cd, cur);
      }
      
      return { 
        configs: Array.from(cfgMap.values()).sort((a, b) => a.nm_configuracao.localeCompare(b.nm_configuracao)), 
        tags: validRows 
      };
    },
  });
  const resumoConfigs = useMemo(() => buscaPalavras?.configs ?? [], [buscaPalavras]);
  const tagsPalavras = useMemo(() => buscaPalavras?.tags ?? [], [buscaPalavras]);
  const tagsReconhecidas = useMemo(() => buscaPalavras?.tags ?? [], [buscaPalavras]);

  // ---------- Configurações do bloco "Resumo" (alvo da alteração em massa) ----------
  // Busca DEDICADA e PAGINADA sobre `auge_tag_custom`, aplicando AND estrito de
  // todos os tokens digitados diretamente em `nm_configuracao`. Diferente da
  // busca por valores de TAG (limitada a 4.000 linhas), aqui paginamos até
  // esgotar o resultado para garantir que o Resumo liste TODAS as
  // configurações que serão alteradas em massa.
  const { data: configsMassa = [], isFetching: loadingMassa } = useQuery({
    queryKey: [
      'auge-tag-custom-configs-massa',
      termoDeferido,
    ],
    enabled: termoDeferido.trim().length >= 2,
    staleTime: 60 * 1000,
    queryFn: async () => {
      const termo = termoDeferido.trim();
      const padrao = toIlikePattern(termo);
      const tokens = toIlikeTokens(termo);

      const map = new Map<string, ConfiguracaoLite>();
      const PAGE = 1000;
      const MAX = 80000;

      for (let from = 0; from < MAX; from += PAGE) {
        // Fonte 1: auge_tag_custom_configuracoes (Configurações com TAGs vinculadas)
        // CRITICAL: We MUST search only in nm_configuracao to respect the "Configuration" input filter
        // CORREÇÃO: Aplicar ilikeAnd garante que todos os tokens sejam filtrados no SELECT
        // Garantimos que o filtro seja aplicado APENAS em nm_configuracao para o bloco Resumo
        let query1 = (supabase as any)
          .from('auge_tag_custom_configuracoes')
          .select('cd_configuracao, nm_configuracao');
        
        for (const t of tokens) {
          query1 = query1.ilike('nm_configuracao', t);
        }
        if (tokens.length === 0 && padrao) {
          query1 = query1.ilike('nm_configuracao', padrao);
        }

        const res1 = await query1
          .order('cd_configuracao', { ascending: true })
          .range(from, from + PAGE - 1);
        
        let query2 = (supabase as any)
          .from('auge_tag_custom_scan')
          .select('cd_configuracao, nm_configuracao');
          
        for (const t of tokens) {
          query2 = query2.ilike('nm_configuracao', t);
        }
        if (tokens.length === 0 && padrao) {
          query2 = query2.ilike('nm_configuracao', padrao);
        }

        const res2 = await query2
          .order('cd_configuracao', { ascending: true })
          .range(from, from + PAGE - 1);

        const data1 = res1.data || [];
        const data2 = res2.data || [];
        const data = [...data1, ...data2];
        
        if (data.length === 0 && from > 0) break;

        for (const r of data) {
          const cd = String(r.cd_configuracao ?? '').trim();
          if (!cd) continue;
          const nm = r.nm_configuracao ?? cd;
          
          // Validação extra no cliente para garantir 100% de precisão (lógica AND estrita)
          // Normalizamos ambos para garantir que espaços e acentos não quebrem a busca
          const nmNorm = nm.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          const tokensNorm = tokens.map(t => t.replace(/%/g, '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''));
          
          const passaNoFiltro = tokensNorm.every(tk => nmNorm.includes(tk));
          
          if (!passaNoFiltro) continue;

          if (!map.has(cd)) {
            map.set(cd, { cd_configuracao: cd, nm_configuracao: nm, qtd_tags: 0 });
          }
        }
        
        if (data1.length < PAGE && data2.length < PAGE) break;
      }

      return Array.from(map.values()).sort((a, b) =>
        (a.nm_configuracao ?? '').localeCompare(b.nm_configuracao ?? '', 'pt-BR'),
      );
    },
  });





  // TAGs Custom existentes que casam com o termo pesquisado (removido lógica duplicada)
  const customsEncontradas = useMemo(() => {
    return configsMassa.map(c => ({ cd: c.cd_configuracao, nm: c.nm_configuracao, qtd: c.qtd_tags }));
  }, [configsMassa]);

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
          cd_tag_customizada: r.cdTagCustomizada ?? null,
          cd_tag_calculada: r.cdTagCalculada ?? null,
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
      const k = `${t.cd_configuracao}|${t.ds_tag_customizada ?? t.nm_tag_customizada ?? ''}|${t.ds_tag_texto ?? ''}|${(t as any).cd_tag_customizada ?? ''}`;
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

  /** TAGs necessárias: agrupadas globalmente e recomendando a mais frequente. */
  const recomendadas = useMemo(() => {
    const out: Array<{ id: string; code: string; valor: string; cfgNome: string; calculada: string; formula: string; cdTagCustomizada?: string; valorAntigo?: string; cdTagCalculada?: string; dsTagTexto?: string }> = [];
    
    // Usamos categorias que já consolidam TAGs de todas as configurações ranqueadas e encontradas.
    for (const cat of categorias) {
      if (removidasManualmente.has(cat.code)) continue;

      // Para cada categoria (ex: &COR), identificamos a TAG calculada mais frequente
      const contagemCalculadas = new Map<string, { n: number; valor: string; cfgNome: string }>();
      
      for (const item of cat.items) {
        const calc = normalizeTagFormatC(item.tag.ds_tag_calculada ?? '');
        if (!calc) continue;
        const cur = contagemCalculadas.get(calc) ?? { 
          n: 0, 
          valor: normalizeTagFormatC(item.tag.ds_tag_customizada ?? item.tag.nm_tag_customizada ?? ''), 
          cfgNome: item.cfgNome,
          cdTagCustomizada: (item.tag as any).cd_tag_customizada,
          cdTagCalculada: (item.tag as any).cd_tag_calculada,
          dsTagTexto: item.tag.ds_tag_texto ?? undefined
        };
        cur.n += 1;
        contagemCalculadas.set(calc, cur);
      }

      // Se não houver TAGs calculadas para essa TAG configurada, pegamos o melhor item
      if (contagemCalculadas.size === 0) {
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
          calculada: '',
          formula: '',
          cdTagCustomizada: (best.tag as any).cd_tag_customizada,
          cdTagCalculada: (best.tag as any).cd_tag_calculada,
          dsTagTexto: best.tag.ds_tag_texto ?? undefined,
        });
        continue;
      }

      // Recomenda a TAG calculada que aparece com maior frequência
      const [calculadaMaisFrequente, info] = Array.from(contagemCalculadas.entries()).sort((a, b) => b[1].n - a[1].n)[0];

      out.push({
        id: `${cat.code}|${info.valor}`,
        code: cat.code,
        valor: info.valor,
        cfgNome: info.cfgNome,
        calculada: calculadaMaisFrequente,
        formula: '',
        cdTagCustomizada: (info as any).cdTagCustomizada,
        valorAntigo: info.valor, // Armazenamos o valor original para o histórico
        cdTagCalculada: (info as any).cdTagCalculada,
        dsTagTexto: (info as any).dsTagTexto,
      });
    }
    return out;
  }, [categorias, removidasManualmente]);

  // Sincroniza automaticamente a tabela com as recomendações do sistema
  useEffect(() => {
    if (recomendadas.length > 0) {
      setLinhas((prev) => {
        const next = [...prev];
        
        // 1. Adiciona recomendações que ainda não estão na tabela e não foram removidas
        for (const rec of recomendadas) {
          const jaExiste = next.some(l => l.code === rec.code);
          if (!jaExiste) {
            next.push({
              id: rec.id,
              code: rec.code,
              valor: rec.valor,
              cfgNome: rec.cfgNome,
              calculada: rec.calculada,
              formula: '',
              cdTagCustomizada: rec.cdTagCustomizada,
              valorAntigo: rec.valorAntigo,
              cdTagCalculada: rec.cdTagCalculada,
              dsTagTexto: rec.dsTagTexto,
            });
          }
        }

        // 2. Remove linhas que foram removidas manualmente ou não fazem mais parte do escopo
        return next.filter(l => {
          // Se foi removida manualmente, deve sumir
          if (removidasManualmente.has(l.code)) return false;
          
          // Se a TAG não está nas recomendações atuais...
          const estaNasRecs = recomendadas.some(r => r.code === l.code);
          if (!estaNasRecs) {
            // ...só mantemos se foi adicionada manualmente pelo usuário
            return l.id.startsWith('manual|');
          }
          
          return true;
        });
      });
    } else if (termoBusca.trim().length < 2) {
      setLinhas([]);
    }
  }, [recomendadas, termoBusca, removidasManualmente]);

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
    () => obrigatorias.filter((o) => !codigosNaTabela.has(o.code) && !removidasManualmente.has(o.code)),
    [obrigatorias, codigosNaTabela, removidasManualmente],
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


  const adicionarLinha = (r: { id: string; code: string; valor: string; cfgNome: string; calculada: string; formula?: string; cdTagCustomizada?: string; cdTagCalculada?: string; dsTagTexto?: string }) => {
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
        formula: r.formula || '',
        cdTagCustomizada: r.cdTagCustomizada,
        cdTagCalculada: r.cdTagCalculada,
        dsTagTexto: r.dsTagTexto,
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
    setRemovidasManualmente((prev) => {
      const next = new Set(prev);
      next.delete(code);
      return next;
    });
    toast.success(`TAG ${code} adicionada à composição.`);
  };


  const setCalculada = (id: string, sel: TagCalculadaSel) => {
    setLinhas((prev) => prev.map((l) => (
      l.id === id
        ? { ...l, calculada: sel.valor, formula: sel.formula, cdTagCalculada: sel.cdTag ?? '', dsTagTexto: '' }
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
          cdTagCalculada: (o as any).cdTagCalculada,
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
        cdTagCustomizada: l.cdTagCustomizada ?? null,
        cdTagCalculada: l.cdTagCalculada ?? null,
        dsTagTexto: l.dsTagTexto ?? null,
        nmConfiguracao: l.cfgNome || customAberta?.nm || null,
        cdConfiguracao: customAberta?.cd || null,
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
        nmConfiguracao: l.cfgNome || reg.configuracao?.nm || null,
        cdConfiguracao: reg.configuracao?.cd || null,
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
    
    const configuracoesAlvo = Array.from(
      new Set(
        [...resumoConfigs, ...configsMassa]
          .map((cfg) => String(cfg.cd_configuracao ?? '').trim())
          .filter(Boolean)
      )
    );

    if (configuracoesAlvo.length === 0 && !descricaoFinal) {
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
          cdConfiguracoes: configuracoesAlvo,
          cdConfiguracao: customAberta?.cd || configuracoesAlvo[0] || '',
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
      
      // O histórico registra o número REAL de configurações afetadas devolvido pelo Auge.
      // Se configsAlvo tinha 102 mas o Auge alterou 90, o total será 90.
      registrarHistorico(res?.ok === true, res, 'criacao');
      
      if (res?.ok) {
        toast.success(`TAG Custom gravada no Auge (${res.gravadas}/${res.total}).`);
      } else {
        toast.error(res?.error ?? 'O Auge não confirmou a gravação da TAG Custom.');
      }

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
        linhas: (itens as any[]).map((it, idx) => {
          const uiLine = linhas.find(l => l.valor === it.dsTagCustomizada);
          return {
            code: uiLine?.code || null,
            valor: it.dsTagCustomizada,
            valor_antigo: uiLine?.valorAntigo || null,
            calculada: it.dsTagCalculada || null,
            formula: it.dsFormula || null,
            nmConfiguracao: uiLine?.cfgNome || customAberta?.nm || null,
            cdConfiguracao: customAberta?.cd || null,
          };
        }),
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
          <Wand2 className="h-3.5 w-3.5" /> Motor de Configuração de TAGs Custom
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
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Identifique o padrão técnico (ex.: <code className="font-mono text-primary">Rollo Pro</code>) para que o sistema orquestre automaticamente as configurações e TAGs vinculadas no bloco de Resumo. Você possui autoridade total para <span className="text-foreground font-semibold">incluir, excluir e editar</span> a composição global no Auge de forma centralizada e estratégica.
            <span className="font-semibold text-foreground ml-1">Dica Pro:</span> Utilize <code className="font-mono text-primary">*</code> para buscas flexíveis padrão SAP B1.
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

        <ResumoConfiguracoesMassa 
          termoBusca={termoBusca}
          customAberta={customAberta}
          setCustomAberta={setCustomAberta}
          obrigatoriasCount={obrigatorias.length}
        />
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
                          onClick={() => {
                            setLinhas((prev) => prev.filter((x) => x.id !== l.id));
                            setRemovidasManualmente((prev) => new Set(prev).add(l.code));
                          }}
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
                    : <><AlertTriangle className="h-3 3 text-destructive" /> Divergência Técnica na Gravação</>}
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
                    Persistência de Dados no Auge
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
