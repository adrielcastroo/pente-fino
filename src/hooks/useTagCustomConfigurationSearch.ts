import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';
import { toIlikeTokens, matchesIlike } from '@/lib/tag-search';

export interface TagCustomSearchResult {
  cd_configuracao: string;
  nm_configuracao: string;
  qtd_tags: number;
}

export function useTagCustomConfigurationSearch(searchTerm: string) {
  const [debouncedTerm, setDebouncedTerm] = useState(searchTerm);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedTerm(searchTerm.trim());
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const query = useQuery({
    queryKey: ['tag-custom-config-search-v3', debouncedTerm],
    enabled: debouncedTerm.length >= 2,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      // 1. Tenta RPC
      try {
        const { data, error } = await (supabase as any).rpc('buscar_auge_tag_custom_configuracoes', {
          p_termo: debouncedTerm
        });

        if (!error && data) {
          // A RPC já deve aplicar o AND, mas garantimos no cliente para evitar discrepâncias visuais
          const tokens = toIlikeTokens(debouncedTerm);
          return (data as any[]).filter(cfg => {
            const nm = cfg.nm_configuracao || '';
            return tokens.every(tk => matchesIlike(nm, tk));
          }) as TagCustomSearchResult[];
        }
      } catch (err) {
        console.warn('RPC failed, falling back to PostgREST', err);
      }

      // 2. Fallback PostgREST com filtro AND estrito
      const tokens = toIlikeTokens(debouncedTerm);
      const tabelas = ['auge_tag_custom_configuracoes', 'auge_tag_custom_scan'];
      const map = new Map<string, TagCustomSearchResult>();

      for (const tabela of tabelas) {
        let q = supabase.from(tabela as any).select('cd_configuracao, nm_configuracao, qtd_tags');
        
        // Aplicamos TODOS os tokens no banco para reduzir o dataset e garantir AND no servidor
        if (tokens.length > 0) {
          for (const tk of tokens) {
            q = q.ilike('nm_configuracao', tk);
          }
        }

        const { data } = await q.limit(1000);
        if (data) {
          for (const r of data as any[]) {
            const nm = r.nm_configuracao || '';
            // Validamos TODOS os tokens no cliente para garantir lógica AND perfeita
            if (tokens.every(tk => matchesIlike(nm, tk))) {
              map.set(r.cd_configuracao, {
                cd_configuracao: String(r.cd_configuracao),
                nm_configuracao: nm,
                qtd_tags: Number(r.qtd_tags || 0)
              });
            }
          }
        }
      }

      return Array.from(map.values()).sort((a, b) => a.nm_configuracao.localeCompare(b.nm_configuracao, 'pt-BR'));
    }
  });

  return {
    ...query,
    hasSearched: debouncedTerm.length >= 2,
    debouncedTerm
  };
}
