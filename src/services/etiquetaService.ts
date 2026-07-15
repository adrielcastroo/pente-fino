/**
 * Service de Etiquetas — CRUD + render ZPL + histórico.
 */
import { supabase } from '@/integrations/supabase/client';
import type {
  CreateEtiquetaTemplateInput,
  EtiquetaHistorico,
  EtiquetaTemplate,
  ImprimirInput,
  VariavelTemplate,
} from '@/types/etiquetas';

class ServiceError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = 'ServiceError';
  }
}

interface DbTemplateRow {
  id: string;
  nome: string;
  categoria: string;
  dimensoes: unknown;
  zpl: string;
  variaveis: unknown;
  criado_por: string | null;
  criado_em: string;
  atualizado_em: string;
  versao: number;
  ativo: boolean;
}

interface DbHistoricoRow {
  id: string;
  template_id: string | null;
  template_nome: string;
  variaveis_usadas: unknown;
  quantidade: number;
  impressora: string | null;
  usuario_id: string | null;
  usuario_nome: string | null;
  criado_em: string;
}

function mapTemplate(row: DbTemplateRow): EtiquetaTemplate {
  const dims = (row.dimensoes ?? {}) as { largura?: number; altura?: number };
  return {
    id: row.id,
    nome: row.nome,
    categoria: row.categoria as EtiquetaTemplate['categoria'],
    dimensoes: { largura: dims.largura ?? 100, altura: dims.altura ?? 150 },
    zpl: row.zpl,
    variaveis: (Array.isArray(row.variaveis) ? row.variaveis : []) as VariavelTemplate[],
    criado_por: row.criado_por,
    criado_em: row.criado_em,
    atualizado_em: row.atualizado_em,
    versao: row.versao,
    ativo: row.ativo,
  };
}

function mapHistorico(row: DbHistoricoRow): EtiquetaHistorico {
  return {
    id: row.id,
    template_id: row.template_id,
    template_nome: row.template_nome,
    variaveis_usadas: (row.variaveis_usadas ?? {}) as Record<string, string>,
    quantidade: row.quantidade,
    impressora: row.impressora,
    usuario_id: row.usuario_id,
    usuario_nome: row.usuario_nome,
    criado_em: row.criado_em,
  };
}

export const etiquetaService = {
  async list(filtro?: { categoria?: string }): Promise<EtiquetaTemplate[]> {
    let query = supabase
      .from('etiqueta_templates')
      .select('*')
      .eq('ativo', true)
      .order('atualizado_em', { ascending: false });
    if (filtro?.categoria && filtro.categoria !== 'todas') {
      query = query.eq('categoria', filtro.categoria);
    }
    const { data, error } = await query;
    if (error) throw new ServiceError('LIST_FAILED', error.message);
    return (data ?? []).map((r) => mapTemplate(r as DbTemplateRow));
  },

  async getById(id: string): Promise<EtiquetaTemplate | null> {
    const { data, error } = await supabase.from('etiqueta_templates').select('*').eq('id', id).maybeSingle();
    if (error) throw new ServiceError('GET_FAILED', error.message);
    return data ? mapTemplate(data as DbTemplateRow) : null;
  },

  async create(input: CreateEtiquetaTemplateInput): Promise<EtiquetaTemplate> {
    const { data: userRes } = await supabase.auth.getUser();
    const payload = {
      nome: input.nome,
      categoria: input.categoria,
      dimensoes: input.dimensoes as unknown as Record<string, number>,
      zpl: input.zpl,
      variaveis: input.variaveis as unknown as Record<string, unknown>[],
      criado_por: userRes.user?.id ?? null,
    };
    const { data, error } = await supabase.from('etiqueta_templates').insert(payload as never).select().single();
    if (error) throw new ServiceError('CREATE_FAILED', error.message);
    return mapTemplate(data as DbTemplateRow);
  },

  async update(id: string, input: Partial<CreateEtiquetaTemplateInput>): Promise<EtiquetaTemplate> {
    const patch: Record<string, unknown> = {};
    if (input.nome !== undefined) patch.nome = input.nome;
    if (input.categoria !== undefined) patch.categoria = input.categoria;
    if (input.dimensoes !== undefined) patch.dimensoes = input.dimensoes;
    if (input.zpl !== undefined) patch.zpl = input.zpl;
    if (input.variaveis !== undefined) patch.variaveis = input.variaveis;
    const { data, error } = await supabase.from('etiqueta_templates').update(patch as never).eq('id', id).select().single();
    if (error) throw new ServiceError('UPDATE_FAILED', error.message);
    return mapTemplate(data as DbTemplateRow);
  },

  async duplicate(id: string): Promise<EtiquetaTemplate> {
    const original = await this.getById(id);
    if (!original) throw new ServiceError('NOT_FOUND', 'Template não encontrado');
    return this.create({
      nome: `${original.nome} (cópia)`,
      categoria: original.categoria,
      dimensoes: original.dimensoes,
      zpl: original.zpl,
      variaveis: original.variaveis,
    });
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('etiqueta_templates').update({ ativo: false }).eq('id', id);
    if (error) throw new ServiceError('DELETE_FAILED', error.message);
  },

  /** Substitui {{variavel}} no ZPL pelos valores. `{{hoje}}` vira data atual. */
  renderZPL(zpl: string, variaveis: Record<string, string>): string {
    const hoje = new Date().toLocaleDateString('pt-BR');
    return zpl.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key: string) => {
      if (key === 'hoje' || key === 'data') return hoje;
      const matchedKey = Object.keys(variaveis).find((k) => k.toLowerCase() === key.toLowerCase());
      const v = matchedKey ? variaveis[matchedKey] : undefined;
      if (v === undefined || v === '') return '';
      return v;
    });
  },

  async getHistorico(filtro?: { templateId?: string; usuarioId?: string; limite?: number }): Promise<EtiquetaHistorico[]> {
    let query = supabase
      .from('etiqueta_historico')
      .select('*')
      .order('criado_em', { ascending: false })
      .limit(filtro?.limite ?? 100);
    if (filtro?.templateId) query = query.eq('template_id', filtro.templateId);
    if (filtro?.usuarioId) query = query.eq('usuario_id', filtro.usuarioId);
    const { data, error } = await query;
    if (error) throw new ServiceError('HISTORICO_FAILED', error.message);
    return (data ?? []).map((r) => mapHistorico(r as DbHistoricoRow));
  },

  async registrarImpressao(input: ImprimirInput & { template_nome: string }): Promise<EtiquetaHistorico> {
    const { data: userRes } = await supabase.auth.getUser();
    const user = userRes.user;
    const nome = (user?.user_metadata as { full_name?: string; display_name?: string } | null)?.full_name
      ?? (user?.user_metadata as { display_name?: string } | null)?.display_name
      ?? user?.email
      ?? null;
    const payload = {
      template_id: input.templateId,
      template_nome: input.template_nome,
      variaveis_usadas: input.variaveis,
      quantidade: input.quantidade,
      impressora: input.impressora ?? null,
      usuario_id: user?.id ?? null,
      usuario_nome: nome,
    };
    const { data, error } = await supabase.from('etiqueta_historico').insert(payload as never).select().single();
    if (error) throw new ServiceError('REGISTRAR_FAILED', error.message);
    return mapHistorico(data as DbHistoricoRow);
  },

  /** Remove todas as entradas do histórico de impressão (requer supervisor+). */
  async limparHistorico(): Promise<void> {
    const { error } = await supabase
      .from('etiqueta_historico')
      .delete()
      .not('id', 'is', null);
    if (error) throw new ServiceError('CLEAR_HISTORICO_FAILED', error.message);
  },
};

export { ServiceError };
