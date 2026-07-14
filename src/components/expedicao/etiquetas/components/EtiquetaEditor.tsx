// ============================================================================
// EtiquetaEditor — side-by-side simplificado (conteúdo | variáveis).
// ============================================================================
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import type { BarcodeFmt, Template } from '../types/etiqueta';
import VariablePanel from './VariablePanel';
import type { UseVariablesReturn } from '../hooks/useEtiquetaVariables';

interface Props {
  template: Template;
  patch: (p: Partial<Template>) => void;
  variables: UseVariablesReturn;
}

const BARCODE_FMTS: BarcodeFmt[] = ['CODE128', 'CODE39', 'EAN13', 'EAN8', 'ITF14', 'UPC'];

export function EtiquetaEditor({ template: t, patch, variables }: Props) {
  const addField = () => patch({ customFields: [...t.customFields, { label: 'Campo', value: '' }] });
  const updateField = (i: number, p: Partial<{ label: string; value: string }>) => {
    const next = t.customFields.map((f, idx) => idx === i ? { ...f, ...p } : f);
    patch({ customFields: next });
  };
  const removeField = (i: number) => patch({ customFields: t.customFields.filter((_, idx) => idx !== i) });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4 h-full min-h-0">
      {/* Conteúdo */}
      <Card className="border-border/60 h-full overflow-hidden flex flex-col">
        <CardContent className="p-4 space-y-3 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Largura (mm)</Label>
              <Input type="number" min={20} max={300} value={t.widthMm} onChange={(e) => patch({ widthMm: Number(e.target.value) || t.widthMm })} className="h-9" />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Altura (mm)</Label>
              <Input type="number" min={20} max={400} value={t.heightMm} onChange={(e) => patch({ heightMm: Number(e.target.value) || t.heightMm })} className="h-9" />
            </div>
          </div>

          <Separator />

          <div className="space-y-1">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Título</Label>
            <Input value={t.titulo} onChange={(e) => patch({ titulo: e.target.value })} placeholder="EXPEDIÇÃO" />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Subtítulo</Label>
            <Input value={t.subtitulo} onChange={(e) => patch({ subtitulo: e.target.value })} placeholder="{{romaneio}}" />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Código</Label>
            <Input value={t.codigo} onChange={(e) => patch({ codigo: e.target.value })} placeholder="{{romaneio}}" className="font-mono" />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Destino</Label>
            <Input value={t.destino} onChange={(e) => patch({ destino: e.target.value })} placeholder="{{cliente}}" />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Observações</Label>
            <Textarea value={t.observacoes} onChange={(e) => patch({ observacoes: e.target.value })} rows={2} />
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center justify-between rounded-md border border-border p-2">
              <Label className="text-xs">QR Code</Label>
              <Switch checked={t.showQr} onCheckedChange={(v) => patch({ showQr: v })} />
            </div>
            <div className="flex items-center justify-between rounded-md border border-border p-2">
              <Label className="text-xs">Código de barras</Label>
              <Switch checked={t.showBarcode} onCheckedChange={(v) => patch({ showBarcode: v })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Formato</Label>
              <Select value={t.barcodeFmt} onValueChange={(v) => patch({ barcodeFmt: v as BarcodeFmt })}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {BARCODE_FMTS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Payload</Label>
              <Input value={t.payload} onChange={(e) => patch({ payload: e.target.value })} placeholder="{{romaneio}}" className="font-mono h-9" />
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1 col-span-1">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Título · {t.titleSize}pt</Label>
              <Slider value={[t.titleSize]} min={8} max={48} step={1} onValueChange={([v]) => patch({ titleSize: v })} />
            </div>
            <div className="space-y-1 col-span-1">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Código · {t.codeSize}pt</Label>
              <Slider value={[t.codeSize]} min={8} max={36} step={1} onValueChange={([v]) => patch({ codeSize: v })} />
            </div>
            <div className="space-y-1 col-span-1">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Padding · {t.padding}mm</Label>
              <Slider value={[t.padding]} min={0} max={10} step={1} onValueChange={([v]) => patch({ padding: v })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Alinhamento</Label>
              <Select value={t.align} onValueChange={(v) => patch({ align: v as Template['align'] })}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Esquerda</SelectItem>
                  <SelectItem value="center">Centro</SelectItem>
                  <SelectItem value="right">Direita</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Borda</Label>
              <Select value={t.borderStyle} onValueChange={(v) => patch({ borderStyle: v as Template['borderStyle'] })}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem borda</SelectItem>
                  <SelectItem value="solid">Contínua</SelectItem>
                  <SelectItem value="dashed">Tracejada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Campos customizados</Label>
              <Button size="sm" variant="ghost" className="h-7 gap-1" onClick={addField}><Plus className="size-3" /> Adicionar</Button>
            </div>
            {t.customFields.map((f, i) => (
              <div key={i} className="grid grid-cols-[100px_1fr_auto] gap-2 items-center">
                <Input value={f.label} onChange={(e) => updateField(i, { label: e.target.value })} className="h-8 text-xs" />
                <Input value={f.value} onChange={(e) => updateField(i, { value: e.target.value })} className="h-8 text-xs font-mono" placeholder="{{var}} ou texto" />
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => removeField(i)}><Trash2 className="size-3.5" /></Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Variáveis */}
      <VariablePanel variables={variables} template={t} />
    </div>
  );
}

export default EtiquetaEditor;
