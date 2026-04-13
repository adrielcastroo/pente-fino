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

export const DetailDialog = ({ detailChart, onClose }: { detailChart: any, onClose: () => void }) => (
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
      <div className="p-6 h-[400px]">
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
                <ChartTooltip contentStyle={{ borderRadius: '10px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))', fontWeight: 'bold' }} formatter={(val: any) => [val, 'Quantidade']} />
                <Bar dataKey="count" fill="url(#detailBarGradient)" radius={[6, 6, 2, 2]} barSize={28} />
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