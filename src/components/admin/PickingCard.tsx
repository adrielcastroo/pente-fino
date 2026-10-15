import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Loader2, Search, Package, CheckCircle2, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const DEPOSITO_ORIGEM_PADRAO = '01';
const DEPOSITO_DESTINO = 'Balcão.';

interface PickingRow {
  index: number;
  nrPedido: string;
  nomeCliente: string;
  nomeItem: string;
  quantidade: string;
  unidadeMedida: string;
  dtEntrega: string;
  deposito: string;
  obsPV: string;
  obsItem: string;
  selecionado: boolean;
}

function fmtDate(d: Date): string {
  return format(d, 'dd/MM/yyyy', { locale: ptBR });
}

function fmtDateForInput(d: Date): string {
  return format(d, 'yyyy-MM-dd');
}

async function callAuge(body: Record<string, unknown>) {
  const { data: session } = await (await import('@/integrations/supabase/client')).supabase.auth.getSession();
  const token = session.session?.access_token;
  const anon = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY) as string;
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auge-sync`;
  const r = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: anon,
      Authorization: `Bearer ${token ?? anon}`,
    },
    body: JSON.stringify(body),
  });
  const txt = await r.text();
  try { return JSON.parse(txt); } catch { return { ok: false, error: txt.slice(0, 400) }; }
}

export default function PickingCard() {
  const hoje = new Date();
  const amanha3 = new Date(hoje.getTime() + 3 * 86400000);
  const [dataInicio, setDataInicio] = useState(fmtDate(hoje));
  const [dataFim, setDataFim] = useState(fmtDate(amanha3));
  const [inputDataInicio, setInputDataInicio] = useState(fmtDateForInput(hoje));
  const [inputDataFim, setInputDataFim] = useState(fmtDateForInput(amanha3));
  const STATUS_PADRAO = 'atend';
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<PickingRow[]>([]);
  const [criando, setCriando] = useState(false);
  const [resultados, setResultados] = useState<Array<{ pedido: string; cdMovimentacao?: string; erro?: string }>>([]);

  const selecionados = useMemo(() => rows.filter(r => r.selecionado), [rows]);
  const podeConsultar = dataInicio && dataFim;
  const podeCriar = selecionados.length > 0 && !criando;

  const handleConsultar = async () => {
    setLoading(true);
    setResultados([]);
    try {
      const resp = await callAuge({
        action: 'run_consulta',
        idConsulta: '1699',
        parametros: { param_0: STATUS_PADRAO, param_1: dataInicio, param_2: dataFim },
      });
      if (!resp?.ok) {
        toast.error(resp?.error ?? 'Falha ao consultar Auge.');
        setLoading(false);
        return;
      }
      const data = resp.resultado?.data ?? [];
      const mapped: PickingRow[] = data.map((row: string[], i: number) => {
        const rawDeposito = row[6] ?? '';
        const deposito = /^\d+$/.test(rawDeposito) ? rawDeposito : DEPOSITO_ORIGEM_PADRAO;
        return {
          index: i,
          nrPedido: row[0] ?? '',
          nomeCliente: row[1] ?? '',
          nomeItem: row[2] ?? '',
          quantidade: row[3] ?? '',
          unidadeMedida: row[4] ?? '',
          dtEntrega: row[5] ?? '',
          deposito,
          obsPV: row[7] ?? '',
          obsItem: row[8] ?? '',
          selecionado: false,
        };
      });
      setRows(mapped);
      toast.success(`${mapped.length} pedido(s) encontrado(s).`);
    } catch (e: any) {
      toast.error(e?.message ?? 'Erro na consulta.');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelecionar = (index: number) => {
    setRows(rs => rs.map((r, i) => i === index ? { ...r, selecionado: !r.selecionado } : r));
  };

  const selecionarTodos = () => {
    const todosSelecionados = rows.every(r => r.selecionado);
    setRows(rs => rs.map(r => ({ ...r, selecionado: !todosSelecionados })));
  };

  const handleCriar = async () => {
    setCriando(true);
    setResultados([]);
    try {
      const grupos = new Map<string, PickingRow[]>();
      for (const row of selecionados) {
        const chave = `${row.nrPedido}|${row.dtEntrega}`;
        if (!grupos.has(chave)) grupos.set(chave, []);
        grupos.get(chave)!.push(row);
      }

      const resultadosTemp: Array<{ pedido: string; cdMovimentacao?: string; erro?: string }> = [];
      let sucesso = 0;
      let falha = 0;

      const extraiCodigo = (nome: string): string => {
        const m = nome.match(/\[([^\]]+)\]\s*$/);
        return m ? m[1].trim() : nome.trim();
      };

      for (const [chave, grupo] of grupos) {
        const [nrPedido, dtEntrega] = chave.split('|');
        const observacao = `Picking ${dtEntrega} - ${grupo[0].nomeCliente} - ${nrPedido}`;
        const itens = grupo.map(r => ({
          cdItem: extraiCodigo(r.nomeItem),
          cdDepositoOrigem: r.deposito,
          cdDepositoDestino: DEPOSITO_DESTINO,
          qtd: r.quantidade.replace('.', ','),
        }));

        const resp = await callAuge({
          action: 'picking_criar',
          itens,
          observacao,
        });

        if (!resp?.ok || resp?.cdMovimentacao === undefined) {
          resultadosTemp.push({ pedido: nrPedido, erro: resp?.error ?? 'Falha ao criar transferência' });
          falha++;
        } else {
          resultadosTemp.push({ pedido: nrPedido, cdMovimentacao: resp.cdMovimentacao });
          sucesso++;
        }
      }

      setResultados(resultadosTemp);
      toast.success(`${sucesso} transferência(s) criada(s), ${falha} falha(s).`);
    } catch (e: any) {
      toast.error(e?.message ?? 'Erro ao criar transferências.');
    } finally {
      setCriando(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Package className="h-4 w-4 text-primary" />
              Picking
            </CardTitle>
            <CardDescription className="mt-1">
              Consulta pedidos de venda com entrega prevista e gera esboços de transferência
              para separação de itens. Observação padrão:
              <code className="mx-1 rounded bg-muted px-1 py-0.5 text-[11px] ml-1">
                Picking {'{Dt. Entrega}'} - {'{Nome Cliente}'} - {'{Nr. pedido}'}
              </code>
            </CardDescription>
          </div>
          <Badge variant="outline" className="gap-1"><Package className="h-3 w-3" /> Auge</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Filtros */}
        <div className="grid gap-3 sm:grid-cols-[120px_1fr_120px_1fr_auto] items-end">
          <div className="grid gap-1.5">
            <Label htmlFor="pick-data-inicio" className="text-xs">Data início</Label>
            <Input
              id="pick-data-inicio"
              type="date"
              value={inputDataInicio}
              onChange={(e) => { setInputDataInicio(e.target.value); setDataInicio(fmtDate(new Date(e.target.value))); }}
              className="h-9 text-xs"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="pick-data-fim" className="text-xs">Data fim</Label>
            <Input
              id="pick-data-fim"
              type="date"
              value={inputDataFim}
              onChange={(e) => { setInputDataFim(e.target.value); setDataFim(fmtDate(new Date(e.target.value))); }}
              className="h-9 text-xs"
            />
          </div>
          <div className="flex items-end">
            <Button onClick={handleConsultar} disabled={!podeConsultar || loading} className="gap-2 h-9 text-xs">
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
              Consultar
            </Button>
          </div>
        </div>

        {/* Resultados da consulta */}
        {loading && <Skeleton className="h-48 w-full" />}
        {!loading && rows.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {rows.length} linha(s) encontrada(s) · {selecionados.length} selecionada(s)
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={selecionarTodos}>
                  {selecionados.length === rows.length ? 'Desmarcar todos' : 'Selecionar todos'}
                </Button>
                <Button
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={handleCriar}
                  disabled={!podeCriar}
                >
                  {criando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Package className="h-3.5 w-3.5" />}
                  Criar transferências ({selecionados.length})
                </Button>
              </div>
            </div>

            <div className="rounded-md border max-h-[400px] overflow-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted/50 sticky top-0 z-10">
                  <tr>
                    <th className="px-2 py-2 w-8"><input type="checkbox" checked={selecionados.length === rows.length && rows.length > 0} onChange={selecionarTodos} /></th>
                    <th className="px-2 py-2 text-left font-medium">Nr. Pedido</th>
                    <th className="px-2 py-2 text-left font-medium">Cliente</th>
                    <th className="px-2 py-2 text-left font-medium">Nome Item</th>
                    <th className="px-2 py-2 text-right font-medium">Qtd</th>
                    <th className="px-2 py-2 text-left font-medium">Unid.</th>
                    <th className="px-2 py-2 text-center font-medium">Dt. Entrega</th>
                    <th className="px-2 py-2 text-left font-medium">Depósito</th>
                    <th className="px-2 py-2 text-left font-medium">Obs. PV</th>
                    <th className="px-2 py-2 text-left font-medium">Obs. Item</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr
                      key={row.index}
                      className={`border-t cursor-pointer hover:bg-muted/30 ${row.selecionado ? 'bg-primary/5' : ''}`}
                      onClick={() => toggleSelecionar(row.index)}
                    >
                      <td className="px-2 py-1.5 text-center">
                        <input
                          type="checkbox"
                          checked={row.selecionado}
                          onChange={() => toggleSelecionar(row.index)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </td>
                      <td className="px-2 py-1.5 font-mono">{row.nrPedido}</td>
                      <td className="px-2 py-1.5 max-w-[200px] truncate">{row.nomeCliente}</td>
                      <td className="px-2 py-1.5 max-w-[250px] break-words">{row.nomeItem}</td>
                      <td className="px-2 py-1.5 text-right font-mono">{row.quantidade}</td>
                      <td className="px-2 py-1.5 text-center">{row.unidadeMedida}</td>
                      <td className="px-2 py-1.5 text-center">{row.dtEntrega}</td>
                      <td className="px-2 py-1.5 font-mono">{row.deposito}</td>
                      <td className="px-2 py-1.5 max-w-[150px] truncate">{row.obsPV}</td>
                      <td className="px-2 py-1.5 max-w-[150px] break-words">{row.obsItem}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Resultados da criação */}
            {resultados.length > 0 && (
              <div className="rounded-md border bg-muted/20 p-3 space-y-2">
                <div className="text-xs font-medium">Resultado da criação</div>
                {resultados.map((r, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    {r.erro ? (
                      <XCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    )}
                    <span className="font-mono">{r.pedido}</span>
                    {r.cdMovimentacao && (
                      <span className="text-muted-foreground">→ {r.cdMovimentacao}</span>
                    )}
                    {r.erro && <span className="text-destructive">{r.erro}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {!loading && rows.length === 0 && (
          <div className="text-center py-8 text-xs text-muted-foreground">
            Configure as datas e clique em <strong>Consultar</strong> para buscar pedidos de picking.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
