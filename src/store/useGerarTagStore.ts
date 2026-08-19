import { LinhaTag, ResultadoAuge, TagCalculadaSel } from '@/components/acabamentos/GerarTagTab';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface GerarTagState {
  descricao: string;
  linhas: LinhaTag[];
  customAberta: { cd: string; nm: string } | null;
  resultado: ResultadoAuge | null;
  modoEdicaoRelancamento: boolean;
  snapshotLinhas: LinhaTag[] | null;
  removidasManualmente: Set<string>;
  termoBuscaCfg: string;
  
  // Actions
  setDescricao: (val: string) => void;
  setLinhas: (val: LinhaTag[] | ((prev: LinhaTag[]) => LinhaTag[])) => void;
  setCustomAberta: (val: { cd: string; nm: string } | null) => void;
  setResultado: (val: ResultadoAuge | null) => void;
  setModoEdicaoRelancamento: (val: boolean) => void;
  setSnapshotLinhas: (val: LinhaTag[] | null) => void;
  setRemovidasManualmente: (val: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
  setTermoBuscaCfg: (val: string) => void;
  reset: () => void;
}

const INITIAL_STATE = {
  descricao: '',
  linhas: [],
  customAberta: null,
  resultado: null,
  modoEdicaoRelancamento: false,
  snapshotLinhas: null,
  removidasManualmente: new Set<string>(),
  termoBuscaCfg: '',
};

export const useGerarTagStore = create<GerarTagState>()(
  persist(
    (set) => ({
      ...INITIAL_STATE,

      setDescricao: (val) => set({ descricao: val }),
      setLinhas: (val) => set((state) => ({ 
        linhas: typeof val === 'function' ? val(state.linhas) : val 
      })),
      setCustomAberta: (val) => set({ customAberta: val }),
      setResultado: (val) => set({ resultado: val }),
      setModoEdicaoRelancamento: (val) => set({ modoEdicaoRelancamento: val }),
      setSnapshotLinhas: (val) => set({ snapshotLinhas: val }),
      setRemovidasManualmente: (val) => set((state) => ({ 
        removidasManualmente: typeof val === 'function' ? val(state.removidasManualmente) : val 
      })),
      setTermoBuscaCfg: (val) => set({ termoBuscaCfg: val }),
      reset: () => set(INITIAL_STATE),
    }),
    {
      name: 'pente-fino:gerar-tag-state',
      storage: createJSONStorage(() => ({
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          try {
            const parsed = JSON.parse(str);
            const state = parsed.state;
            const version = parsed.version;
            
            // Re-hidratar o Set se vier como array do localStorage
            if (state.removidasManualmente && Array.isArray(state.removidasManualmente)) {
              state.removidasManualmente = new Set(state.removidasManualmente);
            } else if (!state.removidasManualmente || !(state.removidasManualmente instanceof Set)) {
              state.removidasManualmente = new Set();
            }
            
            return JSON.stringify({ state, version });
          } catch (e) {
            console.error('[useGerarTagStore] storage.getItem failed', e);
            return null;
          }
        },
        setItem: (name, value) => {
          try {
            const parsed = JSON.parse(value);
            const state = { ...parsed.state };
            const version = parsed.version;
            
            // Serializar o Set para array antes de salvar
            if (state.removidasManualmente instanceof Set) {
              state.removidasManualmente = Array.from(state.removidasManualmente);
            }
            
            localStorage.setItem(name, JSON.stringify({ state, version }));
          } catch (e) {
            console.error('[useGerarTagStore] storage.setItem failed', e);
          }
        },
        removeItem: (name) => localStorage.removeItem(name),
      })),
      partialize: (state) => ({
        descricao: state.descricao,
        linhas: state.linhas,
        customAberta: state.customAberta,
        resultado: state.resultado,
        modoEdicaoRelancamento: state.modoEdicaoRelancamento,
        snapshotLinhas: state.snapshotLinhas,
        removidasManualmente: state.removidasManualmente,
        termoBuscaCfg: state.termoBuscaCfg,
      }),
    }
  )
);
