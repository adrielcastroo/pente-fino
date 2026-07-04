import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';

export interface FeatureFlag {
  id: string;
  key: string;
  enabled: boolean;
  description: string | null;
  rollout_roles: string[];
  updated_at: string;
}

async function fetchFlags(): Promise<FeatureFlag[]> {
  const { data, error } = await (supabase as any)
    .from('feature_flags')
    .select('*')
    .order('key');
  if (error) throw error;
  return (data ?? []) as FeatureFlag[];
}

export function useFeatureFlags() {
  return useQuery({
    queryKey: ['feature_flags'],
    queryFn: fetchFlags,
    staleTime: 30_000,
  });
}

/**
 * Retorna se uma flag está ativa para o usuário atual.
 * - Se `enabled=true` e `rollout_roles` vazio → ativa para todos.
 * - Se `rollout_roles` preenchido → só ativa para os papéis listados.
 */
export function useFeatureFlag(key: string): boolean {
  const { data: flags } = useFeatureFlags();
  const { role, isAdmin } = useAuth();
  const flag = flags?.find((f) => f.key === key);
  if (!flag || !flag.enabled) return false;
  if (isAdmin) return true;
  if (!flag.rollout_roles?.length) return true;
  return !!role && flag.rollout_roles.includes(role);
}
