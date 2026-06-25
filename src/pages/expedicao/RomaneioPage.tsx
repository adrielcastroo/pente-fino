import { useMemo, useState } from 'react';
import { ChevronRight, Loader2, Truck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { usePickings } from '@/hooks/expedicao/useExpedicaoData';

type Node = Map<string, Map<string, Map<string, typeof emptyArr>>>;
const emptyArr: { id: string; numero: string; cliente: string }[] = [];

export default function RomaneioPage() {
  const { data, isLoading } = usePickings();
  const [filter, setFilter] = useState('');

  const tree = useMemo(() => {
    const map = new Map<string, Map<string, Map<string, { id: string; numero: string; cliente: string }[]>>>();
    const q = filter.trim().toLowerCase();
    (data ?? [])
      .filter(p => ['conferido', 'em_conferencia'].includes(p.status))
      .filter(p => !q || p.numero.toLowerCase().includes(q) || p.cliente.toLowerCase().includes(q))
      .forEach((p) => {
        const t = p.transportadora?.nome ?? 'Sem transportadora';
        const r = p.regiao ?? 'Sem região';
        const c = p.cidade ?? 'Sem cidade';
        if (!map.has(t)) map.set(t, new Map());
        const tNode = map.get(t)!;
        if (!tNode.has(r)) tNode.set(r, new Map());
        const rNode = tNode.get(r)!;
        if (!rNode.has(c)) rNode.set(c, []);
        rNode.get(c)!.push({ id: p.id, numero: p.numero, cliente: p.cliente });
      });
    return map;
  }, [data, filter]);

  const totalPickings = useMemo(
    () => Array.from(tree.values()).flatMap(r => Array.from(r.values()).flatMap(c => Array.from(c.values()))).reduce((s, arr) => s + arr.length, 0),
    [tree]
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Romaneio</h1>
          <p className="text-sm text-muted-foreground">
            Transportadora → Região → Cidade → Cliente · <span className="font-mono">{totalPickings}</span> pickings
          </p>
        </div>
        <Input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filtrar por número ou cliente"
          className="h-10 w-full md:w-72"
        />
      </header>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Carregando…
        </div>
      ) : tree.size === 0 ? (
        <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
          Nenhum picking conferido no momento.
        </p>
      ) : (
        <div className="space-y-3">
          {Array.from(tree.entries()).map(([transp, regioes]) => (
            <details key={transp} open className="group rounded-lg border bg-card">
              <summary className="flex cursor-pointer list-none items-center gap-2 p-4 font-medium">
                <ChevronRight className="size-4 transition-transform group-open:rotate-90" />
                <Truck className="size-4 text-muted-foreground" />
                <span>{transp}</span>
                <Badge variant="outline" className="ml-auto font-mono">
                  {Array.from(regioes.values()).flatMap(c => Array.from(c.values())).reduce((s, a) => s + a.length, 0)}
                </Badge>
              </summary>
              <div className="space-y-2 border-t px-4 py-3">
                {Array.from(regioes.entries()).map(([reg, cidades]) => (
                  <details key={reg} open className="group/r ml-4">
                    <summary className="flex cursor-pointer list-none items-center gap-2 py-1 text-sm font-medium text-muted-foreground">
                      <ChevronRight className="size-3 transition-transform group-open/r:rotate-90" />
                      {reg}
                    </summary>
                    <div className="ml-5 space-y-2 py-1">
                      {Array.from(cidades.entries()).map(([cid, pickings]) => (
                        <div key={cid}>
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">{cid}</p>
                          <ul className="ml-2 divide-y">
                            {pickings.map((p) => (
                              <li key={p.id} className="flex items-center justify-between py-1.5 text-sm">
                                <span className="font-mono">{p.numero}</span>
                                <span className="text-muted-foreground">{p.cliente}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </details>
                ))}
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
