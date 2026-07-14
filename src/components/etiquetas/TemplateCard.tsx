import { memo } from 'react';
import { Copy, Edit, MoreHorizontal, Printer, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { EtiquetaTemplate, VariavelTemplate } from '@/types/etiquetas';
import { ZPLPreview } from './ZPLPreview';

interface TemplateCardProps {
  template: EtiquetaTemplate;
  onPrint: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

function exemplos(vars: VariavelTemplate[]): Record<string, string> {
  const out: Record<string, string> = {};
  vars.forEach((v) => {
    if (v.tipo === 'barcode') out[v.chave] = 'RO-2024-001234';
    else if (v.tipo === 'qr') out[v.chave] = 'QR';
    else if (v.tipo === 'date') out[v.chave] = new Date().toLocaleDateString('pt-BR');
    else if (v.tipo === 'select') out[v.chave] = v.opcoes?.[0] ?? 'Opção';
    else out[v.chave] = v.label;
  });
  return out;
}

export const TemplateCard = memo(function TemplateCard({ template, onPrint, onEdit, onDuplicate, onDelete }: TemplateCardProps) {
  return (
    <article className={cn('group border border-border rounded-xl p-4 bg-card transition-shadow hover:shadow-lg')}>
      <div className="relative mb-3 bg-white border border-border rounded-lg overflow-hidden" style={{ aspectRatio: `${template.dimensoes.largura} / ${template.dimensoes.altura}` }}>
        <ZPLPreview zpl={template.zpl} variaveis={exemplos(template.variaveis)} dimensoes={template.dimensoes} />
        <span className="absolute bottom-2 right-2 bg-background/90 text-foreground px-1.5 py-0.5 text-[10px] rounded border border-border">
          {template.dimensoes.largura}×{template.dimensoes.altura}mm
        </span>
      </div>

      <div className="mb-3">
        <h3 className="font-medium text-sm truncate" title={template.nome}>
          {template.nome}
        </h3>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary capitalize">{template.categoria}</span>
          <span className="text-[10px] text-muted-foreground">
            v{template.versao} · {formatDistanceToNow(new Date(template.atualizado_em), { addSuffix: true, locale: ptBR })}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button className="flex-1" onClick={onPrint}>
          <Printer className="mr-2 h-4 w-4" /> Imprimir
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" aria-label="Mais ações">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <Edit className="mr-2 h-4 w-4" /> Editar template
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDuplicate}>
              <Copy className="mr-2 h-4 w-4" /> Duplicar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={onDelete}>
              <Trash2 className="mr-2 h-4 w-4" /> Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </article>
  );
});
TemplateCard.displayName = 'TemplateCard';

export const TemplateCardSkeleton = memo(function TemplateCardSkeleton() {
  return (
    <div className="border border-border rounded-xl p-4 bg-card animate-pulse">
      <div className="aspect-[100/150] bg-muted rounded-lg mb-3" />
      <div className="h-4 bg-muted rounded w-2/3 mb-2" />
      <div className="h-3 bg-muted rounded w-1/2 mb-3" />
      <div className="h-9 bg-muted rounded" />
    </div>
  );
});
TemplateCardSkeleton.displayName = 'TemplateCardSkeleton';
