import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export type AskField = {
  name: string;
  label: string;
  type?: "text" | "textarea" | "number" | "date";
  placeholder?: string;
  required?: boolean;
};

export type AskUserSpec = {
  title: string;
  description?: string;
  fields: AskField[];
  submitLabel?: string;
};

const OPEN_TAG = "[[ASK_USER]]";
const CLOSE_TAG = "[[/ASK_USER]]";

export function extractAskUser(text: string): { spec: AskUserSpec | null; cleaned: string } {
  const i = text.indexOf(OPEN_TAG);
  if (i === -1) return { spec: null, cleaned: text };
  const j = text.indexOf(CLOSE_TAG, i + OPEN_TAG.length);
  if (j === -1) return { spec: null, cleaned: text };
  const raw = text.slice(i + OPEN_TAG.length, j).trim();
  try {
    const parsed = JSON.parse(raw) as AskUserSpec;
    if (!parsed?.fields?.length || !parsed?.title) return { spec: null, cleaned: text };
    const cleaned = (text.slice(0, i) + text.slice(j + CLOSE_TAG.length)).trim();
    return { spec: parsed, cleaned };
  } catch {
    return { spec: null, cleaned: text };
  }
}

export function AskUserInline({
  spec,
  onSubmit,
  disabled,
}: {
  spec: AskUserSpec;
  onSubmit: (formatted: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(true);
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(spec.fields.map((f) => [f.name, ""])),
  );
  const [submitted, setSubmitted] = useState(false);

  const canSubmit = useMemo(
    () => spec.fields.every((f) => (f.required ? (values[f.name] ?? "").trim().length > 0 : true)),
    [spec.fields, values],
  );

  useEffect(() => {
    if (submitted) setOpen(false);
  }, [submitted]);

  const handleSubmit = () => {
    if (!canSubmit || submitted) return;
    const lines = spec.fields
      .map((f) => `- **${f.label}:** ${(values[f.name] ?? "").trim() || "—"}`)
      .join("\n");
    const formatted = `${spec.title}\n${lines}`;
    setSubmitted(true);
    onSubmit(formatted);
  };

  if (submitted) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{spec.title}</DialogTitle>
          {spec.description && <DialogDescription>{spec.description}</DialogDescription>}
        </DialogHeader>
        <div className="space-y-3 py-1">
          {spec.fields.map((f) => (
            <div key={f.name} className="space-y-1.5">
              <Label htmlFor={`ask-${f.name}`} className="text-xs font-medium">
                {f.label} {f.required && <span className="text-destructive">*</span>}
              </Label>
              {f.type === "textarea" ? (
                <Textarea
                  id={`ask-${f.name}`}
                  placeholder={f.placeholder}
                  value={values[f.name] ?? ""}
                  onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
                  rows={3}
                />
              ) : (
                <Input
                  id={`ask-${f.name}`}
                  type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"}
                  placeholder={f.placeholder}
                  value={values[f.name] ?? ""}
                  onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
                />
              )}
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={disabled}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit || disabled}>
            {spec.submitLabel ?? "Enviar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
