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
    refetchInterval: 10000, // Sync every 10s
    staleTime: 5000,
  });

  const addMutation = useMutation({
    mutationFn: (newReserva: Reserva) => apiService.addReserva(newReserva),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RESERVAS_QUERY_KEY });
      toast.success('Item adicionado com sucesso!');
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
