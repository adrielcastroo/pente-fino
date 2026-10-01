/**
 * Regra de frete aplicada na importação do romaneio.
 *
 * Para clientes com valor mínimo de frete, somamos os pedidos do Auge
 * cuja data de expedição é igual à data do romaneio:
 *  - total >= mínimo → CIF (transportadora_cif)
 *  - total <  mínimo → FOB (transportadora_fob) e marca exceção
 * Sem valor mínimo → lógica por modalidade (comportamento anterior).
 * Instrução "Agrupar..." vinda da planilha sempre tem prioridade.
 */

export interface RegraFreteMin {
  codigo_cliente: string;
  nome_cliente: string;
  modalidade_frete: string | null;
  valor_minimo_frete: number | null;
  transportadora_cif: string | null;
  transportadora_fob: string | null;
}

export interface PedidoAugeMin {
  cd_pedido: string;
  nome_cliente: string;
  codigo_cliente: string | null;
  vl_total: number;
  situacao: string | null;
}

export type SituacaoMinimo = 'atingido' | 'abaixo' | 'sem_pedidos' | 'sem_minimo' | 'sem_regra' | 'instrucao';

export interface DecisaoFrete {
  transportadora: string;
  modalidade: string;
  situacao: SituacaoMinimo;
  valorPedidos: number | null;
  valorMinimo: number | null;
  qtdPedidos: number;
  pedidos: string[];
  flagExcecao: boolean;
}

/** Normaliza nomes/códigos para comparação (sem acento, pontuação, caixa). */
export function normalizarChave(v: string | null | undefined): string {
  return String(v ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

const SITUACOES_CANCELADAS = new Set(['CANCELADO', 'CANCELADA', '99']);

/** Pedidos do cliente: casa por código (quando o Auge envia) ou por nome normalizado. */
export function pedidosDoCliente(
  pedidos: PedidoAugeMin[],
  codigoCliente: string,
  nomes: Array<string | null | undefined>,
): PedidoAugeMin[] {
  const cod = normalizarChave(codigoCliente);
  const chavesNome = new Set(nomes.map(normalizarChave).filter(Boolean));
  const vistos = new Set<string>();
  return pedidos.filter((p) => {
    if (SITUACOES_CANCELADAS.has(normalizarChave(p.situacao))) return false;
    const casa = (cod && p.codigo_cliente && normalizarChave(p.codigo_cliente) === cod)
      || chavesNome.has(normalizarChave(p.nome_cliente));
    if (!casa || vistos.has(p.cd_pedido)) return false;
    vistos.add(p.cd_pedido);
    return true;
  });
}

function porModalidade(regra: RegraFreteMin): { transportadora: string; modalidade: string } {
  const mod = (regra.modalidade_frete ?? '').toUpperCase();
  if (mod.startsWith('FOB')) return { transportadora: regra.transportadora_fob ?? '', modalidade: 'FOB' };
  if (mod.startsWith('CIF') && !mod.includes('FOB')) return { transportadora: regra.transportadora_cif ?? '', modalidade: 'CIF' };
  return { transportadora: regra.transportadora_cif || regra.transportadora_fob || '', modalidade: regra.transportadora_cif ? 'CIF' : 'FOB' };
}

export function decidirFrete(params: {
  codigoCliente: string;
  nomeCliente: string;
  transportadorPlanilha: string;
  regra: RegraFreteMin | undefined;
  pedidos: PedidoAugeMin[] | null; // null = consulta não realizada
}): DecisaoFrete {
  const { codigoCliente, nomeCliente, transportadorPlanilha, regra, pedidos } = params;
  const base = { valorPedidos: null, valorMinimo: regra?.valor_minimo_frete ?? 0, qtdPedidos: 0, pedidos: [], flagExcecao: false };
  const orig = (transportadorPlanilha ?? '').trim();

  if (orig && /agrup|instru/i.test(orig)) {
    return { ...base, transportadora: orig, modalidade: '', situacao: 'instrucao' };
  }
  if (!regra) {
    return { ...base, transportadora: orig, modalidade: '', situacao: 'sem_regra' };
  }
  const minimo = Number(regra.valor_minimo_frete ?? 0);
  if (pedidos === null) {
    return { ...base, ...porModalidade(regra), situacao: 'sem_minimo' };
  }
  if (!(minimo > 0)) {
    return { ...base, ...porModalidade(regra), situacao: 'sem_minimo', transportadora: regra.transportadora_cif || regra.transportadora_fob || orig };
  }

  const doCliente = pedidosDoCliente(pedidos, codigoCliente, [nomeCliente, regra.nome_cliente]);
  const total = Math.round(doCliente.reduce((s, p) => s + (Number(p.vl_total) || 0), 0) * 100) / 100;
  const info = { valorPedidos: total, valorMinimo: minimo, qtdPedidos: doCliente.length, pedidos: doCliente.map((p) => p.cd_pedido) };

  if (doCliente.length === 0) {
    return { ...info, transportadora: regra.transportadora_fob || regra.transportadora_cif || orig, modalidade: 'FOB', situacao: 'sem_pedidos', flagExcecao: true };
  }
  if (total >= minimo) {
    return { ...info, transportadora: regra.transportadora_cif || regra.transportadora_fob || orig, modalidade: 'CIF', situacao: 'atingido', flagExcecao: false };
  }
  return { ...info, transportadora: regra.transportadora_fob || regra.transportadora_cif || orig, modalidade: 'FOB', situacao: 'abaixo', flagExcecao: true };
}

/** Data mais frequente (AAAA-MM-DD) entre as linhas; fallback hoje. */
export function dataPredominante(datas: Array<string | undefined>): string {
  const cont = new Map<string, number>();
  for (const d of datas) if (d && /^\d{4}-\d{2}-\d{2}$/.test(d)) cont.set(d, (cont.get(d) ?? 0) + 1);
  let melhor = '';
  let max = 0;
  cont.forEach((n, d) => { if (n > max) { max = n; melhor = d; } });
  if (melhor) return melhor;
  const h = new Date();
  return `${h.getFullYear()}-${String(h.getMonth() + 1).padStart(2, '0')}-${String(h.getDate()).padStart(2, '0')}`;
}

export const SITUACAO_LABEL: Record<SituacaoMinimo, string> = {
  atingido: 'Mínimo atingido',
  abaixo: 'Abaixo do mínimo',
  sem_pedidos: 'Sem pedidos na data',
  sem_minimo: 'Sem valor mínimo',
  sem_regra: 'Sem regra',
  instrucao: 'Instrução da planilha',
};
