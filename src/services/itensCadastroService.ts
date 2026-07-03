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

  async bulkUpsert(
    inputs: ItemCadastroInput[],
    opts?: {
      chunkSize?: number;
      timeoutMs?: number;
      onProgress?: (done: number, total: number) => void;
      signal?: AbortSignal;
      /** Se true (padrão), pula códigos internos já cadastrados e retorna diffs de descrição. */
      skipExisting?: boolean;
    },
  ): Promise<{
    count: number;
    inserted: number;
    skipped: number;
    duplicatesInFile: number;
    descChanges: Array<{ codigo_interno: string; oldDesc: string; newDesc: string }>;
  }> {
    if (!inputs.length) {
      return { count: 0, inserted: 0, skipped: 0, duplicatesInFile: 0, descChanges: [] };
    }
    // Mescla linhas duplicadas por codigo_interno (acumula códigos de fornecedor)
    const map = new Map<string, ItemCadastroInput>();
    let duplicatesInFile = 0;
    for (const it of inputs) {
      const key = (it.codigo_interno || '').trim();
      if (!key) continue;
      const cur = map.get(key);
      if (!cur) {
        map.set(key, { ...it, codigos_fornecedor: [...(it.codigos_fornecedor || [])] });
      } else {
        duplicatesInFile++;
        cur.descricao = cur.descricao || it.descricao;
        cur.codigos_fornecedor = [...(cur.codigos_fornecedor || []), ...(it.codigos_fornecedor || [])];
      }
    }

    const skipExisting = opts?.skipExisting !== false;
    const descChanges: Array<{ codigo_interno: string; oldDesc: string; newDesc: string }> = [];
    let skipped = 0;
    let fornecedorUpdated = 0;
    let toInsert = Array.from(map.values());

    if (skipExisting) {
      // Busca códigos internos existentes em lotes (evita URL gigante)
      const keys = toInsert.map((i) => i.codigo_interno.trim());
      type Existing = { descricao: string; codigos: string[]; normalizados: string[] };
      const existing = new Map<string, Existing>();
      const lookupChunk = 500;
      for (let i = 0; i < keys.length; i += lookupChunk) {
        const slice = keys.slice(i, i + lookupChunk);
        const { data, error } = await supabase
          .from('itens_cadastro')
          .select('codigo_interno, descricao, codigos_fornecedor, codigos_fornecedor_normalizado')
          .in('codigo_interno', slice);
        if (error) throw new Error(`Falha ao verificar cadastros existentes: ${error.message}`);
        for (const r of data || []) {
          existing.set(r.codigo_interno, {
            descricao: r.descricao || '',
            codigos: (r as any).codigos_fornecedor || [],
            normalizados: (r as any).codigos_fornecedor_normalizado || [],
          });
        }
      }

      const kept: ItemCadastroInput[] = [];
      // Itens já existentes que ganharam novos códigos de fornecedor → precisam update parcial
      const mergeFornecedor: Array<{ codigo_interno: string; codigos: string[]; normalizados: string[] }> = [];

      for (const it of toInsert) {
        const key = it.codigo_interno.trim();
        const old = existing.get(key);
        if (old) {
          skipped++;
          const newDesc = (it.descricao || '').trim();
          if (newDesc && newDesc !== (old.descricao || '').trim()) {
            descChanges.push({ codigo_interno: key, oldDesc: old.descricao, newDesc });
          }
          // Mescla codigos_fornecedor: adiciona somente os que ainda não existem
          const { codigos: novosCodigos, normalizados: novosNorm } = normalizeList(it.codigos_fornecedor || []);
          const oldNormSet = new Set(old.normalizados);
          const addCodigos: string[] = [];
          const addNorm: string[] = [];
          novosCodigos.forEach((c, idx) => {
            const n = novosNorm[idx];
            if (n && !oldNormSet.has(n)) {
              addCodigos.push(c);
              addNorm.push(n);
              oldNormSet.add(n);
            }
          });
          if (addCodigos.length) {
            mergeFornecedor.push({
              codigo_interno: key,
              codigos: [...old.codigos, ...addCodigos],
              normalizados: [...old.normalizados, ...addNorm],
            });
          }
        } else {
          kept.push(it);
        }
      }

      // Aplica updates de codigos_fornecedor um a um (rápido: só linhas alteradas)
      for (const m of mergeFornecedor) {
        const { error } = await supabase
          .from('itens_cadastro')
          .update({
            codigos_fornecedor: m.codigos,
            codigos_fornecedor_normalizado: m.normalizados,
            codigo_fornecedor: m.codigos[0] || null,
            codigo_fornecedor_normalizado: m.normalizados[0] || null,
          })
          .eq('codigo_interno', m.codigo_interno);
        if (error) throw new Error(`Falha ao atualizar códigos de fornecedor de ${m.codigo_interno}: ${error.message}`);
        fornecedorUpdated++;
      }

      toInsert = kept;
    }

    const payload = toInsert.map(prepare);
    const chunkSize = Math.max(1, opts?.chunkSize ?? 200);
    const timeoutMs = opts?.timeoutMs ?? 30_000;
    let inserted = 0;

    for (let i = 0; i < payload.length; i += chunkSize) {
      if (opts?.signal?.aborted) throw new Error('Importação cancelada pelo usuário.');
      const chunk = payload.slice(i, i + chunkSize);
      const chunkIndex = Math.floor(i / chunkSize) + 1;
      const totalChunks = Math.ceil(payload.length / chunkSize);

      const req = supabase
        .from('itens_cadastro')
        .upsert(chunk, { onConflict: 'codigo_interno', count: 'exact' });

      let timer: any;
      const timeout = new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error(`Timeout: lote ${chunkIndex}/${totalChunks} (${chunk.length} itens) não respondeu em ${Math.round(timeoutMs / 1000)}s.`)),
          timeoutMs,
        );
      });

      try {
        const { error, count } = (await Promise.race([req, timeout])) as any;
        clearTimeout(timer);
        if (error) {
          throw new Error(
            `Falha no lote ${chunkIndex}/${totalChunks} (itens ${i + 1}–${i + chunk.length}). ${error.message || ''}`.trim(),
          );
        }
        inserted += count ?? chunk.length;
        opts?.onProgress?.(Math.min(i + chunk.length, payload.length), payload.length);
      } catch (e) {
        clearTimeout(timer);
        throw e;
      }
    }
    return { count: inserted, inserted, skipped, duplicatesInFile, descChanges };
  },

  async bulkUpdateDescricoes(items: Array<{ codigo_interno: string; descricao: string }>): Promise<{ count: number }> {
    if (!items.length) return { count: 0 };
    let count = 0;
    for (const it of items) {
      const { error } = await supabase
        .from('itens_cadastro')
        .update({ descricao: it.descricao })
        .eq('codigo_interno', it.codigo_interno);
      if (error) throw new Error(`Falha ao atualizar ${it.codigo_interno}: ${error.message}`);
      count++;
    }
    return { count };
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('itens_cadastro').delete().eq('id', id);
    if (error) throw error;
  },
};
