import { supabase } from '@/integrations/supabase/client';

export interface AuditInfo {
  updated_by: string | null;
  updated_by_name: string | null;
  last_edited_field: string | null;
  last_edited_at: string;
}

/**
 * Resolve current authenticated user id + display name (best effort).
 */
export async function getCurrentUserInfo(): Promise<{ id: string | null; name: string | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { id: null, name: null };
    let name: string | null = (user.user_metadata?.display_name as string) || null;
    if (!name) {
      const { data: profile } = await (supabase
        .from('profiles' as any)
        .select('display_name')
        .eq('id', user.id)
        .maybeSingle() as any);
      name = profile?.display_name || user.email?.split('@')[0] || null;
    }
    return { id: user.id, name };
  } catch {
    return { id: null, name: null };
  }
}

/**
 * Compute audit payload for an UPDATE operation.
 */
export async function buildAuditPayload(changedField: string | null): Promise<AuditInfo> {
  const { id, name } = await getCurrentUserInfo();
  return {
    updated_by: id,
    updated_by_name: name,
    last_edited_field: changedField,
    last_edited_at: new Date().toISOString(),
  };
}

/**
 * Diff two records and return list of changed keys (string-compared with trim).
 */
export function diffFields<T extends Record<string, any>>(before: T | null | undefined, after: T, keys: (keyof T)[]): string[] {
  if (!before) return [];
  const changed: string[] = [];
  for (const k of keys) {
    const b = before[k];
    const a = after[k];
    const bs = String(b ?? '').trim();
    const as = String(a ?? '').trim();
    if (bs !== as) changed.push(String(k));
  }
  return changed;
}

/**
 * Friendly PT-BR labels for known fields.
 */
export const FIELD_LABELS: Record<string, string> = {
  codigo_interno: 'Código interno',
  descricao: 'Descrição',
  codigo_fornecedor: 'Código fornecedor',
  codigos_fornecedor: 'Códigos de fornecedor',
  codigo: 'Código',
  endereco: 'Endereço',
  quantidade: 'Quantidade',
  quantidade_cx: 'Qtd por CX',
  caixa_num: 'Nº caixa',
  observacao: 'Observação',
};

export function fieldLabel(key: string | null | undefined): string {
  if (!key) return '';
  return FIELD_LABELS[key] || key;
}
