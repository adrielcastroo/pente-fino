import { describe, it, expect } from 'vitest';
import { extractCodigoFornecedor, normalizarCodigo, codigoBate } from './codigoFornecedor';

describe('extractCodigoFornecedor', () => {
  it('extrai código entre parênteses com hífens', () => {
    const r = extractCodigoFornecedor('Tecido Blackout (RF-BASIC-BO-03-0) PCT1');
    expect(r?.codigo).toBe('RF-BASIC-BO-03-0');
  });

  it('extrai código numérico entre parênteses', () => {
    const r = extractCodigoFornecedor('Persiana (3001-05-250) cor branca');
    expect(r?.codigo).toBe('3001-05-250');
  });

  it('extrai código alfanumérico colado sem parênteses', () => {
    const r = extractCodigoFornecedor('Tecido Voil YM4202 cor crua');
    expect(r?.codigo).toBe('YM4202');
  });

  it('extrai RF-MOMBASSA5600', () => {
    const r = extractCodigoFornecedor('Tecido RF-MOMBASSA5600 acabamento liso');
    expect(r?.codigo).toBe('RF-MOMBASSA5600');
  });

  it('extrai número longo no final como fallback', () => {
    const r = extractCodigoFornecedor('VB.Mot. Interruptor Inis Uno 1800492');
    expect(r?.codigo).toBe('1800492');
  });

  it('retorna null para descrição vazia', () => {
    expect(extractCodigoFornecedor('')).toBeNull();
    expect(extractCodigoFornecedor(null)).toBeNull();
  });
});

describe('normalizarCodigo', () => {
  it('remove pontuação e uppercase', () => {
    expect(normalizarCodigo('rf-basic-bo-03')).toBe('RFBASICBO03');
    expect(normalizarCodigo(' 1800.492 ')).toBe('1800492');
  });
});

describe('codigoBate', () => {
  it('match exato após normalização', () => {
    expect(codigoBate('RF-BASIC-BO-03', 'rfbasicbo03')).toBe(true);
  });
  it('match parcial', () => {
    expect(codigoBate('YM4202-A', 'YM4202')).toBe(true);
  });
  it('não bate quando diferentes', () => {
    expect(codigoBate('YM4202', 'YM5304')).toBe(false);
  });
  it('vazio retorna false', () => {
    expect(codigoBate('', 'YM4202')).toBe(false);
  });
  it('bate ignorando sufixo de largura colado', () => {
    expect(codigoBate('RFMOMBASSA-5600200', 'RF-MOMBASSA-5600')).toBe(true);
  });
  it('bate ignorando sufixo de largura com separador', () => {
    expect(codigoBate('RFMOMBASSA-5600-200', 'RF-MOMBASSA-5600')).toBe(true);
    expect(codigoBate('RFMOMBASSA-5600-20', 'RF-MOMBASSA-5600')).toBe(true);
  });
  it('não bate quando código base é diferente mesmo com sufixo', () => {
    expect(codigoBate('OUTROCODIGO-200', 'RF-MOMBASSA-5600')).toBe(false);
  });
});

