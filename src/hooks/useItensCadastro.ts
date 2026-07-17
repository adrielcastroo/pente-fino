import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { itensCadastroService, ItemCadastroInput } from '@/services/itensCadastroService';

const KEY = ['itens_cadastro'];

export function useItensCadastro() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => itensCadastroService.list(),
    // Cadastro muda com pouca frequência (edições manuais + reconciliação).
    // staleTime alto reduz refetches paginados que saturam o DB (era o #1
    // ofensor em pg_stat_statements: 13k+ chamadas / 1.6M ms totais).
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

export function useUpsertItemCadastro() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { input: ItemCadastroInput; opts?: { isEdit?: boolean; changedField?: string | null } } | ItemCadastroInput) => {
      // backward compatible: accept bare input or { input, opts }
      const isWrapped = (vars as any)?.input != null;
      const input = isWrapped ? (vars as any).input : (vars as ItemCadastroInput);
      const opts = isWrapped ? (vars as any).opts : undefined;
      return itensCadastroService.upsert(input, opts);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useBulkUpsertItensCadastro() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (
      vars:
        | ItemCadastroInput[]
        | {
            inputs: ItemCadastroInput[];
            onProgress?: (done: number, total: number) => void;
            signal?: AbortSignal;
          },
    ) => {
      const isWrapped = !Array.isArray(vars);
      const inputs = isWrapped ? vars.inputs : vars;
      const opts = isWrapped ? { onProgress: vars.onProgress, signal: vars.signal } : undefined;
      return itensCadastroService.bulkUpsert(inputs, opts);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteItemCadastro() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => itensCadastroService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
