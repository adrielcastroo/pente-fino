import { useState, useRef, useLayoutEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Type, Maximize, Layout, Save, RefreshCw, Shirt, Cog, Square } from 'lucide-react';
import { toast } from 'sonner';
import { TecidoPreview, MotorPreview, LABEL_PX_PER_MM } from '@/components/labels/LabelTemplates';

type LabelKind = 'tecido' | 'motor';

const TECIDO_FIELDS = [
  { id: 'sku', label: 'SKU (Código)' },
  { id: 'descricao', label: 'Descrição do Item' },
  { id: 'nfe', label: 'NFe / Lote' },
  { id: 'qtd', label: 'Quantidade (QTD)' },
  { id: 'rnp', label: 'RNP (Endereço)' },
  { id: 'data', label: 'Data' },
  { id: 'qr_sku', label: 'QR Code SKU' },
  { id: 'qr_lote', label: 'QR Code Lote' },
  
];

const MOTOR_FIELDS = [
  { id: 'sku', label: 'SKU (Código)' },
  { id: 'descricao', label: 'Descrição do Motor' },
  { id: 'serie', label: 'Faixa SERIE' },
  { id: 'cx', label: 'Nº da Caixa (CX)' },
  { id: 'nf', label: 'Nota Fiscal (NF)' },
  { id: 'nt', label: 'Nº de Série (NT)' },
  { id: 'rnp', label: 'RNP (Endereço)' },
  { id: 'data', label: 'Data' },
  { id: 'qr_lote_sku', label: 'QR Code Lote+SKU' },
];

const TECIDO_DEFAULT = ['sku', 'descricao', 'nfe', 'qtd', 'rnp', 'data', 'qr_sku', 'qr_lote'];
const MOTOR_DEFAULT = ['sku', 'descricao', 'serie', 'cx', 'nf', 'nt', 'rnp', 'data', 'qr_lote_sku'];

export default function LabelLayoutPanel() {
  const { labelSettings, setLabelSettings } = useAppStore();
  const [kind, setKind] = useState<LabelKind>('tecido');

  const isMotor = kind === 'motor';
  const fields = isMotor ? (labelSettings.motorFields ?? MOTOR_DEFAULT) : labelSettings.fields;
  const w = isMotor ? (labelSettings.motorWidth ?? 90) : labelSettings.width;
  const h = isMotor ? (labelSettings.motorHeight ?? 80) : labelSettings.height;
  const offsetMm = isMotor
    ? (labelSettings.motorPrintOffsetXMm ?? 4)
    : (labelSettings.printOffsetXMm ?? 4);
  const availableFields = isMotor ? MOTOR_FIELDS : TECIDO_FIELDS;
  const has = (id: string) => fields.includes(id);

  // Aparência (com fallback seguro)
  const borderWidth = isMotor ? (labelSettings.motorBorderWidth ?? 2) : (labelSettings.borderWidth ?? 4);
  const borderStyle = (isMotor ? labelSettings.motorBorderStyle : labelSettings.borderStyle) ?? 'solid';
  const borderRadius = isMotor ? (labelSettings.motorBorderRadius ?? 0) : (labelSettings.borderRadius ?? 0);
  const padding = isMotor ? (labelSettings.motorPadding ?? 0) : (labelSettings.padding ?? 0);
  const margin = isMotor ? (labelSettings.motorMargin ?? 0) : (labelSettings.margin ?? 0);

  const updateAppearance = (patch: Partial<{ borderWidth: number; borderStyle: typeof borderStyle; borderRadius: number; padding: number; margin: number; }>) => {
    if (isMotor) {
      setLabelSettings({
        ...(patch.borderWidth !== undefined ? { motorBorderWidth: patch.borderWidth } : {}),
        ...(patch.borderStyle !== undefined ? { motorBorderStyle: patch.borderStyle } : {}),
        ...(patch.borderRadius !== undefined ? { motorBorderRadius: patch.borderRadius } : {}),
        ...(patch.padding !== undefined ? { motorPadding: patch.padding } : {}),
        ...(patch.margin !== undefined ? { motorMargin: patch.margin } : {}),
      });
    } else {
      setLabelSettings({
        ...(patch.borderWidth !== undefined ? { borderWidth: patch.borderWidth } : {}),
        ...(patch.borderStyle !== undefined ? { borderStyle: patch.borderStyle } : {}),
        ...(patch.borderRadius !== undefined ? { borderRadius: patch.borderRadius } : {}),
        ...(patch.padding !== undefined ? { padding: patch.padding } : {}),
        ...(patch.margin !== undefined ? { margin: patch.margin } : {}),
      });
    }
  };

  const updateFields = (newFields: string[]) =>
    setLabelSettings(isMotor ? { motorFields: newFields } : { fields: newFields });
  const updateDim = (patch: { w?: number; h?: number }) =>
    setLabelSettings(isMotor
      ? { motorWidth: patch.w ?? w, motorHeight: patch.h ?? h }
      : { width: patch.w ?? w, height: patch.h ?? h });
  const updateOffset = (value: number) =>
    setLabelSettings(isMotor ? { motorPrintOffsetXMm: value } : { printOffsetXMm: value });

  const handleToggleField = (fieldId: string) => {
    updateFields(fields.includes(fieldId) ? fields.filter(f => f !== fieldId) : [...fields, fieldId]);
  };

  const handleReset = () => {
    if (isMotor) {
      setLabelSettings({ motorFields: MOTOR_DEFAULT, motorWidth: 60, motorHeight: 50 });
    } else {
      setLabelSettings({ fields: TECIDO_DEFAULT, width: 100, height: 60 });
    }
    toast.info(`Layout de ${isMotor ? 'Motores/Controles' : 'Tecidos'} redefinido.`);
  };

  const handleSave = () => toast.success('Configurações de etiqueta salvas!');

  // Render do preview na MESMA escala do PNG final (8 px/mm).
  // Um transform: scale(...) responsivo encolhe para caber no container,
  // garantindo fidelidade pixel-a-pixel com o PNG impresso.
  const wPx = (labelSettings.orientation === 'landscape' ? w : h) * LABEL_PX_PER_MM;
  const hPx = (labelSettings.orientation === 'landscape' ? h : w) * LABEL_PX_PER_MM;
  const fs = labelSettings.fontSize;
  const offsetPx = Math.min(Math.max(0, offsetMm) * LABEL_PX_PER_MM, wPx - 1);
  const innerWpx = wPx - offsetPx;

  const previewBoxRef = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState(1);

  useLayoutEffect(() => {
    const el = previewBoxRef.current;
    if (!el) return;
    const recalc = () => {
      const padding = 32; // p-4 nas duas direções
      const availW = Math.max(0, el.clientWidth - padding);
      const availH = Math.max(0, el.clientHeight - padding);
      if (availW <= 0 || availH <= 0) return;
      const next = Math.min(availW / wPx, availH / hPx, 1);
      setFit(next > 0 ? next : 1);
    };
    recalc();
    const ro = new ResizeObserver(recalc);
    ro.observe(el);
    return () => ro.disconnect();
  }, [wPx, hPx]);

  return (
    <div className="space-y-6">
      <Tabs value={kind} onValueChange={(v) => setKind(v as LabelKind)}>
        <TabsList className="grid w-full max-w-md grid-cols-2 h-11">
          <TabsTrigger value="tecido" className="gap-2 font-bold">
            <Shirt className="w-4 h-4" /> Tecidos
          </TabsTrigger>
          <TabsTrigger value="motor" className="gap-2 font-bold">
            <Cog className="w-4 h-4" /> Motores / Controles
          </TabsTrigger>
        </TabsList>

        <TabsContent value={kind} className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <Card className="border-border/30 bg-background/50">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Maximize className="w-4 h-4 text-primary" />
                    <CardTitle className="text-sm font-black uppercase tracking-wider">Dimensões (mm)</CardTitle>
                  </div>
                  <CardDescription>
                    {isMotor ? 'Padrão Motores: 60mm × 50mm.' : 'Padrão Tecidos: 100mm × 60mm.'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold">Largura</Label>
                      <Input type="number" value={w} onChange={(e) => updateDim({ w: Number(e.target.value) })} className="h-9" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold">Altura</Label>
                      <Input type="number" value={h} onChange={(e) => updateDim({ h: Number(e.target.value) })} className="h-9" />
                    </div>
                  </div>
                  <div className="space-y-2 pt-2">
                    <Label className="text-xs font-bold">Orientação (global)</Label>
                    <div className="flex gap-2">
                      <Button variant={labelSettings.orientation === 'landscape' ? 'default' : 'outline'} size="sm"
                        className="flex-1 font-bold text-xs" onClick={() => setLabelSettings({ orientation: 'landscape' })}>
                        Paisagem
                      </Button>
                      <Button variant={labelSettings.orientation === 'portrait' ? 'default' : 'outline'} size="sm"
                        className="flex-1 font-bold text-xs" onClick={() => setLabelSettings({ orientation: 'portrait' })}>
                        Retrato
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2 pt-2">
                    <Label className="text-xs font-bold">Offset de impressão X (mm)</Label>
                    <Input
                      type="number"
                      step="0.5"
                      min="0"
                      value={offsetMm}
                      onChange={(e) => updateOffset(Number(e.target.value))}
                      className="h-9 w-24"
                    />
                    <p className="text-[10px] opacity-60 leading-tight">
                      Compensa o deslocamento da impressora (faixa branca à esquerda). Padrão: 4 mm.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/30 bg-background/50">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Layout className="w-4 h-4 text-primary" />
                    <CardTitle className="text-sm font-black uppercase tracking-wider">Blocos da Etiqueta</CardTitle>
                  </div>
                  <CardDescription>Habilite ou desabilite cada elemento.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                    {availableFields.map((field) => (
                      <div key={field.id} className="flex items-center justify-between gap-2">
                        <Label htmlFor={`f-${kind}-${field.id}`} className="text-xs font-medium cursor-pointer">
                          {field.label}
                        </Label>
                        <Switch id={`f-${kind}-${field.id}`}
                          checked={fields.includes(field.id)}
                          onCheckedChange={() => handleToggleField(field.id)} />
                      </div>
                    ))}
                  </div>
                  <Separator className="my-2" />
                  <div className="space-y-2 pt-1">
                    <Label className="text-xs font-bold flex items-center gap-2">
                      <Type className="w-3.5 h-3.5" /> Tamanho da Fonte: <span className="font-mono opacity-70">{labelSettings.fontSize}pt</span>
                    </Label>
                    <div className="flex items-center gap-3">
                      <Slider
                        value={[labelSettings.fontSize]}
                        min={6} max={24} step={1}
                        onValueChange={([v]) => setLabelSettings({ fontSize: v })}
                        className="flex-1"
                      />
                      <Input type="number" min={6} max={24} value={labelSettings.fontSize}
                        onChange={(e) => setLabelSettings({ fontSize: Number(e.target.value) })}
                        className="h-9 w-20" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/30 bg-background/50">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Square className="w-4 h-4 text-primary" />
                    <CardTitle className="text-sm font-black uppercase tracking-wider">Aparência</CardTitle>
                  </div>
                  <CardDescription>Bordas, cantos, padding e margem da etiqueta.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold flex justify-between">
                      <span>Espessura da borda</span><span className="font-mono opacity-70">{borderWidth}px</span>
                    </Label>
                    <Slider value={[borderWidth]} min={0} max={12} step={1}
                      onValueChange={([v]) => updateAppearance({ borderWidth: v })} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold">Estilo da borda</Label>
                    <Select value={borderStyle} onValueChange={(v) => updateAppearance({ borderStyle: v as typeof borderStyle })}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="solid">Sólida</SelectItem>
                        <SelectItem value="dashed">Tracejada</SelectItem>
                        <SelectItem value="dotted">Pontilhada</SelectItem>
                        <SelectItem value="double">Dupla</SelectItem>
                        <SelectItem value="none">Sem borda</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold flex justify-between">
                      <span>Raio dos cantos</span><span className="font-mono opacity-70">{borderRadius}px</span>
                    </Label>
                    <Slider value={[borderRadius]} min={0} max={40} step={1}
                      onValueChange={([v]) => updateAppearance({ borderRadius: v })} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold flex justify-between">
                      <span>Espaçamento interno (padding)</span><span className="font-mono opacity-70">{padding}px</span>
                    </Label>
                    <Slider value={[padding]} min={0} max={40} step={1}
                      onValueChange={([v]) => updateAppearance({ padding: v })} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold flex justify-between">
                      <span>Margem externa (preview)</span><span className="font-mono opacity-70">{margin}px</span>
                    </Label>
                    <Slider value={[margin]} min={0} max={40} step={1}
                      onValueChange={([v]) => updateAppearance({ margin: v })} />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <div className="flex items-baseline justify-between">
                <Label className="text-xs font-black uppercase tracking-widest opacity-60">
                  Pré-visualização — {isMotor ? 'Motores / Controles' : 'Tecidos'}
                </Label>
                <span className="text-[10px] font-mono opacity-60">
                  {w}×{h}mm · zoom {Math.round(fit * 100)}%
                </span>
              </div>
              <div
                ref={previewBoxRef}
                className="relative flex items-center justify-center p-4 bg-muted/20 rounded-3xl border-2 border-dashed border-border/30 min-h-[420px] overflow-hidden"
              >
                <div
                  style={{
                    width: `${wPx}px`,
                    height: `${hPx}px`,
                    transform: `scale(${fit})`,
                    transformOrigin: 'center center',
                    flexShrink: 0,
                    display: 'flex',
                    background: '#fff',
                  }}
                >
                  <div style={{ width: `${offsetPx}px`, height: `${hPx}px`, flexShrink: 0, background: '#fff' }} />
                  {isMotor
                    ? <MotorPreview wPx={innerWpx} hPx={hPx} fs={fs} has={has} borderWidth={borderWidth} borderStyle={borderStyle} borderRadius={borderRadius} padding={padding} margin={margin} />
                    : <TecidoPreview wPx={innerWpx} hPx={hPx} fs={fs} has={has} borderWidth={borderWidth} borderStyle={borderStyle} borderRadius={borderRadius} padding={padding} margin={margin} />
                  }
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 rounded-2xl bg-primary/5 border border-primary/10">
                <Layout className="w-4 h-4 text-primary shrink-0" />
                <p className="text-[10px] leading-tight text-primary/80 font-medium">
                  {isMotor
                    ? 'Layout fiel ao modelo Motor: SKU + descrição, faixa SERIE (CX/NF/NT), RNP + DATA e QR Code "Lote+SKU".'
                    : 'Layout fiel ao modelo Tecido: SKU + descrição, NFe/Lote, QTD, RNP, DATA e QR Codes (SKU e Lote).'}
                  Valores são exemplos — na impressão real serão substituídos pelos dados do registro.
                </p>
              </div>

              <div className="flex gap-3">
                <Button onClick={handleReset} variant="outline" className="flex-1 gap-2 font-bold border-dashed">
                  <RefreshCw className="w-4 h-4" /> Resetar Padrão
                </Button>
                <Button onClick={handleSave} className="flex-[2] gap-2 font-bold shadow-lg shadow-primary/20">
                  <Save className="w-4 h-4" /> Salvar Preferências
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}