import { supabase } from '@/integrations/supabase/client';
import { parseEndereco } from '@/lib/app-utils';

export const estoqueService = {
  async processEstoque(insertedRegs: any[], registros: any[], processo: string, conferente: string) {
    try {
      const validEnderecos = (insertedRegs || [])
        .map(r => ({ r, parsed: parseEndereco(r.endereco) }))
        .filter(x => x.parsed !== null);

      if (validEnderecos.length === 0) return;

      const structures = [...new Set(validEnderecos.map(x => x.parsed!.estrutura))];
      
      const { data: dbOccupied, error: fetchError } = await supabase
        .from('estoque_posicoes')
        .select('estrutura, coluna, nivel, posicao')
        .in('estrutura', structures)
        .not('status', 'in', ['saida', 'livre']);

      if (fetchError) {
        console.error('Error fetching occupied positions:', fetchError);
        throw fetchError;
      }

      const occupiedMap = new Map<string, Set<number>>();
      (dbOccupied || []).forEach(p => {
        const key = `${p.estrutura}.${p.coluna}.${p.nivel}`;
        if (!occupiedMap.has(key)) occupiedMap.set(key, new Set());
        occupiedMap.get(key)!.add(p.posicao);
      });

      const regMap = new Map(registros.map(r => [r.id, r]));
      const estoqueRows: any[] = [];
      const skippedRegs: string[] = [];

      for (const { r, parsed } of validEnderecos) {
        const { estrutura, coluna, nivel } = parsed!;
        const cellKey = `${estrutura}.${coluna}.${nivel}`;
        
        if (!occupiedMap.has(cellKey)) occupiedMap.set(cellKey, new Set());
        const occupiedSet = occupiedMap.get(cellKey)!;
        
        let pos = 1;
        // The database constraint restricts positions to a maximum of 30.
        while (pos <= 30 && occupiedSet.has(pos)) pos++;
        
        if (pos <= 30) {
          occupiedSet.add(pos);
          const original = regMap.get(r.id);
          estoqueRows.push({
            estrutura,
            coluna,
            nivel,
            posicao: pos,
            status: 'ocupado',
            registro_id: r.id,
            item: r.item,
            proc: original?.processo || processo || '',
            m2: r.m2,
            largura: r.largura,
            m_linear: r.m_linear,
            lote: r.lote,
            endereco: r.endereco,
            lote_sistema: r.lote_sistema,
            conferente_entrada: conferente,
            conferente_saida: '',
            data_registro: new Date().toISOString(),
          });
        } else {
          skippedRegs.push(r.item || r.id);
          console.warn(`Position limit exceeded for ${cellKey}. Skipping record.`);
        }
      }

      if (estoqueRows.length > 0) {
        const { error: upsertError } = await supabase
          .from('estoque_posicoes')
          .upsert(estoqueRows, { onConflict: 'estrutura,coluna,nivel,posicao' });
        
        if (upsertError) {
          console.error('Error upserting to estoque_posicoes:', upsertError);
          throw upsertError;
        }

        // Update the 'registros' table with the assigned positions
        const updatePromises = estoqueRows.map(row => 
          supabase
            .from('registros')
            .update({ posicao: row.posicao })
            .eq('id', row.registro_id)
        );
        await Promise.all(updatePromises);
      }

      if (skippedRegs.length > 0) {
        // We throw an informative error if some records couldn't be placed
        throw new Error(`Alguns registros (${skippedRegs.length}) não foram alocados pois as posições do endereço estão cheias.`);
      }

      return estoqueRows;
    } catch (e) {
      console.error('Detailed error in processEstoque:', e);
      throw e;
    }
  }
};