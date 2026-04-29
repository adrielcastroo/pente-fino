import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { BarChart3, TrendingUp, X } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as ChartTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

// Premium Color Palette
const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--primary) / 0.8)',
  'hsl(var(--primary) / 0.6)',
  'hsl(var(--primary) / 0.4)',
  'hsl(var(--primary) / 0.2)',
];

export const DetailDialog = ({ detailChart, onClose }: { detailChart: any, onClose: () => void }) => (
  <Dialog open={!!detailChart} onOpenChange={onClose}>
    <DialogContent className="max-w-4xl rounded-[2.5rem] border border-border/10 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] p-0 overflow-hidden bg-background/80 backdrop-blur-2xl animate-in zoom-in-95 duration-300">
      <DialogHeader className="p-8 pb-6 border-b border-border/10 bg-muted/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-primary/10 text-primary shadow-xl shadow-primary/10 border border-primary/20">
              {detailChart?.type === 'bar' ? <BarChart3 className="w-6 h-6" /> : <TrendingUp className="w-6 h-6" />}
            </div>
            <div className="space-y-1">
              <DialogTitle className="text-2xl font-black tracking-tight text-foreground/90">{detailChart?.title}</DialogTitle>
              <DialogDescription className="text-sm font-medium text-muted-foreground opacity-70">
                Visualização detalhada das métricas operacionais
              </DialogDescription>
            </div>
          </div>
        </div>
      </DialogHeader>
      
      <div className="p-10 h-[500px]">
        {detailChart && (
          <ResponsiveContainer width="100%" height="100%">
            {detailChart.type === 'bar' ? (
              <BarChart data={detailChart.data} margin={{ bottom: 80, top: 10 }}>
                <defs>
                  <linearGradient id="detailBarGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={1} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="name" 
                  angle={-45} 
                  textAnchor="end" 
                  interval={0} 
                  fontSize={10} 
                  axisLine={false} 
                  tickLine={false} 
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fontWeight: 600 }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  fontSize={10} 
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fontWeight: 600 }}
                />
                <ChartTooltip 
                  cursor={{ fill: 'hsl(var(--primary) / 0.05)' }} 
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: '1px solid hsl(var(--border) / 0.5)', 
                    background: 'hsl(var(--card) / 0.9)', 
                    backdropFilter: 'blur(10px)',
                    fontWeight: 'bold',
                    boxShadow: '0 15px 30px -10px rgba(0,0,0,0.1)'
                  }} 
                  formatter={(val: any) => [val, 'Quantidade']} 
                />
                <Bar 
                  dataKey={detailChart.data?.[0]?.count !== undefined ? 'count' : 'value'} 
                  fill="url(#detailBarGradient)" 
                  radius={[8, 8, 2, 2]} 
                  maxBarSize={64}
                  animationDuration={1500}
                />
              </BarChart>
            ) : (
              <PieChart>
                <Pie 
                  data={detailChart.data} 
                  dataKey="value" 
                  nameKey="name" 
                  outerRadius={160} 
                  innerRadius={90} 
                  label={({ name, percent }: any) => `${name} (${(percent * 100).toFixed(0)}%)`} 
                  paddingAngle={3} 
                  stroke="hsl(var(--border))" 
                  strokeWidth={1}
                  animationDuration={1500}
                >
                  {detailChart.data.map((_: any, i: number) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} className="hover:opacity-80 transition-opacity" />)}
                </Pie>
                <ChartTooltip 
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: '1px solid hsl(var(--border) / 0.5)', 
                    background: 'hsl(var(--card) / 0.9)', 
                    backdropFilter: 'blur(10px)',
                    fontWeight: 'bold',
                    boxShadow: '0 15px 30px -10px rgba(0,0,0,0.1)'
                  }} 
                  formatter={(val: any) => [val, 'Quantidade']} 
                />
                <Legend 
                  iconType="circle" 
                  wrapperStyle={{ paddingTop: '32px', fontWeight: 'bold', fontSize: '12px' }} 
                />
              </PieChart>
            )}
          </ResponsiveContainer>
        )}
      </div>
      
      <div className="p-6 border-t border-border/10 bg-muted/5 flex justify-end">
        <Button 
          variant="outline" 
          className="rounded-xl font-bold text-sm px-8 h-12 hover:bg-primary hover:text-white hover:border-primary transition-all active:scale-[0.97]" 
          onClick={onClose}
        >
          Fechar Visualização
        </Button>
      </div>
    </DialogContent>
  </Dialog>
);
