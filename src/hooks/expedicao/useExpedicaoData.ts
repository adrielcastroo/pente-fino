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

// ============================================================
// Fase 3 — Associação picking↔carrinho + Conferência de peças
// ============================================================

export interface PickingItem {
  id: string;
  picking_id: string;
  codigo_peca: string;
  descricao: string | null;
  qtd_prevista: number;
  qtd_bipada: number;
  bipado_at: string | null;
  bipado_por: string | null;
  created_at: string;
  updated_at: string;
}

export function usePickingByNumero(numero: string | null) {
  return useQuery({
    queryKey: ['expedicao', 'picking-by-numero', numero],
    enabled: !!numero,
    queryFn: async (): Promise<Picking | null> => {
      const { data, error } = await supabase
        .from('expedicao_pickings')
        .select('*, transportadora:expedicao_transportadoras(nome), carrinho:expedicao_carrinhos(codigo)')
        .eq('numero', (numero ?? '').trim().toUpperCase())
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as unknown as Picking | null;
    },
  });
}

export function usePickingItens(pickingId: string | null) {
  return useQuery({
    queryKey: ['expedicao', 'picking-itens', pickingId],
    enabled: !!pickingId,
    queryFn: async (): Promise<PickingItem[]> => {
      const { data, error } = await supabase
        .from('expedicao_picking_itens')
        .select('*')
        .eq('picking_id', pickingId!)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as PickingItem[];
    },
    staleTime: 5_000,
  });
}

export function useAssociarCarrinho() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { pickingNumero: string; carrinhoCodigo: string }) => {
      const numero = input.pickingNumero.trim().toUpperCase();
      const codigo = input.carrinhoCodigo.trim().toUpperCase();
      if (!numero || !codigo) throw new Error('Bipe o picking e o carrinho.');

      const { data: picking, error: errP } = await supabase
        .from('expedicao_pickings')
        .select('id, status, carrinho_id, numero')
        .eq('numero', numero)
        .maybeSingle();
      if (errP) throw errP;
      if (!picking) throw new Error(`Picking ${numero} não encontrado.`);
      if (['conferido', 'faturado', 'cancelado'].includes(picking.status)) {
        throw new Error(`Picking ${numero} já está ${picking.status}.`);
      }

      const { data: carrinho, error: errC } = await supabase
        .from('expedicao_carrinhos')
        .select('id, status, codigo')
        .eq('codigo', codigo)
        .maybeSingle();
      if (errC) throw errC;
      if (!carrinho) throw new Error(`Carrinho ${codigo} não cadastrado.`);
      if (carrinho.status === 'manutencao') throw new Error(`Carrinho ${codigo} em manutenção.`);
      if (carrinho.status === 'em_uso' && picking.carrinho_id !== carrinho.id) {
        throw new Error(`Carrinho ${codigo} já está em uso por outro picking.`);
      }

      const { error: errU } = await supabase
        .from('expedicao_pickings')
        .update({ carrinho_id: carrinho.id, status: 'em_separacao' })
        .eq('id', picking.id);
      if (errU) throw errU;

      const { error: errUC } = await supabase
        .from('expedicao_carrinhos')
        .update({ status: 'em_uso' })
        .eq('id', carrinho.id);
      if (errUC) throw errUC;

      return { picking_numero: numero, carrinho_codigo: codigo };
    },
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: KEYS.pickings });
      qc.invalidateQueries({ queryKey: KEYS.carrinhos });
      toast.success(`${r.picking_numero} ↔ ${r.carrinho_codigo}`);
    },
    onError: (e: any) => toast.error(e.message ?? 'Falha ao associar'),
  });
}

export function useBipPeca() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { pickingId: string; codigoPeca: string }) => {
      const codigo = input.codigoPeca.trim().toUpperCase();
      if (!codigo) throw new Error('Código vazio.');

      const { data: existente, error: errF } = await supabase
        .from('expedicao_picking_itens')
        .select('id, qtd_bipada, qtd_prevista')
        .eq('picking_id', input.pickingId)
        .eq('codigo_peca', codigo)
        .maybeSingle();
      if (errF) throw errF;

      const uid = (await supabase.auth.getUser()).data.user?.id ?? null;
      const now = new Date().toISOString();

      if (existente) {
        const { error } = await supabase
          .from('expedicao_picking_itens')
          .update({
            qtd_bipada: existente.qtd_bipada + 1,
            bipado_at: now,
            bipado_por: uid,
          })
          .eq('id', existente.id);
        if (error) throw error;
        return { codigo, novo: false };
      }

      const { error } = await supabase
        .from('expedicao_picking_itens')
        .insert({
          picking_id: input.pickingId,
          codigo_peca: codigo,
          qtd_prevista: 1,
          qtd_bipada: 1,
          bipado_at: now,
          bipado_por: uid,
        });
      if (error) throw error;
      return { codigo, novo: true };
    },
    onSuccess: (r, vars) => {
      qc.invalidateQueries({ queryKey: ['expedicao', 'picking-itens', vars.pickingId] });
    },
    onError: (e: any) => toast.error(e.message ?? 'Falha ao bipar peça'),
  });
}

export function useFinalizarConferencia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (pickingId: string) => {
      const { error } = await supabase
        .from('expedicao_pickings')
        .update({ status: 'conferido', finished_at: new Date().toISOString() })
        .eq('id', pickingId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.pickings });
      toast.success('Conferência finalizada');
    },
    onError: (e: any) => toast.error(e.message ?? 'Falha ao finalizar'),
  });
}

