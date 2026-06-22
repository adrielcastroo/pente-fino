import { useMemo, useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Scale, AlertTriangle, CheckCircle2, Package, FileWarning, RotateCcw } from 'lucide-react';
import { cn, formatQty } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { Conference, Registro } from '@/types';

interface NfPhysicalCompareDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  conference: Conference | null;
  conferenteName?: string;
}

interface NfGroup {
  nf: string;
  totalQty: number;
  unit: string;
  registroCount: number;
  items: {
    item: string;
    qty: number;
    unit: string;
    occurrences: number;
    duplicate: boolean;
  }[];
}

const expectedKey = (confId: string, nf: string) => `nf-expected:${confId}:${nf}`;

function buildGroups(registros: Registro[]): NfGroup[] {
  const map = new Map<string, NfGroup>();
  registros.forEach(r => {
    const nf = (r.nf || '').trim() || 'Sem NF';
    const unit = r.modoOrigem === 'madeira' ? 'm' : 'un';
    const qty = r.quantidade ?? r.mLinear ?? r.m2 ?? 0;
    const itemKey = r.item || r.processo || 'Item sem identificação';

    let g = map.get(nf);
    if (!g) {
      g = { nf, totalQty: 0, unit, registroCount: 0, items: [] };
      map.set(nf, g);
    }
    g.totalQty += qty;
    g.registroCount += 1;

    const existing = g.items.find(it => it.item === itemKey);
    if (existing) {
      existing.qty += qty;
      existing.occurrences += 1;
      existing.duplicate = true;
    } else {
      g.items.push({ item: itemKey, qty, unit, occurrences: 1, duplicate: false });
    }
  });
  return Array.from(map.values()).sort((a, b) => b.totalQty - a.totalQty);
}

export function NfPhysicalCompareDialog({ open, onOpenChange, conference, conferenteName }: NfPhysicalCompareDialogProps) {
  const [expected, setExpected] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const groups = useMemo(() => conference ? buildGroups(conference.registros) : [], [conference]);

  // Load persisted expected values per NF
  useEffect(() => {
    if (!conference) return;
    const next: Record<string, string> = {};
    groups.forEach(g => {
      try {
        const v = localStorage.getItem(expectedKey(conference.id, g.nf));
        if (v != null) next[g.nf] = v;
      } catch { /* ignore */ }
    });
    setExpected(next);
  }, [conference, groups]);

  const handleExpectedChange = (nf: string, value: string) => {
    const sanitized = value.replace(',', '.').replace(/[^\d.]/g, '');
    setExpected(prev => ({ ...prev, [nf]: sanitized }));
    if (conference) {
      try { localStorage.setItem(expectedKey(conference.id, nf), sanitized); } catch { /* ignore */ }
    }
  };

  const totals = useMemo(() => {
    let bipado = 0, esperado = 0, divergentNfs = 0, missingExpected = 0, duplicateItems = 0;
    groups.forEach(g => {
      bipado += g.totalQty;
      const exp = parseFloat(expected[g.nf] || '');
      if (Number.isFinite(exp)) {
        esperado += exp;
        if (Math.abs(exp - g.totalQty) > 0.001) divergentNfs += 1;
      } else {
        missingExpected += 1;
      }
      duplicateItems += g.items.filter(it => it.duplicate).length;
    });
    return { bipado, esperado, divergentNfs, missingExpected, duplicateItems };
  }, [groups, expected]);

  const approveWithDivergence = async () => {
    if (!conference) return;
    setSubmitting(true);
    try {
      const summary = groups.map(g => {
        const exp = parseFloat(expected[g.nf] || '');
        return `${g.nf}: bipado=${formatQty(g.totalQty)} ${g.unit}, esperado=${Number.isFinite(exp) ? formatQty(exp) : '—'}`;
      }).join(' | ');

      const { error } = await supabase.from('operation_logs').insert({
        conferente_name: conferenteName || conference.conferente || 'desconhecido',
        type: 'nf_compare_divergence_approved',
        description: `Conferência ${conference.processo || conference.name} aprovada com divergência. ${summary}`,
        quantity: totals.divergentNfs,
        item_id: conference.id,
      });

      if (error) throw error;
      toast.success('Aprovação com divergência registrada no log de operações.');
      onOpenChange(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro desconhecido';
      toast.error(`Falha ao registrar aprovação: ${msg}`);
    } finally {
      setSubmitting(false);
    }
  };

  const resetExpected = () => {
    if (!conference) return;
    groups.forEach(g => {
      try { localStorage.removeItem(expectedKey(conference.id, g.nf)); } catch { /* ignore */ }
    });
    setExpected({});
    toast.info('Valores esperados limpos.');
  };

  if (!conference) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-4xl md:max-w-3xl lg:max-w-4xl p-0 gap-0 overflow-hidden rounded-md h-[92dvh] md:h-[88dvh] lg:h-[85dvh] flex flex-col">
        <DialogHeader className="px-6 sm:px-8 pt-6 pb-4 border-b border-border/10 flex-none">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-md bg-primary/10 text-primary border border-primary/20">
              <Scale className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-xl sm:text-2xl font-semibold tracking-tight truncate">
                NF × Físico — {conference.processo || conference.name}
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm font-bold text-muted-foreground mt-0.5">
                Conferente: {conference.conferente || '—'} · {groups.length} NF(s) · {conference.registros.length} registros
              </DialogDescription>
            </div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
            <div className="rounded-md bg-muted/40 border border-border/30 p-3">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Bipado</div>
              <div className="text-lg font-semibold tabular-nums">{formatQty(totals.bipado)}</div>
            </div>
            <div className="rounded-md bg-muted/40 border border-border/30 p-3">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Esperado</div>
              <div className="text-lg font-semibold tabular-nums">{totals.esperado > 0 ? formatQty(totals.esperado) : '—'}</div>
            </div>
            <div className={cn(
              "rounded-md border p-3",
              totals.divergentNfs > 0 ? "bg-destructive/10 border-destructive/30" : "bg-emerald-500/10 border-emerald-500/30"
            )}>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">NFs divergentes</div>
              <div className={cn(
                "text-lg font-semibold tabular-nums",
                totals.divergentNfs > 0 ? "text-destructive" : "text-emerald-600"
              )}>
                {totals.divergentNfs}
              </div>
            </div>
            <div className={cn(
              "rounded-md border p-3",
              totals.duplicateItems > 0 ? "bg-amber-500/10 border-amber-500/30" : "bg-muted/40 border-border/30"
            )}>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Itens repetidos</div>
              <div className={cn(
                "text-lg font-semibold tabular-nums",
                totals.duplicateItems > 0 ? "text-amber-600" : ""
              )}>
                {totals.duplicateItems}
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Groups */}
        <div className="overflow-y-auto flex-1 custom-scrollbar px-4 sm:px-8 py-4 space-y-3">
          {groups.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Package className="w-12 h-12 opacity-40 mb-3" />
              <p className="font-bold">Nenhum registro nesta conferência.</p>
            </div>
          )}

          {groups.map(g => {
            const exp = parseFloat(expected[g.nf] || '');
            const hasExp = Number.isFinite(exp);
            const diff = hasExp ? g.totalQty - exp : 0;
            const isDivergent = hasExp && Math.abs(diff) > 0.001;

            return (
              <div
                key={g.nf}
                className={cn(
                  "rounded-md border bg-card/60 backdrop-blur-sm transition-all",
                  isDivergent ? "border-destructive/40 shadow-[0_0_0_1px_hsl(var(--destructive)/0.2)]" : "border-border/30",
                )}
              >
                <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-border/20">
                  <div className="flex items-center gap-3 min-w-0">
                    <Badge variant="outline" className="font-semibold text-xs px-3 py-1 rounded-full">{g.nf}</Badge>
                    <div className="text-xs font-bold text-muted-foreground">
                      {g.registroCount} registros · {g.items.length} itens
                    </div>
                    {g.items.some(it => it.duplicate) && (
                      <Badge variant="outline" className="text-[10px] font-semibold bg-amber-500/10 text-amber-700 border-amber-500/30">
                        <FileWarning className="w-3 h-3 mr-1" /> repetidos
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="text-right">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Bipado</div>
                      <div className="font-semibold tabular-nums text-primary">{formatQty(g.totalQty)} {g.unit}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Esperado</label>
                      <Input
                        inputMode="decimal"
                        placeholder="0"
                        value={expected[g.nf] ?? ''}
                        onChange={(e) => handleExpectedChange(g.nf, e.target.value)}
                        className="h-9 w-24 text-right font-semibold tabular-nums"
                      />
                    </div>
                    {hasExp && (
                      <div className={cn(
                        "min-w-[80px] text-right font-semibold tabular-nums px-3 py-1.5 rounded-lg",
                        isDivergent ? "bg-destructive/15 text-destructive" : "bg-emerald-500/15 text-emerald-600"
                      )}>
                        {isDivergent ? (
                          <span className="inline-flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            {diff > 0 ? '+' : ''}{formatQty(diff)}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> OK
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="px-4 py-2 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
                  {g.items.map(it => (
                    <div
                      key={it.item}
                      className={cn(
                        "flex items-center justify-between gap-2 py-1.5 text-sm border-b border-border/10 last:border-b-0",
                        it.duplicate && "text-amber-700"
                      )}
                    >
                      <span className="font-bold truncate">
                        {it.item}
                        {it.occurrences > 1 && (
                          <span className="ml-2 text-[10px] font-semibold uppercase text-amber-600">×{it.occurrences}</span>
                        )}
                      </span>
                      <span className="font-semibold tabular-nums shrink-0">
                        {formatQty(it.qty)} {it.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="px-6 sm:px-8 py-4 border-t border-border/10 flex flex-wrap items-center justify-between gap-3 flex-none bg-muted/20">
          <Button variant="ghost" size="sm" onClick={resetExpected} className="text-xs font-bold">
            <RotateCcw className="w-3.5 h-3.5 mr-2" />
            Limpar esperados
          </Button>
          <div className="flex items-center gap-2 ml-auto">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-md font-bold">
              Fechar
            </Button>
            <Button
              onClick={approveWithDivergence}
              disabled={submitting || totals.divergentNfs === 0}
              className="rounded-md font-semibold bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              title={totals.divergentNfs === 0 ? 'Sem divergência para registrar' : 'Registra a aprovação no log'}
            >
              {submitting ? 'Registrando…' : 'Aprovar com divergência'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
