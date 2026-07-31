import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Link2, Loader2, RefreshCw, Search, CheckCircle2, Layers } from 'lucide-react';
import {
  ItemNome,
  MatchCandidato,
  isKitComForro,
  sugerirTecidos,
  SCORE_AUTO,
} from '@/lib/tecido-kit-match';
import ImportKitsVinculosDialog from '@/components/admin/ImportKitsVinculosDialog';


export interface VinculoRow {
  kit_codigo: string;
  kit_descricao: string | null;
  tecido_codigo: string | null;
  tecido_descricao: string | null;
  origem: string;
  score: number | null;
  confirmado: boolean;
}

/** Carrega kits e tecidos a partir do espelho local dos acabamentos do Auge. */
async function carregarItens(): Promise<{ kits: ItemNome[]; tecidos: ItemNome[] }> {
  const { data, error } = await supabase
    .from('auge_acabamento_itens')
    .select('cd_item_acabamento, ds_item_acabamento_original')
    .limit(20000);
  if (error) throw error;

  const kitsMap = new Map<string, ItemNome>();
  const tecidosMap = new Map<string, ItemNome>();
  for (const row of data ?? []) {
    const codigo = (row.cd_item_acabamento ?? '').trim();
    const descricao = (row.ds_item_acabamento_original ?? '').trim();
    if (!codigo || !descricao) continue;
    const item: ItemNome = { codigo, descricao };
    if (isKitComForro(item)) {
      const atual = kitsMap.get(codigo);
      if (!atual || descricao.length > atual.descricao.length) kitsMap.set(codigo, item);
    } else if (/tecid/i.test(descricao)) {
      tecidosMap.set(`${codigo}|${descricao}`, item);
    }
  }
  return { kits: [...kitsMap.values()], tecidos: [...tecidosMap.values()] };
}

export default function KitsForroCard() {
  const [loading, setLoading] = useState(true);
  const [kits, setKits] = useState<ItemNome[]>([]);
  const [tecidos, setTecidos] = useState<ItemNome[]>([]);
  const [vinculos, setVinculos] = useState<Record<string, VinculoRow>>({});
  const [busca, setBusca] = useState('');
  const [salvando, setSalvando] = useState<string | null>(null);
  const [expandido, setExpandido] = useState<string | null>(null);

  const recarregar = async () => {
    setLoading(true);
    try {
      const [itens, vinc] = await Promise.all([
        carregarItens(),
        supabase.from('tecido_kit_vinculos').select('*'),
      ]);
      setKits(itens.kits);
      setTecidos(itens.tecidos);
      if (vinc.error) throw vinc.error;
      const map: Record<string, VinculoRow> = {};
      for (const v of vinc.data ?? []) map[v.kit_codigo] = v as VinculoRow;
      setVinculos(map);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Falha ao carregar vínculos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void recarregar(); }, []);

  /** Sugestões calculadas apenas para os kits visíveis (custo controlado). */
  const kitsFiltrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return kits
      .filter((k) => !q || k.codigo.toLowerCase().includes(q) || k.descricao.toLowerCase().includes(q))
      .sort((a, b) => a.descricao.localeCompare(b.descricao));
  }, [kits, busca]);

  const sugestoes = useMemo(() => {
    const map = new Map<string, MatchCandidato[]>();
    for (const kit of kitsFiltrados.slice(0, 150)) map.set(kit.codigo, sugerirTecidos(kit, tecidos));
    return map;
  }, [kitsFiltrados, tecidos]);

  const salvarVinculo = async (kit: ItemNome, cand: MatchCandidato | null, origem: 'auto' | 'manual') => {
    setSalvando(kit.codigo);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const payload = {
        kit_codigo: kit.codigo,
        kit_descricao: kit.descricao,
        tecido_codigo: cand?.codigo ?? null,
        tecido_descricao: cand?.descricao ?? null,
        origem,
        score: cand?.score ?? null,
        confirmado: true,
        updated_by: userData.user?.id ?? null,
      };
      const { error } = await supabase
        .from('tecido_kit_vinculos')
        .upsert(payload, { onConflict: 'kit_codigo' });
      if (error) throw error;
      setVinculos((prev) => ({ ...prev, [kit.codigo]: { ...payload } as VinculoRow }));
      setExpandido(null);
      toast.success(cand ? `Kit vinculado a ${cand.codigo}.` : 'Vínculo removido.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Falha ao salvar vínculo.');
    } finally {
      setSalvando(null);
    }
  };

  const aplicarSugestoesAutomaticas = async () => {
    const pendentes = kitsFiltrados.filter((k) => !vinculos[k.codigo]?.tecido_codigo);
    const lote = pendentes
      .map((kit) => ({ kit, cand: sugerirTecidos(kit, tecidos)[0] }))
      .filter((x) => x.cand && x.cand.score >= SCORE_AUTO);
    if (lote.length === 0) { toast.info('Nenhuma sugestão com confiança suficiente.'); return; }
    setSalvando('__lote__');
    try {
      const { data: userData } = await supabase.auth.getUser();
      const rows = lote.map(({ kit, cand }) => ({
        kit_codigo: kit.codigo,
        kit_descricao: kit.descricao,
        tecido_codigo: cand!.codigo,
        tecido_descricao: cand!.descricao,
        origem: 'auto',
        score: cand!.score,
        confirmado: false,
        updated_by: userData.user?.id ?? null,
      }));
      const { error } = await supabase.from('tecido_kit_vinculos').upsert(rows, { onConflict: 'kit_codigo' });
      if (error) throw error;
      toast.success(`${rows.length} vínculo(s) sugerido(s) gravado(s). Revise e confirme.`);
      await recarregar();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Falha ao gravar sugestões.');
    } finally {
      setSalvando(null);
    }
  };

  const totalVinculados = Object.values(vinculos).filter((v) => v.tecido_codigo).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Layers className="h-4 w-4 text-primary" /> Kits com Forro
            </CardTitle>
            <CardDescription className="mt-1">
              Reconhece o tecido base de cada kit (versão com forro / dupla camada) comparando os nomes.
              O vínculo confirmado é usado para replicar automaticamente a “Entrega Após”.
            </CardDescription>
          </div>
          <Badge variant="outline" className="gap-1">
            <Link2 className="h-3 w-3" /> {totalVinculados}/{kits.length} vinculados
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar kit por código ou descrição"
              className="h-10 pl-8"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <ImportKitsVinculosDialog onImported={() => void recarregar()} />
            <Button variant="outline" onClick={() => void recarregar()} disabled={loading} className="h-10 gap-2">
              <RefreshCw className={loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} /> Recarregar
            </Button>

            <Button onClick={() => void aplicarSugestoesAutomaticas()} disabled={loading || salvando === '__lote__'} className="h-10 gap-2">
              {salvando === '__lote__' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
              Sugerir vínculos
            </Button>
          </div>
        </div>

        {loading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <div className="rounded-md border">
            <div className="max-h-[520px] overflow-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 z-10 bg-card text-muted-foreground shadow-[0_1px_0_0_hsl(var(--border))]">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Kit (com forro)</th>
                    <th className="px-3 py-2 text-left font-medium">Tecido base</th>
                    <th className="px-3 py-2 text-right font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {kitsFiltrados.map((kit) => {
                    const v = vinculos[kit.codigo];
                    const cands = sugestoes.get(kit.codigo) ?? [];
                    const top = cands[0];
                    const aberto = expandido === kit.codigo;
                    return (
                      <tr key={kit.codigo} className="border-t align-top">
                        <td className="px-3 py-2">
                          <div className="font-mono text-[11px] text-muted-foreground">{kit.codigo}</div>
                          <div className="max-w-[280px] break-words">{kit.descricao}</div>
                        </td>
                        <td className="px-3 py-2">
                          {v?.tecido_codigo ? (
                            <div>
                              <div className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
                                {v.tecido_codigo}
                                {v.confirmado ? (
                                  <Badge variant="secondary" className="gap-1 px-1.5 py-0 text-[10px]">
                                    <CheckCircle2 className="h-3 w-3" /> confirmado
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="px-1.5 py-0 text-[10px]">sugerido</Badge>
                                )}
                              </div>
                              <div className="max-w-[380px] break-words">{v.tecido_descricao}</div>
                            </div>
                          ) : top ? (
                            <div className="text-muted-foreground">
                              <span className="font-mono text-[11px]">{top.codigo}</span> ·{' '}
                              {Math.round(top.score * 100)}% — {top.descricao}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Sem sugestão</span>
                          )}

                          {aberto && (
                            <div className="mt-2 space-y-1 rounded-md border bg-muted/30 p-2">
                              {cands.length === 0 && <span className="text-muted-foreground">Nenhum candidato encontrado.</span>}
                              {cands.map((c) => (
                                <button
                                  key={c.codigo}
                                  type="button"
                                  onClick={() => void salvarVinculo(kit, c, 'manual')}
                                  className="block w-full rounded px-2 py-1 text-left hover:bg-accent"
                                >
                                  <span className="font-mono text-[11px]">{c.codigo}</span>{' '}
                                  <span className="text-muted-foreground">({Math.round(c.score * 100)}%)</span>
                                  <div className="break-words">{c.descricao}</div>
                                </button>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <div className="flex flex-col items-end gap-1">
                            {!v?.confirmado && top && (
                              <Button
                                size="sm"
                                variant="secondary"
                                className="h-7 text-[11px]"
                                disabled={salvando === kit.codigo}
                                onClick={() => void salvarVinculo(kit, v?.tecido_codigo ? { codigo: v.tecido_codigo, descricao: v.tecido_descricao ?? '', score: v.score ?? 0, tokensEncontrados: [], tokensFaltantes: [] } : top, 'manual')}
                              >
                                Confirmar
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-[11px]"
                              onClick={() => setExpandido(aberto ? null : kit.codigo)}
                            >
                              {aberto ? 'Fechar' : 'Alterar'}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
