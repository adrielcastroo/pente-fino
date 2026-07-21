import { useMemo, useState } from 'react';
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
import { CalendarClock, Loader2, PlayCircle, Search, Sparkles, CheckCircle2, XCircle, MinusCircle, ExternalLink, ArrowRight, Type, Plus } from 'lucide-react';

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
  const m = v.trim().match(/^([A-Za-z]{2})[\.\s-]?(\d{3})[\.\s-]?(\d{3})$/);
  if (!m) return null;
  return `${m[1].toUpperCase()}.${m[2]}.${m[3]}`;
}

function normalizeData(v: string): string | null {
  const m = v.trim().match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/);
  if (!m) return null;
  const dd = m[1].padStart(2, '0');
  const mm = m[2].padStart(2, '0');
  const yy = m[3].length === 4 ? m[3].slice(-2) : m[3].padStart(2, '0');
  return `${dd}/${mm}/${yy}`;
}

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

  const canPreview = !!codigoNormalizado && !previewLoading;
  const canExecute =
    !!previewCodigo &&
    !execLoading &&
    (precisaData ? !!dataNormalizada : true) &&
    (previewRows?.length ?? 0) > 0;

  const runPreview = async () => {
    if (!codigoNormalizado) {
      toast.error('Código de item inválido. Use o formato XX.000.000 (ex.: TC.000.033).');
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
      setPreviewRows(resp.rows ?? []);
      setPreviewCodigo(codigoNormalizado);
      if ((resp.rows ?? []).length === 0) toast.info('Nenhum acabamento vinculado a este item.');
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
            <div className="flex items-center justify-between border-b bg-muted/30 px-3 py-2 text-xs">
              <span className="font-medium">
                Item <span className="font-mono">{previewCodigo}</span> — {previewRows.length} acabamento(s)
              </span>
            </div>
            <div className="max-h-[420px] overflow-auto">
              <table className="w-full text-xs">
                <thead className="bg-card text-muted-foreground sticky top-0 z-10 shadow-[0_1px_0_0_hsl(var(--border))]">
                  <tr>
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
                  {previewRows.map((r) => {
                    const novaDesc = mostraPreview ? previewDescricao(r.descricao_atual, acao, dataNormalizada) : '';
                    const novaRed = mostraPreview ? previewReduzida(r.descricao_reduzida, acao, dataNormalizada) : '';
                    return (
                      <tr key={r.cd_acabamento_item} className={r.cancelado ? 'opacity-50' : ''}>
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
                    <tr><td colSpan={mostraPreview ? 7 : 5} className="px-3 py-6 text-center text-muted-foreground">Sem acabamentos vinculados.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
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
  const [saving, setSaving] = useState(false);
  const [lastOk, setLastOk] = useState<{ ds: string; abrev: string; cd: string | null } | null>(null);

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
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Type className="h-4 w-4 text-primary" />
              Nova Abreviação
            </CardTitle>
            <CardDescription className="mt-1">
              Cadastra uma abreviação diretamente em
              <a
                href={`${AUGE_BASE_URL}/l/unilux/modInventario/manterAbreviacao.php`}
                target="_blank"
                rel="noreferrer"
                className="mx-1 inline-flex items-center gap-1 underline underline-offset-2 hover:text-primary"
              >
                manterAbreviacao.php
                <ExternalLink className="h-3 w-3" />
              </a>
              no Auge.
            </CardDescription>
          </div>
          <Badge variant="outline" className="gap-1"><Sparkles className="h-3 w-3" /> Auge</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="abrev-ds-atual" className="text-xs">Descrição Atual</Label>
            <Input
              id="abrev-ds-atual"
              value={dsAtual}
              onChange={(e) => setDsAtual(e.target.value.slice(0, 200))}
              placeholder="Ex.: Zakynthos Sand"
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
              onChange={(e) => setDsAbreviada(e.target.value.slice(0, 60))}
              placeholder="Ex.: ZakntSand"
              className="h-10"
              maxLength={60}
              onKeyDown={(e) => { if (e.key === 'Enter' && canSave) submit(); }}
            />
            <span className="text-[11px] text-muted-foreground">{dsAbreviada.length}/60</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={submit} disabled={!canSave} className="gap-2 h-10">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Criar abreviação
          </Button>
          <Button
            asChild
            variant="outline"
            className="gap-2 h-10"
          >
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
      </CardContent>
    </Card>
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
        className="space-y-4"
      >
        <EntregaAposCard />
        <NovaAbreviacaoCard />
      </motion.div>
    </PageShell>
  );
}
