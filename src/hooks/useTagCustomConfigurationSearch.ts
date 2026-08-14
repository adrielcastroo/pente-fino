import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMemo, useEffect, useState } from 'react';
import { toIlikePattern, toIlikeTokens, ilikeAnd } from '@/lib/tag-search';

export interface TagCustomSearchResult {
  cd_configuracao: string;
  nm_configuracao: string;
  qtd_tags: number;
}

/**
 * Hook centralizado para busca de configurações de TAG Custom.
 * Implementa debounce e lógica de busca AND.
 * 
 * FALLBACK: Se a RPC 'buscar_auge_tag_custom_configuracoes' não estiver 
 * disponível (PGRST202), o hook cai para uma busca via PostgREST 
 * aplicando ilike sequencial (AND) no cliente/servidor.
 */
export function useTagCustomConfigurationSearch(searchTerm: string) {
  const [debouncedTerm, setDebouncedTerm] = useState(searchTerm);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedTerm(searchTerm.trim());
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const query = useQuery({
    queryKey: ['tag-custom-config-search-v2', debouncedTerm],
    enabled: debouncedTerm.length >= 2,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
    queryFn: async () => {
      try {
        // 1. Tenta usar a RPC (Lógica AND nativa e performática)
        const { data, error } = await (supabase as any).rpc('buscar_auge_tag_custom_configuracoes', {
          p_termo: debouncedTerm
        });

        if (error) {
          // PGRST202 = Função não encontrada no schema cache
          if (error.code === 'PGRST202') {
            console.warn('RPC buscar_auge_tag_custom_configuracoes não encontrada. Usando fallback PostgREST.');
            return await runFallbackSearch(debouncedTerm);
          }
          throw error;
        }

        return (data || []) as TagCustomSearchResult[];
      } catch (err) {
        console.error('Erro useTagCustomConfigurationSearch:', err);
        // Se falhou por qualquer motivo, tenta o fallback antes de desistir
        return await runFallbackSearch(debouncedTerm);
      }
    }
  });

  return {
    ...query,
    hasSearched: debouncedTerm.length >= 2,
    debouncedTerm
  };
}

/**
 * Busca de fallback usando PostgREST padrão quando a RPC não está disponível.
 * Aplica lógica AND filtrando nm_configuracao por múltiplos tokens ilike.
 */
async function runFallbackSearch(term: string): Promise<TagCustomSearchResult[]> {
  const padrao = toIlikePattern(term);
  const tokens = toIlikeTokens(term);

  // Consultamos as duas tabelas que compõem o catálogo de configurações
  const tabelas = ['auge_tag_custom_configuracoes', 'auge_tag_custom_scan'];
  const acumulado: TagCustomSearchResult[] = [];

  for (const tabela of tabelas) {
    let q = supabase
      .from(tabela as any)
      .select('cd_configuracao, nm_configuracao, qtd_tags');
    
    // Aplica lógica AND (cada token deve estar no nome)
    q = ilikeAnd(q as any, 'nm_configuracao', padrao, tokens);

    const { data, error } = await q.limit(500);
    if (!error && data) {
      acumulado.push(...(data as any[]).map(r => ({
        cd_configuracao: String(r.cd_configuracao),
        nm_configuracao: String(r.nm_configuracao),
        qtd_tags: Number(r.qtd_tags || 0)
      })));
    }
  }

  // Deduplica e ordena
  const seen = new Set<string>();
  return acumulado
    .filter(cfg => {
      if (seen.has(cfg.cd_configuracao)) return false;
      seen.add(cfg.cd_configuracao);
      return true;
    })
    .sort((a, b) => a.nm_configuracao.localeCompare(b.nm_configuracao, 'pt-BR'));
}

