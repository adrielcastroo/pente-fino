/**
 * Histórico persistente de ações feitas nas TAGs Custom (aba "Gerar TAG").
 *
 * Diferente do bloco "Últimos registros" (que guarda apenas os 10 lançamentos
 * mais recentes para reedição rápida), este log mantém TODAS as ações e edições
 * feitas, agrupadas por TAG Custom, e alimenta a aba "Histórico".
 *
 * Persistência em localStorage: é um recurso de conveniência do operador e
 * jamais pode bloquear ou quebrar o fluxo de gravação no Auge.
 */

export type TagEventoTipo = 'criacao' | 'edicao' | 'relancamento';

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
}

const STORAGE_KEY = 'gerar-tag:historico-eventos';
const MAX_EVENTOS = 500;
const UPDATE_EVENT = 'tag-historico:update';

export const TAG_EVENTO_LABEL: Record<TagEventoTipo, string> = {
  criacao: 'Gravação',
  edicao: 'Edição das TAGs calculadas',
  relancamento: 'Relançamento',
};

/** Chave estável de agrupamento por TAG Custom (nome + configuração). */
export function chaveTagCustom(descricao: string, cdConfiguracao: string | null): string {
  const nome = (descricao ?? '').trim().toLowerCase();
  return `${cdConfiguracao ?? ''}::${nome}`;
}

export function lerEventosTag(): TagHistoricoEvento[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return (parsed as TagHistoricoEvento[]).filter((e) => e && typeof e.em === 'string');
  } catch {
    return [];
  }
}

function gravar(eventos: TagHistoricoEvento[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(eventos.slice(0, MAX_EVENTOS)));
  } catch {
    /* quota cheia — histórico é conveniência, nunca bloqueia o fluxo */
  }
  try {
    window.dispatchEvent(new CustomEvent(UPDATE_EVENT));
  } catch {
    /* ambiente sem window (SSR/testes) */
  }
}

/** Registra uma ação feita sobre uma TAG Custom. */
export function registrarEventoTag(
  evento: Omit<TagHistoricoEvento, 'id' | 'em'> & { em?: string },
): void {
  const completo: TagHistoricoEvento = {
    ...evento,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    em: evento.em ?? new Date().toISOString(),
  };
  gravar([completo, ...lerEventosTag()]);
}

export function limparEventosTag(): void {
  gravar([]);
}

/** Remove todos os eventos de uma TAG Custom específica. */
export function removerGrupoTag(chave: string): void {
  gravar(lerEventosTag().filter((e) => chaveTagCustom(e.descricao, e.cdConfiguracao) !== chave));
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

/** Observa alterações no log (mesma aba e entre abas do navegador). */
export function observarEventosTag(cb: () => void): () => void {
  const onStorage = (e: StorageEvent) => {
    if (!e.key || e.key === STORAGE_KEY) cb();
  };
  window.addEventListener(UPDATE_EVENT, cb as EventListener);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(UPDATE_EVENT, cb as EventListener);
    window.removeEventListener('storage', onStorage);
  };
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
