import { useState, useRef, useLayoutEffect, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Type, Maximize, Layout, Save, RefreshCw, Shirt, Cog, Square, Check, Plus, Minus, RotateCcw, Barcode, AlignLeft, Receipt, Package, MapPin, Calendar, QrCode, Hash, Box, Fingerprint, Ruler, LayoutGrid, Palette, Truck, Info } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { toast } from 'sonner';
import { TecidoPreview, MotorPreview, LABEL_PX_PER_MM } from '@/components/labels/LabelTemplates';
import { saveGlobalSetting, GLOBAL_PRINT_CONFIG_KEY } from '@/hooks/useGlobalSettings';

type LabelKind = 'tecido' | 'motor' | 'expedicao';

const LABEL_KIND_STORAGE_KEY = 'pf_label_layout_kind_v1';

const readPersistedKind = (): LabelKind => {
  if (typeof window === 'undefined') return 'tecido';
  try {
    const v = window.localStorage.getItem(LABEL_KIND_STORAGE_KEY);
    return v === 'motor' || v === 'tecido' || v === 'expedicao' ? v : 'tecido';
  } catch {
    return 'tecido';
  }
};

const TECIDO_FIELDS: { id: string; label: string; icon: LucideIcon; hint: string }[] = [
  { id: 'sku', label: 'SKU (Código)', icon: Barcode, hint: 'Código do produto' },
  { id: 'descricao', label: 'Descrição do Item', icon: AlignLeft, hint: 'Nome / descrição' },
  { id: 'nfe', label: 'NFe / Lote', icon: Receipt, hint: 'Nota fiscal e lote' },
  { id: 'qtd', label: 'Quantidade (QTD)', icon: Package, hint: 'Quantidade da peça' },
  { id: 'rnp', label: 'RNP (Endereço)', icon: MapPin, hint: 'Endereço no estoque' },
  { id: 'data', label: 'Data', icon: Calendar, hint: 'Data da conferência' },
  { id: 'qr_sku', label: 'QR Code SKU', icon: QrCode, hint: 'QR do código' },
  { id: 'qr_lote', label: 'QR Code Lote', icon: QrCode, hint: 'QR do lote' },
];

const MOTOR_FIELDS: { id: string; label: string; icon: LucideIcon; hint: string }[] = [
  { id: 'sku', label: 'SKU (Código)', icon: Barcode, hint: 'Código do motor' },
  { id: 'descricao', label: 'Descrição do Motor', icon: AlignLeft, hint: 'Modelo / descrição' },
  { id: 'serie', label: 'Faixa SERIE', icon: Hash, hint: 'Intervalo de série' },
  { id: 'cx', label: 'Nº da Caixa (CX)', icon: Box, hint: 'Caixa de origem' },
  { id: 'nf', label: 'Nota Fiscal (NF)', icon: Receipt, hint: 'Número da NF' },
  { id: 'nt', label: 'Nº de Série (NT)', icon: Fingerprint, hint: 'Série individual' },
  { id: 'rnp', label: 'RNP (Endereço)', icon: MapPin, hint: 'Endereço no estoque' },
  { id: 'data', label: 'Data', icon: Calendar, hint: 'Data da conferência' },
  { id: 'qr_lote_sku', label: 'QR Code Lote+SKU', icon: QrCode, hint: 'QR combinado' },
];

const TECIDO_DEFAULT = ['sku', 'descricao', 'nfe', 'qtd', 'rnp', 'data', 'qr_sku', 'qr_lote'];
const MOTOR_DEFAULT = ['sku', 'descricao', 'serie', 'cx', 'nf', 'nt', 'rnp', 'data', 'qr_lote_sku'];

export default function LabelLayoutPanel() {
  const { role } = useAuth();
  const isAdmin = role === 'admin' || role === 'supervisor';
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
  const offsetYMm = isMotor
    ? (labelSettings.motorPrintOffsetYMm ?? 0)
    : (labelSettings.printOffsetYMm ?? 0);
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
  const updateOffsetY = (value: number) =>
    setLabelSettings(isMotor ? { motorPrintOffsetYMm: value } : { printOffsetYMm: value });

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
  const offsetXPx = offsetMm * LABEL_PX_PER_MM;
  const offsetYPx = offsetYMm * LABEL_PX_PER_MM;

  const previewBoxRef = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState(1);

  useLayoutEffect(() => {
    const el = previewBoxRef.current;
    if (!el) return;
    const recalc = () => {
      const padding = 48; // p-6 nas duas direções
      const availW = Math.max(0, el.clientWidth - padding);
      const availH = Math.max(0, el.clientHeight - padding);
      if (availW <= 0 || availH <= 0) return;
      // Permite escalar até 1.2x para melhor legibilidade quando há espaço,
      // sem perder fidelidade (é apenas zoom visual — o PNG é gerado em 1:1).
      const next = Math.min(availW / wPx, availH / hPx, 1.2);
      setFit(next > 0 ? next : 1);
    };
    recalc();
    const ro = new ResizeObserver(recalc);
    ro.observe(el);
    window.addEventListener('resize', recalc);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', recalc);
    };
  }, [wPx, hPx]);

  return (
    <div className="animate-fade-in relative">
      {!isAdmin && (
        <div className="mb-4 rounded-md bg-primary/5 border border-primary/20 p-3 text-xs text-muted-foreground flex items-center gap-2">
          <Info className="h-4 w-4 text-primary" />
          <span>Estas configurações são gerenciadas pelo administrador e aplicadas a todos os usuários.</span>
        </div>
      )}
      <Tabs value={kind} onValueChange={(v) => setKind(v as LabelKind)}>
        {/* Header compacto: seletor horizontal + info do padrão */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-3">
          <div className="flex-1 min-w-0">
            <span className="block mb-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Tipo de etiqueta
            </span>
            <TabsList className="inline-flex h-auto w-full sm:w-auto gap-1 bg-muted/40 p-1 rounded-md">
              {([
                { value: 'tecido', icon: Shirt, title: 'Tecidos', size: '100×60' },
                { value: 'motor', icon: Cog, title: 'Motores / Controles', size: '60×50' },
                { value: 'expedicao', icon: Truck, title: 'Expedição (ZPL)', size: 'template' },
              ] as const).map(({ value, icon: Icon, title, size }) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  className="flex-1 sm:flex-initial gap-2 px-3 py-2 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary"
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{title}</span>
                  <span className="hidden md:inline text-[10px] font-mono opacity-60">{size}{size !== 'template' ? 'mm' : ''}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] text-muted-foreground">Atual:</span>
            <span className="inline-flex items-center rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-mono font-medium text-primary">
              {kind === 'expedicao'
                ? 'Ajustes globais · dim. do template'
                : `${w}×${h}mm · ${(isMotor ? (labelSettings.motorOrientation ?? labelSettings.orientation) : labelSettings.orientation) === 'landscape' ? 'Paisagem' : 'Retrato'}`}
            </span>
          </div>
        </div>



        {kind !== 'expedicao' && (
        <TabsContent value={kind} className="mt-0 animate-fade-in">
          {/*
            Split panel: em desktop, altura fixa do viewport com duas colunas.
            A coluna de controles rola independentemente; o preview permanece
            SEMPRE VISÍVEL à direita — sem sticky, sem depender de scroll da
            página, sem quebrar por overflow de ancestrais.
          */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-6 lg:h-[calc(100vh-15rem)] lg:min-h-[560px]">
            <div className={cn(
              "space-y-4 lg:col-span-3 order-2 lg:order-1 lg:overflow-y-auto lg:pr-3 lg:-mr-2",
              !isAdmin && "pointer-events-none opacity-80"
            )}>

              <Card className="settings-card rounded-md border border-border bg-card shadow-sm overflow-hidden">
                <CardHeader className="p-5 border-b border-border/40 space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-primary/10 border border-primary/20 text-primary shrink-0">
                      <Ruler className="w-4 h-4" />
                    </div>
                    <CardTitle className="text-sm font-semibold tracking-tight text-foreground">Dimensões (mm)</CardTitle>
                  </div>
                  <CardDescription className="text-xs text-muted-foreground pl-11">
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
                    <Label className="text-xs font-bold">Offset de impressão (mm)</Label>
                    <div className="grid grid-cols-2 gap-3 max-w-md">
                      <div className="space-y-1">
                        <span className="block text-[10px] font-semibold uppercase tracking-wide opacity-70">
                          Eixo X — horizontal
                        </span>
                        <OffsetInput
                          value={offsetMm}
                          onChange={updateOffset}
                          ariaLabel="Offset X em milímetros"
                        />
                        <p className="text-[10px] leading-tight opacity-70">
                          <span className="font-semibold text-foreground">−</span> desloca para a <b>esquerda ←</b><br />
                          <span className="font-semibold text-foreground">+</span> desloca para a <b>direita →</b>
                        </p>
                      </div>
                      <div className="space-y-1">
                        <span className="block text-[10px] font-semibold uppercase tracking-wide opacity-70">
                          Eixo Y — vertical
                        </span>
                        <OffsetInput
                          value={offsetYMm}
                          onChange={updateOffsetY}
                          ariaLabel="Offset Y em milímetros"
                        />
                        <p className="text-[10px] leading-tight opacity-70">
                          <span className="font-semibold text-foreground">−</span> desloca para <b>cima ↑</b><br />
                          <span className="font-semibold text-foreground">+</span> desloca para <b>baixo ↓</b>
                        </p>
                      </div>
                    </div>
                    <p className="text-[10px] opacity-60 leading-tight pt-1">
                      Use os botões <b>−</b> / <b>+</b> para ajuste fino de <span className="font-mono">0,5mm</span>, ou digite direto (aceita negativos, ex: <span className="font-mono">-2.5</span>). Setas ↑/↓ do teclado também ajustam.
                    </p>
                  </div>

                  {isAdmin && (
                    <>
                      <WebhookUrlEditor />
                      <SilentPrintPanel />
                    </>
                  )}

                </CardContent>
              </Card>

              <Card className="settings-card rounded-md border border-border bg-card shadow-sm overflow-hidden">
                <CardHeader className="p-5 border-b border-border/40 space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-primary/10 border border-primary/20 text-primary shrink-0">
                      <LayoutGrid className="w-4 h-4" />
                    </div>
                    <CardTitle className="text-sm font-semibold tracking-tight text-foreground">Blocos da Etiqueta</CardTitle>
                  </div>
                  <CardDescription className="text-xs text-muted-foreground pl-11">Habilite ou desabilite cada elemento.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {availableFields.map((field) => {
                      const active = fields.includes(field.id);
                      const Icon = field.icon;
                      return (
                        <button
                          type="button"
                          key={field.id}
                          onClick={() => handleToggleField(field.id)}
                          aria-pressed={active}
                          className={`group/item flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-all duration-200 ${
                            active
                              ? 'border-primary/40 bg-primary/[0.06] shadow-[0_1px_0_hsl(var(--primary)/0.08)]'
                              : 'border-border/50 bg-background/40 hover:border-primary/30 hover:bg-primary/[0.03]'
                          }`}
                        >
                          <div
                            className={`shrink-0 w-8 h-8 rounded-md flex items-center justify-center border transition-colors ${
                              active
                                ? 'bg-primary/10 border-primary/25 text-primary'
                                : 'bg-muted/40 border-border/40 text-muted-foreground group-hover/item:text-foreground'
                            }`}
                          >
                            <Icon className="w-4 h-4" strokeWidth={2} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className={`text-xs font-semibold truncate ${active ? 'text-foreground' : 'text-foreground/80'}`}>
                              {field.label}
                            </div>
                            <div className="text-[10px] text-muted-foreground/80 truncate">
                              {field.hint}
                            </div>
                          </div>
                          <Switch
                            id={`f-${kind}-${field.id}`}
                            checked={active}
                            onCheckedChange={() => handleToggleField(field.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="shrink-0"
                          />
                        </button>
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

              <Card className="settings-card rounded-md border border-border bg-card shadow-sm overflow-hidden">
                <CardHeader className="p-5 border-b border-border/40 space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-primary/10 border border-primary/20 text-primary shrink-0">
                      <Palette className="w-4 h-4" />
                    </div>
                    <CardTitle className="text-sm font-semibold tracking-tight text-foreground">Aparência</CardTitle>
                  </div>
                  <CardDescription className="text-xs text-muted-foreground pl-11">Bordas, cantos, padding e margem da etiqueta.</CardDescription>
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

            <div className="lg:col-span-2 order-1 lg:order-2 flex flex-col gap-3 lg:h-full lg:min-h-0">
              <div className="flex items-baseline justify-between shrink-0">
                <Label className="text-xs font-semibold uppercase tracking-widest opacity-60">
                  Pré-visualização — {isMotor ? 'Motores / Controles' : 'Tecidos'}
                </Label>
                <span className="text-[10px] font-mono opacity-60">
                  {w}×{h}mm · escala 1:1 · zoom {Math.round(fit * 100)}%
                </span>
              </div>
              <div
                ref={previewBoxRef}
                className="relative flex items-center justify-center p-6 rounded-lg border-2 border-dashed border-border/50 h-[300px] sm:h-[380px] lg:h-auto lg:flex-1 lg:min-h-0 overflow-hidden shadow-inner"
                style={{
                  // Fundo xadrez tipo "mesa de trabalho" para diferenciar a
                  // etiqueta branca do fundo escuro do app e reforçar a
                  // percepção de escala física.
                  backgroundColor: 'hsl(var(--muted) / 0.55)',
                  backgroundImage:
                    'linear-gradient(45deg, hsl(var(--foreground) / 0.06) 25%, transparent 25%), linear-gradient(-45deg, hsl(var(--foreground) / 0.06) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, hsl(var(--foreground) / 0.06) 75%), linear-gradient(-45deg, transparent 75%, hsl(var(--foreground) / 0.06) 75%)',
                  backgroundSize: '16px 16px',
                  backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
                }}
              >
                <div
                  style={{
                    width: `${wPx}px`,
                    height: `${hPx}px`,
                    transform: `scale(${fit})`,
                    transformOrigin: 'center center',
                    flexShrink: 0,
                    position: 'relative',
                    background: '#fff',
                    overflow: 'hidden',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.35), 0 2px 6px rgba(0,0,0,0.2)',
                    outline: '1px solid rgba(0,0,0,0.15)',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      transform: `translate(${offsetXPx}px, ${offsetYPx}px)`,
                    }}
                  >
                    {isMotor
                      ? <MotorPreview wPx={wPx} hPx={hPx} fs={fs} has={has} borderWidth={borderWidth} borderStyle={borderStyle} borderRadius={borderRadius} padding={padding} margin={margin} marginY={marginY} offsetX={offsetX} />
                      : <TecidoPreview wPx={wPx} hPx={hPx} fs={fs} has={has} borderWidth={borderWidth} borderStyle={borderStyle} borderRadius={borderRadius} padding={padding} margin={margin} marginY={marginY} offsetX={offsetX} />
                    }
                  </div>
                </div>
                <div className="absolute bottom-2 right-2 flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-background/80 backdrop-blur-sm border border-border/40 text-[9px] font-mono opacity-80">
                  <span className="inline-block w-3 h-[2px] bg-foreground/70" />
                  {Math.round(10 * fit)}px ≈ 10mm
                </div>
              </div>


              <div className="flex items-center gap-2 p-3 rounded-md bg-primary/5 border border-primary/10 shrink-0">
                <Layout className="w-4 h-4 text-primary shrink-0" />
                <p className="text-[10px] leading-tight text-primary/80 font-medium">
                  {isMotor
                    ? 'Layout fiel ao modelo Motor: SKU + descrição, faixa SERIE (CX/NF/NT), RNP + DATA e QR Code "Lote+SKU".'
                    : 'Layout fiel ao modelo Tecido: SKU + descrição, NFe/Lote, QTD, RNP, DATA e QR Codes (SKU e Lote).'}
                  Valores são exemplos — na impressão real serão substituídos pelos dados do registro.
                </p>
              </div>

              <div className="flex gap-3 shrink-0">
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="flex-1 gap-2 h-10 rounded-md font-medium text-xs hover:bg-destructive/5 hover:border-destructive/40 hover:text-destructive"
                >
                  <RefreshCw className="w-4 h-4" /> Resetar Padrão
                </Button>
                <Button
                  onClick={handleSave}
                  className="flex-[2] gap-2 h-10 rounded-md font-medium text-xs"
                >
                  <Save className="w-4 h-4" /> Salvar Preferências
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
        )}


        <TabsContent value="expedicao" className="mt-0 animate-fade-in">
          <ExpedicaoLayoutSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/**
 * Ajustes finos para a impressão de etiquetas de Expedição (ZPL dinâmico).
 * Como as dimensões da etiqueta vêm do próprio template, aqui só expomos os
 * ajustes que valem para qualquer template: offset X/Y, borda e padding.
 */
export function ExpedicaoLayoutSection() {
  const { labelSettings, setLabelSettings } = useAppStore();
  const offsetX = labelSettings.expedicaoPrintOffsetXMm ?? 0;
  const offsetY = labelSettings.expedicaoPrintOffsetYMm ?? 0;
  const borderWidth = labelSettings.expedicaoBorderWidth ?? 0;
  const borderStyle = labelSettings.expedicaoBorderStyle ?? 'none';
  const borderRadius = labelSettings.expedicaoBorderRadius ?? 0;
  const padding = labelSettings.expedicaoPadding ?? 0;
  const lineThickness = labelSettings.expedicaoLineThickness ?? 2;
  const lineStyle = labelSettings.expedicaoLineStyle ?? 'solid';
  const lineColor = labelSettings.expedicaoLineColor ?? '#111111';
  const fontFamily = labelSettings.expedicaoFontFamily ?? 'monospace';

  const handleReset = () => {
    setLabelSettings({
      expedicaoPrintOffsetXMm: 0,
      expedicaoPrintOffsetYMm: 0,
      expedicaoBorderWidth: 0,
      expedicaoBorderStyle: 'none',
      expedicaoBorderRadius: 0,
      expedicaoPadding: 0,
      expedicaoLineThickness: 2,
      expedicaoLineStyle: 'solid',
      expedicaoLineColor: '#111111',
      expedicaoFontFamily: 'monospace',
    });
    toast.info('Ajustes de Expedição redefinidos.');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-6 animate-fade-in">
      <div className="space-y-4 lg:col-span-3">
        <Card className="settings-card rounded-md border border-border bg-card shadow-sm overflow-hidden">
          <CardHeader className="p-5 border-b border-border/40 space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-primary/10 border border-primary/20 text-primary shrink-0">
                <Maximize className="w-4 h-4" />
              </div>
              <CardTitle className="text-sm font-semibold tracking-tight text-foreground">Deslocamento de impressão</CardTitle>
            </div>
            <CardDescription className="text-xs text-muted-foreground pl-11">
              Ajuste fino em milímetros para compensar margens da impressora. Vale para todos os templates da Expedição.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label className="text-xs font-bold flex justify-between">
                <span>Offset X (mm) — horizontal</span>
                <span className="font-mono opacity-70">{offsetX.toFixed(1)}mm</span>
              </Label>
              <Slider value={[offsetX]} min={-15} max={15} step={0.5}
                onValueChange={([v]) => setLabelSettings({ expedicaoPrintOffsetXMm: v })} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold flex justify-between">
                <span>Offset Y (mm) — vertical</span>
                <span className="font-mono opacity-70">{offsetY.toFixed(1)}mm</span>
              </Label>
              <Slider value={[offsetY]} min={-15} max={15} step={0.5}
                onValueChange={([v]) => setLabelSettings({ expedicaoPrintOffsetYMm: v })} />
            </div>
          </CardContent>
        </Card>

        <Card className="settings-card rounded-md border border-border bg-card shadow-sm overflow-hidden">
          <CardHeader className="p-5 border-b border-border/40 space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-primary/10 border border-primary/20 text-primary shrink-0">
                <Palette className="w-4 h-4" />
              </div>
              <CardTitle className="text-sm font-semibold tracking-tight text-foreground">Aparência</CardTitle>
            </div>
            <CardDescription className="text-xs text-muted-foreground pl-11">Bordas e padding aplicados por cima da etiqueta ZPL.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label className="text-xs font-bold flex justify-between">
                <span>Espessura da borda</span><span className="font-mono opacity-70">{borderWidth}px</span>
              </Label>
              <Slider value={[borderWidth]} min={0} max={12} step={1}
                onValueChange={([v]) => setLabelSettings({ expedicaoBorderWidth: v })} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold">Estilo da borda</Label>
              <Select value={borderStyle} onValueChange={(v) => setLabelSettings({ expedicaoBorderStyle: v as typeof borderStyle })}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem borda</SelectItem>
                  <SelectItem value="solid">Sólida</SelectItem>
                  <SelectItem value="dashed">Tracejada</SelectItem>
                  <SelectItem value="dotted">Pontilhada</SelectItem>
                  <SelectItem value="double">Dupla</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold flex justify-between">
                <span>Raio dos cantos</span><span className="font-mono opacity-70">{borderRadius}px</span>
              </Label>
              <Slider value={[borderRadius]} min={0} max={40} step={1}
                onValueChange={([v]) => setLabelSettings({ expedicaoBorderRadius: v })} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold flex justify-between">
                <span>Espaçamento interno (padding)</span><span className="font-mono opacity-70">{padding}px</span>
              </Label>
              <Slider value={[padding]} min={0} max={40} step={1}
                onValueChange={([v]) => setLabelSettings({ expedicaoPadding: v })} />
            </div>
          </CardContent>
        </Card>

        <Card className="settings-card rounded-md border border-border bg-card shadow-sm overflow-hidden">
          <CardHeader className="p-5 border-b border-border/40 space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-primary/10 border border-primary/20 text-primary shrink-0">
                <Palette className="w-4 h-4" />
              </div>
              <CardTitle className="text-sm font-semibold tracking-tight text-foreground">Linhas internas</CardTitle>
            </div>
            <CardDescription className="text-xs text-muted-foreground pl-11">
              Espessura, estilo e cor das linhas e caixas (comando <code>^GB</code>) desenhadas dentro da etiqueta.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label className="text-xs font-bold flex justify-between">
                <span>Espessura da linha</span><span className="font-mono opacity-70">{lineThickness}px</span>
              </Label>
              <Slider value={[lineThickness]} min={0} max={8} step={1}
                onValueChange={([v]) => setLabelSettings({ expedicaoLineThickness: v })} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold">Estilo da linha</Label>
              <Select value={lineStyle} onValueChange={(v) => setLabelSettings({ expedicaoLineStyle: v as typeof lineStyle })}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="solid">Sólida</SelectItem>
                  <SelectItem value="dashed">Tracejada</SelectItem>
                  <SelectItem value="dotted">Pontilhada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold">Cor da linha</Label>
              <Select value={lineColor} onValueChange={(v) => setLabelSettings({ expedicaoLineColor: v })}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="#111111">Preto</SelectItem>
                  <SelectItem value="#374151">Cinza escuro</SelectItem>
                  <SelectItem value="#6b7280">Cinza médio</SelectItem>
                  <SelectItem value="#9ca3af">Cinza claro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="settings-card rounded-md border border-border bg-card shadow-sm overflow-hidden">
          <CardHeader className="p-5 border-b border-border/40 space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-primary/10 border border-primary/20 text-primary shrink-0">
                <Palette className="w-4 h-4" />
              </div>
              <CardTitle className="text-sm font-semibold tracking-tight text-foreground">Fonte da etiqueta</CardTitle>
            </div>
            <CardDescription className="text-xs text-muted-foreground pl-11">
              Família de fonte aplicada aos textos do preview e do PNG enviado à impressora.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label className="text-xs font-bold">Família</Label>
              <Select value={fontFamily} onValueChange={(v) => setLabelSettings({ expedicaoFontFamily: v })}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="monospace">Monospace (padrão)</SelectItem>
                  <SelectItem value="'IBM Plex Mono', monospace">IBM Plex Mono</SelectItem>
                  <SelectItem value="'IBM Plex Sans', sans-serif">IBM Plex Sans</SelectItem>
                  <SelectItem value="Arial, sans-serif">Arial</SelectItem>
                  <SelectItem value="'Courier New', Courier, monospace">Courier</SelectItem>
                  <SelectItem value="Georgia, serif">Georgia (serif)</SelectItem>
                  <SelectItem value="system-ui, sans-serif">System UI</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground" style={{ fontFamily }}>
                Amostra: EXPEDIÇÃO 001 — Ordem #12345
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-2 flex flex-col gap-3">
        <div className="rounded-lg border border-primary/15 bg-primary/5 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold text-primary">Impressão de Expedição</span>
          </div>
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            As etiquetas de expedição usam templates ZPL dinâmicos criados na Central de Etiquetas —
            largura, altura e conteúdo vêm de cada template. Estes ajustes se aplicam globalmente
            no momento da impressão, usando o mesmo pipeline (PNG + fontes embutidas) das
            etiquetas de tecido/motor.
          </p>
          <p className="text-[10px] leading-tight text-muted-foreground opacity-80">
            Dica: se a etiqueta sair cortada, ajuste primeiro o <b>Offset X/Y</b>. Use bordas/padding
            apenas se precisar de um "reforço" visual em cima do ZPL.
          </p>
        </div>

        <Button
          onClick={handleReset}
          variant="outline"
          className="gap-2 h-10 rounded-md font-medium text-xs hover:bg-destructive/5 hover:border-destructive/40 hover:text-destructive"
        >
          <RefreshCw className="w-4 h-4" /> Resetar ajustes de Expedição
        </Button>
      </div>
    </div>
  );
}

const DEFAULT_WEBHOOK_URL = 'https://primary-production-162eb.up.railway.app/webhook/imprimir-etiqueta';
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

  const persistGlobal = (webhookUrl: string | null) => {
    const silentPrint = (() => {
      try { return localStorage.getItem('pref_silent_browser_print') === 'true'; } catch { return false; }
    })();
    saveGlobalSetting(GLOBAL_PRINT_CONFIG_KEY, { webhookUrl, silentPrint })
      .catch((e) => console.warn('[global-settings] webhook', e));
  };

  const handleSave = () => {
    if (urlError) {
      toast.error(urlError);
      return;
    }
    const v = value.trim();
    try {
      if (v) localStorage.setItem(WEBHOOK_LS_KEY, v);
      else localStorage.removeItem(WEBHOOK_LS_KEY);
      persistGlobal(v || null);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
      toast.success(v ? 'Webhook do n8n atualizado para todos' : 'Webhook restaurado para o padrão');
    } catch (e) {
      toast.error('Não foi possível salvar o webhook');
    }
  };

  const handleReset = () => {
    setValue('');
    try { localStorage.removeItem(WEBHOOK_LS_KEY); } catch { /* noop */ }
    persistGlobal(null);
    toast.success('Webhook restaurado para o padrão');
  };


  return (
    <div className="space-y-2 pt-2 rounded-md border border-dashed border-border/50 bg-muted/20 px-2.5 py-2">
      <Label className="text-xs font-bold">URL do Webhook (Impressão Remota)</Label>
      <p className="text-[10px] opacity-70 leading-tight">
        Este será o URL padrão para impressão de etiquetas no pente-fino. Altere de forma global e para todos os usuários.
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

/**
 * Input numérico especializado para offset (mm).
 *
 * Corrige o bug do <Input type="number" value={number}> controlado: quando o
 * usuário selecionava "0" e tentava digitar por cima (ou apagar para digitar
 * "-"), o parse instantâneo com `Number("")`/`Number("-")` = NaN → 0 travava
 * a edição. Aqui mantemos um estado LOCAL de string enquanto o campo está em
 * foco / rascunho, e só propagamos ao store quando o valor é numérico válido.
 *
 * Também traz botões ± com passo fino (0.5mm) para ajuste sem teclado.
 */
interface OffsetInputProps {
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  max?: number;
  ariaLabel?: string;
}

function OffsetInput({ value, onChange, step = 0.5, min = -50, max = 50, ariaLabel }: OffsetInputProps) {
  const [draft, setDraft] = useState<string>(() => String(value));
  const focused = useRef(false);

  // Sincroniza quando o valor externo muda e o campo NÃO está em edição.
  useEffect(() => {
    if (!focused.current) setDraft(String(value));
  }, [value]);

  const clamp = (n: number) => Math.min(max, Math.max(min, n));

  const commit = (raw: string) => {
    const cleaned = raw.trim().replace(',', '.');
    if (cleaned === '' || cleaned === '-' || cleaned === '.') {
      onChange(0);
      setDraft('0');
      return;
    }
    const n = Number(cleaned);
    if (Number.isFinite(n)) {
      const c = clamp(n);
      onChange(c);
      setDraft(String(c));
    } else {
      setDraft(String(value));
    }
  };

  const bump = (delta: number) => {
    const next = clamp(Number((value + delta).toFixed(2)));
    onChange(next);
    setDraft(String(next));
  };

  const isZero = value === 0;

  return (
    <div className="flex items-stretch h-9 rounded-md border border-input bg-background shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-ring focus-within:border-ring transition-all">
      <button
        type="button"
        aria-label={`Diminuir ${ariaLabel ?? ''}`}
        onClick={() => bump(-step)}
        className="w-9 flex items-center justify-center border-r border-input bg-muted/40 hover:bg-primary/10 hover:text-primary active:bg-primary/20 transition-colors text-muted-foreground"
      >
        <Minus className="w-3.5 h-3.5" strokeWidth={2.5} />
      </button>
      <input
        type="text"
        inputMode="decimal"
        aria-label={ariaLabel}
        value={draft}
        onFocus={(e) => {
          focused.current = true;
          // Seleciona tudo — permite sobrescrever "0" digitando direto.
          requestAnimationFrame(() => e.target.select());
        }}
        onBlur={(e) => {
          focused.current = false;
          commit(e.target.value);
        }}
        onChange={(e) => {
          const v = e.target.value;
          // Aceita rascunhos válidos: vazio, "-", "-.", "1.", "-1.2" etc.
          if (/^-?\d*\.?\d*$/.test(v)) {
            setDraft(v);
            if (v !== '' && v !== '-' && v !== '.' && v !== '-.') {
              const n = Number(v);
              if (Number.isFinite(n)) onChange(clamp(n));
            }
          }
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowUp') { e.preventDefault(); bump(step); }
          else if (e.key === 'ArrowDown') { e.preventDefault(); bump(-step); }
          else if (e.key === 'Enter') { (e.target as HTMLInputElement).blur(); }
        }}
        className="flex-1 min-w-0 px-2 text-center font-mono text-sm bg-transparent outline-none tabular-nums"
      />
      <div className="flex items-center px-1.5 text-[10px] font-mono opacity-50 border-l border-input select-none">mm</div>
      <button
        type="button"
        aria-label={`Zerar ${ariaLabel ?? ''}`}
        onClick={() => { onChange(0); setDraft('0'); }}
        disabled={isZero}
        className="w-8 flex items-center justify-center border-l border-input bg-muted/40 hover:bg-primary/10 hover:text-primary active:bg-primary/20 transition-colors text-muted-foreground disabled:opacity-40 disabled:cursor-not-allowed"
        title="Zerar"
      >
        <RotateCcw className="w-3 h-3" strokeWidth={2.5} />
      </button>
      <button
        type="button"
        aria-label={`Aumentar ${ariaLabel ?? ''}`}
        onClick={() => bump(step)}
        className="w-9 flex items-center justify-center border-l border-input bg-muted/40 hover:bg-primary/10 hover:text-primary active:bg-primary/20 transition-colors text-muted-foreground"
      >
        <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
      </button>
    </div>
  );
}

const SILENT_PRINT_KEY = 'pref_silent_browser_print';

/**
 * Painel de impressão silenciosa (modo kiosk-printing do Chrome/Edge).
 *
 * A impressão realmente sem diálogo pelo navegador só funciona quando o
 * Chrome/Edge é iniciado com a flag `--kiosk-printing`. Este painel expõe o
 * toggle da preferência e um passo-a-passo para configurar o atalho.
 */
function SilentPrintPanel() {
  const [enabled, setEnabled] = useState<boolean>(() => {
    if (typeof localStorage === 'undefined') return false;
    return localStorage.getItem(SILENT_PRINT_KEY) === 'true';
  });

  const toggle = (v: boolean) => {
    setEnabled(v);
    try {
      if (v) localStorage.setItem(SILENT_PRINT_KEY, 'true');
      else localStorage.removeItem(SILENT_PRINT_KEY);
      const webhookUrl = localStorage.getItem('n8n_webhook_url');
      saveGlobalSetting(GLOBAL_PRINT_CONFIG_KEY, { webhookUrl: webhookUrl || null, silentPrint: v })
        .catch((e) => console.warn('[global-settings] impressão silenciosa', e));
      toast.success(v
        ? 'Impressão direta habilitada'
        : 'Impressão direta desabilitada');
    } catch { /* noop */ }
  };

  return (
    <div className="space-y-2 pt-2 rounded-md border border-dashed border-primary/30 bg-primary/5 px-2.5 py-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <Label className="text-xs font-bold flex items-center gap-1.5">
            🖨️ Impressão Direta (sem diálogo)
          </Label>
          <p className="text-[10px] opacity-70 leading-tight mt-0.5">
            Tenta imprimir diretamente na impressora padrão sem mostrar o diálogo do navegador. 
          </p>
        </div>
        <Switch checked={enabled} onCheckedChange={toggle} />
      </div>
    </div>
  );
}



