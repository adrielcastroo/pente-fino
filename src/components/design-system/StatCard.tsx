import * as React from "react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  variant?: "default" | "primary" | "success" | "warning" | "error";
  trend?: {
    value: string;
    isPositive?: boolean;
  };
}

const variantStyles = {
  default: "border-border/40",
  primary: "border-primary/30 bg-primary/5",
  success: "border-emerald-500/30 bg-emerald-500/5",
  warning: "border-amber-500/30 bg-amber-500/5",
  error: "border-destructive/30 bg-destructive/5",
};

export const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  ({ className, icon, label, value, variant = "default", trend, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-md border shadow-sm bg-card/60 p-3 transition-colors",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-xl font-semibold tabular-nums mt-1">{value}</div>
      {trend && (
        <div
          className={cn(
            "text-xs mt-1 flex items-center gap-1",
            trend.isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"
          )}
        >
          {trend.isPositive ? "↑" : "↓"} {trend.value}
        </div>
      )}
    </div>
  )
);

StatCard.displayName = "StatCard";