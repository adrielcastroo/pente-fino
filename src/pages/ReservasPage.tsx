import { useEffect, useState, useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';
import { Package, Search } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ReservasTable } from '@/components/estoque/ReservasTable';
import { ReservaFormDialog } from '@/components/estoque/ReservaFormDialog';
import { filterReservas, ReservaFormData } from '@/components/estoque/reservas-utils';

export default function ReservasPage() {
  const setFormData = useAppStore(s => s.setFormData);
  const { reservas, addReserva, clearReservas, loadReservas } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setFormData({ activeTab: 'reservas' });
    loadReservas();
    
    const interval = setInterval(() => {
      loadReservas();
    }, 10000);
    
    return () => clearInterval(interval);
  }, [setFormData, loadReservas]);

  const filteredReservas = useMemo(() => 
    filterReservas(reservas, searchTerm), 
    [reservas, searchTerm]
  );

  const handleAddReserva = async (formData: ReservaFormData) => {
    const newReserva = {
      id: crypto.randomUUID(),
      codigo: formData.codigo.trim(),
      descricao: formData.descricao.trim(),
      endereco: formData.endereco.trim(),
      quantidade: Number(formData.quantidade),
      caixaNum: formData.caixaNum.trim(),
      quantidadeCx: formData.quantidadeCx ? parseInt(formData.quantidadeCx, 10) : undefined,
      observacao: formData.observacao.trim(),
      createdAt: new Date().toISOString(),
    };

    return addReserva(newReserva);
  };

  const handleClearAll = async () => {
    if (confirm('Tem certeza que deseja limpar todas as reservas?')) {
      try {
        await clearReservas();
        toast.success('Reservas limpas com sucesso.');
      } catch (error) {
        toast.error('Erro ao limpar reservas.');
      }
    }
  };

  return (
    <TooltipProvider>
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
              <Package className="w-8 h-8 text-primary" />
              Reservas Estoque
            </h1>
            <p className="text-muted-foreground mt-1">Gerenciamento de prateleira virtual e reservas.</p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <ReservaFormDialog onAdd={handleAddReserva} />
            
            {reservas.length > 0 && (
              <Button 
                variant="outline" 
                onClick={handleClearAll}
                className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20 font-bold"
              >
                Limpar
              </Button>
            )}
          </div>
        </div>

        <Card className="border-border/40 shadow-xl shadow-black/5 overflow-hidden">
          <CardHeader className="bg-muted/30 pb-4 border-b border-border/40">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                Prateleira Virtual
                <Badge variant="secondary" className="ml-2 font-mono">{filteredReservas.length}</Badge>
              </CardTitle>
              <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Filtrar por código ou endereço..." 
                  className="pl-9 bg-background/50 border-border/60 focus:bg-background"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ReservasTable items={filteredReservas} />
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}
