import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, Circle, PackageCheck, FileText, AlertCircle } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { PageShell, PageHeader } from '@/components/expedicao/ui';
import Seo from '@/components/Seo';
import { cn } from '@/lib/utils';

import {
  MOCK_OPS, STATUS_LABEL, STATUS_TONE, fmtBRL, fmtDate,
} from './mockOps';

const TIMELINE_ORDER = [
  'rascunho', 'pendente_aprovacao', 'aprovada', 'enviada',
  'confirmada_fornecedor', 'recebimento_parcial', 'recebida_total',
  'faturada', 'concluida',
] as const;

export default function OpDetailPage() {
  const { id } = useParams<{ id: string }>();
  const op = useMemo(() => MOCK_OPS.find(o => o.id === id), [id]);

  if (!op) {
    return (
      <PageShell>
        <PageHeader title="OP não encontrada" backTo="/compras/ops" />
        <Card className="rounded-md border-border bg-card">
          <CardContent className="p-10 text-center text-sm text-muted-foreground">
            A ordem de compra solicitada não existe.{' '}
            <Link to="/compras/ops" className="text-primary hover:underline">Voltar</Link>
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  const currentIdx = TIMELINE_ORDER.indexOf(op.status as (typeof TIMELINE_ORDER)[number]);
  const saldo = op.quantidade_total - op.quantidade_recebida;
  const pct = op.quantidade_total
    ? Math.min(100, Math.round((op.quantidade_recebida / op.quantidade_total) * 100))
    : 0;

  return (
    <>
      <Seo title={`${op.numero} — Compras | Pente Fino`} description={`Detalhes da ordem de compra ${op.numero} (${op.fornecedor}).`} path={`/compras/ops/${op.id}`} />
      <PageShell>
        <PageHeader
          title={op.numero}
          subtitle={op.fornecedor}
          backTo="/compras/ops"
          actions={
            <>
              <StatusBadge label={STATUS_LABEL[op.status]} tone={STATUS_TONE[op.status]} />
              <Button variant="outline" disabled title="Em breve">Registrar recebimento</Button>
            </>
          }
        />

        {/* Resumo */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <InfoTile label="Emissão" value={fmtDate(op.data_emissao)} />
          <InfoTile label="Entrega prevista" value={fmtDate(op.data_prevista_entrega)} />
          <InfoTile label="Valor total" value={fmtBRL(op.valor_total)} accent />
          <InfoTile label="Categoria" value={op.categoria} />
        </div>

        {/* Itens */}
        <Card className="rounded-md border-border bg-card">
          <CardContent className="p-4 sm:p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-muted-foreground">Itens</h2>
              <span className="text-xs text-muted-foreground tabular-nums">
                {op.quantidade_recebida} / {op.quantidade_total} · saldo {saldo}
              </span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
            </div>
            <p className="text-xs text-muted-foreground">
              {/* TODO(compras): listar linhas de ordem_compra_itens quando o schema for aplicado. */}
              Detalhamento por item disponível após conectar ao banco.
            </p>
          </CardContent>
        </Card>

        {/* Timeline de status */}
        <Card className="rounded-md border-border bg-card">
          <CardContent className="p-4 sm:p-6">
            <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-muted-foreground mb-4">
              Linha do tempo
            </h2>
            <ol className="space-y-3">
              {TIMELINE_ORDER.map((s, i) => {
                const done = i < currentIdx;
                const current = i === currentIdx;
                return (
                  <li key={s} className="flex items-center gap-3">
                    {done ? (
                      <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                    ) : current ? (
                      <div className="w-4 h-4 rounded-full border-2 border-primary bg-primary/20 shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-muted-foreground/40 shrink-0" />
                    )}
                    <span className={cn(
                      'text-sm',
                      current && 'font-semibold text-foreground',
                      done && 'text-muted-foreground',
                      !done && !current && 'text-muted-foreground/60',
                    )}>
                      {STATUS_LABEL[s]}
                    </span>
                  </li>
                );
              })}
            </ol>
          </CardContent>
        </Card>

        {/* Recebimentos e NFs — placeholders */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Card className="rounded-md border-border bg-card">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.12em] text-muted-foreground">
                <PackageCheck className="w-4 h-4" /> Recebimentos
              </div>
              <p className="text-xs text-muted-foreground">
                Nenhum recebimento registrado.
              </p>
            </CardContent>
          </Card>
          <Card className="rounded-md border-border bg-card">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.12em] text-muted-foreground">
                <FileText className="w-4 h-4" /> Notas fiscais (3-way match)
              </div>
              <p className="text-xs text-muted-foreground">
                Nenhuma NF vinculada.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-start gap-2 rounded-md border border-dashed border-border bg-muted/30 p-3 text-xs text-muted-foreground">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            Dados de exemplo (seed). Integração com Estoque, aprovação e recebimento serão
            habilitadas quando o schema de Compras for aplicado.
          </span>
        </div>
      </PageShell>
    </>
  );
}

function InfoTile({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-md border border-border bg-card p-3">
      <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
      <div className={cn(
        'mt-1 text-sm font-semibold tabular-nums',
        accent ? 'text-primary' : 'text-foreground',
      )}>{value}</div>
    </div>
  );
}
