
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDateBR, formatTimeBR } from '@/lib/app-utils';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Search, History, FileSpreadsheet, Calendar, User, Package, Settings2, Hash, CheckCircle2, AlertTriangle, Loader2 } from '@/components/icons';
import { exportCyclicInventoryXLSX } from '@/lib/xlsx-utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { normalizarCodigo } from '@/lib/codigoFornecedor';
import { motion, AnimatePresence } from 'framer-motion';
import { EmptyState } from '@/components/ui/empty-state';


export function CountingHistoryTable() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [codigoMap, setCodigoMap] = useState<Map<string, string>>(new Map());

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

  const fetchCadastro = async () => {
    const { data } = await (supabase.from('itens_cadastro') as any)
      .select('codigo_interno, codigos_fornecedor_normalizado');
    if (!data) return;
    const map = new Map<string, string>();
    for (const it of data as any[]) {
      const interno = it.codigo_interno as string;
      if (!interno) continue;
      map.set(normalizarCodigo(interno), interno);
      const forn: string[] = it.codigos_fornecedor_normalizado || [];
      for (const f of forn) if (f) map.set(normalizarCodigo(f), interno);
    }
    setCodigoMap(map);
  };

  useEffect(() => {
    fetchHistory();
    fetchCadastro();
  }, []);

  const resolveInterno = useCallback((code: string | null | undefined): string => {
    if (!code) return code || '';
    return codigoMap.get(normalizarCodigo(code)) || code;
  }, [codigoMap]);

  const filteredHistory = history.filter(item =>
    item.conferente_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.item_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.codigo_lote?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    resolveInterno(item.codigo_lote)?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExportRow = (item: any) => {
    const details = item.divergence_details as any;
    const scans = details?.bipedLotes?.map((b: any) => ({
      timestamp: formatDateBR(item.completed_at) + ' ' + formatTimeBR(item.completed_at),
      itemCode: resolveInterno(b.lote),
      inspectorName: item.conferente_nome,
      quantity: b.quantity
    })) || [{
      timestamp: formatDateBR(item.completed_at) + ' ' + formatTimeBR(item.completed_at),
      itemCode: resolveInterno(item.codigo_lote),
      inspectorName: item.conferente_nome,
      quantity: item.counted_qty
    }];

    exportCyclicInventoryXLSX({
      itemCode: resolveInterno(item.codigo_lote) || 'N/A',
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
            <h2 className="text-3xl font-semibold">Histórico de Auditoria</h2>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.3em] mt-1 opacity-70">Rastreabilidade completa de contagens</p>
          </div>
        </div>
        
        <div className="relative w-full sm:w-96 group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground group-focus-within:text-primary transition-colors duration-500" />
          <Input 
            placeholder="BUSCAR CONFERENTE OU ITEM..." 
            className="pl-16 h-16 bg-card/40 backdrop-blur-xl border-2 border-white/10 font-semibold uppercase text-[10px] tracking-[0.2em] rounded-[1.5rem] focus:border-primary focus:ring-8 focus:ring-primary/5 transition-all shadow-2xl shadow-black/5"
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
                <TableHead className="text-[10px] font-semibold uppercase tracking-[0.3em] px-10">
                  <div className="flex items-center gap-3"><Calendar className="w-3.5 h-3.5" /> Data / Hora</div>
                </TableHead>
                <TableHead className="text-[10px] font-semibold uppercase tracking-[0.3em] px-10">
                  <div className="flex items-center gap-3"><Package className="w-3.5 h-3.5" /> Item / Lote</div>
                </TableHead>
                <TableHead className="text-[10px] font-semibold uppercase tracking-[0.3em] px-10">
                  <div className="flex items-center gap-3"><User className="w-3.5 h-3.5" /> Conferente</div>
                </TableHead>
                <TableHead className="text-[10px] font-semibold uppercase tracking-[0.3em] px-10 text-right">
                  <div className="flex items-center gap-3 justify-end"><Hash className="w-3.5 h-3.5" /> Teórico</div>
                </TableHead>
                <TableHead className="text-[10px] font-semibold uppercase tracking-[0.3em] px-10 text-right">
                  <div className="flex items-center gap-3 justify-end"><Hash className="w-3.5 h-3.5" /> Real</div>
                </TableHead>
                <TableHead className="text-[10px] font-semibold uppercase tracking-[0.3em] px-10 text-center">Status Auditoria</TableHead>
                <TableHead className="text-[10px] font-semibold uppercase tracking-[0.3em] px-10 text-right">
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
                      <span className="font-semibold text-muted-foreground uppercase text-[10px] tracking-widest">Carregando histórico...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredHistory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-64 text-center">
                    <EmptyState
                      icon={History}
                      title="Nenhum registro encontrado"
                      description="Ajuste os filtros ou aguarde novas contagens cíclicas serem registradas."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                <AnimatePresence>
                  {filteredHistory.map((item, index) => {
                    const diff = (item.counted_qty || 0) - (item.expected_qty || 0);
                    return (
                      <motion.tr 
                        key={item.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.04, duration: 0.5 }}
                        className="hover:bg-primary/5 transition-all duration-300 border-white/5 h-24 group"
                      >
                        <TableCell className="px-10">
                          <div className="flex flex-col">
                            <span className="font-semibold text-sm text-foreground tracking-tighter">{formatDateBR(item.completed_at)}</span>
                            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mt-1 opacity-60">{formatTimeBR(item.completed_at)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="px-10">
                            <div className="flex flex-col">
                                <span className="font-semibold text-sm text-foreground truncate max-w-[250px] group-hover:text-primary transition-colors">{item.item_name}</span>
                                <Badge variant="outline" className="w-fit text-[9px] font-semibold uppercase tracking-[0.2em] py-0.5 px-3 border-white/10 bg-white/5 mt-1.5 rounded-lg shadow-sm">LOTE: {resolveInterno(item.codigo_lote)}</Badge>
                            </div>
                        </TableCell>
                        <TableCell className="px-10">
                           <Badge variant="outline" className="text-[10px] font-semibold uppercase tracking-widest border-white/10 bg-white/5 py-1 px-4">
                              {item.conferente_nome || '—'}
                           </Badge>
                        </TableCell>
                        <TableCell className="px-10 text-right font-semibold text-base tabular-nums text-muted-foreground opacity-50">{item.expected_qty}</TableCell>
                        <TableCell className="px-10 text-right font-semibold text-lg tabular-nums text-foreground">{item.counted_qty}</TableCell>
                        <TableCell className="px-10 text-center">
                          <Badge 
                            variant="outline"
                            className={cn(
                              "font-semibold text-[10px] uppercase tracking-[0.2em] min-w-[140px] justify-center py-2 rounded-md border-2 shadow-sm transition-all duration-500",
                              item.status === 'completed' && diff === 0 ? "text-emerald-600 border-emerald-600/30 bg-emerald-500/10" : 
                              item.status === 'completed' && diff !== 0 ? "text-amber-600 border-amber-600/30 bg-amber-500/10" :
                              "text-rose-600 border-rose-600/30 bg-rose-500/10 animate-pulse"
                            )}
                          >
                            {item.status === 'awaiting_recheck' ? (
                              <span className="flex items-center gap-2"><AlertTriangle className="w-3.5 h-3.5" /> RECONFERIR</span>
                            ) : (
                              diff === 0 ? (
                                <span className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5" /> CONFORME</span>
                              ) : (
                                <span>DIV: {diff > 0 ? '+' : ''}{diff}</span>
                              )
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-10 text-right">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleExportRow(item)}
                            className="rounded-md hover:bg-emerald-500 hover:text-white text-emerald-600 w-12 h-12 transition-all duration-300 active:scale-90 border border-transparent hover:border-emerald-500/20 shadow-sm"
                          >
                            <FileSpreadsheet className="w-6 h-6" />
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
