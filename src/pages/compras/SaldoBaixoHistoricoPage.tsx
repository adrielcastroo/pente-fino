import { useMemo, useState } from 'react';
import { Download, GitCompare, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { PageShell, PageHeader } from '@/components/compras/ui';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import {
  useClearSaldoBaixoSnapshots,
  useDeleteSaldoBaixoSnapshot,
  useSaldoBaixoSnapshots,
  type SaldoBaixoSnapshot,
} from '@/hooks/compras/useSaldoBaixoSnapshots';
import {
  DIFF_LABELS,
  diffSnapshots,
  exportDiffXLSX,
  exportSnapshotXLSX,
  type DiffStatus,
} from '@/lib/compras/saldoBaixoDiff';
import SaldoBaixoDiffTable from '@/components/compras/SaldoBaixoDiffTable';

const FILTROS: (DiffStatus | 'todos')[] = ['todos', 'novo', 'alterado', 'removido', 'igual'];

const fmtData = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

/**
 * Histórico das planilhas de Saldo Baixo importadas/geradas, com comparação
 * entre a planilha selecionada e a imediatamente anterior.
 */
export default function SaldoBaixoHistoricoPage() {
  useDocumentTitle('Histórico — Análise de Saldo Baixo');

  const { data: snapshots = [], isLoading } = useSaldoBaixoSnapshots();
  const remover = useDeleteSaldoBaixoSnapshot();
  const limpar = useClearSaldoBaixoSnapshots();

  const [selecionado, setSelecionado] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<DiffStatus | 'todos'>('todos');
  const [confirmarLimpeza, setConfirmarLimpeza] = useState(false);

  const atual: SaldoBaixoSnapshot | null = useMemo(() => {
    if (!snapshots.length) return null;
    return snapshots.find((s) => s.id === selecionado) ?? snapshots[0];
  }, [snapshots, selecionado]);

  const anterior: SaldoBaixoSnapshot | null = useMemo(() => {
    if (!atual) return null;
    const idx = snapshots.findIndex((s) => s.id === atual.id);
    return snapshots[idx + 1] ?? null;
  }, [snapshots, atual]);

  const diff = useMemo(
    () =>
      atual
        ? diffSnapshots(
            { columns: atual.columns, rows: atual.rows },
            anterior ? { columns: anterior.columns, rows: anterior.rows } : null,
          )
        : null,
    [atual, anterior],
  );

  const linhas = useMemo(() => {
    if (!diff) return [];
    return filtro === 'todos' ? diff.rows : diff.rows.filter((r) => r.status === filtro);
  }, [diff, filtro]);

  const baixar = (s: SaldoBaixoSnapshot) =>
    exportSnapshotXLSX(
      { columns: s.columns, rows: s.rows, referencia: s.referencia },
      `saldo-baixo-${s.referencia}.xlsx`,
    );

  return (
    <PageShell>
      <PageHeader
        title="Histórico de planilhas"
        subtitle="Análise de Saldo Baixo — comparação entre o dia anterior e o dia atual"
        backTo="/compras/analise-compra"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!diff?.rows.length}
              onClick={() => diff && exportDiffXLSX(diff)}
            >
              <GitCompare className="w-4 h-4 mr-2" />
              Exportar comparação
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={!snapshots.length || limpar.isPending}
              onClick={() => setConfirmarLimpeza(true)}
            >
              {limpar.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Limpar histórico
            </Button>
          </div>
        }
      />

      {isLoading && (
        <div className="space-y-2">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      )}

      {!isLoading && !snapshots.length && (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Nenhuma planilha no histórico. Gere um relatório em “Análise de Compra” para começar.
          </CardContent>
        </Card>
      )}

      {!isLoading && snapshots.length > 0 && (
        <>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {snapshots.map((s) => (
              <Card
                key={s.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelecionado(s.id)}
                onKeyDown={(e) => e.key === 'Enter' && setSelecionado(s.id)}
                className={
                  'cursor-pointer transition-colors ' +
                  (atual?.id === s.id ? 'border-primary' : 'hover:border-muted-foreground/40')
                }
              >
                <CardContent className="py-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {new Date(`${s.referencia}T12:00:00`).toLocaleDateString('pt-BR')}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {fmtData(s.created_at)} · {s.origem ?? 'Auge'}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-[10px] shrink-0">
                      {s.total_linhas} linhas
                    </Badge>
                  </div>
                  <div className="flex gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-[11px]"
                      onClick={(e) => {
                        e.stopPropagation();
                        baixar(s);
                      }}
                    >
                      <Download className="w-3.5 h-3.5 mr-1.5" />
                      Baixar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 text-[11px] text-destructive"
                      disabled={remover.isPending}
                      onClick={(e) => {
                        e.stopPropagation();
                        remover.mutate(s.id, {
                          onSuccess: () => toast.success('Planilha removida do histórico.'),
                          onError: (err) =>
                            toast.error(
                              err instanceof Error ? err.message : 'Não foi possível remover.',
                            ),
                        });
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                      Remover
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {diff && (
            <Card>
              <CardContent className="py-4 space-y-3">
                <p className="text-[11px] text-muted-foreground">
                  Comparando{' '}
                  <strong>
                    {new Date(`${atual!.referencia}T12:00:00`).toLocaleDateString('pt-BR')}
                  </strong>{' '}
                  com{' '}
                  <strong>
                    {anterior
                      ? new Date(`${anterior.referencia}T12:00:00`).toLocaleDateString('pt-BR')
                      : '— (não há planilha anterior)'}
                  </strong>
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {FILTROS.map((f) => (
                    <Button
                      key={f}
                      size="sm"
                      variant={filtro === f ? 'default' : 'outline'}
                      className="h-8 text-[11px]"
                      onClick={() => setFiltro(f)}
                    >
                      {DIFF_LABELS[f]}
                      <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5">
                        {f === 'todos' ? diff.rows.length : diff.totais[f]}
                      </Badge>
                    </Button>
                  ))}
                </div>
                <SaldoBaixoDiffTable columns={diff.columns} rows={linhas} />
              </CardContent>
            </Card>
          )}
        </>
      )}

      <AlertDialog open={confirmarLimpeza} onOpenChange={setConfirmarLimpeza}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Limpar todo o histórico?</AlertDialogTitle>
            <AlertDialogDescription>
              Todas as planilhas salvas serão excluídas permanentemente. Esta ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                limpar.mutate(undefined, {
                  onSuccess: () => {
                    setSelecionado(null);
                    toast.success('Histórico limpo.');
                  },
                  onError: (err) =>
                    toast.error(err instanceof Error ? err.message : 'Não foi possível limpar.'),
                })
              }
            >
              Limpar tudo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageShell>
  );
}
