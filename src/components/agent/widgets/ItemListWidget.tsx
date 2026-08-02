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
          <div key={i} id={`w-row-${spec.id}-${i}`} className="rounded-md border border-border/70 bg-background/60 p-2">
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
                  idPrefix={`w-row-${spec.id}-${i}`}
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
    <div className={"space-y-1 " + (type === "textarea" || type === "switch" ? "sm:col-span-2" : "")}>
      <div className="flex items-center justify-between">
        <Label htmlFor={id} className="text-[11px] font-medium">
          {field.label} {field.required && <span className="text-destructive">*</span>}
        </Label>
        {type === "switch" && (
          <input
            id={id}
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            checked={!!value}
            onChange={(e) => onChange(e.target.checked)}
          />
        )}
      </div>

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
      ) : type === "switch" ? (
        value && <StockDisplay field={field} rowId={idPrefix} />
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

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

function StockDisplay({ field, rowId }: { field: WidgetField; rowId: string }) {
  // O rowId contém o índice da linha no formato `w-transf_xxxx-0`
  // Precisamos acessar os valores do formulário para pegar cdItem e cdDepositoOrigem.
  // Como estamos dentro do Cell, a forma mais fácil é passar esses valores via props ou usar um hack de DOM.
  // Mas o Cell só recebe o value do switch. Vamos usar um seletor DOM para pegar os valores irmãos.
  
  const [data, setData] = useState<{ item: string; dep: string } | null>(null);

  useEffect(() => {
    const parent = document.getElementById(rowId)?.parentElement;
    if (!parent) return;
    
    const update = () => {
      const itemInput = parent.querySelector(`[id*="-cdItem"]`) as HTMLInputElement;
      const depSelect = parent.querySelector(`[id*="-cdDepositoOrigem"] button`) as HTMLButtonElement;
      
      const item = itemInput?.value || "";
      const depLabel = depSelect?.innerText || "";
      const depMatch = depLabel.match(/^(\d+)/);
      const dep = depMatch ? depMatch[1] : "";
      
      if (item && dep) {
        setData({ item, dep });
      }
    };

    const interval = setInterval(update, 1000);
    update();
    return () => clearInterval(interval);
  }, [rowId]);

  const { data: stock, isLoading } = useQuery({
    queryKey: ["auge-stock-live", data?.item, data?.dep],
    queryFn: async () => {
      if (!data?.item || !data?.dep) return null;
      const { data: res, error } = await supabase.functions.invoke("auge-sync", {
        body: { action: "lotes_live", cdItem: data.item, cdDeposito: data.dep }
      });
      if (error) throw error;
      const total = (res.data || []).reduce((acc: number, curr: any) => acc + Number(curr.quantidade || 0), 0);
      return total;
    },
    enabled: !!data?.item && !!data?.dep
  });

  if (!data?.item || !data?.dep) return <div className="text-[10px] text-muted-foreground italic">Preencha item e origem...</div>;
  if (isLoading) return <div className="text-[10px] animate-pulse">Consultando Auge...</div>;

  return (
    <div className="flex items-center gap-2 rounded bg-primary/5 px-2 py-1 border border-primary/10">
      <span className="text-[10px] font-bold text-primary">Saldo:</span>
      <span className="text-[11px] font-mono font-medium">
        {stock !== undefined ? new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(stock) : "0,00"}
      </span>
    </div>
  );
}

import { useEffect } from "react";
