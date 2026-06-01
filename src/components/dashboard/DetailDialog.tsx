import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { BarChart3, TrendingUp, Activity } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAppStore } from '@/store/useAppStore';

import { cn } from '@/lib/utils';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as ChartTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area, CartesianGrid
} from 'recharts';

// Premium Color Palette - Jewel Tones synced with DashboardCharts
const CHART_COLORS = [
  '#2563EB', // Blue 600 (Pente Fino Blue)
  '#0D9488', // Teal 600
  '#7C3AED', // Violet 600
  '#D97706', // Amber 600
  '#DC2626', // Red 600
  '#2563EB', // Blue 600
];

export const DetailDialog = ({ detailChart, onClose }: { detailChart: { title: string, data: any[], type: 'pie' | 'bar' | 'area' } | null, onClose: () => void }) => {
  const isMobile = useIsMobile();
  const theme = useAppStore(s => s.dashboardDialogTheme);
  const { theme: systemTheme } = useTheme();
  
  // Se o tema for 'system', usamos o tema do sistema, caso contrário usamos o tema fixo ('light' ou 'dark')
  const isDark = theme === 'dark' || (theme === 'system' && systemTheme === 'dark');
  
  const axisStroke = isDark ? 'rgba(255,255,255,0.4)' : 'hsl(var(--foreground) / 0.4)';
  const tooltipBg = isDark ? '#1E293B' : 'hsl(var(--card) / 0.9)';
  const tooltipBorder = isDark ? '#334155' : 'hsl(var(--border) / 0.5)';
  const gridStroke = isDark ? 'rgba(255,255,255,0.1)' : 'hsl(var(--border) / 0.3)';
  const pieStroke = isDark ? '#0F172A' : 'hsl(var(--background))';
  
  return (
    <Dialog open={!!detailChart} onOpenChange={onClose}>
      <DialogContent className={cn(
        "w-[95vw] max-w-5xl h-[90vh] sm:h-[85vh] rounded-[1.5rem] sm:rounded-[2.5rem] border shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] p-0 overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col",
        isDark ? "bg-[#0F172A] border-slate-800" : "bg-white border-border/10 text-[#2563EB]"
      )}>
      <DialogHeader className={cn(
        "p-6 sm:p-8 pb-4 sm:pb-6 border-b flex-none",
        isDark ? "bg-[#1E293B]/50 border-slate-800" : "bg-slate-50/50 border-border/10"
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-primary/10 text-primary shadow-xl shadow-primary/10 border border-primary/20">
              {detailChart?.type === 'bar' ? <BarChart3 className="w-6 h-6" /> : detailChart?.type === 'area' ? <Activity className="w-6 h-6" /> : <TrendingUp className="w-6 h-6" />}
            </div>
            <div className="space-y-1">
              <DialogTitle className={cn("text-2xl font-black tracking-tight", isDark ? "text-slate-100" : "text-[#2563EB]")}>{detailChart?.title}</DialogTitle>
              <DialogDescription className={cn("text-sm font-bold", isDark ? "text-slate-400" : "text-[#2563EB]/60")}>
                Visualização detalhada das métricas operacionais
              </DialogDescription>
            </div>
          </div>
          
        </div>
      </DialogHeader>
      
      <div className="flex-1 relative w-full overflow-hidden" key={detailChart?.title}>
        {detailChart && (
          <div className="absolute inset-0 p-4 sm:p-10">
            <ResponsiveContainer width="100%" height="100%" debounce={50}>
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
                  stroke={axisStroke}
                  tick={{ fontWeight: 800 }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  fontSize={11} 
                  stroke={axisStroke}
                  tick={{ fontWeight: 800 }}
                  dx={-5}
                />
                <ChartTooltip 
                  cursor={{ fill: 'hsl(var(--primary) / 0.05)' }} 
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: `1px solid ${tooltipBorder}`, 
                    background: tooltipBg, 


                    backdropFilter: 'blur(10px)',
                    fontWeight: 'bold',
                    boxShadow: '0 15px 30px -10px rgba(0,0,0,0.1)'
                  }} 
                  formatter={(val: any) => [val, 'Quantidade']} 
                />
                <Bar 
                  dataKey="value" 
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
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
                <XAxis 
                  dataKey="name" 
                  fontSize={11} 
                  axisLine={false} 
                  tickLine={false} 
                  stroke={axisStroke}
                  tick={{ fontWeight: 800 }}
                  dy={15}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  fontSize={11} 
                  stroke={axisStroke}
                  tick={{ fontWeight: 800 }}
                  dx={-5}
                />
                <ChartTooltip 
                  cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1.5, strokeDasharray: '4 4' }} 
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: `1px solid ${tooltipBorder}`, 
                    background: tooltipBg, 


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
              <PieChart margin={{ top: 20, right: isMobile ? 20 : 80, left: isMobile ? 20 : 80, bottom: 60 }}>
                <Pie 
                  data={detailChart.data} 
                  dataKey="value" 
                  nameKey="name" 
                  cx="50%"
                  cy="45%"
                  outerRadius={isMobile ? "70%" : "80%"} 
                  innerRadius={isMobile ? "40%" : "48%"} 
                  label={({ name, percent }: any) => {
                    if (percent < (isMobile ? 0.08 : 0.05)) return null; 
                    const displayName = name.length > 12 ? `${name.substring(0, 10)}...` : name;
                    return isMobile ? `${(percent * 100).toFixed(0)}%` : `${displayName} (${(percent * 100).toFixed(0)}%)`;
                  }}


                  paddingAngle={4} 
                  stroke={pieStroke} 
                  strokeWidth={2}
                  animationDuration={1500}
                >
                  {detailChart.data.map((_: any, i: number) => (
                    <Cell 
                      key={i} 
                      fill={CHART_COLORS[i % CHART_COLORS.length]} 
                      className="hover:opacity-80 transition-opacity cursor-pointer" 
                    />
                  ))}
                </Pie>
                <ChartTooltip 
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: `1px solid ${tooltipBorder}`, 
                    background: tooltipBg, 


                    backdropFilter: 'blur(10px)',
                    fontWeight: 'bold',
                    boxShadow: '0 15px 30px -10px rgba(0,0,0,0.1)'
                  }} 
                  formatter={(val: any) => [val, 'Quantidade']} 
                />
                <Legend 
                  iconType="circle" 
                  verticalAlign="bottom"
                  align="center"
                  wrapperStyle={{ 
                    paddingTop: isMobile ? '10px' : '20px', 
                    fontWeight: 'bold', 
                    fontSize: isMobile ? '10px' : '11px',
                    width: '100%',
                    left: 0,
                    bottom: 0
                  }} 
                />

              </PieChart>
            )}
          </ResponsiveContainer>
        </div>
      )}
    </div>
      
      <div className={cn(
        "p-4 sm:p-6 border-t flex justify-end flex-none",
        isDark ? "bg-slate-900/50 border-slate-800" : "bg-muted/5 border-border/10"
      )}>
        <Button 
          variant="outline" 
          className={cn(
            "rounded-xl font-bold text-sm px-8 h-12 hover:bg-primary hover:text-white hover:border-primary transition-all active:scale-[0.97]",
            isDark ? "border-slate-700 text-slate-300 hover:border-primary" : "border-[#2563EB]/20 text-[#2563EB] hover:border-[#2563EB]"
          )} 
          onClick={onClose}
        >
          Fechar Visualização
        </Button>
      </div>
      </DialogContent>
    </Dialog>
  );
};
