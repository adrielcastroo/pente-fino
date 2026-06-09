
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-600 shadow-inner">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tight">Estoque Virtual</h2>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mt-1">Gerenciamento de Itens Provisórios</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {data.length > 0 && (
            <Button 
              onClick={handleClearAll} 
              variant="destructive" 
              size="sm" 
              className="rounded-xl font-black uppercase text-[9px] tracking-widest gap-2 h-10 px-4 shadow-lg shadow-destructive/20 hover:scale-105 transition-all"
            >
              <Trash2 className="w-3 h-3" />
              Limpar Tudo
            </Button>
          )}
          <Button 
            onClick={fetchData} 
            variant="outline" 
            size="sm" 
            className="rounded-xl font-black uppercase text-[9px] tracking-widest gap-2 h-10 px-4 border-border/20 hover:bg-muted transition-all"
          >
            <RefreshCw className={loading ? 'w-3 h-3 animate-spin' : 'w-3 h-3'} />
            Atualizar Dados
          </Button>
        </div>
      </div>


      <Card className="rounded-[2.5rem] border-border/10 bg-card/40 backdrop-blur-xl shadow-2xl overflow-hidden border border-white/5">
        <CardHeader className="bg-gradient-to-r from-amber-500/5 to-transparent p-8 border-b border-white/5">
          <CardTitle className="flex items-center gap-3 text-lg font-black uppercase tracking-widest text-amber-600">
            Itens Aguardando Regularização
          </CardTitle>
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
                  <TableRow className="hover:bg-transparent border-border/5 bg-muted/20 h-16">
                    <TableHead className="text-[10px] font-black uppercase tracking-widest px-8">
                      <div className="flex items-center gap-2"><Calendar className="w-3 h-3" /> Data</div>
                    </TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest px-8">
                      <div className="flex items-center gap-2"><User className="w-3 h-3" /> Conferente</div>
                    </TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest px-8">
                      <div className="flex items-center gap-2"><Package className="w-3 h-3" /> Lote Bipado</div>
                    </TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest px-8">
                      <div className="flex items-center gap-2"><MapPin className="w-3 h-3" /> Endereço</div>
                    </TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest px-8">
                      <div className="flex items-center gap-2"><Hash className="w-3 h-3" /> Qtd</div>
                    </TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest px-8 text-right">
                      <div className="flex items-center gap-2 justify-end"><Settings2 className="w-3 h-3" /> Gestão</div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence mode="popLayout">
                    {data.map((item, index) => (
                      <motion.tr 
                        key={item.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-primary/5 transition-colors border-border/5 h-20 group"
                      >
                      <TableCell className="px-8 text-xs font-bold text-muted-foreground">
                        {formatDateBR(item.data_movimentacao)}
                      </TableCell>
                      <TableCell className="px-8 text-xs font-black uppercase">
                        {item.conferente_nome}
                      </TableCell>
                      <TableCell className="px-8">
                        <div className="flex flex-col">
                          <span className="text-xs font-black uppercase text-foreground">{item.codigo_lote}</span>
                          <span className="text-[9px] text-amber-600 font-black uppercase tracking-widest mt-0.5">{item.descricao_item}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-8">
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-black text-[10px] uppercase tracking-widest px-3 py-1 rounded-lg">
                          {item.endereco_novo}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-8 text-sm font-black text-foreground">
                        {item.quantidade || '-'}
                      </TableCell>
                      <TableCell className="px-8 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            onClick={() => handleRegularize(item.id)}
                            size="sm" 
                            variant="ghost" 
                            className="h-10 rounded-xl font-black uppercase text-[10px] tracking-widest text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300 shadow-sm"
                          >
                            Regularizar
                          </Button>
                          <Button 
                            onClick={() => handleDeleteItem(item.id)}
                            size="icon" 
                            variant="ghost" 
                            className="h-10 w-10 rounded-xl text-destructive hover:bg-destructive hover:text-destructive-foreground transition-all duration-300 shadow-sm"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

