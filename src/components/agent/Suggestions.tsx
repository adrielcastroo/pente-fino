import { Sparkles } from "lucide-react";

const OPEN_TAG = "[[SUGGESTIONS]]";
const CLOSE_TAG = "[[/SUGGESTIONS]]";

export function extractSuggestions(text: string): { items: string[]; cleaned: string } {
  const i = text.indexOf(OPEN_TAG);
  if (i === -1) return { items: [], cleaned: text };
  const j = text.indexOf(CLOSE_TAG, i + OPEN_TAG.length);
  if (j === -1) return { items: [], cleaned: text };
  const raw = text.slice(i + OPEN_TAG.length, j).trim();
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return { items: [], cleaned: text };
    const items = parsed
      .filter((x): x is string => typeof x === "string")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && s.length <= 120)
      .slice(0, 4);
    const cleaned = (text.slice(0, i) + text.slice(j + CLOSE_TAG.length)).trim();
    return { items, cleaned };
  } catch {
    return { items: [], cleaned: text };
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
    <div className="mt-2 flex flex-wrap gap-1.5">
      {items.map((s, i) => (
        <button
          key={i}
          type="button"
          disabled={disabled}
          onClick={() => onPick(s)}
          className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs text-foreground transition hover:bg-primary/10 hover:border-primary/60 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Sparkles className="h-3 w-3 text-primary" />
          <span className="max-w-[240px] truncate text-left">{s}</span>
        </button>
      ))}
    </div>
  );
}
