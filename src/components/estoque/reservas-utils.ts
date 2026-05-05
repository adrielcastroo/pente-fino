import { Reserva } from '@/types';

export interface ReservaFormData {
  codigo: string;
  descricao: string;
  endereco: string;
  quantidade: string;
  caixaNum: string;
  quantidadeCx: string;
  observacao: string;
}

export const initialReservaForm: ReservaFormData = {
  codigo: '',
  descricao: '',
  endereco: '',
  quantidade: '',
  caixaNum: '',
  quantidadeCx: '',
  observacao: '',
};

export function filterReservas(reservas: Reserva[], searchTerm: string): Reserva[] {
  const term = searchTerm.toLowerCase();
  return reservas
    .filter(r => 
      r.codigo.toLowerCase().includes(term) ||
      r.endereco.toLowerCase().includes(term) ||
      (r.descricao && r.descricao.toLowerCase().includes(term)) ||
      (r.caixaNum && r.caixaNum.toLowerCase().includes(term)) ||
      (r.observacao && r.observacao.toLowerCase().includes(term))
    )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function calculateTotal(quantidade: number | null | undefined, quantidadeCx: number | null | undefined): number {
  return (quantidade || 0) * (quantidadeCx || 0);
}
