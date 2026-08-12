import { useMemo, lazy, Suspense } from "react";
import { cn } from "@/lib/utils";
import type { ArtifactSpec, DashboardKpi, DashboardChart } from "@/lib/agent-blocks";

// Lazy load Rechargs to avoid early initialization errors
const Bar = lazy(() => import("recharts").then(m => ({ default: m.Bar })));
const BarChart = lazy(() => import("recharts").then(m => ({ default: m.BarChart })));
const CartesianGrid = lazy(() => import("recharts").then(m => ({ default: m.CartesianGrid })));
const Cell = lazy(() => import("recharts").then(m => ({ default: m.Cell })));
const Legend = lazy(() => import("recharts").then(m => ({ default: m.Legend })));
const Line = lazy(() => import("recharts").then(m => ({ default: m.Line })));
const LineChart = lazy(() => import("recharts").then(m => ({ default: m.LineChart })));
const Pie = lazy(() => import("recharts").then(m => ({ default: m.Pie })));
const PieChart = lazy(() => import("recharts").then(m => ({ default: m.PieChart })));
const Area = lazy(() => import("recharts").then(m => ({ default: m.Area })));
const AreaChart = lazy(() => import("recharts").then(m => ({ default: m.AreaChart })));
const ResponsiveContainer = lazy(() => import("recharts").then(m => ({ default: m.ResponsiveContainer })));
const Tooltip = lazy(() => import("recharts").then(m => ({ default: m.Tooltip })));
const XAxis = lazy(() => import("recharts").then(m => ({ default: m.XAxis })));
const YAxis = lazy(() => import("recharts").then(m => ({ default: m.YAxis })));

const DEFAULT_PALETTE = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2, 173 58% 39%))",
  "hsl(var(--chart-3, 197 37% 44%))",
  "hsl(var(--chart-4, 43 74% 66%))",
  "hsl(var(--chart-5, 27 87% 67%))",
  "hsl(var(--muted-foreground))",
];

function fmt(v: unknown) {
  if (typeof v === "number") {
    if (Number.isInteger(v) && Math.abs(v) < 1000) return String(v);
    return new Intl.NumberFormat("pt-BR", {
      maximumFractionDigits: 2,
      minimumFractionDigits: Number.isInteger(v) ? 0 : 2,
    }).format(v);
  }
  return v == null ? "-" : String(v);
}

function KpiCard({ kpi }: { kpi: DashboardKpi }) {
  const toneClass =
    kpi.tone === "positive"
      ? "text-emerald-500"
      : kpi.tone === "negative"
        ? "text-destructive"
        : kpi.tone === "warning"
          ? "text-amber-500"
          : "text-foreground";
  const deltaSign = typeof kpi.delta === "number" ? (kpi.delta > 0 ? "+" : "") : "";
  return (
    <div className="rounded-lg border bg-card p-3 shadow-sm">
      <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {kpi.label}
      </div>
      <div className={cn("mt-1 text-2xl font-semibold tabular-nums leading-tight", toneClass)}>
        {fmt(kpi.value)}
      </div>
      <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
        {typeof kpi.delta === "number" && (
          <span
            className={cn(
              "tabular-nums",
              kpi.delta > 0 ? "text-emerald-500" : kpi.delta < 0 ? "text-destructive" : "",
            )}
          >
            {deltaSign}
            {fmt(kpi.delta)}%
          </span>
        )}
        {kpi.hint && <span className="truncate">{kpi.hint}</span>}
      </div>
    </div>
  );
}

function ChartBlock({ chart }: { chart: DashboardChart }) {
  const height = chart.height ?? 240;
  const xKey = chart.xKey ?? "name";
  const series = useMemo(
    () =>
      chart.series.map((s, i) => ({
        ...s,
        color: s.color ?? DEFAULT_PALETTE[i % DEFAULT_PALETTE.length],
      })),
    [chart.series],
  );

  return (
    <div className="rounded-lg border bg-card p-3 shadow-sm">
      {chart.title && (
        <div className="mb-2 text-xs font-semibold text-foreground">{chart.title}</div>
      )}
      <div style={{ width: "100%", height }}>
        <Suspense fallback={<div className="w-full h-full animate-pulse bg-muted rounded" />}>
        <ResponsiveContainer>
          {chart.type === "bar" ? (
            <BarChart data={chart.data} margin={{ top: 4, right: 8, left: -8, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey={xKey} tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {series.map((s) => (
                <Bar key={s.key} dataKey={s.key} name={s.label ?? s.key} fill={s.color} />
              ))}
            </BarChart>
          ) : chart.type === "line" ? (
            <LineChart data={chart.data} margin={{ top: 4, right: 8, left: -8, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey={xKey} tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {series.map((s) => (
                <Line
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  name={s.label ?? s.key}
                  stroke={s.color}
                  strokeWidth={2}
                  dot={false}
                />
              ))}
            </LineChart>
          ) : chart.type === "area" ? (
            <AreaChart data={chart.data} margin={{ top: 4, right: 8, left: -8, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey={xKey} tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {series.map((s) => (
                <Area
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  name={s.label ?? s.key}
                  stroke={s.color}
                  fill={s.color}
                  fillOpacity={0.25}
                />
              ))}
            </AreaChart>
          ) : (
            <PieChart>
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Pie
                data={chart.data}
                dataKey={series[0]?.key ?? "value"}
                nameKey={xKey}
                outerRadius={Math.min(height / 2 - 20, 100)}
                label={{ fontSize: 10 }}
              >
                {chart.data.map((_, i) => (
                  <Cell key={i} fill={DEFAULT_PALETTE[i % DEFAULT_PALETTE.length]} />
                ))}
              </Pie>
            </PieChart>
          )}
        </ResponsiveContainer>
        </Suspense>
      </div>
    </div>
  );
}

export function DashboardArtifact({
  spec,
}: {
  spec: Extract<ArtifactSpec, { type: "dashboard" }>;
}) {
  const kpis = spec.kpis ?? [];
  const charts = spec.charts ?? [];
  return (
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-auto pr-1">
      {kpis.length > 0 && (
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-4">
          {kpis.map((k, i) => (
            <KpiCard key={i} kpi={k} />
          ))}
        </div>
      )}
      {charts.map((c, i) => (
        <ChartBlock key={i} chart={c} />
      ))}
      {kpis.length === 0 && charts.length === 0 && (
        <div className="text-xs text-muted-foreground">Dashboard vazio.</div>
      )}
    </div>
  );
}
