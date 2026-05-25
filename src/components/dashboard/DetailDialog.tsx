import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { BarChart3, TrendingUp, X, Activity } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as ChartTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area, CartesianGrid
} from 'recharts';

// Premium Color Palette
const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--primary) / 0.8)',
  'hsl(var(--primary) / 0.6)',
  'hsl(var(--primary) / 0.4)',
  'hsl(var(--primary) / 0.2)',
];

export const DetailDialog = ({ detailChart, onClose }: { detailChart: { title: string, data: any[], type: 'pie' | 'bar' | 'area' } | null, onClose: () => void }) => (
  <Dialog open={!!detailChart} onOpenChange={onClose}>
    <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] rounded-[1.5rem] sm:rounded-[2.5rem] border border-border/10 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] p-0 overflow-hidden bg-white animate-in zoom-in-95 duration-300 flex flex-col">
      <DialogHeader className="p-8 pb-6 border-b border-border/10 bg-slate-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-primary/10 text-primary shadow-xl shadow-primary/10 border border-primary/20">
              {detailChart?.type === 'bar' ? <BarChart3 className="w-6 h-6" /> : detailChart?.type === 'area' ? <Activity className="w-6 h-6" /> : <TrendingUp className="w-6 h-6" />}
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
      
      <div className="px-4 sm:px-10 py-6 sm:py-10 h-[500px] sm:h-[600px] overflow-y-auto">
        {detailChart && (
          <ResponsiveContainer width="100%" height="100%">
            {detailChart.type === 'bar' ? (
              <BarChart data={detailChart.data} margin={{ bottom: 80, top: 10, left: 10, right: 10 }}>
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
                  fontSize={11} 
                  axisLine={false} 
                  tickLine={false} 
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fontWeight: 600 }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  fontSize={11} 
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fontWeight: 600 }}
                  dx={-5}
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
            ) : detailChart.type === 'area' ? (
              <AreaChart data={detailChart.data} margin={{ bottom: 40, top: 20, left: 10, right: 20 }}>
                <defs>
                  <linearGradient id="detailAreaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border) / 0.3)" />
                <XAxis 
                  dataKey="name" 
                  fontSize={11} 
                  axisLine={false} 
                  tickLine={false} 
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fontWeight: 600 }}
                  dy={15}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  fontSize={11} 
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fontWeight: 600 }}
                  dx={-5}
                />
                <ChartTooltip 
                  cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1.5, strokeDasharray: '4 4' }} 
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: '1px solid hsl(var(--border) / 0.5)', 
                    background: 'hsl(var(--card) / 0.9)', 
                    backdropFilter: 'blur(10px)',
                    fontWeight: 'bold',
                    boxShadow: '0 15px 30px -10px rgba(0,0,0,0.1)'
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="total" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#detailAreaGradient)" 
                  animationDuration={1500}
                  name="Registros"
                />
              </AreaChart>
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
