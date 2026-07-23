import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, HelpCircle, ListChecks, Minus, Square, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useFloatingWidget } from "@/store/useFloatingWidget";
import { encodeWidgetSubmit } from "@/lib/agent-blocks";
import { FormWidget } from "./FormWidget";
import { ChoiceWidget } from "./ChoiceWidget";
import { ConfirmWidget } from "./ConfirmWidget";

const MIN_W = 340;
const MIN_H = 260;

type DragState =
  | { kind: "move"; startX: number; startY: number; origX: number; origY: number }
  | { kind: "resize"; startX: number; startY: number; origW: number; origH: number }
  | null;

export function FloatingWidgetPanel({
  onSend,
  disabled,
}: {
  onSend: (text: string) => void;
  disabled?: boolean;
}) {
  const { widgets, activeId, pos, size, minimized, close, setPos, setSize, toggleMinimize, markSubmitted } =
    useFloatingWidget();
  const [drag, setDrag] = useState<DragState>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const spec = activeId ? widgets[activeId] : null;

  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      if (!drag) return;
      if (drag.kind === "move") {
        const dx = e.clientX - drag.startX;
        const dy = e.clientY - drag.startY;
        const maxX = window.innerWidth - 80;
        const maxY = window.innerHeight - 60;
        setPos({
          x: Math.min(maxX, Math.max(8 - size.w + 80, drag.origX + dx)),
          y: Math.min(maxY, Math.max(8, drag.origY + dy)),
        });
      } else {
        const dx = e.clientX - drag.startX;
        const dy = e.clientY - drag.startY;
        setSize({
          w: Math.min(window.innerWidth - pos.x - 8, Math.max(MIN_W, drag.origW + dx)),
          h: Math.min(window.innerHeight - pos.y - 8, Math.max(MIN_H, drag.origH + dy)),
        });
      }
    },
    [drag, pos.x, pos.y, size.w, setPos, setSize],
  );

  const stopDrag = useCallback(() => setDrag(null), []);

  useEffect(() => {
    if (!drag) return;
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", stopDrag);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", stopDrag);
    };
  }, [drag, onPointerMove, stopDrag]);

  if (!spec) return null;

  const submit = (values: Record<string, unknown>) => {
    onSend(encodeWidgetSubmit({ widget_id: spec.id, intent: spec.onSubmitIntent, values }));
    markSubmitted(spec.id);
  };

  const Icon = spec.type === "form" ? HelpCircle : spec.type === "choice" ? ListChecks : CheckCircle2;

  const isMobile = typeof window !== "undefined" && window.innerWidth < 640;

  const style: React.CSSProperties = isMobile
    ? { left: 8, right: 8, bottom: 8, top: "auto", width: "auto", height: minimized ? 44 : "70vh" }
    : { left: pos.x, top: pos.y, width: size.w, height: minimized ? 44 : size.h };

  const panel = (
    <div
      ref={panelRef}
      className={cn(
        "fixed z-[70] flex flex-col overflow-hidden rounded-xl border bg-background shadow-2xl ring-1 ring-black/5",
        "backdrop-blur supports-[backdrop-filter]:bg-background/95",
      )}
      style={style}
      role="dialog"
      aria-label={spec.title}
    >
      {/* Header (drag handle) */}
      <div
        onPointerDown={(e) => {
          if (isMobile) return;
          (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
          setDrag({
            kind: "move",
            startX: e.clientX,
            startY: e.clientY,
            origX: pos.x,
            origY: pos.y,
          });
        }}
        className={cn(
          "flex items-center gap-2 border-b bg-card/60 px-3 py-2 select-none",
          !isMobile && "cursor-grab active:cursor-grabbing",
        )}
      >
        <Icon className="h-4 w-4 shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold leading-tight">{spec.title}</div>
          {spec.description && !minimized && (
            <div className="truncate text-[11px] text-muted-foreground">{spec.description}</div>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={toggleMinimize}
          aria-label={minimized ? "Restaurar" : "Minimizar"}
          title={minimized ? "Restaurar" : "Minimizar"}
        >
          {minimized ? <Square className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
        </Button>
        <Button variant="ghost" size="icon-sm" onClick={close} aria-label="Fechar" title="Fechar">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Body */}
      {!minimized && (
        <div className="flex-1 min-h-0 overflow-auto p-4">
          {spec.type === "form" && <FormWidget spec={spec} disabled={disabled} onSubmit={submit} />}
          {spec.type === "choice" && <ChoiceWidget spec={spec} disabled={disabled} onSubmit={submit} />}
          {spec.type === "confirm" && <ConfirmWidget spec={spec} disabled={disabled} onSubmit={submit} />}
        </div>
      )}

      {/* Resize handle */}
      {!isMobile && !minimized && (
        <div
          onPointerDown={(e) => {
            (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
            setDrag({
              kind: "resize",
              startX: e.clientX,
              startY: e.clientY,
              origW: size.w,
              origH: size.h,
            });
          }}
          className="absolute bottom-0 right-0 h-4 w-4 cursor-nwse-resize"
          aria-hidden
        >
          <div className="absolute bottom-1 right-1 h-2 w-2 border-b-2 border-r-2 border-muted-foreground/50" />
        </div>
      )}
    </div>
  );

  return createPortal(panel, document.body);
}
