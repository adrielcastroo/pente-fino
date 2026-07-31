import { useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { AlertTriangle, Download, FileSpreadsheet, History, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { PageShell, PageHeader } from '@/components/compras/ui';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import AnaliseCompraTable from '@/components/compras/AnaliseCompraTable';
import SaldoBaixoDiffTable from '@/components/compras/SaldoBaixoDiffTable';
import {
  useSaldoBaixoSnapshots,
  useSaveSaldoBaixoSnapshot,
  type SaldoBaixoSnapshot,
} from '@/hooks/compras/useSaldoBaixoSnapshots';
import {
  DIFF_LABELS,
  diffSnapshots,
  exportDiffXLSX,
  type DiffStatus,
} from '@/lib/compras/saldoBaixoDiff';
import {
  ANALISE_COMPRA_PRESETS,
  applyFilters,
  exportAnaliseCompraXLSX,
  normalizeConsulta,
  OP_LABELS,
  type NormalizedResult,
} from '@/lib/compras/analiseCompra';

const DIFF_FILTROS: (DiffStatus | 'todos')[] = ['todos', 'novo', 'alterado', 'removido', 'igual'];


interface ConsultaOption {
  id: string;
  nome: string;
  grupo?: string;
}

const STORAGE_KEY = 'compras:analise-compra:idConsulta';

/**
 * Relatório de itens com saldo baixo.
 *
 * O Edge Function resolve sozinho a consulta "Análise de compra V5 - HANA" no
 * Auge. Quando ela não existe/não responde para as credenciais do usuário,
 * exibimos a lista de consultas disponíveis para escolha manual (uma vez).
 */
export default function AnaliseCompraPage() {
  const [resultado, setResultado] = useState<NormalizedResult>({ columns: [], rows: [] });
  const [origem, setOrigem] = useState<string | null>(null);
  const [preset, setPreset] = useState(ANALISE_COMPRA_PRESETS[0].key);
  const [disponiveis, setDisponiveis] = useState<ConsultaOption[]>([]);
  const [aviso, setAviso] = useState<string | null>(null);
  const [idConsulta, setIdConsulta] = useState<string>(
    () => localStorage.getItem(STORAGE_KEY) ?? '',
  );
  // Planilha usada como base de comparação (última salva antes desta geração).
  const [baseline, setBaseline] = useState<SaldoBaixoSnapshot | null>(null);
  const [diffFiltro, setDiffFiltro] = useState<DiffStatus | 'todos'>('todos');

  const { data: snapshots = [] } = useSaldoBaixoSnapshots(10);
  const salvarSnapshot = useSaveSaldoBaixoSnapshot();



  const gerar = useMutation({
    mutationFn: async (forcarId?: string) => {
      const id = forcarId ?? idConsulta;
      const { data, error } = await supabase.functions.invoke('auge-sync', {
        body: { action: 'analise_compra', ...(id ? { idConsulta: id } : {}) },
      });
      if (error) {
        // FunctionsHttpError guarda o corpo real da resposta em `context`.
        const ctx = (error as unknown as { context?: Response }).context;
        let detalhe = '';
        try {
          detalhe = ctx && typeof ctx.text === 'function' ? await ctx.text() : '';
        } catch {
          detalhe = '';
        }
        throw new Error(
          detalhe
            ? `${error.message} — ${detalhe.slice(0, 300)}`
            : `${error.message}. Recarregue a página (Ctrl+Shift+R) para pegar a versão mais recente do app.`,
        );
      }

      return data as {
        ok?: boolean;
        error?: string;
        needsSelection?: boolean;
        disponiveis?: ConsultaOption[];
        consulta?: { id: string; nome: string };
      };
    },
    onSuccess: (data) => {
      if (data?.ok === false) {
        setDisponiveis(data.disponiveis ?? []);
        setAviso(data.error ?? 'Falha ao gerar o relatório.');
        toast.error(data.error ?? 'Falha ao gerar o relatório.');
        return;
      }
      const result = normalizeConsulta(data);
      setResultado(result);
      setOrigem(data?.consulta?.nome ?? null);
      setDisponiveis(data?.disponiveis ?? []);
      setAviso(null);
      if (!result.rows.length) {
        toast.warning('O relatório retornou sem linhas.');
        return;
      }
      toast.success(`${result.rows.length} linhas carregadas.`);

      // A comparação usa a última planilha salva ANTES desta geração.
      setBaseline(snapshots[0] ?? null);
      salvarSnapshot.mutate(
        {
          columns: result.columns,
          rows: result.rows,
          origem: data?.consulta?.nome ?? 'Auge',
        },
        {
          onSuccess: () => toast.success('Planilha salva no histórico.'),
          onError: (err) =>
            toast.error(
              err instanceof Error
                ? `Não foi possível salvar no histórico: ${err.message}`
                : 'Não foi possível salvar no histórico.',
            ),
        },
      );

    },
    onError: (e: unknown) => {
      const msg = e instanceof Error ? e.message : 'Erro ao gerar o relatório.';
      setAviso(msg);
      toast.error(msg);
    },
  });

  const escolherConsulta = (id: string) => {
    setIdConsulta(id);
    localStorage.setItem(STORAGE_KEY, id);
    gerar.mutate(id);
  };

  const blocos = useMemo(
    () =>
      ANALISE_COMPRA_PRESETS.map((p) => ({
        ...p,
        rows: applyFilters(resultado.rows, p.filtros),
      })),
    [resultado.rows],
  );

  const diff = useMemo(
    () =>
      resultado.columns.length
        ? diffSnapshots(
            resultado,
            baseline ? { columns: baseline.columns, rows: baseline.rows } : null,
          )
        : null,
    [resultado, baseline],
  );

  const diffLinhas = useMemo(() => {
    if (!diff) return [];
    return diffFiltro === 'todos' ? diff.rows : diff.rows.filter((r) => r.status === diffFiltro);
  }, [diff, diffFiltro]);

  const exportar = () => {
    if (!resultado.columns.length) return;
    exportAnaliseCompraXLSX(
      blocos.map((b) => ({ label: b.label, columns: resultado.columns, rows: b.rows })),
    );
  };

  const carregando = gerar.isPending;


  return (
    <PageShell>
      <PageHeader
        title="Análise de Compra"
        subtitle="Itens com saldo baixo — Geral, Tecido, Siplan e Lâmina"
        backTo="/compras/acompanhamentos"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/compras/analise-compra/historico">
                <span className="flex items-center">
                  <History className="w-4 h-4 mr-2" />
                  Histórico
                </span>
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportar}
              disabled={!resultado.rows.length}
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar XLSX
            </Button>

            <Button size="sm" onClick={() => gerar.mutate(undefined)} disabled={carregando}>
              {carregando ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : resultado.rows.length ? (
                <RefreshCw className="w-4 h-4 mr-2" />
              ) : (
                <FileSpreadsheet className="w-4 h-4 mr-2" />
              )}
              {carregando ? 'Gerando…' : resultado.rows.length ? 'Atualizar' : 'Gerar relatório'}
            </Button>
          </div>
        }
      />

      {aviso && !carregando && (
        <Card className="border-destructive/40">
          <CardContent className="py-4 space-y-3">
            <div className="flex items-start gap-2 text-sm">
              <AlertTriangle className="w-4 h-4 mt-0.5 text-destructive shrink-0" />
              <p className="text-muted-foreground">{aviso}</p>
            </div>
            {disponiveis.length > 0 && (
              <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                <Select value={idConsulta} onValueChange={escolherConsulta}>
                  <SelectTrigger className="w-full sm:w-[380px]">
                    <SelectValue placeholder="Escolher consulta do Auge" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[320px]">
                    {disponiveis.map((c) => (
                      <SelectItem key={`${c.grupo}-${c.id}`} value={c.id}>
                        {c.grupo ? `${c.grupo} · ` : ''}{c.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-[11px] text-muted-foreground">
                  A escolha fica salva para os próximos relatórios.
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {carregando && (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      )}


      {!carregando && resultado.columns.length > 0 && (
        <Tabs value={preset} onValueChange={setPreset} className="w-full">
          <TabsList className="w-full justify-start overflow-x-auto">
            {blocos.map((b) => (
              <TabsTrigger key={b.key} value={b.key} className="gap-2">
                {b.label}
                <Badge variant="secondary" className="text-[10px] px-1.5">
                  {b.rows.length}
                </Badge>
              </TabsTrigger>
            ))}
            ))}
            <TabsTrigger value="comparacao" className="gap-2">
              Comparação
              <Badge variant="secondary" className="text-[10px] px-1.5">
                {diff ? diff.totais.novo + diff.totais.alterado + diff.totais.removido : 0}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="comparacao" className="space-y-3 mt-4">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[11px] text-muted-foreground">
                {baseline
                  ? `Comparando com a planilha de ${new Date(`${baseline.referencia}T12:00:00`).toLocaleDateString('pt-BR')}.`
                  : 'Não há planilha anterior no histórico — todos os itens aparecem como novos.'}
              </p>
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-[11px] ml-auto"
                disabled={!diff?.rows.length}
                onClick={() => diff && exportDiffXLSX(diff)}
              >
                <Download className="w-3.5 h-3.5 mr-1.5" />
                Exportar comparação
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {DIFF_FILTROS.map((f) => (
                <Button
                  key={f}
                  size="sm"
                  variant={diffFiltro === f ? 'default' : 'outline'}
                  className="h-8 text-[11px]"
                  onClick={() => setDiffFiltro(f)}
                >
                  {DIFF_LABELS[f]}
                  <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5">
                    {f === 'todos' ? (diff?.rows.length ?? 0) : (diff?.totais[f] ?? 0)}
                  </Badge>
                </Button>
              ))}
            </div>
            <SaldoBaixoDiffTable columns={resultado.columns} rows={diffLinhas} />
          </TabsContent>


          {blocos.map((b) => (
            <TabsContent key={b.key} value={b.key} className="space-y-3 mt-4">
              <div className="flex flex-wrap gap-1.5">
                {b.filtros.map((f, i) => (
                  <Badge key={i} variant="outline" className="text-[10px] font-normal">
                    {String(f.col).padStart(2, '0')} {OP_LABELS[f.op]} “{f.value}”
                  </Badge>
                ))}
              </div>
              <AnaliseCompraTable
                columns={resultado.columns}
                rows={b.rows}
                destaque={b.filtros.map((f) => f.col)}
              />
            </TabsContent>
          ))}

          {origem && (
            <p className="text-[11px] text-muted-foreground mt-3">
              Origem: {origem} · {resultado.rows.length} linhas brutas
            </p>
          )}
        </Tabs>
      )}

      {!carregando && !resultado.columns.length && (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground space-y-4">
            <p>
              Clique em “Gerar relatório” para montar a lista de itens com saldo baixo. Os filtros{' '}
              {ANALISE_COMPRA_PRESETS.map((p) => p.label).join(', ')} são aplicados
              automaticamente.
            </p>
            <Button onClick={() => gerar.mutate(undefined)} disabled={carregando}>
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Gerar relatório
            </Button>
          </CardContent>
        </Card>
      )}
    </PageShell>
  );
}

