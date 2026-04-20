import { supabase } from '@/integrations/supabase/client';

export interface LoteMestre {
  id: string;
  nome: string;
  cor_hex: string;
  descricao: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export const lotesMestresService = {
  async list(): Promise<LoteMestre[]> {
    const { data, error } = await supabase
      .from('lotes_mestres' as any)
      .select('*')
      .order('nome', { ascending: true });
    if (error) throw error;
    return (data as unknown as LoteMestre[]) || [];
  },

  async create(input: { nome: string; cor_hex: string; descricao?: string }): Promise<LoteMestre> {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('lotes_mestres' as any)
      .insert({
        nome: input.nome.trim(),
        cor_hex: input.cor_hex,
        descricao: input.descricao?.trim() || null,
        created_by: userId,
      } as any)
      .select()
      .single();
    if (error) throw error;
    return data as unknown as LoteMestre;
  },

  async update(id: string, patch: Partial<Pick<LoteMestre, 'nome' | 'cor_hex' | 'descricao'>>): Promise<void> {
    const { error } = await supabase
      .from('lotes_mestres' as any)
      .update(patch as any)
      .eq('id', id);
    if (error) throw error;
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase
      .from('lotes_mestres' as any)
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async uploadAvariaPhoto(file: File | Blob, ext = 'jpg'): Promise<string> {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) throw new Error('Usuário não autenticado');

    const path = `${userId}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from('madeira-avarias').upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file instanceof File ? file.type : `image/${ext}`,
    });
    if (error) throw error;

    const { data: signed, error: signErr } = await supabase
      .storage
      .from('madeira-avarias')
      .createSignedUrl(path, 60 * 60 * 24 * 365);
    if (signErr) throw signErr;
    return signed.signedUrl;
  },
};
