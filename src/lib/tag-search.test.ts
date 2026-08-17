import { describe, it, expect } from 'vitest';
import {
  extrairPalavras,
  filtrarPorIlike,
  ilikeAnd,
  ilikeCacheKey,
  ilikeOr,
  matchesIlike,
  normKey,
  rankByRelevance,
  sanitizeTerm,
  toIlikePattern,
  toIlikeTokens,
  tokenize,
  uniqTokens,
  weightTokens,
} from '@/lib/tag-search';

describe('tag-search / normKey + tokenize + uniqTokens', () => {
  it('normKey remove acentos, baixa caixa e colapsa símbolos', () => {
    expect(normKey('Cortina Persiana')).toBe('cortina persiana');
    expect(normKey('Aço Inox')).toBe('aco inox');
    expect(normKey('Aço Inóx')).toBe('aco inox');
    expect(normKey('  múltiplos   espaços  ')).toBe('multiplos espacos');
    expect(normKey('Foo, Bar (Baz)')).toBe('foo bar baz');
    expect(normKey(null as unknown as string)).toBe('');
  });

  it('tokenize mantém tokens com pelo menos 1 caractere', () => {
    expect(tokenize('A B 12 CD')).toEqual(['a', 'b', '12', 'cd']);
    expect(tokenize('')).toEqual([]);
  });

  it('uniqTokens preserva ordem', () => {
    expect(uniqTokens(['a', 'b', 'a', 'c'])).toEqual(['a', 'b', 'c']);
  });
});

describe('tag-search / curingas SAP B1', () => {
  it('toIlikePattern envolve termo simples em % (mantém capitalização)', () => {
    expect(toIlikePattern('motor')).toBe('%motor%');
    expect(toIlikePattern('  Cortina  ')).toBe('%Cortina%');
  });

  it('toIlikePattern preserva asterisco como % literal', () => {
    expect(toIlikePattern('TUB*')).toBe('TUB%');
    expect(toIlikePattern('*MOTOR')).toBe('%MOTOR');
    expect(toIlikePattern('T*42')).toBe('T%42');
  });

  it('toIlikePattern sanitiza vírgulas, aspas e parênteses', () => {
    expect(toIlikePattern('Foo, Bar (Baz)')).toBe('%Foo Bar Baz%');
  });

  it('toIlikePattern colapsa % existentes em espaço (evita ataques)', () => {
    expect(toIlikePattern('100%%off')).toBe('%100 off%');
  });

  it('toIlikeTokens quebra AND por tokens (mantém capitalização)', () => {
    expect(toIlikeTokens('cortina*35*liso')).toEqual(['%cortina%', '%35%', '%liso%']);
    expect(toIlikeTokens('Rollo Pro')).toEqual(['%Rollo%', '%Pro%']);
    expect(toIlikeTokens('T')).toEqual(['%T%']);
    expect(toIlikeTokens('')).toEqual([]);
  });

  it('toIlikeTokens limita a 12 tokens', () => {
    expect(toIlikeTokens('a b c d e f g h i j k l m n o p').length).toBe(12);
  });

  it('sanitizeTerm remove vírgulas/aspas mas preserva asterisco', () => {
    expect(sanitizeTerm('Foo, Bar*Baz')).toBe('Foo Bar*Baz');
  });
});

describe('tag-search / matchesIlike (cliente)', () => {
  it('combina ignorando acentos e case', () => {
    expect(matchesIlike('Persiana Alumínio', '%aluminio%')).toBe(true);
    expect(matchesIlike('Aço Inox', '%aco%')).toBe(true);
    expect(matchesIlike('Branco', '%BRANCO%')).toBe(true);
  });

  it('combina com curingas literais', () => {
    expect(matchesIlike('Rollo Pro T45', 'Rollo%')).toBe(true);
    expect(matchesIlike('Rollo Pro T45', '%T45')).toBe(true);
    expect(matchesIlike('Rollo Pro T45', 'Rollo%T45')).toBe(true);
  });

  it('não combina quando não há match', () => {
    expect(matchesIlike('Rollo Pro', '%shadow%')).toBe(false);
  });

  it('pattern vazio retorna true', () => {
    expect(matchesIlike('qualquer', '')).toBe(true);
  });
});

describe('tag-search / filtrarPorIlike (AND por tokens)', () => {
  const configuracoes = [
    { nm_configuracao: 'Rollo Pro T45 Branco' },
    { nm_configuracao: 'Cortina CM-35 Liso' },
    { nm_configuracao: 'Persiana Cinza T35' },
    { nm_configuracao: 'Kit 10% Desconto' },
    { nm_configuracao: 'Persiana Alumínio 25mm' },
    { nm_configuracao: 'Rollo Light T55' },
  ];

  it('substring única', () => {
    const resultado = filtrarPorIlike(configuracoes, toIlikePattern('aluminio'), []);
    expect(resultado.map((r) => r.nm_configuracao)).toEqual(['Persiana Alumínio 25mm']);
  });

  it('AND por tokens (coringa * como separador)', () => {
    const resultado = filtrarPorIlike(configuracoes, '', toIlikeTokens('cortina*35'));
    expect(resultado.map((r) => r.nm_configuracao)).toEqual(['Cortina CM-35 Liso']);
  });

  it('lida com % no nome do item', () => {
    const resultado = filtrarPorIlike(configuracoes, toIlikePattern('10%'), []);
    expect(resultado.map((r) => r.nm_configuracao)).toEqual(['Kit 10% Desconto']);
  });

  it('AND por tokens em qualquer ordem', () => {
    const resultado = filtrarPorIlike(configuracoes, '', toIlikeTokens('T45*rollo*branco'));
    expect(resultado.map((r) => r.nm_configuracao)).toEqual(['Rollo Pro T45 Branco']);
  });

  it('retorna vazio sem match', () => {
    expect(filtrarPorIlike(configuracoes, '', toIlikeTokens('xyz123'))).toEqual([]);
  });
});

describe('tag-search / rankByRelevance', () => {
  const rows = [
    { nm_configuracao: 'Rollo Pro T45 Branco' },
    { nm_configuracao: 'Rollo Light T55' },
    { nm_configuracao: 'Persiana Cinza T35' },
  ];

  it('match exato vence prefixo vence substring', () => {
    const ranked = rankByRelevance(rows, 'Rollo');
    expect(ranked[0].cfg.nm_configuracao.startsWith('Rollo')).toBe(true);
    expect(ranked.some((r) => r.cfg.nm_configuracao === 'Persiana Cinza T35')).toBe(true);
  });

  it('empate vai para ordem alfabética', () => {
    const ranked = rankByRelevance(rows, 'Rollo');
    expect(ranked[0].cfg.nm_configuracao).toBe('Rollo Light T55');
    expect(ranked[1].cfg.nm_configuracao).toBe('Rollo Pro T45 Branco');
  });
});

describe('tag-search / extrairPalavras + weightTokens', () => {
  it('identifica tokens estruturais (tipo, tubo, motor)', () => {
    const p = extrairPalavras('Rollo Pro T45 CM-35 Branco');
    const tokens = p.map((x) => x.token);
    expect(tokens).toContain('rollo');
    expect(tokens).toContain('t45');
    expect(tokens).toContain('branco');
  });

  it('orden por peso decrescente', () => {
    const p = extrairPalavras('Rollo T45');
    for (let i = 1; i < p.length; i++) {
      expect(p[i].weight).toBeLessThanOrEqual(p[i - 1].weight);
    }
  });

  it('weightTokens atribui peso estrutural', () => {
    const w = weightTokens(['rollo', 'banana']);
    expect(w[0].structural).toBe(true);
    expect(w[0].weight).toBeGreaterThan(w[1].weight);
  });
});

describe('tag-search / builders PostgREST', () => {
  it('ilikeCacheKey é determinístico', () => {
    expect(ilikeCacheKey('%foo%', ['%bar%'])).toBe(ilikeCacheKey('%foo%', ['%bar%']));
    expect(ilikeCacheKey('%foo%', ['%bar%'])).not.toBe(ilikeCacheKey('%foo%', ['%baz%']));
  });

  it('ilikeOr monta lógica AND entre tokens (OR entre colunas para cada token)', () => {
    const or = ilikeOr(['col1', 'col2'], '%preto%', ['%t45%']);
    // PostgREST: or(col1.ilike."%t45%",col2.ilike."%t45%")
    expect(or).toBe('or(col1.ilike."%t45%",col2.ilike."%t45%")');
    
    const orMulti = ilikeOr(['col1'], '', ['%A%', '%B%']);
    expect(orMulti).toBe('or(col1.ilike."%A%"),or(col1.ilike."%B%")');
  });

  it('ilikeOr retorna string vazia sem padrão nem tokens', () => {
    expect(ilikeOr(['x'], '', [])).toBe('');
  });

  it('ilikeAnd aplica AND estrito entre tokens (ignora padrão se tokens existirem)', () => {
    const fakeQuery = { calls: [] as Array<[string, string]>, ilike(col: string, val: string) { this.calls.push([col, val]); return this; } };
    ilikeAnd(fakeQuery as any, 'nm_configuracao', '%foo%', ['%bar%', '%baz%']);
    expect(fakeQuery.calls).toEqual([
      ['nm_configuracao', '%bar%'],
      ['nm_configuracao', '%baz%'],
    ]);
  });

  it('ilikeAnd não emite nada se padrao e tokens vazios', () => {
    const fakeQuery = { calls: [] as Array<[string, string]>, ilike(col: string, val: string) { this.calls.push([col, val]); return this; } };
    ilikeAnd(fakeQuery as any, 'nm_configuracao', '', []);
    expect(fakeQuery.calls).toEqual([]);
  });
});
