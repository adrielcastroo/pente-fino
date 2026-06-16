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
    mutationFn: (input: ItemCadastroInput) => itensCadastroService.upsert(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useBulkUpsertItensCadastro() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (inputs: ItemCadastroInput[]) => itensCadastroService.bulkUpsert(inputs),
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
