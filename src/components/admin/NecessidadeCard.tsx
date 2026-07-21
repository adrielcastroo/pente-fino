import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { toast } from 'sonner';
import { Boxes, Loader2, Search, PackagePlus, ExternalLink, AlertTriangle } from 'lucide-react';

interface Deposito { codigo: string; nome: string | null }

interface NecessidadeRow {
  cdItem: string;
  nmItem: string;
  cdDepositoOrigem: string;
  nmDepositoOrigem: string;
  unidade: string;
  qtEstoqueGeral: number;
  qtEstoque: number;
  qtSaida: number;
  qtDisponivel: number;
  qtMinimo: number;
  qtRecomendacao: number;
  dsAviso: string;
  idControleLote: boolean;
  idControleSerie: boolean;
  qtConsumo30d: number;
  idRnpPadrao: string;
}

const fmt = (n: number) => n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

async function callAuge(action: string, body: Record<string, unknown>) {
  const { data: session } = await supabase.auth.getSession();
  const token = session.session?.access_token;
  const anon = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY) as string;
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auge-sync?action=${action}`;
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

export default function NecessidadeCard() {
  const [depositos, setDepositos] = useState<Deposito[]>([]);
  const [destino, setDestino] = useState('');
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<NecessidadeRow[] | null>(null);
  const [busca, setBusca] = useState('');
  const [selecionados, setSelecionados] = useState<Record<string, { qtd: string }>>({});
  const [somenteRecomendados, setSomenteRecomendados] = useState(true);
  const [criando, setCriando] = useState(false);
  const [ultimoDoc, setUltimoDoc] = useState<{ cd: string; itens: number; efetivado: boolean } | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any).from('auge_depositos').select('codigo,nome').order('codigo');
      setDepositos(data || []);
    })();
  }, []);

  const chave = (r: NecessidadeRow) => `${r.cdItem}::${r.cdDepositoOrigem}`;

  const filtradas = useMemo(() => {
    if (!rows) return [];
    const q = busca.trim().toLowerCase();
    return rows.filter(r => {
      // Origem sempre "01 - Central" e apenas itens com saldo em 01.
      if (r.cdDepositoOrigem !== '01') return false;
      if (r.qtEstoque <= 0) return false;
      if (somenteRecomendados && r.qtRecomendacao <= 0) return false;
      if (!q) return true;
      return r.cdItem.toLowerCase().includes(q) || r.nmItem.toLowerCase().includes(q);
    });
  }, [rows, busca, somenteRecomendados]);

  const listar = async () => {
    if (!destino) { toast.error('Selecione o depósito destino.'); return; }
    setLoading(true);
    setRows(null);
    setSelecionados({});
    try {
      const resp = await callAuge('necessidade_listar', { cdDepositoDestino: destino, cdDepositoOrigem: '01' });
      if (!resp?.ok) {
        toast.error(resp?.error ?? 'Falha ao consultar necessidades.');
        return;
      }
      setRows(resp.data as NecessidadeRow[]);
      const comSaldo = (resp.data as NecessidadeRow[]).filter(r => r.cdDepositoOrigem === '01' && r.qtEstoque > 0).length;
      toast.success(`${comSaldo} item(ns) com saldo no depósito 01.`);
    } finally {
      setLoading(false);
    }
  };

  const toggle = (r: NecessidadeRow) => {
    setSelecionados(prev => {
      const k = chave(r);
      const cp = { ...prev };
      if (cp[k]) delete cp[k];
      else cp[k] = { qtd: String(r.qtRecomendacao || r.qtSaida || 0).replace('.', ',') };
      return cp;
    });
  };

  const marcarTodos = () => {
    const novos: Record<string, { qtd: string }> = {};
    for (const r of filtradas) {
      if (r.qtRecomendacao > 0) novos[chave(r)] = { qtd: String(r.qtRecomendacao).replace('.', ',') };
    }
    setSelecionados(novos);
  };

  const totalSelecionados = Object.keys(selecionados).length;

  const criarRascunho = async () => {
    if (!destino) return;
    if (!totalSelecionados) { toast.error('Selecione ao menos 1 item.'); return; }
    setCriando(true);
    setUltimoDoc(null);
    const t = toast.loading('Montando rascunho no Auge (FIFO automático para lotes/séries)…');
    try {
      const itens = Object.entries(selecionados).map(([k, v]) => {
        const [cdItem, cdOrigem] = k.split('::');
        const row = rows!.find(r => r.cdItem === cdItem && r.cdDepositoOrigem === cdOrigem)!;
        return {
          cdItem,
          cdDepositoOrigem: cdOrigem,
          qtd: Number(String(v.qtd).replace(',', '.')) || 0,
          idControleLote: row.idControleLote,
          idControleSerie: row.idControleSerie,
        };
      }).filter(i => i.qtd > 0);

      const resp = await callAuge('necessidade_criar', {
        cdDepositoDestino: destino,
        itens,
        observacao: 'Necessidade (Pente Fino)',
      });
      if (!resp?.ok) {
        toast.error(resp?.error ?? 'Falha ao criar rascunho.', { id: t });
        return;
      }
      setUltimoDoc({ cd: String(resp.cdMovimentacao), itens: resp.itens_criados, efetivado: !!resp.efetivado });
      const parciais = (resp.relatorio ?? []).filter((r: any) => r.status === 'parcial' || r.status === 'sem_estoque').length;
      toast.success(
        `Rascunho ${resp.cdMovimentacao} criado (${resp.itens_criados} item[ns])${parciais ? ` — ${parciais} parciais` : ''}.`,
        { id: t },
      );
      setSelecionados({});
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
              <Boxes className="h-4 w-4 text-primary" /> Necessidade de Transferências
            </CardTitle>
            <CardDescription className="mt-1">
              Escolha o depósito destino, revise o que está sendo consumido e crie um rascunho no Auge
              — lotes de tecido e séries de motores são selecionados automaticamente por FIFO.
            </CardDescription>
          </div>
          <Badge variant="outline">Auge</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto] items-end">
          <div className="grid gap-1.5">
            <Label className="text-xs">Depósito destino *</Label>
            <Select value={destino} onValueChange={setDestino}>
              <SelectTrigger className="h-10"><SelectValue placeholder="Selecione…" /></SelectTrigger>
              <SelectContent>
                {depositos.map(d => (
                  <SelectItem key={d.codigo} value={d.codigo}>
                    <span className="font-mono">{d.codigo}</span> {d.nome ? `— ${d.nome}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs">Origem</Label>
            <div className="h-10 px-3 flex items-center rounded-md border bg-muted text-xs font-mono">
              01 — Central
            </div>
          </div>
          <Button onClick={listar} disabled={!destino || loading} className="h-10 gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Listar necessidades
          </Button>
        </div>

        {loading && <Skeleton className="h-40 w-full" />}

        {rows && (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input value={busca} onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar por código ou descrição…" className="pl-7 h-9" />
              </div>
              <label className="flex items-center gap-2 text-xs cursor-pointer select-none">
                <Checkbox checked={somenteRecomendados} onCheckedChange={(v) => setSomenteRecomendados(!!v)} />
                Só com recomendação {'>'} 0
              </label>
              <Button variant="outline" size="sm" onClick={marcarTodos} className="h-9">
                Marcar todos filtrados
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setSelecionados({})} className="h-9" disabled={!totalSelecionados}>
                Limpar seleção
              </Button>
              <div className="ml-auto text-xs text-muted-foreground">
                {filtradas.length} de {rows.length} · <span className="text-primary font-medium">{totalSelecionados} selecionado(s)</span>
              </div>
            </div>

            <div className="rounded-md border overflow-auto max-h-[520px]">
              <table className="w-full text-xs">
                <thead className="bg-card sticky top-0 z-10 shadow-[0_1px_0_0_hsl(var(--border))]">
                  <tr className="text-muted-foreground">
                    <th className="px-2 py-2 w-8"></th>
                    <th className="px-2 py-2 text-left">Item</th>
                    <th className="px-2 py-2 text-left">Descrição</th>
                    <th className="px-2 py-2 text-left">Origem</th>
                    <th className="px-2 py-2 text-right">Estoque</th>
                    <th className="px-2 py-2 text-right">Saída</th>
                    <th className="px-2 py-2 text-right">Disp.</th>
                    <th className="px-2 py-2 text-right">Recom.</th>
                    <th className="px-2 py-2 text-right">Qtd transferir</th>
                    <th className="px-2 py-2 text-left">Controle</th>
                  </tr>
                </thead>
                <tbody>
                  {filtradas.map(r => {
                    const k = chave(r);
                    const sel = selecionados[k];
                    const neg = r.qtDisponivel < 0;
                    return (
                      <tr key={k} className={`border-t hover:bg-muted/30 ${sel ? 'bg-primary/5' : ''}`}>
                        <td className="px-2 py-1.5"><Checkbox checked={!!sel} onCheckedChange={() => toggle(r)} /></td>
                        <td className="px-2 py-1.5 font-mono text-primary">{r.cdItem}</td>
                        <td className="px-2 py-1.5 max-w-[280px] truncate" title={r.nmItem}>{r.nmItem}</td>
                        <td className="px-2 py-1.5 font-mono">{r.cdDepositoOrigem}</td>
                        <td className="px-2 py-1.5 text-right font-mono">{fmt(r.qtEstoque)}</td>
                        <td className="px-2 py-1.5 text-right font-mono">{fmt(r.qtSaida)}</td>
                        <td className={`px-2 py-1.5 text-right font-mono ${neg ? 'text-destructive font-semibold' : ''}`}>
                          {fmt(r.qtDisponivel)}
                        </td>
                        <td className="px-2 py-1.5 text-right font-mono text-primary font-semibold">{fmt(r.qtRecomendacao)}</td>
                        <td className="px-2 py-1.5 text-right">
                          {sel ? (
                            <Input value={sel.qtd}
                              onChange={(e) => setSelecionados(p => ({ ...p, [k]: { qtd: e.target.value.replace(/[^\d.,]/g, '') } }))}
                              className="h-7 text-right font-mono text-xs w-24 ml-auto" />
                          ) : <span className="text-muted-foreground">—</span>}
                        </td>
                        <td className="px-2 py-1.5">
                          {r.idControleSerie && <Badge variant="secondary" className="text-[10px]">Série</Badge>}
                          {r.idControleLote && <Badge variant="secondary" className="text-[10px]">Lote</Badge>}
                          {!r.idControleLote && !r.idControleSerie && <span className="text-muted-foreground text-[10px]">—</span>}
                        </td>
                      </tr>
                    );
                  })}
                  {!filtradas.length && (
                    <tr><td colSpan={10} className="px-3 py-6 text-center text-muted-foreground">Nenhum resultado com os filtros atuais.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Button onClick={criarRascunho} disabled={!totalSelecionados || criando} className="h-10 gap-2">
                {criando ? <Loader2 className="h-4 w-4 animate-spin" /> : <PackagePlus className="h-4 w-4" />}
                Criar rascunho no Auge ({totalSelecionados})
              </Button>
              {ultimoDoc && (
                <div className="flex items-center gap-2 text-xs rounded-md border bg-emerald-500/5 px-3 py-2">
                  <span className="text-emerald-600 font-medium">Rascunho {ultimoDoc.cd}</span>
                  <span className="text-muted-foreground">· {ultimoDoc.itens} item(ns){ultimoDoc.efetivado ? ' · efetivado' : ''}</span>
                  <a href="https://unilux.auge.app/l.unilux/modInventario/estoque/gerirTransferenciaEstoque.php"
                    target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-1 text-primary underline">
                    <ExternalLink className="h-3 w-3" /> abrir no Auge
                  </a>
                </div>
              )}
            </div>

            <p className="text-[11px] text-muted-foreground flex items-start gap-1.5">
              <AlertTriangle className="h-3 w-3 mt-0.5 text-warning shrink-0" />
              Motores (controle por série) não são fracionados — cada série entra inteira. Itens sem estoque suficiente
              são reportados como “parcial” ou “sem estoque” no retorno.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
