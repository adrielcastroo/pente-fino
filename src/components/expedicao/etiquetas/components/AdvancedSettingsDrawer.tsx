// ============================================================================
// AdvancedSettingsDrawer — abriga o editor visual completo (drag/snap/rulers)
// preservado da versão anterior, além de tabs para ZPL, BarTender e CSS custom.
// ============================================================================
import { useMemo } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Copy } from 'lucide-react';
import AdvancedVisualEditor from './AdvancedVisualEditor';
import { templateToZpl } from '../utils/etiquetaZpl';
import type { Template, Vars } from '../types/etiqueta';

interface Props {
  open: boolean;
  onClose: () => void;
  template: Template | null;
  vars: Vars;
  patch: (p: Partial<Template>) => void;
}

export function AdvancedSettingsDrawer({ open, onClose, template, vars, patch }: Props) {
  const zpl = useMemo(() => template ? templateToZpl(template, vars) : '', [template, vars]);

  const uploadBartender = (file: File) => {
    if (file.size > 4 * 1024 * 1024) { toast.error('Imagem > 4MB.'); return; }
    const r = new FileReader();
    r.onload = () => patch({ bartenderImageSrc: String(r.result || ''), bartenderEnabled: true });
    r.readAsDataURL(file);
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-[95vw] lg:max-w-[1200px] p-0 flex flex-col">
        <SheetHeader className="p-4 border-b border-border">
          <SheetTitle>Configurações avançadas</SheetTitle>
        </SheetHeader>
        <Tabs defaultValue="visual" className="flex-1 flex flex-col min-h-0">
          <TabsList className="mx-4 mt-3 w-fit">
            <TabsTrigger value="visual">Editor visual</TabsTrigger>
            <TabsTrigger value="zpl">ZPL</TabsTrigger>
            <TabsTrigger value="bartender">BarTender</TabsTrigger>
            <TabsTrigger value="css">CSS Print</TabsTrigger>
          </TabsList>

          <TabsContent value="visual" className="flex-1 overflow-auto p-3">
            <AdvancedVisualEditor />
          </TabsContent>

          <TabsContent value="zpl" className="flex-1 overflow-auto p-4 space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">ZPL gerado (203dpi, UTF-8)</Label>
              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => { navigator.clipboard.writeText(zpl); toast.success('ZPL copiado.'); }}>
                <Copy className="size-3.5" /> Copiar
              </Button>
            </div>
            <Textarea value={zpl} readOnly rows={20} className="font-mono text-xs" />
          </TabsContent>

          <TabsContent value="bartender" className="flex-1 overflow-auto p-4 space-y-3">
            {template && (
              <>
                <label className="flex items-center gap-2">
                  <Switch checked={!!template.bartenderEnabled} onCheckedChange={(v) => patch({ bartenderEnabled: v })} />
                  <span className="text-sm">Substituir etiqueta pela imagem BarTender</span>
                </label>
                <div className="space-y-1">
                  <Label className="text-xs">Upload de imagem (.png, .jpg — máx 4MB)</Label>
                  <Input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadBartender(f); }} />
                </div>
                {template.bartenderImageSrc && (
                  <div className="border border-border rounded-md p-2 bg-muted/30 max-w-md">
                    <img src={template.bartenderImageSrc} alt="BarTender" className="w-full h-auto" />
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="css" className="flex-1 overflow-auto p-4 space-y-2">
            {template && (
              <>
                <Label className="text-xs">CSS customizado (@media print)</Label>
                <Textarea
                  value={template.customCss ?? ''}
                  onChange={(e) => patch({ customCss: e.target.value })}
                  rows={16}
                  className="font-mono text-xs"
                  placeholder=".label-sheet { ... }"
                />
              </>
            )}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

export default AdvancedSettingsDrawer;
