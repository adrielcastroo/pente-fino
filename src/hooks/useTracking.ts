import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { trackingService } from '@/services/trackingService';
import type { TrackingStatus } from '@/types/tracking';

export const trackingKeys = {
  all: ['trackingLinks'] as const,
  lists: () => [...trackingKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...trackingKeys.lists(), filters] as const,
  detail: (id: string) => [...trackingKeys.all, 'detail', id] as const,
  byEntity: (type: string, id: string) => [...trackingKeys.all, 'byEntity', type, id] as const,
};

export function useTrackingLinks(filters?: { status?: TrackingStatus; carrier?: string }) {
  return useQuery({
    queryKey: trackingKeys.list(filters || {}),
    queryFn: () => trackingService.getLinks(filters),
    staleTime: 2 * 60 * 1000,
  });
}

export function useTrackingLink(id: string) {
  return useQuery({
    queryKey: trackingKeys.detail(id),
    queryFn: () => trackingService.getLink(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
}

export function useTrackingByEntity(entityType: string, entityId: string) {
  return useQuery({
    queryKey: trackingKeys.byEntity(entityType, entityId),
    queryFn: () => trackingService.getLinks({ linkedType: entityType, linkedId: entityId }),
    enabled: !!entityType && !!entityId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useSyncTracking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ code, carrier, cnpj, nf }: { code: string; carrier?: string; cnpj?: string; nf?: string }) =>
      trackingService.syncTracking(code, { preferred: carrier, cnpj, nf }),
    onSuccess: (link) => {
      qc.setQueryData(trackingKeys.detail(link.id), link);
      qc.invalidateQueries({ queryKey: trackingKeys.lists() });
    },
  });
}

export function useLinkTracking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, type, entityId }: { id: string; type: string; entityId: string }) =>
      trackingService.linkToEntity(id, type, entityId),
    onSuccess: (link) => {
      qc.setQueryData(trackingKeys.detail(link.id), link);
      qc.invalidateQueries({ queryKey: trackingKeys.lists() });
      if (link.linkedType && link.linkedId) {
        qc.invalidateQueries({ queryKey: trackingKeys.byEntity(link.linkedType, link.linkedId) });
      }
    },
  });
}

export function useUnlinkTracking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => trackingService.unlink(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: trackingKeys.lists() });
      qc.invalidateQueries({ queryKey: trackingKeys.detail(id) });
    },
  });
}

export function useDeleteTracking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => trackingService.deleteLink(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: trackingKeys.lists() }),
  });
}

export function usePrefetchTrackingLink() {
  const qc = useQueryClient();
  return (id: string) =>
    qc.prefetchQuery({
      queryKey: trackingKeys.detail(id),
      queryFn: () => trackingService.getLink(id),
      staleTime: 2 * 60 * 1000,
    });
}

