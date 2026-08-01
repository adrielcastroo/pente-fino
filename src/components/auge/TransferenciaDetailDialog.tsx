import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  ArrowRight, ExternalLink, User, Calendar, DollarSign,
  ClipboardList, FileText, Package, History,
} from 'lucide-react';
import { formatDateBR } from '@/lib/app-utils';
import { formatQty } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import FichaItemDialog from './FichaItemDialog';
import { ErpDialogHeader, ErpItemHeadline, ErpMeta, ErpSection } from '@/components/erp/ErpDialog';

interface Props {
  transferencia: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function TransferenciaDetailDialog({ transferencia, open, onOpenChange }: Props) {
  const [fichaCodigo, setFichaCodigo] = useState<string | null>(null);
  const cod = transferencia?.codigo_produto;

  // Nome amigável dos depósitos
  const { data: depositos = [] } = useQuery({
    queryKey: ['transf-depositos', transferencia?.deposito_origem, transferencia?.deposito_destino],
    enabled: open && !!transferencia,
    queryFn: async () => {
      const codes = [transferencia?.deposito_origem, transferencia?.deposito_destino].filter(Boolean) as string[];
      if (codes.length === 0) return [];
      const { data } = await supabase
        .from('auge_depositos')
        .select('codigo, nome, localizacao')
        .in('codigo', codes);
      return data ?? [];
    },
  });

  // Descrição do produto
  const { data: produto } = useQuery({
    queryKey: ['transf-produto', cod],
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

  // Outras transferências recentes do mesmo item
  const { data: relacionadas = [] } = useQuery({
    queryKey: ['transf-relacionadas', cod, transferencia?.id],
    enabled: open && !!cod,
    queryFn: async () => {
      const { data } = await supabase
        .from('auge_transferencias')
        .select('id, documento, deposito_origem, deposito_destino, quantidade, data_movimento, ds_situacao')
        .eq('codigo_produto', cod!)
        .neq('id', transferencia?.id)
        .order('data_movimento', { ascending: false, nullsFirst: false })
        .limit(8);
      return data ?? [];
    },
  });

  if (!transferencia) return null;

  const depMap = new Map(depositos.map((d: any) => [d.codigo, d]));
  const origem = depMap.get(transferencia.deposito_origem);
  const destino = depMap.get(transferencia.deposito_destino);
  const descricao = transferencia.descricao_produto ?? produto?.descricao ?? null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-hidden flex flex-col gap-3">
          <ErpDialogHeader
            icon={ClipboardList}
            title="Transferência"
            docs={[
              { label: 'Nº Rascunho', value: transferencia.documento, tone: 'primary' },
              { label: 'Nº Efetivação', value: transferencia.nr_efetivacao, tone: 'success' },
            ]}
          />

          <div className="space-y-3 overflow-auto pr-1">
            {/* 1 — Observação */}
            <ErpSection label="Observação" icon={FileText}>
              <p className="text-sm text-foreground/90 leading-snug whitespace-pre-wrap">
                {transferencia.observacao || <span className="text-muted-foreground/60">Sem observação</span>}
              </p>
              {transferencia.ds_efetivacao && (
                <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border/60 leading-snug">
                  <span className="uppercase text-[9px] tracking-wider font-semibold">Obs. efetivação: </span>
                  {transferencia.ds_efetivacao}
                </p>
              )}
            </ErpSection>

            {/* 2 — Item (descrição em destaque, depósitos, quantidade) */}
            <ErpSection label="Item" icon={Package} contentClassName="p-3 space-y-3">
              <ErpItemHeadline descricao={descricao} codigo={cod} />

              <div className="flex items-center gap-3 rounded-md border border-border/60 bg-muted/30 px-3 py-2">
                <DepositoBlock code={transferencia.deposito_origem} info={origem} label="Origem" />
                <ArrowRight className="h-4 w-4 text-primary shrink-0" />
                <DepositoBlock code={transferencia.deposito_destino} info={destino} label="Destino" />
              </div>

              <div className="flex items-end justify-between gap-3">
                <div>
                  <div className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">
                    Quantidade
                  </div>
                  <div className="font-bold text-2xl tabular-nums text-primary leading-tight">
                    {formatQty(transferencia.quantidade)}
                    {produto?.unidade && (
                      <span className="text-xs font-medium text-muted-foreground ml-1">{produto.unidade}</span>
                    )}
                  </div>
                </div>
                {cod && (
                  <Button variant="outline" size="sm" className="h-8 gap-2" onClick={() => setFichaCodigo(cod)}>
                    <ExternalLink className="h-3.5 w-3.5" /> Ficha completa
                  </Button>
                )}
              </div>
            </ErpSection>

            {/* 3 — Dados do documento */}
            <ErpSection label="Documento" icon={ClipboardList} contentClassName="p-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
              <ErpMeta
                icon={ClipboardList}
                label="Situação"
                value={transferencia.ds_situacao ?? transferencia.situacao ?? '—'}
              />
              <ErpMeta
                icon={Calendar}
                label="Data"
                value={transferencia.data_movimento ? formatDateBR(transferencia.data_movimento) : '—'}
              />
              <ErpMeta
                icon={DollarSign}
                label="Valor"
                value={
                  transferencia.valor
                    ? Number(transferencia.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                    : '—'
                }
              />
              <ErpMeta icon={User} label="Criado por" value={transferencia.usuario_criacao ?? '—'} />
              <ErpMeta icon={User} label="Efetivado por" value={transferencia.usuario_efetivacao ?? '—'} />
              <ErpMeta icon={User} label="Enviou (logística)" value={transferencia.usuario_enviou_logistica ?? '—'} />
              <ErpMeta icon={User} label="Recebeu (logística)" value={transferencia.usuario_recebido_logistica ?? '—'} />
            </ErpSection>

            {/* 4 — Histórico do item */}
            {relacionadas.length > 0 && (
              <ErpSection label="Outras transferências deste item" icon={History} contentClassName="p-0 overflow-hidden">
                <table className="w-full text-xs">
                  <tbody>
                    {relacionadas.map((r: any) => (
                      <tr key={r.id} className="border-b border-border/50 last:border-0 hover:bg-muted/40">
                        <td className="p-2 font-mono text-[10px] w-24">{r.documento ?? '—'}</td>
                        <td className="p-2 font-mono text-[10px] whitespace-nowrap">
                          {r.deposito_origem ?? '?'} → {r.deposito_destino ?? '?'}
                        </td>
                        <td className="p-2 text-right tabular-nums">{formatQty(r.quantidade)}</td>
                        <td className="p-2 text-muted-foreground text-[10px] whitespace-nowrap">
                          {r.data_movimento ? formatDateBR(r.data_movimento) : '—'}
                        </td>
                        <td className="p-2 text-[10px] text-muted-foreground truncate max-w-[110px]">
                          {r.ds_situacao ?? '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ErpSection>
            )}

            <div className="text-[10px] text-muted-foreground text-right">
              Sincronizado {formatDistanceToNow(new Date(transferencia.synced_at), { addSuffix: true, locale: ptBR })}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <FichaItemDialog codigo={fichaCodigo} open={!!fichaCodigo} onOpenChange={(o) => !o && setFichaCodigo(null)} />
    </>
  );
}

function DepositoBlock({ code, info, label }: { code: string | null; info: any; label: string }) {
  return (
    <div className="flex-1 min-w-0">
      <div className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</div>
      <div className="font-mono text-sm font-bold text-primary leading-tight">{code ?? '?'}</div>
      <div className="text-[11px] text-foreground/80 truncate">{info?.nome ?? '—'}</div>
    </div>
  );
}
