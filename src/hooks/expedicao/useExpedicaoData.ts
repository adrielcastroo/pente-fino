import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type PickingStatus =
  | 'aguardando'
  | 'em_separacao'
  | 'em_conferencia'
  | 'conferido'
  | 'faturado'
  | 'cancelado';

export type CarrinhoStatus = 'livre' | 'em_uso' | 'manutencao';

export interface Picking {
  id: string;
  numero: string;
  cliente: string;
  cidade: string | null;
  regiao: string | null;
  transportadora_id: string | null;
  carrinho_id: string | null;
  status: PickingStatus;
  total_pecas: number;
  observacao: string | null;
  created_at: string;
  finished_at: string | null;
  transportadora?: { nome: string } | null;
  carrinho?: { codigo: string } | null;
}

export interface Carrinho {
  id: string;
  codigo: string;
  status: CarrinhoStatus;
  created_at: string;
}

export interface Transportadora {
  id: string;
  nome: string;
  ativo: boolean;
  created_at: string;
}

const KEYS = {
  pickings: ['expedicao', 'pickings'] as const,
  carrinhos: ['expedicao', 'carrinhos'] as const,
  transportadoras: ['expedicao', 'transportadoras'] as const,
};

export function usePickings() {
  return useQuery({
    queryKey: KEYS.pickings,
    queryFn: async (): Promise<Picking[]> => {
      const { data, error } = await supabase
        .from('expedicao_pickings')
        .select(
          '*, transportadora:expedicao_transportadoras(nome), carrinho:expedicao_carrinhos(codigo)'
        )
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as unknown as Picking[];
    },
    staleTime: 15_000,
  });
}

export function useCarrinhos() {
  return useQuery({
    queryKey: KEYS.carrinhos,
    queryFn: async (): Promise<Carrinho[]> => {
      const { data, error } = await supabase
        .from('expedicao_carrinhos')
        .select('*')
        .order('codigo');
      if (error) throw error;
      return (data ?? []) as Carrinho[];
    },
    staleTime: 30_000,
  });
}

export function useTransportadoras() {
  return useQuery({
    queryKey: KEYS.transportadoras,
    queryFn: async (): Promise<Transportadora[]> => {
      const { data, error } = await supabase
        .from('expedicao_transportadoras')
        .select('*')
        .order('nome');
      if (error) throw error;
      return (data ?? []) as Transportadora[];
    },
    staleTime: 60_000,
  });
}

export function useCreatePicking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      numero: string;
      cliente: string;
      cidade?: string;
      regiao?: string;
      transportadora_id?: string | null;
      observacao?: string;
    }) => {
      const { data, error } = await supabase
        .from('expedicao_pickings')
        .insert({
          numero: input.numero.trim().toUpperCase(),
          cliente: input.cliente.trim(),
          cidade: input.cidade?.trim() || null,
          regiao: input.regiao?.trim() || null,
          transportadora_id: input.transportadora_id || null,
          observacao: input.observacao?.trim() || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.pickings });
      toast.success('Picking criado');
    },
    onError: (e: any) => toast.error(e.message ?? 'Falha ao criar picking'),
  });
}

export function useCreateCarrinho() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (codigo: string) => {
      const { error } = await supabase
        .from('expedicao_carrinhos')
        .insert({ codigo: codigo.trim().toUpperCase() });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.carrinhos });
      toast.success('Carrinho cadastrado');
    },
    onError: (e: any) => toast.error(e.message ?? 'Falha ao cadastrar carrinho'),
  });
}

export function useCreateTransportadora() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (nome: string) => {
      const { error } = await supabase
        .from('expedicao_transportadoras')
        .insert({ nome: nome.trim() });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.transportadoras });
      toast.success('Transportadora cadastrada');
    },
    onError: (e: any) => toast.error(e.message ?? 'Falha ao cadastrar'),
  });
}
