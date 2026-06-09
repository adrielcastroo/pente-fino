
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDateBR, formatTimeBR } from '@/lib/app-utils';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Search, History, FileSpreadsheet, Calendar, User, Package, Settings2, Hash, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { exportCyclicInventoryXLSX } from '@/lib/xlsx-utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';


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
    <div className="space-y-8 pb-10">
      <div className="flex flex-col sm:flex-row gap-8 items-center justify-between">
        <div className="flex items-center gap-5">
          <div className="p-4 rounded-[1.5rem] bg-primary text-white shadow-2xl shadow-primary/30 ring-4 ring-primary/10">
            <History className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-3xl font-black uppercase tracking-tight">Histórico de Auditoria</h2>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mt-1 opacity-70">Rastreabilidade completa de contagens</p>
          </div>
        </div>
        
        <div className="relative w-full sm:w-96 group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground group-focus-within:text-primary transition-colors duration-500" />
          <Input 
            placeholder="BUSCAR CONFERENTE OU ITEM..." 
            className="pl-16 h-16 bg-card/40 backdrop-blur-xl border-2 border-white/10 font-black uppercase text-[10px] tracking-[0.2em] rounded-[1.5rem] focus:border-primary focus:ring-8 focus:ring-primary/5 transition-all shadow-2xl shadow-black/5"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-[3rem] border border-white/10 overflow-hidden bg-card/40 backdrop-blur-3xl shadow-2xl ring-1 ring-white/5 group transition-all duration-500">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-white/5 bg-muted/20 h-20">
                <TableHead className="text-[10px] font-black uppercase tracking-[0.3em] px-10">
                  <div className="flex items-center gap-3"><Calendar className="w-3.5 h-3.5" /> Data / Hora</div>
                </TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-[0.3em] px-10">
                  <div className="flex items-center gap-3"><Package className="w-3.5 h-3.5" /> Item / Lote</div>
                </TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-[0.3em] px-10">
                  <div className="flex items-center gap-3"><User className="w-3.5 h-3.5" /> Conferente</div>
                </TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-[0.3em] px-10 text-right">
                  <div className="flex items-center gap-3 justify-end"><Hash className="w-3.5 h-3.5" /> Teórico</div>
                </TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-[0.3em] px-10 text-right">
                  <div className="flex items-center gap-3 justify-end"><Hash className="w-3.5 h-3.5" /> Real</div>
                </TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-[0.3em] px-10 text-center">Status Auditoria</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-[0.3em] px-10 text-right">
                  <div className="flex items-center gap-3 justify-end"><Settings2 className="w-3.5 h-3.5" /> Relatório</div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center gap-4">
                      <Loader2 className="w-10 h-10 animate-spin text-primary" />
                      <span className="font-black text-muted-foreground uppercase text-[10px] tracking-widest">Carregando histórico...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredHistory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center gap-4 opacity-30">
                      <History className="w-12 h-12" />
                      <span className="font-black text-muted-foreground uppercase text-[10px] tracking-widest">Nenhum registro encontrado</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                <AnimatePresence>
                  {filteredHistory.map((item, index) => {
                    const diff = (item.counted_qty || 0) - (item.expected_qty || 0);
                    return (
                      <motion.tr 
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="hover:bg-primary/5 transition-colors border-border/5 h-20 group"
                      >
                        <TableCell className="px-8">
                          <div className="flex flex-col">
                            <span className="font-black text-xs text-foreground tracking-tight">{formatDateBR(item.completed_at)}</span>
                            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mt-0.5">{formatTimeBR(item.completed_at)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="px-8">
                            <div className="flex flex-col">
                                <span className="font-black text-xs text-foreground uppercase tracking-tight truncate max-w-[200px]">{item.item_name}</span>
                                <Badge variant="outline" className="w-fit text-[8px] font-black uppercase tracking-[0.2em] py-0 px-2 border-white/10 bg-white/5 mt-1">LOTE: {item.codigo_lote}</Badge>
                            </div>
                        </TableCell>
                        <TableCell className="px-8 font-black text-xs uppercase text-foreground">{item.conferente_nome || '—'}</TableCell>
                        <TableCell className="px-8 text-right font-black text-sm tabular-nums text-muted-foreground">{item.expected_qty}</TableCell>
                        <TableCell className="px-8 text-right font-black text-sm tabular-nums text-foreground">{item.counted_qty}</TableCell>
                        <TableCell className="px-8 text-center">
                          <Badge 
                            variant="outline"
                            className={cn(
                              "font-black text-[9px] uppercase tracking-widest min-w-[120px] justify-center py-1.5 rounded-xl border-2 shadow-sm",
                              item.status === 'completed' && diff === 0 ? "text-emerald-600 border-emerald-600/20 bg-emerald-500/5" : 
                              item.status === 'completed' && diff !== 0 ? "text-amber-600 border-amber-600/20 bg-amber-500/5" :
                              "text-rose-600 border-rose-600/20 bg-rose-500/5 animate-pulse"
                            )}
                          >
                            {item.status === 'awaiting_recheck' ? (
                              <span className="flex items-center gap-1.5"><AlertTriangle className="w-3 h-3" /> Reconferência</span>
                            ) : (
                              diff === 0 ? (
                                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3" /> Conforme</span>
                              ) : (
                                <span>Divergência: {diff > 0 ? '+' : ''}{diff}</span>
                              )
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-8 text-right">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleExportRow(item)}
                            className="rounded-xl hover:bg-primary/10 text-primary w-10 h-10 transition-all active:scale-90"
                          >
                            <FileSpreadsheet className="w-5 h-5" />
                          </Button>
                        </TableCell>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
