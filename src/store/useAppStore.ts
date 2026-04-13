import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiService } from '@/services/api';
import { Registro, Conference, AppMode, AppTab, FormData, UndoEntry } from '@/types';
import { generateLoteSistema } from '@/lib/app-utils';

export interface AppState {
  registros: Registro[];
  undoStack: UndoEntry[];
  currentMode: AppMode;
  processo: string;
  conferente: string;
  searchQuery: string;
  sortBy: string;
  history: Conference[];
  sessionStartedAt: string | null;
  lockProcesso: boolean;
  lockedProcesso: string;
  lockNf: boolean;
  lockedNf: string;
  lockEndereco: boolean;
  lockedEndereco: string;
  formData: FormData;

  setMode: (mode: AppMode) => void;
  updateRegistro: (id: string, updates: Partial<Registro>) => void;
  setProcesso: (p: string) => void;
  setConferente: (c: string) => void;
  setSearchQuery: (q: string) => void;
  setSortBy: (s: string) => void;
  setLockProcesso: (lock: boolean) => void;
  setLockedProcesso: (p: string) => void;
  setLockNf: (lock: boolean) => void;
  setLockedNf: (n: string) => void;
  setLockEndereco: (lock: boolean) => void;
  setLockedEndereco: (e: string) => void;
  setFormData: (updates: Partial<FormData>) => void;
  resetFormData: () => void;
  resetMotorFormData: () => void;
  addRegistro: (reg: Registro) => void;
  deleteRegistro: (id: string) => void;
  undo: () => Registro | null;
  clearAll: () => void;
  archiveAndClear: (name: string) => Promise<void>;
  loadHistory: () => Promise<void>;
  deleteConference: (id: string) => Promise<void>;
  clearHistory: () => Promise<void>;
  updateHistoryRegistro: (conferenceId: string, registroId: string, updates: Partial<Registro>) => Promise<void>;
}

const INITIAL_FORM_DATA: FormData = {
  item: '', nf: '', m2: '', lote: '', endereco: '', aiLargura: '', aiMLinear: '',
  diversosTipo: 'Rolo', diversosMLinear: '', manualLargura: '', coulisseMetragem: 'm2',
  lockMetragem: false, madeiraTipo: 'Lâmina', quantidade: '', motorSubMode: 'motor',
  motorModelo: '', motorNf: '', motorSerie: '', motorTemCaixa: false, motorCaixaNum: '1',
  estoqueActiveTec: 'TEC01', estoqueSearch: '', estoqueHighlightStatus: null, activeTab: 'inicio',
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      registros: [],
      undoStack: [],
      currentMode: 'manual',
      processo: '',
      conferente: '',
      searchQuery: '',
      sortBy: '',
      history: [],
      sessionStartedAt: null,
      lockProcesso: false,
      lockedProcesso: '',
      lockNf: false,
      lockedNf: '',
      lockEndereco: false,
      lockedEndereco: '',
      formData: INITIAL_FORM_DATA,

      setMode: (mode) => set({ currentMode: mode }),
      updateRegistro: (id, updates) => set(state => ({
        registros: state.registros.map(r => r.id === id ? { 
          ...r, 
          ...updates, 
          wasEdited: true, 
          editedAt: new Date().toISOString() 
        } : r)
      })),
      setProcesso: (p) => set({ processo: p }),
      setConferente: (c) => set({ conferente: c }),
      setSearchQuery: (q) => set({ searchQuery: q }),
      setSortBy: (s) => set({ sortBy: s }),
      setLockProcesso: (lock) => set({ lockProcesso: lock }),
      setLockedProcesso: (p) => set({ lockedProcesso: p }),
      setLockNf: (lock) => set({ lockNf: lock }),
      setLockedNf: (n) => set({ lockedNf: n }),
      setLockEndereco: (lock) => set({ lockEndereco: lock }),
      setLockedEndereco: (e) => set({ lockedEndereco: e }),
      setFormData: (updates) => set(state => ({ formData: { ...state.formData, ...updates } })),
      
      resetFormData: () => {
        const state = get();
        const newData = { ...INITIAL_FORM_DATA };
        // Preserve active tab and locked fields
        newData.activeTab = state.formData.activeTab;
        newData.estoqueActiveTec = state.formData.estoqueActiveTec;
        if (state.lockNf) newData.nf = state.lockedNf;
        if (state.lockEndereco) newData.endereco = state.lockedEndereco;
        set({ formData: newData });
      },
      
      resetMotorFormData: () => set(state => ({
        formData: { ...state.formData, motorModelo: '', motorNf: '', motorSerie: '', motorTemCaixa: false, motorCaixaNum: '1' }
      })),
      
      addRegistro: (reg) => set(state => {
        const newRegs = [...state.registros, reg];
        let sessionStartedAt = state.sessionStartedAt;
        if (!sessionStartedAt && state.registros.length === 0) {
          sessionStartedAt = new Date().toISOString();
        }
        return { registros: newRegs, sessionStartedAt };
      }),
      
      deleteRegistro: (id) => set(state => {
        const idx = state.registros.findIndex(r => r.id === id);
        if (idx === -1) return state;
        const reg = state.registros[idx];
        const newRegs = [...state.registros];
        newRegs.splice(idx, 1);
        return { registros: newRegs, undoStack: [...state.undoStack, { reg, idx }] };
      }),
      
      undo: () => {
        const state = get();
        if (!state.undoStack.length) return null;
        const last = state.undoStack[state.undoStack.length - 1];
        const newRegs = [...state.registros];
        newRegs.splice(last.idx, 0, last.reg);
        set({ registros: newRegs, undoStack: state.undoStack.slice(0, -1) });
        return last.reg;
      },
      
      clearAll: () => set({ registros: [], undoStack: [], sessionStartedAt: null }),
      
      archiveAndClear: async (name: string) => {
        const state = get();
        if (!state.registros.length) return;
        const finishedAt = new Date().toISOString();
        const startedAt = state.sessionStartedAt || finishedAt;
        
        try {
          await apiService.archiveConference(
            state.processo.trim() || name,
            state.conferente,
            startedAt,
            state.registros,
            state.currentMode
          );
          set({ registros: [], undoStack: [], sessionStartedAt: null });
          await get().loadHistory();
        } catch (e) {
          console.error('Error archiving:', e);
          throw e;
        }
      },
      
      loadHistory: async () => {
        try {
          const history = await apiService.fetchHistory();
          set({ history });
        } catch (e) { 
          console.error('Error loading history:', e); 
        }
      },
      
      deleteConference: async (id: string) => {
        try {
          await apiService.deleteConference(id);
          await get().loadHistory();
        } catch (e) { 
          console.error('Error deleting conference:', e); 
        }
      },
      
      clearHistory: async () => {
        try {
          await apiService.clearAllHistory();
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
          const normalizedProcesso = (merged.modoOrigem === 'diversos' || current.modoOrigem === 'diversos') 
            ? '' 
            : (merged.processo ?? current.processo ?? conference.processo);
          const normalizedEndereco = merged.endereco || '';
          const normalizedItem = (merged.item || '').trim();
          const normalizedNf = (merged.nf || '').trim();
          const editedBy = state.conferente || merged.editedBy || '';
          const editedAt = new Date().toISOString();
          
          const siblingRegistros = conference.registros.filter(r => r.id !== registroId);
          const loteSistema = generateLoteSistema(
            normalizedProcesso, 
            normalizedEndereco, 
            normalizedML, 
            siblingRegistros as Registro[], 
            normalizedNf, 
            normalizedItem
          );
          
          const payload = {
            item: normalizedItem,
            nf: normalizedNf,
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
            quantidade: merged.quantidade || null
          };
          
          await apiService.updateRegistro(conferenceId, registroId, payload);
          
          const newHistory = state.history.map(conf => conf.id !== conferenceId ? conf : {
            ...conf,
            registros: conf.registros.map(r => r.id !== registroId ? r : {
              ...r, 
              ...merged,
              processo: normalizedProcesso,
              loteSistema,
              wasEdited: true,
              editedBy,
              editedAt,
            }),
          });
          set({ history: newHistory });
        } catch (e) {
          console.error('Error updating history registro:', e);
        }
      },
    }),
    {
      name: 'cft4-registros',
    }
  )
);
