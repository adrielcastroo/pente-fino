import { describe, it, expect } from 'vitest';
import { getRegistroColumns } from './registroColumns';
import { Registro } from '@/types';

const mockRegistro = (updates: Partial<Registro> = {}): Registro => ({
  id: '1',
  item: 'ABC-123',
  processo: 'PROC1',
  nf: 'NF1',
  endereco: 'A01.01.N1',
  m2: 10,
  mLinear: 10,
  largura: 2.5,
  lote: 'LOTE1',
  loteSistema: 'LOTE_SIS',
  ...updates
});

describe('getRegistroColumns', () => {
  it('should return default layout columns when rows are empty', () => {
    const columns = getRegistroColumns([], 'manual');
    const keys = columns.map(c => c.key);
    expect(keys).toContain('item');
    expect(keys).toContain('mLinear');
  });

  it('should return motor layout for motor mode', () => {
    const rows: Registro[] = [mockRegistro({ modoOrigem: 'motor' })];
    const columns = getRegistroColumns(rows, 'motor');
    const keys = columns.map(c => c.key);
    expect(keys).toEqual(['item', 'nf', 'lote', 'loteSistema', 'quantidade']);
  });

  it('should return standard layout for other modes', () => {
    const rows: Registro[] = [mockRegistro({ modoOrigem: 'manual' })];
    const columns = getRegistroColumns(rows, 'manual');
    const keys = columns.map(c => c.key);
    expect(keys).toContain('item');
    expect(keys).toContain('mLinear');
    expect(keys).toContain('endereco');
  });
});
