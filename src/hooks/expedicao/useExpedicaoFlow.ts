import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useExpedicaoStore } from '@/store/useExpedicaoStore';
import { toast } from 'sonner';

export function useValidarPeca() {
  const { addBipagemHistorico, setPecaAtual } = useExpedicaoStore();
  const [loading, setLoading] = useState(false);

  const validar = async (codigo: string) => {
    setLoading(true);
    try {
      // 1. Tentar identificar a peça pela lógica de etiquetas existente
      // (Aqui usamos uma consulta direta ao Supabase que espelha a lógica de etiquetas)
      const { data: peca, error } = await supabase
        .from('expedicao_pecas')
        .select(`
          *,
          cliente:auge_clientes(*),
          picking:expedicao_pickings(*)
        `)
        .eq('codigo_etiqueta', codigo.toUpperCase())
        .maybeSingle();

      if (error) throw error;
      
      if (!peca) {
        addBipagemHistorico({ codigo, tipo: 'peca', status: 'erro', mensagem: 'Peça não encontrada no sistema' });
        toast.error('Peça não encontrada. Verifique se a etiqueta foi gerada corretamente.');
        return null;
      }

      // Validações de negócio
      if (peca.status === 'CANCELADO' || peca.status === 'cancelada') {
        toast.error('Esta peça está CANCELADA e não pode ser processada.');
        return null;
      }

      setPecaAtual(peca);
      addBipagemHistorico({ codigo, tipo: 'peca', status: 'sucesso' });
      return peca;
    } catch (err: any) {
      toast.error('Erro ao validar peça: ' + err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { validar, loading };
}
