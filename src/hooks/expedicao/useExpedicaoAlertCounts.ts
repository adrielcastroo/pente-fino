import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ExpedicaoAlertCounts {
  /** Agregado (pickings + conferência + cargas em rota) — usado no Painel */
  painel: number;
  /** Pickings em separação */
  pickings: number;
  /** Pickings em conferência */
  conferencia: number;
  /** Cargas em rota / saiu para entrega */
  cargas: number;
  /** Romaneios abertos sem NF vinculada */
  romaneio: number;
  /** NF-e recebidas pendentes de manifestação */
  nfeEntrada: number;
}

/**
 * Contadores usados como badges na sidebar e tab bar da Expedição.
 * Refetch a cada 60s, staleTime 30s.
 */
export function useExpedicaoAlertCounts() {
  return useQuery<ExpedicaoAlertCounts>({
    queryKey: ['expedicao', 'alert-counts'],
    refetchInterval: 60_000,
    staleTime: 30_000,
    queryFn: async () => {
      const [pickSep, pickConf, cargas, romaneios, nfe] = await Promise.all([
        supabase
          .from('expedicao_pickings')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'em_separacao'),
        supabase
          .from('expedicao_pickings')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'em_conferencia'),
        (supabase as any)
          .from('expedicao_cargas')
          .select('id', { count: 'exact', head: true })
          .in('status', ['em_rota', 'saiu_entrega']),
        (supabase as any)
          .from('expedicao_romaneios')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'aberto'),
        (supabase as any)
          .from('nfe_entrada')
          .select('id', { count: 'exact', head: true })
          .eq('situacao_manifestacao', 'pendente'),
      ]);

      const pickings = pickSep.count ?? 0;
      const conferencia = pickConf.count ?? 0;
      const cargasCount = cargas.count ?? 0;

      return {
        painel: pickings + conferencia + cargasCount,
        pickings,
        conferencia,
        cargas: cargasCount,
        romaneio: romaneios.count ?? 0,
        nfeEntrada: nfe.count ?? 0,
      };
    },
  });
}
