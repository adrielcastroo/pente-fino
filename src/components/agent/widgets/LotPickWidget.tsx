import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import type { WidgetSpec } from "@/lib/agent-blocks";

type Spec = Extract<WidgetSpec, { type: "lotpick" }>;

const nf = (v: number) =>
  new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);

/** Seleção de lote/série: FIFO automático ou escolha manual com quantidades. */
export function LotPickWidget({
  spec,
  disabled,
  onSubmit,
}: {
  spec: Spec;
  disabled?: boolean;
  onSubmit: (values: Record<string, unknown>) => void;
}) {
  const [mode, setMode] = useState<"fifo" | "manual">(spec.defaultMode ?? "fifo");
  const [sel, setSel] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const alvo = Number(spec.qtd ?? 0);
  const total = useMemo(
    () => Object.values(sel).reduce((s, v) => s + (parseFloat(String(v).replace(",", ".")) || 0), 0),
    [sel],
  );

  const escolhidos = useMemo(
    () =>
      Object.entries(sel)
        .map(([lote, v]) => ({ lote, qtd: parseFloat(String(v).replace(",", ".")) || 0 }))
        .filter((r) => r.qtd > 0),
    [sel],
  );

  const canSubmit = mode === "fifo" || escolhidos.length > 0;

  if (submitted) return null;

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!canSubmit || disabled) return;
        setSubmitted(true);
        onSubmit({ modo: mode, lotes: mode === "fifo" ? [] : escolhidos });
      }}
    >
      <RadioGroup value={mode} onValueChange={(v) => setMode(v as "fifo" | "manual")} className="gap-2">
        <div className="flex items-start gap-2">
          <RadioGroupItem id={`${spec.id}-fifo`} value="fifo" />
          <Label htmlFor={`${spec.id}-fifo`} className="cursor-pointer text-xs font-normal">
            FIFO automático <span className="text-muted-foreground">— o Auge consome os lotes mais antigos</span>
          </Label>
        </div>
        <div className="flex items-start gap-2">
          <RadioGroupItem id={`${spec.id}-manual`} value="manual" />
          <Label htmlFor={`${spec.id}-manual`} className="cursor-pointer text-xs font-normal">
            Escolher manualmente
          </Label>
        </div>
      </RadioGroup>

      {mode === "manual" && (
        <div className="max-h-64 space-y-1.5 overflow-y-auto rounded-md border border-border/70 p-2">
          {spec.lotes.length === 0 && (
            <p className="py-2 text-center text-xs text-muted-foreground">Nenhum lote disponível no depósito de origem.</p>
          )}
          {spec.lotes.map((l) => (
            <div key={l.lote} className="flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-medium">{l.lote}</div>
                <div className="text-[11px] text-muted-foreground">
                  saldo {nf(Number(l.quantidade ?? 0))}
                  {l.selecionado ? ` · reservado ${nf(Number(l.selecionado))}` : ""}
                  {l.hint ? ` · ${l.hint}` : ""}
                </div>
              </div>
              <Input
                className="h-8 w-24"
                type="number"
                step="0.01"
                min={0}
                max={l.quantidade}
                placeholder="qtd"
                value={sel[l.lote] ?? ""}
                onChange={(e) => setSel((p) => ({ ...p, [l.lote]: e.target.value }))}
              />
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        {mode === "manual" && alvo > 0 ? (
          <Badge variant={Math.abs(total - alvo) < 0.005 ? "default" : "secondary"} className="text-[11px]">
            {nf(total)} / {nf(alvo)}
          </Badge>
        ) : (
          <span />
        )}
        <Button type="submit" size="sm" disabled={!canSubmit || disabled}>
          {spec.submitLabel ?? "Confirmar lotes"}
        </Button>
      </div>
    </form>
  );
}
