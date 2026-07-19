import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowRight, ExternalLink, Package, User, Calendar, DollarSign, ClipboardList } from '@/components/icons';
import { formatDateBR } from '@/lib/app-utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import FichaItemDialog from './FichaItemDialog';

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

  const situacaoTone =
    transferencia.situacao === 'C' || /cancel/i.test(transferencia.ds_situacao ?? '') ? 'destructive' :
    transferencia.situacao === 'E' || /efetiv/i.test(transferencia.ds_situacao ?? '') ? 'default' :
    'secondary';

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base flex-wrap">
              <ClipboardList className="h-5 w-5 text-primary" />
              Transferência
              <span className="text-[10px] uppercase text-muted-foreground ml-1">Rascunho</span>
              <span className="font-mono text-primary">{transferencia.documento ?? '—'}</span>
              {transferencia.nr_efetivacao && (
                <>
                  <span className="text-[10px] uppercase text-muted-foreground ml-1">Efetivação</span>
                  <span className="font-mono text-emerald-500 font-bold">{transferencia.nr_efetivacao}</span>
                </>
              )}
              <Badge variant={situacaoTone as any} className="text-[10px] ml-1">
                {transferencia.ds_situacao ?? transferencia.situacao ?? '—'}
              </Badge>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 overflow-auto pr-1">
            {/* Fluxo origem → destino */}
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <DepositoBlock code={transferencia.deposito_origem} info={origem} label="Origem" />
                <ArrowRight className="h-6 w-6 text-primary shrink-0" />
                <DepositoBlock code={transferencia.deposito_destino} info={destino} label="Destino" />
              </div>
            </Card>

            {/* Item */}
            <Card className="p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] uppercase text-muted-foreground tracking-wide">Item</div>
                  <div className="font-mono text-sm text-primary font-semibold">{cod ?? '—'}</div>
                  <div className="text-xs text-muted-foreground line-clamp-2">{produto?.descricao ?? '—'}</div>
                  <div className="flex gap-1 mt-1">
                    {produto?.unidade && <Badge variant="outline" className="text-[10px]">{produto.unidade}</Badge>}
                    {produto?.categoria && <Badge variant="outline" className="text-[10px]">{produto.categoria}</Badge>}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[10px] uppercase text-muted-foreground tracking-wide">Quantidade</div>
                  <div className="font-bold text-2xl tabular-nums text-primary">
                    {Number(transferencia.quantidade ?? 0).toLocaleString('pt-BR')}
                  </div>
                </div>
              </div>
              {cod && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 h-8 gap-2"
                  onClick={() => setFichaCodigo(cod)}
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Abrir ficha completa
                </Button>
              )}
            </Card>

            {/* Meta */}
            <Card className="p-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <Meta icon={ClipboardList} label="Rascunho" value={transferencia.documento ?? '—'} mono />
              <Meta icon={ClipboardList} label="Nº Efetivação (SAP)" value={transferencia.nr_efetivacao ?? '—'} mono />
              <Meta icon={Calendar} label="Data" value={transferencia.data_movimento ? formatDateBR(transferencia.data_movimento) : '—'} />
              <Meta icon={DollarSign} label="Valor" value={
                transferencia.valor
                  ? Number(transferencia.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                  : '—'
              } />
              <Meta icon={User} label="Criado por" value={transferencia.usuario_criacao ?? '—'} />
              <Meta icon={User} label="Efetivado por" value={transferencia.usuario_efetivacao ?? '—'} />
              <Meta icon={User} label="Enviou (logística)" value={transferencia.usuario_enviou_logistica ?? '—'} />
              <Meta icon={User} label="Recebeu (logística)" value={transferencia.usuario_recebido_logistica ?? '—'} />
              {transferencia.observacao && (
                <div className="col-span-2 md:col-span-4 text-[11px] text-muted-foreground border-t pt-2">
                  <span className="uppercase text-[10px] tracking-wide">Observação:</span> {transferencia.observacao}
                </div>
              )}
              {transferencia.ds_efetivacao && (
                <div className="col-span-2 md:col-span-4 text-[11px] text-muted-foreground border-t pt-2">
                  <span className="uppercase text-[10px] tracking-wide">Obs. efetivação:</span> {transferencia.ds_efetivacao}
                </div>
              )}
            </Card>


            {/* Transferências relacionadas */}
            {relacionadas.length > 0 && (
              <Card className="overflow-hidden">
                <div className="p-2 bg-muted/50 text-[10px] uppercase tracking-wide text-muted-foreground">
                  Outras transferências deste item
                </div>
                <table className="w-full text-xs">
                  <tbody>
                    {relacionadas.map((r: any) => (
                      <tr key={r.id} className="border-t hover:bg-muted/40">
                        <td className="p-2 font-mono text-[10px] w-24">{r.documento ?? '—'}</td>
                        <td className="p-2 font-mono text-[10px]">
                          {r.deposito_origem ?? '?'} → {r.deposito_destino ?? '?'}
                        </td>
                        <td className="p-2 text-right tabular-nums">{Number(r.quantidade ?? 0).toLocaleString('pt-BR')}</td>
                        <td className="p-2 text-muted-foreground text-[10px]">
                          {r.data_movimento ? formatDateBR(r.data_movimento) : '—'}
                        </td>
                        <td className="p-2">
                          <Badge variant="outline" className="text-[10px]">{r.ds_situacao ?? '—'}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
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
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="font-mono text-sm font-bold text-primary">{code ?? '?'}</div>
      <div className="text-xs text-foreground/80 truncate">{info?.nome ?? '—'}</div>
      {info?.localizacao && (
        <div className="text-[10px] text-muted-foreground truncate">{info.localizacao}</div>
      )}
    </div>
  );
}

function Meta({ icon: Icon, label, value, mono }: any) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3 w-3" /> {label}
      </div>
      <div className={`text-xs mt-0.5 truncate ${mono ? 'font-mono' : ''}`}>{value}</div>
    </div>
  );
}
