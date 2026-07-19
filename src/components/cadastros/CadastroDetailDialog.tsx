import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Package, Calendar, User, Pencil, ExternalLink, Ruler, Boxes, Tag } from 'lucide-react';
import { formatDateBR } from '@/lib/app-utils';
import type { ItemCadastro } from '@/services/itensCadastroService';
import { useNavigate } from 'react-router-dom';

interface Props {
  item: ItemCadastro | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (item: ItemCadastro) => void;
}

export default function CadastroDetailDialog({ item, open, onOpenChange, onEdit }: Props) {
  const navigate = useNavigate();

  const { data: augeInfo } = useQuery({
    queryKey: ['cadastro-auge', item?.codigo_interno],
    enabled: open && !!item?.codigo_interno,
    queryFn: async () => {
      const { data } = await supabase
        .from('auge_produtos')
        .select('codigo, descricao, unidade, categoria')
        .eq('codigo', item!.codigo_interno)
        .maybeSingle();
      return data;
    },
  });

  const { data: posicoes = 0 } = useQuery({
    queryKey: ['cadastro-posicoes', item?.codigo_interno, item?.descricao],
    enabled: open && !!item,
    queryFn: async () => {
      const { count } = await supabase
        .from('estoque_posicoes')
        .select('id', { count: 'exact', head: true })
        .eq('item', item!.descricao)
        .neq('status', 'saida');
      return count ?? 0;
    },
  });

  if (!item) return null;

  const codigos = item.codigos_fornecedor?.filter(Boolean) ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-primary" />
            <DialogTitle>Detalhes do Item</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Header do item */}
          <Card className="p-4 bg-muted/30 border-border">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Código interno</p>
            <p className="font-mono font-semibold text-base text-foreground mt-0.5 break-all">
              {item.codigo_interno}
            </p>
            <p className="text-sm text-foreground/90 mt-2 leading-snug">{item.descricao}</p>
          </Card>

          {/* Códigos de fornecedor */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2 flex items-center gap-1.5">
              <Tag className="w-3 h-3" /> Códigos de fornecedor
            </p>
            <Card className="p-3 border-border">
              {codigos.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">— nenhum código cadastrado —</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {codigos.map((c, i) => (
                    <Badge key={`${c}-${i}`} variant="outline" className="font-mono text-[11px]">
                      {c}
                    </Badge>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Grid de metadados */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <MetaItem icon={Ruler} label="Unidade" value={item.unidade || '—'} />
            <MetaItem
              icon={Boxes}
              label="Pacote fornecedor"
              value={item.pacote_fornecedor != null ? String(item.pacote_fornecedor) : '—'}
            />
            <MetaItem
              icon={Boxes}
              label="Pacote estocagem"
              value={item.pacote_estocagem != null ? String(item.pacote_estocagem) : '—'}
            />
            <MetaItem
              icon={Package}
              label="Posições em estoque"
              value={String(posicoes)}
            />
          </div>

          {/* Auge */}
          {augeInfo && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">
                Vínculo com Auge
              </p>
              <Card className="p-3 border-border">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-foreground/90 leading-snug">{augeInfo.descricao}</p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {augeInfo.unidade && (
                        <Badge variant="outline" className="text-[10px]">UN: {augeInfo.unidade}</Badge>
                      )}
                      {augeInfo.categoria && (
                        <Badge variant="outline" className="text-[10px]">{augeInfo.categoria}</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Auditoria */}
          <div className="grid grid-cols-2 gap-3">
            <MetaItem
              icon={Calendar}
              label="Criado em"
              value={item.created_at ? formatDateBR(item.created_at) : '—'}
            />
            <MetaItem
              icon={Calendar}
              label="Atualizado em"
              value={item.updated_at ? formatDateBR(item.updated_at) : '—'}
            />
            {item.updated_by_name && (
              <MetaItem
                icon={User}
                label="Última edição por"
                value={item.updated_by_name}
              />
            )}
            {item.last_edited_field && (
              <MetaItem
                icon={Pencil}
                label="Último campo"
                value={item.last_edited_field}
              />
            )}
          </div>

          {/* Ações */}
          <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-border">
            {onEdit && (
              <Button
                variant="default"
                className="gap-1.5"
                onClick={() => { onOpenChange(false); onEdit(item); }}
              >
                <Pencil className="w-4 h-4" />
                Editar cadastro
              </Button>
            )}
            <Button
              variant="outline"
              className="gap-1.5"
              onClick={() => {
                onOpenChange(false);
                navigate(`/estoque/mapa?item=${encodeURIComponent(item.descricao)}`);
              }}
            >
              <ExternalLink className="w-4 h-4" />
              Ver posições no mapa
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
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
