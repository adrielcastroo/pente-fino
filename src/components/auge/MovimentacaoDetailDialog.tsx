import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Package, User, Calendar, DollarSign, ClipboardList, FileText,
  AlertTriangle, ExternalLink, PackagePlus, PackageMinus, ArrowRight,
} from 'lucide-react';
import { formatDateBR } from '@/lib/app-utils';
import { formatQty } from '@/lib/utils';
import FichaItemDialog from './FichaItemDialog';
import { ErpDialogHeader, ErpItemHeadline, ErpMeta, ErpSection } from '@/components/erp/ErpDialog';

export interface MovimentacaoRow {
  id: string;
  id_externo?: string | null;
  documento?: string | null;
  cd_transferencia?: string | null;
  documento_tipo?: string | null;
  codigo_produto?: string | null;
  deposito?: string | null;
  situacao?: string | null;
  ds_situacao?: string | null;
  quantidade?: number | null;
  valor?: number | null;
  usuario_criacao?: string | null;
  usuario_efetivacao?: string | null;
  data_movimento?: string | null;
  dt_efetivacao?: string | null;
  observacao?: string | null;
  ds_efetivacao?: string | null;
  synced_at?: string | null;
}

interface Props {
  movimentacao: MovimentacaoRow | null;
  tipo: 'entrada' | 'saida';
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function MovimentacaoDetailDialog({ movimentacao, tipo, open, onOpenChange }: Props) {
  const [fichaCodigo, setFichaCodigo] = useState<string | null>(null);
  const cod = movimentacao?.codigo_produto ?? null;

  const { data: produto } = useQuery({
    queryKey: ['mov-produto', cod],
    enabled: open && !!cod,
    queryFn: async () => {
      const { data } = await supabase
        .from('auge_produtos')
        .select('descricao, unidade, categoria')
        .eq('codigo', cod!)
        .maybeSingle();
      return data;
    },
  });

  const { data: deposito } = useQuery({
    queryKey: ['mov-deposito', movimentacao?.deposito],
    enabled: open && !!movimentacao?.deposito,
    queryFn: async () => {
      const { data } = await supabase
        .from('auge_depositos')
        .select('codigo, nome, localizacao')
        .eq('codigo', movimentacao!.deposito!)
        .maybeSingle();
      return data;
    },
  });

  if (!movimentacao) return null;

  const isEntrada = tipo === 'entrada';
  const Icon = isEntrada ? PackagePlus : PackageMinus;
  const titulo = isEntrada ? 'Entrada' : 'Saída';

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-hidden flex flex-col gap-3">
          <ErpDialogHeader
            icon={Icon}
            title={titulo}
            docs={[
              { label: 'Nº Documento', value: movimentacao.cd_transferencia || movimentacao.documento, tone: 'primary' },
              {
                label: 'Nº Efetivação',
                value: movimentacao.situacao === '20' ? movimentacao.documento : null,
                tone: 'success',
                hideWhenEmpty: true,
              },
            ]}
          />

          <div className="space-y-3 overflow-auto pr-1">
            {/* 1 — Observação */}
            <ErpSection label="Observação" icon={FileText}>
              <p className="text-sm text-foreground/90 leading-snug whitespace-pre-wrap">
                {movimentacao.observacao || <span className="text-muted-foreground/60">Sem observação</span>}
              </p>
            </ErpSection>

            {/* 2 — Item (descrição em destaque, depósito, quantidade) */}
            <ErpSection label="Item" icon={Package} contentClassName="p-3 space-y-3">
              <ErpItemHeadline descricao={produto?.descricao} codigo={cod} />

              <div className="flex items-center gap-3 rounded-md border border-border/60 bg-muted/30 px-3 py-2">
                <div className="min-w-0 flex-1">
                  <div className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">
                    {isEntrada ? 'Depósito de destino' : 'Depósito de origem'}
                  </div>
                  <div className="font-mono text-sm font-bold text-primary leading-tight">
                    {deposito?.codigo ?? movimentacao.deposito ?? '—'}
                  </div>
                  <div className="text-[11px] text-foreground/80 truncate">{deposito?.nome ?? '—'}</div>
                </div>
                <ArrowRight className={`h-4 w-4 shrink-0 ${isEntrada ? 'text-success' : 'text-primary'}`} />
                <div className="text-right shrink-0">
                  <div className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">Tipo</div>
                  <div className="text-xs font-semibold">{movimentacao.documento_tipo || titulo}</div>
                </div>
              </div>

              <div className="flex items-end justify-between gap-3">
                <div>
                  <div className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">
                    Quantidade
                  </div>
                  <div className="font-bold text-2xl tabular-nums text-primary leading-tight">
                    {formatQty(movimentacao.quantidade ?? 0)}
                    {produto?.unidade && (
                      <span className="text-xs font-medium text-muted-foreground ml-1">{produto.unidade}</span>
                    )}
                  </div>
                </div>
                {cod && (
                  <Button variant="outline" size="sm" className="h-8 gap-2" onClick={() => setFichaCodigo(cod)}>
                    <ExternalLink className="w-3.5 h-3.5" /> Ficha completa
                  </Button>
                )}
              </div>
            </ErpSection>

            {/* 3 — Documento */}
            <ErpSection label="Documento" icon={ClipboardList} contentClassName="p-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
              <ErpMeta icon={ClipboardList} label="Situação" value={movimentacao.ds_situacao || movimentacao.situacao || '—'} />
              <ErpMeta
                icon={Calendar}
                label={isEntrada ? 'Data' : 'Criado em'}
                value={movimentacao.data_movimento ? formatDateBR(movimentacao.data_movimento) : '—'}
              />
              <ErpMeta icon={DollarSign} label="Valor" value={movimentacao.valor ? brl(Number(movimentacao.valor)) : '—'} />
              <ErpMeta icon={User} label="Usuário" value={movimentacao.usuario_criacao || '—'} />
              {movimentacao.dt_efetivacao && (
                <ErpMeta icon={Calendar} label="Efetivada em" value={formatDateBR(movimentacao.dt_efetivacao)} />
              )}
              {movimentacao.usuario_efetivacao && (
                <ErpMeta icon={User} label="Usuário efetivação" value={movimentacao.usuario_efetivacao} />
              )}
            </ErpSection>

            {/* Erro / mensagem efetivação */}
            {movimentacao.ds_efetivacao && (
              <Card className="p-3 border-destructive/40 bg-destructive/5">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-destructive" />
                  <div className="min-w-0">
                    <p className="text-[9px] uppercase tracking-wider text-destructive font-semibold">
                      Mensagem de efetivação
                    </p>
                    <p className="text-sm text-destructive/90 mt-1 leading-snug">{movimentacao.ds_efetivacao}</p>
                  </div>
                </div>
              </Card>
            )}

            {movimentacao.synced_at && (
              <p className="text-[10px] text-muted-foreground/70 text-right">
                Sincronizado em {formatDateBR(movimentacao.synced_at)}
                {movimentacao.id_externo && <> · ID externo: <span className="font-mono">{movimentacao.id_externo}</span></>}
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <FichaItemDialog codigo={fichaCodigo} open={!!fichaCodigo} onOpenChange={(o) => !o && setFichaCodigo(null)} />
    </>
  );
}
