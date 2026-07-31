import { useEffect, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { ComprasPedidoStatus } from './useComprasPedidos';

export const KANBAN_COLUNAS: { status: ComprasPedidoStatus; label: string }[] = [
  { status: 'pendente', label: 'Pendente' },
  { status: 'em_andamento', label: 'Em andamento' },
  { status: 'atrasado', label: 'Atrasado' },
  { status: 'recebido', label: 'Recebido' },
  { status: 'cancelado', label: 'Cancelado' },
];

export interface ComprasPedidoCard {
  id: string;
  numero: string;
  fornecedor: string;
  titulo: string | null;
  descricao: string | null;
  status: ComprasPedidoStatus;
  itens: number;
  valor_total: number | null;
  previsao: string | null;
  observacao: string | null;
  ordem: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ComprasComentario {
  id: string;
  pedido_id: string;
  user_id: string | null;
  conteudo: string;
  created_at: string;
}

export interface ComprasAnexo {
  id: string;
  pedido_id: string;
  user_id: string | null;
  file_name: string;
  file_path: string;
  mime_type: string | null;
  size_bytes: number | null;
  created_at: string;
}

const PEDIDOS_KEY = ['compras', 'kanban', 'pedidos'] as const;

/** Assina alterações em tempo real de uma tabela e invalida as queries relacionadas. */
function useRealtimeInvalidate(table: string, keys: unknown[][]) {
  const qc = useQueryClient();
  useEffect(() => {
    const channel = supabase
      .channel(`rt-${table}`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, () => {
        keys.forEach((k) => qc.invalidateQueries({ queryKey: k }));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, qc]);
}

export function useComprasKanbanPedidos() {
  useRealtimeInvalidate('compras_pedidos', [[...PEDIDOS_KEY]]);

  return useQuery<ComprasPedidoCard[]>({
    queryKey: [...PEDIDOS_KEY],
    staleTime: 15_000,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('compras_pedidos')
        .select('*')
        .order('ordem', { ascending: true })
        .order('created_at', { ascending: false })
        .limit(1000);
      if (error) throw error;
      return (data ?? []) as ComprasPedidoCard[];
    },
  });
}

export interface PedidoPatch {
  titulo?: string | null;
  descricao?: string | null;
  status?: ComprasPedidoStatus;
  ordem?: number;
}

export function useUpdatePedido() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: PedidoPatch }) => {
      const { error } = await (supabase as any)
        .from('compras_pedidos')
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: [...PEDIDOS_KEY] });
      const prev = qc.getQueryData<ComprasPedidoCard[]>([...PEDIDOS_KEY]);
      qc.setQueryData<ComprasPedidoCard[]>([...PEDIDOS_KEY], (old) =>
        (old ?? []).map((p) => (p.id === id ? { ...p, ...patch } : p)),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData([...PEDIDOS_KEY], ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: [...PEDIDOS_KEY] });
      qc.invalidateQueries({ queryKey: ['compras', 'pedidos'] });
    },
  });
}

export interface NovaTarefaInput {
  titulo: string;
  fornecedor: string;
  numero?: string;
  descricao?: string;
  previsao?: string | null;
  status?: ComprasPedidoStatus;
}

/** Cria uma nova tarefa/pedido de acompanhamento no topo da coluna escolhida. */
export function useCreatePedido() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: NovaTarefaInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Sessão expirada. Faça login novamente.');

      const numero = input.numero?.trim()
        || `TSK-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 9000 + 1000)}`;

      const { data, error } = await (supabase as any)
        .from('compras_pedidos')
        .insert({
          numero,
          fornecedor: input.fornecedor.trim() || '—',
          titulo: input.titulo.trim(),
          descricao: input.descricao?.trim() || null,
          previsao: input.previsao || null,
          status: input.status ?? 'pendente',
          ordem: -Date.now() / 1000,
          created_by: user.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data as ComprasPedidoCard;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...PEDIDOS_KEY] });
      qc.invalidateQueries({ queryKey: ['compras', 'pedidos'] });
    },
  });
}



/* ------------------------------- Comentários ------------------------------ */

export function useComentarios(pedidoId: string | null) {
  useRealtimeInvalidate('compras_pedido_comentarios', [['compras', 'comentarios']]);

  return useQuery<ComprasComentario[]>({
    queryKey: ['compras', 'comentarios', pedidoId],
    enabled: !!pedidoId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('compras_pedido_comentarios')
        .select('*')
        .eq('pedido_id', pedidoId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as ComprasComentario[];
    },
  });
}

export function useAddComentario(pedidoId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (conteudo: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Sessão expirada. Faça login novamente.');
      const { error } = await (supabase as any)
        .from('compras_pedido_comentarios')
        .insert({ pedido_id: pedidoId, conteudo, user_id: user.id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['compras', 'comentarios', pedidoId] }),
  });
}

export function useDeleteComentario(pedidoId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('compras_pedido_comentarios').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['compras', 'comentarios', pedidoId] }),
  });
}

/* --------------------------------- Anexos -------------------------------- */

const BUCKET = 'compras-anexos';

export function useAnexos(pedidoId: string | null) {
  useRealtimeInvalidate('compras_pedido_anexos', [['compras', 'anexos']]);

  return useQuery<ComprasAnexo[]>({
    queryKey: ['compras', 'anexos', pedidoId],
    enabled: !!pedidoId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('compras_pedido_anexos')
        .select('*')
        .eq('pedido_id', pedidoId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as ComprasAnexo[];
    },
  });
}

export function useUploadAnexo(pedidoId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Sessão expirada. Faça login novamente.');
      const safeName = file.name.replace(/[^\w.\-]+/g, '_');
      const path = `${pedidoId}/${crypto.randomUUID()}-${safeName}`;
      const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file);
      if (upErr) throw upErr;
      const { error } = await (supabase as any).from('compras_pedido_anexos').insert({
        pedido_id: pedidoId,
        user_id: user.id,
        file_name: file.name,
        file_path: path,
        mime_type: file.type || null,
        size_bytes: file.size,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['compras', 'anexos', pedidoId] }),
  });
}

export function useDeleteAnexo(pedidoId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (anexo: ComprasAnexo) => {
      await supabase.storage.from(BUCKET).remove([anexo.file_path]);
      const { error } = await (supabase as any)
        .from('compras_pedido_anexos').delete().eq('id', anexo.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['compras', 'anexos', pedidoId] }),
  });
}

export async function baixarAnexo(anexo: ComprasAnexo) {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(anexo.file_path, 60);
  if (error) throw error;
  window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
}

/* -------------------------------- Perfis --------------------------------- */

export function useProfilesMap(ids: (string | null | undefined)[]) {
  const unique = useMemo(
    () => Array.from(new Set(ids.filter((v): v is string => !!v))).sort(),
    [ids],
  );

  const { data } = useQuery<Record<string, string>>({
    queryKey: ['compras', 'profiles', unique.join(',')],
    enabled: unique.length > 0,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('profiles')
        .select('id, display_name')
        .in('id', unique);
      if (error) throw error;
      const map: Record<string, string> = {};
      (data ?? []).forEach((p: any) => { map[p.id] = p.display_name || 'Usuário'; });
      return map;
    },
  });

  return data ?? {};
}
