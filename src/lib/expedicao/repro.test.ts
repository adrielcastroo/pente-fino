import { describe, it, expect } from 'vitest';
import { normalizarChave, pedidosDoCliente } from './regraFrete';

describe('Normalization inconsistency', () => {
  it('normalizarChave does NOT strip leading zeros', () => {
    expect(normalizarChave('C001')).toBe('C001');
    expect(normalizarChave('00123')).toBe('00123');
  });

  it('pedidosDoCliente fails to match C001 with C1', () => {
    const pedidos = [{ cd_pedido: '1', nome_cliente: 'Test', codigo_cliente: 'C1', vl_total: 100, situacao: '20' }];
    const result = pedidosDoCliente(pedidos, 'C001', []);
    expect(result.length).toBe(0); // This confirms the failure
  });
});
