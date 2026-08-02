import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Copy } from "lucide-react";
import type { WidgetField, WidgetSpec } from "@/lib/agent-blocks";

type Row = Record<string, unknown>;
type Spec = Extract<WidgetSpec, { type: "itemlist" }>;

function blankRow(fields: WidgetField[]): Row {
  const r: Row = {};
  for (const f of fields) r[f.name] = f.default ?? "";
  return r;
}

/**
 * Lista dinâmica de itens: permite adicionar/duplicar/remover linhas
 * antes de enviar tudo de uma vez (ex.: transferência multi-item/lote).
 */
export function ItemListWidget({
  spec,
  disabled,
  onSubmit,
}: {
  spec: Spec;
  disabled?: boolean;
  onSubmit: (values: Record<string, unknown>) => void;
}) {
  const minRows = Math.max(1, spec.minRows ?? 1);
  const maxRows = spec.maxRows ?? 20;

  const [rows, setRows] = useState<Row[]>(() => {
    const initial = (spec.rows ?? []).map((r) => ({ ...blankRow(spec.itemFields), ...r }));
    while (initial.length < minRows) initial.push(blankRow(spec.itemFields));
    return initial;
  });
  const [shared, setShared] = useState<Row>(() => blankRow(spec.sharedFields ?? []));
  const [submitted, setSubmitted] = useState(false);

  const setCell = (i: number, name: string, v: unknown) =>
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, [name]: v } : r)));

  const canSubmit = useMemo(() => {
    if (!rows.length) return false;
    return rows.every((r) =>
      spec.itemFields.every((f) => {
        if (!f.required) return true;
        const v = r[f.name];
        return typeof v === "string" ? v.trim().length > 0 : v !== undefined && v !== null && v !== "";
      }),
    );
  }, [rows, spec.itemFields]);

  if (submitted) return null;

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!canSubmit || disabled) return;
        setSubmitted(true);
        onSubmit({ ...shared, itens: rows });
      }}
    >
      <div className="space-y-2">
        {rows.map((row, i) => (
          <div key={i} className="rounded-md border border-border/70 bg-background/60 p-2">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Item {i + 1}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  aria-label="Duplicar item"
                  disabled={rows.length >= maxRows}
                  onClick={() => setRows((prev) => [...prev.slice(0, i + 1), { ...row }, ...prev.slice(i + 1)])}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-destructive"
                  aria-label="Remover item"
                  disabled={rows.length <= minRows}
                  onClick={() => setRows((prev) => prev.filter((_, idx) => idx !== i))}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {spec.itemFields.map((f) => (
                <Cell
                  key={f.name}
                  field={f}
                  idPrefix={`w-${spec.id}-${i}`}
                  value={row[f.name]}
                  onChange={(v) => setCell(i, f.name, v)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <Button
        type="button"
        size="sm"
        variant="outline"
        className="w-full"
        disabled={rows.length >= maxRows}
        onClick={() => setRows((prev) => [...prev, blankRow(spec.itemFields)])}
      >
        <Plus className="mr-1.5 h-3.5 w-3.5" />
        {spec.addLabel ?? "Adicionar item"}
      </Button>

      {(spec.sharedFields ?? []).map((f) => (
        <Cell
          key={f.name}
          field={f}
          idPrefix={`w-${spec.id}-shared`}
          value={shared[f.name]}
          onChange={(v) => setShared((prev) => ({ ...prev, [f.name]: v }))}
        />
      ))}

      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={!canSubmit || disabled}>
          {spec.submitLabel ?? "Enviar"}
        </Button>
      </div>
    </form>
  );
}

function Cell({
  field,
  value,
  idPrefix,
  onChange,
}: {
  field: WidgetField;
  value: unknown;
  idPrefix: string;
  onChange: (v: unknown) => void;
}) {
  const id = `${idPrefix}-${field.name}`;
  const type = field.type ?? "text";
  const str = value === undefined || value === null ? "" : String(value);

  return (
    <div className={"space-y-1 " + (type === "textarea" ? "sm:col-span-2" : "")}>
      <Label htmlFor={id} className="text-[11px] font-medium">
        {field.label} {field.required && <span className="text-destructive">*</span>}
      </Label>

      {type === "textarea" ? (
        <Textarea id={id} rows={2} placeholder={field.placeholder} value={str} onChange={(e) => onChange(e.target.value)} />
      ) : type === "select" ? (
        <Select value={str} onValueChange={onChange}>
          <SelectTrigger id={id} className="h-9">
            <SelectValue placeholder={field.placeholder ?? "Selecionar…"} />
          </SelectTrigger>
          <SelectContent>
            {(field.options ?? []).map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Input
          id={id}
          className="h-9"
          type={type === "number" ? "number" : type === "date" ? "date" : "text"}
          placeholder={field.placeholder}
          min={field.min}
          max={field.max}
          step={field.step}
          value={str}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}
