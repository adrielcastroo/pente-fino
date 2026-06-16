import { supabase } from '@/integrations/supabase/client';
import { normalizarCodigo, extractCodigoFornecedor, codigoBate } from '@/lib/codigoFornecedor';
import { buildAuditPayload } from '@/lib/audit';

export interface ItemCadastro {
  id: string;
  codigo_interno: string;
  descricao: string;
  /** Primeiro código do array — mantido por compatibilidade. */
  codigo_fornecedor: string | null;
  codigo_fornecedor_normalizado: string | null;
  /** Lista completa de códigos de fornecedor (1+). */
  codigos_fornecedor: string[];
  codigos_fornecedor_normalizado: string[];
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
  /** Aceita lista de códigos de fornecedor; pode vir vazio. */
  codigos_fornecedor: string[];
}

function normalizeList(values: string[]): { codigos: string[]; normalizados: string[] } {
  const seenNorm = new Set<string>();
  const codigos: string[] = [];
  const normalizados: string[] = [];
  for (const raw of values || []) {
    const v = (raw || '').trim();
    if (!v) continue;
    const norm = normalizarCodigo(v);
    if (!norm || seenNorm.has(norm)) continue;
    seenNorm.add(norm);
    codigos.push(v);
    normalizados.push(norm);
  }
  return { codigos, normalizados };
}

function prepare(input: ItemCadastroInput) {
  const { codigos, normalizados } = normalizeList(input.codigos_fornecedor || []);
  return {
    codigo_interno: input.codigo_interno.trim(),
    descricao: input.descricao.trim(),
    codigos_fornecedor: codigos,
    codigos_fornecedor_normalizado: normalizados,
    // singular mantido em sincronia com array[0] por compatibilidade
    codigo_fornecedor: codigos[0] || null,
    codigo_fornecedor_normalizado: normalizados[0] || null,
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
   * Procura um item cujo array de códigos de fornecedor casa com o valor bipado.
   * Estratégia:
   *  1. Match exato no array normalizado (contains)
   *  2. Match parcial (overlap) — varre poucas linhas e compara via codigoBate
   *  3. Fallback: extrai código embutido na descrição cadastrada e compara
   */
  async findByCodigoFornecedor(codigoBipado: string): Promise<ItemCadastro | null> {
    const norm = normalizarCodigo(codigoBipado);
    if (!norm || norm.length < 3) return null;

    // 1. exato (array contém o normalizado)
    {
      const { data, error } = await supabase
        .from('itens_cadastro')
        .select('*')
        .contains('codigos_fornecedor_normalizado', [norm])
        .limit(1)
        .maybeSingle();
      if (error && (error as any).code !== 'PGRST116') throw error;
      if (data) return data as ItemCadastro;
    }

    // 2. parcial (algum elemento do array contém / é contido)
    {
      const { data, error } = await supabase
        .from('itens_cadastro')
        .select('*')
        .not('codigos_fornecedor_normalizado', 'eq', '{}')
        .limit(500);
      if (error) throw error;
      const match = (data || []).find((d: any) => {
        const arr: string[] = d.codigos_fornecedor || [];
        return arr.some((c) => codigoBate(codigoBipado, c));
      });
      if (match) return match as ItemCadastro;
    }

    // 3. fallback: olhar dentro da descrição cadastrada (itens sem fornecedor)
    {
      const { data, error } = await supabase
        .from('itens_cadastro')
        .select('*')
        .or('codigos_fornecedor.eq.{}')
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
    // Mescla linhas duplicadas por codigo_interno (acumula códigos de fornecedor)
    const map = new Map<string, ItemCadastroInput>();
    for (const it of inputs) {
      const key = (it.codigo_interno || '').trim();
      if (!key) continue;
      const cur = map.get(key);
      if (!cur) {
        map.set(key, { ...it, codigos_fornecedor: [...(it.codigos_fornecedor || [])] });
      } else {
        cur.descricao = cur.descricao || it.descricao;
        cur.codigos_fornecedor = [...(cur.codigos_fornecedor || []), ...(it.codigos_fornecedor || [])];
      }
    }
    const payload = Array.from(map.values()).map(prepare);
    const { error, count } = await supabase
      .from('itens_cadastro')
      .upsert(payload, { onConflict: 'codigo_interno', count: 'exact' });
    if (error) throw error;
    return { count: count ?? payload.length };
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('itens_cadastro').delete().eq('id', id);
    if (error) throw error;
  },
};
