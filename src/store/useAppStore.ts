import { create } from 'zustand';

export interface Registro {
  id: number;
  item: string;
  nfe: string;
  endereco: string;
  mLinear: number;
  largura: number;
  lote: string;
  isNew?: boolean;
}

export interface Conference {
  id: string;
  name: string;
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
  currentMode: 'manual' | 'openrouter';
  nfe: string;
  searchQuery: string;
  sortBy: string;
  history: Conference[];

  setMode: (mode: 'manual' | 'openrouter') => void;
  setNfe: (nfe: string) => void;
  setSearchQuery: (q: string) => void;
  setSortBy: (s: string) => void;
  addRegistro: (reg: Registro) => void;
  deleteRegistro: (id: number) => void;
  undo: () => Registro | null;
  clearAll: () => void;
  loadFromStorage: () => void;
  archiveAndClear: (name: string) => void;
}

const STORAGE_KEY = 'cft4';
const HISTORY_KEY = 'cft4_history';

function fmtML(v: number): string {
  if (!v || v === 0) return '';
  return (v % 1 === 0 ? Math.round(v) : v.toFixed(1).replace('.', ',')) + 'M';
}

function save(registros: Registro[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(registros)); } catch {}
}

function saveHistory(history: Conference[]) {
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(history)); } catch {}
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

export const useAppStore = create<AppState>((set, get) => ({
  registros: [],
  undoStack: [],
  currentMode: 'manual',
  nfe: '',
  searchQuery: '',
  sortBy: '',
  history: [],

  setMode: (mode) => set({ currentMode: mode }),
  setNfe: (nfe) => set({ nfe }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  setSortBy: (s) => set({ sortBy: s }),

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

  archiveAndClear: (name: string) => {
    const state = get();
    if (!state.registros.length) return;
    const conf: Conference = {
      id: Date.now().toString(),
      name: name || 'Conferência',
      date: new Date().toISOString(),
      registros: [...state.registros],
    };
    const newHistory = [conf, ...state.history];
    saveHistory(newHistory);
    save([]);
    set({ registros: [], undoStack: [], history: newHistory });
  },

  loadFromStorage: () => {
    try {
      const d = localStorage.getItem(STORAGE_KEY);
      if (d) {
        const registros: Registro[] = JSON.parse(d);
        set({ registros });
      }
    } catch {}
    try {
      const h = localStorage.getItem(HISTORY_KEY);
      if (h) set({ history: JSON.parse(h) });
    } catch {}
  },
}));
