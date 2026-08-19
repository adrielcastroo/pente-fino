import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface LinhaTag {
  id: string;
  code: string;
  valor: string;
  cfgNome: string;
  calculada: string;
  formula: string;
  cdTagCustomizada?: string;
  snapshotValue?: string;
  valorAntigo?: string;
  cdTagCalculada?: string;
  dsTagTexto?: string;
}

interface ResultadoAuge {
  ok: boolean;
  descricao?: string;
  cdConfiguracao?: string;
  total?: number;
  gravadas?: number;
  falhas?: number;
  results?: Array<{
    tag: string;
    calculada: string;
    formula?: string;
    cdTagCustomizada?: string;
    ok: boolean;
    erro?: string;
  }>;
  augeRows?: any[];
  error?: string;
  lote?: Array<{
    configuracao: string;
    ok: boolean;
    total: number;
    gravadas: number;
    detalhes: any[];
  }>;
}

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
          const { state, version } = JSON.parse(str);
          // Re-hidratar o Set
          if (state.removidasManualmente) {
            state.removidasManualmente = new Set(state.removidasManualmente);
          }
          return JSON.stringify({ state, version });
        },
        setItem: (name, value) => {
          const { state, version } = JSON.parse(value);
          // Serializar o Set
          if (state.removidasManualmente instanceof Set) {
            state.removidasManualmente = Array.from(state.removidasManualmente);
          }
          localStorage.setItem(name, JSON.stringify({ state, version }));
        },
        removeItem: (name) => localStorage.removeItem(name),
      })),
      // Não persistir estados transitórios se houver algum no futuro
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
