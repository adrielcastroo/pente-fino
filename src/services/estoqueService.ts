import { supabase } from '@/integrations/supabase/client';
import { parseEndereco } from '@/lib/app-utils';

export const estoqueService = {
  async processEstoque(insertedRegs: any[], registros: any[], processo: string, conferente: string) {
    const validEnderecos = (insertedRegs || [])
      .map(r => ({ r, parsed: parseEndereco(r.endereco) }))
      .filter(x => x.parsed !== null);

    if (validEnderecos.length === 0) return;

    const structures = [...new Set(validEnderecos.map(x => x.parsed!.estrutura))];
    
    const { data: dbOccupied } = await supabase
      .from('estoque_posicoes')
      .select('estrutura, coluna, nivel, posicao')
      .in('estrutura', structures)
      .not('status', 'in', ['saida', 'livre']);

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
};