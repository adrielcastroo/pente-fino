import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Type, Maximize, Layout, Save, RefreshCw, Shirt, Cog } from 'lucide-react';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';

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
  { id: 'somfy', label: 'Marca Somfy' },
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

const TECIDO_DEFAULT = ['sku', 'descricao', 'nfe', 'qtd', 'rnp', 'data', 'qr_sku', 'qr_lote', 'somfy'];
const MOTOR_DEFAULT = ['sku', 'descricao', 'serie', 'cx', 'nf', 'nt', 'rnp', 'data', 'qr_lote_sku'];

export default function LabelLayoutPanel() {
  const { labelSettings, setLabelSettings } = useAppStore();
  const [kind, setKind] = useState<LabelKind>('tecido');

  const isMotor = kind === 'motor';
  const fields = isMotor ? (labelSettings.motorFields ?? MOTOR_DEFAULT) : labelSettings.fields;
  const w = isMotor ? (labelSettings.motorWidth ?? 90) : labelSettings.width;
  const h = isMotor ? (labelSettings.motorHeight ?? 80) : labelSettings.height;
  const availableFields = isMotor ? MOTOR_FIELDS : TECIDO_FIELDS;
  const has = (id: string) => fields.includes(id);

  const updateFields = (newFields: string[]) =>
    setLabelSettings(isMotor ? { motorFields: newFields } : { fields: newFields });
  const updateDim = (patch: { w?: number; h?: number }) =>
    setLabelSettings(isMotor
      ? { motorWidth: patch.w ?? w, motorHeight: patch.h ?? h }
      : { width: patch.w ?? w, height: patch.h ?? h });

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

  const scale = isMotor ? 5.2 : 3.2;
  const wPx = (labelSettings.orientation === 'landscape' ? w : h) * scale;
  const hPx = (labelSettings.orientation === 'landscape' ? h : w) * scale;
  const fs = labelSettings.fontSize;

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
                    {isMotor ? 'Padrão Motores: 60mm × 50mm.' : 'Padrão Tecidos Somfy: 100mm × 60mm.'}
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
                      <Type className="w-3.5 h-3.5" /> Tamanho Base da Fonte (pt)
                    </Label>
                    <Input type="number" value={labelSettings.fontSize}
                      onChange={(e) => setLabelSettings({ fontSize: Number(e.target.value) })}
                      className="h-9 w-24" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <Label className="text-xs font-black uppercase tracking-widest opacity-60">
                Pré-visualização — {isMotor ? 'Motores / Controles' : 'Tecidos'}
              </Label>
              <div className="flex items-center justify-center p-6 bg-muted/20 rounded-3xl border-2 border-dashed border-border/30 min-h-[420px] overflow-auto">
                {isMotor
                  ? <MotorPreview wPx={wPx} hPx={hPx} fs={fs} has={has} />
                  : <TecidoPreview wPx={wPx} hPx={hPx} fs={fs} has={has} />
                }
              </div>

              <div className="flex items-center gap-2 p-3 rounded-2xl bg-primary/5 border border-primary/10">
                <Layout className="w-4 h-4 text-primary shrink-0" />
                <p className="text-[10px] leading-tight text-primary/80 font-medium">
                  {isMotor
                    ? 'Layout fiel ao modelo Motor Somfy: SKU + descrição, faixa SERIE (CX/NF/NT), RNP + DATA e QR Code "Lote+SKU".'
                    : 'Layout fiel ao modelo Tecido Somfy: SKU + descrição, NFe/Lote, QTD, RNP, DATA e QR Codes (SKU e Lote).'}
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

function TecidoPreview({ wPx, hPx, fs, has }: { wPx: number; hPx: number; fs: number; has: (id: string) => boolean }) {
  return (
    <div style={{ width: `${wPx}px`, height: `${hPx}px`, fontSize: `${fs}px` }}
      className="bg-white text-black shadow-2xl border border-black/80 flex flex-col font-mono">
      <div className="flex border-b-2 border-black flex-[1.1]">
        <div className="flex-1 p-2 flex flex-col justify-start overflow-hidden border-r-2 border-black">
          {has('sku') && (
            <div className="font-black tracking-tight leading-none truncate" style={{ fontSize: `${fs * 1.8}px` }}>
              002.001.002.000.323
            </div>
          )}
          {has('descricao') && (
            <div className="mt-1 leading-tight line-clamp-2 overflow-hidden" style={{ fontSize: `${fs * 0.95}px` }}>
              VB.Mot. Interruptor Inis Uno (1800492 persi. 2/25) (C)<br />
              PCT1 (T.V.) (2)F0085
            </div>
          )}
        </div>
        {has('qr_sku') && (
          <div className="w-[22%] flex flex-col items-center justify-center p-1">
            <QRCodeSVG value="SKU-002001002000323" size={hPx * 0.22} level="M" />
            <div className="font-bold mt-0.5" style={{ fontSize: `${fs * 0.8}px` }}>SKU</div>
          </div>
        )}
      </div>
      {has('nfe') && (
        <div className="border-b-2 border-black px-2 py-1 flex items-center gap-2 flex-[0.6] overflow-hidden">
          <span className="bg-black text-white font-bold px-1.5 py-0.5 shrink-0" style={{ fontSize: `${fs * 0.75}px` }}>LOTE</span>
          <span className="font-black tracking-wide truncate" style={{ fontSize: `${fs * 1.5}px` }}>NFe 148551</span>
        </div>
      )}
      <div className="flex flex-[1.3]">
        {has('qtd') && (
          <div className="w-[28%] border-r-2 border-black p-2 flex items-center gap-1.5 overflow-hidden">
            <div style={{ fontSize: `${fs * 0.85}px` }} className="font-bold shrink-0">QTD:</div>
            <div className="font-black leading-none truncate" style={{ fontSize: `${fs * 1.7}px` }}>1,00 M</div>
          </div>
        )}
        <div className="flex-1 border-r-2 border-black p-2 flex flex-col justify-around overflow-hidden">
          {has('rnp') && (
            <div style={{ fontSize: `${fs * 1.05}px` }} className="truncate">
              <span className="font-bold">RNP: </span>
              <span className="font-black">G4.C10.C10</span>
              <span className="ml-2">23/09/22</span>
            </div>
          )}
          {has('data') && (
            <div style={{ fontSize: `${fs * 1.05}px` }} className="truncate">
              <span className="font-bold">DATA:</span> 29/05/2026
            </div>
          )}
          {has('somfy') && (
            <div className="text-center opacity-60 italic truncate" style={{ fontSize: `${fs * 0.7}px` }}>
              HOME MOTION BY <span className="font-black not-italic">somfy.</span>
            </div>
          )}
        </div>
        {has('qr_lote') && (
          <div className="w-[22%] flex flex-col items-center justify-center p-1">
            <QRCodeSVG value="LOTE-NFe-148551" size={hPx * 0.26} level="M" />
            <div className="font-bold mt-0.5" style={{ fontSize: `${fs * 0.8}px` }}>Lote</div>
          </div>
        )}
      </div>
    </div>
  );
}

function MotorPreview({ wPx, hPx, fs, has }: { wPx: number; hPx: number; fs: number; has: (id: string) => boolean }) {
  return (
    <div style={{ width: `${wPx}px`, height: `${hPx}px`, fontSize: `${fs}px` }}
      className="bg-white text-black shadow-2xl border border-black/80 flex flex-col font-mono p-1 gap-1">
      <div className="border border-black p-1 flex flex-col overflow-hidden">
        {has('sku') && (
          <div className="font-black tracking-tight leading-none text-center truncate" style={{ fontSize: `${fs * 1.7}px` }}>
            002.001.002.000.83.4
          </div>
        )}
        {has('descricao') && (
          <div className="mt-1 leading-tight text-center line-clamp-2 overflow-hidden" style={{ fontSize: `${fs * 1.05}px` }}>
            Motor LSN 40 220v RTS (1245968)<br />
            6N/33rpm ( (t.v.) (A) PCT1 RR)
          </div>
        )}
      </div>

      <div className="border border-black p-1 flex flex-col gap-0.5 overflow-hidden">
        {has('serie') && (
          <span className="bg-black text-white font-bold px-1.5 py-0.5 w-fit shrink-0" style={{ fontSize: `${fs * 0.8}px` }}>
            SERIE
          </span>
        )}
        <div className="flex items-center gap-2 font-black tracking-wide truncate" style={{ fontSize: `${fs * 1.3}px` }}>
          {has('cx') && <span className="shrink-0">CX01</span>}
          {has('nf') && <span className="truncate">NF&nbsp;&nbsp;148362</span>}
        </div>
        {has('nt') && (
          <div className="font-black tracking-tight truncate" style={{ fontSize: `${fs * 1.2}px` }}>
            NT725284000424
          </div>
        )}
      </div>

      <div className="border border-black flex flex-1 overflow-hidden">
        <div className="flex-1 p-1 flex flex-col justify-center gap-1 border-r border-black overflow-hidden">
          {has('rnp') && (
            <div style={{ fontSize: `${fs * 1.05}px` }} className="truncate">
              <span className="font-bold">RNP: </span>
              <span className="font-black">G2.C01.A01/2 B01/2 -IS</span>
            </div>
          )}
          {has('data') && (
            <div style={{ fontSize: `${fs * 1.05}px` }} className="truncate">
              <span className="font-bold">DATA:</span> 21/05/2026
            </div>
          )}
        </div>
        {has('qr_lote_sku') && (
          <div className="w-[40%] flex flex-col items-center justify-center p-1">
            <QRCodeSVG value="LOTE-SKU-002001002000834-CX01-NF148362" size={Math.min(hPx * 0.35, wPx * 0.32)} level="M" />
            <div className="font-bold mt-0.5" style={{ fontSize: `${fs * 0.8}px` }}>Lote+SKU</div>
          </div>
        )}
      </div>
    </div>
  );
}