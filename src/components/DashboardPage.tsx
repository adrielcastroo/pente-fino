import { useState, useEffect, useMemo } from 'react';
import { useAppStore, type Conference } from '@/store/useAppStore';
import { supabase } from '@/integrations/supabase/client';
import { Users, Layers3, BarChart3, TrendingUp, Warehouse } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const CATEGORY_COLORS: Record<string, string> = {
  Tecido: 'hsl(var(--primary))',
  Madeira: '#f59e0b',
  'Motor/Controle': '#ef4444',
};

const TOOL_COLORS = ['hsl(var(--primary))', '#0f172a', '#f59e0b', '#ef4444', '#8b5cf6'];
const TIPO_COLORS = ['hsl(var(--primary))', '#0f172a', '#f59e0b', '#ef4444', '#8b5cf6', '#10b981'];
const STOCK_COLORS = { ocupado: '#10b981', reservado: '#f59e0b', bloqueado: '#ef4444', livre: '#334155' };

function computeStats(history: Conference[]) {
  const allRegs = history.flatMap(c => c.registros.map(r => ({ ...r, conferente: c.conferente })));

  // Conferentes by distinct NF + PROC
  const confMap = new Map<string, Set<string>>();
  history.forEach(c => {
    const name = c.conferente || 'Desconhecido';
    if (!confMap.has(name)) confMap.set(name, new Set());
    const set = confMap.get(name)!;
    c.registros.forEach(r => {
      if (r.nf) set.add(`NF:${r.nf}`);
      if (r.processo) set.add(`PROC:${r.processo}`);
    });
  });
  const topConferentes = [...confMap.entries()]
    .map(([name, set]) => ({ name, count: set.size }))
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
  const categorias = [...catMap.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

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
  const ferramentas = [...subMap.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);

  const tipoMap = new Map<string, number>();
  allRegs.forEach(r => {
    const tipo = r.tipoTecido || 'Rolo';
    tipoMap.set(tipo, (tipoMap.get(tipo) || 0) + 1);
  });
  const tipos = [...tipoMap.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6);

  return {
    topConferentes, categorias, ferramentas, tipos,
    totalRegistros: allRegs.length,
    totalConferencias: history.length,
    totalConferentes: confMap.size,
  };
}

interface StockStats {
  estrutura: string;
  ocupado: number;
  reservado: number;
  bloqueado: number;
  livre: number;
}

export default function DashboardPage() {
  const history = useAppStore(s => s.history);
  const stats = computeStats(history);
  const [stockData, setStockData] = useState<StockStats[]>([]);

  useEffect(() => {
    loadStockStats();
  }, []);

  const loadStockStats = async () => {
    const tecConfigs: Record<string, number> = {
      TEC00: 2 * 9 * 30, TEC01: 6 * 5 * 30, TEC02: 2 * 4 * 30,
      TEC03: 2 * 9 * 30, TEC04: 3 * 5 * 30, TEC05: 3 * 5 * 30,
    };
    const { data } = await supabase.from('estoque_posicoes').select('estrutura, status');
    const countMap: Record<string, Record<string, number>> = {};
    (data || []).forEach((r: any) => {
      if (!countMap[r.estrutura]) countMap[r.estrutura] = {};
      countMap[r.estrutura][r.status] = (countMap[r.estrutura][r.status] || 0) + 1;
    });
    const result: StockStats[] = Object.entries(tecConfigs).map(([tec, total]) => {
      const c = countMap[tec] || {};
      const occupied = (c.ocupado || 0) + (c.reservado || 0) + (c.bloqueado || 0) + (c.saida || 0);
      return {
        estrutura: tec,
        ocupado: c.ocupado || 0,
        reservado: c.reservado || 0,
        bloqueado: c.bloqueado || 0,
        livre: total - occupied,
      };
    });
    setStockData(result);
  };

  const stockTotals = useMemo(() => {
    return stockData.reduce(
      (acc, s) => ({
        ocupado: acc.ocupado + s.ocupado,
        reservado: acc.reservado + s.reservado,
        bloqueado: acc.bloqueado + s.bloqueado,
        livre: acc.livre + s.livre,
      }),
      { ocupado: 0, reservado: 0, bloqueado: 0, livre: 0 }
    );
  }, [stockData]);

  const stockPieData = [
    { name: 'Ocupado', value: stockTotals.ocupado },
    { name: 'Reservado', value: stockTotals.reservado },
    { name: 'Bloqueado', value: stockTotals.bloqueado },
    { name: 'Livre', value: stockTotals.livre },
  ].filter(d => d.value > 0);

  const stockPieColors = ['#10b981', '#f59e0b', '#ef4444', '#1e2a3f'];

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground lg:text-4xl">Início</h1>
        <p className="text-base text-muted-foreground max-w-2xl">
          Monitore o desempenho das conferências e o status do estoque em tempo real com métricas detalhadas.
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="group overflow-hidden border border-border/40 shadow-sm hover:shadow-md transition-all duration-300 bg-gradient-to-br from-primary/10 via-card to-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-primary/80 uppercase tracking-wider">Conferências</p>
                <div className="text-4xl font-bold tracking-tighter text-foreground group-hover:scale-110 transition-transform origin-left duration-300">
                  {stats.totalConferencias}
                </div>
              </div>
              <div className="p-4 bg-primary/20 rounded-2xl group-hover:rotate-12 transition-transform duration-300">
                <BarChart3 className="w-7 h-7 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group overflow-hidden border border-border/40 shadow-sm hover:shadow-md transition-all duration-300 bg-gradient-to-br from-emerald-500/10 via-card to-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-emerald-600/80 dark:text-emerald-400/80 uppercase tracking-wider">Itens bipados</p>
                <div className="text-4xl font-bold tracking-tighter text-foreground group-hover:scale-110 transition-transform origin-left duration-300">
                  {stats.totalRegistros}
                </div>
              </div>
              <div className="p-4 bg-emerald-500/20 rounded-2xl group-hover:-rotate-12 transition-transform duration-300">
                <Layers3 className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group overflow-hidden border border-border/40 shadow-sm hover:shadow-md transition-all duration-300 bg-gradient-to-br from-amber-500/10 via-card to-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-amber-600/80 dark:text-amber-400/80 uppercase tracking-wider">Conferentes</p>
                <div className="text-4xl font-bold tracking-tighter text-foreground group-hover:scale-110 transition-transform origin-left duration-300">
                  {stats.totalConferentes}
                </div>
              </div>
              <div className="p-4 bg-amber-500/20 rounded-2xl group-hover:rotate-12 transition-transform duration-300">
                <Users className="w-7 h-7 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border border-border/40 shadow-sm lg:col-span-2 hover:shadow-md transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-3 space-y-0 border-b border-border/10 mb-4">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="w-4 h-4 text-primary" />
              </div> 
              Principais Conferentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.topConferentes.length === 0 ? (
              <div className="h-[220px] flex items-center justify-center border-2 border-dashed border-muted rounded-xl">
                <p className="text-sm text-muted-foreground italic">Nenhum dado disponível</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={stats.topConferentes} layout="vertical" margin={{ left: -10, right: 12, top: 4, bottom: 4 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))', fontWeight: 500 }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ fontSize: 12, borderRadius: '12px', background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} 
                    cursor={{ fill: 'rgba(0,0,0,0.03)' }}
                  />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} name="NF/PROC" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border border-border/40 shadow-sm lg:col-span-2 hover:shadow-md transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-3 space-y-0 border-b border-border/10 mb-4">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Layers3 className="w-4 h-4 text-primary" />
              </div>
              Distribuição por Categoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.categorias.length === 0 ? (
              <div className="h-[220px] flex items-center justify-center border-2 border-dashed border-muted rounded-xl">
                <p className="text-sm text-muted-foreground italic">Sem dados registrados</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={stats.categorias} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} stroke="none">
                    {stats.categorias.map(e => <Cell key={e.name} fill={CATEGORY_COLORS[e.name] || '#999'} />)}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ fontSize: 12, borderRadius: '8px', background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 11, paddingTop: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" /> Ferramentas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.ferramentas.length === 0 ? (
              <div className="h-[220px] flex items-center justify-center border-2 border-dashed border-muted rounded-lg">
                <p className="text-xs text-muted-foreground italic">Sem dados de ferramentas</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={stats.ferramentas} margin={{ left: -30, right: 12, top: 10, bottom: 4 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ fontSize: 12, borderRadius: '8px', background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                    cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                  />
                  <Bar dataKey="count" name="Itens" radius={[4, 4, 0, 0]}>
                    {stats.ferramentas.map((_, i) => <Cell key={i} fill={TOOL_COLORS[i % TOOL_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" /> Tipos de tecido
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.tipos.length === 0 ? (
              <div className="h-[220px] flex items-center justify-center border-2 border-dashed border-muted rounded-lg">
                <p className="text-xs text-muted-foreground italic">Sem tipos detectados</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={stats.tipos} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} stroke="none">
                    {stats.tipos.map((_, i) => <Cell key={i} fill={TIPO_COLORS[i % TIPO_COLORS.length]} />)}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ fontSize: 12, borderRadius: '8px', background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 11, paddingTop: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2 border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Warehouse className="w-4 h-4 text-primary" /> Estoque por Estrutura
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stockData.length === 0 ? (
              <div className="h-[250px] flex items-center justify-center border-2 border-dashed border-muted rounded-lg">
                <p className="text-xs text-muted-foreground italic">Sincronizando estoque...</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={stockData} margin={{ left: -20, right: 12, top: 10, bottom: 10 }}>
                  <XAxis dataKey="estrutura" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ fontSize: 12, borderRadius: '8px', background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                    cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                  />
                  <Bar dataKey="ocupado" stackId="a" fill="#10b981" name="Ocupado" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="reservado" stackId="a" fill="#f59e0b" name="Reservado" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="bloqueado" stackId="a" fill="#ef4444" name="Bloqueado" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="livre" stackId="a" fill="#1e2a3f" name="Livre" radius={[4, 4, 0, 0]} />
                  <Legend iconType="circle" verticalAlign="bottom" wrapperStyle={{ fontSize: 11, paddingTop: '15px' }} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {stockPieData.length > 0 && (
          <Card className="md:col-span-2 border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Warehouse className="w-4 h-4 text-primary" /> Resumo Geral do Estoque
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={stockPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={65} outerRadius={95} paddingAngle={4} stroke="none">
                    {stockPieData.map((_, i) => <Cell key={i} fill={stockPieColors[i]} />)}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ fontSize: 12, borderRadius: '8px', background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                  />
                  <Legend iconType="circle" verticalAlign="bottom" wrapperStyle={{ fontSize: 11, paddingTop: '15px' }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
