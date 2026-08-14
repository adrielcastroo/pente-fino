import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { bipToast } from '@/lib/toast-flows';

interface ProcessarRecebimentoParams {
  etiquetas: string[];
  estruturaId: string;
}

export function useProcessarRecebimento() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ etiquetas, estruturaId }: ProcessarRecebimentoParams) => {
      // 1. Buscar UUIDs das peças na tabela de sincronização oficial (Auge Sync)
      const { data: pecas, error: fetchErr } = await supabase
        .from('expedicao_pecas_auge_sync')
        .select('id, codigo_etiqueta')
        .in('codigo_etiqueta', etiquetas);

      if (fetchErr) throw fetchErr;
      if (!pecas?.length) throw new Error('Nenhuma peça encontrada no banco de peças PRONTAS do Auge.');

      const pecaIds = pecas.map(p => p.id);

      // 2. Chamar Auge-Sync para atualizar no Auge e registrar no Supabase via transação
      const { data, error } = await supabase.functions.invoke('auge-sync', {
        body: {
          action: 'expedicao_receber',
          pecas: pecaIds,
          estrutura_id: estruturaId,
          triggered_by: (await supabase.auth.getUser()).data.user?.id
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expedicao_pecas_pulmao'] });
    },
    onError: (err: any) => {
      bipToast.erro(err.message || 'Erro ao processar recebimento');
    }
  });
}
