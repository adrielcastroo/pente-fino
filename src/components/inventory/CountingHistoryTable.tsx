
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDateBR, formatTimeBR } from '@/lib/app-utils';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { HistoricoContagem } from '@/types';
import { Search, History } from 'lucide-react';
import { Input } from '@/components/ui/input';

export function CountingHistoryTable() {
  const [history, setHistory] = useState<HistoricoContagem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchHistory = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('historico_contagens')
      .select('*')
      .order('data_conferencia', { ascending: false });

    if (!error && data) {
      setHistory(data as HistoricoContagem[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const filteredHistory = history.filter(item => 
    item.conferente_nome?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            placeholder="Buscar por conferente..." 
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
              <TableHead className="font-black uppercase tracking-widest text-[10px]">Conferente</TableHead>
              <TableHead className="font-black uppercase tracking-widest text-[10px] text-right">Qtd. Sistema</TableHead>
              <TableHead className="font-black uppercase tracking-widest text-[10px] text-right">Qtd. Contada</TableHead>
              <TableHead className="font-black uppercase tracking-widest text-[10px] text-center">Divergência</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    <span className="font-bold text-muted-foreground uppercase text-xs">Carregando histórico...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredHistory.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center font-bold text-muted-foreground italic uppercase text-xs">
                  Nenhum registro encontrado
                </TableCell>
              </TableRow>
            ) : (
              filteredHistory.map((item) => (
                <TableRow key={item.id} className="hover:bg-primary/[0.02] transition-colors border-border/5">
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-bold text-sm">{formatDateBR(item.data_conferencia)}</span>
                      <span className="text-[10px] font-black text-muted-foreground uppercase">{formatTimeBR(item.data_conferencia)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-bold text-sm uppercase">{item.conferente_nome || '—'}</TableCell>
                  <TableCell className="text-right font-black text-sm tabular-nums">{item.quantidade_sistema}</TableCell>
                  <TableCell className="text-right font-black text-sm tabular-nums">{item.quantidade_contada}</TableCell>
                  <TableCell className="text-center">
                    <Badge 
                      variant="outline"
                      className={cn(
                        "font-black text-xs min-w-[60px] justify-center py-1 rounded-lg border-2",
                        item.diferenca === 0 ? "text-muted-foreground border-muted/20" : 
                        item.diferenca > 0 ? "text-emerald-600 border-emerald-600/20 bg-emerald-500/5" : 
                        "text-destructive border-destructive/20 bg-destructive/5"
                      )}
                    >
                      {item.diferenca > 0 ? `+${item.diferenca}` : item.diferenca}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
