import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ExpedicaoAlertCounts {
  painel: number;
  nfeEntrada: number;
  cargas: number;
  romaneio: number;
}

/**
 * Contadores usados como badges na sidebar e na tab bar da Expedição.
 * - painel:      pickings em separação/conferência (operação corrente)
 * - nfeEntrada:  NF-e recebidas ainda pendentes de manifestação
 * - cargas:      cargas em rota (não entregues)
 * - romaneio:    romaneios abertos sem NF vinculada
 */
export function useExpedicaoAlertCounts() {
  return useQuery<ExpedicaoAlertCounts>({
    queryKey: ['expedicao', 'alert-counts'],
    refetchInterval: 60_000,
    staleTime: 30_000,
    queryFn: async () => {
      const [pickings, nfe, cargas, romaneios] = await Promise.all([
        supabase
          .from('expedicao_pickings')
          .select('id', { count: 'exact', head: true })
          .in('status', ['em_separacao', 'em_conferencia']),
        (supabase as any)
          .from('nfe_entrada')
          .select('id', { count: 'exact', head: true })
          .eq('situacao_manifestacao', 'pendente'),
        (supabase as any)
          .from('expedicao_cargas')
          .select('id', { count: 'exact', head: true })
          .in('status', ['em_rota', 'saiu_entrega']),
        (supabase as any)
          .from('expedicao_romaneios')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'aberto'),
      ]);

      return {
        painel: pickings.count ?? 0,
        nfeEntrada: nfe.count ?? 0,
        cargas: cargas.count ?? 0,
        romaneio: romaneios.count ?? 0,
      };
    },
  });
}
