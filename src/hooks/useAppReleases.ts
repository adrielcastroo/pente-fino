import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AppRelease {
  id: string;
  version: string;
  notes: string | null;
  released_by: string | null;
  released_at: string;
  is_stable: boolean;
  is_current: boolean;
  build_time: string | null;
  created_at: string;
  updated_at: string;
}

async function fetchReleases(): Promise<AppRelease[]> {
  const { data, error } = await (supabase as any)
    .from('app_releases')
    .select('*')
    .order('released_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as AppRelease[];
}

export function useAppReleases() {
  return useQuery({
    queryKey: ['app_releases'],
    queryFn: fetchReleases,
    staleTime: 30_000, // Checa por novas versões a cada 30 segundos
    refetchInterval: 60_000, // Polling ativo para detectar deploys em background
  });
}

export function useCurrentRelease() {
  const { data } = useAppReleases();
  return data?.find((r) => r.is_current) ?? null;
}
