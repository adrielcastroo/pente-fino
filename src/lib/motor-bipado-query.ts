/**
 * Busca motores bipados em uma data específica
 * Use no dashboard do Pente Fino ou via SQL
 */
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

export async function buscarMotoresPorData(
  data: string, // formato YYYY-MM-DD
  limite: number = 100
) {
  const inicio = new Date(data).toISOString();
  const fim = new Date(data).setHours(23, 59, 59, 999);
  
  const { data: registros, error } = await supabase
    .from('registros')
    .select(`
      id,
      item,
      processo,
      lote,
      quantidade,
      m2,
      mLinear,
      largura,
      endereco,
      modo_origem,
      created_at,
      edited_by,
      edited_at,
      status
    `)
    .in('modo_origem', ['motor', 'controle'])
    .gte('created_at', inicio)
    .lte('created_at', new Date(fim).toISOString())
    .order('created_at', { ascending: false })
    .limit(limite);

  if (error) {
    console.error('Erro:', error);
    return { registros: [], error };
  }

  return {
    registros: registros || [],
    total: (registros || []).length,
    data,
    error: null
  };
}

export async function contarMotoresBipadosHoje() {
  const hoje = format(new Date(), 'yyyy-MM-dd');
  const manha = new Date();
  manha.setHours(0, 0, 0, 0);
  
  // Conta registros de motor/controle criados hoje
  const { count, error } = await supabase
    .from('registros')
    .select('id', { count: 'exact' })
    .in('modo_origem', ['motor', 'controle'])
    .gte('created_at', manha.toISOString());

  return { 
    total: count || 0, 
    data: hoje, 
    error: error?.message || null 
  };
}

// Query SQL para executar no Supabase:
/*
SELECT 
  COUNT(*) as total_motores_bipados_hoje,
  COUNT(CASE WHEN edited_by IS NOT NULL THEN 1 END) as bipados_por_visitante,
  COUNT(CASE WHEN edited_by IS NULL THEN 1 END) as nao_confirmados
FROM registros
WHERE modo_origem IN ('motor', 'controle')
  AND DATE(created_at) = '2026-09-28';
*/