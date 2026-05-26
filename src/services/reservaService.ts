import { supabase } from '@/integrations/supabase/client';
import { Reserva } from '@/types';

export const reservaService = {
  async fetchReservas() {
    const { data, error } = await supabase
      .from('reservas')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return data.map(r => ({
      id: r.id,
      codigo: r.codigo,
      descricao: r.descricao,
      endereco: r.endereco,
      quantidade: r.quantidade,
      caixaNum: r.caixa_num,
      quantidadeCx: r.quantidade_cx,
      observacao: r.observacao,
      createdAt: r.created_at,
    })) as Reserva[];
  },

  async addReserva(reserva: Reserva) {
    const { data, error } = await supabase
      .from('reservas')
      .upsert([{
        id: reserva.id,
        codigo: reserva.codigo,
        descricao: reserva.descricao,
        endereco: reserva.endereco,
        quantidade: reserva.quantidade,
        caixa_num: reserva.caixaNum,
        quantidade_cx: reserva.quantidadeCx,
        observacao: reserva.observacao,
        created_at: reserva.createdAt,
      }], { onConflict: 'id' })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteReserva(id: string) {
    const { error } = await supabase
      .from('reservas')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async clearReservas() {
    const { error } = await supabase
      .from('reservas')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (error) throw error;
  }
};
