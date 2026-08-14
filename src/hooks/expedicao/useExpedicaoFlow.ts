import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useExpedicaoStore } from '@/store/useExpedicaoStore';
import { toast } from 'sonner';

export function useValidarPeca() {
  const { addBipagemHistorico, setPecaAtual } = useExpedicaoStore();
  const [loading, setLoading] = useState(false);

  const validar = async (codigo: string) => {
    setLoading(true);
    try {
      const { data: peca, error } = await supabase
        .from('expedicao_pecas_auge_sync')
        .select('*')
        .eq('codigo_etiqueta', codigo.toUpperCase())
        .maybeSingle();

      if (error) throw error;
      
      if (!peca) {
        addBipagemHistorico({ codigo, tipo: 'peca', status: 'erro', mensagem: 'Peça não encontrada no sistema' });
        toast.error('Peça não encontrada. Verifique se a etiqueta foi gerada corretamente.');
        return null;
      }

      if (peca.status.toLowerCase() === 'cancelado' || peca.status.toLowerCase() === 'cancelada') {
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

export function useAlocarPeca() {
  const { addBipagemHistorico, limparSessaoAlocacao } = useExpedicaoStore();
  const [loading, setLoading] = useState(false);

  const alocar = async (params: {
    peca_id: string;
    carrinho_id: string;
    transportadora_id: string;
    ciclo_id?: string;
  }) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('auge-sync', {
        body: {
          action: 'expedicao_alocar',
          ...params
        }
      });

      if (error) throw error;
      if (!data.ok) throw new Error(data.error || 'Erro desconhecido na alocação');

      toast.success('Peça alocada com sucesso!');
      return data;
    } catch (err: any) {
      toast.error('Erro na alocação: ' + err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { alocar, loading };
}

