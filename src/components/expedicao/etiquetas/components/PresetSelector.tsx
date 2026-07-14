// ============================================================================
// PresetSelector — dropdown com thumbnail + apply / apply&print.
// ============================================================================
import { Sparkles, Trash2 } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Preset, Template } from '../types/etiqueta';

interface Props {
  presets: Preset[];
  onApply: (id: string, opts?: { print?: boolean }) => void;
  onSaveCurrentAsPreset: () => void;
  onRemoveCustom: (id: string) => void;
  active: Template | null;
}

export function PresetSelector({ presets, onApply, onSaveCurrentAsPreset, onRemoveCustom }: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Sparkles className="size-4" /> Presets
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-80">
        <DropdownMenuLabel>Modelos rápidos</DropdownMenuLabel>
        {presets.map((p) => (
          <div key={p.id} className="flex items-start gap-2 px-2 py-1.5 hover:bg-accent rounded-sm group">
            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onApply(p.id)}>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium truncate">{p.label}</span>
                {!p.builtIn && <Badge variant="secondary" className="h-4 text-[9px]">personalizado</Badge>}
              </div>
              <p className="text-[11px] text-muted-foreground line-clamp-1">{p.description}</p>
              <div className="flex gap-1 mt-1">
                <Button size="sm" variant="secondary" className="h-6 text-[10px] px-2" onClick={(e) => { e.stopPropagation(); onApply(p.id); }}>Aplicar</Button>
                <Button size="sm" variant="default" className="h-6 text-[10px] px-2" onClick={(e) => { e.stopPropagation(); onApply(p.id, { print: true }); }}>Aplicar e imprimir</Button>
                {!p.builtIn && (
                  <Button size="icon" variant="ghost" className="h-6 w-6 ml-auto" onClick={(e) => { e.stopPropagation(); onRemoveCustom(p.id); }}>
                    <Trash2 className="size-3" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onSaveCurrentAsPreset}>
          <Sparkles className="size-3.5 mr-2" /> Salvar template atual como preset
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default PresetSelector;
