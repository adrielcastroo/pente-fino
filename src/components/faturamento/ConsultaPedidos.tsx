import { useState } from 'react';
import { Search, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface Pedido {
  id?: string;
  cdCliente: string;
  cardName: string;
  numAtCard: string;
  idSituacao: number;
  dsStatusTMS: string;
  dtEfetivacao: string;
  docDueDate: string;
  vlTotalPedido: number;
  slpName: string;
  vlProdutos: number;
  vlImpostos: number;
  docDate: string;
  invoice_number?: string;
  invoice_serie?: string;
  transp?: string;
  obs?: string;
}

// Status colors
const STATUS_COLORS: Record<number, string> = {
  10: 'bg-blue-100 text-blue-800',
  12: 'bg-yellow-100 text-yellow-800',
  20: 'bg-green-100 text-green-800',
  30: 'bg-purple-100 text-purple-800',
  40: 'bg-orange-100 text-orange-800',
  50: 'bg-red-100 text-red-800',
  55: 'bg-cyan-100 text-cyan-800',
  60: 'bg-green-200 text-green-900',
};

const STATUS_NAMES: Record<number, string> = {
  10: 'Aberto',
  12: 'Aguardando Aut.',
  20: 'Autorizado',
  30: 'Em Separação',
  40: 'Aguardando Frete',
  50: 'Facturado',
  55: 'Enviado',
  60: 'Entregue',
};

interface ConsultaPedidosProps {
  onPedidosSelecionados: (pedidos: Pedido[]) => void;
}

export default function ConsultaPedidos({ onPedidosSelecionados }: ConsultaPedidosProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [cliente, setCliente] = useState('');
  const [situacoes, setSituacoes] = useState<number[]>([10, 12, 20, 30, 40, 50, 55, 60]);

  const handleConsultar = async () => {
    if (!dataInicio) {
      toast.error('Informe a data início');
      return;
    }

    setIsLoading(true);
    
    try {
      // TODO: Implementar chamada real à API do Auge
      // Por enquanto, simular com dados de exemplo
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Dados de exemplo baseados no HAR
      const mockPedidos: Pedido[] = [
        {
          cdCliente: 'C0593',
          cardName: 'A & N Decorações e Paisagismo LTDA',
          numAtCard: '176906',
          idSituacao: 40,
          dsStatusTMS: 'Aguardando Frete',
          dtEfetivacao: '2026-09-01',
          docDueDate: '2026-09-03',
          vlTotalPedido: 1580.50,
          slpName: 'João Silva',
          vlProdutos: 1400.00,
          vlImpostos: 180.50,
          docDate: '2026-09-01',
          invoice_number: '176906',
          invoice_serie: '1',
          transp: 'JAMEF',
          obs: 'Entregar antes das 14h'
        },
        {
          cdCliente: 'C1739',
          cardName: 'Monter Automação e Decoração Ltda',
          numAtCard: '176910',
          idSituacao: 50,
          dsStatusTMS: 'Facturado',
          dtEfetivacao: '2026-09-01',
          docDueDate: '2026-09-03',
          vlTotalPedido: 2340.00,
          slpName: 'Maria Santos',
          vlProdutos: 2100.00,
          vlImpostos: 240.00,
          docDate: '2026-09-01',
          invoice_number: '176910',
          invoice_serie: '1',
          transp: 'RODONAVES'
        },
        {
          cdCliente: 'C1420',
          cardName: 'Alameda Decor Artigos De Decoração LTDA',
          numAtCard: '176912',
          idSituacao: 20,
          dsStatusTMS: 'Autorizado',
          dtEfetivacao: '2026-09-02',
          docDueDate: '2026-09-04',
          vlTotalPedido: 890.75,
          slpName: 'Carlos Oliveira',
          vlProdutos: 800.00,
          vlImpostos: 90.75,
          docDate: '2026-09-02'
        },
      ];
      
      setPedidos(mockPedidos);
      onPedidosSelecionados(mockPedidos);
      toast.success(`${mockPedidos.length} pedidos carregados`);
      
    } catch (error) {
      toast.error('Erro ao consultar pedidos');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const formatData = (data: string) => {
    if (!data) return '-';
    const d = new Date(data);
    return d.toLocaleDateString('pt-BR');
  };

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Consultar Pedidos no Auge
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dataInicio">Data Início</Label>
              <Input
                id="dataInicio"
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dataFim">Data Fim</Label>
              <Input
                id="dataFim"
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cliente">Cliente (Código ou Nome)</Label>
              <Input
                id="cliente"
                placeholder="Ex: C0593 ou nome..."
                value={cliente}
                onChange={(e) => setCliente(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button 
                onClick={handleConsultar} 
                disabled={isLoading || !dataInicio}
                className="w-full gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Consultando...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    Consultar
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resultados */}
      {pedidos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Pedidos Encontrados ({pedidos.length})</span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onPedidosSelecionados(pedidos)}
              >
                Selecionar Todos
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Nº Pedido</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data Entrega</TableHead>
                    <TableHead>Transportadora</TableHead>
                    <TableHead className="text-right">Valor Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pedidos.map((pedido, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-mono">{pedido.cdCliente}</TableCell>
                      <TableCell className="font-medium max-w-[200px] truncate">
                        {pedido.cardName}
                      </TableCell>
                      <TableCell>{pedido.numAtCard}</TableCell>
                      <TableCell>
                        <Badge className={STATUS_COLORS[pedido.idSituacao] || 'bg-gray-100'}>
                          {STATUS_NAMES[pedido.idSituacao] || `Status ${pedido.idSituacao}`}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatData(pedido.docDueDate)}</TableCell>
                      <TableCell>{pedido.transp || '-'}</TableCell>
                      <TableCell className="text-right font-mono">
                        {formatMoeda(pedido.vlTotalPedido)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            <div className="mt-4 text-sm text-muted-foreground">
              <p>💡 Dica: Selecione os pedidos que deseja incluir no romaneio e clique em "Selecionar Todos"</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && pedidos.length === 0 && (
        <div className="text-center py-10 text-muted-foreground">
          <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Consulte pedidos pelo Auge para adicionar ao romaneio</p>
        </div>
      )}
    </div>
  );
}
