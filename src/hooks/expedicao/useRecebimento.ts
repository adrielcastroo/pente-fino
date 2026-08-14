import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useProcessarRecebimento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ etiquetas, estruturaId }: { etiquetas: string[], estruturaId: string }) => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;

      // 1. Atualiza ou cria as peças com status RECEBIDA_EXPEDICAO
      // O trigger trg_registrar_evento_expedicao cuidará do histórico
      for (const etq of etiquetas) {
        const { data: existing } = await supabase
          .from('expedicao_pecas')
          .select('id')
          .eq('codigo_etiqueta', etq)
          .maybeSingle();

        if (existing) {
          await supabase
            .from('expedicao_pecas')
            .update({ 
              status: 'RECEBIDA_EXPEDICAO' as any,
              estrutura_temporaria_id: estruturaId,
              embalador_id: uid
            })
            .eq('id', existing.id);
        } else {
          await supabase
            .from('expedicao_pecas')
            .insert({
              codigo_etiqueta: etq,
              status: 'RECEBIDA_EXPEDICAO' as any,
              estrutura_temporaria_id: estruturaId,
              embalador_id: uid,
              etiquetada_at: new Date().toISOString()
            });
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expedicao', 'alert-counts'] });
      toast.success('Recebimento processado com sucesso');
    },
    onError: (err: any) => {
      toast.error('Erro ao processar recebimento: ' + err.message);
    }
  });
}
