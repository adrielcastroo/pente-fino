/**
 * Histórico compartilhado de ações feitas nas TAGs Custom (aba "Gerar TAG").
 *
 * Persistido em `public.auge_tag_custom_historico` — visível para toda a equipe,
 * com atualização em tempo real. Diferente do bloco "Últimos registros" (local,
 * apenas os 10 últimos lançamentos do próprio operador), este log mantém TODAS
 * as ações e edições, agrupadas por TAG Custom, e alimenta a aba "Histórico".
 */

import { supabase } from '@/integrations/supabase/client';

export type TagEventoTipo = 'criacao' | 'edicao' | 'relancamento' | 'reversao';

export interface TagHistoricoLinha {
  /** Rótulo curto exibido na composição (ex.: "C1"). */
  code?: string | null;
  /** Valor da TAG Configurada. */
  valor: string;
  /** TAG Calculada vinculada, quando houver. */
  calculada?: string | null;
  /** Fórmula da TAG Calculada, quando conhecida. */
  formula?: string | null;
}

export interface TagHistoricoEvento {
  id: string;
  /** ISO timestamp da ação. */
  em: string;
  ok: boolean;
  tipo: TagEventoTipo;
  /** Nome/descrição da TAG Custom — chave de agrupamento. */
  descricao: string;
  cdConfiguracao: string | null;
  nmConfiguracao: string | null;
  linhas: TagHistoricoLinha[];
  gravadas?: number | null;
  total?: number | null;
  erro?: string | null;
  /** Autor da ação (compartilhado entre a equipe). */
  usuarioId?: string | null;
  usuarioNome?: string | null;
}

export interface TagHistoricoGrupo {
  /** Chave normalizada da TAG Custom. */
  chave: string;
  descricao: string;
  cdConfiguracao: string | null;
  nmConfiguracao: string | null;
  /** Eventos do mais recente para o mais antigo. */
  eventos: TagHistoricoEvento[];
  ultimoEm: string;
  totalEventos: number;
  erros: number;
  /** Nomes dos autores que agiram sobre esta TAG. */
  autores: string[];
}

const TABELA = 'auge_tag_custom_historico';
const MAX_EVENTOS = 2000;

export const TAG_EVENTO_LABEL: Record<TagEventoTipo, string> = {
  criacao: 'Gravação',
  edicao: 'Edição das TAGs calculadas',
  relancamento: 'Relançamento',
  reversao: 'Reversão para estado anterior',
};

/** Chave estável de agrupamento por TAG Custom (nome + configuração). */
export function chaveTagCustom(descricao: string, cdConfiguracao: string | null): string {
  const nome = (descricao ?? '').trim().toLowerCase();
  return `${cdConfiguracao ?? ''}::${nome}`;
}

function mapear(row: any): TagHistoricoEvento {
  return {
    id: String(row.id),
    em: row.created_at,
    ok: row.ok !== false,
    tipo: (row.tipo ?? 'criacao') as TagEventoTipo,
    descricao: row.descricao ?? '—',
    cdConfiguracao: row.cd_configuracao ?? null,
    nmConfiguracao: row.nm_configuracao ?? null,
    linhas: Array.isArray(row.linhas) ? (row.linhas as TagHistoricoLinha[]) : [],
    gravadas: row.gravadas ?? null,
    total: row.total ?? null,
    erro: row.erro ?? null,
    usuarioId: row.user_id ?? null,
    usuarioNome: row.user_nome ?? null,
  };
}

/** Lê o histórico compartilhado (mais recentes primeiro). */
export async function lerEventosTag(): Promise<TagHistoricoEvento[]> {
  const { data, error } = await (supabase as any)
    .from(TABELA)
    .select('*')
    .order('created_at', { ascending: false })
    .limit(MAX_EVENTOS);
  if (error) throw error;
  return (data ?? []).map(mapear);
}

/** Nome de exibição do usuário autenticado (best effort). */
async function resolverAutor(): Promise<{ id: string | null; nome: string | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { id: null, nome: null };
    const metaNome = (user.user_metadata?.display_name as string) || null;
    if (metaNome) return { id: user.id, nome: metaNome };
    const { data: perfil } = await (supabase as any)
      .from('profiles').select('display_name').eq('id', user.id).maybeSingle();
    return { id: user.id, nome: perfil?.display_name || user.email?.split('@')[0] || null };
  } catch {
    return { id: null, nome: null };
  }
}

/**
 * Registra uma ação feita sobre uma TAG Custom.
 * Nunca lança: o histórico é conveniência e não pode bloquear a gravação no Auge.
 */
export async function registrarEventoTag(
  evento: Omit<TagHistoricoEvento, 'id' | 'em' | 'usuarioId' | 'usuarioNome'>,
): Promise<void> {
  try {
    const autor = await resolverAutor();
    if (!autor.id) return; // a política de escrita exige usuário autenticado
    const { error } = await (supabase as any).from(TABELA).insert({
      tipo: evento.tipo,
      ok: evento.ok,
      descricao: evento.descricao || '—',
      cd_configuracao: evento.cdConfiguracao,
      nm_configuracao: evento.nmConfiguracao,
      linhas: evento.linhas ?? [],
      gravadas: evento.gravadas ?? null,
      total: evento.total ?? null,
      erro: evento.erro ?? null,
      user_id: autor.id,
      user_nome: autor.nome,
    });
    if (error) console.warn('[tag-historico] falha ao registrar evento:', error.message);
  } catch (e) {
    console.warn('[tag-historico] falha ao registrar evento:', e);
  }
}

/** Remove todos os eventos de uma TAG Custom (respeita RLS: autor/gerente/admin). */
export async function removerGrupoTag(eventos: TagHistoricoEvento[]): Promise<number> {
  const ids = eventos.map((e) => e.id);
  if (ids.length === 0) return 0;
  const { error, count } = await (supabase as any)
    .from(TABELA).delete({ count: 'exact' }).in('id', ids);
  if (error) throw error;
  return count ?? 0;
}

/** Agrupa os eventos por TAG Custom, do mais recentemente alterado ao mais antigo. */
export function agruparEventosTag(eventos: TagHistoricoEvento[]): TagHistoricoGrupo[] {
  const mapa = new Map<string, TagHistoricoGrupo>();
  for (const ev of eventos) {
    const chave = chaveTagCustom(ev.descricao, ev.cdConfiguracao);
    const atual = mapa.get(chave);
    if (atual) {
      atual.eventos.push(ev);
      atual.totalEventos += 1;
      if (!ev.ok) atual.erros += 1;
      if (new Date(ev.em).getTime() > new Date(atual.ultimoEm).getTime()) atual.ultimoEm = ev.em;
      if (!atual.nmConfiguracao && ev.nmConfiguracao) atual.nmConfiguracao = ev.nmConfiguracao;
      if (ev.usuarioNome && !atual.autores.includes(ev.usuarioNome)) atual.autores.push(ev.usuarioNome);
    } else {
      mapa.set(chave, {
        chave,
        descricao: ev.descricao || '—',
        cdConfiguracao: ev.cdConfiguracao,
        nmConfiguracao: ev.nmConfiguracao,
        eventos: [ev],
        ultimoEm: ev.em,
        totalEventos: 1,
        erros: ev.ok ? 0 : 1,
        autores: ev.usuarioNome ? [ev.usuarioNome] : [],
      });
    }
  }
  const grupos = Array.from(mapa.values());
  for (const g of grupos) {
    g.eventos.sort((a, b) => new Date(b.em).getTime() - new Date(a.em).getTime());
  }
  grupos.sort((a, b) => new Date(b.ultimoEm).getTime() - new Date(a.ultimoEm).getTime());
  return grupos;
}

export function formatarDataTag(iso: string): string {
  try {
    return new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return iso;
  }
}
