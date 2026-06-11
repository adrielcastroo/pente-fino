import { describe, it, expect } from 'vitest';
import { getRegistroColumns, type RegistroColumnKey } from './registroColumns';
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
    expect(keys).toEqual(['item', 'largura', 'm2', 'mLinear', 'lote', 'endereco', 'loteSistema']);
  });

  it('should return specific layout for manual mode', () => {
    const rows: Registro[] = [mockRegistro({ modoOrigem: 'manual' })];
    const columns = getRegistroColumns(rows);
    const keys = columns.map(c => c.key);
    expect(keys).toEqual(['item', 'largura', 'm2', 'mLinear', 'lote', 'endereco', 'loteSistema']);
  });

  it('should return specific layout for openrouter (IA) mode', () => {
    const rows: Registro[] = [mockRegistro({ modoOrigem: 'openrouter' })];
    const columns = getRegistroColumns(rows);
    const keys = columns.map(c => c.key);
    expect(keys).toEqual(['item', 'largura', 'mLinear', 'endereco', 'loteSistema']);
  });

  it('should handle diversos mode with specific types (pvt)', () => {
    const rows: Registro[] = [mockRegistro({ modoOrigem: 'diversos', tipoTecido: 'pvt' })];
    const columns = getRegistroColumns(rows);
    const keys = columns.map(c => c.key);
    expect(keys).toEqual(['item', 'nf', 'mLinear', 'lote']);
  });

  it('should handle diversos mode with specific types (celular)', () => {
    const rows: Registro[] = [mockRegistro({ modoOrigem: 'diversos', tipoTecido: 'celular' })];
    const columns = getRegistroColumns(rows);
    const keys = columns.map(c => c.key);
    expect(keys).toEqual(['item', 'processo', 'm2', 'mLinear', 'lote', 'loteSistema']);
  });

  it('should return mixed layout when multiple modes are present', () => {
    const rows: Registro[] = [
      mockRegistro({ modoOrigem: 'manual', item: 'A', nf: '1' }),
      mockRegistro({ modoOrigem: 'motor', item: 'B', processo: 'P1' })
    ];
    const columns = getRegistroColumns(rows);
    const keys = columns.map(c => c.key);
    // Mixed layout should only include columns that have visible values
    expect(keys).toContain('item');
    expect(keys).toContain('nf');
    expect(keys).toContain('processo');
  });

  it('should only show columns with non-empty values in mixed mode', () => {
    const rows: Registro[] = [
      mockRegistro({ modoOrigem: 'manual', item: 'A', nf: '', processo: '' }),
      mockRegistro({ modoOrigem: 'motor', item: '', nf: '', processo: 'P1' })
    ];
    const columns = getRegistroColumns(rows);
    const keys = columns.map(c => c.key);
    expect(keys).toContain('item');
    expect(keys).toContain('processo');
    expect(keys).not.toContain('nf');
  });
});
