/**
 * Busca motores bipados por visitantes
 * 
 * Uso: import { buscarMotoresBipados } from '@/components/MotorBipadoSearch';
 */
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useState } from 'react';

export interface MotorBipado {
  id: string;
  item: string;
  processo: string;
  lote: string;
  quantidade: number;
  modo_origem: string;
  created_at: string;
  edited_by: string | null;
  edited_at: string | null;
  status_bipagem: 'nao_bipado' | 'bipado';
}

export async function buscarMotoresBipados(
  limit: number = 50,
  searchTerm?: string
): Promise<MotorBipado[]> {
  const { data, error } = await supabase
    .from('registros')
    .select(`
      id,
      item,
      processo,
      lote,
      quantidade,
      modo_origem,
      created_at,
      edited_by,
      edited_at
    `)
    .in('modo_origem', ['motor', 'controle'])
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    toast.error(`Erro ao buscar: ${error.message}`);
    return [];
  }

  return (data || []).map(r => ({
    ...r,
    status_bipagem: r.edited_by ? 'bipado' : 'nao_bipado'
  }));
}

export function filtrarMotoresPorVisitantes(motores: MotorBipado[]) {
  return motores.filter(m => m.edited_by !== null);
}

export function filtrarMotoresNaoSalvos(motores: MotorBipado[]) {
  return motores.filter(m => 
    m.status_bipagem === 'nao_bipado' && 
    m.quantidade > 0
  );
}

// Hook para busca em tempo real
export function useMotorBipadoSearch() {
  const [motores, setMotores] = useState<MotorBipado[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buscar = async (searchTerm?: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await buscarMotoresBipados(100, searchTerm);
      setMotores(result);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return { motores, loading, error, buscar };
}

/**
 * Tipos para motores potencialmente perdidos
 */
export interface MotorPotencialPerdido {
  id?: string;
  codigo?: string;
  item?: string;
  lote?: string;
  quantidade?: number;
  processo?: string;
  modo_origem: 'motor' | 'controle';
  bipado_em?: string;
  salvo?: boolean;
  fonte: 'suspeito' | 'confirmado' | 'pendente';
}

/**
 * Busca candidatos a motores perdidos
 */
export async function buscarMotoresPerdidos(limite: number = 100): Promise<MotorPotencialPerdido[]> {
  const umaSemanaAtras = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  
  const { data, error } = await supabase
    .from('registros')
    .select('id, item, processo, lote, quantidade, modo_origem, created_at')
    .in('modo_origem', ['motor', 'controle'])
    .or(`lote.isnull,created_at.gt.${umaSemanaAtras}`)
    .order('created_at', { ascending: false })
    .limit(limite);

  if (error) {
    console.error('Erro ao buscar motores perdidos:', error);
    return [];
  }

  return (data || []).map(r => ({
    ...r,
    quantidade: r.quantidade !== undefined ? r.quantidade : 1,
    lote: r.lote || 'PERDIDO',
    salvo: !!(r.lote && r.quantidade),
    fonte: 'suspeito'
  }));
}

/**
 * Busca em conferências pendentes de motor/controle
 */
export async function buscarEmConferenciasPendentes(): Promise<any[]> {
  const { data, error } = await supabase
    .from('conferencias')
    .select(`
      id, nome, processo, status, iniciado_em, finalizado_em,
      registros:registros_conferencia(id, item, quantidade, modo_origem, created_at)
    `)
    .eq('status', 'em_andamento')
    .in('processo', ['motor', 'controle'])
    .order('iniciado_em', { ascending: false });

  if (error) return [];
  return data || [];
}

/**
 * Recupera motor de conferência pendente
 */
export async function recuperarMotorDeConferencia(
  conferenciaId: string,
  registroId: string
): Promise<boolean> {
  const { data: conf, error: confErr } = await supabase
    .from('conferencias')
    .select('registros')
    .eq('id', conferenciaId)
    .single();

  if (confErr || !conf) {
    toast.error('Conferência não encontrada');
    return false;
  }

  const reg = (conf.registros as any[]).find(r => r.id === registroId);
  if (!reg) {
    toast.warning('Registro não encontrado na conferência');
    return false;
  }

  const { error: upsertErr } = await supabase.from('registros').upsert({
    id: reg.id || registroId,
    item: reg.item,
    processo: reg.processo,
    quantidade: reg.quantidade || 1,
    lote: reg.lote || 'RECUPERADO_MOTOR',
    modo_origem: reg.modo_origem || 'motor',
    created_at: new Date().toISOString()
  }, { onConflict: 'id' });

  if (upsertErr) {
    toast.error(`Erro na recuperação: ${upsertErr.message}`);
    return false;
  }

  toast.success('Motor recuperado com sucesso!');
  return true;
}