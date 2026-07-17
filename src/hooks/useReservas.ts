import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import { Reserva } from '@/types';
import { toast } from 'sonner';

export const RESERVAS_QUERY_KEY = ['reservas'] as const;

export function useReservas() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: RESERVAS_QUERY_KEY,
    queryFn: () => apiService.fetchReservas(),
    // Polling reduzido de 10s → 60s (o dado é raramente modificado; realtime
    // ou mutations locais mantêm a UI em sincronia). Reduz drasticamente o
    // volume de requests em abas abertas por longos períodos.
    refetchInterval: 60_000,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const addMutation = useMutation({
    mutationFn: ({ reserva, opts }: { reserva: Reserva; opts?: { isEdit?: boolean; changedField?: string | null } }) =>
      apiService.addReserva(reserva, opts),
    onSuccess: (_d, vars) => {
      queryClient.invalidateQueries({ queryKey: RESERVAS_QUERY_KEY });
      toast.success(vars.opts?.isEdit ? 'Reserva atualizada!' : 'Item adicionado com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao salvar item no banco de dados.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiService.deleteReserva(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RESERVAS_QUERY_KEY });
      toast.success('Item removido com sucesso.');
    },
    onError: () => {
      toast.error('Erro ao remover item.');
    },
  });

  const clearMutation = useMutation({
    mutationFn: () => apiService.clearReservas(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RESERVAS_QUERY_KEY });
      toast.success('Reservas limpas com sucesso.');
    },
    onError: () => {
      toast.error('Erro ao limpar reservas.');
    },
  });

  return {
    reservas: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    addReserva: addMutation.mutateAsync,
    deleteReserva: deleteMutation.mutateAsync,
    clearReservas: clearMutation.mutateAsync,
    isAdding: addMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isClearing: clearMutation.isPending,
  };
}
