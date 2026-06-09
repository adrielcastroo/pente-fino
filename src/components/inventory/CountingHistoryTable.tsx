import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDateBR, formatTimeBR } from '@/lib/app-utils';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Search, History, FileSpreadsheet } from 'lucide-react';
import { exportCyclicInventoryXLSX } from '@/lib/xlsx-utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function CountingHistoryTable() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchHistory = async () => {
    setLoading(true);
    const { data, error } = await (supabase.from('inventory_tasks') as any)
      .select('*')
      .not('status', 'eq', 'pendente')
      .order('completed_at', { ascending: false });

    if (!error && data) {
      setHistory(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const filteredHistory = history.filter(item => 
    item.conferente_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.item_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.codigo_lote?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExportRow = (item: any) => {
    const details = item.divergence_details as any;
    const scans = details?.bipedLotes?.map((b: any) => ({
      timestamp: formatDateBR(item.completed_at) + ' ' + formatTimeBR(item.completed_at),
      itemCode: b.lote,
      inspectorName: item.conferente_nome,
      quantity: b.quantity
    })) || [{
      timestamp: formatDateBR(item.completed_at) + ' ' + formatTimeBR(item.completed_at),
      itemCode: item.codigo_lote,
      inspectorName: item.conferente_nome,
      quantity: item.counted_qty
    }];

    exportCyclicInventoryXLSX({
      itemCode: item.codigo_lote || 'N/A',
      referenceDate: formatDateBR(item.completed_at),
      scans: scans
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <History className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-black uppercase tracking-tight">Histórico de Auditoria</h2>
        </div>
        
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por conferente ou item..." 
            className="pl-10 h-11 bg-muted/50 border-border/50 font-bold"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-border/20 overflow-hidden bg-card/10 backdrop-blur-md shadow-inner">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow className="hover:bg-transparent border-border/10">
              <TableHead className="font-black uppercase tracking-widest text-[10px]">Data / Hora</TableHead>
              <TableHead className="font-black uppercase tracking-widest text-[10px]">Item / Lote</TableHead>
              <TableHead className="font-black uppercase tracking-widest text-[10px]">Conferente</TableHead>
              <TableHead className="font-black uppercase tracking-widest text-[10px] text-right">Qtd. Sistema</TableHead>
              <TableHead className="font-black uppercase tracking-widest text-[10px] text-right">Qtd. Contada</TableHead>
              <TableHead className="font-black uppercase tracking-widest text-[10px] text-center">Status</TableHead>
              <TableHead className="font-black uppercase tracking-widest text-[10px] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    <span className="font-bold text-muted-foreground uppercase text-xs">Carregando histórico...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredHistory.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center font-bold text-muted-foreground italic uppercase text-xs">
                  Nenhum registro encontrado
                </TableCell>
              </TableRow>
            ) : (
              filteredHistory.map((item) => {
                const diff = (item.counted_qty || 0) - (item.expected_qty || 0);
                return (
                  <TableRow key={item.id} className="hover:bg-primary/[0.02] transition-colors border-border/5">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm">{formatDateBR(item.completed_at)}</span>
                        <span className="text-[10px] font-black text-muted-foreground uppercase">{formatTimeBR(item.completed_at)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                        <div className="flex flex-col">
                            <span className="font-bold text-sm truncate max-w-[150px]">{item.item_name}</span>
                            <Badge variant="outline" className="w-fit text-[9px] font-black uppercase tracking-widest py-0 border-border/20">LOTE: {item.codigo_lote}</Badge>
                        </div>
                    </TableCell>
                    <TableCell className="font-bold text-sm uppercase">{item.conferente_nome || '—'}</TableCell>
                    <TableCell className="text-right font-black text-sm tabular-nums">{item.expected_qty}</TableCell>
                    <TableCell className="text-right font-black text-sm tabular-nums">{item.counted_qty}</TableCell>
                    <TableCell className="text-center">
                      <Badge 
                        variant="outline"
                        className={cn(
                          "font-black text-[9px] uppercase tracking-widest min-w-[100px] justify-center py-1 rounded-lg border-2",
                          item.status === 'completed' && diff === 0 ? "text-emerald-600 border-emerald-600/20 bg-emerald-500/5" : 
                          item.status === 'completed' && diff !== 0 ? "text-amber-600 border-amber-600/20 bg-amber-500/5" :
                          "text-rose-600 border-rose-600/20 bg-rose-500/5 animate-pulse"
                        )}
                      >
                        {item.status === 'awaiting_recheck' ? 'Reconferência' : (diff === 0 ? 'Conforme' : `Divergência: ${diff > 0 ? '+' : ''}${diff}`)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleExportRow(item)}
                        title="Exportar XLSX"
                        className="rounded-xl hover:bg-primary/10 text-primary"
                      >
                        <FileSpreadsheet className="w-5 h-5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
