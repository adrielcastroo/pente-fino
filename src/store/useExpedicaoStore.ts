import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ExpedicaoStatus = 
  | 'AGUARDANDO_RECEBIMENTO'
  | 'RECEBIDA_EXPEDICAO'
  | 'ARMAZENADA_EXPEDICAO'
  | 'EM_CONFERENCIA'
  | 'CONFERIDA'
  | 'VINCULADA_PICKING'
  | 'AGUARDANDO_TRANSPORTADORA'
  | 'ALOCADA_CARRINHO_TRANSPORTADORA'
  | 'INCLUIDA_ROMANEIO'
  | 'LIBERADA'
  | 'DIVERGENTE'
  | 'BLOQUEADA'
  | 'CANCELADA';

interface ExpedicaoStore {
  bipagemTemporaria: string[];
  addBipagem: (codigo: string) => void;
  clearBipagem: () => void;
}

export const useExpedicaoStore = create<ExpedicaoStore>()(
  persist(
    (set) => ({
      bipagemTemporaria: [],
      addBipagem: (codigo) => set((state) => ({ 
        bipagemTemporaria: [codigo, ...state.bipagemTemporaria].slice(0, 50) 
      })),
      clearBipagem: () => set({ bipagemTemporaria: [] }),
    }),
    { name: 'pente-fino-expedicao-v2' }
  )
);
