import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { WidgetField, WidgetSpec } from "@/lib/agent-blocks";

type FormValues = Record<string, string | number | boolean | string[]>;

export function FormWidget({
  spec,
  disabled,
  onSubmit,
}: {
  spec: Extract<WidgetSpec, { type: "form" }>;
  disabled?: boolean;
  onSubmit: (values: FormValues) => void;
}) {
  const [values, setValues] = useState<FormValues>(() => {
    const init: FormValues = {};
    for (const f of spec.fields) {
      if (f.default !== undefined) init[f.name] = f.default;
      else if (f.type === "switch") init[f.name] = false;
      else if (f.type === "multiselect") init[f.name] = [];
      else init[f.name] = "";
    }
    return init;
  });
  const [submitted, setSubmitted] = useState(false);

  const canSubmit = useMemo(() => {
    return spec.fields.every((f) => {
      if (!f.required) return true;
      const v = values[f.name];
      if (Array.isArray(v)) return v.length > 0;
      if (typeof v === "string") return v.trim().length > 0;
      return v !== undefined && v !== null;
    });
  }, [spec.fields, values]);

  const setValue = (name: string, v: FormValues[string]) => setValues((prev) => ({ ...prev, [name]: v }));

  if (submitted) return null;

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!canSubmit || disabled) return;
        setSubmitted(true);
        onSubmit(values);
      }}
    >
      {spec.fields.map((f) => (
        <FieldRow key={f.name} field={f} value={values[f.name]} onChange={(v) => setValue(f.name, v)} />
      ))}
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={!canSubmit || disabled}>
          {spec.submitLabel ?? "Enviar"}
        </Button>
      </div>
    </form>
  );
}

function FieldRow({
  field,
  value,
  onChange,
}: {
  field: WidgetField;
  value: FormValues[string];
  onChange: (v: FormValues[string]) => void;
}) {
  const id = `w-${field.name}`;
  const type = field.type ?? "text";

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-medium">
        {field.label} {field.required && <span className="text-destructive">*</span>}
      </Label>

      {type === "textarea" && (
        <Textarea
          id={id}
          rows={3}
          placeholder={field.placeholder}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      )}

      {(type === "text" || type === "number" || type === "date") && (
        <Input
          id={id}
          type={type === "number" ? "number" : type === "date" ? "date" : "text"}
          placeholder={field.placeholder}
          min={field.min}
          max={field.max}
          step={field.step}
          value={(value as string | number | undefined)?.toString() ?? ""}
          onChange={(e) => onChange(type === "number" ? e.target.valueAsNumber || "" : e.target.value)}
        />
      )}

      {type === "select" && (
        <Select value={(value as string) ?? ""} onValueChange={(v) => onChange(v)}>
          <SelectTrigger id={id}>
            <SelectValue placeholder={field.placeholder ?? "Selecionar…"} />
          </SelectTrigger>
          <SelectContent>
            {(field.options ?? []).map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {type === "multiselect" && (
        <div className="flex flex-wrap gap-1.5">
          {(field.options ?? []).map((opt) => {
            const arr = Array.isArray(value) ? value : [];
            const active = arr.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() =>
                  onChange(active ? arr.filter((x) => x !== opt.value) : [...arr, opt.value])
                }
                className={
                  "rounded-full border px-3 py-1 text-xs transition " +
                  (active
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border bg-transparent text-muted-foreground hover:bg-accent")
                }
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}

      {type === "switch" && (
        <div className="flex items-center gap-2">
          <Switch id={id} checked={Boolean(value)} onCheckedChange={(v) => onChange(v)} />
          {field.placeholder && <span className="text-xs text-muted-foreground">{field.placeholder}</span>}
        </div>
      )}

      {type === "radio" && (
        <RadioGroup value={(value as string) ?? ""} onValueChange={(v) => onChange(v)} className="gap-2">
          {(field.options ?? []).map((opt) => (
            <div key={opt.value} className="flex items-start gap-2">
              <RadioGroupItem id={`${id}-${opt.value}`} value={opt.value} />
              <Label htmlFor={`${id}-${opt.value}`} className="cursor-pointer text-xs font-normal">
                {opt.label}
                {opt.hint && <span className="ml-1 text-muted-foreground">— {opt.hint}</span>}
              </Label>
            </div>
          ))}
        </RadioGroup>
      )}
    </div>
  );
}
