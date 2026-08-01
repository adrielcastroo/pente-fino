import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Loader2, Layers, ArrowRightLeft } from 'lucide-react';

interface PosicaoLike {
  item?: string | null;
  status?: string | null;
  estrutura?: string | null;
}

interface TopTecidosBlocksProps {
  posicoes: PosicaoLike[];
  describeItem: (raw: string | null | undefined) => string;
}

interface GiroRow {
  codigo: string;
  descricao: string;
  quantidade: number;
  movimentos: number;
}

/**
 * Blocos analíticos do mapa:
 *  - Top 5 tecidos que mais ocupam posições (rolos totais)
 *  - Top 10 tecidos com maior giro (transferências do depósito 01 → 15)
 */
export function TopTecidosBlocks({ posicoes, describeItem }: TopTecidosBlocksProps) {
  const [giro, setGiro] = useState<GiroRow[]>([]);
  const [loadingGiro, setLoadingGiro] = useState(true);

  const topOcupacao = useMemo(() => {
    const map = new Map<string, { label: string; rolos: number }>();
    for (const p of posicoes) {
      if (p.status !== 'ocupado') continue;
      const raw = (p.item || '').trim();
      if (!raw) continue;
      const key = raw.toUpperCase();
      const cur = map.get(key) || { label: describeItem(raw) || raw, rolos: 0 };
      cur.rolos += 1;
      map.set(key, cur);
    }
    return Array.from(map.entries())
      .map(([codigo, v]) => ({ codigo, ...v }))
      .sort((a, b) => b.rolos - a.rolos)
      .slice(0, 5);
  }, [posicoes, describeItem]);

  const maxRolos = topOcupacao[0]?.rolos || 1;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingGiro(true);
      try {
        // Giro = transferências saindo do depósito 01 (CD) para o 15 (produção).
        const { data, error } = await supabase
          .from('auge_transferencias')
          .select('codigo_produto, descricao_produto, quantidade')
          .eq('deposito_origem', '01')
          .eq('deposito_destino', '15')
          .limit(5000);
        if (error) throw error;
        if (cancelled) return;
        const map = new Map<string, GiroRow>();
        for (const r of (data as any[]) || []) {
          const codigo = String(r.codigo_produto || '').trim();
          if (!codigo) continue;
          const cur = map.get(codigo) || {
            codigo,
            descricao: r.descricao_produto || describeItem(codigo) || codigo,
            quantidade: 0,
            movimentos: 0,
          };
          cur.quantidade += Number(r.quantidade) || 0;
          cur.movimentos += 1;
          map.set(codigo, cur);
        }
        setGiro(Array.from(map.values()).sort((a, b) => b.movimentos - a.movimentos).slice(0, 10));
      } catch (e) {
        console.warn('Falha ao carregar giro de tecidos:', e);
      } finally {
        if (!cancelled) setLoadingGiro(false);
      }
    })();
    return () => { cancelled = true; };
  }, [describeItem]);

  const maxMov = giro[0]?.movimentos || 1;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
      {/* Top 5 ocupação */}
      <div className="bg-card border border-border rounded-lg p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-semibold text-foreground flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-primary" strokeWidth={1.75} />
            Top 5 tecidos que mais ocupam
          </h4>
          <Badge variant="outline" className="text-[10px]">rolos</Badge>
        </div>
        {topOcupacao.length === 0 ? (
          <div className="py-8 text-center text-[11px] text-muted-foreground">Sem posições ocupadas.</div>
        ) : (
          <ul className="space-y-2.5">
            {topOcupacao.map((t, i) => (
              <li key={t.codigo} className="space-y-1">
                <div className="flex items-center gap-2 text-xs">
                  <span className="w-4 text-[10px] font-semibold text-muted-foreground tabular-nums">{i + 1}º</span>
                  <span className="flex-1 min-w-0 truncate font-medium text-foreground" title={t.label}>{t.label}</span>
                  <span className="tabular-nums font-semibold text-foreground shrink-0">{t.rolos}</span>
                </div>
                <div className="h-1 bg-muted rounded-full overflow-hidden ml-6">
                  <div className="h-full bg-emerald-500" style={{ width: `${Math.round((t.rolos / maxRolos) * 100)}%` }} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Top 10 giro */}
      <div className="bg-card border border-border rounded-lg p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-semibold text-foreground flex items-center gap-2">
            <ArrowRightLeft className="w-3.5 h-3.5 text-sky-400" strokeWidth={1.75} />
            Top 10 tecidos com maior giro
          </h4>
          <Badge variant="outline" className="text-[10px]">dep. 01 → 15</Badge>
        </div>
        {loadingGiro ? (
          <div className="flex items-center justify-center py-10 gap-2 text-[11px] text-muted-foreground">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Calculando giro…
          </div>
        ) : giro.length === 0 ? (
          <div className="py-8 text-center text-[11px] text-muted-foreground">Sem transferências 01 → 15 registradas.</div>
        ) : (
          <ul className="space-y-2">
            {giro.map((g, i) => (
              <li key={g.codigo} className="space-y-1">
                <div className="flex items-center gap-2 text-xs">
                  <span className="w-4 text-[10px] font-semibold text-muted-foreground tabular-nums">{i + 1}º</span>
                  <span className="flex-1 min-w-0 truncate font-medium text-foreground" title={g.descricao}>{g.descricao}</span>
                  <span className="tabular-nums text-[10px] text-muted-foreground shrink-0">
                    {g.quantidade.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} un
                  </span>
                  <span className="tabular-nums font-semibold text-foreground shrink-0 w-8 text-right">{g.movimentos}x</span>
                </div>
                <div className="h-1 bg-muted rounded-full overflow-hidden ml-6">
                  <div className="h-full bg-sky-500" style={{ width: `${Math.round((g.movimentos / maxMov) * 100)}%` }} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default TopTecidosBlocks;
