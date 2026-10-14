import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, Trash2, Plus } from 'lucide-react';
import { normalizeTagFormatC } from '@/lib/tag-utils';

export interface TagPadraoRegra {
  id: string;
  padrao_nm: string;
  tag_padrao: string;
  ativo: boolean;
}

interface TagOpcao {
  valor: string;
  formula: string;
  /** código da configuração / origem para exibição de contexto */
  cfgNome: string;
}

async function buscarTagsPadrao(termo: string): Promise<TagOpcao[]> {
  if (termo.trim().length < 1) return [];
  const { data, error } = await supabase.functions.invoke('auge-sync?action=tag_padrao_tags', {
    body: { term: termo.trim().replace(/\*/g, '').slice(0, 100), limit: 300 },
  });
  if (error) throw error;
  const rows = ((data as any)?.tags ?? []) as Array<{ valor: string; formula: string; nm: string }>;
  return rows
    .map((r) => ({
      valor: normalizeTagFormatC(r.valor),
      formula: String(r.formula ?? '').trim(),
      cfgNome: String(r.nm ?? '').trim(),
    }))
    .filter((r) => r.valor.length > 0);
}

function TagPadraoSelect({
  valor,
  onChange,
  disabled = false,
}: {
  valor: string | null;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  const [busca, setBusca] = useState('');
  const [termo, setTermo] = useState('');
  const [aberto, setAberto] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setTermo(busca.trim()), 250);
    return () => clearTimeout(t);
  }, [busca]);

  useEffect(() => {
    const onDocDown = (ev: MouseEvent) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(ev.target as Node)) setAberto(false);
    };
    document.addEventListener('mousedown', onDocDown);
    return () => document.removeEventListener('mousedown', onDocDown);
  }, []);

  const { data: opcoes = [], isFetching } = useQuery({
    queryKey: ['tag-padrao-opcoes', termo],
    enabled: aberto && termo.length >= 1,
    staleTime: 10 * 60 * 1000,
    queryFn: () => buscarTagsPadrao(termo),
  });

  // Quando o usuário seleciona uma TAG, mostra o valor completo com fórmula.
  const opcaoSelecionada = useMemo(
    () => opcoes.find((o) => o.valor === valor) ?? null,
    [opcoes, valor],
  );

  return (
    <div className="space-y-1" ref={wrapRef}>
      <div className="relative">
        <Input
          value={busca}
          disabled={disabled}
          onFocus={() => !disabled && setAberto(true)}
          onChange={(e) => { setBusca(e.target.value); setAberto(true); }}
          placeholder="Digite para pesquisar uma TAG existente (ex.: MOTOR, 110V, etc.)"
          className="h-9 pl-3 pr-8 text-[11px]"
        />
        {isFetching && (
          <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 animate-spin text-muted-foreground" />
        )}
      </div>
      {aberto && termo.length >= 1 && (
        <div className="rounded border bg-background max-h-52 overflow-auto">
          {opcoes.length === 0 && (
            <p className="p-2 text-[10px] text-muted-foreground">Nenhuma TAG encontrada.</p>
          )}
          {opcoes.map((o) => (
            <button
              key={o.valor}
              onClick={() => { onChange(o.valor); setAberto(false); }}
              className="w-full text-left px-2 py-1.5 hover:bg-muted/70 transition border-b last:border-0"
            >
              <div className="font-mono text-[11px] break-all font-medium">{o.valor}</div>
              {o.formula ? (
                <div className="text-[9px] text-muted-foreground font-mono truncate">ƒ {o.formula}</div>
              ) : (
                o.cfgNome && (
                  <div className="text-[9px] text-muted-foreground truncate">{o.cfgNome}</div>
                )
              )}
            </button>
          ))}
        </div>
      )}
      {!aberto && valor && (
        <div className="text-[10px] font-mono text-muted-foreground break-all">
          {valor}
          {opcaoSelecionada?.formula && (
            <span className="ml-1 text-[9px]">ƒ {opcaoSelecionada.formula}</span>
          )}
        </div>
      )}
      {!aberto && !valor && (
        <p className="text-[10px] text-muted-foreground">Selecione uma TAG já existente no Auge.</p>
      )}
    </div>
  );
}

export function TagPadraoRegraManager() {
  const [linhas, setLinhas] = useState<TagPadraoRegra[]>([]);
  const [padraoNm, setPadraoNm] = useState('');
  const [tagPadrao, setTagPadrao] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['tag-padrao-regras'],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('auge-sync?action=tag_padrao_list');
      if (error) throw error;
      return (data as any)?.rules ?? [] as TagPadraoRegra[];
    },
  });

  useEffect(() => {
    if (data && JSON.stringify(data) !== JSON.stringify(linhas)) {
      setLinhas(data);
    }
  }, [data]);

  const handleSubmit = async () => {
    const nm = padraoNm.trim();
    const tag = (tagPadrao ?? '').trim();
    if (!nm) { toast.error('Informe o padrão (ex.: Motor, Rollo).'); return; }
    if (!tag) { toast.error('Selecione uma TAG existente para ser a padrão.'); return; }
    setSalvando(true);
    try {
      const { data: res, error } = await supabase.functions.invoke('auge-sync?action=tag_padrao_save', {
        body: { padrao_nm: nm, tag_padrao: tag },
      });
      if (error) throw error;
      toast.success(`Regra salva: ${nm} → ${tag}`);
      setPadraoNm('');
      setTagPadrao(null);
      // Refetch para atualizar a lista.
      void supabase.functions.invoke('auge-sync?action=tag_padrao_list').then((r) => {
        setLinhas((r as any)?.data?.rules ?? []);
      });
    } catch (e: any) {
      toast.error(e?.message ?? 'Falha ao salvar a regra.');
    } finally {
      setSalvando(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.functions.invoke('auge-sync?action=tag_padrao_delete', { body: { id } });
      if (error) throw error;
      setLinhas((prev) => prev.filter((r) => r.id !== id));
      toast.success('Regra removida.');
    } catch (e: any) {
      toast.error(e?.message ?? 'Falha ao remover a regra.');
    }
  };

  return (
    <div className="space-y-4">
      {/* Formulário de criação / edição de regra */}
      <div className="rounded border bg-card p-3 space-y-3">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Plus className="h-3.5 w-3.5" /> Regra de TAG Padrão
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] font-semibold uppercase text-muted-foreground">
              Padrão (nome da configuração)
            </label>
            <Input
              value={padraoNm}
              onChange={(e) => setPadraoNm(e.target.value)}
              placeholder="Ex.: Motor, Rollo, Cortina"
              className="h-9 text-[11px]"
              disabled={salvando}
            />
            <p className="text-[9px] text-muted-foreground">
              A configuração cuja descrição contenha esse texto terá essa TAG como padrão.
            </p>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-semibold uppercase text-muted-foreground">
              TAG Padrão (valor + fórmula)
            </label>
            <TagPadraoSelect
              valor={tagPadrao}
              onChange={setTagPadrao}
              disabled={salvando}
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleSubmit}
            disabled={salvando || !padraoNm.trim() || !tagPadrao}
            className="h-8 text-[11px] gap-1"
          >
            {salvando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            Salvar regra
          </Button>
          {(padraoNm || tagPadrao) && (
            <Button variant="ghost" className="h-8 text-[11px]" onClick={() => { setPadraoNm(''); setTagPadrao(null); }}>
              Limpar
            </Button>
          )}
        </div>
      </div>

      {/* Lista de regras existentes */}
      <div className="rounded border bg-card p-3 space-y-2">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
          <span>Regras salvas</span>
          <span className="text-[9px] font-normal normal-case text-muted-foreground">
            {isLoading ? 'carregando...' : `${linhas.length} regra(s)`}
          </span>
        </div>

        {isLoading && (
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground py-4 justify-center">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Carregando regras...
          </div>
        )}

        {!isLoading && linhas.length === 0 && (
          <p className="text-[11px] text-muted-foreground py-4 text-center">
            Nenhuma regra cadastrada. Crie uma acima.
          </p>
        )}

        {!isLoading && linhas.map((r) => (
          <div
            key={r.id}
            className="flex items-center justify-between gap-2 rounded border bg-background/60 px-3 py-2"
          >
            <div className="min-w-0 flex-1 flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="shrink-0 text-[10px]">
                {r.padrao_nm}
              </Badge>
              <span className="text-[11px] text-muted-foreground">→</span>
              <span className="font-mono text-[11px] break-all">{r.tag_padrao}</span>
              {!r.ativo && (
                <Badge variant="destructive" className="text-[9px]">inativo</Badge>
              )}
            </div>
            <Button
              variant="ghost"
              className="h-7 w-7 p-0 shrink-0 text-destructive hover:text-destructive"
              onClick={() => handleDelete(r.id)}
              aria-label="Remover regra"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
