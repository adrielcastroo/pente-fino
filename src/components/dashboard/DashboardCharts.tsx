import React, { useMemo, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity, Download, Eye, Package, ListChecks } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as ChartTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, CartesianGrid, Legend,
} from 'recharts';
import { usePerformance } from '@/hooks/use-performance';
import { useIsMobile } from '@/hooks/use-mobile';
import { motion } from 'framer-motion';

// Premium Color Palette
const CHART_COLORS = [
  'hsl(var(--primary))',
  '#0D9488', // Teal 600
  '#7C3AED', // Violet 600
  '#D97706', // Amber 600
  '#DC2626', // Red 600
  '#2563EB', // Blue 600
];

const CustomTooltip = ({ active, payload, label, prefix = '', suffix = '' }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="rounded-2xl border border-white/20 bg-card/60 backdrop-blur-xl p-4 shadow-2xl shadow-black/20"
      >
        <p className="text-[10px] font-black uppercase tracking-widest text-foreground/50 mb-3 border-b border-border/10 pb-2">
          {label || data.name}
        </p>
        <div className="flex flex-col gap-2">
          {payload.map((p: any, i: number) => (
            <div key={i} className="flex items-center justify-between gap-8">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                <span className="text-xs font-bold text-foreground/70">{p.name}:</span>
              </div>
              <span className="text-sm font-black tabular-nums" style={{ color: p.color }}>
                {prefix}{p.value}{suffix}
              </span>
            </div>
          ))}
          {data.inspectors && (
            <div className="mt-2 pt-2 border-t border-border/10">
               <span className="text-[10px] font-black uppercase text-foreground/40 block mb-1">Responsáveis:</span>
               <span className="text-xs font-bold text-primary truncate max-w-[200px]">{data.inspectors}</span>
            </div>
          )}
        </div>
      </motion.div>
    );
  }
  return null;
};

export const TimelineChart = React.memo(({ data, onExport, onDetailClick, id, periodLabel }: any) => {
  const { isLow } = usePerformance();
  const processedData = useMemo(() => isLow ? data.slice(-10) : data, [data, isLow]);

  return (
    <Card id={id} className="md:col-span-3 border border-border/10 bg-card/20 backdrop-blur-xl overflow-hidden rounded-[2rem] transition-all duration-500 hover:border-primary/20">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between px-10 py-8 gap-6 bg-muted/5 backdrop-blur-xl border-b border-border/10">
        <div className="space-y-1">
          <CardTitle className="text-xl font-extrabold tracking-tight flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Activity className="w-5 h-5" />
            </div>
            <span>Volume de Operações</span>
          </CardTitle>
          <p className="text-sm text-foreground/60 font-black ml-11">
            {periodLabel || 'Histórico de conferências por período'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onDetailClick && (
            <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl" onClick={() => onDetailClick({ title: 'Volume de Operações', data, type: 'area' })}>
              <Eye className="w-4 h-4" />
            </Button>
          )}
          <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl" onClick={() => onExport(data, 'Timeline_Operacoes')}>
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-8 pb-12 pt-10 h-[400px]">
        {processedData.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-2 text-foreground/50">
            <Activity className="w-10 h-10 opacity-30" />
            <p className="text-sm font-bold">Nenhuma conferência no período</p>
            <p className="text-xs text-foreground/40">Os dados aparecerão aqui após as primeiras bipagens</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={processedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border) / 0.5)" />
              <XAxis dataKey="name" fontSize={10} tick={{ fill: 'hsl(var(--foreground) / 0.6)', fontWeight: 800 }} interval="preserveStartEnd" />
              <YAxis fontSize={10} tick={{ fill: 'hsl(var(--foreground) / 0.6)', fontWeight: 800 }} allowDecimals={false} />
              <ChartTooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--primary) / 0.05)' }} />
              <Area type="monotone" dataKey="total" stroke="hsl(var(--primary))" strokeWidth={3} fill="hsl(var(--primary) / 0.1)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
});

export const SummaryChart = React.memo(({ title, desc, data, type, icon: Icon, onDetailClick, chartKey, id }: any) => {
  const { isLow } = usePerformance();
  return (
    <Card id={id} className="group border border-border/10 bg-card/20 backdrop-blur-xl shadow-sm overflow-hidden rounded-[2rem] transition-all duration-500 hover:border-primary/30 hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] hover:-translate-y-2">
      <CardHeader className="px-8 py-8 flex flex-row items-start justify-between">
        <div className="space-y-2">
          <CardTitle className="text-base font-black flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500">
              <Icon className="w-4 h-4" />
            </div>
            <span className="tracking-tight">{title}</span>
          </CardTitle>
          <p className="text-[10px] text-foreground/40 font-black uppercase tracking-[0.2em] ml-10">{desc}</p>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="rounded-xl hover:bg-primary/10 hover:text-primary transition-all active:scale-90"
          onClick={() => onDetailClick({ title, data, type })}
        >
          <Eye className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent className="px-8 pb-8 h-[260px]">
        {(!data || data.length === 0) ? (
          <div className="h-full flex flex-col items-center justify-center gap-2 text-foreground/50">
            <Icon className="w-8 h-8 opacity-30" />
            <p className="text-sm font-bold">Sem dados ainda</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {type === 'bar' ? (
              <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                <XAxis type="number" fontSize={10} tick={{ fill: 'hsl(var(--foreground) / 0.6)', fontWeight: 800 }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" fontSize={11} tick={{ fill: 'hsl(var(--foreground) / 0.7)', fontWeight: 800 }} width={90} />
                <Bar dataKey={chartKey} fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} label={{ position: 'right', fill: 'hsl(var(--foreground))', fontSize: 11, fontWeight: 800 }} />
                <ChartTooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--primary) / 0.05)' }} />
              </BarChart>
            ) : (
              <PieChart>
                <Pie data={data} dataKey={chartKey} innerRadius="60%" outerRadius="85%" stroke="transparent">
                  {data.map((_: any, i: number) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <ChartTooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            )}
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
});

export const OccupationChart = React.memo(({ title, used, total, reserved = 0, blocked = 0, unit = 'alocações', id }: any) => {
  const percentage = total > 0 ? Math.round((used / total) * 100) : 0;
  const isEmpty = total === 0 || (used === 0 && reserved === 0 && blocked === 0);
  // Cores semafóricas via tokens semânticos
  const rawData = [
    { name: 'Ocupado', value: used, color: 'hsl(var(--primary))' },
    { name: 'Reservado', value: reserved, color: 'hsl(38 92% 50%)' },   // amber
    { name: 'Bloqueado', value: blocked, color: 'hsl(var(--destructive))' },
    { name: 'Livre', value: Math.max(0, total - used - reserved - blocked), color: 'hsl(var(--muted) / 0.3)' }
  ];
  // Oculta segmentos sempre-zero (mantém Ocupado e Livre)
  const data = rawData.filter(d => d.name === 'Ocupado' || d.name === 'Livre' || d.value > 0);

  return (
    <Card id={id} className="border border-border/10 bg-card/20 backdrop-blur-md overflow-hidden rounded-[2rem] transition-all duration-500 hover:border-primary/20 hover:shadow-xl">
      <CardHeader className="px-10 py-8 border-b border-border/10">
        <CardTitle className="text-xl font-extrabold flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <Package className="w-5 h-5" />
          </div>
          <span>{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-12 flex flex-col items-center gap-8">
        <div className="relative w-[240px] h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} innerRadius="68%" outerRadius="95%" dataKey="value" startAngle={90} endAngle={450} isAnimationActive>
                {data.map((entry, index) => <Cell key={index} fill={entry.color} />)}
              </Pie>
              <ChartTooltip content={<CustomTooltip suffix={` ${unit}`} />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            {isEmpty ? (
              <>
                <span className="text-2xl font-black text-foreground/40">Sem uso</span>
                <span className="text-[10px] font-black uppercase text-foreground/30 mt-1">setor inativo</span>
              </>
            ) : (
              <>
                <span className="text-4xl font-black text-foreground">{percentage}%</span>
                <span className="text-[10px] font-black uppercase text-foreground/50">Ocupado</span>
              </>
            )}
          </div>
        </div>
        <div className="w-full space-y-4">
           {data.map((d, i) => (
             <div key={i} className="flex items-center justify-between text-xs font-bold uppercase tracking-widest">
               <span className="flex items-center gap-2 text-muted-foreground">
                 <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                 {d.name}
               </span>
               <span className="text-foreground tabular-nums">{d.value} {unit}</span>
             </div>
           ))}
        </div>
      </CardContent>
    </Card>
  );
});


TimelineChart.displayName = 'TimelineChart';
SummaryChart.displayName = 'SummaryChart';
OccupationChart.displayName = 'OccupationChart';
