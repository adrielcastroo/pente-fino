import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMemo, useEffect, useState } from 'react';

export interface TagCustomSearchResult {
  cd_configuracao: string;
  nm_configuracao: string;
  qtd_tags: number;
}

/**
 * Hook centralizado para busca de configurações de TAG Custom.
 * Implementa debounce, cancelamento de query e lógica de busca AND via RPC.
 */
export function useTagCustomConfigurationSearch(searchTerm: string) {
  const [debouncedTerm, setDebouncedTerm] = useState(searchTerm);
  const queryClient = useQueryClient();

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedTerm(searchTerm.trim());
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const query = useQuery({
    queryKey: ['tag-custom-config-search', debouncedTerm],
    enabled: debouncedTerm.length >= 2,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
    queryFn: async ({ signal }) => {
      // Usamos a RPC segura que aplica lógica AND no PostgreSQL
      const { data, error } = await (supabase as any).rpc('buscar_auge_tag_custom_configuracoes', {
        p_termo: debouncedTerm
      });

      if (error) {
        console.error('Erro useTagCustomConfigurationSearch:', error);
        throw error;
      }

      return (data || []) as TagCustomSearchResult[];
    }
  });

  return {
    ...query,
    hasSearched: debouncedTerm.length >= 2,
    debouncedTerm
  };
}
