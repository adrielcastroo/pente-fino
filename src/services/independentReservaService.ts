import { supabase } from '@/integrations/supabase/client';
import { Reserva } from '@/types';
import { buildAuditPayload } from '@/lib/audit';

function mapRow(r: any): Reserva {
  return {
    id: r.id,
    codigo: r.codigo,
    descricao: r.descricao,
    endereco: r.endereco,
    quantidade: r.quantidade,
    caixaNum: r.caixa_num,
    quantidadeCx: r.quantidade_cx,
    observacao: r.observacao,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    updatedBy: r.updated_by,
    updatedByName: r.updated_by_name,
    lastEditedField: r.last_edited_field,
    lastEditedAt: r.last_edited_at,
  };
}

export const independentReservaService = {
  async fetchReservas() {
    const { data, error } = await supabase
      .from('independent_reservations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(mapRow) as Reserva[];
  },

  async addReserva(reserva: Reserva, opts?: { isEdit?: boolean; changedField?: string | null }) {
    const payload: any = {
      id: reserva.id,
      codigo: reserva.codigo,
      descricao: reserva.descricao,
      endereco: reserva.endereco,
      quantidade: reserva.quantidade,
      caixa_num: reserva.caixaNum,
      quantidade_cx: reserva.quantidadeCx,
      observacao: reserva.observacao,
      created_at: reserva.createdAt,
    };

    if (opts?.isEdit) {
      const audit = await buildAuditPayload(opts.changedField ?? null);
      Object.assign(payload, audit);
    }

    const { data, error } = await supabase
      .from('independent_reservations')
      .upsert([payload], { onConflict: 'id' })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteReserva(id: string) {
    const { error } = await supabase
      .from('independent_reservations')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async clearReservas() {
    const { error } = await supabase
      .from('independent_reservations')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (error) throw error;
  }
};
