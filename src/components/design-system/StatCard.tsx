import * as React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  icon: LucideIcon | React.ReactNode;
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
  success: "border-success/30 bg-success/5",
  warning: "border-warning/30 bg-warning/5",
  error: "border-destructive/30 bg-destructive/5",
};

export const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  ({ className, icon: Icon, label, value, variant = "default", trend, ...props }, ref) => {
    const isLucideIcon = typeof Icon === "function";

    return (
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
          {Icon && typeof Icon === 'function' ? <Icon className="h-3.5 w-3.5" /> : Icon && React.isValidElement(Icon) ? Icon : null}
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
    );
  }
);

StatCard.displayName = "StatCard";