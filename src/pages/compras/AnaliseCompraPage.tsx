import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, Eye, History, Save } from 'lucide-react';
import { toast } from 'sonner';
import { PageShell, PageHeader } from '@/components/compras/ui';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AnaliseCompraTable from '@/components/compras/AnaliseCompraTable';
import SaldoBaixoDiffTable from '@/components/compras/SaldoBaixoDiffTable';
import PlanilhaDropzone, {
  type PlanilhaImportada,
} from '@/components/compras/PlanilhaDropzone';
import { useSaveSaldoBaixoSnapshot } from '@/hooks/compras/useSaldoBaixoSnapshots';
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
  OP_LABELS,
} from '@/lib/compras/analiseCompra';

const DIFF_FILTROS: (DiffStatus | 'todos')[] = ['todos', 'novo', 'alterado', 'removido', 'igual'];

/**
 * Análise de Saldo Baixo.
 *
 * O usuário importa duas planilhas — a do dia anterior e a do dia atual — e o
 * app aplica os presets de filtro e compara item a item (chave: coluna 02).
 */
export default function AnaliseCompraPage() {
  const [anterior, setAnterior] = useState<PlanilhaImportada | null>(null);
  const [atual, setAtual] = useState<PlanilhaImportada | null>(null);
  const [preset, setPreset] = useState(ANALISE_COMPRA_PRESETS[0].key);
  const [diffFiltro, setDiffFiltro] = useState<DiffStatus | 'todos'>('todos');
  const [verComparacao, setVerComparacao] = useState(false);

  const salvarSnapshot = useSaveSaldoBaixoSnapshot();

  const resultado = useMemo(
    () => ({ columns: atual?.columns ?? [], rows: atual?.rows ?? [] }),
    [atual],
  );

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
            anterior ? { columns: anterior.columns, rows: anterior.rows } : null,
          )
        : null,
    [resultado, anterior],
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

  const salvarNoHistorico = () => {
    if (!atual?.rows.length) return;
    salvarSnapshot.mutate(
      {
        columns: atual.columns,
        rows: atual.rows,
        origem: 'Importação manual',
        arquivo_nome: atual.arquivoNome,
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
  };

  return (
    <PageShell>
      <PageHeader
        title="Análise de Saldo Baixo"
        subtitle="Compare a planilha do dia anterior com a do dia atual"
        backTo="/compras/acompanhamentos"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/compras/analise-compra/historico">
                <span className="flex items-center">
                  <History className="mr-2 h-4 w-4" />
                  Histórico
                </span>
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={salvarNoHistorico}
              disabled={!atual?.rows.length || salvarSnapshot.isPending}
            >
              <Save className="mr-2 h-4 w-4" />
              Salvar no histórico
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportar}
              disabled={!resultado.rows.length}
            >
              <Download className="mr-2 h-4 w-4" />
              Exportar XLSX
            </Button>
          </div>
        }
      />

      <Card>
        <CardContent className="grid grid-cols-1 gap-4 py-4 md:grid-cols-2">
          <PlanilhaDropzone
            label="Planilha do dia anterior"
            hint="Base da comparação"
            value={anterior}
            onChange={setAnterior}
            onError={(m) => toast.error(m)}
          />
          <PlanilhaDropzone
            label="Planilha do dia atual"
            hint="Planilha analisada"
            value={atual}
            onChange={setAtual}
            onError={(m) => toast.error(m)}
          />
        </CardContent>
      </Card>

      {resultado.columns.length > 0 && (
        <Tabs value={preset} onValueChange={setPreset} className="w-full">
          <TabsList className="w-full justify-start overflow-x-auto">
            {blocos.map((b) => (
              <TabsTrigger key={b.key} value={b.key}>
                {b.label}
              </TabsTrigger>
            ))}
            <TabsTrigger value="comparacao">Comparação</TabsTrigger>
          </TabsList>

          <TabsContent value="comparacao" className="mt-4">
            <Card>
              <CardContent className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Arquivo de comparação gerado</p>
                  <p className="text-[11px] text-muted-foreground">
                    {anterior
                      ? `${atual?.arquivoNome} × ${anterior.arquivoNome}`
                      : 'Importe a planilha do dia anterior — sem ela todos os itens aparecem como novos.'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={() => setVerComparacao(true)} disabled={!diff?.rows.length}>
                    <Eye className="mr-2 h-4 w-4" />
                    Ver
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!diff?.rows.length}
                    onClick={() => diff && exportDiffXLSX(diff)}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Baixar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>


          {blocos.map((b) => (
            <TabsContent key={b.key} value={b.key} className="mt-4 space-y-3">
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

          <p className="mt-3 text-[11px] text-muted-foreground">
            Origem: {atual?.arquivoNome} · {resultado.rows.length} linhas brutas
          </p>
        </Tabs>
      )}

      {!resultado.columns.length && (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Importe a planilha do dia atual para aplicar os filtros{' '}
            {ANALISE_COMPRA_PRESETS.map((p) => p.label).join(', ')} e comparar com o dia anterior.
          </CardContent>
        </Card>
      )}
    </PageShell>
  );
}
