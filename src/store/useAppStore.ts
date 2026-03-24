import { create } from 'zustand';

export interface Registro {
  id: number;
  item: string;
  nfe: string;
  endereco: string;
  mLinear: number;
  largura: number;
  m2: number;
  lote: string;
  obs: string;
  isNew?: boolean;
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

  setMode: (mode: 'manual' | 'openrouter') => void;
  setNfe: (nfe: string) => void;
  setSearchQuery: (q: string) => void;
  setSortBy: (s: string) => void;
  addRegistro: (reg: Registro) => void;
  deleteRegistro: (id: number) => void;
  undo: () => Registro | null;
  clearAll: () => void;
  loadFromStorage: () => void;
}

const STORAGE_KEY = 'cft4';

function fmtML(v: number): string {
  if (!v || v === 0) return '';
  return (v % 1 === 0 ? Math.round(v) : v.toFixed(1).replace('.', ',')) + 'M';
}

function renumerarLotes(registros: Registro[]): void {
  const groups: Record<string, Registro[]> = {};
  registros.forEach(r => {
    const base = r.lote.replace(/-\d+$/, '');
    if (!groups[base]) groups[base] = [];
    groups[base].push(r);
  });
  Object.values(groups).forEach(group => {
    if (group.length === 1) {
      group[0].lote = group[0].lote.replace(/-\d+$/, '');
    } else {
      group.forEach((r, i) => {
        const base = r.lote.replace(/-\d+$/, '');
        r.lote = base + '-' + (i + 1);
      });
    }
  });
}

function save(registros: Registro[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(registros)); } catch {}
}

export function gerarLoteUnico(registros: Registro[], loteBase: string): string {
  const re = new RegExp('^' + loteBase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?:-(\\d+))?$');
  const nums = registros.map(r => {
    const m = r.lote.match(re);
    if (!m) return null;
    return m[1] ? parseInt(m[1]) : 0;
  }).filter((n): n is number => n !== null);
  if (nums.length === 0) return loteBase;
  if (nums.length === 1 && nums[0] === 0) {
    const existing = registros.find(r => r.lote === loteBase);
    if (existing) existing.lote = loteBase + '-1';
    return loteBase + '-2';
  }
  return loteBase + '-' + (Math.max(...nums) + 1);
}

export function formatML(v: number): string {
  return fmtML(v);
}

export const useAppStore = create<AppState>((set, get) => ({
  registros: [],
  undoStack: [],
  currentMode: 'manual',
  nfe: '',
  searchQuery: '',
  sortBy: '',

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

  loadFromStorage: () => {
    try {
      const d = localStorage.getItem(STORAGE_KEY);
      if (d) {
        const registros: Registro[] = JSON.parse(d);
        registros.forEach(r => {
          const mlFmt = fmtML(r.mLinear);
          r.lote = [r.endereco, r.nfe, mlFmt].filter(Boolean).join(' ');
        });
        renumerarLotes(registros);
        save(registros);
        set({ registros });
      }
    } catch {}
  },
}));
