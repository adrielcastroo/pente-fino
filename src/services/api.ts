import { supabase } from '@/integrations/supabase/client';
import { Registro, Conference } from '@/types';
import { parseEndereco } from '@/lib/app-utils';

export const apiService = {
  async archiveConference(
    processo: string,
    conferente: string,
    startedAt: string,
    registros: Registro[],
    currentMode: string
  ) {
    const finishedAt = new Date().toISOString();
    
    const { data: conf, error: confError } = await supabase
      .from('conferences')
      .insert({
        processo: processo.trim(),
        conferente: conferente,
        started_at: startedAt,
        finished_at: finishedAt,
      } as any)
      .select().single();
      
    if (confError) throw confError;

    const rows = registros.map(r => ({
      id: r.id,
      conference_id: conf.id,
      item: r.item,
      m2: r.m2,
      m_linear: r.mLinear,
      largura: r.largura,
      endereco: r.endereco,
      nf: r.nf || '',
      lote: r.lote,
      lote_sistema: r.loteSistema,
      tipo_tecido: r.tipoTecido || '',
      modo_origem: r.modoOrigem || currentMode,
      was_edited: r.wasEdited || false,
      edited_by: r.editedBy || '',
      edited_at: r.editedAt || null,
      quantidade: r.quantidade || null,
    }));

    const { data: insertedRegs, error: regError } = await supabase
      .from('registros')
      .insert(rows as any)
      .select();
      
    if (regError) throw regError;

    // Process estoque
    const validEnderecos = (insertedRegs || [])
      .map(r => ({ r, parsed: parseEndereco(r.endereco) }))
      .filter(x => x.parsed !== null);

    if (validEnderecos.length > 0) {
      const structures = [...new Set(validEnderecos.map(x => x.parsed!.estrutura))];
      
      const { data: dbOccupied } = await supabase
        .from('estoque_posicoes')
        .select('estrutura, coluna, nivel, posicao')
        .in('estrutura', structures)
        .not('status', 'in', '(saida,livre)');

      const occupiedMap = new Map<string, Set<number>>();
      (dbOccupied || []).forEach(p => {
        const key = `${p.estrutura}.${p.coluna}.${p.nivel}`;
        if (!occupiedMap.has(key)) occupiedMap.set(key, new Set());
        occupiedMap.get(key)!.add(p.posicao);
      });

      const regMap = new Map(registros.map(r => [r.id, r]));
      const estoqueRows: any[] = [];

      for (const { r, parsed } of validEnderecos) {
        const { estrutura, coluna, nivel } = parsed!;
        const cellKey = `${estrutura}.${coluna}.${nivel}`;
        
        if (!occupiedMap.has(cellKey)) occupiedMap.set(cellKey, new Set());
        const occupiedSet = occupiedMap.get(cellKey)!;
        
        let pos = 1;
        while (pos <= 30 && occupiedSet.has(pos)) pos++;
        
        if (pos <= 30) {
          occupiedSet.add(pos);
          const original = regMap.get(r.id);
          estoqueRows.push({
            estrutura, coluna, nivel, posicao: pos, status: 'ocupado', registro_id: r.id,
            item: r.item, proc: original?.processo || processo || '', m2: r.m2, largura: r.largura,
            m_linear: r.m_linear, lote: r.lote, endereco: r.endereco, lote_sistema: r.lote_sistema,
            conferente_entrada: conferente,
            conferente_saida: '', data_registro: new Date().toISOString(),
          });
        }
      }

      if (estoqueRows.length > 0) {
        await supabase.from('estoque_posicoes').upsert(estoqueRows, { onConflict: 'estrutura,coluna,nivel,posicao' });
      }
    }
    
    return conf;
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
  },

  async updateRegistro(conferenceId: string, registroId: string, payload: any) {
    const { error } = await supabase
      .from('registros')
      .update(payload)
      .eq('id', registroId)
      .eq('conference_id', conferenceId);
      
    if (error) throw error;
  }
};
