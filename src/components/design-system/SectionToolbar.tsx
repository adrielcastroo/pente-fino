import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export interface SectionToolbarProps {
  hint?: string;
  onRefresh: () => void;
  loading?: boolean;
  actions?: React.ReactNode;
  title?: string;
}

export function SectionToolbar({ hint, onRefresh, loading, actions, title }: SectionToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-wrap">
      <div className="flex items-center gap-3 flex-wrap">
        {title && <h4 className="text-sm font-semibold text-foreground">{title}</h4>}
        {hint && <p className="text-xs sm:text-sm text-muted-foreground">{hint}</p>}
      </div>
      <div className="flex items-center gap-2">
        {actions}
        <Button
          size="sm"
          variant="outline"
          onClick={onRefresh}
          disabled={loading}
          className="h-8 gap-1.5"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          Atualizar
        </Button>
      </div>
    </div>
  );
}