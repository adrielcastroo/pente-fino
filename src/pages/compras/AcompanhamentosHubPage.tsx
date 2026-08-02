
import { useState } from 'react';
import { 
  ClipboardList, 
  Palette, 
  Truck, 
  ChevronRight,
  LayoutDashboard,
  Search,
  Plus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell, PageHeader } from '@/components/compras/ui';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useComprasKanbanPedidos } from '@/hooks/compras/useComprasKanban';
import NovaTarefaDialog from '@/components/compras/NovaTarefaDialog';

const MODULOS = [
  {
    id: 'rma',
    title: 'RMA',
    description: 'Gerenciamento de trocas e devoluções de mercadorias.',
    icon: ClipboardList,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    path: '/compras/acompanhamentos/rma'
  },
  {
    id: 'starcolor',
    title: 'Starcolor',
    description: 'Acompanhamento de pedidos e processos Starcolor.',
    icon: Palette,
    color: 'text-pink-500',
    bgColor: 'bg-pink-500/10',
    path: '/compras/acompanhamentos/starcolor'
  },
  {
    id: 'entrega_apos',
    title: 'Entrega Após',
    description: 'Monitoramento de entregas programadas e pendências.',
    icon: Truck,
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-500/10',
    path: '/compras/acompanhamentos/entrega-apos'
  },
  {
    id: 'geral',
    title: 'Geral',
    description: 'Acompanhamento geral de compras e tarefas diversas.',
    icon: LayoutDashboard,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    path: '/compras/acompanhamentos/geral'
  }
];

export default function AcompanhamentosHubPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [novaAberta, setNovaAberta] = useState(false);
  
  const { data: pedidos = [] } = useComprasKanbanPedidos();

  const counts = {
    rma: pedidos.filter(p => p.modulo === 'rma').length,
    starcolor: pedidos.filter(p => p.modulo === 'starcolor').length,
    entrega_apos: pedidos.filter(p => p.modulo === 'entrega_apos').length,
    geral: pedidos.filter(p => p.modulo === 'geral').length,
  };

  const filteredModulos = MODULOS.filter(m => 
    m.title.toLowerCase().includes(search.toLowerCase()) ||
    m.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PageShell>
      <PageHeader 
        title="Hub de Acompanhamentos" 
        subtitle="Central de módulos e fluxos de acompanhamento de compras"
      />

      <div className="flex flex-col sm:flex-row items-center gap-4 mb-8">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar módulo..." 
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button onClick={() => setNovaAberta(true)} className="w-full sm:w-auto ml-auto">
          <Plus className="w-4 h-4 mr-2" /> Nova tarefa
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {filteredModulos.map((modulo) => {
          const count = counts[modulo.id as keyof typeof counts] || 0;
          
          return (
            <Card 
              key={modulo.id} 
              className="group cursor-pointer hover:border-primary/50 transition-all hover:shadow-md border-border/50"
              onClick={() => navigate(modulo.path)}
            >
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div className="flex items-center justify-center">
                  <modulo.icon className={cn("w-6 h-6", modulo.color)} strokeWidth={1.75} />
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-2xl font-bold tabular-nums">{count}</span>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                    Tarefas
                  </span>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <CardTitle className="text-lg flex items-center justify-between">
                  {modulo.title}
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                </CardTitle>
                <CardDescription className="mt-2 line-clamp-2 min-h-[40px]">
                  {modulo.description}
                </CardDescription>
                
                <div className="mt-6 flex items-center gap-2">
                  <div className="h-1.5 flex-1 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={cn("h-full transition-all", modulo.color.replace('text-', 'bg-'))}
                      style={{ width: count > 0 ? '100%' : '0%' }}
                    />
                  </div>
                  <Button variant="ghost" size="sm" className="h-7 text-xs px-2">
                    Acessar
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <NovaTarefaDialog 
        open={novaAberta} 
        onOpenChange={setNovaAberta} 
      />
    </PageShell>
  );
}
