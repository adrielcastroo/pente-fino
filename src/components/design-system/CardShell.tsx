import * as React from "react";
import { cn } from "@/lib/utils";

interface CardShellProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  action?: React.ReactNode;
  subtitle?: string;
  variant?: "default" | "elevated" | "outlined";
}

const variantStyles = {
  default: "bg-card/60 border-border/40",
  elevated: "bg-card shadow-sm border-border/40",
  outlined: "bg-transparent border-border",
};

export const CardShell = React.forwardRef<HTMLDivElement, CardShellProps>(
  ({ className, title, icon, children, action, subtitle, variant = "default", ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-md border shadow-sm transition-colors",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      <div className="flex items-start justify-between gap-3 p-5 pb-0">
        <div>
          <h3 className="font-semibold mb-1 flex items-center gap-2 text-sm">
            {icon && <span className="text-primary">{icon}</span>}
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {action && <div className="shrink-0 mt-1">{action}</div>}
      </div>
      <div className="p-5 pt-0">{children}</div>
    </div>
  )
);

CardShell.displayName = "CardShell";