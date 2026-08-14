import { useMemo, useState } from 'react';
import { FileText, Loader2, Printer, Truck, Check, Package, Clock, History } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { PageShell, PageHeader, StatCard } from '@/components/expedicao/ui';
import { StatusBadge } from '@/components/ui/status-badge';
import { ExportRomaneioButton } from '@/components/expedicao/ExportRomaneioButton';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export default function RomaneioPage() {
  const [filterStatus, setFilterStatus] = useState<string>('ABERTO');

  const { data: romaneios = [], isLoading } = useQuery({
    queryKey: ['expedicao_romaneios_list', filterStatus],
    queryFn: async () => {
      let query = supabase
        .from('expedicao_romaneios')
        .select(`
          *,
          transportadora:expedicao_transportadoras(nome, codigo),
          itens:expedicao_romaneio_itens(count)
        `)
        .order('created_at', { ascending: false });

      if (filterStatus !== 'TODOS') {
        query = query.eq('status', filterStatus);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 10000
  });

  const stats = useMemo(() => {
    return {
      abertos: romaneios.filter(r => r.status === 'ABERTO').length,
      emCarregamento: romaneios.filter(r => r.status === 'EM_CARREGAMENTO').length,
      aguardandoColeta: romaneios.filter(r => r.status === 'AGUARDANDO_COLETA').length
    };
  }, [romaneios]);

  return (
    <PageShell>
      <PageHeader
        title="Gestão de Romaneios"
        subtitle="Controle industrial de agrupamentos por transportadora e ciclo."
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
          description="Recebendo novas peças"
        />
        <StatCard 
          label="Em Carregamento" 
          value={stats.emCarregamento} 
          icon={Package} 
          description="Peças sendo alocadas"
        />
        <StatCard 
          label="Aguardando Coleta" 
          value={stats.aguardandoColeta} 
          icon={Truck} 
          description="Prontos para expedição"
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {['ABERTO', 'EM_CARREGAMENTO', 'AGUARDANDO_COLETA', 'FECHADO', 'TODOS'].map((s) => (
            <Button
              key={s}
              variant={filterStatus === s ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus(s)}
              className="whitespace-nowrap rounded-full px-4"
            >
              {s.replace('_', ' ')}
            </Button>
          ))}
        </div>

        <Card className="border-none shadow-none bg-transparent">
          <CardContent className="p-0 space-y-4">
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
                {romaneios.map((rom) => (
                  <Card key={rom.id} className="overflow-hidden border-muted-foreground/10 hover:border-primary/50 transition-colors">
                    <CardHeader className="bg-muted/30 pb-3">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="font-mono bg-background">
                          {rom.numero}
                        </Badge>
                        <StatusBadge 
                          tone={rom.status === 'ABERTO' ? 'info' : rom.status === 'FECHADO' ? 'success' : 'warning'} 
                          label={rom.status.replace('_', ' ')} 
                        />
                      </div>
                      <CardTitle className="text-base mt-2 line-clamp-1">
                        {rom.transportadora?.nome || 'Transportadora não definida'}
                      </CardTitle>
                      <div className="text-[10px] font-mono text-muted-foreground">
                        {rom.transportadora?.codigo}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                      <div className="flex justify-between text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Package className="size-4" />
                          <span>Peças alocadas:</span>
                        </div>
                        <span className="font-bold">{rom.itens?.[0]?.count || 0}</span>
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
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}

import { Card, CardTitle, CardHeader, CardContent } from '@/components/ui/card';
