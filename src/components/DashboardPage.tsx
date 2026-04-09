import { useAppStore, type Conference } from '@/store/useAppStore';
import { Users, Layers3, BarChart3, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const CATEGORY_COLORS: Record<string, string> = {
  Tecido: '#2A9D8F',
  Madeira: '#E9C46A',
  'Motor/Controle': '#E76F51',
};

const TOOL_COLORS = ['hsl(170, 57%, 39%)', 'hsl(38, 72%, 67%)', 'hsl(14, 72%, 51%)', 'hsl(213, 50%, 24%)'];

const TIPO_COLORS = ['#2A9D8F', '#264653', '#E9C46A', '#E76F51', '#F4A261', '#606C38'];

function computeStats(history: Conference[]) {
  const allRegs = history.flatMap(c => c.registros.map(r => ({ ...r, conferente: c.conferente })));

  const confMap = new Map<string, number>();
  history.forEach(c => {
    const name = c.conferente || 'Desconhecido';
    confMap.set(name, (confMap.get(name) || 0) + c.registros.length);
  });
  const topConferentes = [...confMap.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const catMap = new Map<string, number>();
  allRegs.forEach(r => {
    const modo = r.modoOrigem || 'manual';
    let cat = 'Tecido';
    if (modo === 'madeira') cat = 'Madeira';
    else if (modo === 'motor' || modo === 'controle') cat = 'Motor/Controle';
    catMap.set(cat, (catMap.get(cat) || 0) + 1);
  });
  const categorias = [...catMap.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

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
  const ferramentas = [...subMap.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const tipoMap = new Map<string, number>();
  allRegs.forEach(r => {
    const tipo = r.tipoTecido || 'Rolo';
    tipoMap.set(tipo, (tipoMap.get(tipo) || 0) + 1);
  });
  const tipos = [...tipoMap.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  return {
    topConferentes,
    categorias,
    ferramentas,
    tipos,
    totalRegistros: allRegs.length,
    totalConferencias: history.length,
    totalConferentes: confMap.size,
  };
}

export default function DashboardPage() {
  const history = useAppStore(s => s.history);
  const stats = computeStats(history);

  const empty = stats.totalConferencias === 0;

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Início</h1>
        <p className="text-sm text-muted-foreground mt-1">Visão geral das conferências</p>
      </div>

      {/* Summary */}
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
            <div className="text-2xl font-bold text-primary">{stats.totalConferentes}</div>
            <div className="text-xs text-muted-foreground mt-1">Conferentes</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Conferentes - Bar */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" /> Conferentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.topConferentes.length === 0 ? (
              <p className="text-xs text-muted-foreground">Nenhum dado</p>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={stats.topConferentes} layout="vertical" margin={{ left: 0, right: 12, top: 4, bottom: 4 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Bar dataKey="count" fill="hsl(170, 57%, 39%)" radius={[0, 4, 4, 0]} name="Itens" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Categorias - Pie */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Layers3 className="w-4 h-4 text-primary" /> Categorias
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.categorias.length === 0 ? (
              <p className="text-xs text-muted-foreground">Sem dados</p>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={stats.categorias} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3}>
                    {stats.categorias.map((entry) => (
                      <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name] || '#999'} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Ferramentas - Bar */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" /> Ferramentas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.ferramentas.length === 0 ? (
              <p className="text-xs text-muted-foreground">Sem dados</p>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={stats.ferramentas} margin={{ left: 0, right: 12, top: 4, bottom: 4 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis hide />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Bar dataKey="count" name="Itens" radius={[4, 4, 0, 0]}>
                    {stats.ferramentas.map((_, i) => (
                      <Cell key={i} fill={TOOL_COLORS[i % TOOL_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Tipos de tecido - Pie */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" /> Tipos de tecidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.tipos.length === 0 ? (
              <p className="text-xs text-muted-foreground">Sem dados</p>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={stats.tipos} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3}>
                    {stats.tipos.map((_, i) => (
                      <Cell key={i} fill={TIPO_COLORS[i % TIPO_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
