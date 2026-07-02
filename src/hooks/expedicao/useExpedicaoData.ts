import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type PickingStatus =
  | 'aguardando'
  | 'em_separacao'
  | 'em_conferencia'
  | 'conferido'
  | 'faturado'
  | 'cancelado';

export type CarrinhoStatus = 'livre' | 'em_uso' | 'manutencao';

export interface Picking {
  id: string;
  numero: string;
  cliente: string;
  cidade: string | null;
  regiao: string | null;
  transportadora_id: string | null;
  carrinho_id: string | null;
  status: PickingStatus;
  total_pecas: number;
  observacao: string | null;
  created_at: string;
  finished_at: string | null;
  cancelled_at?: string | null;
  cancelled_by?: string | null;
  motivo_cancelamento?: string | null;
  valor_estimado?: number | null;
  nfe_numero?: string | null;
  nfe_valor?: number | null;
  nfe_chave?: string | null;
  faturado_at?: string | null;
  transportadora?: { nome: string } | null;
  carrinho?: { codigo: string } | null;
}

export interface Carrinho {
  id: string;
  codigo: string;
  status: CarrinhoStatus;
  created_at: string;
}

export interface Transportadora {
  id: string;
  nome: string;
  ativo: boolean;
  created_at: string;
}

const KEYS = {
  pickings: ['expedicao', 'pickings'] as const,
  carrinhos: ['expedicao', 'carrinhos'] as const,
  transportadoras: ['expedicao', 'transportadoras'] as const,
};

export function usePickings() {
  return useQuery({
    queryKey: KEYS.pickings,
    queryFn: async (): Promise<Picking[]> => {
      const { data, error } = await supabase
        .from('expedicao_pickings')
        .select(
          '*, transportadora:expedicao_transportadoras(nome), carrinho:expedicao_carrinhos(codigo)'
        )
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as unknown as Picking[];
    },
    staleTime: 15_000,
  });
}

export function useCarrinhos() {
  return useQuery({
    queryKey: KEYS.carrinhos,
    queryFn: async (): Promise<Carrinho[]> => {
      const { data, error } = await supabase
        .from('expedicao_carrinhos')
        .select('*')
        .order('codigo');
      if (error) throw error;
      return (data ?? []) as Carrinho[];
    },
    staleTime: 30_000,
  });
}

export function useTransportadoras() {
  return useQuery({
    queryKey: KEYS.transportadoras,
    queryFn: async (): Promise<Transportadora[]> => {
      const { data, error } = await supabase
        .from('expedicao_transportadoras')
        .select('*')
        .order('nome');
      if (error) throw error;
      return (data ?? []) as Transportadora[];
    },
    staleTime: 60_000,
  });
}

export function useCreatePicking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      numero: string;
      cliente: string;
      cidade?: string;
      regiao?: string;
      transportadora_id?: string | null;
      observacao?: string;
    }) => {
      const { data, error } = await supabase
        .from('expedicao_pickings')
        .insert({
          numero: input.numero.trim().toUpperCase(),
          cliente: input.cliente.trim(),
          cidade: input.cidade?.trim() || null,
          regiao: input.regiao?.trim() || null,
          transportadora_id: input.transportadora_id || null,
          observacao: input.observacao?.trim() || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.pickings });
      toast.success('Picking criado');
    },
    onError: (e: any) => toast.error(e.message ?? 'Falha ao criar picking'),
  });
}

export function useCreateCarrinho() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (codigo: string) => {
      const { error } = await supabase
        .from('expedicao_carrinhos')
        .insert({ codigo: codigo.trim().toUpperCase() });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.carrinhos });
      toast.success('Carrinho cadastrado');
    },
    onError: (e: any) => toast.error(e.message ?? 'Falha ao cadastrar carrinho'),
  });
}

export function useCreateTransportadora() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (nome: string) => {
      const { error } = await supabase
        .from('expedicao_transportadoras')
        .insert({ nome: nome.trim() });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.transportadoras });
      toast.success('Transportadora cadastrada');
    },
    onError: (e: any) => toast.error(e.message ?? 'Falha ao cadastrar'),
  });
}

// ============================================================
// Fase 3 — Associação picking↔carrinho + Conferência de peças
// ============================================================

export interface PickingItem {
  id: string;
  picking_id: string;
  codigo_peca: string;
  descricao: string | null;
  qtd_prevista: number;
  qtd_bipada: number;
  bipado_at: string | null;
  bipado_por: string | null;
  created_at: string;
  updated_at: string;
}

export function usePickingByNumero(numero: string | null) {
  return useQuery({
    queryKey: ['expedicao', 'picking-by-numero', numero],
    enabled: !!numero,
    queryFn: async (): Promise<Picking | null> => {
      const { data, error } = await supabase
        .from('expedicao_pickings')
        .select('*, transportadora:expedicao_transportadoras(nome), carrinho:expedicao_carrinhos(codigo)')
        .eq('numero', (numero ?? '').trim().toUpperCase())
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as unknown as Picking | null;
    },
  });
}

export function usePickingItens(pickingId: string | null) {
  return useQuery({
    queryKey: ['expedicao', 'picking-itens', pickingId],
    enabled: !!pickingId,
    queryFn: async (): Promise<PickingItem[]> => {
      const { data, error } = await supabase
        .from('expedicao_picking_itens')
        .select('*')
        .eq('picking_id', pickingId!)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as PickingItem[];
    },
    staleTime: 5_000,
  });
}

export function useAssociarCarrinho() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { pickingNumero: string; carrinhoCodigo: string }) => {
      const numero = input.pickingNumero.trim().toUpperCase();
      const codigo = input.carrinhoCodigo.trim().toUpperCase();
      if (!numero || !codigo) throw new Error('Bipe o picking e o carrinho.');

      const { data: picking, error: errP } = await supabase
        .from('expedicao_pickings')
        .select('id, status, carrinho_id, numero')
        .eq('numero', numero)
        .maybeSingle();
      if (errP) throw errP;
      if (!picking) throw new Error(`Picking ${numero} não encontrado.`);
      if (['conferido', 'faturado', 'cancelado'].includes(picking.status)) {
        throw new Error(`Picking ${numero} já está ${picking.status}.`);
      }

      const { data: carrinho, error: errC } = await supabase
        .from('expedicao_carrinhos')
        .select('id, status, codigo')
        .eq('codigo', codigo)
        .maybeSingle();
      if (errC) throw errC;
      if (!carrinho) throw new Error(`Carrinho ${codigo} não cadastrado.`);
      if (carrinho.status === 'manutencao') throw new Error(`Carrinho ${codigo} em manutenção.`);
      if (carrinho.status === 'em_uso' && picking.carrinho_id !== carrinho.id) {
        throw new Error(`Carrinho ${codigo} já está em uso por outro picking.`);
      }

      const { error: errU } = await supabase
        .from('expedicao_pickings')
        .update({ carrinho_id: carrinho.id, status: 'em_separacao' })
        .eq('id', picking.id);
      if (errU) throw errU;

      const { error: errUC } = await supabase
        .from('expedicao_carrinhos')
        .update({ status: 'em_uso' })
        .eq('id', carrinho.id);
      if (errUC) throw errUC;

      return { picking_numero: numero, carrinho_codigo: codigo };
    },
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: KEYS.pickings });
      qc.invalidateQueries({ queryKey: KEYS.carrinhos });
      toast.success(`${r.picking_numero} ↔ ${r.carrinho_codigo}`);
    },
    onError: (e: any) => toast.error(e.message ?? 'Falha ao associar'),
  });
}

export async function bipPecaCall(pickingId: string, codigoPeca: string) {
  const codigo = codigoPeca.trim().toUpperCase();
  if (!codigo) throw new Error('Código vazio.');

  const { data: existente, error: errF } = await supabase
    .from('expedicao_picking_itens')
    .select('id, qtd_bipada, qtd_prevista')
    .eq('picking_id', pickingId)
    .eq('codigo_peca', codigo)
    .maybeSingle();
  if (errF) throw errF;

  const uid = (await supabase.auth.getUser()).data.user?.id ?? null;
  const now = new Date().toISOString();

  if (existente) {
    const { error } = await supabase
      .from('expedicao_picking_itens')
      .update({
        qtd_bipada: existente.qtd_bipada + 1,
        bipado_at: now,
        bipado_por: uid,
      })
      .eq('id', existente.id);
    if (error) throw error;
    return { codigo, novo: false };
  }

  const { error } = await supabase
    .from('expedicao_picking_itens')
    .insert({
      picking_id: pickingId,
      codigo_peca: codigo,
      qtd_prevista: 1,
      qtd_bipada: 1,
      bipado_at: now,
      bipado_por: uid,
    });
  if (error) throw error;
  return { codigo, novo: true };
}

export function useBipPeca() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { pickingId: string; codigoPeca: string }) =>
      bipPecaCall(input.pickingId, input.codigoPeca),
    onSuccess: (_r, vars) => {
      qc.invalidateQueries({ queryKey: ['expedicao', 'picking-itens', vars.pickingId] });
    },
    onError: (e: any) => toast.error(e.message ?? 'Falha ao bipar peça'),
  });
}

/**
 * Aloca uma peça (por código de etiqueta) em um carrinho (por código).
 * - Se a peça não existe em `expedicao_pecas`, é criada com status `no_carrinho`.
 * - Se já existe e ainda não foi alocada, é vinculada.
 * - Se já está no MESMO carrinho, no-op.
 * - Se está em OUTRO carrinho ou já conferida/faturada, lança erro.
 */
async function alocarPecaCall(codigoEtiqueta: string, codigoCarrinho: string) {
  const etq = codigoEtiqueta.trim();
  const codCar = codigoCarrinho.trim().toUpperCase();
  if (!etq) throw new Error('Etiqueta vazia');
  if (!codCar) throw new Error('Carrinho vazio');

  const { data: carrinho, error: errC } = await supabase
    .from('expedicao_carrinhos')
    .select('id, codigo, status')
    .eq('codigo', codCar)
    .maybeSingle();
  if (errC) throw errC;
  if (!carrinho) throw new Error(`Carrinho ${codCar} não encontrado`);

  const { data: peca, error: errP } = await supabase
    .from('expedicao_pecas')
    .select('id, status, carrinho_id, codigo_etiqueta')
    .eq('codigo_etiqueta', etq)
    .maybeSingle();
  if (errP) throw errP;

  const { data: userData } = await supabase.auth.getUser();
  const uid = userData.user?.id ?? null;
  const now = new Date().toISOString();

  // Nova peça — cria já alocada
  if (!peca) {
    const { data: nova, error } = await supabase
      .from('expedicao_pecas')
      .insert({
        codigo_etiqueta: etq,
        status: 'no_carrinho',
        carrinho_id: carrinho.id,
        embalador_id: uid,
        etiquetada_at: now,
        alocada_at: now,
      })
      .select('id, codigo_etiqueta')
      .single();
    if (error) throw error;
    return { peca: nova, carrinho, novo: true, reAlocado: false };
  }

  if (peca.status === 'cancelada') throw new Error('Etiqueta cancelada');
  if (peca.status === 'conferida' || peca.status === 'no_romaneio' || peca.status === 'faturada') {
    throw new Error(`Peça já ${peca.status.replace('_', ' ')} — não pode ser realocada`);
  }

  // Mesmo carrinho — no-op
  if (peca.carrinho_id === carrinho.id) {
    return { peca, carrinho, novo: false, reAlocado: false };
  }

  // Outro carrinho — bloqueio
  if (peca.carrinho_id && peca.carrinho_id !== carrinho.id) {
    const { data: outro } = await supabase
      .from('expedicao_carrinhos')
      .select('codigo')
      .eq('id', peca.carrinho_id)
      .maybeSingle();
    throw new Error(`Peça ${etq} já está no carrinho ${outro?.codigo ?? '???'}`);
  }

  // Etiquetada sem carrinho — vincula
  const { error: errU } = await supabase
    .from('expedicao_pecas')
    .update({
      carrinho_id: carrinho.id,
      status: 'no_carrinho',
      alocada_at: now,
    })
    .eq('id', peca.id);
  if (errU) throw errU;

  return { peca, carrinho, novo: false, reAlocado: false };
}

export function useAlocarPecaNoCarrinho() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { codigoEtiqueta: string; codigoCarrinho: string }) =>
      alocarPecaCall(input.codigoEtiqueta, input.codigoCarrinho),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ['expedicao_double_check', r.carrinho.id] });
      qc.invalidateQueries({ queryKey: ['expedicao', 'alert-counts'] });
    },
    onError: (e: any) => toast.error(e.message ?? 'Falha ao alocar peça'),
  });
}

export function useFaturarPicking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (pickingId: string) => {
      const { data: p, error: errP } = await supabase
        .from('expedicao_pickings')
        .select('id, status, carrinho_id')
        .eq('id', pickingId)
        .maybeSingle();
      if (errP) throw errP;
      if (!p) throw new Error('Picking não encontrado.');
      if (p.status !== 'conferido') throw new Error('Apenas pickings conferidos podem ser faturados.');

      const { error } = await supabase
        .from('expedicao_pickings')
        .update({ status: 'faturado', faturado_at: new Date().toISOString() } as never)
        .eq('id', pickingId);
      if (error) throw error;

      if (p.carrinho_id) {
        await supabase.from('expedicao_carrinhos').update({ status: 'livre' }).eq('id', p.carrinho_id);
        await supabase.from('expedicao_pickings').update({ carrinho_id: null }).eq('id', pickingId);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.pickings });
      qc.invalidateQueries({ queryKey: KEYS.carrinhos });
      toast.success('Picking faturado');
    },
    onError: (e: any) => toast.error(e.message ?? 'Falha ao faturar'),
  });
}


export function useFinalizarConferencia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (pickingId: string) => {
      const { error } = await supabase
        .from('expedicao_pickings')
        .update({ status: 'conferido', finished_at: new Date().toISOString() })
        .eq('id', pickingId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.pickings });
      toast.success('Conferência finalizada');
    },
    onError: (e: any) => toast.error(e.message ?? 'Falha ao finalizar'),
  });
}

export function useCancelarPicking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { pickingId: string; motivo: string; estorno?: boolean }) => {
      const motivo = input.motivo.trim();
      if (motivo.length < 5) throw new Error('Informe um motivo (mín. 5 caracteres).');

      const { data: p, error: errP } = await supabase
        .from('expedicao_pickings')
        .select('id, status, carrinho_id, numero')
        .eq('id', input.pickingId)
        .maybeSingle();
      if (errP) throw errP;
      if (!p) throw new Error('Picking não encontrado.');
      if (p.status === 'cancelado') throw new Error('Picking já está cancelado.');
      if (p.status === 'faturado' && !input.estorno) {
        throw new Error('Picking faturado exige estorno explícito.');
      }

      const uid = (await supabase.auth.getUser()).data.user?.id ?? null;
      const { error } = await supabase
        .from('expedicao_pickings')
        .update({
          status: 'cancelado',
          motivo_cancelamento: motivo,
          cancelled_at: new Date().toISOString(),
          cancelled_by: uid,
        })
        .eq('id', input.pickingId);
      if (error) throw error;

      if (p.carrinho_id) {
        await supabase.from('expedicao_carrinhos').update({ status: 'livre' }).eq('id', p.carrinho_id);
        await supabase.from('expedicao_pickings').update({ carrinho_id: null }).eq('id', input.pickingId);
      }

      return { numero: p.numero, estorno: !!input.estorno };
    },
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: KEYS.pickings });
      qc.invalidateQueries({ queryKey: KEYS.carrinhos });
      toast.success(r.estorno ? `Estorno de ${r.numero} concluído` : `Picking ${r.numero} cancelado`);
    },
    onError: (e: any) => toast.error(e.message ?? 'Falha ao cancelar'),
  });
}


// ============================================================
// Faturamento em lote + Importação de NF-e (XML)
// ============================================================

export function useFaturarEmLote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (pickingIds: string[]) => {
      if (pickingIds.length === 0) throw new Error('Selecione ao menos um picking.');
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('expedicao_pickings')
        .update({ status: 'faturado', faturado_at: now } as never)
        .in('id', pickingIds)
        .eq('status', 'conferido');
      if (error) throw error;

      const { data: ps } = await supabase
        .from('expedicao_pickings')
        .select('id, carrinho_id')
        .in('id', pickingIds);
      const carrinhoIds = (ps ?? []).map((p) => p.carrinho_id).filter(Boolean) as string[];
      if (carrinhoIds.length > 0) {
        await supabase.from('expedicao_carrinhos').update({ status: 'livre' }).in('id', carrinhoIds);
        await supabase.from('expedicao_pickings').update({ carrinho_id: null }).in('id', pickingIds);
      }
      return pickingIds.length;
    },
    onSuccess: (n) => {
      qc.invalidateQueries({ queryKey: KEYS.pickings });
      qc.invalidateQueries({ queryKey: KEYS.carrinhos });
      toast.success(`${n} picking(s) faturado(s)`);
    },
    onError: (e: any) => toast.error(e.message ?? 'Falha ao faturar em lote'),
  });
}

export interface NFeImportada {
  id: string;
  picking_id: string | null;
  numero: string;
  serie: string | null;
  chave_acesso: string;
  data_emissao: string | null;
  nome_destinatario: string | null;
  valor_total: number | null;
  valor_produtos: number | null;
  valor_frete: number | null;
  transportadora: string | null;
  volumes: number | null;
  imported_at: string;
}

export function useNFesImportadas() {
  return useQuery({
    queryKey: ['expedicao', 'nfes'],
    queryFn: async (): Promise<NFeImportada[]> => {
      const { data, error } = await (supabase as any)
        .from('nfe_importadas')
        .select('id, picking_id, numero, serie, chave_acesso, data_emissao, nome_destinatario, valor_total, valor_produtos, valor_frete, transportadora, volumes, imported_at')
        .order('imported_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as NFeImportada[];
    },
    staleTime: 15_000,
  });
}

export function useImportNFe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { nfe: import('@/lib/nfe-parser').NFeData; xmlRaw: string; pickingId: string | null }) => {
      const { nfe, xmlRaw, pickingId } = input;
      if (!nfe.chaveAcesso || nfe.chaveAcesso.length < 40) {
        throw new Error('Chave de acesso inválida no XML.');
      }
      const uid = (await supabase.auth.getUser()).data.user?.id ?? null;

      const { data: existing } = await (supabase as any)
        .from('nfe_importadas')
        .select('id')
        .eq('chave_acesso', nfe.chaveAcesso)
        .maybeSingle();
      if (existing) throw new Error(`NF-e ${nfe.numero} já foi importada.`);

      const { error } = await (supabase as any).from('nfe_importadas').insert({
        picking_id: pickingId,
        numero: nfe.numero,
        serie: nfe.serie || null,
        chave_acesso: nfe.chaveAcesso,
        data_emissao: nfe.dataEmissao || null,
        cnpj_emitente: nfe.cnpjEmitente || null,
        nome_emitente: nfe.nomeEmitente || null,
        cnpj_destinatario: nfe.cnpjDestinatario || null,
        nome_destinatario: nfe.nomeDestinatario || null,
        valor_total: nfe.valorTotal,
        valor_produtos: nfe.valorProdutos,
        valor_frete: nfe.valorFrete,
        transportadora: nfe.transportadora || null,
        volumes: nfe.volumes || null,
        peso_liquido: nfe.pesoLiquido || null,
        peso_bruto: nfe.pesoBruto || null,
        itens: nfe.itens,
        xml_raw: xmlRaw,
        imported_by: uid,
      });
      if (error) throw error;

      if (pickingId) {
        await supabase
          .from('expedicao_pickings')
          .update({
            nfe_numero: nfe.numero,
            nfe_valor: nfe.valorTotal,
            nfe_chave: nfe.chaveAcesso,
          } as never)
          .eq('id', pickingId);
      }
      return { numero: nfe.numero, valor: nfe.valorTotal };
    },
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: KEYS.pickings });
      qc.invalidateQueries({ queryKey: ['expedicao', 'nfes'] });
      toast.success(`NF-e ${r.numero} importada (${r.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})`);
    },
    onError: (e: any) => toast.error(e.message ?? 'Falha ao importar NF-e'),
  });
}
