import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Package, User, Calendar, DollarSign, ClipboardList, FileText,
  Archive, AlertTriangle, ExternalLink, PackagePlus, PackageMinus,
} from 'lucide-react';
import { formatDateBR } from '@/lib/app-utils';
import FichaItemDialog from './FichaItemDialog';

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

const SITUACAO_STYLE: Record<string, string> = {
  '10': 'bg-amber-500/10 text-warning border-amber-500/30',
  '20': 'bg-emerald-500/10 text-success border-emerald-500/30',
  '8':  'bg-red-500/10 text-destructive border-red-500/30',
  '30': 'bg-slate-500/10 text-slate-400 border-slate-500/30',
};

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
  const titulo = isEntrada ? 'Detalhes da Entrada' : 'Detalhes da Saída';
  const docPrincipal = movimentacao.cd_transferencia || movimentacao.documento || '—';

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Icon className={`w-4 h-4 ${isEntrada ? 'text-success' : 'text-primary'}`} />
              <DialogTitle>{titulo}</DialogTitle>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            {/* Documento + Situação */}
            <Card className="p-4 bg-muted/30 border-border">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Documento</p>
                  <p className="font-mono font-semibold text-base text-foreground mt-0.5 break-all">{docPrincipal}</p>
                  {movimentacao.documento && movimentacao.documento !== docPrincipal && (
                    <p className="text-xs text-muted-foreground mt-0.5 font-mono">Doc.: {movimentacao.documento}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {movimentacao.documento_tipo && (
                    <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
                      {movimentacao.documento_tipo}
                    </Badge>
                  )}
                  <Badge
                    className={`text-[10px] uppercase tracking-wider border ${
                      SITUACAO_STYLE[movimentacao.situacao ?? ''] ?? 'bg-muted text-muted-foreground border-border'
                    }`}
                  >
                    {movimentacao.ds_situacao || movimentacao.situacao || '—'}
                  </Badge>
                </div>
              </div>
            </Card>

            {/* Produto */}
            {cod && (
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2 flex items-center gap-1.5">
                  <Package className="w-3 h-3" /> Produto
                </p>
                <Card className="p-3 border-border">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-sm font-semibold text-foreground">{cod}</p>
                      {produto?.descricao && (
                        <p className="text-sm text-foreground/90 mt-1 leading-snug">{produto.descricao}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {produto?.unidade && (
                          <Badge variant="outline" className="text-[10px]">UN: {produto.unidade}</Badge>
                        )}
                        {produto?.categoria && (
                          <Badge variant="outline" className="text-[10px]">{produto.categoria}</Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="shrink-0 h-8 gap-1.5"
                      onClick={() => setFichaCodigo(cod)}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Ficha
                    </Button>
                  </div>
                </Card>
              </div>
            )}

            {/* Depósito */}
            {movimentacao.deposito && (
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2 flex items-center gap-1.5">
                  <Archive className="w-3 h-3" /> Depósito
                </p>
                <Card className="p-3 border-border">
                  <p className="text-sm font-semibold text-foreground">
                    {deposito ? `${deposito.codigo} — ${deposito.nome}` : movimentacao.deposito}
                  </p>
                  {deposito?.localizacao && (
                    <p className="text-xs text-muted-foreground mt-0.5">{deposito.localizacao}</p>
                  )}
                </Card>
              </div>
            )}

            {/* Grid de metadados */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <MetaItem
                icon={ClipboardList}
                label="Quantidade"
                value={String(movimentacao.quantidade ?? 0)}
              />
              <MetaItem
                icon={DollarSign}
                label="Valor"
                value={movimentacao.valor ? brl(Number(movimentacao.valor)) : '—'}
              />
              <MetaItem
                icon={Calendar}
                label={isEntrada ? 'Data' : 'Criado em'}
                value={movimentacao.data_movimento ? formatDateBR(movimentacao.data_movimento) : '—'}
              />
              <MetaItem
                icon={User}
                label="Usuário"
                value={movimentacao.usuario_criacao || '—'}
              />
              {!isEntrada && movimentacao.dt_efetivacao && (
                <MetaItem
                  icon={Calendar}
                  label="Efetivada em"
                  value={formatDateBR(movimentacao.dt_efetivacao)}
                />
              )}
              {!isEntrada && movimentacao.usuario_efetivacao && (
                <MetaItem
                  icon={User}
                  label="Usuário efetivação"
                  value={movimentacao.usuario_efetivacao}
                />
              )}
            </div>

            {/* Observação */}
            {movimentacao.observacao && (
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2 flex items-center gap-1.5">
                  <FileText className="w-3 h-3" /> Observação
                </p>
                <Card className="p-3 border-border">
                  <p className="text-sm text-foreground/90 leading-snug whitespace-pre-wrap">
                    {movimentacao.observacao}
                  </p>
                </Card>
              </div>
            )}

            {/* Erro / mensagem efetivação */}
            {movimentacao.ds_efetivacao && (
              <Card className="p-3 border-destructive/40 bg-destructive/5">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-destructive" />
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wider text-destructive font-semibold">
                      Mensagem de efetivação
                    </p>
                    <p className="text-sm text-destructive/90 mt-1 leading-snug">
                      {movimentacao.ds_efetivacao}
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* Rodapé sync */}
            {movimentacao.synced_at && (
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 pt-2 border-t border-border">
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

function MetaItem({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-semibold flex items-center gap-1">
        <Icon className="w-3 h-3" /> {label}
      </p>
      <p className="text-sm font-semibold text-foreground truncate" title={value}>{value}</p>
    </div>
  );
}
