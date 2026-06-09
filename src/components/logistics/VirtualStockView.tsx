
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Loader2, AlertCircle, CheckCircle2, RefreshCw, Calendar, User, Package, MapPin, Hash, Settings2, Trash2 } from 'lucide-react';
import { formatDateBR } from '@/lib/app-utils';
import { motion, AnimatePresence } from 'framer-motion';


export function VirtualStockView() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: moves, error } = await supabase
        .from('movimentacoes_endereco')
        .select('*')
        .eq('tipo_estoque', 'VIRTUAL')
        .order('data_movimentacao', { ascending: false });

      if (error) throw error;
      setData(moves || []);
    } catch (err) {
      console.error('Fetch error:', err);
      toast.error('Erro ao carregar estoque virtual');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRegularize = async (id: string) => {
    toast.info('Funcionalidade de regularização será vinculada ao ERP em breve.');
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Deseja realmente remover este item do estoque virtual?')) return;
    
    try {
      const { error } = await supabase
        .from('movimentacoes_endereco')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Item removido com sucesso');
      setData(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      console.error('Delete error:', err);
      toast.error('Erro ao remover item');
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Deseja realmente limpar TODOS os itens do estoque virtual? Esta ação não pode ser desfeita.')) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('movimentacoes_endereco')
        .delete()
        .eq('tipo_estoque', 'VIRTUAL');

      if (error) throw error;
      
      toast.success('Estoque virtual limpo com sucesso');
      setData([]);
    } catch (err) {
      console.error('Clear error:', err);
      toast.error('Erro ao limpar estoque virtual');
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="p-4 rounded-[1.5rem] bg-amber-500 text-white shadow-2xl shadow-amber-500/30 ring-4 ring-amber-500/10">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-3xl font-black uppercase tracking-tight">Estoque Virtual</h2>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mt-1 opacity-70">Gerenciamento de Itens em Contingência</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {data.length > 0 && (
            <Button 
              onClick={handleClearAll} 
              variant="destructive" 
              size="sm" 
              className="rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] gap-2.5 h-14 px-8 shadow-2xl shadow-destructive/20 hover:scale-105 active:scale-95 transition-all duration-300 ring-4 ring-destructive/5"
            >
              <Trash2 className="w-4 h-4" />
              Limpar Todos
            </Button>
          )}
          <Button 
            onClick={fetchData} 
            variant="outline" 
            size="sm" 
            className="rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] gap-2.5 h-14 px-8 border-white/10 bg-card/40 backdrop-blur-xl hover:bg-primary hover:text-white transition-all duration-300 shadow-xl"
          >
            <RefreshCw className={loading ? 'w-4 h-4 animate-spin' : 'w-4 h-4'} />
            Sincronizar
          </Button>
        </div>
      </div>


      <Card className="rounded-[3rem] border-white/10 bg-card/40 backdrop-blur-3xl shadow-2xl overflow-hidden ring-1 ring-white/10 group transition-all duration-500">
        <CardHeader className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-10 border-b border-white/5 flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-4 text-xl font-black uppercase tracking-[0.2em] text-amber-600">
            <div className="w-2 h-8 bg-amber-500 rounded-full" />
            Itens para Regularização
          </CardTitle>
          <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30 font-black px-4 py-1.5 rounded-full text-[10px] uppercase tracking-widest shadow-sm">
            {data.length} Pendências
          </Badge>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-32">
              <Loader2 className="w-12 h-12 animate-spin text-amber-500" />
            </div>
          ) : data.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-32 text-center space-y-6"
            >
              <div className="p-8 rounded-full bg-emerald-500/10 text-emerald-500 shadow-inner ring-4 ring-emerald-500/5">
                <CheckCircle2 className="w-16 h-16" />
              </div>
              <div className="space-y-2">
                <h4 className="text-xl font-black uppercase tracking-tight text-foreground">Tudo em ordem</h4>
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Não há itens virtuais pendentes.</p>
              </div>
            </motion.div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-white/5 bg-muted/20 h-20">
                    <TableHead className="text-[10px] font-black uppercase tracking-[0.3em] px-10">
                      <div className="flex items-center gap-3"><Calendar className="w-3.5 h-3.5" /> Data</div>
                    </TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-[0.3em] px-10">
                      <div className="flex items-center gap-3"><User className="w-3.5 h-3.5" /> Responsável</div>
                    </TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-[0.3em] px-10">
                      <div className="flex items-center gap-3"><Package className="w-3.5 h-3.5" /> Item / Lote</div>
                    </TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-[0.3em] px-10">
                      <div className="flex items-center gap-3"><MapPin className="w-3.5 h-3.5" /> Destino</div>
                    </TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-[0.3em] px-10 text-right">
                      <div className="flex items-center gap-3 justify-end"><Hash className="w-3.5 h-3.5" /> Qtd</div>
                    </TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-[0.3em] px-10 text-right">
                      <div className="flex items-center gap-3 justify-end"><Settings2 className="w-3.5 h-3.5" /> Ações</div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence mode="popLayout">
                    {data.map((item, index) => (
                      <motion.tr 
                        key={item.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.9, x: 20 }}
                        transition={{ delay: index * 0.04, duration: 0.5 }}
                        className="hover:bg-primary/5 transition-all duration-300 border-white/5 h-24 group"
                      >
                        <TableCell className="px-10 text-xs font-black tracking-tight text-muted-foreground">
                          {formatDateBR(item.data_movimentacao)}
                        </TableCell>
                        <TableCell className="px-10">
                          <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest border-white/10 bg-white/5 py-1 px-3">
                            {item.conferente_nome}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-10">
                          <div className="flex flex-col">
                            <span className="text-sm font-black uppercase text-foreground tracking-tight group-hover:text-primary transition-colors">{item.codigo_lote}</span>
                            <span className="text-[10px] text-amber-600 font-bold uppercase tracking-[0.1em] mt-1 opacity-70">{item.descricao_item}</span>
                          </div>
                        </TableCell>
                        <TableCell className="px-10">
                          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 font-black text-[10px] uppercase tracking-[0.2em] px-4 py-1.5 rounded-xl shadow-sm ring-4 ring-emerald-500/5">
                            {item.endereco_novo}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-10 text-lg font-black text-foreground tabular-nums text-right">
                          {item.quantidade || '-'}
                        </TableCell>
                        <TableCell className="px-10 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <Button 
                              onClick={() => handleRegularize(item.id)}
                              size="sm" 
                              variant="ghost" 
                              className="h-12 px-6 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] text-primary hover:bg-primary hover:text-white transition-all duration-500 shadow-sm border border-transparent hover:border-primary/20"
                            >
                              Regularizar
                            </Button>
                            <Button 
                              onClick={() => handleDeleteItem(item.id)}
                              size="icon" 
                              variant="ghost" 
                              className="h-12 w-12 rounded-2xl text-rose-500 hover:bg-rose-500 hover:text-white transition-all duration-500 shadow-sm border border-transparent hover:border-rose-500/20"
                            >
                              <Trash2 className="w-5 h-5" />
                            </Button>
                          </div>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

