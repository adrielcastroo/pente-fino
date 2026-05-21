import { supabase } from '@/integrations/supabase/client';
import { parseEndereco } from '@/lib/app-utils';
import { Registro } from '@/types';
import { toast } from 'sonner';

export const estoqueService = {
  async getNextAvailablePosition(endereco: string, item: string, currentRegistros: Registro[]): Promise<number | null> {
    const parsed = parseEndereco(endereco);
    if (!parsed) return null;

    const { estrutura, coluna, nivel } = parsed;
    const cellKey = `${estrutura}.${coluna}.${nivel}`;

    // 1. Check database for occupied positions
    const { data: dbOccupied, error } = await supabase
      .from('estoque_posicoes')
      .select('posicao')
      .eq('estrutura', estrutura)
      .eq('coluna', coluna)
      .eq('nivel', nivel)
      .not('status', 'in', ['saida', 'livre']);

    if (error) {
      console.error('Error fetching occupied positions:', error);
      return null;
    }

    const occupiedSet = new Set<number>((dbOccupied || []).map(p => p.posicao));

    // 2. Check current session's registros that are going to the same address
    currentRegistros.forEach(r => {
      if (r.endereco === endereco && r.posicao) {
        occupiedSet.add(r.posicao);
      }
    });

    // 3. Find first available (1-100)
    let pos = 1;
    while (pos <= 100 && occupiedSet.has(pos)) pos++;

    return pos <= 100 ? pos : null;
  },

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
        
        const original = regMap.get(r.id);
        let pos = original?.posicao;
        
        // If not already allocated in the frontend, find next available (up to 100)
        if (!pos) {
          pos = 1;
          while (pos <= 100 && occupiedSet.has(pos)) pos++;
        }
        
        if (pos && pos <= 100) {
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
        console.log(`Upserting ${estoqueRows.length} rows to estoque_posicoes`);
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
        const results = await Promise.all(updatePromises);
        const errors = results.filter(r => r.error).map(r => r.error);
        if (errors.length > 0) {
          console.error('Errors updating registros positions:', errors);
        }
      }

      if (skippedRegs.length > 0) {
        toast.error(`Atenção: ${skippedRegs.length} itens não couberam no endereço e ficaram fora do estoque.`);
      }

      return estoqueRows;
    } catch (e) {
      console.error('Detailed error in processEstoque:', e);
      toast.error('Erro ao processar estoque. Verifique os logs.');
      throw e;
    }
  }
};