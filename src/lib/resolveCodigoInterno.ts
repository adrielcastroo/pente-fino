import { supabase } from '@/integrations/supabase/client';
import { normalizarCodigo } from '@/lib/codigoFornecedor';

export interface CodigoResolvido {
  /** Código interno oficial (Pente Fino / Auge). Cai no código digitado quando não há match. */
  codigoInterno: string;
  descricao: string;
  /** Origem do match, para feedback ao usuário. */
  origem: 'cadastro' | 'auge' | 'nenhum';
}

/**
 * Converte um código digitado (que pode ser do fornecedor) no código interno correspondente.
 * Busca primeiro no cadastro interno (itens_cadastro) e, se não encontrar, no catálogo do Auge.
 * Nunca lança: em caso de falha retorna o próprio código informado.
 */
export async function resolverCodigoInterno(codigoDigitado: string): Promise<CodigoResolvido> {
  const bruto = (codigoDigitado || '').trim();
  const fallback: CodigoResolvido = { codigoInterno: bruto, descricao: '', origem: 'nenhum' };
  const norm = normalizarCodigo(bruto);
  if (!norm) return fallback;

  try {
    // 1) Cadastro interno — código interno OU qualquer código de fornecedor vinculado.
    const { data: cadastro } = await supabase
      .from('itens_cadastro')
      .select('codigo_interno, descricao, codigo_interno_normalizado, codigos_fornecedor_normalizado')
      .or(`codigo_interno_normalizado.eq.${norm},codigos_fornecedor_normalizado.cs.{${norm}}`)
      .limit(1);

    const hit = (cadastro as any[])?.[0];
    if (hit?.codigo_interno) {
      return { codigoInterno: hit.codigo_interno, descricao: hit.descricao || '', origem: 'cadastro' };
    }

    // 2) Catálogo do Auge — comparação normalizada em memória (poucos candidatos por prefixo).
    const { data: auge } = await supabase
      .from('auge_produtos')
      .select('codigo, descricao')
      .ilike('codigo', `%${bruto}%`)
      .limit(20);

    const match = ((auge as any[]) || []).find(p => normalizarCodigo(p.codigo) === norm);
    if (match) {
      return { codigoInterno: match.codigo, descricao: match.descricao || '', origem: 'auge' };
    }
  } catch (e) {
    console.warn('Falha ao resolver código interno:', e);
  }

  return fallback;
}
