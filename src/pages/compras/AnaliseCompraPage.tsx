import { useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { AlertTriangle, Download, FileSpreadsheet, Loader2, RefreshCw } from 'lucide-react';
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
import {
  ANALISE_COMPRA_PRESETS,
  applyFilters,
  exportAnaliseCompraXLSX,
  normalizeConsulta,
  OP_LABELS,
  type NormalizedResult,
} from '@/lib/compras/analiseCompra';

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

  const gerar = useMutation({
    mutationFn: async (forcarId?: string) => {
      const id = forcarId ?? idConsulta;
      const { data, error } = await supabase.functions.invoke('auge-sync', {
        body: { action: 'analise_compra', ...(id ? { idConsulta: id } : {}) },
      });
      if (error) throw error;
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
      if (!result.rows.length) toast.warning('O relatório retornou sem linhas.');
      else toast.success(`${result.rows.length} linhas carregadas.`);
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
            <Button
              variant="outline"
              size="sm"
              onClick={exportar}
              disabled={!resultado.rows.length}
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar XLSX
            </Button>
            <Button size="sm" onClick={() => gerar.mutate()} disabled={carregando}>
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
          </TabsList>

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
            <Button onClick={() => gerar.mutate()} disabled={carregando}>
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Gerar relatório
            </Button>
          </CardContent>
        </Card>
      )}
    </PageShell>
  );
}

