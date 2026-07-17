import { supabase } from '@/integrations/supabase/client';
import { Conference } from '@/types';
import { ensureAuthenticatedSession, isSessionExpiredError, SessionExpiredError } from './authGuard';

export const conferenceService = {
  async insertConference(processo: string, conferente: string, startedAt: string, finishedAt: string) {
    // Visitantes podem arquivar conferências; usuários logados mantêm o vínculo via created_by
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id ?? null;

    const { data, error } = await supabase
      .from('conferences')
      .insert({
        processo: processo.trim(),
        conferente: conferente,
        started_at: startedAt,
        finished_at: finishedAt,
        created_by: userId,
      } as any)
      .select().single();

    if (error) {
      if (isSessionExpiredError(error)) throw new SessionExpiredError();
      throw error;
    }
    return data;
  },

  async fetchHistory(): Promise<Conference[]> {
    // Paginate to avoid Supabase's default 1000-row limit on conferences.
    // Each page is bounded by a hard timeout to prevent infinite spinners
    // when the backend is momentarily saturated.
    const allConfs: any[] = [];
    const PAGE_SIZE = 500;
    const PAGE_TIMEOUT_MS = 15000;
    let from = 0;
    let hasMore = true;

    const fetchPage = async (offset: number) => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), PAGE_TIMEOUT_MS);
      try {
        const { data, error } = await supabase
          .from('conferences')
          .select('*, registros (*)')
          .order('created_at', { ascending: false })
          .order('created_at', { foreignTable: 'registros', ascending: true })
          .range(offset, offset + PAGE_SIZE - 1)
          .abortSignal(controller.signal);
        if (error) throw error;
        return data || [];
      } finally {
        clearTimeout(timer);
      }
    };

    while (hasMore) {
      let confs: any[] = [];
      try {
        confs = await fetchPage(from);
      } catch (e: any) {
        // On timeout/abort, retry once before surfacing the error
        if (e?.name === 'AbortError' || /aborted|timeout/i.test(e?.message || '')) {
          confs = await fetchPage(from);
        } else {
          throw e;
        }
      }

      if (confs.length > 0) {
        allConfs.push(...confs);
        from += PAGE_SIZE;
        hasMore = confs.length === PAGE_SIZE;
      } else {
        hasMore = false;
      }
    }
    
    const confs = allConfs;
    if (!confs.length) return [];
    
    // Pre-allocate result array
    const result: Conference[] = new Array(confs.length);
    
    for (let ci = 0, cLen = confs.length; ci < cLen; ci++) {
      const c = confs[ci];
      const rawRegs = (c as any).registros || [];
      const processo = c.processo;
      // Registros already sorted by Supabase ORDER BY - skip redundant JS sort
      const regs = new Array(rawRegs.length);
      
      for (let ri = 0, rLen = rawRegs.length; ri < rLen; ri++) {
        const r = rawRegs[ri];
        regs[ri] = {
          id: r.id,
          item: r.item,
          processo: (r.modo_origem === 'diversos' && r.tipo_tecido !== 'Celular') ? '' : processo,
          nf: r.nf || '',
          endereco: r.endereco,
          m2: Number(r.m2),
          mLinear: Number(r.m_linear),
          largura: Number(r.largura),
          lote: r.lote,
          loteSistema: r.lote_sistema,
          conference_id: r.conference_id,
          tipoTecido: r.tipo_tecido,
          modoOrigem: r.modo_origem,
          wasEdited: r.was_edited,
          editedBy: r.edited_by,
          editedAt: r.edited_at,
          quantidade: r.quantidade ?? undefined,
        };
      }
      
      result[ci] = {
        id: c.id,
        name: processo,
        processo,
        conferente: c.conferente,
        date: c.created_at,
        startedAt: (c as any).started_at || null,
        finishedAt: (c as any).finished_at || null,
        registros: regs,
      };
    }
    
    return result;
  },

  async deleteConference(id: string) {
    try {
      // Supabase doesn't support cascading deletes easily from the client without RLS/Trigger support
      // So we delete children first
      const { error: regError } = await supabase.from('registros').delete().eq('conference_id', id);
      if (regError) throw regError;
      
      const { error: confError } = await supabase.from('conferences').delete().eq('id', id);
      if (confError) throw confError;
    } catch (e) {
      console.error('Error in deleteConference:', e);
      throw e;
    }
  },

  async clearAllHistory() {
    try {
      // To clear everything efficiently, we can use a range or just match all non-null
      const { error: regError } = await supabase.from('registros').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (regError) throw regError;
      
      const { error: confError } = await supabase.from('conferences').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (confError) throw confError;
    } catch (e) {
      console.error('Error in clearAllHistory:', e);
      throw e;
    }
  }
};