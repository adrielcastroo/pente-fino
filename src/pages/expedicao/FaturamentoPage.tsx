import { useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  FileCheck,
  Loader2,
  Lock,
  Upload,
  Wallet,
  Clock,
  TrendingUp,
  Link2,
  Link2Off,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  usePickings,
  useFaturarPicking,
  useFaturarEmLote,
  useImportNFe,
  type Picking,
} from '@/hooks/expedicao/useExpedicaoData';
import { useAuth } from '@/hooks/use-auth';
import { parseNFeXML, autoVincularPicking, formatBRL } from '@/lib/nfe-parser';
import { StatCard } from '@/components/expedicao/ui/StatCard';
import { PickingTimeline } from '@/components/expedicao/PickingTimeline';
import { toast } from 'sonner';

export default function FaturamentoPage() {
  const { data, isLoading } = usePickings();
  const faturar = useFaturarPicking();
  const faturarLote = useFaturarEmLote();
  const importNFe = useImportNFe();
  const { can } = useAuth();
  const allowFaturar = can('expedicao:faturar');
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const fileRef = useRef<HTMLInputElement>(null);

  const fila = useMemo<Picking[]>(() => {
    const q = filter.trim().toLowerCase();
    return (data ?? [])
      .filter((p) => p.status === 'conferido')
      .filter(
        (p) =>
          !q ||
          p.numero.toLowerCase().includes(q) ||
          p.cliente.toLowerCase().includes(q),
      );
  }, [data, filter]);

  const faturados = useMemo(
    () => (data ?? []).filter((p) => p.status === 'faturado').slice(0, 20),
    [data],
  );

  // KPIs
  const today = new Date().toISOString().slice(0, 10);
  const faturadosHoje = useMemo(
    () =>
      (data ?? []).filter(
        (p) => p.status === 'faturado' && (p.faturado_at ?? '').startsWith(today),
      ),
    [data, today],
  );
  const valorHoje = faturadosHoje.reduce((s, p) => s + (p.nfe_valor ?? 0), 0);
  const valorFila = fila.reduce(
    (s, p) => s + (p.nfe_valor ?? p.valor_estimado ?? 0),
    0,
  );

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const toggleAll = () => {
    if (selected.size === fila.length) setSelected(new Set());
    else setSelected(new Set(fila.map((p) => p.id)));
  };

  const onPickFile = () => fileRef.current?.click();

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (files.length === 0) return;

    for (const file of files) {
      try {
        const text = await file.text();
        const nfe = parseNFeXML(text);
        const match = autoVincularPicking(nfe, data ?? []);
        await importNFe.mutateAsync({
          nfe,
          xmlRaw: text,
          pickingId: match?.id ?? null,
        });
        if (!match) {
          toast.info(`NF-e ${nfe.numero} importada sem vínculo automático.`);
        }
      } catch (err: any) {
        toast.error(`${file.name}: ${err?.message ?? 'erro ao processar XML'}`);
      }
    }
  };

  const allSelectedInFila = fila.length > 0 && selected.size === fila.length;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Faturamento</h1>
          <p className="text-sm text-muted-foreground">
            Fila de pickings liberados ·{' '}
            <span className="font-mono">{fila.length}</span> aguardando
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {allowFaturar && (
            <>
              <input
                ref={fileRef}
                type="file"
                accept=".xml,text/xml,application/xml"
                multiple
                className="sr-only"
                onChange={onFileChange}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={onPickFile}
                disabled={importNFe.isPending}
                className="h-10"
              >
                {importNFe.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Upload className="size-4" />
                )}
                Importar XML de NF-e
              </Button>
            </>
          )}
          <Input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filtrar por número ou cliente"
            className="h-10 w-full md:w-72"
          />
        </div>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="Aguardando"
          value={fila.length}
          icon={Clock}
          variant="warning"
        />
        <StatCard
          label="Valor na fila"
          value={formatBRL(valorFila)}
          icon={Wallet}
          variant="default"
        />
        <StatCard
          label="Faturados hoje"
          value={faturadosHoje.length}
          icon={CheckCircle2}
          variant="success"
        />
        <StatCard
          label="Valor faturado hoje"
          value={formatBRL(valorHoje)}
          icon={TrendingUp}
          variant="primary"
        />
      </section>

      <section className="rounded-lg border bg-card">
        <header className="flex items-center justify-between gap-2 border-b px-4 py-3 text-sm font-medium">
          <span className="inline-flex items-center gap-2">
            <FileCheck className="size-4" /> Aguardando faturamento
          </span>
          {allowFaturar && selected.size > 0 && (
            <Button
              size="sm"
              disabled={faturarLote.isPending}
              onClick={() => {
                faturarLote.mutate(Array.from(selected), {
                  onSuccess: () => setSelected(new Set()),
                });
              }}
              className="h-9"
            >
              {faturarLote.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <CheckCircle2 className="size-4" />
              )}
              Faturar {selected.size} selecionado{selected.size > 1 ? 's' : ''}
            </Button>
          )}
        </header>
        {isLoading ? (
          <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Carregando…
          </div>
        ) : fila.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">
            Nenhum picking na fila.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {allowFaturar && (
                  <TableHead className="w-10">
                    <Checkbox
                      checked={allSelectedInFila}
                      onCheckedChange={toggleAll}
                      aria-label="Selecionar todos"
                    />
                  </TableHead>
                )}
                <TableHead>Picking</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>NF-e</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>Transportadora</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fila.map((p) => {
                const hasNFe = !!p.nfe_numero;
                const valor = p.nfe_valor ?? p.valor_estimado ?? null;
                const isEstimado = !p.nfe_valor && p.valor_estimado != null;
                return (
                  <TableRow key={p.id} data-state={selected.has(p.id) ? 'selected' : undefined}>
                    {allowFaturar && (
                      <TableCell>
                        <Checkbox
                          checked={selected.has(p.id)}
                          onCheckedChange={() => toggle(p.id)}
                          aria-label={`Selecionar ${p.numero}`}
                        />
                      </TableCell>
                    )}
                    <TableCell className="font-mono">{p.numero}</TableCell>
                    <TableCell>{p.cliente}</TableCell>
                    <TableCell>
                      {hasNFe ? (
                        <span className="inline-flex items-center gap-1 text-xs">
                          <Link2 className="size-3 text-success" />
                          <span className="font-mono">{p.nfe_numero}</span>
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1 text-xs text-muted-foreground"
                          title="Nenhuma NF-e vinculada"
                        >
                          <Link2Off className="size-3" /> sem NF-e
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {valor == null ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        <span className={isEstimado ? 'text-muted-foreground' : ''}>
                          {isEstimado ? '~' : ''}
                          {formatBRL(valor)}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {p.transportadora?.nome ?? '—'}
                    </TableCell>
                    <TableCell>
                      <PickingTimeline status={p.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      {allowFaturar ? (
                        <Button
                          size="sm"
                          disabled={faturar.isPending}
                          onClick={() => faturar.mutate(p.id)}
                        >
                          {faturar.isPending ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="size-4" />
                          )}
                          Faturar
                        </Button>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1 text-xs text-muted-foreground"
                          title="Requer perfil Supervisor ou superior"
                        >
                          <Lock className="size-3" /> Sem permissão
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </section>

      {faturados.length > 0 && (
        <section className="rounded-lg border bg-card">
          <header className="border-b px-4 py-3 text-sm font-medium">
            Últimos faturados
          </header>
          <ul className="divide-y">
            {faturados.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between gap-3 px-4 py-2 text-sm"
              >
                <span className="font-mono">{p.numero}</span>
                <span className="flex-1 truncate text-muted-foreground">{p.cliente}</span>
                <span className="font-mono tabular-nums text-xs text-muted-foreground">
                  {p.nfe_valor ? formatBRL(p.nfe_valor) : '—'}
                </span>
                <span className="inline-flex items-center rounded-md bg-success/15 text-success px-2 py-0.5 text-xs font-medium">
                  faturado
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
