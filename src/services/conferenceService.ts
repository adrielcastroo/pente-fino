import { supabase } from '@/integrations/supabase/client';
import { Conference } from '@/types';

export const conferenceService = {
  async insertConference(processo: string, conferente: string, startedAt: string, finishedAt: string) {
    const { data, error } = await supabase
      .from('conferences')
      .insert({
        processo: processo.trim(),
        conferente: conferente,
        started_at: startedAt,
        finished_at: finishedAt,
      } as any)
      .select().single();
      
    if (error) throw error;
    return data;
  },

  async fetchHistory(): Promise<Conference[]> {
    const { data: confs, error } = await supabase
      .from('conferences')
      .select('*, registros (*)')
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    
    return (confs || []).map(c => ({
      id: c.id,
      name: c.processo,
      processo: c.processo,
      conferente: c.conferente,
      date: c.created_at,
      startedAt: (c as any).started_at || null,
      finishedAt: (c as any).finished_at || null,
      registros: ((c as any).registros || [])
        .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        .map((r: any) => ({
          id: r.id,
          item: r.item,
          processo: (r.modo_origem === 'diversos' && r.tipo_tecido !== 'Celular') ? '' : c.processo,
          nf: r.nf || '',
          endereco: r.endereco,
          m2: Number(r.m2),
          mLinear: Number(r.m_linear),
          largura: Number(r.largura),
          lote: r.lote,
          loteSistema: r.lote_sistema,
          conference_id: r.conference_id,
          tipoTecido: r.tipo_tecido,
          modoOrigem: r.modo_origem,
          wasEdited: r.was_edited,
          editedBy: r.edited_by,
          editedAt: r.edited_at,
          quantidade: r.quantidade || undefined,
        })),
    }));
  },

  async deleteConference(id: string) {
    await supabase.from('registros').delete().eq('conference_id', id);
    await supabase.from('conferences').delete().eq('id', id);
  },

  async clearAllHistory() {
    await supabase.from('registros').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('conferences').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  }
};