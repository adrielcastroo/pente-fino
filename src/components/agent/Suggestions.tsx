import { ArrowRight, Sparkles } from "lucide-react";

// Tolerant to markdown/code-fence/whitespace/casing around the tags.
const SUGGESTIONS_RE =
  /(?:`{1,3}|\*{1,2}|_{1,2})?\s*\[\[\s*SUGGESTIONS\s*\]\]\s*(?:`{1,3})?\s*([\s\S]*?)\s*(?:`{1,3})?\s*\[\[\s*\/\s*SUGGESTIONS\s*\]\]\s*(?:`{1,3}|\*{1,2}|_{1,2})?/i;

export function extractSuggestions(text: string): { items: string[]; cleaned: string } {
  const match = SUGGESTIONS_RE.exec(text);
  if (!match) return { items: [], cleaned: text };
  const raw = match[1].trim().replace(/^`+|`+$/g, "").trim();
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return { items: [], cleaned: text };
    const items = parsed
      .filter((x): x is string => typeof x === "string")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && s.length <= 120)
      .slice(0, 4);
    const cleaned = (text.slice(0, match.index) + text.slice(match.index + match[0].length))
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    return { items, cleaned };
  } catch {
    // Fallback: strip the tags so we don't leak raw markup to the user,
    // even if the JSON was malformed.
    const cleaned = (text.slice(0, match.index) + text.slice(match.index + match[0].length)).trim();
    return { items: [], cleaned };
  }
}

export function Suggestions({
  items,
  disabled,
  onPick,
}: {
  items: string[];
  disabled?: boolean;
  onPick: (text: string) => void;
}) {
  if (!items.length) return null;
  return (
    <div className="mt-3 space-y-1.5">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        <Sparkles className="h-3 w-3 text-primary" />
        Próximos passos
      </div>
      <div className="flex flex-wrap gap-1.5">
        {items.map((s, i) => (
          <button
            key={i}
            type="button"
            disabled={disabled}
            onClick={() => onPick(s)}
            className="group inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-medium text-foreground shadow-sm transition hover:-translate-y-0.5 hover:border-primary hover:bg-primary/10 hover:shadow disabled:pointer-events-none disabled:opacity-50"
          >
            <span className="max-w-[240px] truncate text-left">{s}</span>
            <ArrowRight className="h-3 w-3 text-primary opacity-70 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
          </button>
        ))}
      </div>
    </div>
  );
}
