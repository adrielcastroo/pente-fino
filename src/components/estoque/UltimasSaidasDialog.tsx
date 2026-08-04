import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { LogOut, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export interface SaidaRow {
  id: string;
  item: string | null;
  lote: string | null;
  lote_sistema: string | null;
  endereco: string | null;
  m_linear: number | null;
  conferente_saida: string | null;
  data_saida: string | null;
}

interface UltimasSaidasDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Resolve a descrição amigável do item a partir do código bruto. */
  describeItem?: (raw: string | null | undefined) => string;
}

/**
 * Lista as 15 últimas saídas/baixas de tecidos com os respectivos lotes.
 * Busca sob demanda (somente quando aberto) para não pesar o carregamento do mapa.
 */
export function UltimasSaidasDialog({ open, onOpenChange, describeItem }: UltimasSaidasDialogProps) {
  const [rows, setRows] = useState<SaidaRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('estoque_saidas')
        .select('id,item,lote,lote_sistema,endereco,m_linear,conferente_saida,data_saida')
        .order('data_saida', { ascending: false, nullsFirst: false })
        .limit(15);
      if (cancelled) return;
      if (!error && data) setRows(data as SaidaRow[]);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-3xl p-0 gap-0 border border-border bg-card overflow-hidden rounded-lg shadow-xl max-h-[90vh] flex flex-col translate-y-[-50%] top-[50%]">
        <div className="px-5 sm:px-6 py-4 border-b border-border bg-card">
          <div className="flex items-center gap-3 pr-10">
            <div className="p-2 rounded-md border border-violet-500/20 bg-violet-500/10 text-violet-400">
              <LogOut className="w-5 h-5" strokeWidth={1.5} />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-base sm:text-lg font-semibold tracking-tight leading-tight">
                Últimas saídas
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                As 15 baixas mais recentes de tecidos, com lote e endereço de origem
              </DialogDescription>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-background/40">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground gap-2 text-xs">
              <Loader2 className="w-4 h-4 animate-spin" /> Carregando saídas…
            </div>
          ) : rows.length === 0 ? (
            <div className="py-16 text-center text-xs text-muted-foreground">Nenhuma saída registrada.</div>
          ) : (
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-card border-b border-border">
                <tr className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  <th className="text-left font-semibold px-4 py-2">Item</th>
                  <th className="text-left font-semibold px-4 py-2">Lote</th>
                  <th className="text-left font-semibold px-4 py-2 hidden sm:table-cell">Endereço</th>
                  <th className="text-right font-semibold px-4 py-2">Metros</th>
                  <th className="text-right font-semibold px-4 py-2 hidden md:table-cell">Conferente</th>
                  <th className="text-right font-semibold px-4 py-2">Data</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="px-4 py-2 max-w-[220px]">
                      <div className="font-medium text-foreground truncate">
                        {describeItem?.(r.item) || r.item || '—'}
                      </div>
                      {r.item && describeItem?.(r.item) !== r.item && (
                        <div className="font-mono text-[10px] text-muted-foreground truncate">{r.item}</div>
                      )}
                    </td>
                    <td className="px-4 py-2 font-mono text-[11px] text-muted-foreground">
                      {r.lote || r.lote_sistema || '—'}
                    </td>
                    <td className="px-4 py-2 font-mono text-[11px] text-muted-foreground hidden sm:table-cell">
                      {r.endereco || '—'}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums">
                      {r.m_linear != null ? `${Number(r.m_linear).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} m` : '—'}
                    </td>
                    <td className="px-4 py-2 text-right text-muted-foreground hidden md:table-cell">
                      {r.conferente_saida || '—'}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums text-muted-foreground">
                      {r.data_saida ? new Date(r.data_saida).toLocaleDateString('pt-BR') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="px-5 py-3 border-t border-border bg-card flex justify-end">
          <Badge variant="outline" className="text-[10px]">{rows.length} registros</Badge>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default UltimasSaidasDialog;
