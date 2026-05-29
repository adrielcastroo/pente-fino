import { useAppStore } from '@/store/useAppStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { QrCode, Type, Maximize, Layout, Save, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';

const AVAILABLE_FIELDS = [
  { id: 'sku', label: 'SKU (Código)' },
  { id: 'descricao', label: 'Descrição do Item' },
  { id: 'nfe', label: 'NFe / Lote' },
  { id: 'qtd', label: 'Quantidade (QTD)' },
  { id: 'rnp', label: 'RNP (Endereço)' },
  { id: 'data', label: 'Data' },
  { id: 'qr_sku', label: 'QR Code SKU' },
  { id: 'qr_lote', label: 'QR Code Lote' },
  { id: 'somfy', label: 'Marca Somfy (rodapé)' },
];

const DEFAULT_FIELDS = ['sku', 'descricao', 'nfe', 'qtd', 'rnp', 'data', 'qr_sku', 'qr_lote', 'somfy'];

export default function LabelLayoutPanel() {
  const { labelSettings, setLabelSettings } = useAppStore();

  const handleToggleField = (fieldId: string) => {
    const currentFields = [...labelSettings.fields];
    if (currentFields.includes(fieldId)) {
      setLabelSettings({ fields: currentFields.filter(f => f !== fieldId) });
    } else {
      setLabelSettings({ fields: [...currentFields, fieldId] });
    }
  };

  const handleReset = () => {
    setLabelSettings({
      width: 100,
      height: 60,
      fields: DEFAULT_FIELDS,
      fontSize: 10,
      showLogo: true,
      showQRCode: true,
      orientation: 'landscape'
    });
    toast.info('Layout redefinido para o padrão Somfy.');
  };

  const handleSave = () => {
    toast.success('Configurações de etiqueta salvas!');
  };

  const has = (id: string) => labelSettings.fields.includes(id);

  // Dimensões visuais (mm -> px aproximado para preview)
  const scale = 3.2;
  const wPx = (labelSettings.orientation === 'landscape' ? labelSettings.width : labelSettings.height) * scale;
  const hPx = (labelSettings.orientation === 'landscape' ? labelSettings.height : labelSettings.width) * scale;
  const fs = labelSettings.fontSize;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* COLUNA CONFIGURAÇÕES */}
        <div className="space-y-6">
          <Card className="border-border/30 bg-background/50">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Maximize className="w-4 h-4 text-primary" />
                <CardTitle className="text-sm font-black uppercase tracking-wider">Dimensões (mm)</CardTitle>
              </div>
              <CardDescription>Padrão Somfy: 100mm × 60mm (paisagem).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="label-width" className="text-xs font-bold">Largura</Label>
                  <Input id="label-width" type="number" value={labelSettings.width}
                    onChange={(e) => setLabelSettings({ width: Number(e.target.value) })} className="h-9" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="label-height" className="text-xs font-bold">Altura</Label>
                  <Input id="label-height" type="number" value={labelSettings.height}
                    onChange={(e) => setLabelSettings({ height: Number(e.target.value) })} className="h-9" />
                </div>
              </div>
              <div className="space-y-2 pt-2">
                <Label className="text-xs font-bold">Orientação</Label>
                <div className="flex gap-2">
                  <Button variant={labelSettings.orientation === 'landscape' ? 'default' : 'outline'} size="sm"
                    className="flex-1 font-bold text-xs"
                    onClick={() => setLabelSettings({ orientation: 'landscape' })}>Paisagem</Button>
                  <Button variant={labelSettings.orientation === 'portrait' ? 'default' : 'outline'} size="sm"
                    className="flex-1 font-bold text-xs"
                    onClick={() => setLabelSettings({ orientation: 'portrait' })}>Retrato</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/30 bg-background/50">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Layout className="w-4 h-4 text-primary" />
                <CardTitle className="text-sm font-black uppercase tracking-wider">Conteúdo da Etiqueta</CardTitle>
              </div>
              <CardDescription>Habilite ou desabilite blocos da etiqueta.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                {AVAILABLE_FIELDS.map((field) => (
                  <div key={field.id} className="flex items-center justify-between gap-2">
                    <Label htmlFor={`field-${field.id}`} className="text-xs font-medium cursor-pointer">
                      {field.label}
                    </Label>
                    <Switch id={`field-${field.id}`}
                      checked={labelSettings.fields.includes(field.id)}
                      onCheckedChange={() => handleToggleField(field.id)} />
                  </div>
                ))}
              </div>
              <Separator className="my-2" />
              <div className="space-y-2 pt-1">
                <Label htmlFor="font-size" className="text-xs font-bold flex items-center gap-2">
                  <Type className="w-3.5 h-3.5" /> Tamanho Base da Fonte (pt)
                </Label>
                <Input id="font-size" type="number" value={labelSettings.fontSize}
                  onChange={(e) => setLabelSettings({ fontSize: Number(e.target.value) })}
                  className="h-9 w-24" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* COLUNA PRÉ-VISUALIZAÇÃO */}
        <div className="space-y-4">
          <Label className="text-xs font-black uppercase tracking-widest opacity-60">
            Pré-visualização (modelo Somfy)
          </Label>
          <div className="flex items-center justify-center p-6 bg-muted/20 rounded-3xl border-2 border-dashed border-border/30 min-h-[380px] overflow-auto">
            <div
              style={{ width: `${wPx}px`, height: `${hPx}px`, fontSize: `${fs}px` }}
              className="bg-white text-black shadow-2xl border border-black/80 flex flex-col font-mono"
            >
              {/* BLOCO SUPERIOR: SKU + DESCRIÇÃO + QR SKU */}
              <div className="flex border-b-2 border-black flex-[1.1]">
                <div className="flex-1 p-2 flex flex-col justify-start overflow-hidden border-r-2 border-black">
                  {has('sku') && (
                    <div className="font-black tracking-tight leading-none" style={{ fontSize: `${fs * 1.8}px` }}>
                      002.001.002.000.323
                    </div>
                  )}
                  {has('descricao') && (
                    <div className="mt-1 leading-tight" style={{ fontSize: `${fs * 0.95}px` }}>
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

              {/* BLOCO MEIO: LOTE / NFe */}
              {has('nfe') && (
                <div className="border-b-2 border-black px-2 py-1 flex items-center gap-2 flex-[0.6]">
                  <span className="bg-black text-white font-bold px-1.5 py-0.5" style={{ fontSize: `${fs * 0.75}px` }}>
                    LOTE
                  </span>
                  <span className="font-black tracking-wide" style={{ fontSize: `${fs * 1.5}px` }}>
                    NFe 148551
                  </span>
                </div>
              )}

              {/* BLOCO INFERIOR: QTD | RNP+DATA | QR LOTE */}
              <div className="flex flex-[1.3]">
                {has('qtd') && (
                  <div className="w-[22%] border-r-2 border-black p-2 flex flex-col justify-center">
                    <div style={{ fontSize: `${fs * 0.85}px` }} className="font-bold">QTD:</div>
                    <div className="font-black leading-none" style={{ fontSize: `${fs * 1.8}px` }}>
                      1,00 PÇ
                    </div>
                  </div>
                )}
                <div className="flex-1 border-r-2 border-black p-2 flex flex-col justify-around">
                  {has('rnp') && (
                    <div style={{ fontSize: `${fs * 1.05}px` }}>
                      <span className="font-bold">RNP: </span>
                      <span className="font-black">G4.C10.C10</span>
                      <span className="ml-2">23/09/22</span>
                    </div>
                  )}
                  {has('data') && (
                    <div style={{ fontSize: `${fs * 1.05}px` }}>
                      <span className="font-bold">DATA:</span> 29/05/2026
                    </div>
                  )}
                  {has('somfy') && (
                    <div className="text-center opacity-60 italic" style={{ fontSize: `${fs * 0.7}px` }}>
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
          </div>

          <div className="flex items-center gap-2 p-3 rounded-2xl bg-primary/5 border border-primary/10">
            <Layout className="w-4 h-4 text-primary shrink-0" />
            <p className="text-[10px] leading-tight text-primary/80 font-medium">
              Layout fiel ao modelo Somfy: SKU + descrição, NFe/Lote, QTD, RNP (endereço), Data e dois QR Codes (SKU e Lote).
              Os valores exibidos são exemplos — na impressão real serão substituídos pelos dados do registro.
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
    </div>
  );
}
