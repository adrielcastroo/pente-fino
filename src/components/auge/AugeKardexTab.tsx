import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, History, Loader2, ExternalLink } from '@/components/icons';
import { formatDateBR } from '@/lib/app-utils';
import FichaItemDialog from './FichaItemDialog';

/**
 * Kardex unificado: cronologia consolidada de saídas + transferências (view auge_kardex).
 * Filtrável por código de item — clicando na linha abre a ficha completa.
 */
export default function AugeKardexTab() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [codigo, setCodigo] = useState('');
  const [debounced, setDebounced] = useState('');
  const [fichaCodigo, setFichaCodigo] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(codigo.trim()), 250);
    return () => clearTimeout(t);
  }, [codigo]);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      let query = (supabase as any)
        .from('auge_kardex')
        .select('*')
        .order('data_movimento', { ascending: false, nullsFirst: false })
        .limit(500);
      if (debounced) query = query.ilike('codigo_produto', `%${debounced}%`);
      const { data } = await query;
      if (alive) {
        setRows(data ?? []);
        setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [debounced]);

  const total = useMemo(() => rows.length, [rows]);

  return (
    <div className="flex flex-col gap-4 h-full overflow-hidden">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
          <Input
            value={codigo}
            onChange={e => setCodigo(e.target.value)}
            placeholder="Filtrar por código do item..."
            className="pl-10 h-11"
          />
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
          <History className="w-4 h-4" />
          {total} evento(s) — últimos 60 dias (saídas + transferências).
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : rows.length === 0 ? (
        <Card className="flex flex-col items-center py-12 gap-3 border-dashed">
          <History className="w-10 h-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            {debounced ? `Sem eventos para "${debounced}".` : 'Digite um código para explorar o kardex.'}
          </p>
        </Card>
      ) : (
        <div className="flex-1 overflow-auto border rounded-lg bg-card">
          <Table>
            <TableHeader className="sticky top-0 bg-card z-10">
              <TableRow>
                <TableHead className="w-32">Data</TableHead>
                <TableHead>Operação</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Origem → Destino</TableHead>
                <TableHead className="text-right">Qtd</TableHead>
                <TableHead>Documento</TableHead>
                <TableHead>Situação</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r: any) => (
                <TableRow
                  key={`${r.origem}-${r.ref_id}`}
                  className="cursor-pointer hover:bg-muted/40"
                  onClick={() => setFichaCodigo(r.codigo_produto)}
                >
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {r.data_movimento ? formatDateBR(r.data_movimento) : '—'}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={r.origem === 'transferencia' ? 'default' : 'outline'}
                      className="text-[10px]"
                    >
                      {r.operacao ?? r.origem}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{r.codigo_produto ?? '—'}</TableCell>
                  <TableCell className="font-mono text-[10px]">
                    {r.deposito_origem ?? '—'}
                    {r.deposito_destino ? ` → ${r.deposito_destino}` : ''}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs">
                    {Number(r.quantidade ?? 0).toLocaleString('pt-BR')}
                  </TableCell>
                  <TableCell className="font-mono text-[10px]">{r.documento ?? '—'}</TableCell>
                  <TableCell className="text-[10px] text-muted-foreground">{r.ds_situacao ?? '—'}</TableCell>
                  <TableCell>
                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <FichaItemDialog codigo={fichaCodigo} open={!!fichaCodigo} onOpenChange={(o) => !o && setFichaCodigo(null)} />
    </div>
  );
}
