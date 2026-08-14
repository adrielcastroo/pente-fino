import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ExpedicaoSessionState {
  // Recebimento
  estruturaTemporariaId: string | null;
  
  // Conferência/Alocação
  pecaAtual: any | null;
  pickingSelecionado: any | null;
  transportadoraSelecionada: any | null;
  carrinhoSelecionado: any | null;
  
  // Histórico de bipagem local (para feedback rápido)
  bipagemHistorico: Array<{
    codigo: string;
    tipo: 'peca' | 'transportadora' | 'carrinho';
    status: 'sucesso' | 'erro';
    mensagem?: string;
    ts: number;
  }>;

  // Actions
  setEstruturaTemporaria: (id: string | null) => void;
  setPecaAtual: (peca: any | null) => void;
  setPickingSelecionado: (picking: any | null) => void;
  setTransportadoraSelecionada: (transp: any | null) => void;
  setCarrinhoSelecionado: (carrinho: any | null) => void;
  addBipagemHistorico: (entry: Omit<ExpedicaoSessionState['bipagemHistorico'][0], 'ts'>) => void;
  limparSessaoAlocacao: () => void;
}

export const useExpedicaoStore = create<ExpedicaoSessionState>()(
  persist(
    (set) => ({
      estruturaTemporariaId: null,
      pecaAtual: null,
      pickingSelecionado: null,
      transportadoraSelecionada: null,
      carrinhoSelecionado: null,
      bipagemHistorico: [],

      setEstruturaTemporaria: (id) => set({ estruturaTemporariaId: id }),
      setPecaAtual: (peca) => set({ pecaAtual: peca }),
      setPickingSelecionado: (picking) => set({ pickingSelecionado: picking }),
      setTransportadoraSelecionada: (transp) => set({ transportadoraSelecionada: transp }),
      setCarrinhoSelecionado: (carrinho) => set({ carrinhoSelecionado: carrinho }),
      
      addBipagemHistorico: (entry) => set((state) => ({
        bipagemHistorico: [{ ...entry, ts: Date.now() }, ...state.bipagemHistorico].slice(0, 50)
      })),

      limparSessaoAlocacao: () => set({
        pecaAtual: null,
        pickingSelecionado: null,
        transportadoraSelecionada: null,
        carrinhoSelecionado: null,
      }),
    }),
    {
      name: 'pente-fino-expedicao-v2',
    }
  )
);
