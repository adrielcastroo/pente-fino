import { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { PageShell, PageHeader } from '@/components/expedicao/ui';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { CalendarClock, Loader2, PlayCircle, Search, Sparkles, CheckCircle2, XCircle, MinusCircle, ExternalLink, ArrowRight, Type, Plus, Boxes, Truck, Layers } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import NecessidadeCard from '@/components/admin/NecessidadeCard';
import NecessidadeCronCard from '@/components/admin/NecessidadeCronCard';
import KitsForroCard from '@/components/admin/KitsForroCard';

import ProcessoTransferenciaCard from '@/components/admin/ProcessoTransferenciaCard';


import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';


const AUGE_BASE_URL = 'https://unilux.auge.app';

type Acao = 'atualizar' | 'adicionar' | 'remover';

function extractEntregaApos(desc: string | null | undefined): string | null {
  if (!desc) return null;
  const m = desc.match(/\(\s*Ent[_ ]?Ap[_ ]?(\d{2}\/\d{2}\/\d{2,4})\s*\)/i);
  return m ? m[1] : null;
}

const ENT_AP_RE = /\s*\(\s*Ent[_ ]?Ap[_ ]?(\d{2}\/\d{2}\/\d{2,4})\s*\)\s*/gi;
const ABREV_RE = /\s*E\d{1,2}\/\d{1,2}\s*$/i;

function abbrevFromDate(data: string): string {
  const m = data.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (!m) return '';
  return `E${Number(m[1])}/${Number(m[2])}`;
}

function previewDescricao(desc: string, acao: Acao, novaData: string | null): string {
  const base = (desc || '').replace(ENT_AP_RE, ' ').replace(/\s+/g, ' ').trim();
  if (acao === 'remover' || !novaData) return base;
  return `${base} (Ent_Ap_${novaData})`;
}

function previewReduzida(reduz: string, acao: Acao, novaData: string | null): string {
  const base = (reduz || '').replace(ABREV_RE, '').trim();
  if (acao === 'remover' || !novaData) return base;
  return `${base}${abbrevFromDate(novaData)}`;
}

type PreviewRow = {
  cd_acabamento_item: number;
  cd_acabamento: number;
  chave_acabamento: string;
  nm_acabamento: string;
  cd_item_acabamento: string;
  descricao_atual: string;
  descricao_reduzida: string;
  entrega_apos_atual: string | null;
  cancelado: boolean;
  /** Código do item que originou a linha (o tecido pesquisado ou um kit vinculado). */
  origem_codigo?: string;
  /** Verdadeiro quando a linha veio de um kit com forro vinculado ao tecido. */
  origem_kit?: boolean;
};


type ExecResult = {
  status: 'ok' | 'erro' | 'ignorada';
  chave_acabamento: string;
  cd_acabamento_item: number;
  de?: string;
  para?: string;
  motivo?: string;
  campo?: string;
  erro?: string;
};

type ExecPayload = {
  ok: boolean;
  acao: Acao;
  codigo_item: string;
  nova_data: string | null;
  sucesso: number;
  falha: number;
  ignoradas: number;
  results: ExecResult[];
  abreviacao?: { status: string; dsAtual?: string; dsAbreviada?: string; campo?: string; erro?: string } | null;
};

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auge-sync?action=entrega_apos`;

async function callAugeEntregaApos(body: Record<string, unknown>) {
  const { data: session } = await supabase.auth.getSession();
  const token = session.session?.access_token;
  const anon = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY) as string;
  const resp = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: anon,
      Authorization: `Bearer ${token ?? anon}`,
    },
    body: JSON.stringify(body),
  });
  const txt = await resp.text();
  try { return JSON.parse(txt); } catch { return { ok: false, error: txt.slice(0, 400) }; }
}

function normalizeCodigo(v: string): string | null {
  const s = v.trim().toUpperCase();
  if (!s) return null;
  // Aceita qualquer tipo de código (interno, fornecedor, cd_item_acabamento, etc.).
  // O backend expande em variantes e consulta itens_cadastro para vincular.
  const m = s.match(/^([A-Z]{2})[\.\s-]?(\d{3})[\.\s-]?(\d{3})$/);
  if (m) return `${m[1]}.${m[2]}.${m[3]}`;
  return s;
}

function normalizeData(v: string): string | null {
  const m = v.trim().match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/);
  if (!m) return null;
  const dd = m[1].padStart(2, '0');
  const mm = m[2].padStart(2, '0');
  const yy = m[3].length === 4 ? m[3].slice(-2) : m[3].padStart(2, '0');
  return `${dd}/${mm}/${yy}`;
}

/** Kit (versão com forro/dupla camada) vinculado a um tecido base. */
type KitVinculado = {
  kit_codigo: string;
  kit_descricao: string | null;
  confirmado: boolean;
};

/** Resumo da execução da Entrega Após aplicada a um kit vinculado. */
type KitExecResumo = {
  kit_codigo: string;
  kit_descricao: string | null;
  sucesso: number;
  ignoradas: number;
  falha: number;
  erro?: string;
};

function EntregaAposCard() {

  const [codigoInput, setCodigoInput] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewRows, setPreviewRows] = useState<PreviewRow[] | null>(null);
  const [previewCodigo, setPreviewCodigo] = useState<string | null>(null);

  const [acao, setAcao] = useState<Acao>('atualizar');
  const [dataInput, setDataInput] = useState('');
  const [execLoading, setExecLoading] = useState(false);
  const [result, setResult] = useState<ExecPayload | null>(null);

  const codigoNormalizado = useMemo(() => normalizeCodigo(codigoInput), [codigoInput]);
  const dataNormalizada = useMemo(() => normalizeData(dataInput), [dataInput]);
  const precisaData = acao === 'atualizar' || acao === 'adicionar';
  const mostraPreview = acao === 'remover' || !!dataNormalizada;

  const [execProgress, setExecProgress] = useState(0);

  /** Kits (versão com forro/dupla camada) vinculados ao tecido consultado. */
  const [kitsVinculados, setKitsVinculados] = useState<KitVinculado[]>([]);
  const [aplicarKits, setAplicarKits] = useState(true);
  const [kitsResultado, setKitsResultado] = useState<KitExecResumo[]>([]);

  const canPreview = !!codigoNormalizado && !previewLoading;
  const canExecute =
    !!previewCodigo &&
    !execLoading &&
    (precisaData ? !!dataNormalizada : true) &&
    (previewRows?.length ?? 0) > 0;

  /**
   * Localiza os kits vinculados ao item consultado.
   * A comparação é feita sobre o código "cru" (só letras/números) porque o
   * usuário pode digitar TE123456, TE.123.456 ou te-123-456 e a planilha
   * importada pode ter gravado qualquer uma dessas formas.
   */
  const carregarKits = async (codigo: string): Promise<KitVinculado[]> => {
    const raw = (v: string | null | undefined) => (v ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    const alvo = raw(codigo);
    if (!alvo) { setKitsVinculados([]); return []; }
    try {
      const { data, error } = await supabase
        .from('tecido_kit_vinculos')
        .select('kit_codigo, kit_descricao, tecido_codigo, confirmado')
        .not('tecido_codigo', 'is', null)
        .limit(20000);
      if (error) throw error;

      const encontrados = new Map<string, KitVinculado>();
      for (const row of data ?? []) {
        if (raw(row.tecido_codigo) !== alvo) continue;
        const kitRaw = raw(row.kit_codigo);
        if (!kitRaw || kitRaw === alvo) continue; // nunca reprocessa o próprio item
        if (!encontrados.has(kitRaw)) {
          encontrados.set(kitRaw, {
            kit_codigo: row.kit_codigo,
            kit_descricao: row.kit_descricao,
            confirmado: !!row.confirmado,
          });
        }
      }
      const lista = [...encontrados.values()];
      setKitsVinculados(lista);
      return lista;
    } catch {
      setKitsVinculados([]);
      return [];
    }
  };


  /**
   * Busca unificada: consulta os acabamentos do item pesquisado e, quando ele é
   * um tecido que possui kits com forro vinculados, agrega também os
   * acabamentos desses kits — como se o usuário tivesse pesquisado cada kit.
   */
  const runPreview = async () => {
    if (!codigoNormalizado) {
      toast.error('Informe um código de item.');
      return;
    }
    setPreviewLoading(true);
    setResult(null);
    try {
      const resp = await callAugeEntregaApos({ codigo_item: codigoNormalizado, acao: 'preview' });
      if (!resp?.ok) {
        toast.error(resp?.error ?? 'Falha ao consultar acabamentos.');
        setPreviewRows(null);
        setPreviewCodigo(null);
        return;
      }

      const base: PreviewRow[] = (resp.rows ?? []).map((r: PreviewRow) => ({
        ...r,
        origem_codigo: codigoNormalizado,
        origem_kit: false,
      }));

      const kits = await carregarKits(codigoNormalizado);
      const linhasKits: PreviewRow[] = [];
      for (const kit of kits) {
        try {
          const rk = await callAugeEntregaApos({ codigo_item: kit.kit_codigo, acao: 'preview' });
          if (!rk?.ok) continue;
          for (const r of (rk.rows ?? []) as PreviewRow[]) {
            linhasKits.push({ ...r, origem_codigo: kit.kit_codigo, origem_kit: true });
          }
        } catch {
          // Um kit indisponível não deve invalidar a consulta do tecido.
        }
      }

      const todas = [...base, ...linhasKits];
      setPreviewRows(todas);
      setPreviewCodigo(codigoNormalizado);
      if (todas.length === 0) toast.info('Nenhum acabamento vinculado a este item.');
      else if (linhasKits.length > 0) {
        toast.success(`${base.length} acabamento(s) do item + ${linhasKits.length} de ${kits.length} kit(s) com forro.`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro inesperado.');
    } finally {
      setPreviewLoading(false);
    }
  };



  const runExecute = async () => {
    if (!previewCodigo) return;
    if (precisaData && !dataNormalizada) {
      toast.error('Informe a nova data no formato DD/MM/AA.');
      return;
    }
    setExecLoading(true);
    setResult(null);
    setKitsResultado([]);
    setExecProgress(8);
    // Simulação de progresso enquanto o backend processa em lote
    const progressTimer = setInterval(() => {
      setExecProgress((p) => (p < 90 ? p + Math.max(1, Math.floor((92 - p) / 8)) : p));
    }, 350);
    try {
      const resp = await callAugeEntregaApos({
        codigo_item: previewCodigo,
        acao,
        nova_data: precisaData ? dataNormalizada : null,
      });
      if (!resp?.ok && resp?.error) {
        toast.error(resp.error);
        return;
      }
      setResult(resp as ExecPayload);
      toast.success(`Concluído: ${resp.sucesso} sucesso · ${resp.ignoradas} ignoradas · ${resp.falha} falha(s).`);

      // Propaga a mesma ação para os kits com forro vinculados a este tecido.
      if (aplicarKits && kitsVinculados.length > 0) {
        const resumos: KitExecResumo[] = [];
        for (const kit of kitsVinculados) {
          try {
            const r = await callAugeEntregaApos({
              codigo_item: kit.kit_codigo,
              acao,
              nova_data: precisaData ? dataNormalizada : null,
            });
            resumos.push({
              kit_codigo: kit.kit_codigo,
              kit_descricao: kit.kit_descricao,
              sucesso: r?.sucesso ?? 0,
              ignoradas: r?.ignoradas ?? 0,
              falha: r?.falha ?? 0,
              erro: r?.ok === false ? (r?.error ?? 'Falha desconhecida.') : undefined,
            });
          } catch (err) {
            resumos.push({
              kit_codigo: kit.kit_codigo,
              kit_descricao: kit.kit_descricao,
              sucesso: 0,
              ignoradas: 0,
              falha: 0,
              erro: err instanceof Error ? err.message : 'Erro inesperado.',
            });
          }
          setKitsResultado([...resumos]);
        }
        const okKits = resumos.filter((r) => !r.erro && r.falha === 0).length;
        toast.success(`Kits com forro: ${okKits}/${resumos.length} atualizados.`);
      }

      // Refresh preview para refletir mudanças
      await runPreview();

    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro inesperado.');
    } finally {
      clearInterval(progressTimer);
      setExecProgress(100);
      setTimeout(() => setExecProgress(0), 600);
      setExecLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarClock className="h-4 w-4 text-primary" />
              Entrega Após
            </CardTitle>
            <CardDescription className="mt-1">
              Consulta os acabamentos vinculados a um item e atualiza, adiciona ou remove o campo
              <code className="mx-1 rounded bg-muted px-1 py-0.5 text-[11px]">(Ent_Ap_DD/MM/AA)</code>
              na descrição, ajustando também a abreviação
              <code className="mx-1 rounded bg-muted px-1 py-0.5 text-[11px]">E{'{dd}'}/{'{m}'}</code>.
            </CardDescription>
          </div>
          <Badge variant="outline" className="gap-1"><Sparkles className="h-3 w-3" /> Auge</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <NovaAbreviacaoCard />

        <div className="border-t pt-6" />

        {/* Passo 1 · Consulta */}
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <div className="grid gap-1.5">
            <Label htmlFor="ea-codigo" className="text-xs">Código do item</Label>
            <Input
              id="ea-codigo"
              value={codigoInput}
              onChange={(e) => setCodigoInput(e.target.value)}
              placeholder="TC.000.033"
              className="h-10 font-mono"
              onKeyDown={(e) => { if (e.key === 'Enter' && canPreview) runPreview(); }}
            />
            {codigoInput && !codigoNormalizado && (
              <span className="text-[11px] text-destructive">Formato inválido. Use XX.000.000.</span>
            )}
          </div>
          <div className="flex items-end">
            <Button onClick={runPreview} disabled={!canPreview} className="gap-2 h-10">
              {previewLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Consultar acabamentos
            </Button>
          </div>
        </div>

        {/* Preview */}
        {previewLoading && <Skeleton className="h-40 w-full" />}
        {!previewLoading && previewRows && (
          <div className="rounded-md border">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/30 px-3 py-2 text-xs">
              <span className="font-medium">
                Item <span className="font-mono">{previewCodigo}</span> — {previewRows.length} acabamento(s)
              </span>
              {previewRows.some((r) => r.origem_kit) && (
                <span className="text-muted-foreground">
                  Inclui {previewRows.filter((r) => r.origem_kit).length} acabamento(s) de kits com forro
                </span>
              )}
            </div>
            <div className="max-h-[420px] overflow-auto">
              <table className="w-full text-xs">
                <thead className="bg-card text-muted-foreground sticky top-0 z-10 shadow-[0_1px_0_0_hsl(var(--border))]">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium bg-card">Item</th>
                    <th className="px-3 py-2 text-left font-medium bg-card">Chave</th>
                    <th className="px-3 py-2 text-left font-medium bg-card">Acabamento</th>
                    <th className="px-3 py-2 text-left font-medium bg-card">Descrição atual</th>
                    <th className="px-3 py-2 text-left font-medium bg-card">Descrição reduzida</th>
                    <th className="px-3 py-2 text-left font-medium bg-card">Ent. após</th>
                    {mostraPreview && (
                      <>
                        <th className="px-3 py-2 text-left font-medium bg-primary/10">Nova descrição</th>
                        <th className="px-3 py-2 text-left font-medium bg-primary/10">Nova reduzida</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((r, i) => {
                    const novaDesc = mostraPreview ? previewDescricao(r.descricao_atual, acao, dataNormalizada) : '';
                    const novaRed = mostraPreview ? previewReduzida(r.descricao_reduzida, acao, dataNormalizada) : '';
                    return (
                      <tr key={`${r.origem_codigo ?? ''}-${r.cd_acabamento_item}-${i}`} className={r.cancelado ? 'opacity-50' : ''}>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono">{r.origem_codigo ?? previewCodigo}</span>
                            {r.origem_kit && (
                              <Badge variant="outline" className="px-1.5 py-0 text-[10px]">kit</Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2 font-mono">{r.chave_acabamento}</td>
                        <td className="px-3 py-2">{r.nm_acabamento}</td>
                        <td className="px-3 py-2">{r.descricao_atual}</td>
                        <td className="px-3 py-2 font-mono text-[11px]">{r.descricao_reduzida || '—'}</td>
                        <td className="px-3 py-2 font-mono">{r.entrega_apos_atual ?? extractEntregaApos(r.descricao_atual) ?? '—'}</td>
                        {mostraPreview && (
                          <>
                            <td className="px-3 py-2 bg-primary/5">
                              <div className="flex items-center gap-1.5">
                                <ArrowRight className="h-3 w-3 text-primary shrink-0" />
                                <span className={novaDesc !== r.descricao_atual ? 'text-primary font-medium' : 'text-muted-foreground'}>{novaDesc}</span>
                              </div>
                            </td>
                            <td className="px-3 py-2 bg-primary/5 font-mono text-[11px]">
                              <span className={novaRed !== r.descricao_reduzida ? 'text-primary font-medium' : 'text-muted-foreground'}>{novaRed || '—'}</span>
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                  {previewRows.length === 0 && (
                    <tr><td colSpan={mostraPreview ? 8 : 6} className="px-3 py-6 text-center text-muted-foreground">Sem acabamentos vinculados.</td></tr>

                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Kits com forro vinculados ao tecido */}
        {previewRows && previewRows.length > 0 && (
          <div className="rounded-md border bg-muted/20 p-3">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <Layers className="h-4 w-4 text-primary" />
              <span className="font-medium">Kits com forro vinculados</span>
              <Badge variant="outline">{kitsVinculados.length}</Badge>
              {kitsVinculados.length > 0 && (
                <label className="ml-auto flex cursor-pointer items-center gap-2">
                  <Checkbox checked={aplicarKits} onCheckedChange={(v) => setAplicarKits(v === true)} />
                  <span>Aplicar a mesma ação nos kits</span>
                </label>
              )}
            </div>
            {kitsVinculados.length === 0 ? (
              <p className="mt-2 text-[11px] text-muted-foreground">
                Nenhum kit vinculado a este tecido. Configure os vínculos na aba “Kits com Forro”.
              </p>
            ) : (
              <ul className="mt-2 space-y-1 text-[11px]">
                {kitsVinculados.map((k) => (
                  <li key={k.kit_codigo} className="flex flex-wrap items-center gap-2">
                    <span className="font-mono">{k.kit_codigo}</span>
                    <span className="text-muted-foreground">{k.kit_descricao}</span>
                    {!k.confirmado && <Badge variant="outline" className="px-1.5 py-0 text-[10px]">sugerido</Badge>}
                  </li>
                ))}
              </ul>
            )}
            {kitsResultado.length > 0 && (
              <div className="mt-3 space-y-1 border-t pt-2 text-[11px]">
                {kitsResultado.map((r) => (
                  <div key={r.kit_codigo} className="flex flex-wrap items-center gap-2">
                    <span className="font-mono">{r.kit_codigo}</span>
                    {r.erro ? (
                      <span className="text-destructive">{r.erro}</span>
                    ) : (
                      <span className="text-muted-foreground">
                        {r.sucesso} sucesso · {r.ignoradas} ignoradas · {r.falha} falha(s)
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Passo 2 · Ação */}

        {previewRows && previewRows.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-[200px_1fr_auto] items-end">
            <div className="grid gap-1.5">
              <Label className="text-xs">Ação</Label>
              <Select value={acao} onValueChange={(v) => setAcao(v as Acao)}>
                <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="atualizar">Atualizar data</SelectItem>
                  <SelectItem value="adicionar">Adicionar</SelectItem>
                  <SelectItem value="remover">Remover</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs">
                Nova data (DD/MM/AA) {precisaData && <span className="text-destructive">*</span>}
              </Label>
              <Input
                value={dataInput}
                onChange={(e) => setDataInput(e.target.value)}
                placeholder="10/09/26"
                disabled={!precisaData}
                className="h-10 font-mono"
              />
              {precisaData && dataInput && !dataNormalizada && (
                <span className="text-[11px] text-destructive">Data inválida.</span>
              )}
            </div>
            <Button onClick={runExecute} disabled={!canExecute} className="gap-2 h-10">
              {execLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4" />}
              Executar
            </Button>
          </div>
        )}

        {/* Barra de progresso */}
        {(execLoading || execProgress > 0) && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Loader2 className={`h-3 w-3 ${execLoading ? 'animate-spin' : ''}`} />
                {execLoading ? 'Aplicando alterações no Auge…' : 'Finalizado'}
              </span>
              <span className="font-mono">{execProgress}%</span>
            </div>
            <Progress value={execProgress} className="h-2" />
          </div>
        )}

        {/* Resultado */}
        {result && (
          <div className="rounded-md border bg-card">
            <div className="flex flex-wrap items-center gap-3 border-b px-3 py-2 text-xs">
              <span className="font-medium">Resultado</span>
              <Badge variant="secondary" className="gap-1"><CheckCircle2 className="h-3 w-3 text-emerald-500" /> {result.sucesso} sucesso</Badge>
              <Badge variant="secondary" className="gap-1"><MinusCircle className="h-3 w-3 text-muted-foreground" /> {result.ignoradas} ignoradas</Badge>
              <Badge variant="secondary" className="gap-1"><XCircle className="h-3 w-3 text-destructive" /> {result.falha} falha(s)</Badge>
              {result.abreviacao && (
                <Badge variant="outline" className="gap-1">
                  Abrev.: {result.abreviacao.status}
                  {result.abreviacao.dsAtual && <> · <span className="font-mono">{result.abreviacao.dsAtual}</span> → <span className="font-mono">{result.abreviacao.dsAbreviada}</span></>}
                  {result.abreviacao.erro && <> · <span className="text-destructive">{result.abreviacao.erro}</span></>}
                </Badge>
              )}
              <div className="ml-auto">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 gap-1.5 text-[11px]"
                  onClick={() => window.open(AUGE_BASE_URL, '_blank', 'noopener,noreferrer')}
                >
                  <ExternalLink className="h-3 w-3" />
                  Abrir no Auge
                </Button>
              </div>
            </div>
            <div className="max-h-[300px] overflow-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted/20 text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Status</th>
                    <th className="px-3 py-2 text-left font-medium">Chave</th>
                    <th className="px-3 py-2 text-left font-medium">Detalhe</th>
                  </tr>
                </thead>
                <tbody>
                  {result.results.map((r, i) => (
                    <tr key={`${r.cd_acabamento_item}-${i}`}>
                      <td className="px-3 py-2">
                        {r.status === 'ok' && <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">✓ OK</Badge>}
                        {r.status === 'ignorada' && <Badge variant="outline">— ignorada</Badge>}
                        {r.status === 'erro' && <Badge variant="destructive">✗ erro</Badge>}
                      </td>
                      <td className="px-3 py-2 font-mono">{r.chave_acabamento}</td>
                      <td className="px-3 py-2">
                        {r.status === 'ok' && <span className="text-muted-foreground">{r.para}</span>}
                        {r.status === 'ignorada' && <span className="text-muted-foreground italic">{r.motivo}</span>}
                        {r.status === 'erro' && <span className="text-destructive">campo <code className="rounded bg-muted px-1">{r.campo}</code>: {r.erro}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </CardContent>
    </Card>
  );
}

// =========================================================================
// Nova Abreviação — cria diretamente em manterAbreviacao.php do Auge
// =========================================================================
function NovaAbreviacaoCard() {
  const [dsAtual, setDsAtual] = useState('');
  const [dsAbreviada, setDsAbreviada] = useState('');
  const [abrevDirty, setAbrevDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastOk, setLastOk] = useState<{ ds: string; abrev: string; cd: string | null } | null>(null);

  // Sugere automaticamente a abreviação quando a descrição contém (Ent_Ap_DD/MM/AA)
  const sugestao = useMemo(() => {
    const m = dsAtual.match(/\(\s*Ent[_ ]?Ap[_ ]?(\d{1,2}\/\d{1,2}\/\d{2,4})\s*\)/i);
    return m ? abbrevFromDate(m[1]) : '';
  }, [dsAtual]);

  // Aplica a sugestão automaticamente enquanto o usuário não editou o campo manualmente
  useEffect(() => {
    if (sugestao && !abrevDirty) setDsAbreviada(sugestao);
  }, [sugestao, abrevDirty]);

  const canSave = dsAtual.trim().length > 0 && dsAbreviada.trim().length > 0 && !saving;


  const submit = async () => {
    const a = dsAtual.trim();
    const b = dsAbreviada.trim();
    if (!a || !b) {
      toast.error('Preencha "Descrição atual" e "Abreviação".');
      return;
    }
    if (b.length > a.length) {
      toast.warning('A abreviação está maior que a descrição atual — confira antes de salvar.');
    }
    setSaving(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;
      const anon = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY) as string;
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auge-sync?action=salvar_abreviacao`;
      const r = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: anon,
          Authorization: `Bearer ${token ?? anon}`,
        },
        body: JSON.stringify({ dsAtual: a, dsAbreviada: b, idTipoAbreviacao: 1 }),
      });
      const txt = await r.text();
      let json: any = {};
      try { json = JSON.parse(txt); } catch { json = { ok: false, error: txt.slice(0, 400) }; }
      if (!json?.ok) {
        toast.error(json?.error ?? 'Falha ao salvar abreviação no Auge.');
        return;
      }
      toast.success('Abreviação criada no Auge.');
      setLastOk({ ds: a, abrev: b, cd: json?.cdAbreviacao ?? null });
      setDsAtual('');
      setDsAbreviada('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro inesperado.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 border-t pt-4">


      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="abrev-ds-atual" className="text-xs">Descrição Atual</Label>
          <Input
            id="abrev-ds-atual"
            value={dsAtual}
            onChange={(e) => setDsAtual(e.target.value.slice(0, 200))}
            placeholder="Ex.: (Ent_Ap_10/09/26)"
            className="h-10"
            maxLength={200}
          />
          <span className="text-[11px] text-muted-foreground">{dsAtual.length}/200</span>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="abrev-ds-abrev" className="text-xs">Abreviação</Label>
          <Input
            id="abrev-ds-abrev"
            value={dsAbreviada}
            onChange={(e) => { setAbrevDirty(true); setDsAbreviada(e.target.value.slice(0, 60)); }}
            placeholder="Ex.: E10/9"
            className="h-10"
            maxLength={60}
            onKeyDown={(e) => { if (e.key === 'Enter' && canSave) submit(); }}
          />
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>{dsAbreviada.length}/60</span>
            {sugestao && sugestao !== dsAbreviada && (
              <button
                type="button"
                onClick={() => { setAbrevDirty(false); setDsAbreviada(sugestao); }}
                className="inline-flex items-center gap-1 text-primary underline underline-offset-2 hover:opacity-80"
              >
                <Sparkles className="h-3 w-3" /> usar sugestão <span className="font-mono">{sugestao}</span>
              </button>
            )}
          </div>
        </div>
      </div>


      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={submit} disabled={!canSave} className="gap-2 h-10">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Criar abreviação
        </Button>
        <Button asChild variant="outline" className="gap-2 h-10">
          <a href={`${AUGE_BASE_URL}/l/unilux/modInventario/manterAbreviacao.php`} target="_blank" rel="noreferrer">
            <ExternalLink className="h-4 w-4" />
            Abrir no Auge
          </a>
        </Button>
      </div>

      {lastOk && (
        <div className="rounded-md border bg-emerald-500/5 px-3 py-2 text-xs">
          <div className="flex items-center gap-2 text-emerald-600 font-medium">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Criada com sucesso {lastOk.cd ? <span className="font-mono text-muted-foreground">#{lastOk.cd}</span> : null}
          </div>
          <div className="mt-1 text-muted-foreground">
            <span className="font-mono">{lastOk.ds}</span> <ArrowRight className="inline h-3 w-3" /> <span className="font-mono">{lastOk.abrev}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AutomacoesPage() {
  const { isAdmin, loading } = useAuth();
  if (loading) return null;
  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <PageShell>
      <PageHeader
        title="Automações"
        subtitle="Rotinas administrativas que operam no Auge diretamente pelo Pente Fino."
        actions={<Badge variant="outline" className="gap-1 h-7"><Sparkles className="h-3 w-3" /> Admin</Badge>}
      />
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        <Tabs defaultValue="necessidade" className="space-y-4">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="necessidade" className="gap-2">
              <Boxes className="h-4 w-4" /> Necessidade
            </TabsTrigger>
            <TabsTrigger value="entrega-apos" className="gap-2">
              <CalendarClock className="h-4 w-4" /> Entrega Após
            </TabsTrigger>
            <TabsTrigger value="kits-forro" className="gap-2">
              <Layers className="h-4 w-4" /> Kits com Forro
            </TabsTrigger>
            <TabsTrigger value="processo-transferencia" className="gap-2">
              <Truck className="h-4 w-4" /> Processo de Transferência
            </TabsTrigger>
          </TabsList>
          <TabsContent value="necessidade" className="mt-0 space-y-4">
            
            <NecessidadeCronCard />
            <NecessidadeCard />
          </TabsContent>
          <TabsContent value="entrega-apos" className="mt-0">
            <EntregaAposCard />
          </TabsContent>
          <TabsContent value="kits-forro" className="mt-0">
            <KitsForroCard />
          </TabsContent>
          <TabsContent value="processo-transferencia" className="mt-0">
            <ProcessoTransferenciaCard />
          </TabsContent>

        </Tabs>
      </motion.div>

    </PageShell>
  );
}
