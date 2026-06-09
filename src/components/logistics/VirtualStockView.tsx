
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Loader2, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { formatDateBR } from '@/lib/app-utils';

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

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tight">Estoque Virtual</h2>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Gerenciamento de Itens Provisórios</p>
        </div>
        <Button onClick={fetchData} variant="outline" size="sm" className="rounded-xl font-bold uppercase text-[10px] gap-2">
          <RefreshCw className={loading ? 'w-3 h-3 animate-spin' : 'w-3 h-3'} />
          Atualizar
        </Button>
      </div>

      <Card className="rounded-[2rem] border-border/20 bg-card/10 backdrop-blur-xl shadow-xl overflow-hidden">
        <CardHeader className="bg-amber-500/5 border-b border-border/5 p-6">
          <CardTitle className="flex items-center gap-3 text-lg font-black uppercase tracking-tight">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <AlertCircle className="w-5 h-5" />
            </div>
            Itens Aguardando Regularização
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : data.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
              <div className="p-4 rounded-full bg-muted/20">
                <CheckCircle2 className="w-10 h-10 text-muted-foreground" />
              </div>
              <div>
                <h4 className="text-sm font-bold uppercase">Tudo em ordem</h4>
                <p className="text-xs text-muted-foreground">Não há itens virtuais pendentes de cadastro.</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border/5 bg-muted/30">
                    <TableHead className="text-[10px] font-black uppercase tracking-widest px-6">Data</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest px-6">Conferente</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest px-6">Lote Bipado</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest px-6">Endereço</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest px-6">Qtd/Metragem</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest px-6 text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((item) => (
                    <TableRow key={item.id} className="hover:bg-muted/20 transition-colors border-border/5">
                      <TableCell className="px-6 py-4 text-xs font-bold text-muted-foreground">
                        {formatDateBR(item.data_movimentacao)}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-xs font-black uppercase">
                        {item.conferente_nome}
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-black uppercase">{item.codigo_lote}</span>
                          <span className="text-[10px] text-amber-500 font-bold uppercase">{item.descricao_item}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-black text-[9px] uppercase tracking-widest px-2 py-0.5">
                          {item.endereco_novo}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-xs font-black">
                        {item.quantidade || '-'}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-right">
                        <Button 
                          onClick={() => handleRegularize(item.id)}
                          size="sm" 
                          variant="ghost" 
                          className="h-8 rounded-lg font-black uppercase text-[9px] text-primary hover:bg-primary/10"
                        >
                          Regularizar
                        </Button>
                      </TableCell>
                    </TableRow>
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
