import { describe, it, expect } from 'vitest';
import { formatML, extractLarguraFromItem, generateLoteSistema } from '@/lib/app-utils';
import { Registro } from '@/types';

describe('useAppStore utilities', () => {
  describe('formatML', () => {
    it('should format numbers correctly with M suffix', () => {
      expect(formatML(10)).toBe('10M');
      expect(formatML(10.5)).toBe('10,5M');
      expect(formatML(0)).toBe('');
      expect(formatML(0.0)).toBe('');
    });
  });

  describe('extractLarguraFromItem', () => {
    it('should extract width from item string', () => {
      // Logic: split by '-', take parts[3], if >= 100 divide by 100, else divide by 10
      expect(extractLarguraFromItem('ABC-DEF-GHI-250')).toBe(2.5);
      expect(extractLarguraFromItem('ABC-DEF-GHI-25')).toBe(2.5);
      expect(extractLarguraFromItem('ABC-DEF-GHI-300')).toBe(3);
      expect(extractLarguraFromItem('ABC-DEF-GHI-0')).toBe(0);
      expect(extractLarguraFromItem('invalid-string')).toBe(0);
    });
  });

  describe('generateLoteSistema', () => {
    const existingRegistros: Registro[] = [
      { id: '1', item: 'A', processo: '123', nf: '', endereco: 'E1', m2: 1, mLinear: 10, largura: 1, lote: 'L1', loteSistema: 'E1 PROC 123 10M' }
    ];

    it('should generate base loteSistema with PROC prefix', () => {
      const lote = generateLoteSistema('123', 'E1', 10, []);
      expect(lote).toBe('E1 PROC 123 10M');
    });

    it('should generate base loteSistema with NF prefix if no PROC', () => {
      const lote = generateLoteSistema('', 'E1', 10, [], '456');
      expect(lote).toBe('E1 NF 456 10M');
    });

    it('should add suffix for duplicate items with same parameters', () => {
      const lote = generateLoteSistema('123', 'E1', 10, existingRegistros, '', 'A');
      expect(lote).toBe('E1 PROC 123 10M-1');
    });

    it('should not add suffix for different items', () => {
      const lote = generateLoteSistema('123', 'E1', 10, existingRegistros, '', 'B');
      expect(lote).toBe('E1 PROC 123 10M');
    });

    it('should not add suffix for different parameters', () => {
      const lote = generateLoteSistema('123', 'E2', 10, existingRegistros, '', 'A');
      expect(lote).toBe('E2 PROC 123 10M');
    });
  });
});
