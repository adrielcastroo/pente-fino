import type { ArtifactSpec } from "@/lib/agent-blocks";
import { TableArtifact } from "./TableArtifact";
import { JsonArtifact, MarkdownArtifact } from "./MarkdownArtifact";
import { DashboardArtifact } from "./DashboardArtifact";

export function ArtifactRenderer({ spec }: { spec: ArtifactSpec }) {
  if (spec.type === "table") return <TableArtifact spec={spec} />;
  if (spec.type === "markdown") return <MarkdownArtifact spec={spec} />;
  if (spec.type === "json") return <JsonArtifact spec={spec} />;
  if (spec.type === "dashboard") return <DashboardArtifact spec={spec} />;
  return null;
}
