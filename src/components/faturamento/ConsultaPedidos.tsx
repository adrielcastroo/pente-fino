import { useState, useEffect } from 'react';
import { Search, RefreshCw, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Pedido {
  id?: string;
  cdCliente: string;
  cardName: string;
  nrPedido: string;
  dtPedido: string;
  situacao: number;
  dtEntrega: string;
  vlTotal: number;
  vlProdutos: number;
  vlImpostos: number;
  transportadora: string;
  nmClienteFinal: string;
  observacoes: string;
}

interface FiltrosPedidos {
  dataInicio: string;
  dataFim: string;
  cdCliente: string;
  situacoes: number[];
}

interface ConsultaPedidosProps {
  onPedidosSelecionados: (pedidos: Pedido[]) => void;
}

interface PedidoFormData {
  cdCliente?: string;
  dtPedidoDe?: string;
  dtPedidoAte?: string;
  situacoes?: number[];
}

export default function ConsultaPedidos({ onPedidosSelecionados }: ConsultaPedidosProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [cliente, setCliente] = useState('');
  const [situacoes, setSituacoes] = useState<number[]>([10, 12, 20, 30, 40, 50, 55, 60]);
  const [suporteCarregando, setSuporteCarregando] = useState(false);

  const handleConsultar = async () => {
    if (!dataInicio) {
      toast.error('Informe a data início');
      return;
    }

    setIsLoading(true);
    setSuporteCarregando(true);

    try {
      // TODO: Implementar chamada real ao Auge
      // Por enquanto, simular com dados de exemplo
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Dados de exemplo baseados no que extraímos do HAR
      const mockPedidos: Pedido[] = [
        {
          cdCliente: 'C0593',
          cardName: 'A & N Decorações e Paisagismo LTDA',
          nrPedido: '176906',
          dtPedido: '01/08/2026',
          situacao: 40,
          dtEntrega: '2026-09-03',
          vlTotal: 1580.50,
          vlProdutos: 1400.00,
          vlImpostos: 180.50,
          transportadora: 'JAMEF',
          nmClienteFinal: 'A & N Decorações e Paisagismo LTDA',
          observacoes: 'Entregar antes das 14h'
        },
        {
          cdCliente: 'C1739',
          cardName: 'Monter Automação e Decoração Ltda',
          nrPedido: '176910',
          dtPedido: '01/08/2026',
          situacao: 50,
          dtEntrega: '2026-09-03',
          vlTotal: 2340.00,
          vlProdutos: 2100.00,
          vlImpostos: 240.00,
          transportadora: 'RODONAVES',
          nmClienteFinal: 'Monter Automação e Decoração Ltda'
        },
        {
          cdCliente: 'C1420',
          cardName: 'Alameda Decor Artigos De Decoração LTDA',
          nrPedido: '176912',
          dtPedido: '01/08/2026',
          situacao: 20,
          dtEntrega: '2026-09-04',
          vlTotal: 890.75,
          vlProdutos: 800.00,
          vlImpostos: 90.75,
          transportadora: ''
        }
      ];
      
      setPedidos(mockPedidos);
      toast.success(`${mockPedidos.length} pedidos carregados`);
    } catch (error) {
      toast.error('Erro ao consultar pedidos');
      console.error(error);
    } finally {
      setIsLoading(false);
      setSuporteCarregando(false);
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
            <Search className="w-5 h-4" />
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
              <Label htmlFor="cliente">Código Cliente</Label>
              <Input
                id="cliente"
                placeholder="Ex: C0593"
                value={cliente}
                onChange={(e) => setCliente(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Situações</Label>
              <Select
                value={situacoes.length > 0 ? situacoes[0] : ''}
                onValueChange={(val) => {
                  const nums = val ? [Number(val)] : [];
                  setSituacoes(nums.length > 0 ? nums : [10, 12, 20, 30, 40, 50, 55, 60]);
                }}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                  <SelectContent>
                    <SelectItem value="10">Aberto</SelectItem>
                    <SelectItem value="12">Aguardando Autorização</SelectItem>
                    <SelectItem value="20">Autorizado</SelectItem>
                    <SelectItem value="30">Em Separação</SelectItem>
                    <SelectItem value="40">Aguardando Frete</SelectItem>
                    <SelectItem value="50">Facturado</SelectItem>
                    <SelectItem value="55">Enviado</SelectItem>
                    <SelectItem value="60">Entregue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resultados */}
      {isLoading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : pedidos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Pedidos Encontrados ({pedidos.length})</span>
              <Button variant="outline" size="sm" onClick={() => onPedidosSelecionados(pedidos)}>
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
                      <TableCell className="font-mico">{pedido.cdCliente}</TableCell>
                      <TableCell className="font-medium max-w-[200px] truncate">
                        {pedido.cardName}
                      </TableCell>
                      <TableCell>{pedido.numPedido}</TableCell>
                      <TableCell>
                        <Badge className={STATUS_COLORS[pedido.situacao] || 'bg-gray-100'}>
                          {STATUS_NAMES[pedido.situacao] || `Status ${pedido.situacao}`}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatData(pedido.dtEntrega)}</TableCell>
                      <TableCell>{pedido.transportadora || '-'}</TableCell>
                      <TableCell className="text-right font-mico">
                        {formatMoeda(pedido.vlTotal)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            <div className="mt-4 text-sm text-muted-foreground">
              <p>💡 Dica: Selecione os pedidos que deseja incluir no romaneio e clique em "Selecionar Todos"</p>
            </div>
          </Card>
        </Card>
      )}

      {!isLoading && !pedidos.length && (
        <div className="text-center py-10 text-muted-foreground">
          <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Consulte pedidos pelo Auge para adicionar ao romaneio</p>
        </div>
      )}
    </div>
  );
}

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