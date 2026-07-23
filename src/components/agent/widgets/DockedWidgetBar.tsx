import { CheckCircle2, ChevronDown, ChevronUp, HelpCircle, ListChecks, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useFloatingWidget } from "@/store/useFloatingWidget";
import { encodeWidgetSubmit } from "@/lib/agent-blocks";
import { FormWidget } from "./FormWidget";
import { ChoiceWidget } from "./ChoiceWidget";
import { ConfirmWidget } from "./ConfirmWidget";

/**
 * Docked widget bar: fixa logo acima do composer, empurrando o input para baixo.
 * Substitui o FloatingWidgetPanel por um painel acoplado (estilo barra de contexto).
 */
export function DockedWidgetBar({
  onSend,
  disabled,
}: {
  onSend: (text: string) => void;
  disabled?: boolean;
}) {
  const { widgets, activeId, minimized, close, toggleMinimize, markSubmitted } = useFloatingWidget();
  const spec = activeId ? widgets[activeId] : null;
  if (!spec) return null;

  const submit = (values: Record<string, unknown>) => {
    onSend(encodeWidgetSubmit({ widget_id: spec.id, intent: spec.onSubmitIntent, values }));
    markSubmitted(spec.id);
  };

  const Icon = spec.type === "form" ? HelpCircle : spec.type === "choice" ? ListChecks : CheckCircle2;

  return (
    <div
      role="dialog"
      aria-label={spec.title}
      className={cn(
        "border-t bg-card/95 backdrop-blur-sm shadow-lg animate-in slide-in-from-bottom-2",
        "max-h-[min(60vh,520px)] flex flex-col",
      )}
    >
      <div className="flex items-center gap-2 px-3 py-2 border-b bg-muted/30">
        <Icon className="h-3.5 w-3.5 shrink-0 text-primary" />
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          Formulário pendente
        </span>
        <div className="min-w-0 flex-1 text-xs font-medium truncate">{spec.title}</div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={toggleMinimize}
          aria-label={minimized ? "Expandir" : "Minimizar"}
          title={minimized ? "Expandir" : "Minimizar"}
        >
          {minimized ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </Button>
        <Button variant="ghost" size="icon-sm" onClick={close} aria-label="Fechar" title="Fechar">
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      {!minimized && (
        <div className="flex-1 min-h-0 overflow-auto p-3">
          {spec.description && (
            <p className="mb-2 text-xs text-muted-foreground">{spec.description}</p>
          )}
          {spec.type === "form" && <FormWidget spec={spec} disabled={disabled} onSubmit={submit} />}
          {spec.type === "choice" && <ChoiceWidget spec={spec} disabled={disabled} onSubmit={submit} />}
          {spec.type === "confirm" && <ConfirmWidget spec={spec} disabled={disabled} onSubmit={submit} />}
        </div>
      )}
    </div>
  );
}
