import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SaldoBaixoSnapshot {
  id: string;
  referencia: string;
  origem: string | null;
  arquivo_nome: string | null;
  columns: string[];
  rows: string[][];
  total_linhas: number;
  created_by: string | null;
  created_at: string;
}

const KEY = ['compras', 'saldo-baixo', 'snapshots'] as const;

const parse = (r: any): SaldoBaixoSnapshot => ({
  id: r.id,
  referencia: r.referencia,
  origem: r.origem ?? null,
  arquivo_nome: r.arquivo_nome ?? null,
  columns: Array.isArray(r.columns) ? (r.columns as string[]) : [],
  rows: Array.isArray(r.rows) ? (r.rows as string[][]) : [],
  total_linhas: r.total_linhas ?? 0,
  created_by: r.created_by ?? null,
  created_at: r.created_at,
});

/** Lista de snapshots (mais recente primeiro). */
export function useSaldoBaixoSnapshots(limit = 60) {
  return useQuery<SaldoBaixoSnapshot[]>({
    queryKey: [...KEY, limit],
    staleTime: 15_000,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('compras_saldo_baixo_snapshots')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []).map(parse);
    },
  });
}

/** Salva uma nova planilha no histórico. */
export function useSaveSaldoBaixoSnapshot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      columns: string[];
      rows: string[][];
      origem?: string | null;
      arquivo_nome?: string | null;
      referencia?: string;
    }) => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth?.user?.id;
      if (!uid) throw new Error('Sessão expirada. Faça login novamente.');

      const { data, error } = await (supabase as any)
        .from('compras_saldo_baixo_snapshots')
        .insert({
          columns: input.columns,
          rows: input.rows,
          origem: input.origem ?? null,
          arquivo_nome: input.arquivo_nome ?? null,
          total_linhas: input.rows.length,
          created_by: uid,
          ...(input.referencia ? { referencia: input.referencia } : {}),
        })
        .select('id')
        .single();
      if (error) throw error;
      return data as { id: string };
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: KEY }),
  });
}

/** Remove um snapshot individual. */
export function useDeleteSaldoBaixoSnapshot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('compras_saldo_baixo_snapshots')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: KEY }),
  });
}

/** Limpa todo o histórico visível ao usuário (respeita as políticas de acesso). */
export function useClearSaldoBaixoSnapshots() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any)
        .from('compras_saldo_baixo_snapshots')
        .delete()
        .not('id', 'is', null);
      if (error) throw error;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: KEY }),
  });
}
