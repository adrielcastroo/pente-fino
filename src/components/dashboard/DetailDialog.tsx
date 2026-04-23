import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { BarChart3, TrendingUp } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as ChartTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--primary) / 0.8)',
  'hsl(var(--primary) / 0.6)',
  'hsl(var(--primary) / 0.4)',
  'hsl(var(--primary) / 0.2)',
];

function SummaryStatCard({ label, value, percent, color, bg, border }: { label: string; value: string | number; percent?: number; color: string; bg: string; border: string }) {
  return (
    <div className={`p-4 text-center space-y-1 rounded-xl border ${border} ${bg} transition-all duration-200`}>
      <div className={`text-xl sm:text-2xl font-black tabular-nums ${color}`}>{value}</div>
      <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.15em]">{label}</div>
      {percent !== undefined && (
        <div className="text-[10px] font-semibold text-muted-foreground/70">{percent}%</div>
      )}
    </div>
  );
}

export const DetailDialog = ({ detailChart, onClose }: { detailChart: any, onClose: () => void }) => {
  const totalValue = detailChart?.data?.reduce((acc: number, item: any) => acc + (item.value || item.count || 0), 0) || 0;
  const topItems = detailChart?.data?.slice(0, 3) || [];

  return (
    <Dialog open={!!detailChart} onOpenChange={onClose}>

    <DialogContent className="max-w-3xl rounded-2xl border border-border/30 shadow-2xl shadow-primary/10 p-0 overflow-hidden bg-background/95 backdrop-blur-xl">
      <DialogHeader className="p-6 pb-3 border-b border-border/20">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary shadow-lg shadow-primary/20">
            {detailChart?.type === 'bar' ? <BarChart3 className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />}
          </div>
          <DialogTitle className="text-xl font-black tracking-tight">{detailChart?.title}</DialogTitle>
        </div>
      </DialogHeader>
      <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-muted/5 border-b border-border/10">
        <SummaryStatCard label="Total Geral" value={totalValue} color="text-foreground" bg="bg-card" border="border-border/30" />
        {topItems.map((item: any, i: number) => (
          <SummaryStatCard 
            key={item.name}
            label={item.name} 
            value={item.value || item.count} 
            percent={totalValue ? Math.round(((item.value || item.count) / totalValue) * 100) : 0} 
            color={i === 0 ? 'text-primary' : i === 1 ? 'text-emerald-500' : 'text-amber-500'} 
            bg={i === 0 ? 'bg-primary/5' : i === 1 ? 'bg-emerald-500/5' : i === 2 ? 'bg-amber-500/5' : 'bg-card'} 
            border={i === 0 ? 'border-primary/20' : i === 1 ? 'border-emerald-500/20' : i === 2 ? 'border-amber-500/20' : 'border-border/30'} 
          />
        ))}
      </div>
      <div className="p-6 h-[350px]">
        {detailChart && (
          <ResponsiveContainer width="100%" height="100%">
            {detailChart.type === 'bar' ? (
              <BarChart data={detailChart.data} margin={{ bottom: 60, top: 10 }}>
                <defs>
                  <linearGradient id="detailBarGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={1} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} fontSize={10} axisLine={false} tickLine={false} stroke="hsl(var(--muted-foreground))" />
                <YAxis axisLine={false} tickLine={false} fontSize={10} stroke="hsl(var(--muted-foreground))" />
                <ChartTooltip cursor={{ fill: 'hsl(var(--primary) / 0.05)' }} contentStyle={{ borderRadius: '10px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))', fontWeight: 'bold' }} formatter={(val: any) => [val, 'Quantidade']} />
                <Bar dataKey={detailChart.data?.[0]?.count !== undefined ? 'count' : 'value'} fill="url(#detailBarGradient)" radius={[6, 6, 2, 2]} maxBarSize={48} />
              </BarChart>
            ) : (
              <PieChart>
                <Pie data={detailChart.data} dataKey="value" nameKey="name" outerRadius={130} innerRadius={75} label={({ name, percent }: any) => `${name} (${(percent * 100).toFixed(0)}%)`} paddingAngle={3} stroke="hsl(var(--border))" strokeWidth={1}>
                  {detailChart.data.map((_: any, i: number) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <ChartTooltip contentStyle={{ borderRadius: '10px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))', fontWeight: 'bold' }} formatter={(val: any) => [val, 'Quantidade']} />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '16px', fontWeight: 'bold' }} />
              </PieChart>
            )}
          </ResponsiveContainer>
        )}
      </div>
      <div className="p-4 border-t border-border/20 flex justify-end">
        <Button variant="outline" className="rounded-lg font-bold text-sm" onClick={onClose}>Fechar</Button>
      </div>
    </DialogContent>
  </Dialog>
);
}