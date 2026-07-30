import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Download, Loader2, RefreshCw, Search } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { PageShell, PageHeader } from '@/components/compras/ui';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import AnaliseCompraTable from '@/components/compras/AnaliseCompraTable';
import {
  ANALISE_COMPRA_PRESETS,
  applyFilters,
  exportAnaliseCompraXLSX,
  normalizeConsulta,
  OP_LABELS,
  type NormalizedResult,
} from '@/lib/compras/analiseCompra';

const STORAGE_KEY = 'compras:analise-compra:idConsulta';

interface ConsultaOption {
  id: string;
  nome: string;
  grupo?: string;
}

/**
 * Lista as consultas do "Gerador de Consultas" do Auge. Falha de forma suave:
 * o usuário sempre pode digitar o ID manualmente.
 */
function useConsultas() {
  return useQuery<ConsultaOption[]>({
    queryKey: ['compras', 'auge', 'consultas'],
    staleTime: 10 * 60_000,
    retry: false,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('auge-sync', {
        body: { action: 'listar_consultas' },
      });
      if (error) throw error;
      if (data?.ok === false) throw new Error(data?.error || 'Falha ao listar consultas.');
      return Array.isArray(data?.data) ? data.data : [];
    },
  });
}

export default function AnaliseCompraPage() {
  const [idConsulta, setIdConsulta] = useState(() => localStorage.getItem(STORAGE_KEY) ?? '');
  const [resultado, setResultado] = useState<NormalizedResult>({ columns: [], rows: [] });
  const [preset, setPreset] = useState(ANALISE_COMPRA_PRESETS[0].key);

  const consultas = useConsultas();

  // Pré-seleciona a consulta "Análise de compra V5 - HANA" quando encontrada.
  useEffect(() => {
    if (idConsulta || !consultas.data?.length) return;
    const alvo = consultas.data.find((c) => /an[aá]lise\s*de\s*compra\s*v5/i.test(c.nome));
    if (alvo) setIdConsulta(alvo.id);
  }, [consultas.data, idConsulta]);

  const executar = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.functions.invoke('auge-sync', {
        body: { action: 'run_consulta', idConsulta: id },
      });
      if (error) throw error;
      if (data?.ok === false) throw new Error(data?.error || 'Falha ao executar a consulta.');
      return normalizeConsulta(data);
    },
    onSuccess: (r) => {
      setResultado(r);
      localStorage.setItem(STORAGE_KEY, idConsulta.trim());
      if (!r.rows.length) toast.warning('A consulta retornou sem linhas.');
      else toast.success(`${r.rows.length} linhas carregadas do Auge.`);
    },
    onError: (e: unknown) => {
      toast.error(e instanceof Error ? e.message : 'Erro ao consultar o Auge.');
    },
  });

  const blocos = useMemo(
    () =>
      ANALISE_COMPRA_PRESETS.map((p) => ({
        ...p,
        rows: applyFilters(resultado.rows, p.filtros),
      })),
    [resultado.rows],
  );

  const ativo = blocos.find((b) => b.key === preset) ?? blocos[0];

  const exportar = () => {
    if (!resultado.columns.length) return;
    exportAnaliseCompraXLSX(
      blocos.map((b) => ({ label: b.label, columns: resultado.columns, rows: b.rows })),
    );
  };

  const carregando = executar.isPending;

  return (
    <PageShell>
      <PageHeader
        title="Análise de Compra"
        subtitle="Itens com saldo baixo — Gerador de Consultas do Auge (Análise de compra V5 - HANA)"
        backTo="/compras/acompanhamentos"
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={exportar}
            disabled={!resultado.rows.length}
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar XLSX
          </Button>
        }
      />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Consulta do Auge</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-end">
          <div className="space-y-1.5 min-w-0">
            <Label htmlFor="idConsulta" className="text-xs">
              ID da consulta
            </Label>
            <Input
              id="idConsulta"
              list="auge-consultas"
              value={idConsulta}
              onChange={(e) => setIdConsulta(e.target.value)}
              placeholder="Ex.: 128 — ou selecione na lista"
              className="h-11"
            />
            <datalist id="auge-consultas">
              {(consultas.data ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </datalist>
            <p className="text-[11px] text-muted-foreground">
              {consultas.isLoading
                ? 'Carregando consultas disponíveis…'
                : consultas.data?.length
                  ? `${consultas.data.length} consultas encontradas no Auge.`
                  : 'Não foi possível listar automaticamente — informe o ID manualmente.'}
            </p>
          </div>
          <Button
            onClick={() => executar.mutate(idConsulta.trim())}
            disabled={!idConsulta.trim() || carregando}
            className="h-11 w-full md:w-auto"
          >
            {carregando ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : resultado.rows.length ? (
              <RefreshCw className="w-4 h-4 mr-2" />
            ) : (
              <Search className="w-4 h-4 mr-2" />
            )}
            {carregando ? 'Consultando…' : 'Buscar no Auge'}
          </Button>
        </CardContent>
      </Card>

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
        </Tabs>
      )}

      {!carregando && !resultado.columns.length && (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Informe o ID da consulta e clique em “Buscar no Auge” para gerar a lista de itens com
            saldo baixo. Os filtros {ANALISE_COMPRA_PRESETS.map((p) => p.label).join(', ')} são
            aplicados automaticamente sobre o resultado.
            <span className="sr-only">{ativo?.label}</span>
          </CardContent>
        </Card>
      )}
    </PageShell>
  );
}
