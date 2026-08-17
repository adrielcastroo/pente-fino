import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, Calendar, User, Pencil, Ruler, Boxes, Tag, History } from 'lucide-react';
import { formatDateBR } from '@/lib/app-utils';
import type { ItemCadastro } from '@/services/itensCadastroService';
import { ErpDialogHeader, ErpSection, ErpMeta, ErpItemHeadline } from '@/components/erp/ErpDialog';

interface Props {
  item: ItemCadastro | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (item: ItemCadastro) => void;
}

export default function CadastroDetailDialog({ item, open, onOpenChange, onEdit }: Props) {
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
      <DialogContent className="max-w-xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0">
        <ErpDialogHeader className="p-5 sm:p-6 pb-4 sm:pb-4 mb-0"
          icon={Package}
          title="Cadastro do item"
          docs={[
            { label: 'Código interno', value: item.codigo_interno, tone: 'primary' },
            { label: 'Posições', value: String(posicoes) },
          ]}
        />

        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 sm:p-6 space-y-4 pt-2">
          {/* Item em destaque */}
          <ErpSection label="Item">
            <ErpItemHeadline descricao={item.descricao} codigo={item.codigo_interno} />
            <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-border/60">
              <ErpMeta icon={Ruler} label="Unidade" value={item.unidade || '—'} />
              <ErpMeta
                icon={Boxes}
                label="Pacote fornecedor"
                value={item.pacote_fornecedor != null ? String(item.pacote_fornecedor) : '—'}
              />
              <ErpMeta
                icon={Boxes}
                label="Pacote estocagem"
                value={item.pacote_estocagem != null ? String(item.pacote_estocagem) : '—'}
              />
            </div>
          </ErpSection>

          {/* Códigos de fornecedor */}
          <ErpSection label="Códigos de fornecedor" icon={Tag}>
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
          </ErpSection>

          {/* Vínculo Auge */}
          {augeInfo && (
            <ErpSection label="Vínculo com Auge">
              <p className="text-sm text-foreground/90 leading-snug">{augeInfo.descricao}</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {augeInfo.unidade && (
                  <Badge variant="outline" className="text-[10px]">UN: {augeInfo.unidade}</Badge>
                )}
                {augeInfo.categoria && (
                  <Badge variant="outline" className="text-[10px]">{augeInfo.categoria}</Badge>
                )}
              </div>
            </ErpSection>
          )}

          {/* Auditoria */}
          <ErpSection label="Histórico" icon={History}>
            <div className="grid grid-cols-2 gap-3">
              <ErpMeta
                icon={Calendar}
                label="Criado em"
                value={item.created_at ? formatDateBR(item.created_at) : '—'}
              />
              <ErpMeta
                icon={Calendar}
                label="Atualizado em"
                value={item.updated_at ? formatDateBR(item.updated_at) : '—'}
              />
              <ErpMeta
                icon={User}
                label="Última edição por"
                value={item.updated_by_name || '—'}
              />
              <ErpMeta
                icon={Pencil}
                label="Último campo"
                value={item.last_edited_field || '—'}
              />
            </div>
          </ErpSection>

        </div>
        {onEdit && (
          <div className="p-5 sm:p-6 pt-4 sm:pt-4 border-t border-border flex justify-end">
              <Button
                variant="default"
                size="sm"
                className="gap-1.5"
                onClick={() => { onOpenChange(false); onEdit(item); }}
              >
                <Pencil className="w-4 h-4" />
                Editar cadastro
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
