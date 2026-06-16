import { supabase } from '@/integrations/supabase/client';
import { normalizarCodigo, extractCodigoFornecedor, codigoBate } from '@/lib/codigoFornecedor';
import { buildAuditPayload } from '@/lib/audit';

export interface ItemCadastro {
  id: string;
  codigo_interno: string;
  descricao: string;
  codigo_fornecedor: string | null;
  codigo_fornecedor_normalizado: string | null;
  created_at: string;
  updated_at: string;
  updated_by?: string | null;
  updated_by_name?: string | null;
  last_edited_field?: string | null;
  last_edited_at?: string | null;
}

export interface ItemCadastroInput {
  codigo_interno: string;
  descricao: string;
  codigo_fornecedor: string;
}

function prepare(input: ItemCadastroInput) {
  const forn = (input.codigo_fornecedor || '').trim();
  const normalized = normalizarCodigo(forn);
  return {
    codigo_interno: input.codigo_interno.trim(),
    descricao: input.descricao.trim(),
    codigo_fornecedor: forn || null,
    codigo_fornecedor_normalizado: normalized || null,
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

  /**
   * Procura um item cujo código de fornecedor casa com o valor bipado.
   * Estratégia:
   *  1. Match exato pelo normalizado
   *  2. Match parcial (ilike contém) no normalizado
   *  3. Fallback: extrai código embutido na descrição cadastrada e compara
   */
  async findByCodigoFornecedor(codigoBipado: string): Promise<ItemCadastro | null> {
    const norm = normalizarCodigo(codigoBipado);
    if (!norm || norm.length < 3) return null;

    // 1. exato
    {
      const { data, error } = await supabase
        .from('itens_cadastro')
        .select('*')
        .eq('codigo_fornecedor_normalizado', norm)
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (data) return data as ItemCadastro;
    }

    // 2. parcial (um contém o outro)
    {
      const { data, error } = await supabase
        .from('itens_cadastro')
        .select('*')
        .or(`codigo_fornecedor_normalizado.ilike.%${norm}%,codigo_fornecedor_normalizado.eq.${norm}`)
        .limit(5);
      if (error) throw error;
      const match = (data || []).find((d: any) =>
        codigoBate(codigoBipado, d.codigo_fornecedor) ||
        (d.codigo_fornecedor_normalizado && norm.includes(d.codigo_fornecedor_normalizado)),
      );
      if (match) return match as ItemCadastro;
    }

    // 3. fallback: olhar dentro da descrição cadastrada
    {
      const { data, error } = await supabase
        .from('itens_cadastro')
        .select('*')
        .or('codigo_fornecedor.is.null,codigo_fornecedor.eq.')
        .ilike('descricao', `%${codigoBipado.trim()}%`)
        .limit(5);
      if (error) throw error;
      const match = (data || []).find((d: any) => {
        const ext = extractCodigoFornecedor(d.descricao);
        return ext && codigoBate(codigoBipado, ext.codigo);
      });
      if (match) return match as ItemCadastro;
    }

    return null;
  },

  async upsert(input: ItemCadastroInput, opts?: { changedField?: string | null; isEdit?: boolean }): Promise<ItemCadastro> {
    const base = prepare(input);
    const payload: any = { ...base };
    if (opts?.isEdit) {
      const audit = await buildAuditPayload(opts.changedField ?? null);
      Object.assign(payload, audit);
    }
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
