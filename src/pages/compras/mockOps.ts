// Seed de exemplo — remover ao conectar ao backend real (tabela ordens_compra).
// TODO(compras): substituir por consulta ao Supabase quando a migration for aplicada.

export type OpStatus =
  | 'rascunho'
  | 'pendente_aprovacao'
  | 'aprovada'
  | 'enviada'
  | 'confirmada_fornecedor'
  | 'recebimento_parcial'
  | 'recebida_total'
  | 'faturada'
  | 'concluida'
  | 'cancelada';

export interface OpMock {
  id: string;
  numero: string;
  fornecedor: string;
  categoria: string;
  status: OpStatus;
  valor_total: number;
  data_emissao: string; // ISO
  data_prevista_entrega: string; // ISO
  quantidade_total: number;
  quantidade_recebida: number;
}

const hoje = new Date();
const d = (offsetDias: number) => {
  const x = new Date(hoje);
  x.setDate(x.getDate() + offsetDias);
  return x.toISOString().slice(0, 10);
};

export const MOCK_OPS: OpMock[] = [
  {
    id: 'op-1', numero: 'OC-000121', fornecedor: 'Tecelagem Andorinha Ltda.',
    categoria: 'Tecidos', status: 'pendente_aprovacao',
    valor_total: 48250.75, data_emissao: d(-2), data_prevista_entrega: d(12),
    quantidade_total: 1800, quantidade_recebida: 0,
  },
  {
    id: 'op-2', numero: 'OC-000122', fornecedor: 'Fios Progresso S.A.',
    categoria: 'Fios', status: 'enviada',
    valor_total: 27980.00, data_emissao: d(-6), data_prevista_entrega: d(5),
    quantidade_total: 900, quantidade_recebida: 0,
  },
  {
    id: 'op-3', numero: 'OC-000123', fornecedor: 'Aviamentos Central',
    categoria: 'Aviamentos', status: 'confirmada_fornecedor',
    valor_total: 8420.30, data_emissao: d(-4), data_prevista_entrega: d(3),
    quantidade_total: 340, quantidade_recebida: 0,
  },
  {
    id: 'op-4', numero: 'OC-000124', fornecedor: 'Tecelagem Andorinha Ltda.',
    categoria: 'Tecidos', status: 'recebimento_parcial',
    valor_total: 61300.00, data_emissao: d(-14), data_prevista_entrega: d(-1),
    quantidade_total: 2400, quantidade_recebida: 1500,
  },
  {
    id: 'op-5', numero: 'OC-000125', fornecedor: 'Malharia Sol Nascente',
    categoria: 'Tecidos', status: 'recebimento_parcial',
    valor_total: 32780.90, data_emissao: d(-20), data_prevista_entrega: d(-7),
    quantidade_total: 1200, quantidade_recebida: 600,
  },
  {
    id: 'op-6', numero: 'OC-000126', fornecedor: 'Química Bandeirantes',
    categoria: 'MRO', status: 'recebida_total',
    valor_total: 4210.55, data_emissao: d(-11), data_prevista_entrega: d(-3),
    quantidade_total: 40, quantidade_recebida: 40,
  },
  {
    id: 'op-7', numero: 'OC-000127', fornecedor: 'Fios Progresso S.A.',
    categoria: 'Fios', status: 'faturada',
    valor_total: 19560.00, data_emissao: d(-25), data_prevista_entrega: d(-10),
    quantidade_total: 700, quantidade_recebida: 700,
  },
  {
    id: 'op-8', numero: 'OC-000128', fornecedor: 'Aviamentos Central',
    categoria: 'Aviamentos', status: 'rascunho',
    valor_total: 3120.00, data_emissao: d(0), data_prevista_entrega: d(20),
    quantidade_total: 220, quantidade_recebida: 0,
  },
  {
    id: 'op-9', numero: 'OC-000129', fornecedor: 'Malharia Sol Nascente',
    categoria: 'Tecidos', status: 'cancelada',
    valor_total: 14200.00, data_emissao: d(-9), data_prevista_entrega: d(-2),
    quantidade_total: 500, quantidade_recebida: 0,
  },
];

export const STATUS_LABEL: Record<OpStatus, string> = {
  rascunho: 'Rascunho',
  pendente_aprovacao: 'Pendente aprovação',
  aprovada: 'Aprovada',
  enviada: 'Enviada',
  confirmada_fornecedor: 'Confirmada',
  recebimento_parcial: 'Recebimento parcial',
  recebida_total: 'Recebida',
  faturada: 'Faturada',
  concluida: 'Concluída',
  cancelada: 'Cancelada',
};

import type { StatusTone } from '@/components/ui/status-badge';
export const STATUS_TONE: Record<OpStatus, StatusTone> = {
  rascunho: 'neutral',
  pendente_aprovacao: 'warning',
  aprovada: 'primary',
  enviada: 'info',
  confirmada_fornecedor: 'info',
  recebimento_parcial: 'warning',
  recebida_total: 'success',
  faturada: 'success',
  concluida: 'success',
  cancelada: 'danger',
};

export const fmtBRL = (n: number) =>
  n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const fmtDate = (iso: string) => {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
};

export const diasParaEntrega = (iso: string) => {
  const alvo = new Date(iso + 'T00:00:00');
  const hoje0 = new Date();
  hoje0.setHours(0, 0, 0, 0);
  return Math.round((alvo.getTime() - hoje0.getTime()) / 86400000);
};

const STATUS_ABERTOS: OpStatus[] = [
  'rascunho', 'pendente_aprovacao', 'aprovada', 'enviada',
  'confirmada_fornecedor', 'recebimento_parcial',
];
export const isAberta = (s: OpStatus) => STATUS_ABERTOS.includes(s);
export const isConcluida = (s: OpStatus) =>
  s === 'recebida_total' || s === 'faturada' || s === 'concluida';
