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
  /** Unidade de medida do item (PC, MT, KG…). */
  unidade: string | null;
  /** Qtd padrão que vem no pacote do fornecedor (referência). */
  pacote_fornecedor: number | null;
  /** Qtd padrão que armazenamos internamente por pacote — divisor das etiquetas. */
  pacote_estocagem: number | null;
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
  unidade?: string | null;
  pacote_fornecedor?: number | null;
  pacote_estocagem?: number | null;
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
  const unidade = (input.unidade ?? '').toString().trim().toUpperCase() || null;
  const pacote_fornecedor =
    input.pacote_fornecedor != null && Number.isFinite(Number(input.pacote_fornecedor)) && Number(input.pacote_fornecedor) > 0
      ? Number(input.pacote_fornecedor)
      : null;
  const pacote_estocagem =
    input.pacote_estocagem != null && Number.isFinite(Number(input.pacote_estocagem)) && Number(input.pacote_estocagem) > 0
      ? Number(input.pacote_estocagem)
      : null;
  return {
    codigo_interno: input.codigo_interno.trim(),
    descricao: input.descricao.trim(),
    codigos_fornecedor: codigos,
    codigos_fornecedor_normalizado: normalizados,
    // singular mantido em sincronia com array[0] por compatibilidade
    codigo_fornecedor: codigos[0] || null,
    codigo_fornecedor_normalizado: normalizados[0] || null,
    unidade,
    pacote_fornecedor,
    pacote_estocagem,
  };
}

export const itensCadastroService = {
  async list(): Promise<ItemCadastro[]> {
    // Supabase caps queries em 1000 linhas por padrão. Paginamos para trazer
    // todos os itens cadastrados (o app tem >3k itens hoje).
    const pageSize = 1000;
    const all: ItemCadastro[] = [];
    let from = 0;
    // limite defensivo (1M) — evita loop infinito em caso de erro inesperado
    for (let guard = 0; guard < 1000; guard++) {
      const { data, error } = await supabase
        .from('itens_cadastro')
        .select('*')
        .order('codigo_interno', { ascending: true })
        .range(from, from + pageSize - 1);
      if (error) throw error;
      const batch = (data || []) as ItemCadastro[];
      all.push(...batch);
      if (batch.length < pageSize) break;
      from += pageSize;
    }
    return all;
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
   * Procura um item cujo array de códigos de fornecedor contém EXATAMENTE
   * o código bipado (após normalização). Match estrito — sem parcial, sem
   * fallback por descrição. Isso garante que "5969" nunca case com "12485969".
   */
  async findByCodigoFornecedor(codigoBipado: string): Promise<ItemCadastro | null> {
    const norm = normalizarCodigo(codigoBipado);
    if (!norm) return null;

    const { data, error } = await supabase
      .from('itens_cadastro')
      .select('*')
      .contains('codigos_fornecedor_normalizado', [norm])
      .limit(1)
      .maybeSingle();
    if (error && (error as any).code !== 'PGRST116') throw error;
    return (data as ItemCadastro) || null;
  },

  /**
   * Fallback: procura um item cadastrado cuja descrição bata (após normalização
   * simples de espaços/caixa) com o texto informado. Útil quando o campo `item`
   * de um registro já foi substituído pela descrição (backfill do trigger).
   */
  async findByDescricao(descricao: string): Promise<ItemCadastro | null> {
    const q = (descricao || '').trim();
    if (!q) return null;
    const { data, error } = await supabase
      .from('itens_cadastro')
      .select('*')
      .ilike('descricao', q)
      .limit(1)
      .maybeSingle();
    if (error && (error as any).code !== 'PGRST116') throw error;
    return (data as ItemCadastro) || null;
  },




  async upsert(input: ItemCadastroInput, opts?: { changedField?: string | null; isEdit?: boolean }): Promise<ItemCadastro> {
    const base = prepare(input);

    // Anti-duplicidade: se algum código de fornecedor já pertence a OUTRO
    // código interno, aborta com mensagem clara em vez de criar cadastro
    // conflitante. (O onConflict abaixo cobre duplicidade por codigo_interno.)
    if (base.codigos_fornecedor_normalizado.length) {
      const { data: conflitos, error: conflErr } = await supabase
        .from('itens_cadastro')
        .select('codigo_interno, codigos_fornecedor_normalizado')
        .overlaps('codigos_fornecedor_normalizado', base.codigos_fornecedor_normalizado);
      if (conflErr) throw conflErr;
      const outros = (conflitos || []).filter((c: any) => c.codigo_interno !== base.codigo_interno);
      if (outros.length) {
        const doGrupo = new Set(base.codigos_fornecedor_normalizado);
        const detalhe = outros
          .map((c: any) => {
            const dup = (c.codigos_fornecedor_normalizado || []).filter((n: string) => doGrupo.has(n));
            return `${c.codigo_interno} (${dup.join(', ')})`;
          })
          .join('; ');
        throw new Error(`Código de fornecedor já cadastrado em outro item: ${detalhe}`);
      }
    }

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
    fornecedorUpdated: number;
    descChanges: Array<{ codigo_interno: string; oldDesc: string; newDesc: string }>;
    /** Códigos de fornecedor que já pertencem a OUTRO codigo_interno — foram ignorados. */
    fornecedorConflicts: Array<{ codigo_interno: string; codigo_fornecedor: string; conflita_com: string }>;
  }> {
    if (!inputs.length) {
      return { count: 0, inserted: 0, skipped: 0, duplicatesInFile: 0, fornecedorUpdated: 0, descChanges: [], fornecedorConflicts: [] };
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

    // Detecta códigos de fornecedor que já pertencem a OUTRO codigo_interno
    // — evita "roubar" códigos de itens já cadastrados. Esses itens são
    // ignorados e reportados no retorno para revisão manual.
    const fornecedorConflicts: Array<{ codigo_interno: string; codigo_fornecedor: string; conflita_com: string }> = [];
    const preparedAll = toInsert.map((it) => ({ input: it, prep: prepare(it) }));
    const allNorms = Array.from(
      new Set(preparedAll.flatMap((p) => p.prep.codigos_fornecedor_normalizado)),
    );
    if (allNorms.length) {
      // Consulta em chunks para não estourar URL
      const donoDe = new Map<string, string>(); // norm -> codigo_interno dono
      const lookupChunk = 300;
      for (let i = 0; i < allNorms.length; i += lookupChunk) {
        const slice = allNorms.slice(i, i + lookupChunk);
        const { data, error } = await supabase
          .from('itens_cadastro')
          .select('codigo_interno, codigos_fornecedor_normalizado')
          .overlaps('codigos_fornecedor_normalizado', slice);
        if (error) throw new Error(`Falha ao verificar conflitos de código de fornecedor: ${error.message}`);
        for (const r of data || []) {
          for (const n of (r as any).codigos_fornecedor_normalizado || []) {
            if (slice.includes(n) && !donoDe.has(n)) donoDe.set(n, r.codigo_interno);
          }
        }
      }
      const semConflito: ItemCadastroInput[] = [];
      for (const { input, prep } of preparedAll) {
        let conflitou = false;
        for (let i = 0; i < prep.codigos_fornecedor_normalizado.length; i++) {
          const norm = prep.codigos_fornecedor_normalizado[i];
          const dono = donoDe.get(norm);
          if (dono && dono !== prep.codigo_interno) {
            fornecedorConflicts.push({
              codigo_interno: prep.codigo_interno,
              codigo_fornecedor: prep.codigos_fornecedor[i],
              conflita_com: dono,
            });
            conflitou = true;
          }
        }
        if (!conflitou) semConflito.push(input);
      }
      toInsert = semConflito;
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
    return { count: inserted, inserted, skipped, duplicatesInFile, fornecedorUpdated, descChanges, fornecedorConflicts };
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

  /**
   * Resolve um valor bipado/digitado para { codigoInterno, descricao } usando cadastro.
   * 1) tenta como código interno; 2) tenta como código de fornecedor; 3) fallback.
   * Garante que registros e etiquetas de TODOS os modos de conferência
   * (tecido manual/coulisse, IA, diversos, etiq. pronta, madeira, motor, controle)
   * gravem/imprimam o código interno em vez do código do fornecedor.
   */
  async resolveItemFromScan(
    bipado: string,
    fallbackDescricao = '',
  ): Promise<{ codigoInterno: string; descricao: string; resolved: boolean; source: 'interno' | 'fornecedor' | 'auge' | 'none' }> {
    const raw = (bipado || '').trim();
    if (!raw) return { codigoInterno: raw, descricao: fallbackDescricao, resolved: false, source: 'none' };
    try {
      const porInterno = await this.findByCodigoInterno(raw);
      if (porInterno) {
        return {
          codigoInterno: porInterno.codigo_interno,
          descricao: porInterno.descricao || fallbackDescricao,
          resolved: true,
          source: 'interno',
        };
      }
      const porFornecedor = await this.findByCodigoFornecedor(raw);
      if (porFornecedor) {
        return {
          codigoInterno: porFornecedor.codigo_interno,
          descricao: porFornecedor.descricao || fallbackDescricao,
          resolved: true,
          source: 'fornecedor',
        };
      }
      // Fallback: consulta o espelho do ERP Auge por código exato
      const { data: augeHit } = await supabase
        .from('auge_produtos')
        .select('codigo, descricao')
        .eq('codigo', raw)
        .limit(1)
        .maybeSingle();
      if (augeHit) {
        return {
          codigoInterno: augeHit.codigo,
          descricao: augeHit.descricao || fallbackDescricao,
          resolved: true,
          source: 'auge',
        };
      }
    } catch (e) {
      console.warn('resolveItemFromScan falhou:', e);
    }
    return { codigoInterno: raw, descricao: fallbackDescricao, resolved: false, source: 'none' };
  },

  /**
   * Consulta leve para o preview do formulário: retorna o vínculo do valor
   * bipado com o cadastro local (itens_cadastro) e/ou com o espelho do Auge
   * (auge_produtos). Não altera dados nem grava — apenas informa se o item
   * é conhecido, em qual base e a descrição correspondente.
   */
  async lookupVinculo(bipado: string): Promise<{
    codigoBipado: string;
    local: { codigoInterno: string; descricao: string; via: 'interno' | 'fornecedor' } | null;
    auge: { codigo: string; descricao: string | null } | null;
  }> {
    const raw = (bipado || '').trim();
    const empty = { codigoBipado: raw, local: null, auge: null };
    if (!raw) return empty;
    try {
      let local: { codigoInterno: string; descricao: string; via: 'interno' | 'fornecedor' } | null = null;
      const porInterno = await this.findByCodigoInterno(raw);
      if (porInterno) {
        local = { codigoInterno: porInterno.codigo_interno, descricao: porInterno.descricao || '', via: 'interno' };
      } else {
        const porFornecedor = await this.findByCodigoFornecedor(raw);
        if (porFornecedor) {
          local = { codigoInterno: porFornecedor.codigo_interno, descricao: porFornecedor.descricao || '', via: 'fornecedor' };
        }
      }

      // Auge: tenta pelo código bipado e, se achou local, também pelo código interno
      const codigosParaTentar = Array.from(new Set([raw, local?.codigoInterno].filter(Boolean) as string[]));
      let auge: { codigo: string; descricao: string | null } | null = null;
      for (const c of codigosParaTentar) {
        const { data } = await supabase
          .from('auge_produtos')
          .select('codigo, descricao')
          .eq('codigo', c)
          .limit(1)
          .maybeSingle();
        if (data) { auge = data; break; }
      }
      return { codigoBipado: raw, local, auge };
    } catch (e) {
      console.warn('lookupVinculo falhou:', e);
      return empty;
    }
  },

  /**
   * Carrega todo o cadastro e devolve uma função que resolve o "código interno"
   * a partir do valor gravado em `registros.item` — que pode ser código interno,
   * código de fornecedor OU a descrição (após backfill do trigger).
   * Retorna string vazia quando não conseguir resolver.
   */
  async buildCodigoInternoResolver(): Promise<(itemText: string) => string> {
    let itens: ItemCadastro[] = [];
    try {
      itens = await this.list();
    } catch (e) {
      console.warn('buildCodigoInternoResolver: falha ao carregar cadastros', e);
      return () => '';
    }
    const porInterno = new Map<string, string>();
    const porFornecedor = new Map<string, string>();
    const porDescricao = new Map<string, string>();
    for (const it of itens) {
      const codigo = (it.codigo_interno || '').trim();
      if (!codigo) continue;
      const nInt = normalizarCodigo(codigo);
      if (nInt) porInterno.set(nInt, codigo);
      for (const nf of it.codigos_fornecedor_normalizado || []) {
        if (nf) porFornecedor.set(nf, codigo);
      }
      const desc = (it.descricao || '').trim().toLowerCase();
      if (desc) porDescricao.set(desc, codigo);
    }
    return (itemText: string): string => {
      const raw = (itemText || '').trim();
      if (!raw) return '';
      const norm = normalizarCodigo(raw);
      if (norm) {
        const hitInt = porInterno.get(norm);
        if (hitInt) return hitInt;
        const hitFor = porFornecedor.get(norm);
        if (hitFor) return hitFor;
      }
      const hitDesc = porDescricao.get(raw.toLowerCase());
      if (hitDesc) return hitDesc;
      return '';
    };
  },
};
