import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { TreePine, AlertTriangle, BarChart3, Eye, Loader2, Layers3 } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as ChartTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid, Legend,
} from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { usePerformance } from '@/hooks/use-performance';

const AVARIA_LABELS: Record<string, string> = {
  manchado: 'Manchado',
  quebrado: 'Quebrado',
  tonalidade: 'Tonalidade',
  riscado: 'Riscado',
  outro: 'Outro',
};

const AVARIA_COLORS: Record<string, string> = {
  manchado: 'hsl(38, 92%, 50%)',
  quebrado: 'hsl(0, 84%, 60%)',
  tonalidade: 'hsl(280, 65%, 60%)',
  riscado: 'hsl(199, 89%, 48%)',
  outro: 'hsl(var(--muted-foreground))',
};

const COLUNAS = ['A', 'B', 'C'];
const NIVEIS = 11;

interface MadRow {
  id: string;
  endereco: string | null;
  largura: number | null;
  m_linear: number | null;
  avaria_tipo: string | null;
  tipo_tecido: string | null;
}

interface Quadrante {
  coluna: string;
  nivel: number;
  tipo_ocupacao: 'lamina' | 'base';
  capacidade: number;
}

export default function MadeiraDashboard() {
  const { isLow } = usePerformance();
  const [rows, setRows] = useState<MadRow[]>([]);
  const [quadrantes, setQuadrantes] = useState<Quadrante[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<'avarias' | 'ocupacao' | 'colunas' | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [regsRes, quadRes] = await Promise.all([
          supabase
            .from('registros')
            .select('id, endereco, largura, m_linear, avaria_tipo, tipo_tecido')
            .eq('modo_origem', 'madeira'),
          supabase.from('madeira_quadrantes' as any).select('coluna, nivel, tipo_ocupacao, capacidade').eq('estrutura', 'MAD01'),
        ]);
        if (!mounted) return;
        setRows((regsRes.data as any[] as MadRow[]) || []);
        setQuadrantes((quadRes.data as any[]) || []);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Group items by cell
  const cellItems = useMemo(() => {
    const map: Record<string, MadRow[]> = {};
    for (const r of rows) {
      if (!r.endereco) continue;
      const m = r.endereco.match(/(?:MAD01\.)?([A-C])\.N0?(\d{1,2})/i);
      if (!m) continue;
      const col = m[1].toUpperCase();
      const nivel = parseInt(m[2], 10);
      if (!COLUNAS.includes(col) || nivel < 1 || nivel > NIVEIS) continue;
      const key = `${col}-${nivel}`;
      (map[key] ||= []).push(r);
    }
    return map;
  }, [rows]);

  const quadMap = useMemo(() => {
    const m: Record<string, Quadrante> = {};
    quadrantes.forEach(q => { m[`${q.coluna}-${q.nivel}`] = q; });
    return m;
  }, [quadrantes]);

  // Avarias breakdown
  const avariasData = useMemo(() => {
    const counts: Record<string, { count: number; metros: number }> = {};
    let totalAvarias = 0;
    let totalMetros = 0;
    for (const r of rows) {
      if (!r.avaria_tipo) continue;
      const k = r.avaria_tipo;
      if (!counts[k]) counts[k] = { count: 0, metros: 0 };
      counts[k].count++;
      counts[k].metros += Number(r.m_linear) || 0;
      totalAvarias++;
      totalMetros += Number(r.m_linear) || 0;
    }
    const data = Object.entries(counts).map(([k, v]) => ({
      name: AVARIA_LABELS[k] || k,
      key: k,
      value: v.count,
      metros: Number(v.metros.toFixed(2)),
      percent: totalAvarias ? Math.round((v.count / totalAvarias) * 100) : 0,
      color: AVARIA_COLORS[k] || 'hsl(var(--muted-foreground))',
    })).sort((a, b) => b.value - a.value);
    return { data, totalAvarias, totalMetros: Number(totalMetros.toFixed(2)), totalLaminas: rows.filter(r => r.tipo_tecido === 'Lâmina').length };
  }, [rows]);

  // Ocupação geral
  const ocupacaoData = useMemo(() => {
    let totalCap = 0;
    let totalOcc = 0;
    for (const col of COLUNAS) {
      for (let n = 1; n <= NIVEIS; n++) {
        const q = quadMap[`${col}-${n}`];
        const cap = q?.capacidade ?? 24;
        totalCap += cap;
        totalOcc += (cellItems[`${col}-${n}`] || []).length;
      }
    }
    const livre = Math.max(0, totalCap - totalOcc);
    return [
      { name: 'Ocupado', value: totalOcc, color: 'hsl(var(--primary))' },
      { name: 'Livre', value: livre, color: 'hsl(var(--muted-foreground) / 0.3)' },
    ];
  }, [cellItems, quadMap]);

  const totalCapacidade = ocupacaoData[0].value + ocupacaoData[1].value;
  const ocupacaoPercent = totalCapacidade ? Math.round((ocupacaoData[0].value / totalCapacidade) * 100) : 0;

  // Ocupação por coluna
  const colunasData = useMemo(() => {
    return COLUNAS.map(col => {
      let cap = 0, occ = 0;
      for (let n = 1; n <= NIVEIS; n++) {
        const q = quadMap[`${col}-${n}`];
        cap += q?.capacidade ?? 24;
        occ += (cellItems[`${col}-${n}`] || []).length;
      }
      return {
        name: `Col ${col}`,
        Ocupado: occ,
        Capacidade: cap,
        Livre: Math.max(0, cap - occ),
        percent: cap ? Math.round((occ / cap) * 100) : 0,
      };
    });
  }, [cellItems, quadMap]);

  const tooltipStyle = {
    borderRadius: '10px',
    border: '1px solid hsl(var(--border))',
    background: 'hsl(var(--card))',
    fontSize: '12px',
    fontWeight: '600',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
        <Loader2 className="w-4 h-4 animate-spin" /> Carregando estoque madeira...
      </div>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2 pb-2">
        <TreePine className="w-5 h-5 text-emerald-500" />
        <h2 className="text-lg sm:text-xl font-bold tracking-tight">Estoque de Lâminas (MAD01)</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-5">
        {/* AVARIAS */}
        <button 
          onClick={() => setDetail('avarias')}
          className="group text-left w-full cursor-pointer rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden hover:border-primary/40 hover:shadow-md transition-all active:scale-[0.98]"
        >
          <div className="px-5 py-4 flex flex-row items-center justify-between">
            <div>
              <div className="text-sm font-bold flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                <span>Avarias</span>
              </div>
              <p className="text-[10px] text-muted-foreground font-medium mt-0.5">
                {avariasData.totalAvarias} avarias · {avariasData.totalMetros}m
              </p>
            </div>
            <div className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
              <Eye className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="px-5 pb-4 h-[180px] flex flex-col">
            <div className="flex-1 min-h-0">
              {avariasData.data.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-muted-foreground italic">Sem avarias registradas</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={avariasData.data} dataKey="value" innerRadius="55%" outerRadius="85%" stroke="transparent" paddingAngle={isLow ? 0 : 3} isAnimationActive={!isLow}>
                      {avariasData.data.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                    <ChartTooltip
                      contentStyle={tooltipStyle}
                      formatter={(val: any, _name: any, p: any) => [`${val} (${p.payload.percent}%) · ${p.payload.metros}m`, p.payload.name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            {avariasData.data.length > 0 && (
              <div className="mt-2 space-y-1">
                {avariasData.data.slice(0, 2).map(d => (
                  <div key={d.key} className="flex items-center justify-between text-[10px]">
                    <span className="flex items-center gap-1.5 font-medium truncate max-w-[120px]">
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: d.color }} />
                      {d.name}
                    </span>
                    <span className="font-bold text-muted-foreground">{d.value} un</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </button>

        <button 
          onClick={() => setDetail('ocupacao')}
          className="group text-left w-full cursor-pointer rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden hover:border-primary/40 hover:shadow-md transition-all active:scale-[0.98]"
        >
          <div className="px-5 py-4 flex flex-row items-center justify-between">
            <div>
              <div className="text-sm font-bold flex items-center gap-2">
                <Layers3 className="w-3.5 h-3.5 text-primary" />
                <span>Ocupação Geral</span>
              </div>
              <p className="text-[10px] text-muted-foreground font-medium mt-0.5">
                {ocupacaoData[0].value}/{totalCapacidade} ({ocupacaoPercent}%)
              </p>
            </div>
            <div className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
              <Eye className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="px-5 pb-4 h-[180px] flex flex-col">
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={ocupacaoData} dataKey="value" innerRadius="55%" outerRadius="85%" stroke="transparent" paddingAngle={isLow ? 0 : 3} isAnimationActive={!isLow}>
                    {ocupacaoData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <ChartTooltip contentStyle={tooltipStyle} formatter={(v: any) => [v, 'Espaços']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 space-y-1.5">
              <div className="h-1.5 w-full rounded-full bg-muted/40 overflow-hidden">
                <div className="h-full bg-primary transition-all duration-500" style={{ width: `${ocupacaoPercent}%` }} />
              </div>
              <div className="flex justify-between text-[10px] font-bold text-muted-foreground">
                <span>OCUPADO</span>
                <span className="text-primary">{ocupacaoPercent}%</span>
              </div>
            </div>
          </div>
        </button>

        <button 
          onClick={() => setDetail('colunas')}
          className="group text-left w-full cursor-pointer rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden hover:border-primary/40 hover:shadow-md transition-all active:scale-[0.98]"
        >
          <div className="px-5 py-4 flex flex-row items-center justify-between">
            <div>
              <div className="text-sm font-bold flex items-center gap-2">
                <BarChart3 className="w-3.5 h-3.5 text-primary" />
                <span>Ocupação por Coluna</span>
              </div>
              <p className="text-[10px] text-muted-foreground font-medium mt-0.5">Distribuição A · B · C</p>
            </div>
            <div className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
              <Eye className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="px-5 pb-4 h-[180px] flex flex-col">
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={colunasData} margin={{ top: 5, right: 10, left: 0, bottom: 15 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis fontSize={10} axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <ChartTooltip contentStyle={tooltipStyle} cursor={!isLow ? { fill: 'hsl(var(--primary) / 0.05)' } : false} />
                  <Bar dataKey="Ocupado" stackId="a" fill="hsl(var(--primary))" radius={[0, 0, 4, 4]} barSize={32} isAnimationActive={!isLow} />
                  <Bar dataKey="Livre" stackId="a" fill="hsl(var(--muted-foreground) / 0.2)" radius={[4, 4, 0, 0]} barSize={32} isAnimationActive={!isLow} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 flex justify-between gap-2">
              {colunasData.map(c => (
                <div key={c.name} className="flex-1 text-center">
                  <div className="text-[10px] font-black text-foreground">{c.percent}%</div>
                  <div className="text-[8px] font-bold text-muted-foreground/60 uppercase">{c.name.split(' ')[1] || c.name}</div>
                </div>
              ))}
            </div>
          </div>
        </button>
      </div>

      {/* DETAIL DIALOG */}
      <Dialog open={!!detail} onOpenChange={() => setDetail(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl p-0 gap-0 border-border/40 bg-card overflow-hidden rounded-2xl max-h-[80vh]">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/20 bg-muted/20">
            <DialogTitle className="text-lg font-black tracking-tight">
              {detail === 'avarias' && 'Detalhes de Avarias'}
              {detail === 'ocupacao' && 'Ocupação Geral MAD01'}
              {detail === 'colunas' && 'Ocupação por Coluna'}
            </DialogTitle>
            <DialogDescription className="text-xs">Análise detalhada do estoque de lâminas</DialogDescription>
          </DialogHeader>
          <div className="p-6 overflow-y-auto max-h-[60vh] space-y-4">
            {detail === 'avarias' && (
              <>
                <div className="grid grid-cols-3 gap-3">
                  <StatBlock label="Avarias" value={avariasData.totalAvarias.toString()} />
                  <StatBlock label="Lâminas" value={avariasData.totalLaminas.toString()} />
                  <StatBlock label="Metros" value={`${avariasData.totalMetros} m`} />
                </div>
                <table className="w-full text-xs">
                  <thead className="bg-muted/30">
                    <tr>
                      <th className="px-3 py-2 text-left font-black text-[10px] uppercase tracking-wider text-muted-foreground">Tipo</th>
                      <th className="px-3 py-2 text-right font-black text-[10px] uppercase tracking-wider text-muted-foreground">Qtd</th>
                      <th className="px-3 py-2 text-right font-black text-[10px] uppercase tracking-wider text-muted-foreground">%</th>
                      <th className="px-3 py-2 text-right font-black text-[10px] uppercase tracking-wider text-muted-foreground">Metros</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/10">
                    {avariasData.data.map(d => (
                      <tr key={d.key} className="hover:bg-muted/20">
                        <td className="px-3 py-2 font-bold text-foreground flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                          {d.name}
                        </td>
                        <td className="px-3 py-2 text-right font-mono font-bold text-primary">{d.value}</td>
                        <td className="px-3 py-2 text-right font-mono text-muted-foreground">{d.percent}%</td>
                        <td className="px-3 py-2 text-right font-mono text-muted-foreground">{d.metros} m</td>
                      </tr>
                    ))}
                    {avariasData.data.length === 0 && (
                      <tr><td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">Sem avarias registradas</td></tr>
                    )}
                  </tbody>
                </table>
                <div className="h-[200px] mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={avariasData.data}>
                      <XAxis dataKey="name" fontSize={10} hide />
                      <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      <ChartTooltip contentStyle={tooltipStyle} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}
            {detail === 'ocupacao' && (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <StatBlock label="Capacidade" value={totalCapacidade.toString()} />
                  <StatBlock label="Ocupado" value={ocupacaoData[0].value.toString()} />
                  <StatBlock label="Livre" value={ocupacaoData[1].value.toString()} />
                </div>
                <div className="h-3 rounded-full bg-muted/40 overflow-hidden">
                  <div className="h-full bg-primary transition-all" style={{ width: `${ocupacaoPercent}%` }} />
                </div>
                <p className="text-center text-sm font-bold">Taxa de ocupação: <span className="text-primary">{ocupacaoPercent}%</span></p>
                <div className="h-[200px] mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={ocupacaoData} dataKey="value" innerRadius={60} outerRadius={80} paddingAngle={5}>
                        {ocupacaoData.map((d, i) => <Cell key={i} fill={d.color} />)}
                      </Pie>
                      <ChartTooltip contentStyle={tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
            {detail === 'colunas' && (
              <table className="w-full text-xs">
                <thead className="bg-muted/30">
                  <tr>
                    <th className="px-3 py-2 text-left font-black text-[10px] uppercase tracking-wider text-muted-foreground">Coluna</th>
                    <th className="px-3 py-2 text-right font-black text-[10px] uppercase tracking-wider text-muted-foreground">Capacidade</th>
                    <th className="px-3 py-2 text-right font-black text-[10px] uppercase tracking-wider text-muted-foreground">Ocupado</th>
                    <th className="px-3 py-2 text-right font-black text-[10px] uppercase tracking-wider text-muted-foreground">Livre</th>
                    <th className="px-3 py-2 text-right font-black text-[10px] uppercase tracking-wider text-muted-foreground">%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/10">
                  {colunasData.map(c => (
                    <tr key={c.name} className="hover:bg-muted/20">
                      <td className="px-3 py-2 font-bold text-foreground">{c.name}</td>
                      <td className="px-3 py-2 text-right font-mono">{c.Capacidade}</td>
                      <td className="px-3 py-2 text-right font-mono text-primary font-bold">{c.Ocupado}</td>
                      <td className="px-3 py-2 text-right font-mono text-muted-foreground">{c.Livre}</td>
                      <td className="px-3 py-2 text-right font-mono font-bold">{c.percent}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/30 bg-muted/20 p-3 text-center">
      <div className="text-2xl font-black tabular-nums text-primary">{value}</div>
      <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}
