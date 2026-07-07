import { useState, useRef, useLayoutEffect, useEffect } from 'react';
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
import { Type, Maximize, Layout, Save, RefreshCw, Shirt, Cog, Square, Check } from 'lucide-react';
import { toast } from 'sonner';
import { TecidoPreview, MotorPreview, LABEL_PX_PER_MM } from '@/components/labels/LabelTemplates';

type LabelKind = 'tecido' | 'motor';

const LABEL_KIND_STORAGE_KEY = 'pf_label_layout_kind_v1';

const readPersistedKind = (): LabelKind => {
  if (typeof window === 'undefined') return 'tecido';
  try {
    const v = window.localStorage.getItem(LABEL_KIND_STORAGE_KEY);
    return v === 'motor' || v === 'tecido' ? v : 'tecido';
  } catch {
    return 'tecido';
  }
};

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
  const [kind, setKind] = useState<LabelKind>(readPersistedKind);

  useEffect(() => {
    try {
      window.localStorage.setItem(LABEL_KIND_STORAGE_KEY, kind);
    } catch { /* ignore */ }
  }, [kind]);

  const isMotor = kind === 'motor';
  const fields = isMotor ? (labelSettings.motorFields ?? MOTOR_DEFAULT) : labelSettings.fields;
  const w = isMotor ? (labelSettings.motorWidth ?? 90) : labelSettings.width;
  const h = isMotor ? (labelSettings.motorHeight ?? 80) : labelSettings.height;
  const offsetMm = isMotor
    ? (labelSettings.motorPrintOffsetXMm ?? -5)
    : (labelSettings.printOffsetXMm ?? -5);
  const availableFields = isMotor ? MOTOR_FIELDS : TECIDO_FIELDS;
  const has = (id: string) => fields.includes(id);

  // Aparência (com fallback seguro)
  const borderWidth = isMotor ? (labelSettings.motorBorderWidth ?? 2) : (labelSettings.borderWidth ?? 4);
  const borderStyle = (isMotor ? labelSettings.motorBorderStyle : labelSettings.borderStyle) ?? 'solid';
  const borderRadius = isMotor ? (labelSettings.motorBorderRadius ?? 0) : (labelSettings.borderRadius ?? 0);
  const padding = isMotor ? (labelSettings.motorPadding ?? 0) : (labelSettings.padding ?? 0);
  const margin = isMotor ? (labelSettings.motorMargin ?? 0) : (labelSettings.margin ?? 0);
  const marginY = isMotor ? (labelSettings.motorMarginY ?? -4) : (labelSettings.marginY ?? -4);
  const offsetX = isMotor ? (labelSettings.motorOffsetX ?? -8) : (labelSettings.offsetX ?? -8);

  const updateAppearance = (patch: Partial<{ borderWidth: number; borderStyle: typeof borderStyle; borderRadius: number; padding: number; margin: number; marginY: number; offsetX: number; }>) => {
    if (isMotor) {
      setLabelSettings({
        ...(patch.borderWidth !== undefined ? { motorBorderWidth: patch.borderWidth } : {}),
        ...(patch.borderStyle !== undefined ? { motorBorderStyle: patch.borderStyle } : {}),
        ...(patch.borderRadius !== undefined ? { motorBorderRadius: patch.borderRadius } : {}),
        ...(patch.padding !== undefined ? { motorPadding: patch.padding } : {}),
        ...(patch.margin !== undefined ? { motorMargin: patch.margin } : {}),
        ...(patch.marginY !== undefined ? { motorMarginY: patch.marginY } : {}),
        ...(patch.offsetX !== undefined ? { motorOffsetX: patch.offsetX } : {}),
      });
    } else {
      setLabelSettings({
        ...(patch.borderWidth !== undefined ? { borderWidth: patch.borderWidth } : {}),
        ...(patch.borderStyle !== undefined ? { borderStyle: patch.borderStyle } : {}),
        ...(patch.borderRadius !== undefined ? { borderRadius: patch.borderRadius } : {}),
        ...(patch.padding !== undefined ? { padding: patch.padding } : {}),
        ...(patch.margin !== undefined ? { margin: patch.margin } : {}),
        ...(patch.marginY !== undefined ? { marginY: patch.marginY } : {}),
        ...(patch.offsetX !== undefined ? { offsetX: patch.offsetX } : {}),
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
    <div className="space-y-6 animate-fade-in">
      <Tabs value={kind} onValueChange={(v) => setKind(v as LabelKind)}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex-1 max-w-xl">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Tipo de etiqueta para imprimir
              </span>
              <span className="text-[10px] text-muted-foreground">
                Selecione para editar
              </span>
            </div>
            <TabsList className="flex h-auto w-full flex-col gap-2 bg-transparent p-0">
              {([
                { value: 'tecido', icon: Shirt, title: 'Tecidos', desc: 'Etiqueta 100×60 mm com QR de SKU e Lote.' },
                { value: 'motor', icon: Cog, title: 'Motores / Controles', desc: 'Etiqueta 60×50 mm com QR Lote+SKU.' },
              ] as const).map(({ value, icon: Icon, title, desc }) => {
                const active = kind === value;
                return (
                  <TabsTrigger
                    key={value}
                    value={value}
                    className={`group w-full items-center gap-3 rounded-md border px-3 py-3 text-left transition-all duration-200 data-[state=inactive]:bg-background/40 data-[state=inactive]:border-border/40 data-[state=active]:border-primary/50 data-[state=active]:bg-primary/5 data-[state=active]:shadow-sm hover:border-primary/40 hover:bg-primary/5 justify-start`}
                  >
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ring-1 transition-colors ${active ? 'bg-primary/15 text-primary ring-primary/30' : 'bg-muted/60 text-muted-foreground ring-border/40'}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-foreground">{title}</span>
                      <span className="block text-[11px] font-normal text-muted-foreground truncate">{desc}</span>
                    </span>
                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${active ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background'}`}>
                      {active && <Check className="h-3 w-3" strokeWidth={3} />}
                    </span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>
          <div className="flex items-center gap-2 lg:pt-7">
            <span className="text-[11px] text-muted-foreground">Padrão atual:</span>
            <span className="inline-flex items-center rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-mono font-medium text-primary">
              {isMotor ? 'Motor' : 'Tecido'} · {w}×{h} mm · {(isMotor ? (labelSettings.motorOrientation ?? labelSettings.orientation) : labelSettings.orientation) === 'landscape' ? 'Paisagem' : 'Retrato'}
            </span>
          </div>
        </div>


        <TabsContent value={kind} className="mt-4 animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-6 items-start">
            <div className="space-y-4 lg:col-span-3 order-2 lg:order-1">
              <Card className="group relative overflow-hidden border-border/40 bg-gradient-to-br from-card to-card/60 backdrop-blur-sm shadow-sm hover:shadow-xl hover:shadow-primary/5 hover:border-primary/30 transition-all duration-500 hover:-translate-y-0.5">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-9 h-9 rounded-md bg-primary/10 text-primary ring-1 ring-primary/15 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                      <Maximize className="w-4 h-4" />
                    </div>
                    <CardTitle className="text-sm font-semibold">Dimensões (mm)</CardTitle>
                  </div>
                  <CardDescription className="pl-12">
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
                    <Label className="text-xs font-bold">Orientação ({isMotor ? 'Motor' : 'Tecido'})</Label>
                    <div className="flex gap-2">
                      <Button
                        variant={(isMotor ? (labelSettings.motorOrientation ?? labelSettings.orientation) : labelSettings.orientation) === 'landscape' ? 'default' : 'outline'}
                        size="sm"
                        className="flex-1 font-bold text-xs"
                        onClick={() => setLabelSettings(isMotor ? { motorOrientation: 'landscape' } : { orientation: 'landscape' })}
                      >
                        Paisagem
                      </Button>
                      <Button
                        variant={(isMotor ? (labelSettings.motorOrientation ?? labelSettings.orientation) : labelSettings.orientation) === 'portrait' ? 'default' : 'outline'}
                        size="sm"
                        className="flex-1 font-bold text-xs"
                        onClick={() => setLabelSettings(isMotor ? { motorOrientation: 'portrait' } : { orientation: 'portrait' })}
                      >
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
                  <WebhookUrlEditor />

                </CardContent>
              </Card>

              <Card className="group relative overflow-hidden border-border/40 bg-gradient-to-br from-card to-card/60 backdrop-blur-sm shadow-sm hover:shadow-xl hover:shadow-primary/5 hover:border-primary/30 transition-all duration-500 hover:-translate-y-0.5">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-9 h-9 rounded-md bg-primary/10 text-primary ring-1 ring-primary/15 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                      <Layout className="w-4 h-4" />
                    </div>
                    <CardTitle className="text-sm font-semibold">Blocos da Etiqueta</CardTitle>
                  </div>
                  <CardDescription className="pl-12">Habilite ou desabilite cada elemento.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                    {availableFields.map((field) => {
                      const active = fields.includes(field.id);
                      return (
                        <div
                          key={field.id}
                          className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg border transition-all duration-200 cursor-pointer hover:border-primary/40 hover:bg-primary/5 ${
                            active ? 'border-primary/30 bg-primary/5' : 'border-border/40 bg-background/40'
                          }`}
                          onClick={() => handleToggleField(field.id)}
                        >
                          <Label htmlFor={`f-${kind}-${field.id}`} className="text-xs font-medium cursor-pointer flex-1">
                            {field.label}
                          </Label>
                          <Switch
                            id={`f-${kind}-${field.id}`}
                            checked={active}
                            onCheckedChange={() => handleToggleField(field.id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      );
                    })}
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

              <Card className="group relative overflow-hidden border-border/40 bg-gradient-to-br from-card to-card/60 backdrop-blur-sm shadow-sm hover:shadow-xl hover:shadow-primary/5 hover:border-primary/30 transition-all duration-500 hover:-translate-y-0.5">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-9 h-9 rounded-md bg-primary/10 text-primary ring-1 ring-primary/15 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                      <Square className="w-4 h-4" />
                    </div>
                    <CardTitle className="text-sm font-semibold">Aparência</CardTitle>
                  </div>
                  <CardDescription className="pl-12">Bordas, cantos, padding e margem da etiqueta.</CardDescription>
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
                      <span>Margem vertical (altura)</span><span className="font-mono opacity-70">{marginY}px</span>
                    </Label>
                    <Slider value={[marginY]} min={-40} max={40} step={1}
                      onValueChange={([v]) => updateAppearance({ marginY: v })} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold flex justify-between">
                      <span>Deslocamento horizontal (← →)</span><span className="font-mono opacity-70">{offsetX}px</span>
                    </Label>
                    <Slider value={[offsetX]} min={-60} max={60} step={1}
                      onValueChange={([v]) => updateAppearance({ offsetX: v })} />
                    <p className="text-[10px] opacity-60 leading-tight">Negativo desloca para a esquerda; positivo para a direita.</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-3 lg:col-span-2 order-1 lg:order-2 lg:sticky lg:top-4">
              <div className="flex items-baseline justify-between">
                <Label className="text-xs font-semibold uppercase tracking-widest opacity-60">
                  Pré-visualização — {isMotor ? 'Motores / Controles' : 'Tecidos'}
                </Label>
                <span className="text-[10px] font-mono opacity-60">
                  {w}×{h}mm · zoom {Math.round(fit * 100)}%
                </span>
              </div>
              <div
                ref={previewBoxRef}
                className="relative flex items-center justify-center p-4 bg-muted/20 rounded-md border-2 border-dashed border-border/30 h-[280px] lg:h-[360px] overflow-hidden"
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
                    ? <MotorPreview wPx={innerWpx} hPx={hPx} fs={fs} has={has} borderWidth={borderWidth} borderStyle={borderStyle} borderRadius={borderRadius} padding={padding} margin={margin} marginY={marginY} offsetX={offsetX} />
                    : <TecidoPreview wPx={innerWpx} hPx={hPx} fs={fs} has={has} borderWidth={borderWidth} borderStyle={borderStyle} borderRadius={borderRadius} padding={padding} margin={margin} marginY={marginY} offsetX={offsetX} />
                  }
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 rounded-md bg-primary/5 border border-primary/10">
                <Layout className="w-4 h-4 text-primary shrink-0" />
                <p className="text-[10px] leading-tight text-primary/80 font-medium">
                  {isMotor
                    ? 'Layout fiel ao modelo Motor: SKU + descrição, faixa SERIE (CX/NF/NT), RNP + DATA e QR Code "Lote+SKU".'
                    : 'Layout fiel ao modelo Tecido: SKU + descrição, NFe/Lote, QTD, RNP, DATA e QR Codes (SKU e Lote).'}
                  Valores são exemplos — na impressão real serão substituídos pelos dados do registro.
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="flex-1 gap-2 font-bold border-dashed h-11 rounded-md transition-all duration-300 hover:bg-destructive/5 hover:border-destructive/40 hover:text-destructive hover:-translate-y-0.5 hover:shadow-md"
                >
                  <RefreshCw className="w-4 h-4 transition-transform duration-500 group-hover:rotate-180" /> Resetar Padrão
                </Button>
                <Button
                  onClick={handleSave}
                  className="flex-[2] gap-2 font-bold h-11 rounded-md bg-gradient-to-r from-primary to-primary/85 shadow-lg shadow-primary/20 transition-all duration-300 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0"
                >
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

const DEFAULT_WEBHOOK_URL = 'http://localhost:5678/webhook/imprimir-etiqueta';
const WEBHOOK_LS_KEY = 'n8n_webhook_url';

function WebhookUrlEditor() {
  const [value, setValue] = useState<string>(() => {
    if (typeof localStorage === 'undefined') return '';
    return localStorage.getItem(WEBHOOK_LS_KEY) || '';
  });
  const [saved, setSaved] = useState(false);

  const effective = (value.trim() || DEFAULT_WEBHOOK_URL);
  let urlError = '';
  if (value.trim()) {
    try {
      const u = new URL(value.trim());
      if (u.protocol !== 'http:' && u.protocol !== 'https:') urlError = 'Use http:// ou https://';
    } catch {
      urlError = 'URL inválida';
    }
  }

  const handleSave = () => {
    if (urlError) {
      toast.error(urlError);
      return;
    }
    const v = value.trim();
    try {
      if (v) localStorage.setItem(WEBHOOK_LS_KEY, v);
      else localStorage.removeItem(WEBHOOK_LS_KEY);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
      toast.success(v ? 'Webhook do n8n atualizado' : 'Webhook restaurado para o padrão');
    } catch (e) {
      toast.error('Não foi possível salvar o webhook');
    }
  };

  const handleReset = () => {
    setValue('');
    try { localStorage.removeItem(WEBHOOK_LS_KEY); } catch { /* noop */ }
    toast.success('Webhook restaurado para o padrão');
  };

  return (
    <div className="space-y-2 pt-2 rounded-md border border-dashed border-border/50 bg-muted/20 px-2.5 py-2">
      <Label className="text-xs font-bold">Webhook n8n</Label>
      <p className="text-[10px] opacity-70 leading-tight">
        URL do endpoint do n8n que recebe a etiqueta. Deixe vazio para usar o padrão.
      </p>
      <Input
        type="url"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={DEFAULT_WEBHOOK_URL}
        className="h-8 text-xs font-mono"
        spellCheck={false}
        autoComplete="off"
      />
      {urlError && (
        <p className="text-[10px] text-destructive">{urlError}</p>
      )}
      <p className="text-[10px] font-mono opacity-70 break-all">
        Em uso: {effective}
      </p>
      <div className="flex gap-2 pt-1">
        <Button
          size="sm"
          className="h-7 text-[11px] font-bold gap-1"
          onClick={handleSave}
          disabled={!!urlError}
        >
          {saved ? <Check className="w-3 h-3" /> : <Save className="w-3 h-3" />}
          {saved ? 'Salvo' : 'Salvar'}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-[11px] gap-1"
          onClick={handleReset}
        >
          <RefreshCw className="w-3 h-3" /> Padrão
        </Button>
      </div>
    </div>
  );
}

