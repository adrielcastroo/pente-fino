import { useState, useMemo, memo } from 'react';
import { Package, Search } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { ReservasTable } from '@/components/estoque/ReservasTable';
import { ReservaFormDialog } from '@/components/estoque/ReservaFormDialog';
import { filterReservas, ReservaFormData } from '@/components/estoque/reservas-utils';
import { useReservas } from '@/hooks/useReservas';

/**
 * ReservasPage - High-performance inventory management view.
 * 
 * Architecture Decisions:
 * 1. TanStack Query (via useReservas): Handles server state synchronization,
 *    caching, and polling, reducing TBT and network overhead.
 * 2. Memoization: useMemo and memoized sub-components prevent unnecessary re-renders.
 * 3. Atomic Design: Logic extracted to custom hooks and utility functions.
 */
const ReservasPage = () => {
  const { reservas, addReserva, clearReservas } = useReservas();
  const [searchTerm, setSearchTerm] = useState('');

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

    await addReserva(newReserva);
  };

  const handleClearAll = async () => {
    if (window.confirm('Tem certeza que deseja limpar todas as reservas?')) {
      await clearReservas();
    }
  };

  return (
    <TooltipProvider>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
              <Package className="w-8 h-8 text-primary" aria-hidden="true" />
              Reservas Estoque
            </h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              Gerenciamento de prateleira virtual e reservas sincronizadas em tempo real.
            </p>
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
        </header>

        <Card className="border-border/40 shadow-xl shadow-black/5 overflow-hidden ring-1 ring-black/5">
          <CardHeader className="bg-muted/30 pb-4 border-b border-border/40">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                Prateleira Virtual
                <Badge variant="secondary" className="ml-2 font-mono font-bold">
                  {filteredReservas.length}
                </Badge>
              </CardTitle>
              <div className="relative w-full md:w-80 group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                <Input 
                  placeholder="Filtrar por código, endereço ou OBS..." 
                  className="pl-9 bg-background/50 border-border/60 focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  aria-label="Filtrar reservas"
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
};

export default memo(ReservasPage);

