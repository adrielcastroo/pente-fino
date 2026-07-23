import { CheckCircle2, HelpCircle, ListChecks, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WidgetSpec } from "@/lib/agent-blocks";
import { useFloatingWidget } from "@/store/useFloatingWidget";

export function WidgetChip({ spec }: { spec: WidgetSpec }) {
  const { activeId, submittedIds, open } = useFloatingWidget();
  const Icon = spec.type === "form" ? HelpCircle : spec.type === "choice" ? ListChecks : CheckCircle2;
  const isActive = activeId === spec.id;
  const submitted = !!submittedIds[spec.id];
  const kindLabel =
    spec.type === "form" ? "Formulário" : spec.type === "choice" ? "Escolha" : "Confirmação";

  return (
    <button
      type="button"
      onClick={() => open(spec.id)}
      className={cn(
        "group mt-2 flex w-full items-center gap-3 rounded-lg border bg-card/60 px-3 py-2.5 text-left shadow-sm transition-all",
        "hover:border-primary/60 hover:bg-primary/[0.04]",
        isActive && "border-primary/70 bg-primary/[0.06] ring-1 ring-primary/30",
        submitted && "opacity-70",
      )}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            {kindLabel}
          </span>
          {submitted && (
            <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
              ✓ enviado
            </span>
          )}
        </span>
        <span className="block truncate text-sm font-medium leading-tight">{spec.title}</span>
        {spec.description && (
          <span className="block truncate text-xs text-muted-foreground">{spec.description}</span>
        )}
      </span>
      <Maximize2 className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  );
}
