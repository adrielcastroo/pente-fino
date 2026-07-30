import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';
import {
  CheckCircle2, Download, FileSpreadsheet, History, Loader2, PackageCheck,
  RefreshCw, Search, Truck, Upload, X,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/* Tipos                                                               */
/* ------------------------------------------------------------------ */

export type Etapa = 'pendente' | 'entregue_logistica' | 'recebido_logistica' | 'finalizada';

export interface ProcessoRow {
  id: string;
  id_externo: string;
  observacao: string | null;
  nr_portal: string | null;
  situacao_importada: string | null;
  qt_item: number | null;
  dt_criacao: string | null;
  usuario_criacao: string | null;
  nr_entrada_sap: string | null;
  etapa: Etapa;
  entregue_em: string | null;
  recebido_em: string | null;
  finalizado_em: string | null;
  created_at: string;
  updated_at: string;
}

interface ImportRow {
  id_externo: string;
  observacao: string | null;
  nr_portal: string | null;
  situacao_importada: string | null;
  qt_item: number | null;
  dt_criacao: string | null;
  usuario_criacao: string | null;
  nr_entrada_sap: string | null;
  /** Marcações vindas da planilha simplificada (Nº Entrada SAP + ações). */
  marcar_entregar?: boolean;
  marcar_receber?: boolean;
  /** false quando o Nº Entrada SAP não corresponde a nenhuma transferência. */
  resolvido?: boolean;
}

interface ResultadoLogistica {
  id: string;
  acao: 'Entregar' | 'Receber' | 'Processar';
  ok: boolean;
  mensagem: string;
  caixasMarcadas?: string[];
  ignorado?: boolean;
}


/** Situação do Auge — 20 = Efetivado ("verdinho"). */
const SITUACAO_EFETIVADO = '20';

const ETAPA_LABEL: Record<Etapa, string> = {
  pendente: 'Pendente',
  entregue_logistica: 'Com a logística',
  recebido_logistica: 'Recebida da logística',
  finalizada: 'Finalizada',
};

const ETAPA_CLASS: Record<Etapa, string> = {
  pendente: 'bg-muted text-muted-foreground border border-border',
  entregue_logistica: 'bg-amber-500/10 text-warning border border-amber-500/20',
  recebido_logistica: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20',
  finalizada: 'bg-emerald-500/10 text-success border border-emerald-500/20',
};

/* ------------------------------------------------------------------ */
/* Parsing da planilha                                                 */
/* ------------------------------------------------------------------ */

const norm = (s: unknown) =>
  String(s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

type CampoPlanilha =
  | 'id_externo' | 'nr_portal' | 'observacao' | 'situacao_importada'
  | 'qt_item' | 'dt_criacao' | 'usuario_criacao' | 'nr_entrada_sap'
  | 'marcar_entregar' | 'marcar_receber';

const ALIASES: Record<CampoPlanilha, string[]> = {
  id_externo: [
    'no transferencia', 'n transferencia', 'numero transferencia', 'transferencia',
    'no rascunho', 'n rascunho', 'rascunho', 'documento', 'cd movimentacao',
    'cdmovimentacao', 'no movimentacao', 'id', 'codigo',
  ],
  nr_portal: ['no portal', 'n portal', 'numero portal', 'portal'],
  observacao: ['observacao', 'obs', 'observacoes'],
  situacao_importada: ['situacao', 'status'],
  qt_item: ['qt item', 'qtd item', 'quantidade item', 'qt itens', 'qt', 'quantidade'],
  dt_criacao: ['dt criacao', 'data criacao', 'data de criacao', 'criacao'],
  usuario_criacao: ['usuario criacao', 'usuario de criacao', 'criado por', 'usuario'],
  nr_entrada_sap: [
    'no entrada sap', 'n entrada sap', 'numero entrada sap', 'entrada sap',
    'nr entrada sap', 'sap',
  ],
  marcar_entregar: [
    'entregar folha de transf p logistica', 'entregar folha de transf p logistica marcar',
    'entregar folha', 'entregar', 'entrega logistica', 'entregar logistica',
  ],
  marcar_receber: [
    'receber folha de transf da logistica', 'receber folha de transf da logistica marcar',
    'receber folha', 'receber', 'recebimento logistica', 'receber logistica',
  ],
};

/** Valores aceitos como "marcar" nas colunas de ação. */
const MARCADORES = new Set(['marcar', 'x', 'sim', 's', 'ok', '1', 'true', 'v', 'marcado']);
const isMarcado = (raw: unknown) => MARCADORES.has(norm(raw));

/** Cabeçalhos e exemplos do modelo oferecido para download. */
const MODELO_HEADERS = [
  'Nº Entrada SAP',
  'Entregar folha de transf. p/ logística',
  'Receber folha de transf. da logística',
] as const;

const MODELO_EXEMPLOS: (string | number)[][] = [
  ['198857', 'Marcar', 'Marcar'],
  ['198858', 'Marcar', ''],
  ['198859', '', 'Marcar'],
];

/** Gera e baixa um .xlsx modelo com as colunas aceitas pelo importador. */
function baixarModelo() {
  const ws = XLSX.utils.aoa_to_sheet([[...MODELO_HEADERS], ...MODELO_EXEMPLOS]);
  ws['!cols'] = [{ wch: 18 }, { wch: 38 }, { wch: 38 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Folhas');
  XLSX.writeFile(wb, 'modelo-folhas-transferencia.xlsx');
}




function findKey(headers: string[], aliases: string[]): string | null {
  const wanted = new Set(aliases);
  for (const h of headers) if (wanted.has(norm(h))) return h;
  // fallback: header que contenha algum alias
  for (const h of headers) {
    const n = norm(h);
    for (const a of aliases) if (n.includes(a)) return h;
  }
  return null;
}

function toDateISO(raw: unknown): string | null {
  if (raw == null || raw === '') return null;
  if (raw instanceof Date && !Number.isNaN(raw.getTime())) {
    return raw.toISOString().slice(0, 10);
  }
  const s = String(raw).trim();
  const br = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (br) {
    const ano = br[3].length === 2 ? `20${br[3]}` : br[3];
    return `${ano}-${br[2].padStart(2, '0')}-${br[1].padStart(2, '0')}`;
  }
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return iso ? iso[0] : null;
}

function toNumber(raw: unknown): number | null {
  if (raw == null || raw === '') return null;
  const n = Number(String(raw).trim().replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

const txt = (raw: unknown): string | null => {
  const s = String(raw ?? '').trim();
  return s === '' ? null : s;
};

const MAX_FILE_BYTES = 10 * 1024 * 1024;

function parseWorkbook(
  buffer: ArrayBuffer,
): { rows: ImportRow[]; ignoradas: number; modoSap: boolean } {
  const wb = XLSX.read(buffer, { type: 'array', cellDates: true });
  const ws = wb.Sheets[wb.SheetNames[0]];
  if (!ws) throw new Error('Planilha vazia.');
  const json: Record<string, unknown>[] = XLSX.utils.sheet_to_json(ws, { defval: '' });
  if (!json.length) return { rows: [], ignoradas: 0, modoSap: false };

  const headers = Array.from(new Set(json.slice(0, 20).flatMap((r) => Object.keys(r))));
  const k = {
    id_externo: findKey(headers, ALIASES.id_externo),
    nr_portal: findKey(headers, ALIASES.nr_portal),
    observacao: findKey(headers, ALIASES.observacao),
    situacao_importada: findKey(headers, ALIASES.situacao_importada),
    qt_item: findKey(headers, ALIASES.qt_item),
    dt_criacao: findKey(headers, ALIASES.dt_criacao),
    usuario_criacao: findKey(headers, ALIASES.usuario_criacao),
    nr_entrada_sap: findKey(headers, ALIASES.nr_entrada_sap),
    marcar_entregar: findKey(headers, ALIASES.marcar_entregar),
    marcar_receber: findKey(headers, ALIASES.marcar_receber),
  };

  // Nº da transferência: coluna própria ou, na ausência, o Nº Portal.
  const keyId = k.id_externo ?? k.nr_portal;
  // Modelo simplificado: só o Nº Entrada SAP + colunas de ação.
  const modoSap = !keyId && !!k.nr_entrada_sap;

  if (!keyId && !modoSap) {
    throw new Error(
      `Não encontrei a coluna do nº da transferência nem do Nº Entrada SAP. Colunas lidas: ${headers.join(', ')}`,
    );
  }

  const byId = new Map<string, ImportRow>();
  let ignoradas = 0;
  for (const r of json) {
    const nr_entrada_sap = k.nr_entrada_sap ? txt(r[k.nr_entrada_sap]) : null;
    const id_externo = keyId ? txt(r[keyId]) : null;
    const chave = modoSap ? nr_entrada_sap : id_externo;
    if (!chave) { ignoradas++; continue; }
    byId.set(chave, {
      id_externo: id_externo ?? '',
      nr_portal: k.nr_portal ? txt(r[k.nr_portal]) : null,
      observacao: k.observacao ? txt(r[k.observacao]) : null,
      situacao_importada: k.situacao_importada ? txt(r[k.situacao_importada]) : null,
      qt_item: k.qt_item ? toNumber(r[k.qt_item]) : null,
      dt_criacao: k.dt_criacao ? toDateISO(r[k.dt_criacao]) : null,
      usuario_criacao: k.usuario_criacao ? txt(r[k.usuario_criacao]) : null,
      nr_entrada_sap,
      marcar_entregar: k.marcar_entregar ? isMarcado(r[k.marcar_entregar]) : false,
      marcar_receber: k.marcar_receber ? isMarcado(r[k.marcar_receber]) : false,
      resolvido: !modoSap,
    });
  }
  return { rows: Array.from(byId.values()), ignoradas, modoSap };
}


/* ------------------------------------------------------------------ */
/* Componente                                                          */
/* ------------------------------------------------------------------ */

export default function ProcessoTransferenciaCard() {
  const [processos, setProcessos] = useState<ProcessoRow[]>([]);
  const [efetivadas, setEfetivadas] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [preview, setPreview] = useState<ImportRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [parsing, setParsing] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [resultados, setResultados] = useState<ResultadoLogistica[]>([]);
  /** Etapa sendo aplicada no momento (bloqueia os botões em lote). */
  const [aplicando, setAplicando] = useState<Etapa | null>(null);
  /** Replica a ação de entrega/recebimento diretamente no Auge. */
  const [sincAuge, setSincAuge] = useState(true);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const montadoRef = useRef(true);

  useEffect(() => {
    montadoRef.current = true;
    return () => { montadoRef.current = false; };
  }, []);

  /** Carrega processos + cruza com o Auge para saber quem está "verdinho". */
  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('transferencia_folha_processos')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(2000);
      if (error) throw error;
      const rows = (data ?? []) as ProcessoRow[];

      let verdes = new Set<string>();
      if (rows.length) {
        const ids = rows.map((r) => r.id_externo);
        const { data: transf, error: e2 } = await supabase
          .from('auge_transferencias')
          .select('id_externo,situacao,nr_efetivacao')
          .in('id_externo', ids)
          .eq('situacao', SITUACAO_EFETIVADO);
        if (e2) throw e2;
        verdes = new Set((transf ?? []).map((t) => String(t.id_externo)));

        // Fecha automaticamente o processo das transferências já efetivadas.
        const paraFechar = rows.filter((r) => verdes.has(r.id_externo) && r.etapa !== 'finalizada');
        if (paraFechar.length) {
          const agora = new Date().toISOString();
          await supabase
            .from('transferencia_folha_processos')
            .update({ etapa: 'finalizada', finalizado_em: agora })
            .in('id', paraFechar.map((r) => r.id));
          for (const r of paraFechar) { r.etapa = 'finalizada'; r.finalizado_em = agora; }
        }
      }

      if (!montadoRef.current) return;
      setEfetivadas(verdes);
      setProcessos(rows);
    } catch (e) {
      if (montadoRef.current) {
        toast.error(e instanceof Error ? e.message : 'Falha ao carregar processos.');
      }
    } finally {
      if (montadoRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => { void carregar(); }, [carregar]);

  /* ---------------- Importação ---------------- */

  const limparPreview = () => { setPreview([]); setFileName(''); };

  /**
   * O Auge identifica a folha pelo código numérico da transferência
   * (`cdTransferenciaEstoque`, exibido como "Nº Portal").
   * Já `id_externo` no nosso banco é uma chave composta por item
   * (`transf-php:180641:item:0:TC.000.050`) — enviá-la ao Auge não marca nada.
   * Este helper extrai sempre o código numérico correto.
   */
  const codigoAuge = (
    r: { nr_portal?: string | null; nr_entrada_sap?: string | null; id_externo?: string | null },
    idLogistica: 1 | 2,
  ): string | null => {
    // No endpoint legado, cada ícone usa uma chave diferente:
    // entregar (roxo) = Nº Portal; receber (verde) = Nº Entrada SAP.
    const entradaSap = String(r.nr_entrada_sap ?? '').trim();
    if (idLogistica === 2 && /^\d+$/.test(entradaSap)) return entradaSap;
    const portal = String(r.nr_portal ?? '').trim();
    if (/^\d+$/.test(portal)) return portal;
    const ext = String(r.id_externo ?? '').trim();
    if (/^\d+$/.test(ext)) return ext;
    const m = ext.match(/(?:^|:)(\d{4,})(?::|$)/);
    return m ? m[1] : null;
  };

  /**
   * Replica marcações de logística no Auge em blocos pequenos.
   * Cada id gera 1-2 requisições HTTP na edge function; lotes grandes em uma
   * única chamada estouravam o limite de CPU/memória, derrubando a resposta.
   */
  const sincronizarLogistica = async (
    idsBrutos: string[],
    idLogistica: 1 | 2,
  ): Promise<{ falhas: number; pendentes: number; invalidos: number; resultados: ResultadoLogistica[] }> => {
    const ids = Array.from(new Set(idsBrutos.filter((v) => /^\d+$/.test(v))));
    const invalidos = new Set(idsBrutos).size - ids.length;
    const TAMANHO_BLOCO = 8;
    let falhas = 0;
    let pendentes = 0;
    const detalhes: ResultadoLogistica[] = [];
    for (let i = 0; i < ids.length; i += TAMANHO_BLOCO) {
      const bloco = ids.slice(i, i + TAMANHO_BLOCO);
      const { data, error } = await supabase.functions.invoke('auge-sync', {
        body: { action: 'transferencia_logistica', ids: bloco, idLogistica, desejado: true },
      });
      if (error) throw error;
      if (data?.disabled || data?.error) throw new Error(data.error || 'Ação recusada pelo Auge.');
      const recebidos = Array.isArray(data?.resultados) ? data.resultados : [];
      for (const resultado of recebidos as Array<{ id: string; ok: boolean; marcado?: boolean; erro?: string }>) {
        if (!resultado.ok) falhas += 1;
        detalhes.push({
          id: resultado.id,
          acao: idLogistica === 1 ? 'Entregar' : 'Receber',
          ok: resultado.ok && resultado.marcado === true,
          mensagem: resultado.ok && resultado.marcado === true
            ? 'Confirmado pelo Auge'
            : (resultado.erro || 'O Auge não confirmou a marcação'),
        });
      }
      const naoProcessados = Array.isArray(data?.nao_processados) ? data.nao_processados as string[] : [];
      pendentes += naoProcessados.length;
      detalhes.push(...naoProcessados.map((id) => ({
        id,
        acao: idLogistica === 1 ? 'Entregar' as const : 'Receber' as const,
        ok: false,
        mensagem: 'Não processado no limite desta execução',
      })));
    }
    return { falhas, pendentes, invalidos, resultados: detalhes };
  };

  /**
   * Garante as duas caixas por Nº Entrada SAP sem desfazer marcações existentes.
   * A Edge Function consulta o estado atual e resolve internamente o
   * cdMovEstoqueERP exigido pelo endpoint de toggle do Auge.
   */
  const processarLogisticaPorSap = async (rows: ImportRow[]): Promise<ResultadoLogistica[]> => {
    const codigos = Array.from(new Set(
      rows.map((r) => String(r.nr_entrada_sap ?? '').trim()).filter((v) => /^\d+$/.test(v)),
    ));
    const detalhes: ResultadoLogistica[] = [];
    const TAMANHO_BLOCO = 8;
    for (let i = 0; i < codigos.length; i += TAMANHO_BLOCO) {
      const bloco = codigos.slice(i, i + TAMANHO_BLOCO);
      const { data, error } = await supabase.functions.invoke('auge-sync', {
        body: { action: 'transferencia_logistica_processar', codigosSap: bloco },
      });
      if (error) throw error;
      const recebidos = Array.isArray(data?.resultados) ? data.resultados : [];
      for (const resultado of recebidos as Array<{
        nrEntradaSap: string;
        cdMovEstoqueERP?: string;
        nrPortal?: string | null;
        ok: boolean;
        ignorado?: boolean;
        caixasMarcadas?: string[];
        erro?: string;
      }>) {
        const caixas = resultado.caixasMarcadas ?? [];
        detalhes.push({
          id: resultado.nrEntradaSap,
          acao: 'Processar',
          ok: resultado.ok,
          ignorado: resultado.ignorado,
          caixasMarcadas: caixas,
          mensagem: resultado.ok
            ? resultado.ignorado
              ? 'As duas caixas já estavam marcadas; nenhuma alteração necessária.'
              : `Marcada(s): ${caixas.join(' e ')}. Código interno Auge: ${resultado.cdMovEstoqueERP ?? '—'}.`
            : (resultado.erro || 'O Auge não confirmou as duas caixas.'),
        });
      }
    }
    return detalhes;
  };



  /**
   * Resolve as linhas do modelo simplificado: descobre a transferência
   * correspondente a cada Nº Entrada SAP consultando `auge_transferencias`.
   */
  const resolverPorSap = async (rows: ImportRow[]): Promise<ImportRow[]> => {
    const saps = Array.from(new Set(rows.map((r) => r.nr_entrada_sap).filter(Boolean) as string[]));
    if (!saps.length) return rows;
    const { data, error } = await supabase
      .from('auge_transferencias')
      .select('id_externo,nr_efetivacao,documento,observacao,quantidade,usuario_criacao,data_movimento,situacao')
      .in('nr_efetivacao', saps);
    if (error) throw error;

    const porSap = new Map<string, (typeof data)[number]>();
    for (const t of data ?? []) {
      const key = String(t.nr_efetivacao ?? '').trim();
      if (key && !porSap.has(key)) porSap.set(key, t);
    }

    return rows.map((r) => {
      const t = r.nr_entrada_sap ? porSap.get(r.nr_entrada_sap) : undefined;
      if (!t) return { ...r, resolvido: false };
      return {
        ...r,
        id_externo: String(t.id_externo),
        nr_portal: r.nr_portal ?? (t.documento ? String(t.documento) : null),
        observacao: r.observacao ?? t.observacao ?? null,
        situacao_importada: r.situacao_importada ?? t.situacao ?? null,
        qt_item: r.qt_item ?? (t.quantidade != null ? Number(t.quantidade) : null),
        dt_criacao: r.dt_criacao ?? (t.data_movimento ? String(t.data_movimento).slice(0, 10) : null),
        usuario_criacao: r.usuario_criacao ?? t.usuario_criacao ?? null,
        resolvido: true,
      };
    });
  };

  const handleFile = async (file: File) => {
    if (file.size > MAX_FILE_BYTES) {
      toast.error('Arquivo excede 10 MB.');
      return;
    }
    setFileName(file.name);
    setParsing(true);
    try {
      const parsed = parseWorkbook(await file.arrayBuffer());
      const { ignoradas, modoSap } = parsed;
      let rows = parsed.rows;
      if (modoSap) rows = await resolverPorSap(rows);

      setPreview(rows);
      const naoResolvidas = rows.filter((r) => r.resolvido === false).length;
      if (!rows.length) toast.warning('Nenhuma linha válida encontrada.');
      else if (naoResolvidas) {
        toast.warning(`${naoResolvidas} Nº Entrada SAP sem transferência correspondente no Auge.`);
      } else if (ignoradas) {
        toast.info(`${ignoradas} linha(s) sem identificação ignorada(s).`);
      }
    } catch (e) {
      setPreview([]);
      toast.error(e instanceof Error ? e.message : 'Falha ao ler a planilha.');
    } finally {
      setParsing(false);
    }
  };

  const registrarImportacao = async () => {
    const validas = preview.filter((r) => r.id_externo && r.resolvido !== false);
    if (!validas.length) {
      toast.warning('Nenhuma linha válida para registrar.');
      return;
    }
    setSalvando(true);
    setResultados([]);
    try {
      const { data: userRes } = await supabase.auth.getUser();
      const lote = crypto.randomUUID();
      const agora = new Date().toISOString();

      const etapaDe = (r: ImportRow): Etapa => {
        if (r.marcar_receber) return 'recebido_logistica';
        if (r.marcar_entregar) return 'entregue_logistica';
        return r.nr_entrada_sap ? 'recebido_logistica' : 'entregue_logistica';
      };

      const payload = validas.map((r) => {
        const etapa = etapaDe(r);
        return {
          id_externo: r.id_externo,
          nr_portal: r.nr_portal,
          observacao: r.observacao,
          situacao_importada: r.situacao_importada,
          qt_item: r.qt_item,
          dt_criacao: r.dt_criacao,
          usuario_criacao: r.usuario_criacao,
          nr_entrada_sap: r.nr_entrada_sap,
          lote_importacao: lote,
          importado_por: userRes?.user?.id ?? null,
          etapa,
          entregue_em: agora,
          recebido_em: etapa === 'recebido_logistica' ? agora : null,
        };
      });

      const { error } = await supabase
        .from('transferencia_folha_processos')
        .upsert(payload, { onConflict: 'id_externo' });
      if (error) throw error;

      // Por Nº Entrada SAP, consulta o estado real e garante as duas caixas.
      // Isso torna o processamento idempotente: itens já completos são pulados
      // e somente as caixas ainda falsas recebem o toggle.
      let houveFalhaAuge = false;
      if (sincAuge) {
        const semSap = validas.filter((r) => !/^\d+$/.test(String(r.nr_entrada_sap ?? '').trim())).length;
        if (semSap) toast.warning(`${semSap} linha(s) sem Nº Entrada SAP válido não foram enviadas ao Auge.`);
        const retorno = await processarLogisticaPorSap(validas);
        setResultados(retorno);
        const confirmadas = retorno.filter((r) => r.ok).length;
        const falharam = retorno.length - confirmadas;
        houveFalhaAuge = falharam > 0;
        if (falharam > 0) {
          toast.warning(`${confirmadas} ação(ões) confirmada(s); ${falharam} falharam.`);
        } else if (confirmadas > 0) {
          toast.success(`${confirmadas} ação(ões) confirmada(s) diretamente pelo Auge.`);
        }
      }


      if (!houveFalhaAuge) {
        toast.success(`${payload.length} transferência(s) registrada(s).`);
      }
      limparPreview();
      await carregar();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Falha ao registrar.');
    } finally {
      setSalvando(false);
    }
  };


  /* ---------------- Ações em lote ---------------- */

  /**
   * Aplica a etapa localmente e, se habilitado, replica a ação no Auge
   * (idAcao=5 / idLogistica=1 entregar, 2 receber) via edge function.
   */
  const aplicarEtapa = async (etapa: Etapa) => {
    const ids = Array.from(sel);
    if (!ids.length) { toast.warning('Selecione ao menos uma transferência.'); return; }
    const linhas = processos.filter((r) => ids.includes(r.id));
    setAplicando(etapa);
    try {
      if (sincAuge && (etapa === 'entregue_logistica' || etapa === 'recebido_logistica')) {
        const idLogistica = etapa === 'entregue_logistica' ? 1 : 2;
        const externos = linhas.map((r) => codigoAuge(r, idLogistica)).filter(Boolean) as string[];
        const { falhas, pendentes, invalidos } = await sincronizarLogistica(
          externos,
          idLogistica,
        );
        if (invalidos) toast.warning(`${invalidos} linha(s) sem Nº Portal válido — não enviadas ao Auge.`);
        if (falhas) toast.warning(`${falhas} folha(s) não puderam ser marcadas no Auge.`);
        if (pendentes) toast.warning(`${pendentes} folha(s) não processadas — repita a ação para concluir.`);
      }

      const agora = new Date().toISOString();
      const patch: Partial<ProcessoRow> = { etapa };
      if (etapa === 'entregue_logistica') patch.entregue_em = agora;
      if (etapa === 'recebido_logistica') patch.recebido_em = agora;
      if (etapa === 'finalizada') patch.finalizado_em = agora;
      const { error } = await supabase
        .from('transferencia_folha_processos')
        .update(patch)
        .in('id', ids);
      if (error) throw error;
      toast.success(`${ids.length} atualizada(s) para "${ETAPA_LABEL[etapa]}".`);
      setSel(new Set());
      await carregar();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Falha ao aplicar etapa.');
    } finally {
      setAplicando(null);
    }
  };


  const salvarSap = async (id: string, valor: string) => {
    const nr = valor.trim() || null;
    const { error } = await supabase
      .from('transferencia_folha_processos')
      .update({ nr_entrada_sap: nr, recebido_em: nr ? new Date().toISOString() : null })
      .eq('id', id);
    if (error) { toast.error(error.message); return; }
    setProcessos((p) => p.map((r) => (r.id === id ? { ...r, nr_entrada_sap: nr } : r)));
  };

  /* ---------------- Derivados ---------------- */

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return processos;
    return processos.filter((r) =>
      [r.id_externo, r.nr_portal, r.observacao, r.nr_entrada_sap, r.usuario_criacao]
        .some((v) => (v ?? '').toLowerCase().includes(q)),
    );
  }, [processos, busca]);

  const emAndamento = useMemo(
    () => filtrados.filter((r) => r.etapa !== 'finalizada'),
    [filtrados],
  );
  const historico = useMemo(
    () => filtrados.filter((r) => r.etapa === 'finalizada' && efetivadas.has(r.id_externo)),
    [filtrados, efetivadas],
  );

  const toggle = (id: string) =>
    setSel((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  /* ---------------- Render ---------------- */

  return (
    <div className="space-y-4">
      {/* Importação */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileSpreadsheet className="h-4 w-4 text-primary" />
                Importar folhas de transferência
              </CardTitle>
              <CardDescription>
                Aceita <code>.xlsx</code>, <code>.csv</code> e <code>.ods</code>. Basta informar o
                <strong> Nº Entrada SAP</strong> e marcar as colunas
                “Entregar folha de transf. p/ logística” e/ou “Receber folha de transf. da logística”
                (escreva <code>Marcar</code> ou <code>X</code>). O app identifica a transferência
                correspondente no Auge e executa o processo indicado.
              </CardDescription>

            </div>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 gap-2"
              onClick={baixarModelo}
            >
              <Download className="h-3.5 w-3.5" />
              Baixar modelo
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const f = e.dataTransfer.files?.[0];
              if (f) void handleFile(f);
            }}
            className={`rounded-md border-2 border-dashed p-6 text-center transition-colors ${
              dragOver ? 'border-primary bg-primary/5' : 'border-border/60 bg-muted/20'
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls,.csv,.ods"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleFile(f);
                e.target.value = '';
              }}
            />
            {fileName ? (
              <div className="flex items-center justify-center gap-2 text-sm">
                <FileSpreadsheet className="h-4 w-4 text-primary" />
                <span className="font-mono">{fileName}</span>
                <button
                  onClick={limparPreview}
                  className="p-0.5 text-muted-foreground hover:text-destructive"
                  aria-label="Remover arquivo"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <>
                <Upload className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Arraste a planilha aqui ou{' '}
                  <button
                    onClick={() => inputRef.current?.click()}
                    className="font-semibold text-primary hover:underline"
                  >
                    escolha um arquivo
                  </button>
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground/60">até 10 MB</p>
              </>
            )}
          </div>

          {parsing && (
            <p className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Lendo planilha…
            </p>
          )}

          {preview.length > 0 && (
            <div className="overflow-hidden rounded-md border border-border/60">
              <div className="flex flex-wrap items-center justify-between gap-2 bg-muted/40 px-3 py-2 text-[11px]">
                <span className="font-semibold">{preview.length} linha(s)</span>
                <span className="font-mono text-muted-foreground">
                  {preview.filter((r) => r.marcar_entregar).length} entregar ·{' '}
                  {preview.filter((r) => r.marcar_receber).length} receber
                  {preview.some((r) => r.resolvido === false) && (
                    <span className="ml-2 text-destructive">
                      {preview.filter((r) => r.resolvido === false).length} não localizada(s)
                    </span>
                  )}
                </span>
              </div>
              <div className="max-h-64 divide-y divide-border/30 overflow-y-auto text-xs">
                {preview.slice(0, 200).map((r, i) => (
                  <div
                    key={`${r.nr_entrada_sap ?? ''}-${r.id_externo}-${i}`}
                    className="grid grid-cols-[100px_100px_1fr_auto] items-center gap-2 px-3 py-1.5"
                  >
                    <span className="font-mono text-muted-foreground">{r.nr_entrada_sap ?? '—'}</span>
                    <span className={`font-mono ${r.resolvido === false ? 'text-destructive' : ''}`}>
                      {r.id_externo || 'não localizada'}
                    </span>
                    <span className="truncate text-muted-foreground" title={r.observacao ?? ''}>
                      {r.observacao ?? '—'}
                    </span>
                    <span className="flex gap-1">
                      {r.marcar_entregar && (
                        <Badge variant="outline" className="h-5 px-1.5 text-[10px]">Entregar</Badge>
                      )}
                      {r.marcar_receber && (
                        <Badge variant="outline" className="h-5 px-1.5 text-[10px]">Receber</Badge>
                      )}
                    </span>
                  </div>
                ))}
                {preview.length > 200 && (
                  <div className="px-3 py-1.5 text-center text-muted-foreground">
                    … +{preview.length - 200} linhas
                  </div>
                )}
              </div>
            </div>
          )}

          {resultados.length > 0 && (
            <Alert variant={resultados.some((r) => !r.ok) ? 'destructive' : 'default'}>
              {resultados.every((r) => r.ok) ? <CheckCircle2 className="h-4 w-4" /> : <X className="h-4 w-4" />}
              <AlertTitle>
                {resultados.filter((r) => r.ok).length} de {resultados.length} ações confirmadas pelo Auge
              </AlertTitle>
              <AlertDescription>
                <div className="mt-2 max-h-40 space-y-1 overflow-y-auto font-mono text-xs">
                  {resultados.map((r, i) => (
                    <div key={`${r.id}-${r.acao}-${i}`} className="flex items-start justify-between gap-3">
                      <span>Nº Entrada SAP {r.id}</span>
                      <span className={r.ok ? 'text-success' : 'text-destructive'}>
                        {r.ok ? (r.ignorado ? 'Já estava completo' : r.mensagem) : r.mensagem}
                      </span>
                    </div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <Checkbox checked={sincAuge} onCheckedChange={(v) => setSincAuge(v === true)} />
              Refletir no Auge
            </label>
            <Button
              onClick={registrarImportacao}
              disabled={salvando || !preview.some((r) => r.id_externo && r.resolvido !== false)}
              className="gap-2"
            >
              {salvando ? <Loader2 className="h-4 w-4 animate-spin" /> : <PackageCheck className="h-4 w-4" />}
              Processar {preview.filter((r) => r.id_externo && r.resolvido !== false).length || ''}
            </Button>
          </div>

        </CardContent>
      </Card>

      {/* Em andamento */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Truck className="h-4 w-4 text-primary" />
                Processo em andamento
                <Badge variant="secondary">{emAndamento.length}</Badge>
              </CardTitle>
              <CardDescription>
                Folhas entregues à logística aguardando efetivação no Auge.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar…"
                  className="h-9 w-full pl-8 sm:w-56"
                />
              </div>
              <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => void carregar()}>
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline" size="sm" className="gap-2"
              disabled={!sel.size || aplicando !== null}
              onClick={() => void aplicarEtapa('entregue_logistica')}
            >
              {aplicando === 'entregue_logistica'
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <Truck className="h-3.5 w-3.5" />}
              Entregar folha p/ logística
            </Button>
            <Button
              variant="outline" size="sm" className="gap-2"
              disabled={!sel.size || aplicando !== null}
              onClick={() => void aplicarEtapa('recebido_logistica')}
            >
              {aplicando === 'recebido_logistica'
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <PackageCheck className="h-3.5 w-3.5" />}
              Receber folha da logística
            </Button>
            <label className="flex cursor-pointer items-center gap-2 text-[11px] text-muted-foreground">
              <Checkbox
                checked={sincAuge}
                onCheckedChange={(v) => setSincAuge(v === true)}
              />
              Refletir no Auge
            </label>
          </div>


          {loading ? (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : emAndamento.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nenhuma transferência em andamento.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-md border border-border/60">
              <table className="w-full min-w-[860px] text-xs">
                <thead className="bg-muted/40 text-[11px] uppercase text-muted-foreground">
                  <tr>
                    <th className="w-9 px-2 py-2" />
                    <th className="px-2 py-2 text-left">Nº Transf.</th>
                    <th className="px-2 py-2 text-left">Nº Portal</th>
                    <th className="px-2 py-2 text-left">Observação</th>
                    <th className="px-2 py-2 text-right">Qt. Item</th>
                    <th className="px-2 py-2 text-left">Dt. Criação</th>
                    <th className="px-2 py-2 text-left">Usuário</th>
                    <th className="px-2 py-2 text-left">Nº Entrada SAP</th>
                    <th className="px-2 py-2 text-left">Etapa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {emAndamento.map((r) => (
                    <tr key={r.id} className="hover:bg-muted/20">
                      <td className="px-2 py-1.5">
                        <Checkbox
                          checked={sel.has(r.id)}
                          onCheckedChange={() => toggle(r.id)}
                          aria-label={`Selecionar ${r.id_externo}`}
                        />
                      </td>
                      <td className="px-2 py-1.5 font-mono">{r.id_externo}</td>
                      <td className="px-2 py-1.5 font-mono text-muted-foreground">{r.nr_portal ?? '—'}</td>
                      <td className="max-w-[220px] truncate px-2 py-1.5" title={r.observacao ?? ''}>
                        {r.observacao ?? '—'}
                      </td>
                      <td className="px-2 py-1.5 text-right font-mono tabular-nums">{r.qt_item ?? '—'}</td>
                      <td className="px-2 py-1.5 font-mono text-muted-foreground">
                        {r.dt_criacao ? r.dt_criacao.split('-').reverse().join('/') : '—'}
                      </td>
                      <td className="px-2 py-1.5 text-muted-foreground">{r.usuario_criacao ?? '—'}</td>
                      <td className="px-2 py-1.5">
                        <Input
                          defaultValue={r.nr_entrada_sap ?? ''}
                          onBlur={(e) => void salvarSap(r.id, e.target.value)}
                          placeholder="—"
                          className="h-7 w-28 font-mono text-xs"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${ETAPA_CLASS[r.etapa]}`}>
                          {ETAPA_LABEL[r.etapa]}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Histórico — só o que ficou verdinho no Auge */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-4 w-4 text-primary" />
            Histórico de registro
            <Badge variant="secondary">{historico.length}</Badge>
          </CardTitle>
          <CardDescription>
            Somente transferências confirmadas como <strong>Efetivado</strong> no Auge.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {historico.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nenhuma transferência finalizada até o momento.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-md border border-border/60">
              <table className="w-full min-w-[760px] text-xs">
                <thead className="bg-muted/40 text-[11px] uppercase text-muted-foreground">
                  <tr>
                    <th className="px-2 py-2 text-left">Nº Transf.</th>
                    <th className="px-2 py-2 text-left">Observação</th>
                    <th className="px-2 py-2 text-right">Qt. Item</th>
                    <th className="px-2 py-2 text-left">Nº Entrada SAP</th>
                    <th className="px-2 py-2 text-left">Finalizada em</th>
                    <th className="px-2 py-2 text-left">Auge</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {historico.map((r) => (
                    <tr key={r.id} className="hover:bg-muted/20">
                      <td className="px-2 py-1.5 font-mono">{r.id_externo}</td>
                      <td className="max-w-[240px] truncate px-2 py-1.5" title={r.observacao ?? ''}>
                        {r.observacao ?? '—'}
                      </td>
                      <td className="px-2 py-1.5 text-right font-mono tabular-nums">{r.qt_item ?? '—'}</td>
                      <td className="px-2 py-1.5 font-mono">{r.nr_entrada_sap ?? '—'}</td>
                      <td className="px-2 py-1.5 font-mono text-muted-foreground">
                        {r.finalizado_em ? new Date(r.finalizado_em).toLocaleString('pt-BR') : '—'}
                      </td>
                      <td className="px-2 py-1.5">
                        <span className="inline-flex items-center gap-1 rounded border border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-success">
                          <CheckCircle2 className="h-3 w-3" /> Efetivado
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
