import { describe, it, expect } from 'vitest';

// Simulação das funções de utilidade de src/components/acabamentos/GerarTagTab.tsx
// para testar a lógica pura de filtragem.

function sanitizeTerm(raw: string): string {
  return raw.replace(/[,()"'\\]/g, ' ').replace(/\s+/g, ' ').trim();
}

function toIlikePattern(raw: string): string {
  const clean = sanitizeTerm(raw);
  if (!clean) return '';
  const escaped = clean.replace(/%/g, ' ').replace(/\s+/g, ' ').trim();
  if (escaped.includes('*')) return escaped.replace(/\*/g, '%');
  return `%${escaped}%`;
}

function toIlikeTokens(raw: string): string[] {
  const clean = sanitizeTerm(raw).replace(/%/g, ' ');
  return clean
    .split(/[\s*]+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 1)
    .slice(0, 12)
    .map((t) => `%${t}%`);
}

const matchesIlike = (text: string, pattern: string) => {
  if (!pattern) return true;
  // Normalizamos ambos para ignorar acentos e case
  const normText = (text || "").toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const normPattern = (pattern || "").toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  
  // Converte padrão ILIKE (%termo%) para Regex
  // Escapa caracteres especiais de regex, mas trata % e * como .*
  const escaped = normPattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/[%*]/g, '.*');
  const regex = new RegExp(`^${escaped}$`, 'i');
  return regex.test(normText);
};

describe('GerarTagTab - Lógica de Filtragem do Resumo', () => {
  const configuracoes = [
    { nm_configuracao: 'Rollo Pro T45 Branco' },
    { nm_configuracao: 'Cortina CM-35 Liso' },
    { nm_configuracao: 'Persiana Cinza T35' },
    { nm_configuracao: 'Kit 10% Desconto' },
    { nm_configuracao: 'Persiana Alumínio 25mm' },
    { nm_configuracao: 'Rollo Light T55' }
  ];

  it('deve encontrar itens ignorando case e acentos', () => {
    const termo = 'aluminio';
    const padrao = toIlikePattern(termo);
    const resultado = configuracoes.filter(c => matchesIlike(c.nm_configuracao, padrao));
    
    expect(resultado.length).toBe(1);
    expect(resultado[0].nm_configuracao).toBe('Persiana Alumínio 25mm');
  });

  it('deve lidar corretamente com o curinga * (AND tokens)', () => {
    const termo = 'cortina*35';
    const tokens = toIlikeTokens(termo);
    const resultado = configuracoes.filter(cfg => {
      const nm = cfg.nm_configuracao;
      return tokens.every(t => matchesIlike(nm, t));
    });
    
    expect(resultado.length).toBe(1);
    expect(resultado[0].nm_configuracao).toBe('Cortina CM-35 Liso');
  });

  it('deve encontrar termos colados usando tokens', () => {
    const termo = 'T35';
    const padrao = toIlikePattern(termo);
    const resultado = configuracoes.filter(c => matchesIlike(c.nm_configuracao, padrao));
    
    expect(resultado.length).toBe(1);
    expect(resultado[0].nm_configuracao).toBe('Persiana Cinza T35');
  });

  it('deve lidar com caracteres especiais como %', () => {
    const termo = '10%';
    const padrao = toIlikePattern(termo);
    const resultado = configuracoes.filter(c => matchesIlike(c.nm_configuracao, padrao));
    
    expect(resultado.length).toBe(1);
    expect(resultado[0].nm_configuracao).toBe('Kit 10% Desconto');
  });

  it('deve funcionar com múltiplos curingas em ordem livre', () => {
    const termo = 'T45*rollo*branco';
    const tokens = toIlikeTokens(termo);
    const resultado = configuracoes.filter(cfg => {
      const nm = cfg.nm_configuracao;
      return tokens.every(t => matchesIlike(nm, t));
    });
    
    expect(resultado.length).toBe(1);
    expect(resultado[0].nm_configuracao).toBe('Rollo Pro T45 Branco');
  });
});
