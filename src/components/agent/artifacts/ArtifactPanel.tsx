import { FileText, Table2, Braces, X, ExternalLink, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ArtifactSpec } from "@/lib/agent-blocks";
import { ArtifactRenderer } from "./ArtifactRenderer";

const ICON: Record<ArtifactSpec["type"], typeof Table2> = {
  table: Table2,
  markdown: FileText,
  json: Braces,
  dashboard: LayoutDashboard,
};

export function ArtifactChip({
  spec,
  active,
  onOpen,
}: {
  spec: ArtifactSpec;
  active?: boolean;
  onOpen: () => void;
}) {
  const Icon = ICON[spec.type];
  const summary = spec.type === "table" ? `${spec.rows.length} linhas` : "abrir painel";
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "mt-2 inline-flex w-full items-center gap-2 rounded-md border px-3 py-2 text-left text-xs transition",
        active
          ? "border-primary bg-primary/10 text-foreground"
          : "border-border bg-muted/40 text-foreground hover:border-primary/60 hover:bg-primary/5",
      )}
    >
      <Icon className="h-4 w-4 shrink-0 text-primary" />
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium">📎 {spec.title}</div>
        {spec.subtitle ? (
          <div className="truncate text-muted-foreground">{spec.subtitle}</div>
        ) : (
          <div className="truncate text-muted-foreground">{summary}</div>
        )}
      </div>
      <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
    </button>
  );
}

export function ArtifactPanel({
  spec,
  onClose,
}: {
  spec: ArtifactSpec;
  onClose: () => void;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <div className="flex items-start gap-2 border-b bg-card/50 px-3 py-2">
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold leading-tight">{spec.title}</div>
          {spec.subtitle && (
            <div className="truncate text-[11px] text-muted-foreground">{spec.subtitle}</div>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => {
              if (spec.type === "markdown") navigator.clipboard.writeText(spec.content);
              else if (spec.type === "json") navigator.clipboard.writeText(JSON.stringify(spec.data, null, 2));
              else if (spec.type === "table") {
                const csv = [
                  spec.columns.map(c => c.label).join(","),
                  ...spec.rows.map(r => spec.columns.map(c => String(r[c.key] ?? "")).join(","))
                ].join("\n");
                navigator.clipboard.writeText(csv);
              }
            }}
            title="Copiar conteúdo"
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Fechar painel">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden p-3">
        <ArtifactRenderer spec={spec} />
      </div>
    </div>
  );
}
