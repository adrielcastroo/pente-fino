import { supabase } from '@/integrations/supabase/client';
import { Registro } from '@/types';

export const registroService = {
  async insertRegistros(conferenceId: string, registros: Registro[], currentMode: string) {
    // Filtra registros com dados inválidos para evitar 400 do Supabase
    const validRegistros = registros.filter(r => {
      if (!r.id || typeof r.id !== 'string') return false;
      // Valida que m2, m_linear, largura são números finitos
      const m2 = Number(r.m2);
      const mLinear = Number(r.mLinear);
      const largura = Number(r.largura);
      return Number.isFinite(m2) && Number.isFinite(mLinear) && Number.isFinite(largura);
    });

    if (validRegistros.length === 0) {
      return [];
    }

    const rows = validRegistros.map(r => ({
      id: r.id,
      conference_id: conferenceId,
      item: r.item,
      m2: Number(r.m2) || 0,
      m_linear: Number(r.mLinear) || 0,
      largura: Number(r.largura) || 0,
      endereco: r.endereco || '',
      nf: r.nf || '',
      lote: r.lote || '',
      lote_sistema: r.loteSistema || '',
      posicao: r.posicao != null ? Math.trunc(Number(r.posicao)) : null,
      tipo_tecido: r.tipoTecido || '',
      modo_origem: r.modoOrigem || currentMode,
      was_edited: r.wasEdited || false,
      edited_by: r.editedBy || '',
      edited_at: r.editedAt || null,
      quantidade: r.quantidade != null ? Math.trunc(Number(r.quantidade)) : null,
      lote_mestre_id: r.loteMestreId ?? null,
      avaria_tipo: r.avariaTipo ?? null,
      avaria_descricao: r.avariaDescricao ?? null,
      avaria_foto_url: r.avariaFotoUrl ?? null,
      curva_abc: r.curva_abc || 'C',
    }));

    const { data, error } = await supabase
      .from('registros')
      .upsert(rows as any, { onConflict: 'id' })
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
