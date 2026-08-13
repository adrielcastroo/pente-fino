import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMemo } from 'react';

export interface TagCustomSearchResult {
  cd_configuracao: string;
  nm_configuracao: string;
  qtd_tags: number;
}

export function useTagCustomConfigurationSearch(searchTerm: string) {
  const queryTerm = useMemo(() => searchTerm.trim(), [searchTerm]);

  return useQuery({
    queryKey: ['tag-custom-config-search', queryTerm],
    enabled: queryTerm.length >= 2,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      // Usamos any para evitar erro de tipo até que a migration rode e o type-gen atualize (ou se não atualizar)
      const { data, error } = await (supabase as any).rpc('buscar_auge_tag_custom_configuracoes', {
        p_termo: queryTerm
      });

      if (error) {
        console.error('Erro na busca RPC:', error);
        throw error;
      }

      return (data || []) as TagCustomSearchResult[];
    }
  });
}

