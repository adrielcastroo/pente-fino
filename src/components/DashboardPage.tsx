import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAppStore, type Conference } from '@/store/useAppStore';
import { supabase } from '@/integrations/supabase/client';
import { Users, Layers3, BarChart3, TrendingUp, Download, Eye } from 'lucide-react';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const CATEGORY_COLORS: Record<string, string> = {
  Tecido: '#6366f1',
  Madeira: '#f59e0b',
  'Motor/Controle': '#ef4444',
};

const TOOL_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

function computeStats(history: Conference[]) {
  const confMap = new Map<string, Set<string>>();
  const catMap = new Map<string, number>();
  const subMap = new Map<string, number>();
  const tipoMap = new Map<string, number>();
  let totalRegistros = 0;

  for (const conference of history) {
    const name = conference.conferente || 'Desconhecido';
    let confSet = confMap.get(name);
    if (!confSet) {
      confSet = new Set();
      confMap.set(name, confSet);
    }
    for (const r of conference.registros) {
      totalRegistros++;
      if (r.nf) confSet.add(`NF:${r.nf}`);
      if (r.processo) confSet.add(`PROC:${r.processo}`);
      const modo = r.modoOrigem || 'manual';
      let cat = 'Tecido';
      if (modo === 'madeira') cat = 'Madeira';
      else if (modo === 'motor' || modo === 'controle') cat = 'Motor/Controle';
      catMap.set(cat, (catMap.get(cat) || 0) + 1);
      let sub = 'Coulisse';
      if (modo === 'openrouter') sub = 'IA';
      else if (modo === 'diversos') sub = 'Diversos';
      else if (modo === 'madeira') sub = 'Madeira';
      else if (modo === 'motor' || modo === 'controle') sub = 'Motor/Controle';
      subMap.set(sub, (subMap.get(sub) || 0) + 1);
      const tipo = r.tipoTecido || 'Rolo';
      tipoMap.set(tipo, (tipoMap.get(tipo) || 0) + 1);
    }
  }

  return {
    topConferentes: Array.from(confMap.entries()).map(([name, set]) => ({ name, count: set.size })).sort((a, b) => b.count - a.count).slice(0, 5),
    categorias: Array.from(catMap.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
    ferramentas: Array.from(subMap.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
    tipos: Array.from(tipoMap.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6),
    totalRegistros,
    totalConferencias: history.length,
    totalConferentes: confMap.size,
  };
}

export default function DashboardPage() {
  const history = useAppStore(s => s.history);
  const setFormData = useAppStore(s => s.setFormData);
  const stats = useMemo(() => computeStats(history), [history]);
  const [detailChart, setDetailChart] = useState<{ title: string; data: any[]; type: 'pie' | 'bar' } | null>(null);

  const handleStatClick = (tab: any) => {
    setFormData({ activeTab: tab });
  };

  const exportExcel = useCallback((data: any[], fileName: string) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Dados');
    XLSX.writeFile(wb, `${fileName}.xlsx`);
    toast.success('Relatório exportado!');
  }, []);

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto overflow-x-hidden">
      <h1 className="text-3xl sm:text-4xl font-black">Dashboard</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: 'Conferências', value: stats.totalConferencias, icon: BarChart3, tab: 'history', color: 'bg-blue-500/10 text-blue-600' },
          { label: 'Itens Bipados', value: stats.totalRegistros, icon: Layers3, tab: 'table', color: 'bg-emerald-500/10 text-emerald-600' },
          { label: 'Conferentes', value: stats.totalConferentes, icon: Users, tab: 'inicio', color: 'bg-amber-500/10 text-amber-600' },
        ].map(s => (
          <Card key={s.label} onClick={() => handleStatClick(s.tab)} className="cursor-pointer hover:scale-[1.02] transition-transform border-none shadow-sm bg-card/50 backdrop-blur-sm">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase">{s.label}</p>
                <div className="text-4xl font-black">{s.value}</div>
              </div>
              <div className={`p-4 rounded-2xl ${s.color}`}><s.icon className="w-8 h-8" /></div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[
          { title: 'Conferentes', data: stats.topConferentes, type: 'bar' as const, icon: Users },
          { title: 'Categorias', data: stats.categorias, type: 'pie' as const, icon: Layers3 },
          { title: 'Ferramentas', data: stats.ferramentas, type: 'bar' as const, icon: BarChart3 },
          { title: 'Tipos', data: stats.tipos, type: 'pie' as const, icon: TrendingUp },
        ].map(chart => (
          <Card key={chart.title} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b mb-4">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <chart.icon className="w-4 h-4 text-primary" /> {chart.title}
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => setDetailChart({ title: chart.title, data: chart.data, type: chart.type })}>
                  <Eye className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => exportExcel(chart.data, chart.title)}>
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="h-[250px] cursor-pointer" onClick={() => setDetailChart({ title: chart.title, data: chart.data, type: chart.type })}>
              <ResponsiveContainer width="100%" height="100%">
                {chart.type === 'bar' ? (
                  <BarChart data={chart.data}>
                    <XAxis dataKey="name" fontSize={10} hide />
                    <YAxis hide />
                    <Tooltip cursor={{fill: 'transparent'}} />
                    <Bar dataKey={chart.title === 'Conferentes' ? 'count' : 'count'} fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                ) : (
                  <PieChart>
                    <Pie data={chart.data} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} stroke="none">
                      {chart.data.map((_, i) => <Cell key={i} fill={TOOL_COLORS[i % TOOL_COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                )}
              </ResponsiveContainer>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!detailChart} onOpenChange={() => setDetailChart(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{detailChart?.title}</DialogTitle></DialogHeader>
          <div className="h-[400px]">
            {detailChart && (
                <ResponsiveContainer width="100%" height="100%">
                    {detailChart.type === 'bar' ? (
                      <BarChart data={detailChart.data} margin={{ bottom: 40 }}>
                        <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} fontSize={12} />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey={detailChart.title === 'Conferentes' ? 'count' : 'count'} fill="#6366f1" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    ) : (
                      <PieChart>
                        <Pie data={detailChart.data} dataKey="value" nameKey="name" outerRadius={120} label>
                          {detailChart.data.map((_, i) => <Cell key={i} fill={TOOL_COLORS[i % TOOL_COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    )}
                </ResponsiveContainer>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
