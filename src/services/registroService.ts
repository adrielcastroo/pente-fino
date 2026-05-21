import { supabase } from '@/integrations/supabase/client';
import { Registro } from '@/types';

export const registroService = {
  async insertRegistros(conferenceId: string, registros: Registro[], currentMode: string) {
    const rows = registros.map(r => ({
      id: r.id,
      conference_id: conferenceId,
      item: r.item,
      m2: r.m2,
      m_linear: r.mLinear,
      largura: r.largura,
      endereco: r.endereco,
      nf: r.nf || '',
      lote: r.lote,
      lote_sistema: r.loteSistema,
      posicao: r.posicao ?? null,
      tipo_tecido: r.tipoTecido || '',
      modo_origem: r.modoOrigem || currentMode,
      was_edited: r.wasEdited || false,
      edited_by: r.editedBy || '',
      edited_at: r.editedAt || null,
      quantidade: r.quantidade ?? null,
      lote_mestre_id: r.loteMestreId ?? null,
      avaria_tipo: r.avariaTipo ?? null,
      avaria_descricao: r.avariaDescricao ?? null,
      avaria_foto_url: r.avariaFotoUrl ?? null,
    }));

    const { data, error } = await supabase
      .from('registros')
      .insert(rows as any)
      .select();
      
    if (error) throw error;
    return data;
  },

  async updateRegistro(conferenceId: string, registroId: string, payload: any) {
    const { error } = await supabase
      .from('registros')
      .update(payload)
      .eq('id', registroId)
      .eq('conference_id', conferenceId);
      
    if (error) throw error;
  },

  async deleteRegistro(conferenceId: string, registroId: string) {
    const { error } = await supabase
      .from('registros')
      .delete()
      .eq('id', registroId)
      .eq('conference_id', conferenceId);
      
    if (error) throw error;
  }
};
