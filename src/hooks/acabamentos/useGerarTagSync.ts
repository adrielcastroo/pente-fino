import { useMemo, useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useGerarTagStore } from '@/store/useGerarTagStore';
import { toast } from 'sonner';
import { normalizeTagFormatC } from '@/lib/tag-utils';

export function useGerarTagSync() {
  const qc = useQueryClient();
  const { 
    linhas, 
    setLinhas, 
    customAberta, 
    removidasManualmente,
    termoBuscaCfg
  } = useGerarTagStore();

  // Fetch tags for a specific configuration
  const { data: tagsDaCustom = [], isFetching: loadingCustom } = useQuery({
    queryKey: ['auge-tag-custom-detalhe', customAberta?.cd ?? ''],
    enabled: !!customAberta?.cd,
    staleTime: 60 * 1000,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('auge_tag_custom')
        .select('cd_configuracao, nm_configuracao, nm_tag_customizada, ds_tag_customizada, ds_tag_calculada, ds_tag_texto, cd_tag_customizada, cd_tag_calculada')
        .eq('cd_configuracao', customAberta!.cd)
        .limit(2000);
      
      if (error) throw error;
      if (data && data.length > 0) return data;

      try {
        const { data: fn } = await supabase.functions.invoke('auge-sync?action=tag_custom_por_config', {
          body: { cdConfiguracao: customAberta!.cd, nmConfiguracao: customAberta!.nm },
        });
        return (fn?.rows ?? []) as any[];
      } catch (err) {
        console.error('Error fetching from Auge:', err);
        return data ?? [];
      }
    },
  });

  return {
    tagsDaCustom,
    loadingCustom
  };
}
