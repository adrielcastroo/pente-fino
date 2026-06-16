import { supabase } from '@/integrations/supabase/client';
import { normalizarCodigo } from '@/lib/codigoFornecedor';

export interface ItemCadastro {
  id: string;
  codigo_interno: string;
  descricao: string;
  codigo_fornecedor: string;
  codigo_fornecedor_normalizado: string;
  created_at: string;
  updated_at: string;
}

export interface ItemCadastroInput {
  codigo_interno: string;
  descricao: string;
  codigo_fornecedor: string;
}

function prepare(input: ItemCadastroInput) {
  return {
    codigo_interno: input.codigo_interno.trim(),
    descricao: input.descricao.trim(),
    codigo_fornecedor: input.codigo_fornecedor.trim(),
    codigo_fornecedor_normalizado: normalizarCodigo(input.codigo_fornecedor),
  };
}

export const itensCadastroService = {
  async list(): Promise<ItemCadastro[]> {
    const { data, error } = await supabase
      .from('itens_cadastro')
      .select('*')
      .order('codigo_interno', { ascending: true });
    if (error) throw error;
    return (data || []) as ItemCadastro[];
  },

  async findByCodigoInterno(codigo: string): Promise<ItemCadastro | null> {
    const { data, error } = await supabase
      .from('itens_cadastro')
      .select('*')
      .eq('codigo_interno', codigo.trim())
      .maybeSingle();
    if (error) throw error;
    return (data as ItemCadastro) || null;
  },

  async upsert(input: ItemCadastroInput): Promise<ItemCadastro> {
    const payload = prepare(input);
    const { data, error } = await supabase
      .from('itens_cadastro')
      .upsert(payload, { onConflict: 'codigo_interno' })
      .select()
      .single();
    if (error) throw error;
    return data as ItemCadastro;
  },

  async bulkUpsert(inputs: ItemCadastroInput[]): Promise<{ count: number }> {
    if (!inputs.length) return { count: 0 };
    const payload = inputs.map(prepare);
    const { error, count } = await supabase
      .from('itens_cadastro')
      .upsert(payload, { onConflict: 'codigo_interno', count: 'exact' });
    if (error) throw error;
    return { count: count ?? inputs.length };
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('itens_cadastro').delete().eq('id', id);
    if (error) throw error;
  },
};
