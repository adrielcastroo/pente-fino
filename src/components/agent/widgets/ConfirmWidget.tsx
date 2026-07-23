import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { WidgetSpec } from "@/lib/agent-blocks";

export function ConfirmWidget({
  spec,
  disabled,
  onSubmit,
}: {
  spec: Extract<WidgetSpec, { type: "confirm" }>;
  disabled?: boolean;
  onSubmit: (values: { confirmed: boolean }) => void;
}) {
  const [submitted, setSubmitted] = useState(false);
  if (submitted) return null;
  return (
    <div className="space-y-3">
      {spec.summary && (
        <div className="rounded-md border border-border bg-muted/40 p-2.5 text-xs text-foreground whitespace-pre-wrap">
          {spec.summary}
        </div>
      )}
      <div className="flex justify-end gap-2">
        <Button
          size="sm"
          variant="ghost"
          disabled={disabled}
          onClick={() => {
            setSubmitted(true);
            onSubmit({ confirmed: false });
          }}
        >
          {spec.cancelLabel ?? "Cancelar"}
        </Button>
        <Button
          size="sm"
          disabled={disabled}
          onClick={() => {
            setSubmitted(true);
            onSubmit({ confirmed: true });
          }}
        >
          {spec.confirmLabel ?? "Confirmar"}
        </Button>
      </div>
    </div>
  );
}
