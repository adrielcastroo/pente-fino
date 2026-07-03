import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { itensCadastroService, ItemCadastroInput } from '@/services/itensCadastroService';

const KEY = ['itens_cadastro'];

export function useItensCadastro() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => itensCadastroService.list(),
    staleTime: 5 * 60 * 1000,
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
