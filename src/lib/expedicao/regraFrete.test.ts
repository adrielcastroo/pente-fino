import { describe, it, expect } from 'vitest';
import { decidirFrete, dataPredominante, type RegraFreteMin, type PedidoAugeMin } from './regraFrete';

const regra: RegraFreteMin = {
  codigo_cliente: 'C001', nome_cliente: 'Loja Ação Ltda', modalidade_frete: 'CIF_FOB',
  valor_minimo_frete: 1000, transportadora_cif: 'TRANSP CIF', transportadora_fob: 'TRANSP FOB',
};
const ped = (cd: string, nome: string, v: number, situacao: string | null = '20'): PedidoAugeMin =>
  ({ cd_pedido: cd, nome_cliente: nome, codigo_cliente: null, vl_total: v, situacao });

describe('decidirFrete', () => {
  it('mínimo atingido → CIF', () => {
    const d = decidirFrete({ codigoCliente: 'C001', nomeCliente: 'LOJA ACAO LTDA', transportadorPlanilha: '', regra,
      pedidos: [ped('1', 'Loja Acao Ltda', 600), ped('2', 'LOJA AÇÃO LTDA.', 500)] });
    expect(d.situacao).toBe('atingido');
    expect(d.transportadora).toBe('TRANSP CIF');
    expect(d.valorPedidos).toBe(1100);
  });
  it('abaixo do mínimo → FOB com exceção; ignora cancelados', () => {
    const d = decidirFrete({ codigoCliente: 'C001', nomeCliente: 'Loja Ação Ltda', transportadorPlanilha: '', regra,
      pedidos: [ped('1', 'Loja Ação Ltda', 300), ped('2', 'Loja Ação Ltda', 5000, 'Cancelado')] });
    expect(d.situacao).toBe('abaixo');
    expect(d.transportadora).toBe('TRANSP FOB');
    expect(d.flagExcecao).toBe(true);
  });
  it('instrução da planilha tem prioridade', () => {
    const d = decidirFrete({ codigoCliente: 'C001', nomeCliente: 'x', transportadorPlanilha: 'Agrupar com X', regra, pedidos: [] });
    expect(d.situacao).toBe('instrucao');
  });
  it('sem regra mantém planilha', () => {
    const d = decidirFrete({ codigoCliente: 'Z', nomeCliente: 'x', transportadorPlanilha: 'JAD', regra: undefined, pedidos: [] });
    expect(d).toMatchObject({ situacao: 'sem_regra', transportadora: 'JAD' });
  });
});

describe('dataPredominante', () => {
  it('pega a mais frequente', () => {
    expect(dataPredominante(['2026-09-01', '2026-09-02', '2026-09-02', undefined])).toBe('2026-09-02');
  });
});
