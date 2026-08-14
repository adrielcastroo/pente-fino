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
      const { data, error } = await supabase.functions.invoke('auge-sync', {
        body: {
          action: 'expedicao_validar_peca',
          codigo: codigo.toUpperCase()
        }
      });

      if (error) throw error;
      if (!data.ok) throw new Error(data.error || 'Peça inválida');
      
      const peca = data.peca;

      setPecaAtual(peca);
      addBipagemHistorico({ codigo, tipo: 'peca', status: 'sucesso' });
      return peca;
    } catch (err: any) {
      toast.error('Erro ao validar peça: ' + err.message);
      addBipagemHistorico({ codigo, tipo: 'peca', status: 'erro', mensagem: err.message });
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

