import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { BarChart3, TrendingUp, Activity } from '@/components/icons';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as ChartTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area, CartesianGrid,
} from 'recharts';

// Paleta alinhada ao design system (tokens HSL via CSS vars + variantes do chart)
const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2, var(--primary)))',
  'hsl(var(--chart-3, var(--accent)))',
  'hsl(var(--chart-4, var(--secondary)))',
  'hsl(var(--chart-5, var(--muted-foreground)))',
  'hsl(var(--destructive))',
];

type DetailChart = {
  title: string;
  data: any[];
  type: 'pie' | 'bar' | 'area';
} | null;

interface DetailDialogProps {
  detailChart: DetailChart;
  onClose: () => void;
}

const tooltipContentStyle: React.CSSProperties = {
  borderRadius: '12px',
  border: '1px solid hsl(var(--border))',
  background: 'hsl(var(--popover))',
  color: 'hsl(var(--popover-foreground))',
  fontWeight: 600,
  boxShadow: 'var(--shadow-lg, 0 10px 25px -10px hsl(var(--foreground) / 0.15))',
};

const axisTickStyle = { fontWeight: 600, fill: 'hsl(var(--muted-foreground))' } as const;
const axisStroke = 'hsl(var(--border))';
const gridStroke = 'hsl(var(--border) / 0.5)';

export const DetailDialog = ({ detailChart, onClose }: DetailDialogProps) => {
  const isMobile = useIsMobile();

  const Icon = detailChart?.type === 'bar' ? BarChart3
    : detailChart?.type === 'area' ? Activity
    : TrendingUp;

  return (
    <Dialog open={!!detailChart} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-5xl md:max-w-3xl lg:max-w-5xl h-[92dvh] md:h-[88dvh] lg:h-[85dvh] p-0 overflow-hidden flex flex-col gap-0">
        <DialogHeader className="px-6 py-4 border-b flex-none space-y-1">
          <DialogTitle className="flex items-center gap-2 text-base font-semibold tracking-tight text-foreground">
            <Icon className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <span className="truncate">{detailChart?.title}</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Detalhamento de métricas
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 relative w-full overflow-hidden bg-background" key={detailChart?.title}>
          {detailChart && (
            <div className="absolute inset-0 p-3 sm:p-6">
              <ResponsiveContainer width="100%" height="100%" debounce={50}>
                {detailChart.type === 'bar' ? (
                  <BarChart data={detailChart.data} margin={{ bottom: 80, top: 10, left: 10, right: 10 }}>
                    <defs>
                      <linearGradient id="detailBarGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={1} />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
                    <XAxis
                      dataKey="name"
                      angle={-45}
                      textAnchor="end"
                      interval={0}
                      fontSize={11}
                      axisLine={false}
                      tickLine={false}
                      stroke={axisStroke}
                      tick={axisTickStyle}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      fontSize={11}
                      stroke={axisStroke}
                      tick={axisTickStyle}
                      dx={-5}
                    />
                    <ChartTooltip
                      cursor={{ fill: 'hsl(var(--primary) / 0.08)' }}
                      contentStyle={tooltipContentStyle}
                      formatter={(val: any) => [val, 'Quantidade']}
                    />
                    <Bar
                      dataKey="value"
                      fill="url(#detailBarGradient)"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={64}
                      animationDuration={900}
                    />
                  </BarChart>
                ) : detailChart.type === 'area' ? (
                  <AreaChart data={detailChart.data} margin={{ bottom: 40, top: 20, left: 10, right: 20 }}>
                    <defs>
                      <linearGradient id="detailAreaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
                    <XAxis
                      dataKey="name"
                      fontSize={11}
                      axisLine={false}
                      tickLine={false}
                      stroke={axisStroke}
                      tick={axisTickStyle}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      fontSize={11}
                      stroke={axisStroke}
                      tick={axisTickStyle}
                      dx={-5}
                    />
                    <ChartTooltip
                      cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1.5, strokeDasharray: '4 4' }}
                      contentStyle={tooltipContentStyle}
                    />
                    <Area
                      type="monotone"
                      dataKey="total"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#detailAreaGradient)"
                      animationDuration={900}
                      name="Registros"
                    />
                  </AreaChart>
                ) : (
                  <PieChart margin={{ top: 20, right: isMobile ? 16 : 64, left: isMobile ? 16 : 64, bottom: 60 }}>
                    <Pie
                      data={detailChart.data}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="45%"
                      outerRadius={isMobile ? '70%' : '80%'}
                      innerRadius={isMobile ? '42%' : '50%'}
                      label={({ name, percent }: any) => {
                        if (percent < (isMobile ? 0.08 : 0.05)) return null;
                        const displayName = name.length > 12 ? `${name.substring(0, 10)}…` : name;
                        return isMobile ? `${(percent * 100).toFixed(0)}%` : `${displayName} (${(percent * 100).toFixed(0)}%)`;
                      }}
                      paddingAngle={3}
                      stroke="hsl(var(--background))"
                      strokeWidth={2}
                      animationDuration={900}
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
                      contentStyle={tooltipContentStyle}
                      formatter={(val: any) => [val, 'Quantidade']}
                    />
                    <Legend
                      iconType="circle"
                      verticalAlign="bottom"
                      align="center"
                      wrapperStyle={{
                        paddingTop: isMobile ? '8px' : '16px',
                        fontWeight: 600,
                        fontSize: isMobile ? '10px' : '11px',
                        color: 'hsl(var(--muted-foreground))',
                        width: '100%',
                        left: 0,
                        bottom: 0,
                      }}
                    />
                  </PieChart>
                )}
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-3 border-t flex-none sm:justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose} className="w-full sm:w-auto">
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
