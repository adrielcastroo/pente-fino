import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type ComprasPedidoStatus =
  | 'pendente'
  | 'em_andamento'
  | 'recebido'
  | 'atrasado'
  | 'aguardando_retorno'
  | 'cancelado';

export interface ComprasPedido {
  id: string;
  numero: string;
  fornecedor: string;
  status: ComprasPedidoStatus;
  itens: number;
  valor_total: number | null;
  previsao: string | null;
  observacao: string | null;
  created_at: string;
  updated_at: string;
}

interface UseComprasPedidosParams {
  page: number;
  pageSize: number;
  search?: string;
}

interface ComprasPedidosResult {
  rows: ComprasPedido[];
  total: number;
}

/**
 * Lista paginada de pedidos de compra em acompanhamento.
 * Ordenados do mais recente para o mais antigo.
 */
export function useComprasPedidos({ page, pageSize, search }: UseComprasPedidosParams) {
  return useQuery<ComprasPedidosResult>({
    queryKey: ['compras', 'pedidos', { page, pageSize, search: search?.trim() ?? '' }],
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    queryFn: async () => {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = (supabase as any)
        .from('compras_pedidos')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      const q = search?.trim();
      if (q) {
        // Escapa % e , do padrão OR do PostgREST
        const safe = q.replace(/[%,]/g, ' ');
        query = query.or(`numero.ilike.%${safe}%,fornecedor.ilike.%${safe}%`);
      }

      const { data, error, count } = await query;
      if (error) throw error;

      return {
        rows: (data ?? []) as ComprasPedido[],
        total: count ?? 0,
      };
    },
  });
}

/**
 * KPIs agregados por status. Consulta separada para não depender da página atual.
 */
export function useComprasPedidosKpis() {
  return useQuery({
    queryKey: ['compras', 'pedidos', 'kpis'],
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('compras_pedidos')
        .select('status');
      if (error) throw error;

      const rows = (data ?? []) as { status: ComprasPedidoStatus }[];
      return {
        total: rows.length,
        pendentes: rows.filter(r => r.status === 'pendente').length,
        em_andamento: rows.filter(r => r.status === 'em_andamento').length,
        recebidos: rows.filter(r => r.status === 'recebido').length,
        atrasados: rows.filter(r => r.status === 'atrasado').length,
        cancelados: rows.filter(r => r.status === 'cancelado').length,
        aguardando_retorno: rows.filter(r => r.status === 'aguardando_retorno').length,
      };
    },
  });
}
