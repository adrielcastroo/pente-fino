import { useState } from "react";
import { ChevronRight } from "lucide-react";
import type { WidgetSpec } from "@/lib/agent-blocks";

export function ChoiceWidget({
  spec,
  disabled,
  onSubmit,
}: {
  spec: Extract<WidgetSpec, { type: "choice" }>;
  disabled?: boolean;
  onSubmit: (values: { choice: string; label: string }) => void;
}) {
  const [submitted, setSubmitted] = useState(false);
  if (submitted) return null;
  return (
    <div className="space-y-1.5">
      {spec.options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          disabled={disabled}
          onClick={() => {
            setSubmitted(true);
            onSubmit({ choice: opt.value, label: opt.label });
          }}
          className="group flex w-full items-start justify-between gap-3 rounded-md border border-border bg-background p-2.5 text-left transition hover:border-primary/60 hover:bg-primary/5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium leading-tight">{opt.label}</div>
            {opt.description && (
              <div className="mt-0.5 text-xs text-muted-foreground">{opt.description}</div>
            )}
          </div>
          <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
        </button>
      ))}
    </div>
  );
}
