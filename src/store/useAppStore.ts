import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';

export interface Registro {
  id: string;
  item: string;
  processo: string;
  endereco: string;
  m2: number;
  mLinear: number;
  largura: number;
  lote: string;
  loteSistema: string;
  isNew?: boolean;
  conference_id?: string | null;
  tipoTecido?: string;
  modoOrigem?: string;
  wasEdited?: boolean;
  editedBy?: string;
  editedAt?: string | null;
}

export interface Conference {
  id: string;
  name: string;
  processo: string;
  conferente: string;
  date: string;
  registros: Registro[];
}

interface UndoEntry {
  reg: Registro;
  idx: number;
}

interface AppState {
  registros: Registro[];
  undoStack: UndoEntry[];
  currentMode: 'manual' | 'openrouter' | 'diversos';
  processo: string;
  conferente: string;
  searchQuery: string;
  sortBy: string;
  history: Conference[];
  lockEndereco: boolean;
  lockedEndereco: string;

  setMode: (mode: 'manual' | 'openrouter') => void;
  setProcesso: (p: string) => void;
  setConferente: (c: string) => void;
  setSearchQuery: (q: string) => void;
  setSortBy: (s: string) => void;
  setLockEndereco: (lock: boolean) => void;
  setLockedEndereco: (e: string) => void;
  addRegistro: (reg: Registro) => void;
  deleteRegistro: (id: string) => void;
  undo: () => Registro | null;
  clearAll: () => void;
  loadFromStorage: () => void;
  archiveAndClear: (name: string) => Promise<void>;
  loadHistory: () => Promise<void>;
  deleteConference: (id: string) => Promise<void>;
  clearHistory: () => Promise<void>;
  updateHistoryRegistro: (conferenceId: string, registroId: string, updates: Partial<Registro>) => Promise<void>;
}

const STORAGE_KEY = 'cft4';

function fmtML(v: number): string {
  if (!v || v === 0) return '';
  return (v % 1 === 0 ? Math.round(v) : v.toFixed(1).replace('.', ',')) + 'M';
}

function save(registros: Registro[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(registros)); } catch {}
}

export function formatML(v: number): string {
  return fmtML(v);
}

/** Extract largura from item code: e.g. SRC-3003-05-30-EB2 → 30 → 3.00m */
export function extractLarguraFromItem(item: string): number {
  const parts = item.split('-');
  if (parts.length < 4) return 0;
  const raw = parts[3];
  const num = parseInt(raw, 10);
  if (isNaN(num) || num <= 0) return 0;
  if (num >= 100) return num / 100;
  return num / 10;
}

/** Generate Lote Sistema with serial for duplicates */
export function generateLoteSistema(processo: string, endereco: string, mLinear: number, existingRegistros: Registro[]): string {
  const mlFormatted = fmtML(mLinear) || '0M';
  const base = [endereco.trim(), processo.trim(), mlFormatted].filter(Boolean).join(' ');
  
  // Count existing registros with same base
  const count = existingRegistros.filter(r => {
    const rBase = [r.endereco?.trim() || '', r.processo?.trim() || '', fmtML(r.mLinear) || '0M'].filter(Boolean).join(' ');
    return rBase === base;
  }).length;
  
  if (count === 0) return base;
  return `${base}-${count}`;
}

export const useAppStore = create<AppState>((set, get) => ({
  registros: [],
  undoStack: [],
  currentMode: 'manual',
  processo: '',
  conferente: localStorage.getItem('cft4_conferente') || '',
  searchQuery: '',
  sortBy: '',
  history: [],
  lockEndereco: false,
  lockedEndereco: '',

  setMode: (mode) => set({ currentMode: mode }),
  setProcesso: (p) => set({ processo: p }),
  setConferente: (c) => {
    localStorage.setItem('cft4_conferente', c);
    set({ conferente: c });
  },
  setSearchQuery: (q) => set({ searchQuery: q }),
  setSortBy: (s) => set({ sortBy: s }),
  setLockEndereco: (lock) => set({ lockEndereco: lock }),
  setLockedEndereco: (e) => set({ lockedEndereco: e }),

  addRegistro: (reg) => set(state => {
    const newRegs = [...state.registros, reg];
    save(newRegs);
    return { registros: newRegs };
  }),

  deleteRegistro: (id) => set(state => {
    const idx = state.registros.findIndex(r => r.id === id);
    if (idx === -1) return state;
    const reg = state.registros[idx];
    const newRegs = [...state.registros];
    newRegs.splice(idx, 1);
    save(newRegs);
    return { registros: newRegs, undoStack: [...state.undoStack, { reg, idx }] };
  }),

  undo: () => {
    const state = get();
    if (!state.undoStack.length) return null;
    const last = state.undoStack[state.undoStack.length - 1];
    const newRegs = [...state.registros];
    newRegs.splice(last.idx, 0, last.reg);
    save(newRegs);
    set({ registros: newRegs, undoStack: state.undoStack.slice(0, -1) });
    return last.reg;
  },

  clearAll: () => {
    save([]);
    set({ registros: [], undoStack: [] });
  },

  archiveAndClear: async (name: string) => {
    const state = get();
    if (!state.registros.length) return;

    try {
      // Save conference to Supabase
      const { data: conf, error: confError } = await supabase
        .from('conferences')
        .insert({ processo: state.processo || name, conferente: state.conferente })
        .select()
        .single();

      if (confError) throw confError;

      // Save registros to Supabase
      const rows = state.registros.map(r => ({
        conference_id: conf.id,
        item: r.item,
        m2: r.m2,
        m_linear: r.mLinear,
        largura: r.largura,
        endereco: r.endereco,
        lote: r.lote,
        lote_sistema: r.loteSistema,
        tipo_tecido: r.tipoTecido || '',
        modo_origem: r.modoOrigem || state.currentMode,
        was_edited: r.wasEdited || false,
        edited_by: r.editedBy || '',
        edited_at: r.editedAt || null,
      }));

      const { error: regError } = await supabase.from('registros').insert(rows);
      if (regError) throw regError;

      save([]);
      set({ registros: [], undoStack: [] });

      // Reload history
      await get().loadHistory();
    } catch (e) {
      console.error('Error archiving:', e);
      // Fallback: still clear local
      save([]);
      set({ registros: [], undoStack: [] });
    }
  },

  loadHistory: async () => {
    try {
      const { data: confs, error } = await supabase
        .from('conferences')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const history: Conference[] = [];
      for (const c of confs || []) {
        const { data: regs } = await supabase
          .from('registros')
          .select('*')
          .eq('conference_id', c.id)
          .order('created_at', { ascending: true });

        history.push({
          id: c.id,
          name: c.processo,
          processo: c.processo,
          conferente: c.conferente,
          date: c.created_at,
          registros: (regs || []).map(r => ({
            id: r.id,
            item: r.item,
            processo: c.processo,
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
          })),
        });
      }

      set({ history });
    } catch (e) {
      console.error('Error loading history:', e);
    }
  },

  deleteConference: async (id: string) => {
    try {
      await supabase.from('registros').delete().eq('conference_id', id);
      await supabase.from('conferences').delete().eq('id', id);
      await get().loadHistory();
    } catch (e) {
      console.error('Error deleting conference:', e);
    }
  },

  clearHistory: async () => {
    try {
      await supabase.from('registros').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('conferences').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      set({ history: [] });
    } catch (e) {
      console.error('Error clearing history:', e);
    }
  },

  updateHistoryRegistro: async (conferenceId, registroId, updates) => {
    try {
      const state = get();
      const conference = state.history.find(c => c.id === conferenceId);
      if (!conference) return;

      const current = conference.registros.find(r => r.id === registroId);
      if (!current) return;

      const merged = { ...current, ...updates };
      const normalizedML = Number(merged.mLinear) || 0;
      const normalizedM2 = Number(merged.m2) || 0;
      const normalizedLargura = Number(merged.largura) || 0;
      const normalizedEndereco = merged.endereco || '';
      const normalizedItem = (merged.item || '').trim();
      const editedBy = state.conferente || merged.editedBy || '';
      const editedAt = new Date().toISOString();
      const siblingRegistros = conference.registros.filter(r => r.id !== registroId);
      const loteSistema = generateLoteSistema(conference.processo, normalizedEndereco, normalizedML, siblingRegistros as Registro[]);

      const payload = {
        item: normalizedItem,
        m2: normalizedM2,
        m_linear: normalizedML,
        largura: normalizedLargura,
        endereco: normalizedEndereco,
        lote: merged.lote || '',
        lote_sistema: loteSistema,
        tipo_tecido: merged.tipoTecido || '',
        modo_origem: merged.modoOrigem || current.modoOrigem || '',
        was_edited: true,
        edited_by: editedBy,
        edited_at: editedAt,
      };

      const { error } = await supabase
        .from('registros')
        .update(payload)
        .eq('id', registroId)
        .eq('conference_id', conferenceId);

      if (error) throw error;

      const history = state.history.map(conf => conf.id !== conferenceId ? conf : {
        ...conf,
        registros: conf.registros.map(r => r.id !== registroId ? r : {
          ...r,
          item: normalizedItem,
          m2: normalizedM2,
          mLinear: normalizedML,
          largura: normalizedLargura,
          endereco: normalizedEndereco,
          lote: merged.lote || '',
          loteSistema,
          tipoTecido: merged.tipoTecido || '',
          modoOrigem: merged.modoOrigem || current.modoOrigem || '',
          wasEdited: true,
          editedBy,
          editedAt,
        }),
      });

      set({ history });
    } catch (e) {
      console.error('Error updating registro:', e);
      throw e;
    }
  },

  loadFromStorage: () => {
    try {
      const d = localStorage.getItem(STORAGE_KEY);
      if (d) {
        const registros: Registro[] = JSON.parse(d);
        set({ registros });
      }
    } catch {}
  },
}));
