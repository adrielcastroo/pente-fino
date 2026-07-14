// ============================================================================
// EtiquetaToolbar — header com template picker + presets + picking + print + drawers.
// ============================================================================
import { useState } from 'react';
import { FileText, History as HistoryIcon, Settings2, Plus, Copy, Trash2, Download, Upload, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { UseTemplatesReturn } from '../hooks/useEtiquetaTemplates';
import type { UsePrintReturn } from '../hooks/useEtiquetaPrint';
import PresetSelector from './PresetSelector';
import PickingSelector from './PickingSelector';
import PrintActions from './PrintActions';
import type { Preset, Template, PickingLike } from '../types/etiqueta';

interface Props {
  templates: UseTemplatesReturn;
  presets: Preset[];
  onApplyPreset: (id: string, opts?: { print?: boolean }) => void;
  onSaveCurrentAsPreset: () => void;
  onRemoveCustomPreset: (id: string) => void;
  onSelectPicking: (p: PickingLike) => void;
  print: UsePrintReturn['print'];
  isPrinting: boolean;
  onOpenHistory: () => void;
  onOpenAdvanced: () => void;
  onOpenTestPrint: () => void;
  onOpenBatchPrint: () => void;
  active: Template | null;
}

export function EtiquetaToolbar(props: Props) {
  const { templates, presets, onApplyPreset, onSaveCurrentAsPreset, onRemoveCustomPreset, onSelectPicking, print, isPrinting, onOpenHistory, onOpenAdvanced, onOpenTestPrint, onOpenBatchPrint, active } = props;
  const [importInputRef] = useState(() => ({ current: null as HTMLInputElement | null }));

  return (
    <div className="print:hidden rounded-xl border border-border/60 bg-gradient-to-br from-card via-card to-muted/40 shadow-sm">
      <div className="flex flex-col gap-3 p-3 sm:p-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Left: template picker */}
        <div className="flex items-center gap-2 min-w-0 flex-wrap">
          <FileText className="size-5 text-primary shrink-0" />
          <Select value={templates.activeId ?? ''} onValueChange={templates.setActiveId}>
            <SelectTrigger className="h-9 w-56 max-w-full"><SelectValue placeholder="Selecione um modelo" /></SelectTrigger>
            <SelectContent>
              {templates.templates.map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" className="gap-1" onClick={() => templates.create()}>
            <Plus className="size-3.5" /> Novo
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" className="h-8 w-8"><MoreVertical className="size-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => active && templates.duplicate(active.id)}>
                <Copy className="size-3.5 mr-2" /> Duplicar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => active && templates.remove(active.id)}>
                <Trash2 className="size-3.5 mr-2" /> Excluir
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={templates.exportJson}>
                <Download className="size-3.5 mr-2" /> Exportar JSON
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => importInputRef.current?.click()}>
                <Upload className="size-3.5 mr-2" /> Importar JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <input
            ref={(el) => { importInputRef.current = el; }}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void templates.importJson(f);
              e.target.value = '';
            }}
          />
          {active && (
            <Badge variant="outline" className="font-mono text-[10px]">{active.widthMm}×{active.heightMm}mm</Badge>
          )}
        </div>

        {/* Center: presets + picking */}
        <div className="flex items-center gap-2 flex-wrap">
          <PresetSelector
            presets={presets}
            onApply={onApplyPreset}
            onSaveCurrentAsPreset={onSaveCurrentAsPreset}
            onRemoveCustom={onRemoveCustomPreset}
            active={active}
          />
          <PickingSelector onSelect={onSelectPicking} />
        </div>

        {/* Right: print + drawers */}
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <PrintActions
            print={print}
            isPrinting={isPrinting}
            onOpenTestPrint={onOpenTestPrint}
            onOpenBatchPrint={onOpenBatchPrint}
          />
          <Button size="sm" variant="ghost" className="gap-1.5" onClick={onOpenHistory} title="Histórico (Ctrl+Shift+H)">
            <HistoryIcon className="size-4" />
          </Button>
          <Button size="sm" variant="ghost" className="gap-1.5" onClick={onOpenAdvanced} title="Configurações avançadas (Ctrl+Shift+S)">
            <Settings2 className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default EtiquetaToolbar;
