import { useMemo, useState } from 'react';
import { FileText, Loader2, Printer, Truck, Package, Clock, History } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { PageShell, PageHeader, StatCard } from '@/components/expedicao/ui';
import { StatusBadge } from '@/components/ui/status-badge';
import { ExportRomaneioButton } from '@/components/expedicao/ExportRomaneioButton';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardTitle, CardHeader, CardContent } from '@/components/ui/card';

type RomaneioStatus = "aberto" | "cancelado" | "faturado";

export default function RomaneioPage() {
  const [filterStatus, setFilterStatus] = useState<string>('aberto');

  const { data: romaneios = [], isLoading } = useQuery({
    queryKey: ['expedicao_romaneios_list', filterStatus],
    queryFn: async () => {
      let query = supabase
        .from('expedicao_romaneios')
        .select(`
          *,
          transportadora:expedicao_transportadoras(nome),
          itens:expedicao_romaneio_itens(count)
        `)
        .order('created_at', { ascending: false });

      if (filterStatus !== 'todos') {
        query = query.eq('status', filterStatus as RomaneioStatus);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 10000
  });

  const stats = useMemo(() => {
    return {
      abertos: romaneios.filter(r => r.status === 'aberto').length,
      faturados: romaneios.filter(r => r.status === 'faturado').length,
      cancelados: romaneios.filter(r => r.status === 'cancelado').length
    };
  }, [romaneios]);

  return (
    <PageShell>
      <PageHeader
        title="Gestão de Romaneios"
        subtitle="Controle industrial de agrupamentos por transportadora."
        actions={
          <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-1.5">
            <Printer className="w-4 h-4" /> Relatórios
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard 
          label="Romaneios Abertos" 
          value={stats.abertos} 
          icon={FileText} 
        />
        <StatCard 
          label="Faturados" 
          value={stats.faturados} 
          icon={Package} 
        />
        <StatCard 
          label="Cancelados" 
          value={stats.cancelados} 
          icon={Truck} 
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {['aberto', 'faturado', 'cancelado', 'todos'].map((s) => (
            <Button
              key={s}
              variant={filterStatus === s ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus(s)}
              className="whitespace-nowrap rounded-full px-4 capitalize"
            >
              {s}
            </Button>
          ))}
        </div>

        <div className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="size-8 animate-spin text-primary" />
              </div>
            ) : romaneios.length === 0 ? (
              <EmptyState
                icon={History}
                title="Nenhum romaneio encontrado"
                description="Os romaneios são gerados automaticamente durante a conferência."
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {romaneios.map((rom) => {
                  const transportadora = (rom as any).transportadora;
                  const itensCount = (rom as any).itens?.[0]?.count || 0;
                  
                  return (
                    <Card key={rom.id} className="overflow-hidden border-muted-foreground/10 hover:border-primary/50 transition-colors">
                      <CardHeader className="bg-muted/30 pb-3">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="font-mono bg-background">
                            {rom.numero}
                          </Badge>
                          <StatusBadge 
                            tone={rom.status === 'aberto' ? 'info' : rom.status === 'faturado' ? 'success' : 'warning'} 
                            label={rom.status} 
                          />
                        </div>
                        <CardTitle className="text-base mt-2 line-clamp-1">
                          {transportadora?.nome || 'Transportadora não definida'}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4 space-y-4">
                        <div className="flex justify-between text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Package className="size-4" />
                            <span>Peças alocadas:</span>
                          </div>
                          <span className="font-bold">{itensCount}</span>
                        </div>
                        
                        <div className="flex justify-between text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="size-4" />
                            <span>Criado em:</span>
                          </div>
                          <span className="tabular-nums">
                            {new Date(rom.created_at).toLocaleDateString('pt-BR')}
                          </span>
                        </div>

                        <Separator />

                        <div className="flex items-center justify-between gap-2 pt-2">
                           <ExportRomaneioButton 
                             romaneioId={rom.id} 
                             numero={rom.numero} 
                           />
                           <Button variant="ghost" size="sm" className="text-primary text-xs h-8">
                              Ver Detalhes
                           </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
        </div>
      </div>
    </PageShell>
  );
}
