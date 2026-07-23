import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Loader2, ArrowDownAZ, ArrowUpAZ, TagIcon, AlertTriangle } from 'lucide-react';
import { isMissingTag } from '@/lib/tag-utils';

interface Acabamento {
  cd_acabamento: string;
  chave_acabamento: string | null;
  nm_acabamento: string;
  ds_tag_calculada: string | null;
  ds_descricao_tag_calculada: string | null;
  id_cancelado: string | null;
  synced_at: string | null;
}

export default function TagsTab() {
  const [busca, setBusca] = useState('');
  const [somenteSemTag, setSomenteSemTag] = useState(true);
  const [sortBy, setSortBy] = useState<'nome' | 'tag'>('nome');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const { data: acabamentos = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['acabamentos-tags'],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('auge_acabamentos')
        .select('cd_acabamento, chave_acabamento, nm_acabamento, ds_tag_calculada, ds_descricao_tag_calculada, id_cancelado, synced_at')
        .neq('id_cancelado', 'S')
        .order('nm_acabamento', { ascending: true })
        .limit(5000);
      return (data ?? []) as Acabamento[];
    },
  });

  const totalSemTag = useMemo(() => acabamentos.filter(isMissingTag).length, [acabamentos]);

  const lista = useMemo(() => {
    const t = busca.trim().toLowerCase();
    let arr = acabamentos.filter((a) => {
      if (somenteSemTag && !isMissingTag(a)) return false;
      if (t) {
        return (a.nm_acabamento ?? '').toLowerCase().includes(t) ||
               (a.chave_acabamento ?? '').toLowerCase().includes(t) ||
               (a.ds_tag_calculada ?? '').toLowerCase().includes(t) ||
               (a.cd_acabamento ?? '').toLowerCase().includes(t);
      }
      return true;
    });
    arr = [...arr].sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'nome') cmp = (a.nm_acabamento ?? '').localeCompare(b.nm_acabamento ?? '', 'pt-BR', { sensitivity: 'base' });
      else cmp = (a.ds_tag_calculada ?? '').localeCompare(b.ds_tag_calculada ?? '', 'pt-BR', { sensitivity: 'base' });
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return arr;
  }, [acabamentos, busca, somenteSemTag, sortBy, sortDir]);

  return (
    <div className="space-y-3">
      <Card className="p-3">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <div className="text-[10px] uppercase text-muted-foreground">Total acabamentos</div>
            <div className="text-lg font-semibold font-mono">{acabamentos.length}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase text-muted-foreground">Sem TAG</div>
            <div className="text-lg font-semibold font-mono text-destructive">{totalSemTag}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase text-muted-foreground">Com TAG</div>
            <div className="text-lg font-semibold font-mono text-emerald-600">{acabamentos.length - totalSemTag}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase text-muted-foreground">% Cobertura</div>
            <div className="text-lg font-semibold font-mono">
              {acabamentos.length ? Math.round(((acabamentos.length - totalSemTag) / acabamentos.length) * 100) : 0}%
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-3 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar configuração ou TAG..." className="h-9 pl-7 text-xs" />
          </div>
          <Button
            size="sm"
            variant={somenteSemTag ? 'default' : 'outline'}
            onClick={() => setSomenteSemTag((v) => !v)}
            className="h-9 gap-2 text-[11px]"
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            Somente sem TAG
          </Button>
          <Button size="sm" variant="outline" onClick={() => refetch()} disabled={isFetching} className="h-9 gap-2 text-[11px]">
            {isFetching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <TagIcon className="h-3.5 w-3.5" />}
            Recarregar
          </Button>
        </div>

        <div className="overflow-auto max-h-[70vh] rounded border">
          <table className="w-full text-xs">
            <thead className="bg-muted sticky top-0 z-10">
              <tr className="text-left">
                <th className="p-2 cursor-pointer select-none" onClick={() => { if (sortBy === 'nome') setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortBy('nome'); setSortDir('asc'); } }}>
                  <div className="flex items-center gap-1">
                    Configuração
                    {sortBy === 'nome' && (sortDir === 'asc' ? <ArrowDownAZ className="h-3 w-3" /> : <ArrowUpAZ className="h-3 w-3" />)}
                  </div>
                </th>
                <th className="p-2">Código</th>
                <th className="p-2 cursor-pointer select-none" onClick={() => { if (sortBy === 'tag') setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortBy('tag'); setSortDir('asc'); } }}>
                  <div className="flex items-center gap-1">
                    TAG
                    {sortBy === 'tag' && (sortDir === 'asc' ? <ArrowDownAZ className="h-3 w-3" /> : <ArrowUpAZ className="h-3 w-3" />)}
                  </div>
                </th>
                <th className="p-2">Descrição da TAG</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={4} className="p-6 text-center"><Loader2 className="h-4 w-4 animate-spin inline" /></td></tr>
              )}
              {lista.map((a) => {
                const missing = isMissingTag(a);
                return (
                  <tr key={a.cd_acabamento} className="border-t align-top hover:bg-muted/50">
                    <td className="p-2">
                      <div className="font-medium">{a.nm_acabamento}</div>
                    </td>
                    <td className="p-2 font-mono text-[11px] text-muted-foreground whitespace-nowrap">{a.chave_acabamento ?? `#${a.cd_acabamento}`}</td>
                    <td className="p-2">
                      {missing ? (
                        <Badge variant="destructive" className="text-[10px] gap-1">
                          <AlertTriangle className="h-3 w-3" /> SEM TAG
                        </Badge>
                      ) : (
                        <span className="font-mono text-[11px]">{a.ds_tag_calculada}</span>
                      )}
                    </td>
                    <td className="p-2 text-[11px] text-muted-foreground">{a.ds_descricao_tag_calculada ?? '—'}</td>
                  </tr>
                );
              })}
              {!isLoading && lista.length === 0 && (
                <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">Nenhum resultado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
