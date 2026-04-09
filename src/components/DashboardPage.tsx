import { useAppStore, type Conference } from '@/store/useAppStore';
import { Users, Layers3, Package, BarChart3, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface StatItem {
  label: string;
  count: number;
}

function StatCard({ title, icon: Icon, items, emptyText }: {
  title: string;
  icon: typeof Users;
  items: StatItem[];
  emptyText: string;
}) {
  const max = Math.max(...items.map(i => i.count), 1);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Icon className="w-4 h-4 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-xs text-muted-foreground">{emptyText}</p>
        ) : (
          <div className="space-y-3">
            {items.map((item, i) => (
              <div key={item.label} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium">{i + 1}. {item.label}</span>
                  <span className="text-muted-foreground font-mono">{item.count}</span>
                </div>
                <Progress value={(item.count / max) * 100} className="h-1.5" />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function computeStats(history: Conference[]) {
  const allRegs = history.flatMap(c => c.registros.map(r => ({ ...r, conferente: c.conferente })));

  // Top conferentes
  const confMap = new Map<string, number>();
  history.forEach(c => {
    const name = c.conferente || 'Desconhecido';
    confMap.set(name, (confMap.get(name) || 0) + c.registros.length);
  });
  const topConferentes = [...confMap.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Categorias
  const catMap = new Map<string, number>();
  allRegs.forEach(r => {
    const modo = r.modoOrigem || 'manual';
    let cat = 'Tecido';
    if (modo === 'madeira') cat = 'Madeira';
    else if (modo === 'motor' || modo === 'controle') cat = 'Motor/Controle';
    catMap.set(cat, (catMap.get(cat) || 0) + 1);
  });
  const topCategorias = [...catMap.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);

  // Subcategorias
  const subMap = new Map<string, number>();
  allRegs.forEach(r => {
    const modo = r.modoOrigem || 'manual';
    let sub = 'Coulisse';
    if (modo === 'openrouter') sub = 'IA';
    else if (modo === 'diversos') sub = 'Diversos';
    else if (modo === 'madeira') sub = 'Madeira';
    else if (modo === 'motor' || modo === 'controle') sub = 'Motor/Controle';
    subMap.set(sub, (subMap.get(sub) || 0) + 1);
  });
  const topSubcategorias = [...subMap.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);

  // Tipos de tecido
  const tipoMap = new Map<string, number>();
  allRegs.forEach(r => {
    const tipo = r.tipoTecido || 'Rolo';
    tipoMap.set(tipo, (tipoMap.get(tipo) || 0) + 1);
  });
  const topTipos = [...tipoMap.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const totalRegistros = allRegs.length;
  const totalConferencias = history.length;

  return { topConferentes, topCategorias, topSubcategorias, topTipos, totalRegistros, totalConferencias };
}

export default function DashboardPage() {
  const history = useAppStore(s => s.history);
  const stats = computeStats(history);

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Início</h1>
        <p className="text-sm text-muted-foreground mt-1">Visão geral das conferências</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{stats.totalConferencias}</div>
            <div className="text-xs text-muted-foreground mt-1">Conferências</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{stats.totalRegistros}</div>
            <div className="text-xs text-muted-foreground mt-1">Itens bipados</div>
          </CardContent>
        </Card>
        <Card className="col-span-2 sm:col-span-1">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{stats.topConferentes.length}</div>
            <div className="text-xs text-muted-foreground mt-1">Conferentes</div>
          </CardContent>
        </Card>
      </div>

      {/* Detail cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard
          title="Conferentes que mais biparam"
          icon={Users}
          items={stats.topConferentes}
          emptyText="Nenhuma conferência registrada"
        />
        <StatCard
          title="Categoria mais bipada"
          icon={Layers3}
          items={stats.topCategorias}
          emptyText="Sem dados"
        />
        <StatCard
          title="Subcategoria mais usada"
          icon={BarChart3}
          items={stats.topSubcategorias}
          emptyText="Sem dados"
        />
        <StatCard
          title="Tipos de tecido mais bipados"
          icon={TrendingUp}
          items={stats.topTipos}
          emptyText="Sem dados"
        />
      </div>
    </div>
  );
}
