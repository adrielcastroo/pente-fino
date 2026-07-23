import { MessageResponse } from "@/components/ai-elements/message";
import type { ArtifactSpec } from "@/lib/agent-blocks";

export function MarkdownArtifact({ spec }: { spec: Extract<ArtifactSpec, { type: "markdown" }> }) {
  return (
    <div className="h-full overflow-auto">
      <MessageResponse>{spec.content}</MessageResponse>
    </div>
  );
}

export function JsonArtifact({ spec }: { spec: Extract<ArtifactSpec, { type: "json" }> }) {
  return (
    <pre className="h-full overflow-auto rounded-md border bg-muted/40 p-3 text-[11px] leading-relaxed">
      {JSON.stringify(spec.data, null, 2)}
    </pre>
  );
}
