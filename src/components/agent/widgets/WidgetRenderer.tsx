import { Card } from "@/components/ui/card";
import { CheckCircle2, HelpCircle, ListChecks } from "lucide-react";
import { encodeWidgetSubmit, type WidgetSpec } from "@/lib/agent-blocks";
import { FormWidget } from "./FormWidget";
import { ChoiceWidget } from "./ChoiceWidget";
import { ConfirmWidget } from "./ConfirmWidget";

export function WidgetRenderer({
  spec,
  disabled,
  onSend,
}: {
  spec: WidgetSpec;
  disabled?: boolean;
  onSend: (text: string) => void;
}) {
  const submit = (values: Record<string, unknown>) => {
    onSend(encodeWidgetSubmit({ widget_id: spec.id, intent: spec.onSubmitIntent, values }));
  };

  const Icon = spec.type === "form" ? HelpCircle : spec.type === "choice" ? ListChecks : CheckCircle2;

  return (
    <Card className="mt-2 border-primary/40 bg-primary/[0.03] p-3 shadow-sm">
      <div className="mb-2 flex items-start gap-2">
        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold leading-tight">{spec.title}</div>
          {spec.description && (
            <div className="mt-0.5 text-xs text-muted-foreground">{spec.description}</div>
          )}
        </div>
      </div>

      {spec.type === "form" && <FormWidget spec={spec} disabled={disabled} onSubmit={submit} />}
      {spec.type === "choice" && <ChoiceWidget spec={spec} disabled={disabled} onSubmit={submit} />}
      {spec.type === "confirm" && <ConfirmWidget spec={spec} disabled={disabled} onSubmit={submit} />}
    </Card>
  );
}
